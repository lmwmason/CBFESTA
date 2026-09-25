import { useState, type FormEvent } from 'react';
import { ArrowRight, LogOut, Mail, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './auth-context';

export function AuthSheet({ onClose }: { onClose: () => void }) {
  const { sendMagicLink, user, memberships, activeMembership, setActiveFestival, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); setState('sending'); try { await sendMagicLink(email); setState('sent'); } catch (caught) { setState('idle'); setError(caught instanceof Error ? caught.message : '로그인 링크를 보내지 못했습니다.'); } };
  if (user) return <motion.section className="auth-sheet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={event => event.stopPropagation()}><button className="sheet-close" onClick={onClose}><X /></button><span>MY ACCOUNT</span><h2>{user.user_metadata.full_name ?? user.email?.split('@')[0]}</h2><p>{user.email}</p>{memberships.length > 0 && <label className="account-festival"><span>현재 축제</span><select value={activeMembership?.festival_id} onChange={event => setActiveFestival(Number(event.target.value))}>{memberships.map(item => <option key={item.festival_id} value={item.festival_id}>{item.festivals?.name} · {item.role}</option>)}</select></label>}<button className="secondary-action signout-button" onClick={async () => { await signOut(); onClose(); }}><LogOut /> 로그아웃</button></motion.section>;
  return <motion.section className="auth-sheet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={event => event.stopPropagation()}>
    <button className="sheet-close" onClick={onClose} aria-label="닫기"><X /></button>
    <span>SIGN IN</span><h2>{state === 'sent' ? '메일을 확인해 주세요' : 'CBFESTA 로그인'}</h2>
    {state === 'sent' ? <><p><b>{email}</b>로 로그인 링크를 보냈습니다. 같은 기기에서 링크를 열어주세요.</p><button className="secondary-action auth-back" onClick={() => setState('idle')}>다른 이메일 사용</button></> : <form onSubmit={submit}><p>학교에서 사용하는 이메일로 로그인하세요. 비밀번호는 필요하지 않습니다.</p><label><span>이메일</span><div><Mail /><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@school.kr" /></div></label>{error && <p className="form-error">{error}</p>}<button className="primary-action" disabled={state === 'sending'}>{state === 'sending' ? '전송 중…' : '로그인 링크 받기'} <ArrowRight /></button></form>}
  </motion.section>;
}
