import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { BottomNav } from "../components/BottomNav.jsx";
import { FamilyCoverField } from "../components/FamilyCoverField.jsx";
import { EVENT_COLORS } from "../constants.js";
import { useAlert } from "../context/AlertContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

export function AdminPage() {
  const { token, isAdmin, isSuperAdmin, logout, refreshUser } = useAuth();
  const { confirm, toast } = useAlert();
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [familyName, setFamilyName] = useState("");
  const [familyColor, setFamilyColor] = useState(EVENT_COLORS[1].id);
  const [approveFamily, setApproveFamily] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [pendingData, memberData, familyData] = await Promise.all([
        apiRequest("/admin/pending-users", { token }),
        apiRequest("/admin/approved-users", { token }),
        apiRequest("/admin/families", { token }),
      ]);
      setPending(pendingData.users || []);
      setMembers((memberData.users || []).filter((item) => item.role !== "ADMIN"));
      const loaded = familyData.families || [];
      setFamilies(loaded);
      const small = loaded.filter((family) => !family.isClan);
      if (!approveFamily && small[0]) {
        setApproveFamily(String(small[0].id));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [token]);

  async function updateStatus(id, status) {
    try {
      await apiRequest(`/admin/users/${id}/status`, {
        method: "PATCH",
        token,
        body: status === "APPROVED" ? { status, familyId: Number(approveFamily) } : { status },
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveFamily(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/admin/families", {
        method: "POST",
        token,
        body: { name: familyName, color: familyColor },
      });
      setFamilyName("");
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeFamily(id) {
    const ok = await confirm({
      title: "이 가족을 삭제할까요?",
      message: "구성원은 소속이 없어지고, 이 가족의 일정은 더 이상 묶여 보이지 않아요.",
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await apiRequest(`/admin/families/${id}`, { method: "DELETE", token });
      await loadAll();
      toast("가족을 삭제했습니다.", "success");
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadCover(familyId, file) {
    setUploadingId(familyId);
    setError("");
    try {
      const image = await readImage(file);
      await apiRequest(`/admin/families/${familyId}/background`, {
        method: "POST",
        token,
        body: { image },
      });
      await loadAll();
      await refreshUser();
      toast("가족 배경 사진을 바꿨습니다.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingId(null);
    }
  }

  async function changeMember(userId, familyId, isFamilyAdmin) {
    try {
      await apiRequest(`/admin/users/${userId}/family`, {
        method: "PATCH",
        token,
        body: { familyId: Number(familyId), isFamilyAdmin },
      });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <main className="admin-page">
        <section className="admin-card">
          <div className="admin-toolbar">
            <div>
              <h1 style={{ margin: "0 0 6px" }}>{isSuperAdmin ? "최종 관리" : "가족 관리"}</h1>
              <p className="muted">
                {isSuperAdmin
                  ? "우리가족은 모두 보고, 소가족은 그 식구만 봅니다."
                  : "소가족 가입 신청을 승인합니다."}
              </p>
            </div>
            <div className="user-actions">
              <Link className="ghost-btn chip-btn" to="/calendar" style={{ padding: "8px 12px" }}>
                캘린더
              </Link>
              <button className="ghost-btn chip-btn" onClick={logout} style={{ padding: "8px 12px" }}>
                로그아웃
              </button>
            </div>
          </div>

          <div className="choice-row" style={{ marginBottom: 18 }}>
            <button className={`choice-chip${tab === "pending" ? " active" : ""}`} onClick={() => setTab("pending")}>
              가입 승인
            </button>
            {(isSuperAdmin || families[0]) && (
              <button className={`choice-chip${tab === "families" ? " active" : ""}`} onClick={() => setTab("families")}>
                {isSuperAdmin ? "가족" : "배경"}
              </button>
            )}
            <button className={`choice-chip${tab === "members" ? " active" : ""}`} onClick={() => setTab("members")}>
              구성원
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <p className="empty-state">목록을 불러오는 중...</p>
          ) : tab === "pending" ? (
            pending.length === 0 ? (
              <p className="empty-state">현재 승인 대기자가 없습니다.</p>
            ) : (
              <>
                {isSuperAdmin && (
                  <label className="field-label" style={{ marginBottom: 16 }}>
                    승인 시 소가족
                    <select value={approveFamily} onChange={(event) => setApproveFamily(event.target.value)}>
                      {families.filter((family) => !family.isClan).length === 0 && (
                        <option value="">먼저 소가족을 만들어 주세요</option>
                      )}
                      {families
                        .filter((family) => !family.isClan)
                        .map((family) => (
                          <option key={family.id} value={family.id}>
                            {family.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <div className="user-list">
                  {pending.map((item) => (
                    <article key={item.id} className="user-item">
                      <div>
                        <strong>{item.name}</strong>
                        <p className="muted">{item.loginId}</p>
                        <p className="muted">신청일 {new Date(item.createdAt).toLocaleString("ko-KR")}</p>
                      </div>
                      <div className="user-actions">
                        <button className="primary-btn approve" onClick={() => updateStatus(item.id, "APPROVED")}>
                          승인
                        </button>
                        <button className="ghost-btn reject" onClick={() => updateStatus(item.id, "REJECTED")}>
                          거절
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )
          ) : tab === "families" ? (
            <div className="group-admin">
              {families.map((family) => (
                <FamilyCoverField
                  key={`cover-${family.id}`}
                  family={family}
                  uploading={uploadingId === family.id}
                  onPick={(file) => uploadCover(family.id, file)}
                />
              ))}
              {isSuperAdmin && (
              <>
              <form className="form group-form" onSubmit={saveFamily}>
                <h3 style={{ margin: 0 }}>새 소가족 만들기</h3>
                <label className="field-label">
                  소가족 이름
                  <input
                    value={familyName}
                    onChange={(event) => setFamilyName(event.target.value)}
                    placeholder="예: 큰집, 작은집"
                    required
                  />
                </label>
                <div className="field-label">
                  색상
                  <div className="color-row">
                    {EVENT_COLORS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`color-dot${familyColor === item.id ? " selected" : ""}`}
                        style={{ background: item.id }}
                        onClick={() => setFamilyColor(item.id)}
                        aria-label={item.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="primary-btn" type="submit" disabled={saving}>
                    {saving ? "저장 중..." : "소가족 추가"}
                  </button>
                </div>
              </form>
              <div className="user-list">
                {families.map((family) => (
                  <article key={family.id} className="user-item">
                    <div>
                      <strong>
                        <span
                          className="color-dot tiny"
                          style={{ background: family.color, display: "inline-block", verticalAlign: "middle", marginRight: 8 }}
                        />
                        {family.name}
                        {family.isClan ? " · 대그룹" : ""}
                      </strong>
                      <p className="muted">
                        {family.isClan ? "가입한 사람 모두" : `구성원 ${family.memberCount}명`}
                      </p>
                    </div>
                    <div className="user-actions">
                      {!family.isClan && (
                        <button className="ghost-btn danger-btn" onClick={() => removeFamily(family.id)}>
                          삭제
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              </>
              )}
            </div>
          ) : members.length === 0 ? (
            <p className="empty-state">아직 구성원이 없습니다.</p>
          ) : (
            <div className="user-list">
              {members.map((item) => (
                <article key={item.id} className="user-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p className="muted">{item.loginId}</p>
                    <p className="muted">
                      {item.familyName ? `소가족 ${item.familyName}` : "소가족 없음 · 우리가족은 보임"}
                      {item.isFamilyAdmin ? " · 가족 관리자" : ""}
                    </p>
                  </div>
                  {isSuperAdmin && families.length > 0 && (
                    <div className="user-actions member-admin-actions">
                      <select
                        value={item.familyId || ""}
                        onChange={(event) => changeMember(item.id, event.target.value, item.isFamilyAdmin)}
                      >
                        <option value="" disabled>
                          가족 선택
                        </option>
                        {families
                          .filter((family) => !family.isClan)
                          .map((family) => (
                            <option key={family.id} value={family.id}>
                              {family.name}
                            </option>
                          ))}
                      </select>
                      <button
                        className={`ghost-btn chip-btn${item.isFamilyAdmin ? " approve" : ""}`}
                        onClick={() => changeMember(item.id, item.familyId, !item.isFamilyAdmin)}
                        disabled={!item.familyId}
                      >
                        {item.isFamilyAdmin ? "관리 해제" : "관리 권한"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => navigate("/calendar")} />
    </>
  );
}
