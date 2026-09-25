import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import { getFestivalById, updateFestival } from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function AdminFestivalSettingsPage() {
  const { activeMembership, refreshMemberships } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [festival, setFestival] = useState<Tables<"festivals"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    status: "draft",
    is_public: false,
    starts_at: "",
    ends_at: "",
  });

  useEffect(() => {
    if (!festivalId) return;
    void getFestivalById(festivalId)
      .then((item) => {
        setFestival(item);
        setForm({
          name: item.name,
          status: item.status,
          is_public: item.is_public,
          starts_at: toDateInput(item.starts_at),
          ends_at: toDateInput(item.ends_at),
        });
      })
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "축제 정보를 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [festivalId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!festival) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateFestival(festival.id, {
        name: form.name,
        status: form.status,
        is_public: form.is_public,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      setFestival(updated);
      await refreshMemberships();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "축제 정보를 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>FESTIVAL SETTINGS</span>
          <h1>축제 설정</h1>
          <p>공개 상태와 운영 단계를 바꾸면 학생 화면에 즉시 반영됩니다.</p>
        </div>
      </header>
      {loading ? (
        <div className="management-loading">
          <LoaderCircle /> 불러오는 중…
        </div>
      ) : !festival ? (
        <div className="management-empty">
          <h2>축제를 찾을 수 없어요.</h2>
        </div>
      ) : (
        <form className="editor-form" onSubmit={submit}>
          <label>
            <span>축제 이름</span>
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label>
            <span>운영 단계</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="draft">준비 중</option>
              <option value="open">진행 중</option>
              <option value="closed">종료</option>
            </select>
            <small>학생 홈 화면 상단 배지에 표시되는 운영 단계 라벨입니다.</small>
          </label>
          <label>
            <span>공개 여부</span>
            <select
              value={form.is_public ? "public" : "private"}
              onChange={(event) =>
                setForm({ ...form, is_public: event.target.value === "public" })
              }
            >
              <option value="private">비공개 (학생에게 보이지 않음)</option>
              <option value="public">공개 (지금 축제 시작)</option>
            </select>
            <small>비공개 상태에서는 학생 홈 화면에 "축제를 준비하고 있어요" 화면이 표시됩니다.</small>
          </label>
          <label>
            <span>시작일</span>
            <input
              type="date"
              value={form.starts_at}
              onChange={(event) => setForm({ ...form, starts_at: event.target.value })}
            />
          </label>
          <label>
            <span>종료일</span>
            <input
              type="date"
              min={form.starts_at}
              value={form.ends_at}
              onChange={(event) => setForm({ ...form, ends_at: event.target.value })}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <footer>
            <button className="primary-action" disabled={saving}>
              <Save /> {saving ? "저장 중…" : "변경 저장"}
            </button>
          </footer>
        </form>
      )}
    </main>
  );
}
