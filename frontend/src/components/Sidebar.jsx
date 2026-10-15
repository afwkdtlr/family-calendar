import { useLockBody } from "../hooks/useLockBody.js";

export function Sidebar({
  open,
  onClose,
  user,
  onLogout,
  families,
  hiddenHouses,
  onToggleHouse,
}) {
  useLockBody(open);
  const houses = (families || []).filter((family) => !family.isClan);

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

        <button className="ghost-btn share-btn" onClick={onLogout}>
          로그아웃
        </button>
      </aside>
    </>
  );
}
