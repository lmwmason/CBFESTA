import { useEffect, useState, type FormEvent } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Shuffle,
  Upload,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import {
  balanceTeams,
  createTeam,
  getAdminTeams,
  getTeam,
  getTeamRoster,
  updateTeam,
  uploadTeamLogo,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type Team = Tables<"teams">;

export function AdminTeamsPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [teams, setTeams] = useState<Team[]>([]);
  const [rosterCounts, setRosterCounts] = useState<Record<number, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [balancing, setBalancing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!festivalId) return;
    void Promise.all([getAdminTeams(festivalId), getTeamRoster(festivalId)])
      .then(([teamRows, roster]) => {
        setTeams(teamRows);
        setRosterCounts(
          roster.reduce<Record<number, number>>((all, member) => {
            all[member.team_id] = (all[member.team_id] ?? 0) + 1;
            return all;
          }, {}),
        );
      })
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "팀을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [festivalId]);

  const balance = async () => {
    if (!festivalId) return;
    setBalancing(true);
    setError("");
    setMessage("");
    try {
      const result = await balanceTeams(festivalId);
      setMessage(
        `${result.assigned_count}명 배정 완료 · 미배정 ${result.unassigned_count}명`,
      );
      const [teamRows, roster] = await Promise.all([
        getAdminTeams(festivalId),
        getTeamRoster(festivalId),
      ]);
      setTeams(teamRows);
      setRosterCounts(
        roster.reduce<Record<number, number>>((all, member) => {
          all[member.team_id] = (all[member.team_id] ?? 0) + 1;
          return all;
        }, {}),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "자동 배정에 실패했습니다.",
      );
    } finally {
      setBalancing(false);
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>TEAM SYSTEM</span>
          <h1>팀</h1>
          <p>
            팀을 만들고 정원을 설정하면 미배정 학생을 자동으로 나눠 배정할 수
            있어요.
          </p>
        </div>
        <div className="workspace-head-actions">
          <button
            className="secondary-action"
            disabled={balancing}
            onClick={() => void balance()}
          >
            <Shuffle /> {balancing ? "배정 중…" : "자동 배정"}
          </button>
          <Link className="primary-action" to="/admin/teams/new">
            <Plus /> 새 팀
          </Link>
        </div>
      </header>
      {message && (
        <div className="admin-note">
          <Users />
          <p>{message}</p>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <section className="management-table">
        {loading ? (
          <div className="management-loading">
            <LoaderCircle /> 불러오는 중…
          </div>
        ) : (
          <>
            {teams.map((team) => (
              <article className="management-row" key={team.id}>
                <span className="category-name">
                  <i style={{ backgroundColor: team.primary_color }} />
                  <b>{team.name}</b>
                </span>
                <code>
                  {rosterCounts[team.id] ?? 0}
                  {team.member_capacity > 0
                    ? ` / ${team.member_capacity}명`
                    : "명 · 정원 미설정"}
                </code>
                <em>{team.score.toLocaleString()} P</em>
                <Link
                  to={`/admin/teams/${team.id}`}
                  aria-label={`${team.name} 편집`}
                >
                  <Pencil />
                </Link>
              </article>
            ))}
            {teams.length === 0 && (
              <div className="management-empty">
                <Users />
                <h2>등록된 팀이 없어요.</h2>
                <Link to="/admin/teams/new">첫 팀 만들기</Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function TeamForm({
  team,
  onSaved,
}: {
  team?: Team;
  onSaved: (team: Team) => void;
}) {
  const { activeMembership } = useAuth();
  const [name, setName] = useState(team?.name ?? "");
  const [color, setColor] = useState(team?.primary_color ?? "#f52a9a");
  const [capacity, setCapacity] = useState(team?.member_capacity ?? 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(team?.logo_url ?? null);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeMembership) return;
    setSaving(true);
    setError("");
    try {
      const saved = team
        ? await updateTeam(team.id, {
            name,
            primary_color: color,
            member_capacity: capacity,
          })
        : await createTeam({
            festival_id: activeMembership.festival_id,
            name,
            primary_color: color,
            member_capacity: capacity,
          });
      onSaved(saved);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "팀을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!team || !activeMembership) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadTeamLogo(activeMembership.festival_id, team.id, file);
      await updateTeam(team.id, { logo_url: url });
      setLogoUrl(url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "로고를 업로드하지 못했습니다.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="editor-form" onSubmit={submit}>
      <label>
        <span>팀 이름</span>
        <input
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 레드팀"
        />
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
      <label>
        <span>정원</span>
        <input
          type="number"
          min={0}
          max={2000}
          value={capacity}
          onChange={(event) => setCapacity(Number(event.target.value))}
        />
        <small>0이면 자동 배정 대상에서 제외돼요. 배정 인원 상한을 정하세요.</small>
      </label>
      {team && (
        <label>
          <span>팀 로고</span>
          {logoUrl && <img className="team-logo-preview" src={logoUrl} alt="" />}
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
      )}
      {error && <p className="form-error">{error}</p>}
      <footer>
        <Link className="secondary-action" to="/admin/teams">
          취소
        </Link>
        <button className="primary-action" disabled={saving}>
          <Save /> {saving ? "저장 중…" : "저장하기"}
        </button>
      </footer>
    </form>
  );
}

export function NewTeamPage() {
  const navigate = useNavigate();
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/admin/teams">
            팀 목록
          </Link>
          <span>TEAM SYSTEM</span>
          <h1>새 팀</h1>
          <p>저장하면 팀 편집 화면에서 로고를 추가할 수 있어요.</p>
        </div>
      </header>
      <TeamForm onSaved={(team) => navigate(`/admin/teams/${team.id}`)} />
    </main>
  );
}

export function EditTeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const id = Number(teamId);
    if (Number.isNaN(id)) return;
    void getTeam(id)
      .then(setTeam)
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "팀을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [teamId]);
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/admin/teams">
            팀 목록
          </Link>
          <span>TEAM SYSTEM</span>
          <h1>{team?.name ?? "팀 편집"}</h1>
          <p>이름, 색상, 정원, 로고를 관리합니다.</p>
        </div>
      </header>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="management-loading">
          <LoaderCircle /> 불러오는 중…
        </div>
      ) : (
        team && <TeamForm team={team} onSaved={setTeam} />
      )}
    </main>
  );
}
