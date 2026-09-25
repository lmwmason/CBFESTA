import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Search,
  Users,
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
  getBoothDetail,
  getCurrentFestival,
  getFestivalCatalog,
  getMyQueueEntry,
  joinQueue,
  subscribeToBoothOperations,
  subscribeToFestival,
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
import { ReportForm } from "../features/reports/ReportSheet";
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
        <Link to="/map">MAP</Link>
        <Link to="/report">REPORT</Link>
        <Link to="/login">ACCOUNT</Link>
      </nav>
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
    if (user && next) navigate(next, { replace: true });
  }, [user, next, navigate]);
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
          {programs.map((item) => (
            <Link to={`/programs/${item.id}`} key={item.id}>
              <div
                className="listing-thumb"
                style={{
                  backgroundColor:
                    catalog?.categories?.find(
                      (category) => category.id === item.category_id,
                    )?.color ?? "#f0e4e9",
                }}
              >
                <b>{item.kind.toUpperCase()}</b>
              </div>
              <small>
                {catalog?.categories?.find(
                  (category) => category.id === item.category_id,
                )?.name ?? item.kind}
              </small>
              <h2>{item.title}</h2>
              <p>{item.description ?? "상세 정보 보기"}</p>
            </Link>
          ))}
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
          {(catalog?.booths ?? []).map((booth) => (
            <Link to={`/booths/${booth.id}`} key={booth.id}>
              <i style={{ backgroundColor: booth.accent_color }} />
              <span>
                <b>{booth.name}</b>
                <small>{booth.location ?? "위치 준비 중"}</small>
              </span>
              <em>{booth.status}</em>
              <ChevronRight />
            </Link>
          ))}
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
  const [error, setError] = useState("");

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
    setJoining(true);
    setError("");
    try {
      await joinQueue(id);
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "줄서기에 실패했습니다.",
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
  const { booth, inventory, announcements } = detail;
  return (
    <>
      <Header />
      <main className="detail-page">
        <PageBack fallback="/booths" label="부스 목록" />
        <span>{booth.status.toUpperCase()}</span>
        <h1>{booth.name}</h1>
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
            <dd>
              {booth.estimated_wait_minutes > 0
                ? `${booth.estimated_wait_minutes}분`
                : "대기 없음"}
            </dd>
          </div>
        </dl>
        {error && <p className="form-error">{error}</p>}
        <section className="booth-queue-card">
          {myQueue ? (
            <>
              <span>MY QUEUE</span>
              <strong>{myQueue.queue_number}번</strong>
              <p>
                {myQueue.status === "called"
                  ? "지금 호출됐어요! 부스로 와주세요."
                  : "대기 중이에요. 순서가 되면 알려드릴게요."}
              </p>
            </>
          ) : booth.status === "open" ? (
            <button
              className="primary-action"
              onClick={() => void join()}
              disabled={joining}
            >
              <Users /> {joining ? "접수 중…" : "줄서기"}
            </button>
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
function MapPage() {
  return <BoothsPage />;
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
export function AppRoutes({ home }: { home: ReactNode }) {
  return (
    <Routes>
      <Route path="/" element={home} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/programs" element={<Navigate to="/schedule" replace />} />
      <Route path="/programs/:programId" element={<Navigate to="/schedule" replace />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/schedule/:programId" element={<ProgramDetailPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/booths" element={<BoothsPage />} />
      <Route path="/booths/:boothId" element={<BoothDetailPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route
        path="/booth"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/check-in"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothDisplaySetupPage />
          </RoleRoute>
        }
      />
      <Route path="/booth/:boothId/display" element={<BoothDisplayPage />} />
      <Route path="/check-in" element={<StudentCheckinPage />} />
      <Route
        path="/booth/queue"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothQueuePage />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/inventory"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <BoothInventoryPage />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/settings"
        element={
          <RoleRoute allow={["owner", "admin", "booth_operator"]}>
            <BoothSettingsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminCategoriesPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/categories/new"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <NewCategoryPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/permissions"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminPermissionsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminAnnouncementsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/booths"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminProgramsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/booths/new"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <NewProgramPage />
          </RoleRoute>
        }
      />
      <Route path="/admin/schedule" element={<RoleRoute allow={["owner", "admin", "staff"]}><AdminSchedulePage /></RoleRoute>} />
      <Route path="/admin/schedule/new" element={<RoleRoute allow={["owner", "admin", "staff"]}><NewSchedulePage /></RoleRoute>} />
      <Route path="/admin/programs" element={<Navigate to="/admin/booths" replace />} />
      <Route path="/admin/programs/new" element={<Navigate to="/admin/booths/new" replace />} />
      <Route
        path="/admin/teams"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <AdminTeamsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/teams/new"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <NewTeamPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/teams/:teamId"
        element={
          <RoleRoute allow={["owner", "admin"]}>
            <EditTeamPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/issues"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminIssuesPage />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
