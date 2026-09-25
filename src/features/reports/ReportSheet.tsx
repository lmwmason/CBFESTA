import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { createReport } from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

const categories = [
  { value: "safety", label: "안전" },
  { value: "facility", label: "시설" },
  { value: "behavior", label: "질서" },
  { value: "other", label: "기타" },
];

export function ReportForm({ boothId }: { boothId?: number }) {
  const { user, activeMembership } = useAuth();
  const [category, setCategory] = useState("facility");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !activeMembership) return;
    setState("saving");
    setError("");
    try {
      await createReport({
        festival_id: activeMembership.festival_id,
        reporter_id: user.id,
        booth_id: boothId ?? null,
        category,
        title: title.trim(),
        description: description.trim(),
      });
      setState("done");
    } catch (caught) {
      setState("idle");
      setError(
        caught instanceof Error ? caught.message : "신고를 접수하지 못했습니다.",
      );
    }
  };

  if (state === "done")
    return (
      <>
        <span>ISSUE REPORT</span>
        <h2>접수됐어요</h2>
        <p>운영진이 확인 후 빠르게 처리할게요.</p>
      </>
    );

  return (
    <>
      <span>ISSUE REPORT</span>
      <h2>문제를 알려주세요</h2>
      <p>
        안전, 시설, 질서 등 현장에서 발견한 문제를 운영진에게 바로
        전달합니다.
      </p>
      <form onSubmit={submit}>
        <label>
          <span>분류</span>
          <div>
            <AlertTriangle />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          <span>제목</span>
          <div>
            <input
              required
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 화장실 앞 바닥이 미끄러워요"
            />
          </div>
        </label>
        <label className="report-description">
          <span>내용</span>
          <textarea
            required
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="상황을 자세히 알려주세요."
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-action" disabled={state === "saving"}>
          {state === "saving" ? "접수 중…" : "신고 접수"} <ArrowRight />
        </button>
      </form>
    </>
  );
}
