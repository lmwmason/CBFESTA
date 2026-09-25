import type { ReactNode } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Store,
  Tags,
  Trophy,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

const links = [
  { to: "/admin", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/admin/festival", label: "축제 설정", icon: Settings, end: false },
  { to: "/admin/categories", label: "카테고리", icon: Tags, end: false },
  { to: "/admin/booths", label: "부스", icon: Store, end: false },
  { to: "/admin/schedule", label: "일정", icon: CalendarDays, end: false },
  { to: "/admin/announcements", label: "공지", icon: Megaphone, end: false },
  { to: "/admin/teams", label: "팀", icon: Trophy, end: false },
  { to: "/admin/permissions", label: "권한", icon: Users, end: false },
  { to: "/admin/issues", label: "신고·이슈", icon: ClipboardCheck, end: false },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { activeMembership, signOut } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <small>ADMIN</small>
          <b>{activeMembership?.festivals?.name ?? "CBFESTA"}</b>
        </div>
        <nav>
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
        <div className="admin-sidebar-foot">
          <button onClick={() => void signOut()}>
            <LogOut /> 로그아웃
          </button>
        </div>
      </aside>
      <div className="admin-shell-body">{children}</div>
    </div>
  );
}
