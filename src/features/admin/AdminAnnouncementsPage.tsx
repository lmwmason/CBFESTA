import { useEffect, useState, type FormEvent } from "react";
import { BellRing, LoaderCircle, Send, ToggleLeft, ToggleRight } from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import { supabase } from "../../lib/supabase/client";
import { useAuth } from "../auth/auth-context";

export function AdminAnnouncementsPage() {
  const { activeMembership, user } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [items, setItems] = useState<Tables<"announcements">[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    if (!supabase || !festivalId) return;
    const { data, error: loadError } = await supabase.from("announcements").select("*").eq("festival_id", festivalId).order("created_at", { ascending: false });
    if (loadError) setError(loadError.message); else setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    if (!supabase || !festivalId) return;
    void supabase.from("announcements").select("*").eq("festival_id", festivalId).order("created_at", { ascending: false }).then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message); else setItems(data ?? []);
      setLoading(false);
    });
  }, [festivalId]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !festivalId || !user) return;
    setSaving(true); setError("");
    const { error: insertError } = await supabase.from("announcements").insert({ festival_id: festivalId, created_by: user.id, title: title.trim(), body: body.trim(), priority, is_published: true, published_at: new Date().toISOString() });
    if (insertError) setError(insertError.message); else { setTitle(""); setBody(""); await load(); }
    setSaving(false);
  };
  const toggle = async (item: Tables<"announcements">) => {
    if (!supabase) return;
    const next = !item.is_published;
    const { error: updateError } = await supabase.from("announcements").update({ is_published: next, published_at: next ? new Date().toISOString() : null }).eq("id", item.id);
    if (updateError) setError(updateError.message); else await load();
  };
  return <main className="management-page"><header className="management-header"><div><span>LIVE NOTICE</span><h1>공지</h1><p>발행 즉시 학생 화면에 표시됩니다.</p></div></header>
    <form className="editor-form" onSubmit={submit}><label><span>제목</span><input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 중앙 무대 공연 시작 안내" /></label><label><span>내용</span><textarea required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="학생에게 전달할 내용을 입력하세요." /></label><label><span>중요도</span><select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="normal">일반</option><option value="important">중요</option><option value="urgent">긴급</option></select></label>{error && <p className="form-error">{error}</p>}<footer><button className="primary-action" disabled={saving}><Send />{saving ? "발행 중…" : "공지 발행"}</button></footer></form>
    <section className="management-table announcement-list">{loading ? <div className="management-loading"><LoaderCircle /> 불러오는 중…</div> : items.map((item) => <article className="management-row" key={item.id}><span><b>{item.title}</b><small>{item.body}</small></span><code>{item.priority.toUpperCase()}</code><button aria-label={item.is_published ? "공지 해제" : "공지 발행"} onClick={() => void toggle(item)}>{item.is_published ? <ToggleRight /> : <ToggleLeft />}</button></article>)}{!loading && !items.length && <div className="management-empty"><BellRing /><h2>아직 공지가 없어요.</h2></div>}</section>
  </main>;
}
