import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.1';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return respond({ error: 'Authentication required' }, 401);
  const url = Deno.env.get('SUPABASE_URL'), anonKey = Deno.env.get('SUPABASE_ANON_KEY'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return respond({ error: 'Server configuration error' }, 500);
  const auth = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return respond({ error: 'Invalid session' }, 401);
  const payload = await request.json();
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const slug = typeof payload.slug === 'string' ? payload.slug.trim().toLowerCase() : '';
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return respond({ error: '축제명과 영문 주소를 확인해 주세요.' }, 400);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc('create_festival_for_actor', { actor: user.id, festival_name: name, festival_slug: slug });
  if (error) return respond({ error: error.code === '23505' ? '이미 사용 중인 주소입니다.' : error.message }, 400);
  return respond({ festivalId: data }, 201);
});
