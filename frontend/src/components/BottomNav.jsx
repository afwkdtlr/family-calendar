import { NavLink } from "react-router-dom";

export function BottomNav({ isAdmin, onAdd }) {
  return (
    <nav className={`bottom-nav${isAdmin ? " with-admin" : ""}`}>
      <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <span className="nav-icon">📅</span>
        캘린더
      </NavLink>
      <NavLink to="/game" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <span className="nav-icon">🎮</span>
        게임
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">👤</span>
          관리
        </NavLink>
      )}
      <button type="button" className="nav-item as-button" onClick={onAdd}>
        <span className="nav-icon">＋</span>
        추가
      </button>
    </nav>
  );
}
