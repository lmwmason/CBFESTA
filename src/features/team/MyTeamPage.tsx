import { useEffect, useState, type FormEvent } from "react";
import { Save, Upload, Users } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import {
  getMyTeamMembership,
  updateTeamBranding,
  uploadTeamLogo,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

export function MyTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const [membership, setMembership] = useState<Awaited<
    ReturnType<typeof getMyTeamMembership>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f52a9a");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getMyTeamMembership(user.id)
      .then((item) => {
        setMembership(item);
        if (item?.teams) {
          setName(item.teams.name);
          setColor(item.teams.primary_color);
        }
      })
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "팀 정보를 불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const team = membership?.teams ?? null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!team) return;
    setSaving(true);
    setError("");
    setDone(false);
    try {
      const updated = await updateTeamBranding(team.id, {
        name,
        primary_color: color,
      });
      setMembership((current) => (current ? { ...current, teams: updated } : current));
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "팀 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!team) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadTeamLogo(team.festival_id, team.id, file);
      const updated = await updateTeamBranding(team.id, {
        name,
        primary_color: color,
        logo_url: url,
      });
      setMembership((current) => (current ? { ...current, teams: updated } : current));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로고를 업로드하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  if (!team)
    return (
      <main className="management-page">
        <div className="management-empty">
          <Users />
          <h2>아직 소속된 팀이 없어요.</h2>
          <Link to="/teams">팀 목록 보기</Link>
        </div>
      </main>
    );

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/teams">
            팀 랭킹
          </Link>
          <span>MY TEAM</span>
          <h1>{team.name}</h1>
          <p>팀원 누구나 이름, 색상, 로고를 수정할 수 있어요.</p>
        </div>
      </header>
      {error && <p className="form-error">{error}</p>}
      {done && <p className="form-success">저장했습니다.</p>}
      <form className="editor-form" onSubmit={submit}>
          <label>
            <span>팀 로고</span>
            {team.logo_url && (
              <img className="team-logo-preview" src={team.logo_url} alt="" />
            )}
            <label className="upload-zone">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
              <Upload />
              <b>{uploading ? "업로드 중…" : "로고 이미지 선택"}</b>
              <small>PNG, JPG, WEBP, SVG · 5MB 이하</small>
            </label>
          </label>
          <label>
            <span>팀 이름</span>
            <input
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <span>대표 색상</span>
            <div className="color-choice">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <b>{color.toUpperCase()}</b>
            </div>
          </label>
          <footer>
            <button className="primary-action" disabled={saving}>
              <Save /> {saving ? "저장 중…" : "저장하기"}
            </button>
          </footer>
        </form>
    </main>
  );
}
