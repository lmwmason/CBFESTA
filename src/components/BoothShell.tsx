import { useEffect, useState, type ReactNode } from "react";
import { Package, QrCode, Store, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
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
  const { user } = useAuth();
  const [boothName, setBoothName] = useState("");
  useEffect(() => {
    if (!supabase || !user) return;
    void supabase
      .from("booth_members")
      .select("booths(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const name = (data?.booths as { name: string } | null)?.name;
        if (name) setBoothName(name);
      });
  }, [user]);
  return (
    <div className="booth-shell">
      <header className="booth-shell-head">
        <small>BOOTH DESK</small>
        <b>{boothName || "부스 운영"}</b>
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
