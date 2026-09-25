import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

export function AccountSettingsPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <AccountSettingsForm key={user.id} user={user} />;
}

function AccountSettingsForm({ user }: { user: User }) {
  const { updateAccount } = useAuth();
  const [name, setName] = useState(user.user_metadata.full_name ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setDone(false);
    if (password && password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password && password !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSaving(true);
    try {
      await updateAccount({
        name: name.trim() || undefined,
        password: password || undefined,
      });
      setPassword("");
      setConfirm("");
      setDone(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "계정 정보를 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/">
            홈으로
          </Link>
          <span>ACCOUNT</span>
          <h1>계정 설정</h1>
          <p>
            아이디 {user.user_metadata.login_id}
            {user.user_metadata.student_number
              ? ` · 학번 ${user.user_metadata.student_number}`
              : ""}
          </p>
        </div>
      </header>
      <form className="editor-form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        {done && <p className="form-success">저장했습니다.</p>}
        <label>
          <span>이름</span>
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span>새 비밀번호</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="변경하지 않으려면 비워두세요"
          />
          <small>6자 이상 입력하세요.</small>
        </label>
        <label>
          <span>새 비밀번호 확인</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={!password}
          />
        </label>
        <footer>
          <Link className="secondary-action" to="/">
            취소
          </Link>
          <button className="primary-action" disabled={saving}>
            <Save /> {saving ? "저장 중…" : "변경 저장"}
          </button>
        </footer>
      </form>
    </main>
  );
}
