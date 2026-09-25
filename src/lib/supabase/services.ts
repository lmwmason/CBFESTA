import type { Tables, TablesInsert, TablesUpdate } from "./database.types";
import { supabase } from "./client";

function requireClient() {
  if (!supabase) throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  return supabase;
}

export async function getPublicFestival(slug: string) {
  const { data, error } = await requireClient()
    .from("festivals")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();
  if (error) throw error;
  return data;
}

export async function getCurrentFestival() {
  const { data, error } = await requireClient()
    .from("festivals")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getFestivalCatalog(festivalId: number) {
  const client = requireClient();
  const [categories, programs, booths, teams] = await Promise.all([
    client
      .from("categories")
      .select("*")
      .eq("festival_id", festivalId)
      .eq("is_visible", true)
      .order("sort_order"),
    client
      .from("programs")
      .select("*")
      .eq("festival_id", festivalId)
      .in("status", ["published", "live", "paused"])
      .order("starts_at"),
    client
      .from("booths")
      .select("*")
      .eq("festival_id", festivalId)
      .in("status", ["open", "paused", "closed"])
      .order("name"),
    client
      .from("teams")
      .select("*")
      .eq("festival_id", festivalId)
      .order("score", { ascending: false }),
  ]);
  const error =
    categories.error ?? programs.error ?? booths.error ?? teams.error;
  if (error) throw error;
  return {
    categories: categories.data,
    programs: programs.data,
    booths: booths.data,
    teams: teams.data,
  };
}

export async function getAdminCategories(festivalId: number) {
  const { data, error } = await requireClient()
    .from("categories")
    .select("*")
    .eq("festival_id", festivalId)
    .order("sort_order")
    .order("id");
  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: number,
  values: TablesUpdate<"categories">,
) {
  const { data, error } = await requireClient()
    .from("categories")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createCategory(values: TablesInsert<"categories">) {
  const { data, error } = await requireClient()
    .from("categories")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBooth(id: number, values: TablesUpdate<"booths">) {
  const { data, error } = await requireClient()
    .from("booths")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMemberRole(
  festivalId: number,
  userId: string,
  role: Tables<"festival_members">["role"],
) {
  const { data, error } = await requireClient()
    .from("festival_members")
    .update({ role })
    .eq("festival_id", festivalId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string) {
  const { data, error } = await requireClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export async function redeemQr(code: string) {
  const { data, error } = await requireClient().functions.invoke("qr", {
    body: { action: "redeem", code },
  });
  if (error) throw error;
  return data as {
    ok: true;
    type: "checkin" | "mission";
    points: number;
    team_id: number | null;
  };
}

export async function createQr(input: {
  festivalId: number;
  boothId?: number;
  programId?: number;
  label?: string;
}) {
  const { data, error } = await requireClient().functions.invoke("qr", {
    body: { action: "create", ...input },
  });
  if (error) throw error;
  return data as { code: string };
}

export async function joinQueue(boothId: number, partySize = 1) {
  const { data, error } = await requireClient().functions.invoke("operations", {
    body: { action: "join-queue", boothId, partySize },
  });
  if (error) throw error;
  return data as Tables<"queue_entries">;
}

export async function updateQueueEntry(
  id: number,
  status: Tables<"queue_entries">["status"],
) {
  const values: TablesUpdate<"queue_entries"> = { status };
  if (status === "called") values.called_at = new Date().toISOString();
  if (["served", "cancelled", "no_show"].includes(status))
    values.completed_at = new Date().toISOString();
  const { data, error } = await requireClient()
    .from("queue_entries")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishAnnouncement(
  values: TablesInsert<"announcements">,
) {
  const { data, error } = await requireClient()
    .from("announcements")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createReport(values: TablesInsert<"reports">) {
  const { data, error } = await requireClient()
    .from("reports")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToFestival(festivalId: number, onChange: () => void) {
  const client = requireClient();
  const channel = client
    .channel(`festival:${festivalId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "teams",
        filter: `festival_id=eq.${festivalId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "booths",
        filter: `festival_id=eq.${festivalId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "announcements",
        filter: `festival_id=eq.${festivalId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

async function uploadPublicImage(
  bucket: "team-logos" | "booth-assets",
  path: string,
  file: File,
) {
  if (
    !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
      file.type,
    )
  )
    throw new Error("PNG, JPG, WEBP, SVG 이미지만 업로드할 수 있습니다.");
  const limit = bucket === "team-logos" ? 5_242_880 : 10_485_760;
  if (file.size > limit)
    throw new Error(`파일은 ${limit / 1_048_576}MB 이하여야 합니다.`);
  const client = requireClient();
  const { error } = await client.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw error;
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function uploadTeamLogo(festivalId: number, teamId: number, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  return uploadPublicImage(
    "team-logos",
    `${festivalId}/${teamId}/logo.${extension}`,
    file,
  );
}

export function uploadBoothAsset(
  festivalId: number,
  boothId: number,
  slot: "logo" | "cover",
  file: File,
) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  return uploadPublicImage(
    "booth-assets",
    `${festivalId}/${boothId}/${slot}.${extension}`,
    file,
  );
}
