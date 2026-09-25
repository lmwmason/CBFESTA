import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  Search,
} from "lucide-react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import brandLogo from "../assets/cbfesta-logo.png";
import type { Tables } from "../lib/supabase/database.types";
import {
  getCurrentFestival,
  getFestivalCatalog,
} from "../lib/supabase/services";
import { AdminDashboard, BoothDashboard } from "../RoleDashboards";
import { AuthSheet } from "../features/auth/AuthSheet";
import {
  AdminCategoriesPage,
  NewCategoryPage,
} from "../features/admin/AdminCategoriesPage";
import { AdminPermissionsPage } from "../features/admin/AdminPermissionsPage";
import {
  AdminProgramsPage,
  NewProgramPage,
} from "../features/admin/AdminProgramsPage";
import {
  BoothDisplayPage,
  BoothDisplaySetupPage,
  StudentCheckinPage,
} from "../features/booth/BoothQrPages";
import { useAuth, type FestivalRole } from "../features/auth/auth-context";

type Catalog = Awaited<ReturnType<typeof getFestivalCatalog>>;
function Header() {
  return (
    <header className="route-header">
      <Link to="/">
        <img src={brandLogo} alt="" />
        <b>CBFESTA</b>
      </Link>
      <nav>
        <Link to="/programs">PROGRAMS</Link>
        <Link to="/teams">TEAMS</Link>
        <Link to="/map">MAP</Link>
        <Link to="/login">MY</Link>
      </nav>
    </header>
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
function ProgramsPage() {
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
        <header>
          <span>EXPLORE</span>
          <h1>프로그램</h1>
          <p>{festival.name}에서 지금 열려 있는 콘텐츠입니다.</p>
        </header>
        <label className="catalog-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="프로그램 검색"
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
              <h3>표시할 프로그램이 없어요.</h3>
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
          <Link to="/programs">프로그램 목록</Link>
        </main>
      </>
    );
  return (
    <>
      <Header />
      <main className="detail-page">
        <Link className="back-link" to="/programs">
          <ArrowLeft /> 프로그램 목록
        </Link>
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
function MapPage() {
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
        <header>
          <span>FESTIVAL MAP</span>
          <h1>부스 안내</h1>
          <p>현재 공개된 부스와 운영 상태입니다.</p>
        </header>
        <section className="booth-list">
          {(catalog?.booths ?? []).map((booth) => (
            <article key={booth.id}>
              <i style={{ backgroundColor: booth.accent_color }} />
              <span>
                <b>{booth.name}</b>
                <small>{booth.location ?? "위치 준비 중"}</small>
              </span>
              <em>{booth.status}</em>
              <ChevronRight />
            </article>
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
    !allow.includes(auth.activeMembership.role as FestivalRole)
  )
    return <Navigate to="/" replace />;
  return children;
}
function UnavailablePage({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <>
      <Header />
      <main className="listing-page simple-page">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>이 업무 영역은 축제 데이터와 연결되어 있습니다.</p>
      </main>
    </>
  );
}
export function AppRoutes({ home }: { home: ReactNode }) {
  return (
    <Routes>
      <Route path="/" element={home} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="/programs/:programId" element={<ProgramDetailPage />} />
      <Route path="/teams" element={<TeamsPage />} />
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
            <UnavailablePage eyebrow="BOOTH DESK" title="대기 관리" />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/inventory"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <UnavailablePage eyebrow="BOOTH DESK" title="재고 관리" />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/settings"
        element={
          <RoleRoute allow={["owner", "admin", "booth_operator"]}>
            <UnavailablePage eyebrow="CUSTOMIZE" title="부스 꾸미기" />
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
            <UnavailablePage eyebrow="ANNOUNCEMENTS" title="공지 관리" />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <AdminProgramsPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/programs/new"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <NewProgramPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/issues"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <UnavailablePage eyebrow="OPERATIONS" title="신고 및 이슈" />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
