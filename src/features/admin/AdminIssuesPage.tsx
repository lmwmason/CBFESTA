import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertOctagon, CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import { getAdminReports, updateReport } from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type Report = Tables<"reports">;
type TabKey = "all" | "open" | "acknowledged" | "resolved";
const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "open", label: "접수" },
  { key: "acknowledged", label: "처리 중" },
  { key: "resolved", label: "완료" },
];
const categoryLabels: Record<string, string> = {
  safety: "안전",
  facility: "시설",
  behavior: "질서",
  other: "기타",
};

export function AdminIssuesPage() {
  const { activeMembership } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [items, setItems] = useState<Report[]>([]);
  const [tab, setTab] = useState<TabKey>("open");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!festivalId) return;
    try {
      setItems(await getAdminReports(festivalId));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "신고를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [festivalId]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.status === tab)),
    [items, tab],
  );

  const setStatus = async (report: Report, status: string) => {
    setBusyId(report.id);
    setError("");
    try {
      await updateReport(report.id, {
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      });
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "상태를 바꾸지 못했습니다.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>OPERATIONS</span>
          <h1>신고 및 이슈</h1>
          <p>현장에서 접수된 신고를 확인하고 처리 상태를 관리합니다.</p>
        </div>
      </header>
      <nav className="admin-tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "selected" : ""}
            onClick={() => setTab(item.key)}
          >
            {item.label}
            {item.key !== "all" &&
              ` (${items.filter((report) => report.status === item.key).length})`}
          </button>
        ))}
      </nav>
      {error && <p className="form-error">{error}</p>}
      <section className="issue-list">
        {loading ? (
          <div className="management-loading">
            <LoaderCircle /> 불러오는 중…
          </div>
        ) : (
          <>
            {shown.map((report) => (
              <article className={`issue-card ${report.status}`} key={report.id}>
                <header>
                  <span>
                    <em>{categoryLabels[report.category] ?? report.category}</em>
                    <b>{report.title}</b>
                  </span>
                  <time>
                    {new Intl.DateTimeFormat("ko-KR", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(report.created_at))}
                  </time>
                </header>
                <p>{report.description}</p>
                <footer>
                  {report.status !== "acknowledged" &&
                    report.status !== "resolved" && (
                      <button
                        className="secondary-action"
                        disabled={busyId === report.id}
                        onClick={() => void setStatus(report, "acknowledged")}
                      >
                        <Circle /> 처리 중으로 표시
                      </button>
                    )}
                  {report.status !== "resolved" && (
                    <button
                      className="primary-action"
                      disabled={busyId === report.id}
                      onClick={() => void setStatus(report, "resolved")}
                    >
                      <CheckCircle2 /> 해결 완료
                    </button>
                  )}
                  {report.status === "resolved" && (
                    <button
                      className="secondary-action"
                      disabled={busyId === report.id}
                      onClick={() => void setStatus(report, "open")}
                    >
                      다시 열기
                    </button>
                  )}
                </footer>
              </article>
            ))}
            {shown.length === 0 && (
              <div className="management-empty">
                <AlertOctagon />
                <h2>해당 상태의 신고가 없어요.</h2>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
