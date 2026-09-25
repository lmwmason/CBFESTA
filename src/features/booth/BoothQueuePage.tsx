import { useCallback, useEffect, useState } from "react";
import { Check, PhoneCall, UserX, Users } from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import { supabase } from "../../lib/supabase/client";
import {
  getBoothQueue,
  subscribeToBoothOperations,
  updatePartyStatus,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type QueueEntry = Tables<"queue_entries">;

export function BoothQueuePage() {
  const { user } = useAuth();
  const [booth, setBooth] = useState<Tables<"booths"> | null>(null);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (boothId: number) => {
    try {
      setEntries(await getBoothQueue(boothId));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "대기열을 불러오지 못했습니다.",
      );
    }
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    void supabase
      .from("booth_members")
      .select("booth_id, booths(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        const item = (data?.booths as Tables<"booths"> | null) ?? null;
        setBooth(item);
        if (item) await load(item.id);
        setLoading(false);
      });
  }, [user, load]);

  useEffect(() => {
    if (!booth) return;
    return subscribeToBoothOperations(booth.id, () => void load(booth.id));
  }, [booth, load]);

  const act = async (entry: QueueEntry, status: QueueEntry["status"]) => {
    setBusyId(entry.id);
    setError("");
    try {
      await updatePartyStatus(entry.id, status);
      if (booth) await load(booth.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "상태를 변경하지 못했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading)
    return (
      <main className="workspace">
        <div className="workspace-loading">불러오는 중…</div>
      </main>
    );
  if (!booth)
    return (
      <main className="workspace">
        <section className="workspace-empty">
          <Users />
          <h2>배정된 부스가 없어요.</h2>
          <p>축제 관리자가 이 계정에 부스 운영 권한을 연결하면 대기열이 열립니다.</p>
        </section>
      </main>
    );

  const waiting = entries.filter((entry) => entry.status === "waiting");
  const called = entries.filter((entry) => entry.status === "called");

  return (
    <main className="workspace">
      <header className="workspace-head">
        <div>
          <span>BOOTH DESK</span>
          <h1>{booth.name} 대기열</h1>
          <p>
            <i /> 대기 {waiting.length}팀 · 호출 {called.length}팀
          </p>
        </div>
      </header>
      {error && <p className="form-error">{error}</p>}
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
                  disabled={busyId === entry.id}
                  onClick={() => void act(entry, "served")}
                >
                  <Check /> 완료
                </button>
                <button
                  className="secondary-action"
                  disabled={busyId === entry.id}
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
          {waiting.length === 0 && (
            <p className="queue-empty">대기 중인 팀이 없어요.</p>
          )}
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
                  disabled={busyId === entry.id}
                  onClick={() => void act(entry, "called")}
                >
                  <PhoneCall /> 호출
                </button>
                <button
                  className="secondary-action"
                  disabled={busyId === entry.id}
                  onClick={() => void act(entry, "cancelled")}
                >
                  <UserX /> 취소
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
