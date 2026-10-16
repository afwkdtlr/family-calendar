import { useEffect, useState } from "react";
import { DatePickerSheet, TimePickerSheet, formatShortDate } from "./DateTimePickers.jsx";
import { EVENT_COLORS } from "../constants.js";
import { useLockBody } from "../hooks/useLockBody.js";

const EMPTY = {
  title: "",
  description: "",
  eventDate: "",
  endDate: "",
  startTime: "09:00",
  endTime: "18:00",
  color: EVENT_COLORS[0].id,
  familyId: "",
  isFamilyEvent: false,
  hasAttendees: false,
  attendeeIds: [],
};

export function EventModal({
  open,
  event,
  date,
  houseName = "우리가족",
  people = [],
  canEdit,
  submitting,
  error,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(EMPTY);
  const [picker, setPicker] = useState(null);
  useLockBody(open);

  useEffect(() => {
    if (!open) {
      setPicker(null);
      return;
    }

    if (event) {
      setForm({
        title: event.title,
        description: event.description || "",
        eventDate: event.eventDate,
        endDate: event.endDate || event.eventDate,
        startTime: event.startTime || "09:00",
        endTime: event.endTime || "18:00",
        color: event.color,
        familyId: event.familyId ? String(event.familyId) : "",
        isFamilyEvent: Boolean(event.isFamilyEvent),
        hasAttendees: Boolean(event.hasAttendees),
        attendeeIds: event.attendeeIds || [],
      });
      return;
    }

    setForm({
      ...EMPTY,
      eventDate: date || "",
      endDate: date || "",
      startTime: "09:00",
      endTime: "18:00",
    });
  }, [open, event, date]);

  if (!open) {
    return null;
  }

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "eventDate" && (!next.endDate || next.endDate < value)) {
        next.endDate = value;
      }
      if (field === "endDate" && next.eventDate && value < next.eventDate) {
        next.eventDate = value;
      }
      return next;
    });
  }

  const allAttending = people.length > 0 && people.every((person) => form.attendeeIds.includes(person.id));

  function toggleAllAttendees(checked) {
    update("attendeeIds", checked ? people.map((person) => person.id) : []);
  }

  function toggleAttendee(personId, checked) {
    setForm((prev) => {
      const nextIds = new Set(prev.attendeeIds);
      if (checked) {
        nextIds.add(personId);
      } else {
        nextIds.delete(personId);
      }
      return { ...prev, attendeeIds: [...nextIds] };
    });
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    onSave(form);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="modal-card" onClick={(clickEvent) => clickEvent.stopPropagation()}>
        <div className="modal-head">
          <h2>{event ? "일정 수정" : "일정 추가"}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <label className="field-label">
            제목
            <input
              value={form.title}
              onChange={(changeEvent) => update("title", changeEvent.target.value)}
              placeholder="가족 일정"
              required
              disabled={!canEdit}
            />
          </label>
          <div className="field-split">
            <div className="field-label">
              등록자
              <div className="family-chip is-active is-locked">
                <span className="family-chip-copy">
                  <strong>{event?.familyName || houseName}</strong>
                </span>
              </div>
            </div>
            <label className="field-label">
              <span className="split-caption">참석자</span>
              <span className={`family-chip family-check${form.hasAttendees ? " is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.hasAttendees}
                  onChange={(changeEvent) => update("hasAttendees", changeEvent.target.checked)}
                  disabled={!canEdit}
                />
              </span>
            </label>
            <label className="field-label">
              <span className="split-caption">중요일정</span>
              <span className={`family-chip family-check${form.isFamilyEvent ? " is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.isFamilyEvent}
                  onChange={(changeEvent) => update("isFamilyEvent", changeEvent.target.checked)}
                  disabled={!canEdit}
                />
              </span>
            </label>
          </div>
          {form.hasAttendees && (
            <div className="field-label">
              참석자
              <div className="attendee-list">
                <label className={`attendee-check is-all${allAttending ? " is-active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={allAttending}
                    onChange={(changeEvent) => toggleAllAttendees(changeEvent.target.checked)}
                    disabled={!canEdit || people.length === 0}
                  />
                  모두참석
                </label>
                {people.map((person) => {
                  const checked = form.attendeeIds.includes(person.id);
                  return (
                    <label key={person.id} className={`attendee-check${checked ? " is-active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(changeEvent) => toggleAttendee(person.id, changeEvent.target.checked)}
                        disabled={!canEdit}
                      />
                      {person.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="field-label">
            날짜
            <div className="picker-field-row">
              <button
                type="button"
                className="picker-field"
                disabled={!canEdit}
                onClick={() => setPicker({ kind: "date", field: "eventDate" })}
              >
                <span className="picker-field-icon">📅</span>
                {formatShortDate(form.eventDate)}
              </button>
              <button
                type="button"
                className="picker-field"
                disabled={!canEdit}
                onClick={() => setPicker({ kind: "date", field: "endDate" })}
              >
                <span className="picker-field-icon">📅</span>
                {formatShortDate(form.endDate)}
              </button>
            </div>
          </div>
          <div className="field-label">
            시간
            <div className="picker-field-row">
              <button
                type="button"
                className="picker-field"
                disabled={!canEdit}
                onClick={() => setPicker({ kind: "time", field: "startTime" })}
              >
                <span className="picker-field-icon">🕐</span>
                {form.startTime || "09:00"}
              </button>
              <button
                type="button"
                className="picker-field"
                disabled={!canEdit}
                onClick={() => setPicker({ kind: "time", field: "endTime" })}
              >
                <span className="picker-field-icon">🕐</span>
                {form.endTime || "18:00"}
              </button>
            </div>
          </div>
          <label className="field-label">
            메모
            <textarea
              rows="3"
              value={form.description}
              onChange={(changeEvent) => update("description", changeEvent.target.value)}
              placeholder="장소나 준비물을 적어 주세요"
              disabled={!canEdit}
            />
          </label>
          <div className="field-label">
            색상
            <div className="color-row">
              {EVENT_COLORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`color-dot${form.color === item.id ? " selected" : ""}`}
                  style={{ background: item.id }}
                  onClick={() => update("color", item.id)}
                  aria-label={item.label}
                  disabled={!canEdit}
                />
              ))}
            </div>
          </div>
          {canEdit && (
            <div className="modal-actions">
              {event && (
                <button type="button" className="ghost-btn danger-btn" onClick={() => onDelete(event.id)}>
                  삭제
                </button>
              )}
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          )}
        </form>
      </section>
      {picker?.kind === "date" && (
        <DatePickerSheet
          value={form[picker.field]}
          onSelect={(next) => {
            update(picker.field, next);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker?.kind === "time" && (
        <TimePickerSheet
          value={form[picker.field]}
          onSelect={(next) => {
            update(picker.field, next);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
