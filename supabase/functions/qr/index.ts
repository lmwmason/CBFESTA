import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.1';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return json({ error: 'Authentication required' }, 401);
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anonKey || !serviceKey) return json({ error: 'Server configuration error' }, 500);

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Invalid session' }, 401);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const payload = await request.json();

    if (payload.action === 'redeem') {
      if (typeof payload.code !== 'string' || payload.code.length < 16) return json({ error: 'Invalid QR code' }, 400);
      const { data, error } = await admin.rpc('redeem_qr_for_actor', { actor: user.id, raw_code: payload.code });
      if (error) return json({ error: error.message }, error.message.includes('Already') ? 409 : 400);
      return json(data);
    }
    if (payload.action === 'create') {
      const { data, error } = await admin.rpc('create_qr_code_for_actor', {
        actor: user.id, target_festival_id: payload.festivalId, target_booth_id: payload.boothId ?? null,
        target_program_id: payload.programId ?? null, code_label: payload.label ?? 'QR',
      });
      if (error) return json({ error: error.message }, 403);
      return json({ code: data });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
