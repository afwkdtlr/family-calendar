import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({ name, loginId, password });
      navigate("/pending", { state: { justRegistered: true, loginId } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <h1>회원가입</h1>
          <p>가입 후 관리자 승인이 완료되면 캘린더를 볼 수 있어요.</p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <label className="field-label">
            이름
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름"
              required
            />
          </label>
          <label className="field-label">
            아이디
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="영문, 숫자"
              autoComplete="username"
              required
              minLength={2}
              maxLength={20}
            />
          </label>
          <label className="field-label">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6자 안, 대소문자 구분 없음"
              autoComplete="new-password"
              required
              maxLength={6}
            />
          </label>
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "가입 중..." : "가입 신청"}
          </button>
        </form>
        <p className="auth-footer">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}
