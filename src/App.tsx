import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { ArrowRight, CalendarDays, LogIn, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import brandLogo from "./assets/cbfesta-logo.png";
import heroDevice from "./assets/launch/hero-device-3d.webp";
import deviceSchedule from "./assets/launch/device-schedule.webp";
import deviceRanking from "./assets/launch/device-ranking.webp";
import adminDashboard from "./assets/launch/admin-dashboard.webp";
import boothDashboard from "./assets/launch/booth-dashboard.webp";
import fieldControl from "./assets/launch/field-control-recreated.webp";
import fieldQr from "./assets/launch/field-qr-recreated.webp";
import fieldBoothStatus from "./assets/launch/field-booth-status-recreated.webp";
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
    image: fieldQr,
    type: "field",
  },
  {
    image: fieldControl,
    type: "field",
  },
  {
    image: fieldBoothStatus,
    type: "field",
  },
];

type LaunchLanguage = "ko" | "en";

const LAUNCH_COPY = {
  ko: {
    login: "로그인", account: "내 계정", language: "EN",
    heroEyebrow: "충북과학고 축제 플랫폼",
    heroTitle: ["부스도, 줄도, 랭킹도.", "축제의 모든 순간을", "하나로."],
    heroBody: "CBFESTA는 학교 축제를 운영하는 오픈소스 플랫폼이에요. 학생은 부스를 찾고 줄을 서고 랭킹을 확인하고, 부스 운영자는 현장을 관리하고, 관리자는 축제 전체를 한 화면에서 통제해요.",
    heroAction: "로그인하고 둘러보기", heroNote: "지금은 사름제-2026을 준비하고 있어요.",
    productEyebrow: "모두가 같은 축제를 봐요", productTitle: ["축제 전체가,", "하나의 화면으로."],
    productBody: "학생에게는 가장 편한 축제 앱으로, 운영진에게는 가장 믿을 수 있는 현장 시스템으로.",
    appEyebrow: "손안의 축제", appTitle: ["보고 싶은 축제를,", "바로 꺼내 보세요."], appBody: "부스, 일정, 랭킹. 필요한 순간에 필요한 정보가 앱 안에 있어요.",
    features: [
      ["학생", "부스와 공연, 대기열을 실시간으로 보고 방문한 부스와 미션 기록도 앱에서 바로 확인해요."],
      ["축제 운영진", "전체 공지부터 공연 일정, 부스 상황까지 수정하는 즉시 축제 전체 화면에 반영해요."],
      ["부스 운영자", "대기열과 재고 상태를 알리고, 별점으로 쌓은 코인으로 광고 자리까지 직접 운영해요."],
    ],
    controlEyebrow: "축제 상황판", controlTitle: ["모니터 하나면,", "현장이 보입니다."],
    controlBody: "공지, 공연, 대기열, 부스 상태, QR 체크인까지. 운영진은 필요한 정보를 한 화면에서 관리하고, 바뀐 내용은 학생 앱과 부스 화면에 바로 닿아요.",
    controlItems: "공지 · 일정 · 대기열 · 부스 상태", controlQR: "QR 체크인 화면으로 바로 띄우기",
    workspaceEyebrow: "운영자를 위한 화면", workspaceTitle: "현장은 빠르게, 관리는 차분하게.", workspaceBody: "관리자와 부스 운영자는 지금 필요한 정보를 한곳에서 확인하고 바로 처리해요.", adminLabel: "축제 관리자", adminDetail: "전체 축제의 일정, 공지, 부스, 권한을 관리", boothLabel: "부스 운영자", boothDetail: "대기열, 체크인, 재고, 광고를 현장에서 관리",
    statementEyebrow: "부스 광고", statementTitle: ["별점이,", "곧 코인이에요."], statementBody: "방문객의 별점만큼 부스에 코인이 쌓이고, 그 코인으로 홈 화면 광고 자리를 직접 사요.",
    ossEyebrow: "오픈소스", ossTitle: ["누구나 자신의", "축제를 열 수 있게."], ossBody: "학교, 동아리, 동네 축제까지. 필요한 기반을 공개해 두었어요.", ossAction: "GitHub에서 보기",
    operatorEyebrow: "운영진을 위해", operatorTitle: ["현장의 모든 화면을,", "하나로."],
    operators: [["운영 현황판", "체크인, 대기열, 신고 현황을 한 화면에서"], ["QR 체크인", "부스마다 고유 QR로 빠른 참여 확인"], ["재고 관리", "품절 임박 재고를 실시간으로 추적"], ["부스 평점", "방문객이 남긴 별점이 곧바로 반영"], ["광고 코인", "별점으로 쌓은 코인으로 홈 화면 광고 구매"], ["공지 발송", "긴급 공지를 전체 화면 상단에 즉시 노출"]],
    highlightsEyebrow: "지난 사름제", highlightsTitle: "사름제가 걸어온 순간들", reelHint: "휠 또는 ← → 키로 지난 영상을 둘러보세요.", reelLabel: "지난 사름제 하이라이트 영상, 좌우로 스크롤", videoTitle: "사름제 하이라이트 영상",
    ctaEyebrow: "사름제 2026", ctaTitle: ["이제,", "시작할 시간."], ctaBody: "운영진이 축제를 공개하면\n부스, 일정, 랭킹이 모두 이 자리에 나타나요.", ctaAction: "로그인하고 둘러보기", stamp: "사름제", stampNote: "축제를 준비하는\n모든 사람을 위해",
  },
  en: {
    login: "Log in", account: "My account", language: "한국어",
    heroEyebrow: "CHUNGBUK SCIENCE HIGH SCHOOL FESTIVAL PLATFORM",
    heroTitle: ["Booths, queues, rankings.", "Every festival moment,", "together."],
    heroBody: "CBFESTA is an open-source platform for running school festivals. Students discover booths, join queues, and follow rankings. Booth teams manage their space, while organizers stay in control of the entire festival.",
    heroAction: "Log in and explore", heroNote: "Preparing Sareumje 2026.",
    productEyebrow: "ONE FESTIVAL, SHARED BY EVERYONE", productTitle: ["The entire festival,", "on one screen."],
    productBody: "An effortless festival app for students. A reliable live system for the people running it.",
    appEyebrow: "THE FESTIVAL IN YOUR HAND", appTitle: ["The festival you want,", "ready when you are."], appBody: "Booths, schedules, and rankings. The right information is always in the app.",
    features: [["Students", "See booths, performances, and live queues, then keep every visit and mission in one place."], ["Festival organizers", "Update notices, schedules, and booth status once, and share it with the entire festival instantly."], ["Booth teams", "Share queue and stock status, then use rating-earned coins to run home-screen ads."]],
    controlEyebrow: "FESTIVAL CONTROL ROOM", controlTitle: ["One monitor,", "the whole festival."],
    controlBody: "Notices, performances, queues, booth status, and QR check-in. Organizers manage it in one place, and changes reach the student app and booth screens right away.",
    controlItems: "Notices · schedules · queues · booth status", controlQR: "Show a QR check-in screen instantly",
    workspaceEyebrow: "WORKSPACES FOR OPERATORS", workspaceTitle: "Fast on site. Calm in control.", workspaceBody: "Festival organizers and booth teams can see the right information and act on it in one place.", adminLabel: "Festival admin", adminDetail: "Manage schedules, notices, booths, and access across the festival", boothLabel: "Booth team", boothDetail: "Manage queues, check-ins, stock, and ads on site",
    statementEyebrow: "BOOTH ADS", statementTitle: ["Ratings become", "real currency."], statementBody: "Each visitor rating earns a booth coins they can spend on a place in the home-screen ad feed.",
    ossEyebrow: "OPEN SOURCE", ossTitle: ["So anyone can", "run their festival."], ossBody: "Schools, clubs, and neighborhood festivals can start with an open foundation.", ossAction: "View on GitHub",
    operatorEyebrow: "FOR THE TEAM RUNNING IT", operatorTitle: ["Every screen on site,", "together."],
    operators: [["Live operations", "Check-ins, queues, and reports in one view"], ["QR check-in", "A unique QR at every booth for quick participation"], ["Stock control", "Track items that are nearly sold out in real time"], ["Booth ratings", "Visitor ratings appear right away"], ["Ad coins", "Spend rating-earned coins on home-screen ads"], ["Notices", "Put urgent notices at the top of every screen"]],
    highlightsEyebrow: "PREVIOUS SAREUMJE", highlightsTitle: "Moments from Sareumje", reelHint: "Use your wheel or ← → keys to explore the films.", reelLabel: "Sareumje highlight films, scroll horizontally", videoTitle: "Sareumje highlight film",
    ctaEyebrow: "SAREUMJE 2026", ctaTitle: ["Now,", "it’s time to begin."], ctaBody: "When the organizers open the festival,\nbooths, schedules, and rankings will appear here.", ctaAction: "Log in and explore", stamp: "SAREUMJE", stampNote: "FOR EVERYONE\nMAKING A FESTIVAL",
  },
} as const;

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
      { threshold: 0.15 },
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

function handleReelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  const el = e.currentTarget;
  const step = el.querySelector(".launch-video")?.clientWidth ?? 300;
  el.scrollBy({ left: e.key === "ArrowRight" ? step + 16 : -(step + 16), behavior: "smooth" });
}

function handleReelWheel(e: WheelEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  const canScrollLeft = el.scrollLeft > 0;
  if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }
}

function LaunchPage({ user }: { user: User | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState<LaunchLanguage>("ko");
  const glowRef = useRef<HTMLDivElement>(null);
  const copy = LAUNCH_COPY[language];
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let raf = 0;
    const onMouseMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (e.clientX / window.innerWidth - 0.5) * 48;
        const y = (e.clientY / window.innerHeight - 0.5) * 32;
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="launch-page">
      <header className={`header launch-header ${scrolled ? "is-scrolled" : ""}`}>
        <Link className="launch-header-mark" to="/">
          CBFESTA
        </Link>
        <div className="header-tools">
          <button className="launch-language-toggle" onClick={() => setLanguage(language === "ko" ? "en" : "ko")}>
            {copy.language}
          </button>
          <Link className="login-button" to="/login">
            <LogIn /> {user ? copy.account : copy.login}
          </Link>
        </div>
      </header>
      <main className="launch-main">
        <section className="launch-hero">
          <div className="launch-hero-glow" aria-hidden="true" ref={glowRef} />
          <div className="launch-hero-copy">
            <img
              src={brandLogo}
              alt=""
              className="launch-hero-logo launch-hero-fade"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="launch-hero-eyebrow launch-hero-fade"
              style={{ animationDelay: "60ms" }}
            >
              {copy.heroEyebrow}
            </span>
            <h1>
              <span className="launch-hero-line" style={{ animationDelay: "80ms" }}>{copy.heroTitle.join(" ")}</span>
            </h1>
            <p className="launch-hero-fade" style={{ animationDelay: "520ms" }}>
              {copy.heroBody}
            </p>
            <div
              className="launch-hero-actions launch-hero-fade"
              style={{ animationDelay: "640ms" }}
            >
              <Link className="primary-action" to="/login">
                <LogIn /> {copy.heroAction}
              </Link>
              <span className="launch-hero-note">{copy.heroNote}</span>
            </div>
          </div>
          <img className="launch-hero-product" src={heroDevice} alt="CBFESTA festival app on a smartphone" />
          <div className="launch-hero-scroll-cue" aria-hidden="true" />
        </section>

        <section className="launch-product-showcase">
          <Reveal className="launch-showcase-copy">
            <span>{copy.productEyebrow}</span>
            <h2>{copy.productTitle.join(" ")}</h2>
            <p>{copy.productBody}</p>
          </Reveal>
          <div className="launch-showcase-scenes">
            {FEATURE_SECTIONS.map((feature, index) => (
              <div className={`launch-showcase-scene scene-${index + 1} ${feature.type}`} key={index}>
                <img src={feature.image} alt="" />
              </div>
            ))}
          </div>
          <div className="launch-showcase-notes">
            {FEATURE_SECTIONS.map((feature, index) => (
              <article key={copy.features[index][0]}>
                <b>{copy.features[index][0]}</b>
                <p>{copy.features[index][1]}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="launch-app-views">
          <Reveal className="launch-app-views-copy">
            <span>{copy.appEyebrow}</span>
            <h2>{copy.appTitle.join(" ")}</h2>
            <p>{copy.appBody}</p>
          </Reveal>
          <div className="launch-app-devices" aria-hidden="true">
            <img className="launch-app-device launch-app-device-booth" src={heroDevice} alt="" />
            <img className="launch-app-device launch-app-device-schedule" src={deviceSchedule} alt="" />
            <img className="launch-app-device launch-app-device-ranking" src={deviceRanking} alt="" />
          </div>
        </section>

        <Reveal className="launch-control-room">
          <div className="launch-control-copy">
            <span>{copy.controlEyebrow}</span>
            <h2>{copy.controlTitle.join(" ")}</h2>
            <p>{copy.controlBody}</p>
          </div>
          <div className="launch-control-screen">
            <img src={adminDashboard} alt="CBFESTA 축제 관리자 대시보드" />
            <div className="launch-control-overlay">
              <b>{copy.controlEyebrow}</b>
              <span>{copy.controlItems}</span>
              <i>{copy.controlQR}</i>
            </div>
          </div>
        </Reveal>

        <section className="launch-workspaces">
          <Reveal className="launch-workspaces-copy">
            <span>{copy.workspaceEyebrow}</span>
            <h2>{copy.workspaceTitle}</h2>
            <p>{copy.workspaceBody}</p>
          </Reveal>
          <div className="launch-workspace-grid">
            <article>
              <div className="launch-desktop-device">
                <div className="launch-desktop-screen"><img src={adminDashboard} alt="CBFESTA 축제 관리자 대시보드" /></div>
                <div className="launch-desktop-stand" aria-hidden="true" />
              </div>
              <b>{copy.adminLabel}</b>
              <p>{copy.adminDetail}</p>
            </article>
            <article>
              <div className="launch-desktop-device">
                <div className="launch-desktop-screen"><img src={boothDashboard} alt="CBFESTA 부스 운영자 대시보드" /></div>
                <div className="launch-desktop-stand" aria-hidden="true" />
              </div>
              <b>{copy.boothLabel}</b>
              <p>{copy.boothDetail}</p>
            </article>
          </div>
        </section>

        <section className="launch-beliefs">
          <Reveal className="launch-statement">
            <span>{copy.statementEyebrow}</span>
            <h2>{copy.statementTitle.join(" ")}</h2>
            <p>{copy.statementBody}</p>
          </Reveal>

          <Reveal className="launch-oss">
            <span>{copy.ossEyebrow}</span>
            <h2>{copy.ossTitle.join(" ")}</h2>
            <p>{copy.ossBody}</p>
            <a
              className="secondary-action launch-oss-link"
              href="https://github.com/lmwmason/CBFESTA"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.ossAction} <ArrowRight />
            </a>
          </Reveal>
        </section>

        <Reveal className="launch-operator">
          <span>{copy.operatorEyebrow}</span>
          <h2>{copy.operatorTitle.join(" ")}</h2>
          <ul className="launch-operator-list">
            {copy.operators.map((item) => (
              <li key={item[0]}>
                <b>{item[0]}</b>
                <span>{item[1]}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="launch-highlights">
          <div className="launch-highlights-head">
            <span>{copy.highlightsEyebrow}</span>
            <h2>{copy.highlightsTitle}</h2>
          </div>
          <div className="launch-video-reel">
            <div
              className="launch-video-grid"
              onWheel={handleReelWheel}
              onKeyDown={handleReelKeyDown}
              tabIndex={0}
              role="region"
              aria-label={copy.reelLabel}
            >
              {HIGHLIGHT_VIDEOS.map((videoId, index) => (
                <div className="launch-video" key={videoId}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`${copy.videoTitle} ${index + 1}`}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
            <div className="launch-video-reel-fade" aria-hidden="true" />
          </div>
          <p className="launch-reel-hint">{copy.reelHint}</p>
        </Reveal>

        <Reveal className="launch-cta">
          <div className="launch-cta-copy">
            <span>{copy.ctaEyebrow}</span>
            <h2>{copy.ctaTitle.join(" ")}</h2>
            <p>{copy.ctaBody}</p>
            <Link className="primary-action" to="/login">
              <LogIn /> {copy.ctaAction}
            </Link>
          </div>
          <div className="launch-cta-stamp" aria-hidden="true">
            <span>{copy.stamp}</span>
            <b>2026</b>
            <small>{copy.stampNote}</small>
          </div>
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
