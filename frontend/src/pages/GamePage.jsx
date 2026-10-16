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
          {user?.name ? `${user.name} 님, 컴퓨터와 두거나 가족과 같이 둘 수 있어요.` : "컴퓨터와 두거나 가족과 같이 둘 수 있어요."}
        </p>
        <Link className="game-pick" to="/game/omok?mode=cpu">
          <span className="game-pick-tag">혼자 하기</span>
          <h2>컴퓨터와 오목</h2>
        </Link>
        <Link className="game-pick" to="/game/omok?mode=pvp">
          <span className="game-pick-tag live">같이 하기</span>
          <h2>둘이 오목</h2>
        </Link>
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => navigate("/calendar")} />
    </div>
  );
}
