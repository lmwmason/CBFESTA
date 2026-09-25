import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell, ChevronRight, Compass, Home, Map, MapPin, QrCode, Search,
  Sparkles, Trophy, Users, X,
} from 'lucide-react';

const TeamArtifact = lazy(() => import('./TeamArtifact'));

const missions = [
  { id: 1, type: '지금 가까워요', title: '푸드트럭에서 숨은 메뉴 찾기', place: '운동장 · 2분', score: 150, face: '🥤', accent: 'coral' },
  { id: 2, type: '친구와 함께', title: '청룡 포토존에서 팀 사진 남기기', place: '본관 앞 · 4분', score: 240, face: '📸', accent: 'blue' },
  { id: 3, type: '오늘만 열려요', title: '밴드부 앙코르 암호 맞히기', place: '대강당 · 7분', score: 320, face: '🎸', accent: 'gold' },
];

const navItems = [
  { label: '홈', icon: Home }, { label: '미션', icon: Compass }, { label: '지도', icon: Map }, { label: '우리 팀', icon: Users },
];

function Logo() {
  return <a className="logo" href="#top" aria-label="CBFESTA 홈"><span className="logo-mark"><i /><i /><i /></span><span>CB<span>FESTA</span></span></a>;
}

function App() {
  const [active, setActive] = useState('홈');
  const [selected, setSelected] = useState(missions[0]);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="app-shell" id="top">
      <header className="topbar glass-navigation">
        <Logo />
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navItems.map(({ label }) => <button className={active === label ? 'active' : ''} onClick={() => setActive(label)} key={label}>{label}</button>)}
        </nav>
        <div className="top-actions">
          <button className="icon-button" aria-label="검색" onClick={() => setSearchOpen(true)}><Search /></button>
          <button className="icon-button notification" aria-label="알림"><Bell /><span /></button>
          <button className="avatar" aria-label="내 프로필">12</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-aurora" />
          <div className="hero-copy">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="eyebrow"><span /> 축제 둘째 날 · 16:24</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>오늘의 축제는<br /><em>우리가 완성해.</em></motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>친구들과 미션을 깨고, 우리 팀의 청룡을 깨워보세요.</motion.p>
            <motion.button whileTap={{ scale: .96 }} className="primary-button"><QrCode /> 미션 QR 찍기</motion.button>
          </div>
          <div className="artifact-stage" aria-label="청룡 팀 아티팩트 3D 모델">
            <div className="artifact-halo" />
            <Suspense fallback={<div className="artifact-fallback" />}><TeamArtifact /></Suspense>
            <motion.div className="team-status glass-on-3d" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, type: 'spring' }}>
              <div><span className="rank-dot" /> 청룡 · 현재 2위</div>
              <strong>18,420<small>점</small></strong>
              <div className="progress"><i /></div>
              <p>다음 진화까지 <b>580점</b></p>
            </motion.div>
          </div>
          <div className="hero-index">02 <span>/ 04</span></div>
        </section>

        <section className="content-section mission-section">
          <div className="section-heading">
            <div><span className="section-kicker">PLAY NOW</span><h2>지금 할 수 있는 미션</h2><p>가까운 곳부터 가볍게 시작해봐요.</p></div>
            <button className="text-button">모두 보기 <ChevronRight /></button>
          </div>
          <div className="mission-layout">
            <div className="mission-list">
              {missions.map((mission) => (
                <motion.button layout key={mission.id} onClick={() => setSelected(mission)} whileTap={{ scale: .985 }} className={`mission-card ${selected.id === mission.id ? 'selected' : ''}`}>
                  <span className={`face-tile ${mission.accent}`}><span className="tossface">{mission.face}</span></span>
                  <span className="mission-copy"><small>{mission.type}</small><strong>{mission.title}</strong><span><MapPin /> {mission.place}</span></span>
                  <span className="score">+{mission.score}</span>
                  <ChevronRight className="chevron" />
                </motion.button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.aside key={selected.id} className="mission-detail glass-surface" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
                <div className={`detail-visual ${selected.accent}`}><span className="tossface">{selected.face}</span><Sparkles /></div>
                <div className="detail-body"><span>{selected.type}</span><h3>{selected.title}</h3><p>현장에 도착해 QR을 찾고 인증하면 팀 점수가 바로 올라가요.</p><div className="detail-meta"><span>예상 8분</span><b>+{selected.score}점</b></div><button className="dark-button">미션 시작하기 <ChevronRight /></button></div>
              </motion.aside>
            </AnimatePresence>
          </div>
        </section>

        <section className="festival-strip">
          <div><span className="live-dot" /> FESTA LIVE</div>
          <p>지금 1,248명이 축제를 함께 만들고 있어요.</p>
          <div className="crowd"><span>민</span><span>서</span><span>준</span><b>+1.2K</b></div>
          <button><Trophy /> 실시간 순위 보기</button>
        </section>
      </main>

      <nav className="mobile-nav glass-navigation" aria-label="모바일 주요 메뉴">
        {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={active === label ? 'active' : ''}><Icon /><span>{label}</span></button>)}
      </nav>
      <AnimatePresence>
        {searchOpen && <motion.div className="search-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSearchOpen(false)}><motion.div className="search-panel glass-overlay" initial={{ y: -18, scale: .98 }} animate={{ y: 0, scale: 1 }} onClick={e => e.stopPropagation()}><Search /><input autoFocus placeholder="미션, 부스, 공연을 찾아보세요" /><button onClick={() => setSearchOpen(false)} aria-label="닫기"><X /></button></motion.div></motion.div>}
      </AnimatePresence>
    </div>
  );
}

export default App;
