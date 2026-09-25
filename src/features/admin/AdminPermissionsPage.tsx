import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, ShieldCheck, UserRound } from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import {
  getFestivalMembers,
  updateMemberRole,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type Member = Tables<"festival_members"> & {
  profile: Pick<Tables<"profiles">, "display_name" | "student_number"> | null;
};
const labels: Record<Tables<"festival_members">["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  booth_operator: "Booth operator",
  participant: "Participant",
};
const assignable: Tables<"festival_members">["role"][] = [
  "admin",
  "staff",
  "booth_operator",
  "participant",
];

export function AdminPermissionsPage() {
  const { activeMembership, user } = useAuth();
  const festivalId = activeMembership?.festival_id;
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => {
    if (!festivalId) return;
    void getFestivalMembers(festivalId)
      .then(setMembers)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "사용자 목록을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [festivalId]);
  const shown = useMemo(
    () =>
      members.filter((member) =>
        `${member.profile?.display_name ?? ""} ${member.profile?.student_number ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [members, query],
  );
  const changeRole = async (
    member: Member,
    role: Tables<"festival_members">["role"],
  ) => {
    if (!festivalId || member.role === role) return;
    setSaving(member.user_id);
    setError("");
    try {
      const updated = await updateMemberRole(festivalId, member.user_id, role);
      setMembers((items) =>
        items.map((item) =>
          item.user_id === updated.user_id
            ? { ...item, role: updated.role }
            : item,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "권한을 바꾸지 못했습니다.",
      );
    } finally {
      setSaving(null);
    }
  };
  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span>ACCESS CONTROL</span>
          <h1>사용자 권한</h1>
          <p>
            모든 가입자는 Participant로 자동 참가하며, 여기서 운영 권한만
            추가합니다.
          </p>
        </div>
      </header>
      <label className="catalog-search management-search">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름 또는 학번 검색"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <section className="permission-table">
        {loading ? (
          <div className="management-loading">
            <LoaderCircle /> 불러오는 중…
          </div>
        ) : (
          <>
            {shown.map((member) => (
              <article key={member.user_id}>
                <span className="member-avatar">
                  {member.profile?.display_name?.slice(0, 1) ?? <UserRound />}
                </span>
                <span className="member-info">
                  <b>{member.profile?.display_name ?? "이름 미설정"}</b>
                  <small>
                    {member.profile?.student_number ?? "학번 미설정"} ·{" "}
                    {member.user_id === user?.id ? "나" : "가입자"}
                  </small>
                </span>
                {member.role === "owner" ? (
                  <span className="locked-role">
                    <ShieldCheck /> Owner
                  </span>
                ) : (
                  <label className="role-select">
                    <span className="sr-only">권한</span>
                    <select
                      value={member.role}
                      disabled={saving === member.user_id}
                      onChange={(event) =>
                        void changeRole(
                          member,
                          event.target
                            .value as Tables<"festival_members">["role"],
                        )
                      }
                    >
                      {assignable.map((role) => (
                        <option key={role} value={role}>
                          {labels[role]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </article>
            ))}
            {shown.length === 0 && (
              <div className="management-empty">
                <UserRound />
                <h2>일치하는 사용자가 없어요.</h2>
                <p>가입하면 자동으로 Participant로 표시됩니다.</p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
