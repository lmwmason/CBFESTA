import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, LoaderCircle, Plus, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import {
  createBooth,
  getAdminCategories,
  getAdminBooths,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

export function AdminProgramsPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [booths, setBooths] = useState<Tables<"booths">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!festivalId) return;
      void getAdminBooths(festivalId)
      .then(setBooths)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "부스를 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [festivalId]);
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>CONTENT</span>
          <h1>부스</h1>
          <p>학생에게 보여 줄 사진, 먹거리, 게임 등 모든 부스를 관리합니다.</p>
        </div>
        <Link className="primary-action" to="/admin/booths/new">
          <Plus /> 새 부스
        </Link>
      </header>
      {error && <p className="form-error">{error}</p>}
      <section className="management-table">
        {loading ? (
          <div className="management-loading">
            <LoaderCircle /> 불러오는 중…
          </div>
        ) : (
          <>
            {booths.map((booth) => (
              <article className="management-row program-row" key={booth.id}>
                <span>
                  <b>{booth.name}</b>
                  <small>{booth.location ?? "LOCATION PENDING"}</small>
                </span>
                <code>
                  {booth.estimated_wait_minutes > 0 ? `${booth.estimated_wait_minutes} MIN` : "NO WAIT"}
                </code>
                <em>{booth.status}</em>
                <Link to={`/booths`}>보기</Link>
              </article>
            ))}
            {booths.length === 0 && (
              <div className="management-empty">
                <CalendarDays />
                <h2>등록된 부스가 없어요.</h2>
                <Link to="/admin/booths/new">첫 부스 만들기</Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export function NewProgramPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (festivalId)
      void getAdminCategories(festivalId)
        .then(setCategories)
        .catch(() => undefined);
  }, [festivalId]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!festivalId) return;
    setSaving(true);
    setError("");
    try {
      await createBooth({
        festival_id: festivalId,
        name: form.title,
        short_description: form.description || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        status: "draft",
      });
      navigate("/admin/booths");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "부스를 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/admin/booths">
            부스 목록
          </Link>
          <span>CONTENT</span>
          <h1>새 부스</h1>
          <p>처음에는 Draft로 저장되며, 준비가 끝나면 공개할 수 있습니다.</p>
        </div>
      </header>
      <form className="editor-form" onSubmit={submit}>
        <label>
          <span>제목</span>
          <input
            required
            maxLength={120}
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="예: 사진 부스"
          />
        </label>
        <label>
          <span>설명</span>
          <textarea
            maxLength={2000}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="학생에게 보여 줄 안내를 입력하세요."
          />
        </label>
        <label>
          <span>카테고리</span>
          <select
            required
            value={form.category_id}
            onChange={(event) =>
              setForm({ ...form, category_id: event.target.value })
            }
          >
            <option value="">부스 카테고리 선택</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <footer>
          <Link className="secondary-action" to="/admin/booths">
            취소
          </Link>
          <button className="primary-action" disabled={saving}>
            <Save /> {saving ? "저장 중…" : "Draft 저장"}
          </button>
        </footer>
      </form>
    </main>
  );
}
