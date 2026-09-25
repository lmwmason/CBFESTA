import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChevronLeft, ChevronRight, Clock3, Heart, Home, Map, MapPin, QrCode, Search, Ticket, Users, X } from 'lucide-react';

const TeamArtifact = lazy(() => import('./TeamArtifact'));
const programs = [
  { id: 1, category: 'MISSION', title: '분식부스의 비밀 메뉴', place: '운동장 A-04', time: '지금 참여 가능', score: 150, face: '🥤', tone: 'orange', word: 'TASTE' },
  { id: 2, category: 'PHOTO', title: '청룡 포토존 팀 인증', place: '본관 중앙', time: '18:00까지', score: 240, face: '📸', tone: 'blue', word: 'POSE' },
  { id: 3, category: 'LIVE', title: '밴드부 앙코르 암호', place: '대강당', time: '17:20 시작', score: 320, face: '🎸', tone: 'lime', word: 'LOUD' },
  { id: 4, category: 'SECRET', title: '방송실에서 온 전파', place: '위치 비공개', time: '단 40분', score: 500, face: '📻', tone: 'violet', word: 'TUNE' },
];
const tabs = ['전체', '미션', '공연', '먹거리', '전시'];

function Mark() { return <a className="brand" href="#top"><span className="brand-block">CB</span><span>FESTA<br /><small>2026</small></span></a>; }

function ProgramCard({ item, index, onSelect }: { item: typeof programs[number]; index: number; onSelect: () => void }) {
  return <motion.article className="program-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}>
    <button className={`program-image ${item.tone}`} onClick={onSelect} aria-label={`${item.title} 자세히 보기`}><span className="program-number">0{index + 1}</span><strong className="poster-word">{item.word}</strong><span className="poster-orbit" /><span className="tossface program-face">{item.face}</span><span className="image-label">+{item.score} P</span></button>
    <div className="program-info"><div><span>{item.category}</span><button aria-label="관심 프로그램"><Heart /></button></div><h3>{item.title}</h3><p><MapPin /> {item.place}</p><p><Clock3 /> {item.time}</p></div>
  </motion.article>;
}

export default function App() {
  const [tab, setTab] = useState('전체');
  const [detail, setDetail] = useState<typeof programs[number] | null>(null);
  const [search, setSearch] = useState(false);
  return <div className="site" id="top">
    <header className="header"><Mark /><nav className="main-links"><a href="#programs">프로그램</a><a href="#team">팀 랭킹</a><a href="#guide">축제 안내</a></nav><div className="header-tools"><button onClick={() => setSearch(true)} aria-label="검색"><Search /></button><button aria-label="알림"><Bell /><i /></button><button className="my-ticket"><Ticket /> 내 티켓</button></div></header>
    <main>
      <section className="lead"><div className="lead-copy"><span className="edition">CHEONBUK FESTIVAL · DAY 02</span><h1>학교 전체가<br />오늘의 무대.</h1><p>공연 12 · 부스 28 · 미션 16</p><div className="lead-actions"><button className="action-black"><QrCode /> QR 참여하기</button><a href="#programs">오늘 뭐 하지? <ChevronRight /></a></div></div><div className="lead-visual" id="team"><div className="artifact-wrap"><Suspense fallback={<div className="artifact-fallback" />}><TeamArtifact /></Suspense></div><div className="team-label"><span>TEAM 02</span><strong>청룡</strong><p>18,420 P · 현재 2위</p><div className="linear-progress"><i /></div></div><div className="poster-type">BLUE<br />DRAGON</div></div></section>
      <section className="ticker"><b>LIVE</b><span>현재 참여 1,248명</span><span>·</span><span>청룡팀이 580점을 더 모으면 아티팩트가 진화해요</span><button>팀 현황 <ChevronRight /></button></section>
      <section className="catalog" id="programs"><div className="catalog-head"><div><span>EXPLORE THE FESTA</span><h2>지금 열려 있어요</h2></div><div className="carousel-controls"><button disabled aria-label="이전"><ChevronLeft /></button><button aria-label="다음"><ChevronRight /></button></div></div><div className="tabs" role="tablist">{tabs.map(item => <button role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><div className="program-grid">{programs.map((item, index) => <ProgramCard key={item.id} item={item} index={index} onSelect={() => setDetail(item)} />)}</div></section>
      <section className="guide" id="guide"><div><span>16:40</span><p>지금 학교에서</p></div><h2>곧 시작하는<br />무대를 놓치지 마세요.</h2><ol><li><time>17:00</time><span><b>댄스부 스트릿 스테이지</b>중앙 광장</span><ChevronRight /></li><li><time>17:20</time><span><b>밴드부 앙코르 공연</b>대강당</span><ChevronRight /></li><li><time>18:00</time><span><b>팀 대항 결승 미션</b>운동장</span><ChevronRight /></li></ol></section>
    </main>
    <nav className="mobile-nav"><button className="active"><Home /><span>홈</span></button><button><Search /><span>탐색</span></button><button className="scan"><QrCode /></button><button><Map /><span>지도</span></button><button><Users /><span>팀</span></button></nav>
    <AnimatePresence>{(detail || search) && <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setDetail(null); setSearch(false); }}>{search ? <motion.div className="search-sheet" initial={{ y: -20 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()}><Search /><input autoFocus placeholder="프로그램, 부스, 장소 검색" /><button onClick={() => setSearch(false)}><X /></button></motion.div> : detail && <motion.aside className="detail-sheet" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} onClick={e => e.stopPropagation()}><button className="sheet-close" onClick={() => setDetail(null)}><X /></button><div className={`sheet-image ${detail.tone}`}><span className="tossface">{detail.face}</span></div><span>{detail.category}</span><h2>{detail.title}</h2><p>현장에서 QR을 찾아 인증하면 우리 팀 점수가 바로 올라갑니다.</p><dl><div><dt>장소</dt><dd>{detail.place}</dd></div><div><dt>운영</dt><dd>{detail.time}</dd></div><div><dt>획득</dt><dd>+{detail.score} P</dd></div></dl><button className="action-black sheet-action">미션 시작하기 <ChevronRight /></button></motion.aside>}</motion.div>}</AnimatePresence>
  </div>;
}
