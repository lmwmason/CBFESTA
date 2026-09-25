import type { Tables, TablesInsert, TablesUpdate } from './database.types';
import { supabase } from './client';

function requireClient() {
  if (!supabase) throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  return supabase;
}

export async function getPublicFestival(slug: string) {
  const { data, error } = await requireClient().from('festivals').select('*').eq('slug', slug).eq('is_public', true).single();
  if (error) throw error;
  return data;
}

export async function getFestivalCatalog(festivalId: number) {
  const client = requireClient();
  const [categories, programs, booths, teams] = await Promise.all([
    client.from('categories').select('*').eq('festival_id', festivalId).eq('is_visible', true).order('sort_order'),
    client.from('programs').select('*').eq('festival_id', festivalId).in('status', ['published', 'live', 'paused']).order('starts_at'),
    client.from('booths').select('*').eq('festival_id', festivalId).in('status', ['open', 'paused', 'closed']).order('name'),
    client.from('teams').select('*').eq('festival_id', festivalId).order('score', { ascending: false }),
  ]);
  const error = categories.error ?? programs.error ?? booths.error ?? teams.error;
  if (error) throw error;
  return { categories: categories.data, programs: programs.data, booths: booths.data, teams: teams.data };
}

export async function updateCategory(id: number, values: TablesUpdate<'categories'>) {
  const { data, error } = await requireClient().from('categories').update(values).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function createCategory(values: TablesInsert<'categories'>) {
  const { data, error } = await requireClient().from('categories').insert(values).select().single();
  if (error) throw error;
  return data;
}

export async function updateBooth(id: number, values: TablesUpdate<'booths'>) {
  const { data, error } = await requireClient().from('booths').update(values).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function updateMemberRole(festivalId: number, userId: string, role: Tables<'festival_members'>['role']) {
  const { data, error } = await requireClient().from('festival_members').update({ role }).eq('festival_id', festivalId).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string) {
  const { data, error } = await requireClient().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}
