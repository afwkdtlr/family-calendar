import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function PendingPage() {
  const { pendingUser, logout } = useAuth();
  const location = useLocation();
  const loginId = location.state?.loginId || pendingUser?.loginId;

  return (
    <main className="pending-page">
      <section className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1>관리자 승인 대기 중입니다</h1>
        <p className="muted">
          {loginId ? `${loginId} 계정은 ` : "가입 신청이 "}
          관리자 확인 후 캘린더에 입장할 수 있습니다.
        </p>
        <p className="auth-hint" style={{ marginTop: 12 }}>
          승인이 끝나면 다시 로그인해 주세요.
        </p>
        <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
          <Link className="primary-btn" to="/login" onClick={logout} style={{ textAlign: "center" }}>
            로그인으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
