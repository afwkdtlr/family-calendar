import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { BottomNav } from "../components/BottomNav.jsx";
import { PullToRefresh } from "../components/PullToRefresh.jsx";
import { useAlert } from "../context/AlertContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_VEHICLES = 3;

function emptyVehicle() {
  return { plate: "" };
}

export function FamilyInfoPage() {
  const { token, isAdmin } = useAuth();
  const { toast } = useAlert();
  const navigate = useNavigate();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ address: "", vehicles: [emptyVehicle()] });
  const [saving, setSaving] = useState(false);

  async function load(quiet = false) {
    if (!quiet) {
      setLoading(true);
    }
    setError("");
    try {
      const data = await apiRequest("/family-info", { token });
      setFamilies(data.families || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  function startEdit(family) {
    setError("");
    setEditingId(family.id);
    setForm({
      address: family.address || "",
      vehicles: family.vehicles.length
        ? family.vehicles.slice(0, MAX_VEHICLES).map((item) => ({ plate: item.plate }))
        : [emptyVehicle()],
    });
  }

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} 복사했습니다.`, "success");
    } catch {
      toast("복사하지 못했습니다.", "info");
    }
  }

  async function save(familyId) {
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/family-info/${familyId}`, {
        method: "PATCH",
        token,
        body: {
          address: form.address,
          vehicles: form.vehicles,
        },
      });
      toast("가족 정보를 저장했습니다.", "success");
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PullToRefresh
      className="app-shell calendar-shell game-shell"
      onRefresh={() => load(true)}
      disabled={Boolean(editingId)}
    >
      <header className="app-header">
        <div className="month-nav">
          <span className="header-title">가족정보</span>
          <span className="header-title full">주소 · 차량번호</span>
        </div>
      </header>
      <main className="game-page game-hub family-info-page">
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <p className="empty-state">목록을 불러오는 중...</p>
        ) : families.length === 0 ? (
          <p className="empty-state">아직 소가족이 없습니다.</p>
        ) : (
          families.map((family) => {
            const editing = editingId === family.id;
            return (
              <article key={family.id} className={`family-info-card${editing ? " is-editing" : ""}`}>
                <div className="family-info-head">
                  <div>
                    <strong>
                      <span className="color-dot tiny" style={{ background: family.color }} />
                      {family.name}
                    </strong>
                    {family.members.length > 0 && (
                      <p className="muted">{family.members.join(" · ")}</p>
                    )}
                  </div>
                  {family.canEdit && !editing && (
                    <button className="ghost-btn chip-btn" type="button" onClick={() => startEdit(family)}>
                      수정
                    </button>
                  )}
                </div>

                {editing ? (
                  <form
                    className="form family-info-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      save(family.id);
                    }}
                  >
                    <label className="field-label">
                      주소
                      <textarea
                        rows={2}
                        value={form.address}
                        onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                        placeholder="주소를 입력해 주세요."
                        maxLength={200}
                      />
                    </label>
                    <div className="field-label">
                      차량번호
                      {form.vehicles.map((item, index) => (
                        <div className="vehicle-edit-row" key={`vehicle-${index}`}>
                          <input
                            value={item.plate}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                vehicles: prev.vehicles.map((row, rowIndex) =>
                                  rowIndex === index ? { ...row, plate: event.target.value } : row
                                ),
                              }))
                            }
                            placeholder="12가 3456"
                            maxLength={20}
                            aria-label="차량번호"
                          />
                          <button
                            className="ghost-btn chip-btn"
                            type="button"
                            aria-label="차량 삭제"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                vehicles:
                                  prev.vehicles.length > 1
                                    ? prev.vehicles.filter((_, rowIndex) => rowIndex !== index)
                                    : [emptyVehicle()],
                              }))
                            }
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                      <button
                        className="ghost-btn chip-btn"
                        type="button"
                        onClick={() => {
                          if (form.vehicles.length >= MAX_VEHICLES) {
                            toast("차량은 3대까지 적을 수 있습니다.");
                            return;
                          }
                          setForm((prev) => ({ ...prev, vehicles: [...prev.vehicles, emptyVehicle()] }));
                        }}
                      >
                        차량 추가
                      </button>
                    </div>
                    <div className="modal-actions">
                      <button className="ghost-btn" type="button" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                      <button className="primary-btn" type="submit" disabled={saving}>
                        {saving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="family-info-row">
                      <span className="family-info-label">주소</span>
                      {family.address ? (
                        <button
                          className="family-info-copy"
                          type="button"
                          onClick={() => copyText("주소", family.address)}
                        >
                          {family.address}
                        </button>
                      ) : (
                        <span className="muted">아직 없어요</span>
                      )}
                    </div>
                    <div className="family-info-row">
                      <span className="family-info-label">차량</span>
                      {family.vehicles.length === 0 ? (
                        <span className="muted">아직 없어요</span>
                      ) : (
                        <div className="plate-row">
                          {family.vehicles.map((item) => (
                            <button
                              key={item.id}
                              className="plate-chip"
                              type="button"
                              onClick={() => copyText("차량번호", item.plate)}
                            >
                              {item.plate}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })
        )}
      </main>
      <BottomNav isAdmin={isAdmin} onAdd={() => navigate("/calendar")} />
    </PullToRefresh>
  );
}
