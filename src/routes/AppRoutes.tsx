import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import brandLogo from "../assets/cbfesta-logo.png";
import type { Tables } from "../lib/supabase/database.types";
import {
  estimateWaitMinutes,
  getBoothDetail,
  getCurrentFestival,
  getFestivalCatalog,
  getMyQueueEntries,
  getMyQueueEntry,
  joinQueue,
  lookupStudentByNumber,
  subscribeToBoothOperations,
  subscribeToFestival,
  updateQueueEntry,
} from "../lib/supabase/services";
import { AdminDashboard, BoothDashboard } from "../RoleDashboards";
import { AuthSheet } from "../features/auth/AuthSheet";
import {
  AdminCategoriesPage,
  NewCategoryPage,
} from "../features/admin/AdminCategoriesPage";
import { AdminPermissionsPage } from "../features/admin/AdminPermissionsPage";
import { AdminAnnouncementsPage } from "../features/admin/AdminAnnouncementsPage";
import { AdminSchedulePage, NewSchedulePage } from "../features/admin/AdminSchedulePage";
import {
  AdminProgramsPage,
  NewProgramPage,
} from "../features/admin/AdminProgramsPage";
import {
  BoothDisplayPage,
  BoothDisplaySetupPage,
  StudentCheckinPage,
} from "../features/booth/BoothQrPages";
import { BoothSettingsPage } from "../features/booth/BoothSettingsPage";
import { BoothQueuePage } from "../features/booth/BoothQueuePage";
import { BoothInventoryPage } from "../features/booth/BoothInventoryPage";
import { AdminIssuesPage } from "../features/admin/AdminIssuesPage";
import {
  AdminTeamsPage,
  EditTeamPage,
  NewTeamPage,
} from "../features/admin/AdminTeamsPage";
import { AdminFestivalSettingsPage } from "../features/admin/AdminFestivalSettingsPage";
import { getCategoryIcon, getKindIcon } from "../lib/categoryIcons";
import { AccountMenu } from "../components/AccountMenu";
import { ReportForm } from "../features/reports/ReportSheet";
import { AdminShell } from "../components/AdminShell";
import { BoothShell } from "../components/BoothShell";
import { useAuth, type FestivalRole } from "../features/auth/auth-context";

