import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  LogIn,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "./assets/cbfesta-logo.png";
import type { Tables } from "./lib/supabase/database.types";
import {
  getAnnouncements,
  getCurrentFestival,
  getFestivalCatalog,
  subscribeToFestival,
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
  const [announcements, setAnnouncements] = useState<Tables<"announcements">[]>([]);
  const [tickerDismissed, setTickerDismissed] = useState(false);
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
        if (current) {
          const [catalogData, announcementData] = await Promise.all([
            getFestivalCatalog(current.id),
            getAnnouncements(current.id),
          ]);
          if (cancelled) return;
          setCatalog(catalogData);
          setAnnouncements(announcementData);
        } else {
          setCatalog(null);
          setAnnouncements([]);
        }
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
  useEffect(() => {
    if (!festival) return;
    return subscribeToFestival(festival.id, () => {
      void getFestivalCatalog(festival.id).then(setCatalog);
      void getAnnouncements(festival.id).then(setAnnouncements);
    });
  }, [festival]);
  const booths = useMemo(
    () =>
      (catalog?.booths ?? []).filter((booth) =>
        `${booth.name} ${booth.short_description ?? ""} ${booth.location ?? ""}`
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
            운영진이 단일 축제 설정을 완료하면 부스와 일정이 이곳에
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
          <Link to="/booths">BOOTHS</Link>
          <Link to="/schedule">SCHEDULE</Link>
          <Link to="/teams">TEAMS</Link>
          <Link to="/map">MAP</Link>
          <Link to="/report">REPORT</Link>
        </nav>
        <div className="header-tools">
          <Link
            className="login-button"
            to={auth.user ? roleRoute(role) : "/login"}
          >
            {auth.user ? (
              <>
                <ShieldCheck />
                <span className="account-label">
                  <small>{role === "admin" || role === "owner" ? "ADMIN" : role === "booth_operator" ? "BOOTH DESK" : "MY ACCOUNT"}</small>
                  <b>{auth.user.user_metadata.full_name ?? "내 공간"}</b>
                </span>
              </>
            ) : (
              <>
                <LogIn /> 로그인
              </>
            )}
          </Link>
        </div>
      </header>
      {announcements.length > 0 && !tickerDismissed && (
        <div className="ticker">
          <b>{announcements[0].priority === "urgent" ? "긴급 공지" : "공지"}</b>
          {announcements.slice(0, 3).map((item) => (
            <span key={item.id}>{item.title}</span>
          ))}
          <button onClick={() => setTickerDismissed(true)} aria-label="공지 닫기">
            <X />
          </button>
        </div>
      )}
      <main>
        <section className="festival-hero">
          <div>
            <span>
              {formatDate(festival.starts_at)} · {festival.status.toUpperCase()}
            </span>
            <h1>{festival.name}</h1>
            <p>지금 열려 있는 부스와 축제 일정을 확인하세요.</p>
            <div className="hero-actions">
              <Link className="primary-action" to="/booths">
                <Search /> 부스 둘러보기
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
                <dt>SCHEDULE</dt>
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
              <h2>부스</h2>
            </div>
            <label className="catalog-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="부스 검색"
              />
            </label>
          </header>
          {booths.length === 0 ? (
            <div className="catalog-empty">
              <CalendarDays />
              <h3>
                {query
                  ? "검색 결과가 없어요."
                  : "공개된 부스가 아직 없어요."}
              </h3>
            </div>
          ) : (
            <div className="program-grid">
              {booths.map((booth) => (
                <Link
                  className="live-program-card"
                  to={`/booths/${booth.id}`}
                  key={booth.id}
                >
                  <div
                    className="program-cover"
                    style={{
                      backgroundColor:
                        catalog?.categories?.find(
                          (category) => category.id === booth.category_id,
                        )?.color ?? "#f0e4e9",
                    }}
                  >
                    <span>BOOTH</span>
                    <b>{booth.status.toUpperCase()}</b>
                  </div>
                  <small>
                    {catalog?.categories?.find(
                      (category) => category.id === booth.category_id,
                    )?.name ?? "FESTIVAL BOOTH"}
                  </small>
                  <h3>{booth.name}</h3>
                  <p>
                    {booth.short_description ?? booth.location ?? "부스 안내 보기"}
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
