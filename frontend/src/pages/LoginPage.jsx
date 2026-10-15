import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const REMEMBER_KEY = "family-calendar-remember";

function loadRemembered() {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || "null");
    if (!saved?.loginId) {
      return { remember: false, loginId: "", password: "" };
    }
    return {
      remember: true,
      loginId: saved.loginId || "",
      password: saved.password || "",
    };
  } catch {
    return { remember: false, loginId: "", password: "" };
  }
}

function saveRemembered(loginId, password) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ loginId, password }));
}

function clearRemembered() {
  localStorage.removeItem(REMEMBER_KEY);
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [saved] = useState(loadRemembered);
  const [loginId, setLoginId] = useState(saved.loginId);
  const [password, setPassword] = useState(saved.password);
  const [remember, setRemember] = useState(saved.remember);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleRemember(checked) {
    setRemember(checked);
    if (checked && loginId) {
      saveRemembered(loginId, password);
      return;
    }
    clearRemembered();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (remember) {
        saveRemembered(loginId, password);
      } else {
        clearRemembered();
      }
      const result = await login(loginId, password);
      if (result.pending) {
        navigate("/pending");
        return;
      }
      navigate("/calendar");
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
          <h1>행복한 창녕조씨</h1>
          <p>가족과 일정을 차분하게 나눠 보는 공간</p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <label className="field-label">
            아이디
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="아이디"
              autoComplete="username"
              required
            />
          </label>
          <label className="field-label">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
              maxLength={6}
            />
          </label>
          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => toggleRemember(event.target.checked)}
            />
            아이디 · 비밀번호 기억하기
          </label>
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
        <p className="auth-footer">
          아직 계정이 없나요? <Link to="/register">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
