import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  LogIn,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "./assets/cbfesta-logo.png";
import type { Tables } from "./lib/supabase/database.types";
import {
  getCurrentFestival,
  getFestivalCatalog,
} from "./lib/supabase/services";
import { useAuth } from "./features/auth/auth-context";

type Catalog = Awaited<ReturnType<typeof getFestivalCatalog>>;
function Brand() {
  return (
    <Link className="brand" to="/">
      <img src={brandLogo} alt="CBFESTA" />
      <span>
        CBFESTA<small>FESTIVAL PLATFORM</small>
      </span>
    </Link>
  );
}
function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(new Date(value))
    : "축제 준비 중";
}
function roleRoute(role: string | undefined) {
  return role === "booth_operator"
    ? "/booth"
    : ["owner", "admin", "staff"].includes(role ?? "")
      ? "/admin"
      : "/teams";
}

export default function App() {
  const auth = useAuth();
  const [festival, setFestival] = useState<Tables<"festivals"> | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const membershipFestival = auth.activeMembership?.festivals;
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const current = membershipFestival ?? (await getCurrentFestival());
        if (cancelled) return;
        setFestival(current);
        setCatalog(current ? await getFestivalCatalog(current.id) : null);
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error
              ? caught.message
              : "축제 정보를 불러오지 못했습니다.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [membershipFestival]);
  const programs = useMemo(
    () =>
      (catalog?.programs ?? []).filter((program) =>
        `${program.title} ${program.description ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [catalog, query],
  );
  if (auth.loading || loading)
    return (
      <div className="app-loading">
        <img src={brandLogo} alt="" />
        <span>Loading festival…</span>
      </div>
    );
  if (error)
    return (
      <main className="empty-festival">
        <Brand />
        <section>
          <h1>연결할 수 없어요.</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  if (!festival)
    return (
      <main className="empty-festival">
        <Brand />
        <section>
          <CalendarDays />
          <span>FESTIVAL SETUP</span>
          <h1>축제를 준비하고 있어요.</h1>
          <p>
            운영진이 단일 축제 설정을 완료하면 프로그램과 부스가 이곳에
            표시됩니다.
          </p>
          {auth.user ? (
            <Link className="secondary-action" to="/login">
              내 계정
            </Link>
          ) : (
            <Link className="primary-action" to="/login">
              <LogIn /> 로그인
            </Link>
          )}
        </section>
      </main>
    );
  const role = auth.activeMembership?.role;
  return (
    <div className="site live-site">
      <header className="header">
        <Brand />
        <nav className="main-links">
          <Link to="/programs">PROGRAMS</Link>
          <Link to="/teams">TEAMS</Link>
          <Link to="/map">MAP</Link>
        </nav>
        <div className="header-tools">
          <Link
            className="login-button"
            to={auth.user ? roleRoute(role) : "/login"}
          >
            {auth.user ? (
              <>
                <ShieldCheck /> MY SPACE
              </>
            ) : (
              <>
                <LogIn /> 로그인
              </>
            )}
          </Link>
        </div>
      </header>
      <main>
        <section className="festival-hero">
          <div>
            <span>
              {formatDate(festival.starts_at)} · {festival.status.toUpperCase()}
            </span>
            <h1>{festival.name}</h1>
            <p>지금 열려 있는 프로그램과 부스를 찾아보세요.</p>
            <div className="hero-actions">
              <Link className="primary-action" to="/programs">
                <Search /> 프로그램 찾기
              </Link>
              {auth.user && (
                <Link className="secondary-action" to={roleRoute(role)}>
                  내 업무 공간 <ArrowRight />
                </Link>
              )}
            </div>
          </div>
          <aside>
            <b>LIVE DIRECTORY</b>
            <dl>
              <div>
                <dt>PROGRAMS</dt>
                <dd>{catalog?.programs?.length ?? 0}</dd>
              </div>
              <div>
                <dt>BOOTHS</dt>
                <dd>{catalog?.booths?.length ?? 0}</dd>
              </div>
              <div>
                <dt>TEAMS</dt>
                <dd>{catalog?.teams?.length ?? 0}</dd>
              </div>
            </dl>
          </aside>
        </section>
        <section className="live-catalog">
          <header>
            <div>
              <span>EXPLORE</span>
              <h2>프로그램</h2>
            </div>
            <label className="catalog-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="프로그램, 부스 검색"
              />
            </label>
          </header>
          {programs.length === 0 ? (
            <div className="catalog-empty">
              <CalendarDays />
              <h3>
                {query
                  ? "검색 결과가 없어요."
                  : "공개된 프로그램이 아직 없어요."}
              </h3>
            </div>
          ) : (
            <div className="program-grid">
              {programs.map((program) => (
                <Link
                  className="live-program-card"
                  to={`/programs/${program.id}`}
                  key={program.id}
                >
                  <div
                    className="program-cover"
                    style={{
                      backgroundColor:
                        catalog?.categories?.find(
                          (category) => category.id === program.category_id,
                        )?.color ?? "#f0e4e9",
                    }}
                  >
                    <span>{program.kind.toUpperCase()}</span>
                    <b>
                      {program.points > 0 ? `+${program.points} P` : "OPEN"}
                    </b>
                  </div>
                  <small>
                    {catalog?.categories?.find(
                      (category) => category.id === program.category_id,
                    )?.name ?? program.kind}
                  </small>
                  <h3>{program.title}</h3>
                  <p>
                    {program.description ?? "상세 정보 보기"}
                    <ArrowRight />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="teams-preview">
          <header>
            <div>
              <span>TEAM BOARD</span>
              <h2>현재 팀</h2>
            </div>
            <Link to="/teams">
              전체 랭킹 <ArrowRight />
            </Link>
          </header>
          {catalog?.teams?.length ? (
            <div>
              {(catalog?.teams ?? []).slice(0, 4).map((team, index) => (
                <article key={team.id}>
                  <b>{index + 1}</b>
                  <i style={{ backgroundColor: team.primary_color }} />{" "}
                  <span>{team.name}</span>
                  <strong>{team.score.toLocaleString()} P</strong>
                </article>
              ))}
            </div>
          ) : (
            <p>팀이 등록되면 이곳에 실시간 랭킹이 표시됩니다.</p>
          )}
        </section>
      </main>
    </div>
  );
}
