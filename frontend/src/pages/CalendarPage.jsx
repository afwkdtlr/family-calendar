import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { AgendaPane } from "../components/AgendaPane.jsx";
import { BottomNav } from "../components/BottomNav.jsx";
import { CalendarGrid } from "../components/CalendarGrid.jsx";
import { EventModal } from "../components/EventModal.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import {
  applyVisibilityFilter,
  buildMonthRange,
  groupEventsByDate,
  parseDateKey,
  toDateKey,
} from "../constants.js";
import { useAlert } from "../context/AlertContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
export function CalendarPage() {
  const { user, token, isAdmin, isSuperAdmin, logout } = useAuth();
  const { confirm, toast } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [families, setFamilies] = useState([]);
  const [people, setPeople] = useState([]);
  const [hiddenHouses, setHiddenHouses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [compact, setCompact] = useState(false);
  const dragRef = useRef(null);
  const dragMoved = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const range = useMemo(
    () => buildMonthRange(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  async function loadData() {
    const [eventData, peopleData] = await Promise.all([
      apiRequest(`/events?from=${range.from}&to=${range.to}`, { token }),
      apiRequest("/events/people", { token }),
    ]);
    setEvents(eventData.events || []);
    setFamilies(eventData.families || []);
    setPeople(peopleData.people || []);
  }

  useEffect(() => {
    loadData().catch((error) => {
      console.error(error);
    });
  }, [token, range.from, range.to]);

  useEffect(() => {
    const node = dragRef.current;
    if (!node) {
      return undefined;
    }

    let startX = 0;
    let startY = 0;
    let axis = "";

    function shiftMonth(delta) {
      setCursor((prev) => {
        const next = new Date(prev.year, prev.month + delta, 1);
        return { year: next.getFullYear(), month: next.getMonth() };
      });
    }

    function onStart(event) {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      axis = "";
      dragMoved.current = false;
      setSwipeX(0);
    }

    function onMove(event) {
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      if (!axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        dragMoved.current = true;
      }
      if (axis === "x") {
        event.preventDefault();
        setSwipeX(dx);
        return;
      }
      if (axis === "y" && dy > 8) {
        event.preventDefault();
      }
    }

    function onEnd(event) {
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (axis === "x") {
        if (dx < -56) {
          shiftMonth(1);
        } else if (dx > 56) {
          shiftMonth(-1);
        }
        setSwipeX(0);
        return;
      }
      if (dy > 48) {
        setCompact(false);
      } else if (dy < -48) {
        setCompact(true);
      }
    }

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
    };
  }, [compact]);

  useEffect(() => {
    const date = searchParams.get("date");
    if (!date) {
      return;
    }
    const parsed = parseDateKey(date);
    setSelectedDate(date);
    setCompact(true);
    setCursor({ year: parsed.getFullYear(), month: parsed.getMonth() });
    setSearchParams({}, { replace: true });
  }, [searchParams]);

  const visibleEvents = useMemo(
    () => applyVisibilityFilter(events, hiddenHouses),
    [events, hiddenHouses]
  );

  function canChangeEvent(event) {
    if (!event) {
      return true;
    }
    if (isSuperAdmin || event.createdBy === user?.id) {
      return true;
    }
    return Boolean(
      user?.isFamilyAdmin && user.familyId && Number(event.familyId) === Number(user.familyId)
    );
  }

  const eventsByDate = useMemo(() => groupEventsByDate(visibleEvents), [visibleEvents]);

  function move(delta) {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  function openCreateEvent(dateKey) {
    setEditingEvent(null);
    setSelectedDate(dateKey);
    setModalError("");
    setEventModalOpen(true);
  }

  function openEditEvent(event) {
    if (dragMoved.current) {
      return;
    }
    setEditingEvent(event);
    setSelectedDate(event.eventDate);
    setModalError("");
    setEventModalOpen(true);
  }

  async function saveEvent(form) {
    setSubmitting(true);
    setModalError("");
    try {
      if (editingEvent) {
        await apiRequest(`/events/${editingEvent.id}`, { method: "PATCH", token, body: form });
      } else {
        await apiRequest("/events", { method: "POST", token, body: form });
      }
      setEventModalOpen(false);
      await loadData();
    } catch (error) {
      setModalError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id) {
    const ok = await confirm({
      title: "일정을 삭제할까요?",
      message: "삭제한 일정은 다시 되돌릴 수 없어요.",
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/events/${id}`, { method: "DELETE", token });
      setEventModalOpen(false);
      await loadData();
      toast("일정을 삭제했습니다.", "success");
    } catch (error) {
      setModalError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = `${cursor.year}년 ${cursor.month + 1}월`;
  const shortTitle = `${cursor.month + 1}월`;

  function selectDay(dateKey) {
    if (dragMoved.current) {
      return;
    }
    setSelectedDate(dateKey);
    setCompact(true);
  }

  return (
    <div className="app-shell calendar-shell">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        onLogout={logout}
        families={families}
        hiddenHouses={hiddenHouses}
        onToggleHouse={(id) =>
          setHiddenHouses((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
        }
      />
      <header className="app-header">
        <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="메뉴">
          ☰
        </button>
        <div className="month-nav">
          <button className="icon-btn" onClick={() => move(-1)} aria-label="이전">
            ‹
          </button>
          <span className="header-title">{shortTitle}</span>
          <span className="header-title full">{title}</span>
          <button className="icon-btn" onClick={() => move(1)} aria-label="다음">
            ›
          </button>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => openCreateEvent(toDateKey(new Date()))} aria-label="일정 추가">
            ＋
          </button>
        </div>
      </header>
      <main className={`calendar-page${compact ? " split compact-mode" : " split"}`}>
        <div className="calendar-block" ref={dragRef}>
          <div
            className={`calendar-swipe${swipeX ? " is-dragging" : ""}`}
            style={{ transform: swipeX ? `translateX(${swipeX}px)` : undefined }}
          >
          <CalendarGrid
            year={cursor.year}
            month={cursor.month}
            eventsByDate={eventsByDate}
            compact={compact}
            selectedDate={selectedDate}
            onDayClick={selectDay}
            onEventClick={openEditEvent}
          />
          </div>
          <button
            type="button"
            className="drag-handle"
            aria-label={compact ? "달력 펼치기" : "달력 접기"}
            onClick={() => setCompact((prev) => !prev)}
          />
        </div>
        {compact && (
          <AgendaPane
            date={selectedDate}
            events={selectedDate ? eventsByDate[selectedDate] || [] : []}
            onAddEvent={() => openCreateEvent(selectedDate)}
            onSelectEvent={openEditEvent}
          />
        )}
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => openCreateEvent(toDateKey(new Date()))} />
      <EventModal
        open={eventModalOpen}
        event={editingEvent}
        date={selectedDate}
        houseName={user?.familyName || "우리가족"}
        people={people}
        canEdit={canChangeEvent(editingEvent)}
        submitting={submitting}
        error={modalError}
        onClose={() => setEventModalOpen(false)}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
