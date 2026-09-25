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

export async function getAnnouncements(festivalId: number) {
  const { data, error } = await requireClient()
    .from("announcements")
    .select("*")
    .eq("festival_id", festivalId)
    .eq("is_published", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBoothDetail(boothId: number) {
  const client = requireClient();
  const [booth, inventory, announcements] = await Promise.all([
    client.from("booths").select("*").eq("id", boothId).single(),
    client
      .from("inventory_items")
      .select("*")
      .eq("booth_id", boothId)
      .eq("is_visible", true)
      .order("sort_order"),
    client
      .from("announcements")
      .select("*")
      .eq("booth_id", boothId)
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
  ]);
  const error = booth.error ?? inventory.error ?? announcements.error;
  if (error) throw error;
  return {
    booth: booth.data,
    inventory: inventory.data ?? [],
    announcements: announcements.data ?? [],
  };
}

export async function getFestivalById(id: number) {
  const { data, error } = await requireClient()
    .from("festivals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateFestival(
  id: number,
  values: TablesUpdate<"festivals">,
) {
  const { data, error } = await requireClient()
    .from("festivals")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: number) {
  const { error } = await requireClient()
    .from("announcements")
    .delete()
    .eq("id", id);
  if (error) throw error;
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

export async function getAdminPrograms(festivalId: number) {
  const { data, error } = await requireClient()
    .from("programs")
    .select("*")
    .eq("festival_id", festivalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAdminBooths(festivalId: number) {
  const { data, error } = await requireClient()
    .from("booths")
    .select("*")
    .eq("festival_id", festivalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBooth(values: TablesInsert<"booths">) {
  const { data, error } = await requireClient()
    .from("booths")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createProgram(values: TablesInsert<"programs">) {
  const { data, error } = await requireClient()
    .from("programs")
    .insert(values)
    .select()
    .single();
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

export async function getBoothInventory(boothId: number) {
  const { data, error } = await requireClient()
    .from("inventory_items")
    .select("*")
    .eq("booth_id", boothId)
    .order("sort_order")
    .order("id");
  if (error) throw error;
  return data;
}

export async function createInventoryItem(
  values: TablesInsert<"inventory_items">,
) {
  const { data, error } = await requireClient()
    .from("inventory_items")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInventoryItem(
  id: number,
  values: TablesUpdate<"inventory_items">,
) {
  const { data, error } = await requireClient()
    .from("inventory_items")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id: number) {
  const { error } = await requireClient()
    .from("inventory_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
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

export async function getFestivalMembers(festivalId: number) {
  const client = requireClient();
  const { data: members, error } = await client
    .from("festival_members")
    .select("*")
    .eq("festival_id", festivalId)
    .order("created_at");
  if (error) throw error;
  const ids = (members ?? []).map((member) => member.user_id);
  const { data: profiles, error: profileError } = ids.length
    ? await client
        .from("profiles")
        .select("id, display_name, student_number")
        .in("id", ids)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  return (members ?? []).map((member) => ({
    ...member,
    profile: profileById.get(member.user_id) ?? null,
  }));
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

export async function getBoothQueue(boothId: number) {
  const { data, error } = await requireClient()
    .from("queue_entries")
    .select("*")
    .eq("booth_id", boothId)
    .in("status", ["waiting", "called"])
    .order("queue_number");
  if (error) throw error;
  return data;
}

export async function getMyQueueEntry(boothId: number, userId: string) {
  const { data, error } = await requireClient()
    .from("queue_entries")
    .select("*")
    .eq("booth_id", boothId)
    .eq("user_id", userId)
    .in("status", ["waiting", "called"])
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAdminReports(festivalId: number) {
  const { data, error } = await requireClient()
    .from("reports")
    .select("*")
    .eq("festival_id", festivalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateReport(id: number, values: TablesUpdate<"reports">) {
  const { data, error } = await requireClient()
    .from("reports")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTeam(id: number) {
  const { data, error } = await requireClient()
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAdminTeams(festivalId: number) {
  const { data, error } = await requireClient()
    .from("teams")
    .select("*")
    .eq("festival_id", festivalId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createTeam(values: TablesInsert<"teams">) {
  const { data, error } = await requireClient()
    .from("teams")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id: number, values: TablesUpdate<"teams">) {
  const { data, error } = await requireClient()
    .from("teams")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTeamRoster(festivalId: number) {
  const client = requireClient();
  const { data: teams, error: teamError } = await client
    .from("teams")
    .select("id")
    .eq("festival_id", festivalId);
  if (teamError) throw teamError;
  const teamIds = (teams ?? []).map((team) => team.id);
  if (!teamIds.length) return [];
  const { data: members, error } = await client
    .from("team_members")
    .select("*")
    .in("team_id", teamIds);
  if (error) throw error;
  const ids = (members ?? []).map((member) => member.user_id);
  const { data: profiles, error: profileError } = ids.length
    ? await client
        .from("profiles")
        .select("id, display_name, student_number")
        .in("id", ids)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  return (members ?? []).map((member) => ({
    ...member,
    profile: profileById.get(member.user_id) ?? null,
  }));
}

export async function balanceTeams(festivalId: number) {
  const { data, error } = await requireClient().rpc(
    "assign_unassigned_students_to_teams",
    { target_festival_id: festivalId },
  );
  if (error) throw error;
  return data?.[0] ?? { assigned_count: 0, unassigned_count: 0 };
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

export function subscribeToBoothOperations(
  boothId: number,
  onChange: () => void,
) {
  const client = requireClient();
  const channel = client
    .channel(`booth-ops:${boothId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "queue_entries",
        filter: `booth_id=eq.${boothId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "inventory_items",
        filter: `booth_id=eq.${boothId}`,
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
