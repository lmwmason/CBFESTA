import type { ReactNode } from "react";
import { Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  Trophy,
} from "lucide-react";
import brandLogo from "../assets/cbfesta-logo.png";
import demoTeamLogo from "../assets/team-logo-demo.png";
import { AdminDashboard, BoothDashboard } from "../RoleDashboards";
import { AuthSheet } from "../features/auth/AuthSheet";
import { FestivalOnboarding } from "../features/onboarding/FestivalOnboarding";
import { useAuth, type FestivalRole } from "../features/auth/auth-context";

function RouteHeader() {
  return (
    <header className="route-header">
      <Link to="/">
        <img src={brandLogo} alt="" />
        <b>CBFESTA</b>
      </Link>
      <nav>
        <Link to="/programs">PROGRAMS</Link>
        <Link to="/teams">TEAMS</Link>
        <Link to="/login">MY</Link>
      </nav>
    </header>
  );
}

function LoginPage() {
  const auth = useAuth();
  if (auth.loading) return <PageLoading />;
  if (auth.user && auth.memberships.length === 0) return <FestivalOnboarding />;
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
          학생은 프로그램과 팀 활동을, 운영자는 맡은 부스를, 관리자는 전체
          축제를 관리합니다.
        </p>
      </section>
      <AuthSheet />
    </main>
  );
}

function ExplorePage() {
  return (
    <>
      <RouteHeader />
      <main className="listing-page">
        <header>
          <span>EXPLORE</span>
          <h1>프로그램</h1>
          <p>공연, 미션, 먹거리와 전시를 한곳에서 찾으세요.</p>
        </header>
        <nav className="listing-filters">
          <button className="active">전체</button>
          <button>미션</button>
          <button>공연</button>
          <button>먹거리</button>
          <button>전시</button>
        </nav>
        <section className="listing-grid">
          {[
            "분식부스의 비밀 메뉴",
            "청룡 포토존 팀 인증",
            "밴드부 앙코르 암호",
            "방송실에서 온 전파",
          ].map((title, index) => (
            <Link to={`/programs/${index + 1}`} key={title}>
              <div className={`listing-thumb tone-${index}`}>
                <span>0{index + 1}</span>
                <b>{["TASTE", "POSE", "LOUD", "TUNE"][index]}</b>
              </div>
              <small>{["MISSION", "PHOTO", "LIVE", "SECRET"][index]}</small>
              <h2>{title}</h2>
              <p>
                <MapPin />{" "}
                {["운동장 A-04", "본관 중앙", "대강당", "위치 비공개"][index]}
              </p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}

function TeamsPage() {
  const teams = ["말랑여우", "파란불꽃", "오로라", "초록파도"];
  return (
    <>
      <RouteHeader />
      <main className="listing-page teams-page">
        <header>
          <span>LEADERBOARD</span>
          <h1>팀 랭킹</h1>
          <p>우리 팀의 색으로 함께 모은 점수를 확인하세요.</p>
        </header>
        <section className="leaderboard">
          {teams.map((team, index) => (
            <article key={team}>
              <strong>{index + 1}</strong>
              <img src={index === 0 ? demoTeamLogo : brandLogo} alt="" />
              <span>
                <b>{team}</b>
                <small>{18_420 - index * 2_130} P</small>
              </span>
              {index === 0 && (
                <em>
                  <Trophy /> LEADING
                </em>
              )}
              <ChevronRight />
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

function SimplePage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children?: ReactNode;
}) {
  return (
    <>
      <RouteHeader />
      <main className="listing-page simple-page">
        <header>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
        </header>
        {children ?? (
          <section className="empty-state">
            <CalendarDays />
            <h2>곧 이곳에서 관리할 수 있어요.</h2>
            <p>기능과 실제 축제 데이터를 연결하고 있습니다.</p>
          </section>
        )}
      </main>
    </>
  );
}

function PageLoading() {
  return (
    <div className="app-loading">
      <img src={brandLogo} alt="" />
      <span>Loading festival…</span>
    </div>
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
  if (auth.loading) return <PageLoading />;
  if (!auth.configured) return children;
  if (!auth.user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!auth.activeMembership) return <FestivalOnboarding />;
  if (!allow.includes(auth.activeMembership.role as FestivalRole))
    return <Navigate to="/" replace />;
  return children;
}

export function AppRoutes({ home }: { home: ReactNode }) {
  return (
    <Routes>
      <Route path="/" element={home} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/programs" element={<ExplorePage />} />
      <Route
        path="/programs/:programId"
        element={<SimplePage eyebrow="PROGRAM DETAIL" title="프로그램 상세" />}
      />
      <Route path="/teams" element={<TeamsPage />} />
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
            <SimplePage eyebrow="BOOTH DESK" title="참여 확인" />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/queue"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <SimplePage eyebrow="BOOTH DESK" title="대기 관리" />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/inventory"
        element={
          <RoleRoute allow={["owner", "admin", "staff", "booth_operator"]}>
            <SimplePage eyebrow="BOOTH DESK" title="재고 관리" />
          </RoleRoute>
        }
      />
      <Route
        path="/booth/settings"
        element={
          <RoleRoute allow={["owner", "admin", "booth_operator"]}>
            <SimplePage eyebrow="CUSTOMIZE" title="부스 꾸미기" />
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
            <AdminDashboard initialSection="categories" />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/permissions"
        element={
          <RoleRoute allow={["owner"]}>
            <AdminDashboard initialSection="permissions" />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <SimplePage eyebrow="CONTENT" title="프로그램 관리" />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/issues"
        element={
          <RoleRoute allow={["owner", "admin", "staff"]}>
            <SimplePage eyebrow="OPERATIONS" title="신고 및 이슈" />
          </RoleRoute>
        }
      />
      <Route
        path="*"
        element={
          <SimplePage eyebrow="404" title="페이지를 찾을 수 없어요">
            <Link className="primary-action" to="/">
              홈으로 이동
            </Link>
          </SimplePage>
        }
      />
    </Routes>
  );
}
