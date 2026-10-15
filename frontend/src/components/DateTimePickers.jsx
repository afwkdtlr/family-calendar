import { useState } from "react";
import { parseDateKey, toDateKey } from "../constants.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = ["00", "10", "20", "30", "40", "50"];

function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function formatShortDate(dateKey) {
  if (!dateKey) {
    return "날짜 선택";
  }
  const date = parseDateKey(dateKey);
  const weekday = WEEKDAYS[date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export function DatePickerSheet({ value, onSelect, onClose }) {
  const selected = value ? parseDateKey(value) : new Date();
  const [cursor, setCursor] = useState({
    year: selected.getFullYear(),
    month: selected.getMonth(),
  });
  const todayKey = toDateKey(new Date());

  function move(delta) {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div
      className="picker-overlay"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <section className="picker-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="picker-head">
          <button className="icon-btn" type="button" onClick={() => move(-1)} aria-label="이전 달">
            ‹
          </button>
          <strong>
            {cursor.year}년 {cursor.month + 1}월
          </strong>
          <button className="icon-btn" type="button" onClick={() => move(1)} aria-label="다음 달">
            ›
          </button>
        </div>
        <div className="picker-weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="picker-days">
          {monthCells(cursor.year, cursor.month).map((date) => {
            const key = toDateKey(date);
            const outside = date.getMonth() !== cursor.month;
            const isToday = key === todayKey;
            const isSelected = key === value;
            return (
              <button
                key={key}
                type="button"
                className={`picker-day${outside ? " is-outside" : ""}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
                onClick={() => onSelect(key)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function TimePickerSheet({ value, onSelect, onClose }) {
  const [hour, minute] = (value || "09:00").split(":");
  const [pickedHour, setPickedHour] = useState(hour || "09");
  const [pickedMinute, setPickedMinute] = useState(MINUTES.includes(minute) ? minute : "00");

  function confirm() {
    onSelect(`${pickedHour}:${pickedMinute}`);
  }

  return (
    <div
      className="picker-overlay"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <section className="picker-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="picker-head">
          <strong>시간 선택</strong>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="picker-clock">{pickedHour}:{pickedMinute}</p>
        <p className="picker-caption">시</p>
        <div className="picker-chips">
          {HOURS.map((item) => (
            <button
              key={item}
              type="button"
              className={`picker-chip${item === pickedHour ? " is-selected" : ""}`}
              onClick={() => setPickedHour(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="picker-caption">분</p>
        <div className="picker-chips is-minutes">
          {MINUTES.map((item) => (
            <button
              key={item}
              type="button"
              className={`picker-chip${item === pickedMinute ? " is-selected" : ""}`}
              onClick={() => setPickedMinute(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="primary-btn" type="button" onClick={confirm}>
          선택
        </button>
      </section>
    </div>
  );
}
