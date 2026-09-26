import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  LayoutDashboard,
  LogIn,
  Megaphone,
  Package,
  QrCode,
  Search,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "./assets/cbfesta-logo.png";
import mockupBooth from "./assets/launch/mockup-booth.png";
import mockupSchedule from "./assets/launch/mockup-schedule.png";
import mockupRanking from "./assets/launch/mockup-ranking.png";
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

const FEATURE_SECTIONS = [
  {
    eyebrow: "BOOTHS & QUEUEING",
    title: (
      <>
        부스를 한눈에,
        <br />
        줄은 스마트하게.
      </>
    ),
    body: "지도 대신 검색 한 번으로 부스를 찾고, 현장에 줄을 서지 않아도 학번만 알면 친구와 함께 원격으로 줄을 설 수 있어요. 방문을 마치면 별점도 남길 수 있어요.",
    image: mockupBooth,
  },
  {
    eyebrow: "LIVE SCHEDULE",
    title: (
      <>
        시간표가 아니라
        <br />
        실시간 타임라인.
      </>
    ),
    body: "공연, 행사, 부스 운영 시간이 하루 단위 타임라인으로 정리돼요. 관리자가 수정하면 학생 화면에 그대로 반영됩니다.",
    image: mockupSchedule,
  },
  {
    eyebrow: "RANKINGS",
    title: (
      <>
        팀, 개인, 부스까지
        <br />
        모든 순위를 한 곳에서.
      </>
    ),
    body: "팀 점수 순위는 물론, 미션으로 쌓은 개인 점수, 별점으로 쌓인 부스 인기 순위까지 세 가지 랭킹을 한 화면에서 확인할 수 있어요.",
    image: mockupRanking,
  },
];

const OPERATOR_FEATURES = [
  { icon: LayoutDashboard, label: "운영 현황판", detail: "체크인, 대기열, 신고 현황을 한 화면에서" },
  { icon: QrCode, label: "QR 체크인", detail: "부스마다 고유 QR로 빠른 참여 확인" },
  { icon: Package, label: "재고 관리", detail: "품절 임박 재고를 실시간으로 추적" },
  { icon: Star, label: "부스 평점", detail: "방문객이 남긴 별점이 곧바로 반영" },
  { icon: Coins, label: "광고 코인", detail: "별점으로 쌓은 코인으로 홈 화면 광고 구매" },
  { icon: Megaphone, label: "공지 발송", detail: "긴급 공지를 전체 화면 상단에 즉시 노출" },
];

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

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
        <Reveal className="launch-hero">
          <span>FESTIVAL OPERATIONS PLATFORM</span>
          <h1>
            부스도, 줄도, 랭킹도.
            <br />
            축제의 모든 순간을 하나로.
          </h1>
          <p>
            CBFESTA는 학교 축제를 운영하는 오픈소스 플랫폼이에요. 학생은 부스를
            찾고 줄을 서고 랭킹을 확인하고, 부스 운영자는 현장을 관리하고,
            관리자는 축제 전체를 한 화면에서 통제해요.
          </p>
          <div className="launch-hero-actions">
            <Link className="primary-action" to="/login">
              <LogIn /> 로그인하고 둘러보기
            </Link>
            <span className="launch-hero-note">지금은 사름제-2026을 준비하고 있어요.</span>
          </div>
        </Reveal>

        {FEATURE_SECTIONS.map((feature, index) => (
          <Reveal
            className={`launch-feature ${index % 2 === 1 ? "reverse" : ""}`}
            key={feature.eyebrow}
          >
            <div className="launch-feature-text">
              <span>{feature.eyebrow}</span>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </div>
            <div className="launch-feature-visual">
              <div className="launch-device-frame">
                <img src={feature.image} alt="" />
              </div>
            </div>
          </Reveal>
        ))}

        <Reveal className="launch-operator">
          <div className="launch-highlights-head">
            <span>FOR OPERATORS</span>
            <h2>현장은 운영진의 손끝에서.</h2>
          </div>
          <div className="launch-operator-grid">
            {OPERATOR_FEATURES.map((item, index) => (
              <Reveal
                className="launch-operator-card"
                delay={index * 60}
                key={item.label}
              >
                <item.icon />
                <b>{item.label}</b>
                <small>{item.detail}</small>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal className="launch-highlights">
          <div className="launch-highlights-head">
            <span>지난 사름제</span>
            <h2>이 플랫폼으로 열렸던 축제들</h2>
          </div>
          <div className="launch-video-grid">
            {HIGHLIGHT_VIDEOS.map((videoId) => (
              <div className="launch-video" key={videoId}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="사름제 하이라이트 영상"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="launch-cta">
          <Trophy />
          <h2>지금 로그인하고 시작하세요.</h2>
          <p>운영진이 축제를 공개하면 부스, 일정, 랭킹이 모두 이 자리에 나타나요.</p>
          <Link className="primary-action" to="/login">
            <LogIn /> 로그인
          </Link>
        </Reveal>
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
