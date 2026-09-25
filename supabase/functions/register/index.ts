import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const studentNumberPattern = /^[1-9][0-9]{3}$/;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json({ error: 'Server configuration error' }, 500);
    const { email, password, name, studentNumber, accountType } = await request.json();
    if (typeof email !== 'string' || !email.includes('@') || email.length > 254) return json({ error: '올바른 이메일을 입력해 주세요.' }, 400);
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) return json({ error: '비밀번호는 8~72자로 입력해 주세요.' }, 400);
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 40) return json({ error: '이름을 확인해 주세요.' }, 400);
    if (accountType !== 'student' && accountType !== 'teacher') return json({ error: '계정 유형을 확인해 주세요.' }, 400);
    if (accountType === 'student' && (typeof studentNumber !== 'string' || !studentNumberPattern.test(studentNumber.trim()))) return json({ error: '학번 4자리를 입력해 주세요. 예: 2309' }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(), password, email_confirm: true,
      user_metadata: { full_name: name.trim(), student_number: accountType === 'student' ? studentNumber.trim() : null, account_type: accountType },
    });
    if (error) {
      const duplicate = /already|registered|unique/i.test(error.message);
      return json({ error: duplicate ? '이미 가입된 이메일 또는 학번입니다.' : error.message }, duplicate ? 409 : 400);
    }
    return json({ userId: data.user.id }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
