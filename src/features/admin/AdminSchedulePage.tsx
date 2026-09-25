import { useEffect, useState, type FormEvent } from "react";
import { CalendarPlus, LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import {
  createProgram,
  deleteProgram,
  getAdminBooths,
  getAdminPrograms,
  getProgram,
  updateProgram,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

export function AdminSchedulePage() {
  const { activeMembership } = useAuth(); const festivalId = activeMembership?.festival_id;
  const [items, setItems] = useState<Tables<"programs">[]>([]); const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null); const [error, setError] = useState("");
  const load = () => { if (!festivalId) return; void getAdminPrograms(festivalId).then(setItems).finally(() => setLoading(false)); };
  useEffect(load, [festivalId]);
  const remove = async (item: Tables<"programs">) => {
    if (!confirm(`"${item.title}" 일정을 삭제할까요?`)) return;
    setBusyId(item.id); setError("");
    try { await deleteProgram(item.id); load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "일정을 삭제하지 못했습니다."); }
    finally { setBusyId(null); }
  };
  return <main className="management-page"><header className="management-header"><div><span>FESTIVAL SCHEDULE</span><h1>일정 관리</h1><p>공연, 안내, 부스 운영 시간을 등록하면 학생 일정에 바로 표시됩니다.</p></div><Link className="primary-action" to="/admin/schedule/new"><Plus /> 일정 추가</Link></header>{error && <p className="form-error">{error}</p>}<section className="management-table">{loading ? <div className="management-loading"><LoaderCircle /> 불러오는 중…</div> : items.map((item) => <article className="management-row program-row" key={item.id}><span><b>{item.title}</b><small>{item.starts_at ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.starts_at)) : "시간 미정"}</small></span><code>{item.ends_at ? "종료 시간 등록" : "종료 미정"}</code><em>{item.status}</em><Link to={`/admin/schedule/${item.id}/edit`}><Pencil /></Link><button disabled={busyId === item.id} onClick={() => void remove(item)}><Trash2 /></button></article>)}{!items.length && <div className="management-empty"><CalendarPlus /><h2>등록된 일정이 없어요.</h2><Link to="/admin/schedule/new">첫 일정 추가</Link></div>}</section></main>;
}

function ScheduleForm({ programId }: { programId?: number }) {
  const { activeMembership } = useAuth(); const festivalId = activeMembership?.festival_id; const navigate = useNavigate();
  const [booths, setBooths] = useState<Tables<"booths">[]>([]); const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(!!programId); const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", location: "", boothId: "", startsAt: "", endsAt: "", description: "" });
  useEffect(() => { if (festivalId) void getAdminBooths(festivalId).then(setBooths); }, [festivalId]);
  useEffect(() => {
    if (!programId) return;
    void getProgram(programId)
      .then((item) => {
        setForm({
          title: item.title,
          location: "",
          boothId: item.booth_id ? String(item.booth_id) : "",
          startsAt: item.starts_at ? item.starts_at.slice(0, 16) : "",
          endsAt: item.ends_at ? item.ends_at.slice(0, 16) : "",
          description: item.description ?? "",
        });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "일정을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [programId]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!festivalId) return; setSaving(true); setError("");
    const values = {
      title: form.title,
      description: form.description || (form.location ? `장소: ${form.location}` : null),
      booth_id: form.boothId ? Number(form.boothId) : null,
      starts_at: new Date(form.startsAt).toISOString(),
      ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    try {
      if (programId) await updateProgram(programId, values);
      else await createProgram({ ...values, festival_id: festivalId, kind: "other", status: "published" });
      navigate("/admin/schedule");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "일정을 저장하지 못했습니다."); }
    finally { setSaving(false); }
  };
  if (loading) return <main className="management-page"><div className="management-loading"><LoaderCircle /> 불러오는 중…</div></main>;
  return <main className="management-page"><header className="management-header"><div><Link className="back-link" to="/admin/schedule">일정 목록</Link><span>{programId ? "EDIT SCHEDULE" : "NEW SCHEDULE"}</span><h1>{programId ? "일정 수정" : "일정 추가"}</h1><p>시작 시간은 필수입니다.</p></div></header><form className="editor-form" onSubmit={submit}><label><span>일정 제목</span><input required maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 사진 부스 운영 시작" /></label><label><span>연결 부스</span><select value={form.boothId} onChange={(e) => setForm({ ...form, boothId: e.target.value })}><option value="">부스 연결 안 함</option>{booths.map((booth) => <option value={booth.id} key={booth.id}>{booth.name}</option>)}</select></label><label><span>장소</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="예: 본관 앞 광장" /></label><label><span>시작 시간</span><input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label><label><span>종료 시간</span><input type="datetime-local" min={form.startsAt} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label><label><span>안내</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="학생에게 보일 안내" /></label>{error && <p className="form-error">{error}</p>}<footer><Link className="secondary-action" to="/admin/schedule">취소</Link><button className="primary-action" disabled={saving}><Save /> {saving ? "저장 중…" : programId ? "변경 저장" : "일정 등록"}</button></footer></form></main>;
}

export function NewSchedulePage() {
  return <ScheduleForm />;
}

export function EditSchedulePage() {
  const { programId } = useParams();
  return <ScheduleForm programId={Number(programId)} />;
}
