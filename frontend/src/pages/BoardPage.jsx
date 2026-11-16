import { useEffect, useState } from "react";
import { useMatch, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { BottomNav } from "../components/BottomNav.jsx";
import { PullToRefresh } from "../components/PullToRefresh.jsx";
import { useAlert } from "../context/AlertContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function formatDay(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatWhen(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BoardPage() {
  const { postId } = useParams();
  const isWrite = Boolean(useMatch("/board/new"));
  const { token, isAdmin } = useAuth();
  const { confirm, toast } = useAlert();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");

  async function loadList(quiet = false) {
    if (!quiet) {
      setLoading(true);
    }
    setError("");
    try {
      const data = await apiRequest("/board", { token });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPost(quiet = false, countView = true) {
    if (!quiet) {
      setLoading(true);
    }
    setError("");
    try {
      const query = countView ? "" : "?view=0";
      const data = await apiRequest(`/board/${postId}${query}`, { token });
      setPost(data.post || null);
      setTitle(data.post?.title || "");
      setBody(data.post?.body || "");
    } catch (err) {
      setError(err.message);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEditing(false);
    setEditingCommentId(null);
    setCommentBody("");
    if (isWrite) {
      setTitle("");
      setBody("");
      setPost(null);
      setLoading(false);
      setError("");
      return;
    }
    if (postId) {
      loadPost();
      return;
    }
    setPost(null);
    loadList();
  }, [token, postId, isWrite]);

  async function submitPost(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await apiRequest("/board", {
        method: "POST",
        token,
        body: { title, body },
      });
      toast("글을 등록했습니다.", "success");
      navigate(`/board/${data.post.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function savePostEdit() {
    setSaving(true);
    try {
      const data = await apiRequest(`/board/${post.id}`, {
        method: "PATCH",
        token,
        body: { title, body },
      });
      setPost(data.post);
      setEditing(false);
      toast("글을 고쳤습니다.", "success");
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removePost() {
    const ok = await confirm({
      title: "이 글을 삭제할까요?",
      message: "댓글도 함께 지워집니다.",
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await apiRequest(`/board/${post.id}`, { method: "DELETE", token });
      toast("글을 삭제했습니다.", "success");
      navigate("/board");
    } catch (err) {
      toast(err.message);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    const text = commentBody.trim();
    if (!text) {
      toast("댓글을 입력해 주세요.");
      return;
    }
    try {
      await apiRequest(`/board/${post.id}/comments`, {
        method: "POST",
        token,
        body: { body: text },
      });
      setCommentBody("");
      await loadPost(true, false);
    } catch (err) {
      toast(err.message);
    }
  }

  async function saveCommentEdit(commentId) {
    try {
      await apiRequest(`/board/comments/${commentId}`, {
        method: "PATCH",
        token,
        body: { body: editingCommentBody },
      });
      setEditingCommentId(null);
      toast("댓글을 고쳤습니다.", "success");
      await loadPost(true, false);
    } catch (err) {
      toast(err.message);
    }
  }

  async function removeComment(commentId) {
    const ok = await confirm({
      title: "이 댓글을 삭제할까요?",
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await apiRequest(`/board/comments/${commentId}`, { method: "DELETE", token });
      toast("댓글을 삭제했습니다.", "success");
      await loadPost(true, false);
    } catch (err) {
      toast(err.message);
    }
  }

  const showBack = Boolean(isWrite || postId);

  return (
    <PullToRefresh
      className="app-shell calendar-shell game-shell"
      onRefresh={() => {
        if (isWrite) {
          return Promise.resolve();
        }
        return postId ? loadPost(true, false) : loadList(true);
      }}
      disabled={Boolean(isWrite || editing || editingCommentId)}
    >
      <header className="app-header">
        {showBack ? (
          <button className="icon-btn" type="button" onClick={() => navigate("/board")} aria-label="게시판 목록">
            ‹
          </button>
        ) : (
          <span className="icon-btn" aria-hidden="true" />
        )}
        <div className="month-nav">
          <span className="header-title">게시판</span>
          <span className="header-title full">자유게시판</span>
        </div>
        <div className="header-actions">
          {!isWrite && (
            <button className="today-btn" type="button" onClick={() => navigate("/board/new")}>
              글쓰기
            </button>
          )}
        </div>
      </header>
      <main className="game-page game-hub board-page">
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <p className="empty-state">목록을 불러오는 중...</p>
        ) : isWrite ? (
          <form className="board-composer" onSubmit={submitPost}>
            <label className="field-label">
              제목
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력해 주세요."
                maxLength={80}
              />
            </label>
            <label className="field-label">
              내용
              <textarea
                rows={8}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="내용을 입력해 주세요."
                maxLength={2000}
              />
            </label>
            <div className="modal-actions">
              <button className="ghost-btn" type="button" onClick={() => navigate("/board")} disabled={saving}>
                취소
              </button>
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        ) : postId ? (
          post ? (
            <article className="board-post">
              {editing ? (
                <>
                  <label className="field-label">
                    제목
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={80}
                    />
                  </label>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={2000}
                  />
                  <div className="modal-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setTitle(post.title);
                        setBody(post.body);
                      }}
                    >
                      취소
                    </button>
                    <button className="primary-btn" type="button" onClick={savePostEdit} disabled={saving}>
                      {saving ? "저장 중..." : "저장"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="board-detail-title">{post.title}</h2>
                  <div className="board-detail-meta">
                    <span>{post.authorName}</span>
                    <span>{formatWhen(post.createdAt)}</span>
                    <span>조회 {post.viewCount}</span>
                  </div>
                  <p className="board-post-body">{post.body}</p>
                  {post.canEdit && (
                    <div className="board-actions">
                      <button
                        className="ghost-btn chip-btn"
                        type="button"
                        onClick={() => {
                          setEditing(true);
                          setTitle(post.title);
                          setBody(post.body);
                        }}
                      >
                        수정
                      </button>
                      <button className="ghost-btn chip-btn danger-btn" type="button" onClick={removePost}>
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
              <div className="board-comments">
                <strong className="board-comment-label">댓글 {post.comments?.length || 0}</strong>
                {(post.comments || []).map((comment) => (
                  <div key={comment.id} className="board-comment">
                    <div className="board-post-head">
                      <strong>{comment.authorName}</strong>
                      <span className="muted">{formatWhen(comment.createdAt)}</span>
                    </div>
                    {editingCommentId === comment.id ? (
                      <>
                        <textarea
                          rows={2}
                          value={editingCommentBody}
                          onChange={(event) => setEditingCommentBody(event.target.value)}
                          maxLength={400}
                        />
                        <div className="modal-actions">
                          <button className="ghost-btn" type="button" onClick={() => setEditingCommentId(null)}>
                            취소
                          </button>
                          <button className="primary-btn" type="button" onClick={() => saveCommentEdit(comment.id)}>
                            저장
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="board-post-body">{comment.body}</p>
                    )}
                    {comment.canEdit && editingCommentId !== comment.id && (
                      <div className="board-actions">
                        <button
                          className="ghost-btn chip-btn"
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingCommentBody(comment.body);
                          }}
                        >
                          수정
                        </button>
                        <button
                          className="ghost-btn chip-btn danger-btn"
                          type="button"
                          onClick={() => removeComment(comment.id)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <form className="board-comment-form" onSubmit={submitComment}>
                  <input
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="댓글을 남겨 주세요."
                    maxLength={400}
                    aria-label="댓글"
                  />
                  <button className="ghost-btn chip-btn" type="submit">
                    댓글
                  </button>
                </form>
              </div>
            </article>
          ) : (
            <p className="empty-state">글을 찾을 수 없습니다.</p>
          )
        ) : (
          <div className="board-table-wrap">
            <table className="board-table">
              <colgroup>
                <col className="col-no" />
                <col className="col-title" />
                <col className="col-author" />
                <col className="col-when" />
                <col className="col-views" />
              </colgroup>
              <thead>
                <tr>
                  <th>No</th>
                  <th>제목</th>
                  <th>글쓴이</th>
                  <th>작성시간</th>
                  <th className="col-views">조회수</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td className="board-table-empty" colSpan={5}>
                      등록된 글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((item) => (
                    <tr
                      key={item.id}
                      className="is-row"
                      tabIndex={0}
                      onClick={() => navigate(`/board/${item.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          navigate(`/board/${item.id}`);
                        }
                      }}
                    >
                      <td>{item.id}</td>
                      <td className="is-title">
                        {item.title}
                        {item.commentCount > 0 ? ` [${item.commentCount}]` : ""}
                      </td>
                      <td>{item.authorName}</td>
                      <td>{formatDay(item.createdAt)}</td>
                      <td className="col-views">{item.viewCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => navigate("/calendar")} />
    </PullToRefresh>
  );
}
