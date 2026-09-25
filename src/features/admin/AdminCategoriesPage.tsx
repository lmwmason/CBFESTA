import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle, Pencil, Plus, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import {
  createCategory,
  getAdminCategories,
  updateCategory,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type Category = Tables<"categories">;

export function AdminCategoriesPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!festivalId) return;
    void getAdminCategories(festivalId)
      .then(setCategories)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "카테고리를 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [festivalId]);

  const toggle = async (category: Category) => {
    try {
      const updated = await updateCategory(category.id, {
        is_visible: !category.is_visible,
      });
      setCategories((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "공개 상태를 바꾸지 못했습니다.",
      );
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/admin">
            Control center
          </Link>
          <span>CONTENT SYSTEM</span>
          <h1>카테고리</h1>
          <p>학생이 탐색할 콘텐츠 분류를 축제별로 관리합니다.</p>
        </div>
        <Link className="primary-action" to="/admin/categories/new">
          <Plus /> 새 카테고리
        </Link>
      </header>
      <section className="management-table">
        {loading ? (
          <div className="management-loading">
            <LoaderCircle /> 불러오는 중…
          </div>
        ) : (
          <>
            {error && <p className="form-error">{error}</p>}
            <div className="management-table-head">
              <span>카테고리</span>
              <span>코드</span>
              <span>공개</span>
              <span />
            </div>
            {categories.map((category) => (
              <article key={category.id} className="management-row">
                <span className="category-name">
                  <i style={{ backgroundColor: category.color ?? "#a7a1a0" }} />
                  <b>{category.name}</b>
                </span>
                <code>{category.code}</code>
                <button
                  className={`visibility ${category.is_visible ? "visible" : ""}`}
                  onClick={() => void toggle(category)}
                >
                  {category.is_visible ? <Eye /> : <EyeOff />}
                  {category.is_visible ? "공개" : "숨김"}
                </button>
                <Link
                  to={`/admin/categories/${category.id}`}
                  aria-label={`${category.name} 편집`}
                >
                  <Pencil />
                </Link>
              </article>
            ))}
            {categories.length === 0 && (
              <div className="management-empty">
                <h2>카테고리가 없어요.</h2>
                <Link to="/admin/categories/new">첫 카테고리 만들기</Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export function NewCategoryPage() {
  const { activeMembership } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#c32978");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeMembership) return;
    setSaving(true);
    setError("");
    try {
      await createCategory({
        festival_id: activeMembership.festival_id,
        name,
        code: code.toUpperCase(),
        color,
        is_visible: true,
        sort_order: 0,
      });
      navigate("/admin/categories");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "카테고리를 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/admin/categories">
            카테고리 목록
          </Link>
          <span>CONTENT SYSTEM</span>
          <h1>새 카테고리</h1>
          <p>학생 화면에 표시할 새 분류를 만듭니다.</p>
        </div>
      </header>
      <form className="editor-form" onSubmit={submit}>
        <label>
          <span>이름</span>
          <input
            required
            maxLength={30}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 먹거리"
          />
        </label>
        <label>
          <span>코드</span>
          <input
            required
            pattern="[A-Za-z0-9_-]{2,30}"
            maxLength={30}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="FOOD"
          />
          <small>영문, 숫자, 밑줄 또는 하이픈만 사용할 수 있어요.</small>
        </label>
        <label>
          <span>대표 색상</span>
          <div className="color-choice">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
            <b>{color.toUpperCase()}</b>
          </div>
        </label>
        {error && <p className="form-error">{error}</p>}
        <footer>
          <Link className="secondary-action" to="/admin/categories">
            취소
          </Link>
          <button className="primary-action" disabled={saving}>
            <Save /> {saving ? "저장 중…" : "저장하기"}
          </button>
        </footer>
      </form>
    </main>
  );
}
