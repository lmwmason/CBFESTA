import { useState, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, LogOut } from 'lucide-react';
import brandLogo from '../../assets/cbfesta-logo.png';
import { setupFestival } from '../../lib/supabase/services';
import { useAuth } from '../auth/auth-context';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/[가-힣]+/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export function FestivalOnboarding() {
  const { refreshMemberships, signOut, setActiveFestival } = useAuth();
  const [name, setName] = useState(''); const [slug, setSlug] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const result = await setupFestival(name, slug); setActiveFestival(result.festivalId); await refreshMemberships(); } catch (caught) { setError(caught instanceof Error ? caught.message : '축제를 만들지 못했습니다.'); } finally { setSaving(false); } };
  return <main className="onboarding"><header><img src={brandLogo} alt="" /><b>CBFESTA</b><button onClick={() => void signOut()}><LogOut /> 로그아웃</button></header><section><span>FIRST SETUP</span><h1>첫 축제를<br />만들어 볼까요?</h1><p>기본 카테고리와 권한이 자동으로 준비됩니다. 나머지는 운영하면서 자유롭게 바꿀 수 있어요.</p><form onSubmit={submit}><label><span>축제 이름</span><input required maxLength={60} value={name} onChange={event => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} placeholder="예: 천북제 2026" /></label><label><span>축제 주소</span><div className="slug-field"><small>/festival/</small><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={event => setSlug(slugify(event.target.value))} placeholder="cheonbuk-2026" /></div></label>{error && <p className="form-error">{error}</p>}<button className="primary-action" disabled={saving}><CalendarDays /> {saving ? '준비 중…' : '축제 만들기'} <ArrowRight /></button></form></section></main>;
}
