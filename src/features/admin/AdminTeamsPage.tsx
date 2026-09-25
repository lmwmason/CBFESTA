import { useEffect, useState, type FormEvent } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Shuffle,
  Trash2,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import {
  balanceTeams,
  createTeam,
  deleteTeam,
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
  const [teamSize, setTeamSize] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const reload = () => {
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
  };
  useEffect(reload, [festivalId]);

  const remove = async (team: Team) => {
    if (!confirm(`"${team.name}" 팀을 삭제할까요? 팀원 배정도 함께 사라져요.`))
      return;
    setDeletingId(team.id);
    setError("");
    try {
      await deleteTeam(team.id);
      reload();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "팀을 삭제하지 못했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const balance = async () => {
    if (!festivalId) return;
    setBalancing(true);
    setError("");
    setMessage("");
    try {
      if (teamSize > 0) {
        await Promise.all(
          teams.map((team) =>
            team.member_capacity === teamSize
              ? Promise.resolve()
              : updateTeam(team.id, { member_capacity: teamSize }),
          ),
        );
      }
      const result = await balanceTeams(festivalId, teamSize > 0 ? teamSize : undefined);
      setMessage(
        `${result.teams_created > 0 ? `${result.teams_created}개 팀 자동 생성 · ` : ""}${result.assigned_count}명 배정 완료 · 미배정 ${result.unassigned_count}명`,
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
      const raw = caught instanceof Error ? caught.message : "";
      setError(
        raw.includes("Set a capacity")
          ? "먼저 '팀당 인원'을 입력하거나, 각 팀 편집 화면에서 정원을 설정한 뒤 다시 시도하세요."
          : raw || "자동 배정에 실패했습니다.",
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
            팀당 인원을 입력하고 자동 배정하면 해당 인원수로 전체 팀 정원을
            맞춘 뒤 미배정 학생을 나눠 배정해요. 비워두면 각 팀에 미리 설정된
            정원을 그대로 사용합니다.
          </p>
        </div>
        <div className="workspace-head-actions">
          <label className="team-size-input">
            <span>팀당 인원</span>
            <input
              type="number"
              min={0}
              max={2000}
              placeholder="자동"
              value={teamSize || ""}
              onChange={(event) => setTeamSize(Number(event.target.value))}
            />
          </label>
          <button
            className="secondary-action"
            disabled={balancing || (teams.length === 0 && teamSize <= 0)}
            title={
              teams.length === 0 && teamSize <= 0
                ? "팀이 없어요. '팀당 인원'을 입력하면 필요한 만큼 팀을 자동으로 만들어요."
                : undefined
            }
            onClick={() => void balance()}
          >
            <Shuffle /> {balancing ? "배정 중…" : "자동 배정"}
          </button>
          <Link className="primary-action" to="/admin/teams/new">
            <Plus /> 새 팀
          </Link>
        </div>
      </header>
      {teams.length === 0 && !loading && (
        <div className="admin-note">
          <Users />
          <p>
            등록된 팀이 없어요. "팀당 인원"을 입력하고 자동 배정하면 필요한
            수만큼 팀을 만들어 바로 나눠 배정해요. 직접 팀을 만들려면 "새 팀"을
            누르세요.
          </p>
        </div>
      )}
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
              <article className="management-row team-row" key={team.id}>
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
                <button
                  aria-label={`${team.name} 삭제`}
                  disabled={deletingId === team.id}
                  onClick={() => void remove(team)}
                >
                  <Trash2 />
                </button>
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

type RosterMember = Tables<"team_members"> & {
  profile: Pick<Tables<"profiles">, "display_name" | "student_number"> | null;
};

export function EditTeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = Number(teamId);
    if (Number.isNaN(id)) return;
    void getTeam(id)
      .then(async (item) => {
        setTeam(item);
        const allRoster = await getTeamRoster(item.festival_id);
        setRoster(
          allRoster.filter((member) => member.team_id === id) as RosterMember[],
        );
      })
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
        team && (
          <>
            <TeamForm team={team} onSaved={setTeam} />
            <section className="permission-table roster-table">
              <div className="management-header">
                <div>
                  <span>ROSTER</span>
                  <h2>팀원</h2>
                  <p>
                    팀원 누구나 학생용 화면(내 팀 관리)에서 팀 이름·색상·로고를
                    직접 수정할 수 있어요.
                  </p>
                </div>
              </div>
              {roster.length === 0 && (
                <div className="management-empty">
                  <Users />
                  <h2>배정된 팀원이 없어요.</h2>
                </div>
              )}
              {roster.map((member) => (
                <article key={member.user_id}>
                  <span className="member-avatar">
                    {member.profile?.display_name?.slice(0, 1) ?? (
                      <UserRound />
                    )}
                  </span>
                  <span className="member-info">
                    <b>{member.profile?.display_name ?? "이름 미설정"}</b>
                    <small>{member.profile?.student_number ?? ""}</small>
                  </span>
                </article>
              ))}
            </section>
          </>
        )
      )}
    </main>
  );
}
