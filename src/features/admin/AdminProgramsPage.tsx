import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, LoaderCircle, Plus, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import {
  createProgram,
  getAdminCategories,
  getAdminPrograms,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

export function AdminProgramsPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [programs, setPrograms] = useState<Tables<"programs">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!festivalId) return;
    void getAdminPrograms(festivalId)
      .then(setPrograms)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "프로그램을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [festivalId]);
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>CONTENT</span>
          <h1>프로그램</h1>
          <p>학생에게 보여 줄 공연, 미션, 전시와 먹거리 콘텐츠를 관리합니다.</p>
        </div>
        <Link className="primary-action" to="/admin/programs/new">
          <Plus /> 새 프로그램
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
            {programs.map((program) => (
              <article className="management-row program-row" key={program.id}>
                <span>
                  <b>{program.title}</b>
                  <small>{program.kind}</small>
                </span>
                <code>
                  {program.points > 0 ? `+${program.points} P` : "NO POINTS"}
                </code>
                <em>{program.status}</em>
                <Link to={`/programs/${program.id}`}>보기</Link>
              </article>
            ))}
            {programs.length === 0 && (
              <div className="management-empty">
                <CalendarDays />
                <h2>등록된 프로그램이 없어요.</h2>
                <Link to="/admin/programs/new">첫 프로그램 만들기</Link>
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
    kind: "mission",
    points: 0,
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
      await createProgram({
        festival_id: festivalId,
        title: form.title,
        description: form.description || null,
        kind: form.kind,
        points: form.points,
        category_id: form.category_id ? Number(form.category_id) : null,
        status: "draft",
      });
      navigate("/admin/programs");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "프로그램을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/admin/programs">
            프로그램 목록
          </Link>
          <span>CONTENT</span>
          <h1>새 프로그램</h1>
          <p>처음에는 Draft로 저장되며, 검토 후 공개할 수 있습니다.</p>
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
            placeholder="예: 밴드부 저녁 공연"
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
          <span>유형</span>
          <select
            value={form.kind}
            onChange={(event) => setForm({ ...form, kind: event.target.value })}
          >
            <option value="mission">Mission</option>
            <option value="performance">Performance</option>
            <option value="food">Food</option>
            <option value="exhibition">Exhibition</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <span>카테고리</span>
          <select
            value={form.category_id}
            onChange={(event) =>
              setForm({ ...form, category_id: event.target.value })
            }
          >
            <option value="">선택 안 함</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>미션 포인트</span>
          <input
            type="number"
            min="0"
            max="100000"
            value={form.points}
            onChange={(event) =>
              setForm({ ...form, points: Number(event.target.value) })
            }
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <footer>
          <Link className="secondary-action" to="/admin/programs">
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
