import { formatAgendaTitle, holidayName } from "../constants.js";

export function AgendaPane({ date, events, onAddEvent, onSelectEvent }) {
  if (!date) {
    return (
      <section className="agenda-pane">
        <p className="empty-state">날짜를 선택하면 일정이 나타납니다.</p>
      </section>
    );
  }

  const holiday = holidayName(date);
  const count = events.length;

  return (
    <section className="agenda-pane">
      <div className="agenda-head">
        <h2>
          {formatAgendaTitle(date)}
          {holiday && <span className="holiday-tag">{holiday}</span>}
        </h2>
        <span className="muted">일정 {count}개</span>
      </div>

      {count === 0 ? (
        <p className="empty-state">이 날에는 아직 일정이 없습니다.</p>
      ) : (
        <div className="day-event-list">
          {events.map((event) => (
            <button
              key={`e-${event.id}`}
              className={`day-event${event.isFamilyEvent ? " is-family" : ""}`}
              style={{ background: `color-mix(in srgb, ${event.color} 22%, #fff)` }}
              onClick={() => onSelectEvent(event)}
            >
              <span className="agenda-bar" style={{ background: event.color }} />
              <span className="day-event-body">
                <strong>
                  {event.title}
                  {event.isFamilyEvent && <span className="family-event-tag">중요일정</span>}
                </strong>
                <p className="muted">
                  <b className="chip-house" style={{ color: event.familyColor || "inherit" }}>
                    {event.familyName || "우리가족"}
                  </b>
                  {" · "}
                  {event.endDate && event.endDate !== event.eventDate
                    ? `${event.eventDate.replaceAll("-", ".")} ~ ${event.endDate.replaceAll("-", ".")}`
                    : event.startTime
                      ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
                      : "하루 종일"}
                </p>
                {event.hasAttendees && event.attendees?.length > 0 && (
                  <p className="day-attendees">
                    {event.attendees.map((person) => (
                      <span key={person.id} className="day-attendee">{person.name}</span>
                    ))}
                  </p>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="modal-actions agenda-actions">
        <button className="primary-btn" onClick={onAddEvent}>
          일정 추가
        </button>
      </div>
    </section>
  );
}
