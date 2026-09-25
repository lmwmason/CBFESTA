import { AlertTriangle, ArrowUpRight, Check, ChevronRight, CirclePause, Clock3, Megaphone, MoreHorizontal, Package, QrCode, Search, Users } from 'lucide-react';

const checkins = [
  { name: '김서윤', team: '말랑여우', time: '16:42', status: '완료' },
  { name: '박하준', team: '파란불꽃', time: '16:40', status: '완료' },
  { name: '이도윤', team: '오로라', time: '16:38', status: '확인 필요' },
];

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) {
  return <article className={`metric ${accent ? 'accent' : ''}`}><span>{label}</span><strong>{value}</strong><p>{note}</p></article>;
}

export function BoothDashboard() {
  return <main className="workspace">
    <header className="workspace-head"><div><span>BOOTH DESK · A-04</span><h1>분식부스의 비밀 메뉴</h1><p><i /> 운영 중 · 20:00 마감</p></div><div><button className="secondary-action"><CirclePause /> 잠시 닫기</button><button className="primary-action"><QrCode /> CHECK-IN</button></div></header>
    <section className="metric-grid"><Metric label="TODAY CHECK-IN" value="184" note="지난 시간보다 12% 증가" accent /><Metric label="LIVE QUEUE" value="12명" note="예상 대기 8분" /><Metric label="MISSION" value="76%" note="140명이 미션 완료" /><Metric label="STOCK ALERT" value="2" note="떡볶이 소스 · 종이컵" /></section>
    <div className="workspace-grid">
      <section className="work-panel checkin-panel"><div className="panel-title"><div><span>CHECK-IN</span><h2>최근 참여</h2></div><button><Search /> 검색</button></div><div className="data-list"><div className="data-head"><span>학생</span><span>팀</span><span>시간</span><span>상태</span></div>{checkins.map(row => <div className="data-row" key={row.name}><b>{row.name}</b><span>{row.team}</span><time>{row.time}</time><em className={row.status === '완료' ? 'done' : 'warning'}>{row.status}</em></div>)}</div><button className="panel-more">전체 참여 기록 <ChevronRight /></button></section>
      <aside className="work-panel operations"><div className="panel-title"><div><span>QUICK CONTROL</span><h2>바로 관리</h2></div></div><button><Users /><span><b>대기 인원 조정</b><small>현재 12명 · 8분</small></span><ChevronRight /></button><button><Package /><span><b>재고 업데이트</b><small>부족 품목 2개</small></span><ChevronRight /></button><button><Megaphone /><span><b>부스 공지</b><small>마지막 공지 15:20</small></span><ChevronRight /></button></aside>
    </div>
  </main>;
}

const issues = [
  { level: '긴급', title: '대강당 출입구 혼잡', owner: '안전팀', time: '3분 전' },
  { level: '확인', title: 'A-12 부스 전력 점검 요청', owner: '시설팀', time: '12분 전' },
  { level: '일반', title: '밴드부 공연 10분 지연', owner: '무대팀', time: '18분 전' },
];

export function AdminDashboard() {
  return <main className="workspace admin-workspace">
    <header className="workspace-head"><div><span>CONTROL CENTER · DAY 02</span><h1>축제 운영 현황</h1><p><i /> 전체 시스템 정상 · 마지막 동기화 16:43</p></div><div><button className="secondary-action"><Clock3 /> 운영 기록</button><button className="primary-action"><Megaphone /> 공지 발송</button></div></header>
    <section className="metric-grid"><Metric label="LIVE VISITORS" value="1,248" note="현재 교내 참여 인원" accent /><Metric label="OPEN BOOTHS" value="26/28" note="2개 부스 일시 중지" /><Metric label="MISSIONS" value="3,842" note="오늘 누적 완료" /><Metric label="OPEN ISSUES" value="3" note="긴급 대응 1건" /></section>
    <div className="workspace-grid admin-grid">
      <section className="work-panel"><div className="panel-title"><div><span>LIVE FLOW</span><h2>시간대별 참여</h2></div><button>DETAIL <ArrowUpRight /></button></div><div className="bar-chart" aria-label="시간대별 참여자 차트">{[32,46,40,58,72,68,91,78,62].map((height,index) => <div key={index}><i style={{height:`${height}%`}} /><span>{13+index}시</span></div>)}</div></section>
      <aside className="work-panel issue-panel"><div className="panel-title"><div><span>ISSUES</span><h2>지금 확인할 일</h2></div><button><MoreHorizontal /></button></div>{issues.map(issue => <button className="issue" key={issue.title}><em className={issue.level === '긴급' ? 'urgent' : ''}>{issue.level}</em><span><b>{issue.title}</b><small>{issue.owner} · {issue.time}</small></span><ChevronRight /></button>)}</aside>
    </div>
    <section className="system-strip"><span><Check /> AUTH 정상</span><span><Check /> QR 정상</span><span><Check /> MAP 정상</span><span><AlertTriangle /> 신고 대응 3건</span></section>
  </main>;
}
