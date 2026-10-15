import { holidayName, toDateKey } from "../constants.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildCells(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function dotsForDay(events) {
  const dots = [];
  for (const event of events) {
    const key = `${event.color}-${event.isFamilyEvent ? 1 : 0}`;
    if (!dots.some((dot) => dot.key === key)) {
      dots.push({ key, color: event.color, family: Boolean(event.isFamilyEvent) });
    }
  }
  return dots.slice(0, 4);
}

export function CalendarGrid({
  year,
  month,
  eventsByDate,
  compact,
  selectedDate,
  onDayClick,
  onEventClick,
}) {
  const today = new Date();
  const cells = buildCells(year, month);

  return (
    <section className={`calendar-fill${compact ? " is-compact" : " is-expanded"}`}>
      <div className="weekday-row">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={`calendar-grid${compact ? " compact" : " expanded"}`}>
        {cells.map((date) => {
          const key = toDateKey(date);
          const outside = date.getMonth() !== month;
          const isToday = toDateKey(today) === key;
          const selected = selectedDate === key;
          const events = eventsByDate[key] || [];
          const holiday = holidayName(key);
          const extraSlots = holiday ? 1 : 0;
          const previewLimit = 5 - extraSlots;
          const preview = events.slice(0, previewLimit);
          const hiddenCount = events.length - preview.length;
          const dots = dotsForDay(events);
          const weekday = date.getDay();

          return (
            <button
              key={key}
              type="button"
              className={`calendar-cell${outside ? " outside" : ""}${isToday ? " today" : ""}${selected ? " selected" : ""}${weekday === 0 ? " sunday" : ""}${weekday === 6 ? " saturday" : ""}${holiday ? " holiday" : ""}`}
              onClick={() => onDayClick(key)}
            >
              <div className="date-badge">{date.getDate()}</div>
              {compact ? (
                <div className="dot-row">
                  {dots.map((dot) => (
                    <span
                      key={dot.key}
                      className={`event-dot${dot.family ? " is-family" : ""}`}
                      style={{ background: dot.color }}
                    />
                  ))}
                </div>
              ) : (
                <div className="event-list">
                  {holiday ? <span className="event-item chip holiday-chip">{holiday}</span> : null}
                  {preview.map((event) => (
                    <span
                      key={`e-${event.id}`}
                      className={`event-item chip${event.isFamilyEvent ? " is-family" : ""}`}
                      style={{ "--chip-color": event.familyColor || event.color }}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {event.title}
                    </span>
                  ))}
                  {hiddenCount > 0 && <span className="event-item more">+{hiddenCount}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
