import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  Megaphone,
  Package,
  PhoneCall,
  QrCode,
  Store,
  Tags,
  Trophy,
  UserX,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "./lib/supabase/database.types";
import { supabase } from "./lib/supabase/client";
import {
  getBoothQueue,
  subscribeToBoothOperations,
  updateBooth,
  updatePartyStatus,
} from "./lib/supabase/services";
import { useAuth } from "./features/auth/auth-context";

const STATUS_STEPS: { value: Tables<"booths">["status"]; label: string }[] = [
  { value: "open", label: "운영 중" },
  { value: "paused", label: "잠시 멈춤" },
  { value: "closed", label: "운영 종료" },
];

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
  const [checkinCount, setCheckinCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Tables<"queue_entries">[]>([]);
  const [statusBusy, setStatusBusy] = useState(false);
  const [queueBusyId, setQueueBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async (boothId: number) => {
    try {
      setEntries(await getBoothQueue(boothId));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "대기열을 불러오지 못했습니다.",
      );
    }
  }, []);

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
      const [{ data: boothData }, { count: checkins }] = await Promise.all([
        supabase.from("booths").select("*").eq("id", boothId).single(),
        supabase
          .from("checkins")
          .select("*", { count: "exact", head: true })
          .eq("booth_id", boothId),
      ]);
      setBooth(boothData);
      setCheckinCount(checkins ?? 0);
      if (boothData) await loadQueue(boothData.id);
      setLoading(false);
    })();
  }, [userId, loadQueue]);

  useEffect(() => {
    if (!booth) return;
    return subscribeToBoothOperations(booth.id, () => void loadQueue(booth.id));
  }, [booth, loadQueue]);

  const changeStatus = async (status: Tables<"booths">["status"]) => {
    if (!booth || status === booth.status) return;
    setStatusBusy(true);
    setError("");
    try {
      const updated = await updateBooth(booth.id, { status });
      setBooth(updated);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "운영 상태를 변경하지 못했습니다.",
      );
    } finally {
      setStatusBusy(false);
    }
  };

  const act = async (entry: Tables<"queue_entries">, status: Tables<"queue_entries">["status"]) => {
    if (!booth) return;
    setQueueBusyId(entry.id);
    setError("");
    try {
      await updatePartyStatus(entry.id, status);
      await loadQueue(booth.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "상태를 변경하지 못했습니다.",
      );
    } finally {
      setQueueBusyId(null);
    }
  };

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

  const waiting = entries.filter((entry) => entry.status === "waiting");
  const called = entries.filter((entry) => entry.status === "called");

  return (
    <main className="workspace">
      <header className="workspace-head">
        <div>
          <span>BOOTH DESK</span>
          <h1>{booth.name}</h1>
          <p>
            <i /> 대기 {waiting.length}팀 · 호출 {called.length}팀
          </p>
        </div>
        <Link className="primary-action" to="/booth/check-in">
          <QrCode /> CHECK-IN
        </Link>
      </header>
      {error && <p className="form-error">{error}</p>}
      <div className="status-toggle" role="group" aria-label="운영 상태">
        {STATUS_STEPS.map((step) => (
          <button
            key={step.value}
            type="button"
            className={booth.status === step.value ? "active" : ""}
            disabled={statusBusy}
            onClick={() => void changeStatus(step.value)}
          >
            {step.label}
          </button>
        ))}
      </div>
      <section className="metric-grid metrics-2">
        <Metric label="CHECK-INS" value={checkinCount} note="누적 참여 확인" />
        <Metric label="LIVE QUEUE" value={waiting.length + called.length} note="현재 대기 중" accent />
      </section>
      <section className="queue-board">
        <div className="queue-column">
          <h2>호출됨 ({called.length})</h2>
          {called.length === 0 && <p className="queue-empty">호출한 팀이 없어요.</p>}
          {called.map((entry) => (
            <article className="queue-row" key={entry.id}>
              <b>{entry.queue_number}</b>
              <span>
                {entry.party_size}명
                {entry.companion_student_numbers.length > 0 && (
                  <small>{entry.companion_student_numbers.join(", ")}</small>
                )}
              </span>
              <div>
                <button
                  className="primary-action"
                  disabled={queueBusyId === entry.id}
                  onClick={() => void act(entry, "served")}
                >
                  <Check /> 완료
                </button>
                <button
                  className="secondary-action"
                  disabled={queueBusyId === entry.id}
                  onClick={() => void act(entry, "no_show")}
                >
                  <UserX /> 노쇼
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="queue-column">
          <h2>대기 중 ({waiting.length})</h2>
          {waiting.length === 0 && <p className="queue-empty">대기 중인 팀이 없어요.</p>}
          {waiting.map((entry) => (
            <article className="queue-row" key={entry.id}>
              <b>{entry.queue_number}</b>
              <span>
                {entry.party_size}명
                {entry.companion_student_numbers.length > 0 && (
                  <small>{entry.companion_student_numbers.join(", ")}</small>
                )}
              </span>
              <div>
                <button
                  className="primary-action"
                  disabled={queueBusyId === entry.id}
                  onClick={() => void act(entry, "called")}
                >
                  <PhoneCall /> 호출
                </button>
                <button
                  className="secondary-action"
                  disabled={queueBusyId === entry.id}
                  onClick={() => void act(entry, "cancelled")}
                >
                  <UserX /> 취소
                </button>
              </div>
            </article>
          ))}
        </div>
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
  const { activeMembership, activeRoles } = useAuth();
  const [counts, setCounts] = useState({
    booths: 0,
    categories: 0,
    teams: 0,
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
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId),
      supabase
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("festival_id", festivalId)
        .in("status", ["open", "acknowledged"]),
    ]).then(([booths, categories, teams, reports]) => {
      setCounts({
        booths: booths.count ?? 0,
        categories: categories.count ?? 0,
        teams: teams.count ?? 0,
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
        <div className="workspace-head-actions">
          {activeRoles.includes("booth_operator") && <Link className="secondary-action" to="/booth"><Store /> 부스 운영</Link>}
          <Link className="primary-action" to="/admin/announcements"><Megaphone /> 공지 작성</Link>
        </div>
      </header>
      <section className="metric-grid">
        <Metric label="BOOTHS" value={counts.booths} note="등록된 부스" />
        <Metric label="TEAMS" value={counts.teams} note="등록된 팀" />
        <Metric
          label="CATEGORIES"
          value={counts.categories}
          note="콘텐츠 분류"
        />
        <Link className="metric accent" to="/admin/issues">
          <span>OPEN REPORTS</span>
          <strong>{counts.reports}</strong>
          <p>처리할 신고</p>
        </Link>
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
        <Link className="work-panel operation-link" to="/admin/booths">
          <CalendarDays />
          <span>
            <b>부스 관리</b>
            <small>사진, 먹거리, 게임 등 모든 부스</small>
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
        <Link className="work-panel operation-link" to="/admin/teams">
          <Trophy />
          <span>
            <b>팀 관리</b>
            <small>팀 생성, 정원 설정과 자동 배정</small>
          </span>
          <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
