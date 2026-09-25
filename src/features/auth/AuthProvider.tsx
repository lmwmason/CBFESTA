import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/client";
import { AuthContext, type AuthValue, type FestivalRole, type Membership } from "./auth-context";
const ACTIVE_FESTIVAL_KEY = "cbfesta.activeFestivalId";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [rolesByFestival, setRolesByFestival] = useState<Record<number, FestivalRole[]>>({});
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [activeFestivalId, setActiveFestivalId] = useState<number | null>(
    () => {
      const stored = localStorage.getItem(ACTIVE_FESTIVAL_KEY);
      return stored ? Number(stored) : null;
    },
  );

  const refreshMemberships = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMemberships([]);
      setRolesByFestival({});
      return;
    }
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name:
          user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "사용자",
        student_number: user.user_metadata.student_number ?? null,
        avatar_url: user.user_metadata.avatar_url ?? null,
      },
      { onConflict: "id" },
    );
    const [{ data, error }, { data: roleRows, error: roleError }] = await Promise.all([
      supabase
      .from("festival_members")
      .select("*, festivals(*)")
      .eq("user_id", user.id)
      .order("created_at"),
      supabase.from("festival_member_roles").select("festival_id, role").eq("user_id", user.id),
    ]);
    if (error ?? roleError) throw error ?? roleError;
    const next = (data ?? []) as Membership[];
    setMemberships(next);
    setRolesByFestival((roleRows ?? []).reduce<Record<number, FestivalRole[]>>((all, item) => { (all[item.festival_id] ??= []).push(item.role as FestivalRole); return all; }, {}));
    if (next[0])
      setActiveFestivalId((current) => current ?? next[0].festival_id);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) await refreshMemberships();
      })
      .catch(() => {
        setSession(null);
        setMemberships([]);
      })
      .finally(() => setLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
        if (next) void refreshMemberships();
        else { setMemberships([]); setRolesByFestival({}); }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, [refreshMemberships]);

  const setActiveFestival = (festivalId: number) => {
    localStorage.setItem(ACTIVE_FESTIVAL_KEY, String(festivalId));
    setActiveFestivalId(festivalId);
  };
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase 설정이 필요합니다.");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);
  const signUp = useCallback(
    async ({
      email,
      password,
      name,
      studentNumber,
      accountType,
    }: {
      email: string;
      password: string;
      name: string;
      studentNumber: string;
      accountType: "student" | "teacher";
    }) => {
      if (!supabase) throw new Error("Supabase 설정이 필요합니다.");
      const { data, error } = await supabase.functions.invoke("register", {
        body: { email, password, name, studentNumber, accountType },
      });
      if (error)
        throw new Error(
          (data as { error?: string } | null)?.error ?? error.message,
        );
      await signIn(email, password);
    },
    [signIn],
  );
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setMemberships([]);
    setRolesByFestival({});
  };
  const activeMembership =
    memberships.find((item) => item.festival_id === activeFestivalId) ??
    memberships[0] ??
    null;
  const activeRoles = activeMembership ? rolesByFestival[activeMembership.festival_id] ?? [] : [];
  const value = useMemo<AuthValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      memberships,
      activeMembership,
      activeRoles,
      setActiveFestival,
      signIn,
      signUp,
      signOut,
      refreshMemberships,
    }),
    [
      activeMembership,
      activeRoles,
      loading,
      memberships,
      session,
      refreshMemberships,
      signIn,
      signUp,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
