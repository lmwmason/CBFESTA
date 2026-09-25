import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  Package,
  QrCode,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "./lib/supabase/database.types";
import { supabase } from "./lib/supabase/client";
import { useAuth } from "./features/auth/auth-context";

function Loading() {
  return <div className="workspace-loading">불러오는 중…</div>;
}
function Empty({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: typeof Store;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <section className="workspace-empty">
      <Icon />
      <h2>{title}</h2>
      <p>{detail}</p>
      {action}
    </section>
  );
}

export function BoothDashboard() {
  const { user } = useAuth();
  const userId = user?.id;
  const [booth, setBooth] = useState<Tables<"booths"> | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase || !userId) return;
    void (async () => {
      const { data: memberships } = await supabase
        .from("booth_members")
        .select("booth_id")
        .eq("user_id", userId)
        .limit(1);
      const boothId = memberships?.[0]?.booth_id;
      if (!boothId) {
        setLoading(false);
        return;
      }
      const [{ data: boothData }, { count: queue }, { count: checkins }] =
        await Promise.all([
          supabase.from("booths").select("*").eq("id", boothId).single(),
          supabase
            .from("queue_entries")
            .select("*", { count: "exact", head: true })
            .eq("booth_id", boothId)
            .in("status", ["waiting", "called"]),
          supabase
            .from("checkins")
            .select("*", { count: "exact", head: true })
            .eq("booth_id", boothId),
        ]);
      setBooth(boothData);
      setQueueCount(queue ?? 0);
      setCheckinCount(checkins ?? 0);
      setLoading(false);
    })();
  }, [userId]);
  if (loading)
    return (
      <main className="workspace">
        <Loading />
      </main>
    );
  if (!booth)
    return (
      <main className="workspace">
        <Empty
          icon={Store}
          title="배정된 부스가 없어요."
          detail="축제 관리자가 이 계정에 부스 운영 권한을 연결하면 부스 업무 공간이 열립니다."
        />
      </main>
    );
  return (
    <main className="workspace">
      <header className="workspace-head">
        <div>
          <span>BOOTH DESK</span>
          <h1>{booth.name}</h1>
          <p>
            <i /> {booth.status === "open" ? "운영 중" : booth.status}
          </p>
        </div>
        <Link className="primary-action" to="/booth/check-in">
          <QrCode /> CHECK-IN
        </Link>
      </header>
      <section className="metric-grid metrics-3">
        <Metric label="CHECK-INS" value={checkinCount} note="누적 참여 확인" />
        <Metric
          label="LIVE QUEUE"
          value={queueCount}
          note="현재 대기 중"
          accent
        />
        <Metric
          label="STATUS"
          value={booth.status.toUpperCase()}
          note="부스 운영 상태"
        />
      </section>
      <section className="workspace-actions">
        <Link className="work-panel operation-link" to="/booth/check-in">
          <ClipboardCheck />
          <span>
            <b>참여 확인</b>
            <small>QR 코드로 빠르게 체크인</small>
          </span>
          <ArrowRight />
        </Link>
        <Link className="work-panel operation-link" to="/booth/queue">
          <Users />
          <span>
            <b>대기 관리</b>
            <small>현재 대기 번호와 상태 관리</small>
          </span>
          <ArrowRight />
        </Link>
        <Link className="work-panel operation-link" to="/booth/inventory">
          <Package />
          <span>
            <b>재고 관리</b>
            <small>품절과 재고 수량 업데이트</small>
          </span>
          <ArrowRight />
        </Link>
        <Link className="work-panel operation-link" to="/booth/settings">
          <Store />
          <span>
            <b>부스 꾸미기</b>
            <small>소개, 색상, 이미지와 안내 설정</small>
          </span>
          <ArrowRight />
        </Link>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: number | string;
  note: string;
  accent?: boolean;
}) {
  return (
    <article className={`metric ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export function AdminDashboard() {
  const { activeMembership } = useAuth();
  const [counts, setCounts] = useState({
    booths: 0,
    programs: 0,
    categories: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const festivalId = activeMembership?.festival_id;
    if (!supabase || !festivalId) return;
    void Promise.all([
      supabase
        .from("booths")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId),
      supabase
        .from("programs")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId),
      supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId)
        .in("status", ["open", "acknowledged"]),
    ]).then(([booths, programs, categories, reports]) => {
      setCounts({
        booths: booths.count ?? 0,
        programs: programs.count ?? 0,
        categories: categories.count ?? 0,
        reports: reports.count ?? 0,
      });
      setLoading(false);
    });
  }, [activeMembership?.festival_id]);
  if (loading)
    return (
      <main className="workspace">
        <Loading />
      </main>
    );
  return (
    <main className="workspace admin-workspace">
      <header className="workspace-head">
        <div>
          <span>CONTROL CENTER</span>
          <h1>축제 운영</h1>
          <p>
            <i /> 사름제-2026 데이터가 실시간으로 반영됩니다.
          </p>
        </div>
        <Link className="primary-action" to="/admin/announcements">
          <Megaphone /> 공지 작성
        </Link>
      </header>
      <section className="metric-grid">
        <Metric label="BOOTHS" value={counts.booths} note="등록된 부스" />
        <Metric
          label="PROGRAMS"
          value={counts.programs}
          note="등록된 프로그램"
        />
        <Metric
          label="CATEGORIES"
          value={counts.categories}
          note="콘텐츠 분류"
        />
        <Metric
          label="OPEN REPORTS"
          value={counts.reports}
          note="처리할 신고"
          accent
        />
      </section>
      <section className="workspace-actions">
        <Link className="work-panel operation-link" to="/admin/categories">
          <Tags />
          <span>
            <b>카테고리 관리</b>
            <small>학생 탐색 화면의 콘텐츠 분류</small>
          </span>
          <ArrowRight />
        </Link>
        <Link className="work-panel operation-link" to="/admin/programs">
          <CalendarDays />
          <span>
            <b>프로그램 관리</b>
            <small>공연, 미션, 전시와 먹거리</small>
          </span>
          <ArrowRight />
        </Link>
        <Link className="work-panel operation-link" to="/admin/permissions">
          <Users />
          <span>
            <b>사용자 권한</b>
            <small>참가자, 부스 운영자, 관리자 설정</small>
          </span>
          <ArrowRight />
        </Link>
        <Link className="work-panel operation-link" to="/admin/issues">
          <ClipboardCheck />
          <span>
            <b>신고 및 이슈</b>
            <small>현장 요청의 처리 상태 관리</small>
          </span>
          <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
