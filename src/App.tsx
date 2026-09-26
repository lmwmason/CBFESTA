import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, LogIn, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "./assets/cbfesta-logo.png";
import type { Tables } from "./lib/supabase/database.types";
import {
  getActiveBoothAds,
  getAnnouncements,
  getBoothCurrencyLeaderboard,
  getCurrentFestival,
  getFestivalCatalog,
  getMyTeamMembership,
  getPersonalLeaderboard,
  subscribeToFestival,
} from "./lib/supabase/services";
import { useAuth } from "./features/auth/auth-context";
import { getCategoryIcon } from "./lib/categoryIcons";
import { AccountMenu } from "./components/AccountMenu";
import type { User } from "@supabase/supabase-js";

const HIGHLIGHT_VIDEOS = ["sEYQhS_GXsc", "TaY_Dk2yrqQ", "hETNL9O-Lng", "l31U7ixIOLI"];

function LaunchPage({ user }: { user: User | null }) {
  return (
    <div className="launch-page">
      <header className="header">
        <Brand />
        <div className="header-tools">
          <Link className="login-button" to="/login">
            <LogIn /> {user ? "내 계정" : "로그인"}
          </Link>
        </div>
      </header>
      <main className="launch-main">
        <section className="launch-hero">
          <span>SEE YOU SOON</span>
          <h1>
            사름제-2026,
            <br />곧 열립니다.
          </h1>
          <p>
            운영진이 축제를 공개하면 부스, 실시간 일정, 줄서기, 랭킹이 모두 이
            자리에 나타나요. 그 전에 지난 축제의 순간들을 먼저 만나보세요.
          </p>
          <Link className="primary-action" to="/login">
            <LogIn /> 로그인하고 준비하기
          </Link>
        </section>
        <section className="launch-highlights">
          <div className="launch-highlights-head">
            <span>HIGHLIGHTS</span>
            <h2>지난 축제 하이라이트</h2>
          </div>
          <div className="launch-video-grid">
            {HIGHLIGHT_VIDEOS.map((videoId) => (
              <div className="launch-video" key={videoId}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="CBFESTA 지난 축제 하이라이트 영상"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

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
export default function App() {
  const auth = useAuth();
  const [festival, setFestival] = useState<Tables<"festivals"> | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [announcements, setAnnouncements] = useState<Tables<"announcements">[]>([]);
  const [ads, setAds] = useState<Awaited<ReturnType<typeof getActiveBoothAds>>>([]);
  const [personal, setPersonal] = useState<
    Awaited<ReturnType<typeof getPersonalLeaderboard>>
  >([]);
  const [boothBoard, setBoothBoard] = useState<
    Awaited<ReturnType<typeof getBoothCurrencyLeaderboard>>
  >([]);
  const [myTeam, setMyTeam] = useState<Awaited<
    ReturnType<typeof getMyTeamMembership>
  > | null>(null);
  const [tickerDismissed, setTickerDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const membershipFestival = auth.activeMembership?.festivals;
  const userId = auth.user?.id;
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
          const [catalogData, announcementData, adData, personalData, boothBoardData] =
            await Promise.all([
              getFestivalCatalog(current.id),
              getAnnouncements(current.id),
              getActiveBoothAds(current.id),
              getPersonalLeaderboard(current.id),
              getBoothCurrencyLeaderboard(current.id),
            ]);
          if (cancelled) return;
          setCatalog(catalogData);
          setAnnouncements(announcementData);
          setAds(adData);
          setPersonal(personalData);
          setBoothBoard(boothBoardData);
        } else {
          setCatalog(null);
          setAnnouncements([]);
          setAds([]);
          setPersonal([]);
          setBoothBoard([]);
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
      void getActiveBoothAds(festival.id).then(setAds);
    });
  }, [festival]);
  useEffect(() => {
    void (async () => {
      if (!userId) {
        setMyTeam(null);
        return;
      }
      setMyTeam(await getMyTeamMembership(userId));
    })();
  }, [userId]);
  const booths = useMemo(
    () =>
      (catalog?.booths ?? []).filter((booth) =>
        `${booth.name} ${booth.short_description ?? ""} ${booth.location ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [catalog, query],
  );
  if (auth.loading)
    return (
      <div className="app-loading">
        <img src={brandLogo} alt="" />
        <span>Loading festival…</span>
      </div>
    );
  if (!auth.user) return <LaunchPage user={null} />;
  if (loading)
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
  if (!festival) return <LaunchPage user={auth.user} />;
  return (
    <div className="site live-site">
      <header className="header">
        <Brand />
        <nav className="main-links">
          <Link to="/booths">BOOTHS</Link>
          <Link to="/schedule">SCHEDULE</Link>
          <Link to="/teams">RANKING</Link>
          <Link to="/reservations">MY QUEUE</Link>
          <Link to="/report">REPORT</Link>
        </nav>
        <div className="header-tools">
          <AccountMenu />
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
        {ads.length > 0 && (
          <section className="ad-banner">
            {ads.map((ad) =>
              ad.image_url ? (
                <Link key={ad.id} to={`/booths/${ad.booth_id}`}>
                  <img src={ad.image_url} alt={ad.booths?.name ?? "부스 광고"} />
                </Link>
              ) : null,
            )}
          </section>
        )}
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
                <Link className="secondary-action" to="/teams/mine">
                  {myTeam?.teams
                    ? `내 팀 · ${myTeam.teams.name}`
                    : "내 팀"}{" "}
                  <ArrowRight />
                </Link>
              )}
            </div>
          </div>
          <aside>
            <b>RANKING</b>
            <div className="hero-rankings">
              <div>
                <span>팀</span>
                <ol>
                  {(catalog?.teams ?? []).slice(0, 3).map((team, index) => (
                    <li key={team.id} className={`rank-${index + 1}`}>
                      <em>{index + 1}</em>
                      {team.logo_url ? (
                        <img src={team.logo_url} alt="" />
                      ) : (
                        <i style={{ backgroundColor: team.primary_color }} />
                      )}
                      <b>{team.name}</b>
                    </li>
                  ))}
                  {(catalog?.teams ?? []).length === 0 && <li className="empty">-</li>}
                </ol>
              </div>
              <div>
                <span>개인</span>
                <ol>
                  {personal.slice(0, 3).map((row, index) => (
                    <li key={row.user_id} className={`rank-${index + 1}`}>
                      <em>{index + 1}</em>
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt="" />
                      ) : (
                        <i className="fallback">
                          {row.display_name.slice(0, 1)}
                        </i>
                      )}
                      <b>{row.display_name}</b>
                    </li>
                  ))}
                  {personal.length === 0 && <li className="empty">-</li>}
                </ol>
              </div>
              <div>
                <span>부스</span>
                <ol>
                  {boothBoard.slice(0, 3).map((booth, index) => (
                    <li key={booth.id} className={`rank-${index + 1}`}>
                      <em>{index + 1}</em>
                      {booth.logo_url ? (
                        <img src={booth.logo_url} alt="" />
                      ) : (
                        <i style={{ backgroundColor: booth.accent_color }} />
                      )}
                      <b>{booth.name}</b>
                    </li>
                  ))}
                  {boothBoard.length === 0 && <li className="empty">-</li>}
                </ol>
              </div>
            </div>
            <Link className="hero-ranking-link" to="/teams">
              전체 랭킹 보기 <ArrowRight />
            </Link>
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
            <div className="shop-grid">
              {booths.map((booth) => {
                const category = catalog?.categories?.find(
                  (candidate) => candidate.id === booth.category_id,
                );
                const CategoryIcon = getCategoryIcon(category?.code);
                return (
                  <Link className="shop-card" to={`/booths/${booth.id}`} key={booth.id}>
                    <div
                      className="shop-card-cover"
                      style={
                        booth.cover_url
                          ? { backgroundImage: `url(${booth.cover_url})` }
                          : { backgroundColor: booth.accent_color }
                      }
                    >
                      {!booth.cover_url && <CategoryIcon />}
                    </div>
                    <div className="shop-card-caption">
                      {booth.logo_url ? (
                        <img className="shop-card-logo" src={booth.logo_url} alt="" />
                      ) : (
                        <i
                          className="shop-card-logo shop-card-logo-fallback"
                          style={{ backgroundColor: booth.accent_color }}
                        >
                          {booth.name.slice(0, 1)}
                        </i>
                      )}
                      <span>
                        <small>{category?.name ?? "FESTIVAL BOOTH"}</small>
                        <b>{booth.name}</b>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
