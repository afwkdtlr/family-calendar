import { useEffect, useState } from "react";
import { disablePush, enablePush, pushEnabled, pushSupported } from "../lib/push.js";
import { useLockBody } from "../hooks/useLockBody.js";

export function Sidebar({
  open,
  onClose,
  user,
  token,
  onLogout,
  families,
  hiddenHouses,
  onToggleHouse,
}) {
  useLockBody(open);
  const houses = (families || []).filter((family) => !family.isClan);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHint, setPushHint] = useState("");
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    if (!open || !pushSupported()) {
      return;
    }
    pushEnabled().then(setPushOn).catch(() => setPushOn(false));
  }, [open]);

  return (
    <>
      {open && (
        <button className="sidebar-overlay" aria-label="메뉴 닫기" onClick={onClose} />
      )}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-top">
          <h2>행복한 창녕조씨</h2>
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <p className="muted">{user?.name}님, 우리가족 일정을 같이 봐요.</p>

        <div className="section-title">등록자</div>
        {houses.length === 0 && <p className="muted">아직 소가족이 없습니다.</p>}
        {houses.map((family) => {
          const hidden = hiddenHouses.includes(family.id);
          return (
            <button
              key={family.id}
              className="calendar-row as-button"
              onClick={() => onToggleHouse(family.id)}
            >
              <div className="dot-name">
                <span className="orange-dot" style={{ background: family.color }} />
                {family.name}
              </div>
              <span className="showing">{hidden ? "숨김" : "표시 중"}</span>
            </button>
          );
        })}

        {pushSupported() && (
          <div className="push-row">
            <button
              className={`push-icon-btn${pushOn ? " is-active" : ""}`}
              type="button"
              disabled={pushBusy}
              aria-label="알림 켜기"
              aria-pressed={pushOn}
              onClick={async () => {
                setPushBusy(true);
                setPushHint("");
                try {
                  await enablePush(token);
                  setPushOn(true);
                  setPushHint("알림을 켰습니다.");
                } catch (error) {
                  setPushHint(error.message);
                } finally {
                  setPushBusy(false);
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22Zm8-6.2V11a8 8 0 1 0-16 0v4.8L2 17.8V19h20v-1.2l-2-2Z" />
              </svg>
            </button>
            <button
              className={`push-icon-btn is-off${!pushOn ? " is-active" : ""}`}
              type="button"
              disabled={pushBusy}
              aria-label="알림 끄기"
              aria-pressed={!pushOn}
              onClick={async () => {
                setPushBusy(true);
                setPushHint("");
                try {
                  await disablePush(token);
                  setPushOn(false);
                  setPushHint("알림을 껐습니다.");
                } catch (error) {
                  setPushHint(error.message);
                } finally {
                  setPushBusy(false);
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22Zm8-6.2V11a8 8 0 1 0-16 0v4.8L2 17.8V19h20v-1.2l-2-2Z" />
                <path className="slash" d="M5 4.5 19.5 19.5" />
              </svg>
            </button>
            {pushHint && <p className="muted">{pushHint}</p>}
          </div>
        )}
        <button className="ghost-btn share-btn" onClick={onLogout}>
          로그아웃
        </button>
      </aside>
    </>
  );
}
