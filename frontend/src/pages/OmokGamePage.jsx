import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { BottomNav } from "../components/BottomNav.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STARS = new Set(["3,3", "3,7", "3,11", "7,3", "7,7", "7,11", "11,3", "11,7", "11,11"]);

function colorName(color) {
  return color === 1 ? "흑" : "백";
}

export function OmokGamePage() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "pvp" ? "pvp" : "cpu";
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function load() {
    if (busyRef.current) return;
    const data = await apiRequest(`/omok?mode=${mode}`, { token });
    setRoom(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    const timer = setInterval(() => {
      load().catch(() => {});
    }, 1200);
    return () => clearInterval(timer);
  }, [token, mode]);

  async function act(path, body) {
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest(path, { method: "POST", token, body });
      setRoom(data);
    } catch (err) {
      setError(err.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const game = room?.game;
  const line = new Set((game?.line || []).map((cell) => `${cell.x},${cell.y}`));
  const playPath = mode === "cpu" ? "/omok/cpu/act" : "/omok/act";

  return (
    <div className="app-shell calendar-shell game-shell">
      <header className="app-header">
        <div className="month-nav">
          <button className="icon-btn" type="button" onClick={() => navigate("/game")} aria-label="게임 목록">
            ‹
          </button>
          <span className="header-title">오목</span>
          <span className="header-title full">{mode === "cpu" ? "컴퓨터와 오목" : "같이 하는 오목"}</span>
        </div>
      </header>
      <main className="game-page omok-page">
        {error && <div className="error-banner">{error}</div>}
        {mode === "pvp" && !game && (
          <section className="omok-lobby">
            <h2>1번, 2번, 3번 방</h2>
            <p className="muted">두 명이 같은 방에 들어오면 바로 시작되고, 먼저 들어온 사람이 흑입니다.</p>
            {room?.notice && <p className="omok-notice">{room.notice}</p>}
            <div className="omok-rooms">
              {(room?.rooms || []).map((item) => (
                <article key={item.id} className={`omok-room${item.mine ? " is-mine" : ""}${item.status === "playing" ? " is-busy" : ""}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="muted">
                      {item.players.length === 0
                        ? "비어 있음"
                        : item.status === "playing"
                          ? `두는 중 · ${item.players.map((person) => person.name).join(", ")}`
                          : item.mine
                            ? "상대를 기다리는 중"
                            : `대기 · ${item.players.map((person) => person.name).join(", ")}`}
                    </p>
                  </div>
                  <div className="omok-actions">
                    {item.open && !room?.me && (
                      <button className="primary-btn omok-room-btn" type="button" disabled={busy} onClick={() => act("/omok/join", { roomId: item.id })}>
                        들어가기
                      </button>
                    )}
                    {item.open && room?.me && !item.mine && (
                      <button className="ghost-btn omok-room-btn" type="button" disabled={busy} onClick={() => act("/omok/join", { roomId: item.id })}>
                        이 방으로
                      </button>
                    )}
                    {item.mine && room?.host && item.players.length === 2 && (
                      <button className="primary-btn omok-room-btn" type="button" disabled={busy} onClick={() => act("/omok/start")}>
                        시작
                      </button>
                    )}
                    {item.mine && (
                      <button className="ghost-btn omok-room-btn" type="button" disabled={busy} onClick={() => act("/omok/leave")}>
                        나가기
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {mode === "cpu" && !game && (
          <section className="omok-lobby">
            <h2>컴퓨터와 한 판</h2>
            <p className="muted">내가 흑, 컴퓨터가 백입니다. 다섯 알을 먼저 이으면 이깁니다.</p>
            <button className="primary-btn" type="button" disabled={busy} onClick={() => act("/omok/cpu/start")}>
              시작
            </button>
          </section>
        )}
        {game && (
          <section className="omok-table">
            <div className="omok-status">
              <span className={`omok-turn stone-${game.turn === 1 ? "black" : "white"}`} />
              <span>
                {game.phase === "done"
                  ? game.result?.text
                  : `${colorName(game.turn)} 차례${game.myTurn ? " · 나" : ` · ${game.opp.name}`}`}
              </span>
              <span className="muted">
                나 {colorName(game.myColor)} · {game.opp.name} {colorName(game.opp.color)}
              </span>
            </div>
            <div className="omok-board" role="grid" aria-label="오목판">
              {game.board.map((stone, index) => {
                const x = index % game.size;
                const y = Math.floor(index / game.size);
                const key = `${x},${y}`;
                const canPlay = game.myTurn && !stone && !busy;
                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    className={`omok-cell${STARS.has(key) ? " is-star" : ""}${line.has(key) ? " is-win" : ""}${canPlay ? " can-play" : ""}`}
                    aria-label={`${y + 1}행 ${x + 1}열 ${stone === 1 ? "흑" : stone === 2 ? "백" : "빈 칸"}`}
                    disabled={!canPlay}
                    onClick={() => act(playPath, { x, y })}
                  >
                    {stone ? <span className={`omok-stone ${stone === 1 ? "black" : "white"}`} /> : null}
                    {game.last?.x === x && game.last?.y === y && <span className="omok-last" />}
                  </button>
                );
              })}
            </div>
            <div className="omok-actions">
              {mode === "cpu" && (
                <button className="ghost-btn" type="button" disabled={busy} onClick={() => act("/omok/cpu/start")}>
                  새 판
                </button>
              )}
              {mode === "pvp" && game.phase === "done" && room?.host && (
                <button className="primary-btn" type="button" disabled={busy} onClick={() => act("/omok/start")}>
                  다음 판
                </button>
              )}
              {mode === "pvp" && (
                <button className="ghost-btn" type="button" disabled={busy} onClick={() => act("/omok/leave")}>
                  나가기
                </button>
              )}
              {mode === "pvp" && game.phase === "play" && !game.myTurn && (
                <p className="muted">{game.opp.name} 차례입니다</p>
              )}
            </div>
          </section>
        )}
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => navigate("/calendar")} />
    </div>
  );
}