type Catalog = Awaited<ReturnType<typeof getFestivalCatalog>>;
function Header() {
  return (
    <header className="route-header">
      <Link to="/">
        <img src={brandLogo} alt="" />
        <span>
          <b>CBFESTA</b>
          <small>FESTIVAL PLATFORM</small>
        </span>
      </Link>
      <nav>
        <Link to="/booths">BOOTHS</Link>
        <Link to="/schedule">SCHEDULE</Link>
        <Link to="/teams">TEAMS</Link>
        <Link to="/reservations">MY QUEUE</Link>
        <Link to="/report">REPORT</Link>
      </nav>
      <div className="header-tools">
        <AccountMenu />
      </div>
    </header>
  );
}
function PageBack({ fallback = "/", label = "축제 홈" }: { fallback?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      className="page-back route-back"
      onClick={() =>
        window.history.length > 1 ? navigate(-1) : navigate(fallback)
      }
      type="button"
    >
      <ArrowLeft aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
function Loading() {
  return (
    <div className="app-loading">
      <img src={brandLogo} alt="" />
      <span>Loading festival…</span>
    </div>
  );
}
function usePublicCatalog() {
  const [festival, setFestival] = useState<Tables<"festivals"> | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void getCurrentFestival()
      .then(async (item) => {
        setFestival(item);
        setCatalog(item ? await getFestivalCatalog(item.id) : null);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "축제 정보를 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!festival) return;
    return subscribeToFestival(festival.id, () => {
      void getFestivalCatalog(festival.id).then(setCatalog);
    });
  }, [festival]);
  return { festival, catalog, loading, error };
}
function EmptyFestival() {
  return (
    <main className="listing-page simple-page">
      <CalendarDays />
      <h1>축제를 준비하고 있어요.</h1>
      <p>운영진이 단일 축제 설정을 완료하면 이 페이지가 열립니다.</p>
    </main>
  );
}
function LoginPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next");
  useEffect(() => {
    // Account actions (sign out, switch festival, jump to workspace) now
    // live in the header's AccountMenu dropdown everywhere, so this page
    // only has a reason to exist for signed-out visitors and for the
    // post-login ?next= redirect — never leave an already-signed-in user
    // parked here.
    if (user) navigate(next ?? "/", { replace: true });
  }, [user, next, navigate]);
  if (user) return null;
  return (
    <main className="auth-page">
      <Link className="page-back" to="/">
        <ArrowLeft /> 축제로 돌아가기
      </Link>
      <section className="auth-page-intro">
        <img src={brandLogo} alt="" />
        <span>YOUR FESTIVAL PASS</span>
        <h1>
          한 계정으로
          <br />
          축제의 모든 순간을.
        </h1>
        <p>
          가입하면 바로 참가자로 시작하며, 운영진은 필요한 계정에만 추가 권한을
          부여합니다.
        </p>
      </section>
      <AuthSheet />
    </main>
  );
}
function ReportPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const boothId = params.get("booth");
  const next = `/report${boothId ? `?booth=${boothId}` : ""}`;
  return (
    <main className="auth-page">
      <Link className="page-back" to="/">
        <ArrowLeft /> 축제로 돌아가기
      </Link>
      <section className="auth-page-intro">
        <img src={brandLogo} alt="" />
        <span>SAFETY &amp; ISSUES</span>
        <h1>
          현장의 문제를
          <br />
          바로 알려주세요.
        </h1>
        <p>안전, 시설, 질서 문제를 신고하면 운영진에게 즉시 전달됩니다.</p>
      </section>
      <section className="auth-sheet">
        {user ? (
          <ReportForm boothId={boothId ? Number(boothId) : undefined} />
        ) : (
          <>
            <span>SIGN IN REQUIRED</span>
            <h2>로그인이 필요해요</h2>
            <p>신고는 본인 계정으로만 접수할 수 있어요.</p>
            <Link
              className="primary-action"
              to={`/login?next=${encodeURIComponent(next)}`}
            >
              로그인하기 <ArrowRight />
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
function SchedulePage() {
  const { festival, catalog, loading, error } = usePublicCatalog();
  const [query, setQuery] = useState("");
  if (loading) return <Loading />;
  if (error) return <ErrorPage message={error} />;
  if (!festival)
    return (
      <>
        <Header />
        <EmptyFestival />
      </>
    );
  const programs = (catalog?.programs ?? []).filter((item) =>
    `${item.title} ${item.description ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <Header />
      <main className="listing-page">
        <PageBack />
        <header>
          <span>FESTIVAL SCHEDULE</span>
          <h1>일정</h1>
          <p>{festival.name}의 공연, 행사와 미션 시간표입니다.</p>
        </header>
        <label className="catalog-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="일정 검색"
          />
        </label>
        <section className="listing-grid">
          {programs.map((item) => {
            const category = catalog?.categories?.find(
              (candidate) => candidate.id === item.category_id,
            );
            const KindIcon = getKindIcon(item.kind);
            return (
              <Link to={`/schedule/${item.id}`} key={item.id}>
                <div
                  className="listing-thumb"
                  style={
                    item.cover_url
                      ? {
                          backgroundImage: `url(${item.cover_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : { backgroundColor: category?.color ?? "#f0e4e9" }
                  }
                >
                  {!item.cover_url && <KindIcon />}
                </div>
                <small>{category?.name ?? item.kind}</small>
                <h2>{item.title}</h2>
                <p>{item.description ?? "상세 정보 보기"}</p>
              </Link>
            );
          })}
          {programs.length === 0 && (
            <div className="catalog-empty">
              <CalendarDays />
              <h3>등록된 일정이 없어요.</h3>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
function ProgramDetailPage() {
  const { programId } = useParams();
  const { festival, catalog, loading, error } = usePublicCatalog();
  if (loading) return <Loading />;
  if (error) return <ErrorPage message={error} />;
  const program = (catalog?.programs ?? []).find(
    (item) => item.id === Number(programId),
  );
  if (!festival || !program)
    return (
      <>
        <Header />
        <main className="listing-page simple-page">
          <h1>프로그램을 찾을 수 없어요.</h1>
          <Link to="/schedule">일정 목록</Link>
        </main>
      </>
    );
  return (
    <>
      <Header />
      <main className="detail-page">
        <PageBack fallback="/schedule" label="일정 목록" />
        <span>
          {catalog?.categories?.find((item) => item.id === program.category_id)
            ?.name ?? program.kind}
        </span>
        <h1>{program.title}</h1>
        <p>{program.description ?? "상세 설명이 아직 등록되지 않았습니다."}</p>
        <dl>
          <div>
            <dt>상태</dt>
            <dd>{program.status}</dd>
          </div>
          <div>
            <dt>포인트</dt>
            <dd>{program.points > 0 ? `+${program.points} P` : "없음"}</dd>
          </div>
        </dl>
      </main>
    </>
  );
}
function TeamsPage() {
  const { festival, catalog, loading, error } = usePublicCatalog();
  if (loading) return <Loading />;
  if (error) return <ErrorPage message={error} />;
  if (!festival)
    return (
      <>
        <Header />
        <EmptyFestival />
      </>
    );
  const teams = catalog?.teams ?? [];
  return (
    <>
      <Header />
      <main className="listing-page teams-page">
        <PageBack />
        <header>
          <span>LEADERBOARD</span>
          <h1>팀 랭킹</h1>
          <p>{festival.name}의 현재 팀 점수입니다.</p>
        </header>
        <section className="leaderboard">
          {teams.map((team, index) => (
            <article key={team.id}>
              <strong>{index + 1}</strong>
              <i style={{ backgroundColor: team.primary_color }} />
              <span>
                <b>{team.name}</b>
                <small>{team.score.toLocaleString()} P</small>
              </span>
              <ChevronRight />
            </article>
          ))}
          {teams.length === 0 && (
            <div className="catalog-empty">
              <CalendarDays />
              <h3>등록된 팀이 없어요.</h3>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
type ReservationEntry = Tables<"queue_entries"> & {
  booths: Pick<
    Tables<"booths">,
    "id" | "name" | "location" | "accent_color" | "logo_url"
  > | null;
};
function ReservationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ReservationEntry[]>([]);
  const [loading, setLoading] = useState(() => !!user);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setItems((await getMyQueueEntries(user.id)) as ReservationEntry[]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "예약을 불러오지 못했습니다.",
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void getMyQueueEntries(user.id)
      .then((data) => setItems(data as ReservationEntry[]))
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "예약을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);

  const cancel = async (entry: ReservationEntry) => {
    setBusyId(entry.id);
    setError("");
    try {
      await updateQueueEntry(entry.id, "cancelled");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "취소하지 못했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (!user)
    return (
      <>
        <Header />
        <main className="listing-page simple-page">
          <Users />
          <h1>로그인이 필요해요.</h1>
          <Link
            className="primary-action"
            to={`/login?next=${encodeURIComponent("/reservations")}`}
          >
            로그인하기
          </Link>
        </main>
      </>
    );

  return (
    <>
      <Header />
      <main className="listing-page">
        <PageBack />
        <header>
          <span>MY QUEUE</span>
          <h1>내 예약</h1>
          <p>지금 줄서고 있는 부스 목록이에요.</p>
        </header>
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <div className="management-loading">
            <LoaderCircle /> 불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="catalog-empty">
            <Users />
            <h3>지금 줄서고 있는 부스가 없어요.</h3>
          </div>
        ) : (
          <section className="reservation-list">
            {items.map((entry) => (
              <article className="reservation-card" key={entry.id}>
                <i style={{ backgroundColor: entry.booths?.accent_color ?? "#ccc" }}>
                  {entry.booths?.logo_url ? (
                    <img src={entry.booths.logo_url} alt="" />
                  ) : (
                    entry.booths?.name?.slice(0, 1)
                  )}
                </i>
                <span>
                  <b>{entry.booths?.name ?? "부스"}</b>
                  <small>{entry.booths?.location ?? "위치 준비 중"}</small>
                  {entry.companion_student_numbers.length > 0 && (
                    <small>같이: {entry.companion_student_numbers.join(", ")}</small>
                  )}
                </span>
                <strong>{entry.queue_number}번</strong>
                <em className={entry.status}>
                  {entry.status === "called" ? "호출됨" : "대기 중"}
                </em>
                <button
                  disabled={busyId === entry.id}
                  onClick={() => void cancel(entry)}
                  aria-label="예약 취소"
                >
                  <X />
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
function BoothsPage() {
  const { festival, catalog, loading, error } = usePublicCatalog();
  if (loading) return <Loading />;
  if (error) return <ErrorPage message={error} />;
  if (!festival)
    return (
      <>
        <Header />
        <EmptyFestival />
      </>
    );
  return (
    <>
      <Header />
      <main className="listing-page">
        <PageBack />
        <header>
          <span>BOOTH DIRECTORY</span>
          <h1>부스</h1>
          <p>현재 공개된 부스와 운영 상태입니다.</p>
        </header>
        <section className="booth-list">
          {(catalog?.booths ?? []).map((booth) => {
            const category = catalog?.categories?.find(
              (candidate) => candidate.id === booth.category_id,
            );
            const CategoryIcon = getCategoryIcon(category?.code);
            return (
              <Link to={`/booths/${booth.id}`} key={booth.id}>
                {booth.logo_url ? (
                  <img src={booth.logo_url} alt="" />
                ) : (
                  <i style={{ backgroundColor: booth.accent_color }}>
                    <CategoryIcon />
                  </i>
                )}
                <span>
                  <b>{booth.name}</b>
                  <small>{booth.location ?? "위치 준비 중"}</small>
                </span>
                <em>{booth.status}</em>
                <ChevronRight />
              </Link>
            );
          })}
          {!(catalog?.booths ?? []).length && (
            <div className="catalog-empty">
              <MapPin />
              <h3>공개된 부스가 없어요.</h3>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
function BoothDetailPage() {
  const { boothId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const id = Number(boothId);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof getBoothDetail>
  > | null>(null);
  const [myQueue, setMyQueue] = useState<Tables<"queue_entries"> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionStatus, setCompanionStatus] = useState<
    Record<number, { state: "checking" | "ok" | "error"; note: string }>
  >({});
  const [error, setError] = useState("");

  const checkCompanion = async (index: number, rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      setCompanionStatus((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }
    if (value === "9999" || value === "9998") {
      setCompanionStatus((prev) => ({
        ...prev,
        [index]: { state: "error", note: "운영진 전용 학번이에요." },
      }));
      return;
    }
    setCompanionStatus((prev) => ({
      ...prev,
      [index]: { state: "checking", note: "확인 중…" },
    }));
    try {
      const found = await lookupStudentByNumber(value);
      setCompanionStatus((prev) => ({
        ...prev,
        [index]: found
          ? { state: "ok", note: found.display_name }
          : { state: "error", note: "등록된 계정이 없어요." },
      }));
    } catch {
      setCompanionStatus((prev) => ({
        ...prev,
        [index]: { state: "error", note: "확인하지 못했어요." },
      }));
    }
  };

  const refresh = useCallback(async () => {
    try {
      const data = await getBoothDetail(id);
      setDetail(data);
      setMyQueue(user ? await getMyQueueEntry(id, user.id) : null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "부스 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    void getBoothDetail(id)
      .then(async (data) => {
        setDetail(data);
        setMyQueue(user ? await getMyQueueEntry(id, user.id) : null);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "부스 정보를 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id, user]);
  useEffect(() => {
    if (Number.isNaN(id)) return;
    return subscribeToBoothOperations(id, () => void refresh());
  }, [id, refresh]);

  const join = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/booths/${id}`)}`);
      return;
    }
    const values = companions.map((value) => value.trim()).filter(Boolean);
    const hasUnresolved = companions.some(
      (value, index) => value.trim() && companionStatus[index]?.state !== "ok",
    );
    if (hasUnresolved) {
      setError("모든 친구 학번을 먼저 확인해 주세요.");
      return;
    }
    setJoining(true);
    setError("");
    try {
      await joinQueue(id, values);
      setCompanions([]);
      setCompanionStatus({});
      await refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(
        message.includes("Unknown student numbers")
          ? "등록되지 않은 학번이 있어요. 다시 확인해 주세요."
          : message.includes("Reserved student numbers")
            ? "운영진 학번(9999, 9998)은 같이 줄서기에 추가할 수 없어요."
            : message.includes("Cannot add yourself")
              ? "본인 학번은 추가할 수 없어요."
              : message.includes("Already in queue")
                ? "이미 이 부스에 줄서고 있어요."
                : message || "줄서기에 실패했습니다.",
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Loading />;
  if (!detail?.booth)
    return (
      <>
        <Header />
        <main className="listing-page simple-page">
          <h1>부스를 찾을 수 없어요.</h1>
          <Link to="/booths">부스 목록</Link>
        </main>
      </>
    );
  const { booth, inventory, announcements, waitingCount } = detail;
  const waitMinutes = estimateWaitMinutes(booth, waitingCount);
  return (
    <>
      <Header />
      <main className="detail-page">
        <PageBack fallback="/booths" label="부스 목록" />
        {booth.cover_url && (
          <img className="booth-cover-image" src={booth.cover_url} alt="" />
        )}
        <span>{booth.status.toUpperCase()}</span>
        <h1>
          {booth.logo_url ? (
            <img className="booth-logo-inline" src={booth.logo_url} alt="" />
          ) : (
            <Store className="booth-logo-inline booth-logo-fallback" />
          )}
          {booth.name}
        </h1>
        <p>
          {booth.description ?? booth.short_description ?? "상세 설명이 아직 등록되지 않았습니다."}
        </p>
        <dl>
          <div>
            <dt>위치</dt>
            <dd>{booth.location ?? "안내 예정"}</dd>
          </div>
          <div>
            <dt>예상 대기</dt>
            <dd>{waitMinutes > 0 ? `${waitMinutes}분` : "대기 없음"}</dd>
          </div>
        </dl>
        {error && <p className="form-error">{error}</p>}
        <section className="booth-queue-card">
          {myQueue ? (
            <>
              <span>MY QUEUE</span>
              <strong>{myQueue.queue_number}번</strong>
              <p>
                {myQueue.party_size > 1 ? `${myQueue.party_size}명 · ` : ""}
                {myQueue.status === "called"
                  ? "지금 호출됐어요! 부스로 와주세요."
                  : "대기 중이에요. 순서가 되면 알려드릴게요."}
              </p>
              {myQueue.companion_student_numbers.length > 0 && (
                <p>같이: {myQueue.companion_student_numbers.join(", ")}</p>
              )}
            </>
          ) : booth.status === "open" && booth.queue_enabled ? (
            <>
              <div className="party-size-field">
                <span>같이 줄 설 친구 학번</span>
                {companions.map((value, index) => (
                  <div className="companion-input-group" key={index}>
                    <div className="companion-input">
                      <input
                        value={value}
                        maxLength={4}
                        placeholder="학번 4자리"
                        onChange={(event) => {
                          const next = [...companions];
                          next[index] = event.target.value;
                          setCompanions(next);
                          setCompanionStatus((prev) => {
                            const nextStatus = { ...prev };
                            delete nextStatus[index];
                            return nextStatus;
                          });
                        }}
                        onBlur={(event) =>
                          void checkCompanion(index, event.target.value)
                        }
                      />
                      <button
                        type="button"
                        aria-label="삭제"
                        onClick={() => {
                          setCompanions(
                            companions.filter((_, i) => i !== index),
                          );
                          setCompanionStatus((prev) => {
                            const nextStatus: typeof prev = {};
                            Object.entries(prev).forEach(([key, val]) => {
                              const k = Number(key);
                              if (k < index) nextStatus[k] = val;
                              else if (k > index) nextStatus[k - 1] = val;
                            });
                            return nextStatus;
                          });
                        }}
                      >
                        <X />
                      </button>
                    </div>
                    {companionStatus[index] && (
                      <small
                        className={`companion-status-${companionStatus[index].state}`}
                      >
                        {companionStatus[index].note}
                      </small>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="companion-add"
                  disabled={companions.length >= 19}
                  onClick={() => setCompanions([...companions, ""])}
                >
                  <Plus /> 친구 추가
                </button>
                <small>
                  나까지 총{" "}
                  {companions.filter((value) => value.trim()).length + 1}명
                </small>
              </div>
              <button
                className="primary-action"
                onClick={() => void join()}
                disabled={joining}
              >
                <Users /> {joining ? "접수 중…" : "줄서기"}
              </button>
            </>
          ) : (
            <p>지금은 줄서기를 받지 않는 부스예요.</p>
          )}
        </section>
        {inventory.length > 0 && (
          <section className="booth-stock">
            <h2>운영 현황</h2>
            <ul>
              {inventory.map((item) => (
                <li
                  key={item.id}
                  className={item.quantity <= item.low_stock_at ? "low" : ""}
                >
                  <span>{item.name}</span>
                  <b>{item.quantity > 0 ? `${item.quantity}개 남음` : "품절"}</b>
                </li>
              ))}
            </ul>
          </section>
        )}
        {announcements.length > 0 && (
          <section className="booth-announcements">
            <h2>공지</h2>
            {announcements.map((item) => (
              <article key={item.id}>
                <b>{item.title}</b>
                <p>{item.body}</p>
              </article>
            ))}
          </section>
        )}
        <Link className="secondary-action booth-report-link" to={`/report?booth=${id}`}>
          <AlertTriangle /> 이 부스 문제 신고하기
        </Link>
      </main>
    </>
  );
}
function ErrorPage({ message }: { message: string }) {
  return (
    <main className="empty-festival">
      <Header />
      <section>
        <h1>불러오지 못했어요.</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
function RoleRoute({
  allow,
  children,
}: {
  allow: FestivalRole[];
  children: ReactNode;
}) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <Loading />;
  if (!auth.user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (
    !auth.activeMembership ||
    !auth.activeRoles.some((role) => allow.includes(role as FestivalRole))
  )
    return <Navigate to="/" replace />;
  return children;
}
const STAFF_ROLES: FestivalRole[] = ["owner", "admin", "staff", "booth_operator"];

function StudentRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <Loading />;
  if (
    auth.user &&
    auth.activeRoles.some((role) => STAFF_ROLES.includes(role as FestivalRole))
  ) {
    const target = auth.activeRoles.includes("booth_operator" as FestivalRole)
      ? "/booth"
      : "/admin";
    return <Navigate to={target} replace />;
  }
  return children;
}
export function AppRoutes({ home }: { home: ReactNode }) {
  return (
    <Routes>
      <Route path="/" element={<StudentRoute>{home}</StudentRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/report" element={<StudentRoute><ReportPage /></StudentRoute>} />
      <Route path="/programs" element={<Navigate to="/schedule" replace />} />
      <Route path="/programs/:programId" element={<Navigate to="/schedule" replace />} />
      <Route path="/schedule" element={<StudentRoute><SchedulePage /></StudentRoute>} />
      <Route path="/schedule/:programId" element={<StudentRoute><ProgramDetailPage /></StudentRoute>} />
      <Route path="/teams" element={<StudentRoute><TeamsPage /></StudentRoute>} />
      <Route path="/reservations" element={<StudentRoute><ReservationsPage /></StudentRoute>} />
      <Route path="/booths" element={<StudentRoute><BoothsPage /></StudentRoute>} />
      <Route path="/booths/:boothId" element={<StudentRoute><BoothDetailPage /></StudentRoute>} />
      <Route path="/map" element={<Navigate to="/booths" replace />} />
      <Route
        path="/booth"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothShell><BoothDashboard /></BoothShell>
          </RoleRoute>
        }
      />
      <Route
        path="/booth/check-in"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothShell><BoothDisplaySetupPage /></BoothShell>
          </RoleRoute>
        }
      />
      <Route path="/booth/:boothId/display" element={<BoothDisplayPage />} />
      <Route path="/check-in" element={<StudentRoute><StudentCheckinPage /></StudentRoute>} />
      <Route
        path="/booth/queue"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothShell><BoothQueuePage /></BoothShell>
          </RoleRoute>
        }
      />
      <Route
        path="/booth/inventory"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothShell><BoothInventoryPage /></BoothShell>
          </RoleRoute>
        }
      />
      <Route
        path="/booth/settings"
        element={
          <RoleRoute allow={["owner", "admin", "booth_operator"]}>
            <BoothShell><BoothSettingsPage /></BoothShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminShell><AdminDashboard /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/festival"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><AdminFestivalSettingsPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><AdminCategoriesPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/categories/new"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><NewCategoryPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/permissions"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><AdminPermissionsPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminShell><AdminAnnouncementsPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/booths"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminShell><AdminProgramsPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/booths/new"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminShell><NewProgramPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route path="/admin/schedule" element={<RoleRoute allow={["owner", "admin", "staff"]}><AdminShell><AdminSchedulePage /></AdminShell></RoleRoute>} />
      <Route path="/admin/schedule/new" element={<RoleRoute allow={["owner", "admin", "staff"]}><AdminShell><NewSchedulePage /></AdminShell></RoleRoute>} />
      <Route path="/admin/programs" element={<Navigate to="/admin/booths" replace />} />
      <Route path="/admin/programs/new" element={<Navigate to="/admin/booths/new" replace />} />
      <Route
        path="/admin/teams"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><AdminTeamsPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/teams/new"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><NewTeamPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/teams/:teamId"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminShell><EditTeamPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route
        path="/admin/issues"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminShell><AdminIssuesPage /></AdminShell>
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
