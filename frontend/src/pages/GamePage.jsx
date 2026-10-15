import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function GamePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell calendar-shell game-shell">
      <header className="app-header">
        <div className="month-nav">
          <span className="header-title">게임</span>
          <span className="header-title full">가족 게임</span>
        </div>
      </header>
      <main className="game-page game-hub">
        <p className="muted game-hub-lead">
          {user?.familyName
            ? `${user.familyName} 식구와 오목을 둘 수 있어요.`
            : "컴퓨터와 두거나, 가족이 배정되면 둘이 둘 수 있어요."}
        </p>
        <Link className="game-pick" to="/game/omok?mode=cpu">
          <span className="game-pick-tag">혼자 하기</span>
          <h2>컴퓨터와 오목</h2>
          <p className="muted">내가 흑, 컴퓨터가 백입니다. 다섯 알을 이으면 이깁니다.</p>
        </Link>
        <Link className="game-pick" to="/game/omok?mode=pvp">
          <span className="game-pick-tag live">같이 하기</span>
          <h2>둘이 오목</h2>
          <p className="muted">같은 가족 두 명이 흑과 백으로 번갈아 둡니다.</p>
        </Link>
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => navigate("/calendar")} />
    </div>
  );
}
