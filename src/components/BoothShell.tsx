import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Package, QrCode, Store, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { Tables } from "../lib/supabase/database.types";
import { supabase } from "../lib/supabase/client";
import { useAuth } from "../features/auth/auth-context";

const links = [
  { to: "/booth", label: "현황", icon: Store, end: true },
  { to: "/booth/check-in", label: "체크인", icon: QrCode, end: false },
  { to: "/booth/queue", label: "대기열", icon: Users, end: false },
  { to: "/booth/inventory", label: "재고", icon: Package, end: false },
  { to: "/booth/settings", label: "꾸미기", icon: Store, end: false },
];

export function BoothShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [booth, setBooth] = useState<Pick<
    Tables<"booths">,
    "name" | "logo_url" | "accent_color"
  > | null>(null);
  useEffect(() => {
    if (!supabase || !user) return;
    void supabase
      .from("booth_members")
      .select("booths(name, logo_url, accent_color)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const item = data?.booths as Pick<
          Tables<"booths">,
          "name" | "logo_url" | "accent_color"
        > | null;
        if (item) setBooth(item);
      });
  }, [user]);
  return (
    <div className="booth-shell">
      <header className="booth-shell-head">
        <div className="booth-shell-identity">
          {booth?.logo_url ? (
            <img src={booth.logo_url} alt="" />
          ) : (
            <i style={{ backgroundColor: booth?.accent_color ?? "#121212" }}>
              <Store />
            </i>
          )}
          <div>
            <small>BOOTH DESK</small>
            <b>{booth?.name ?? "부스 운영"}</b>
          </div>
        </div>
        <button onClick={() => void signOut()}>
          <LogOut /> 로그아웃
        </button>
      </header>
      <nav className="booth-shell-tabs">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <link.icon />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="booth-shell-body">{children}</div>
    </div>
  );
}
