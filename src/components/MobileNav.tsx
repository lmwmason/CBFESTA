import { CalendarDays, Home, QrCode, ShieldCheck, Store } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { roleRoute } from "../lib/roleRoute";

export function MobileNav() {
  const { user, activeMembership } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accountTarget = user ? roleRoute(activeMembership?.role) : "/login";
  const leading = [
    { icon: Home, label: "홈", to: "/" },
    { icon: Store, label: "부스", to: "/booths" },
  ];
  const trailing = [
    { icon: CalendarDays, label: "일정", to: "/schedule" },
    { icon: ShieldCheck, label: "내 정보", to: accountTarget },
  ];
  return (
    <nav className="mobile-nav">
      {leading.map((item) => (
        <button
          key={item.to}
          className={location.pathname === item.to ? "active" : ""}
          onClick={() => navigate(item.to)}
        >
          <item.icon />
          <span>{item.label}</span>
        </button>
      ))}
      <button className="scan" onClick={() => navigate("/check-in")} aria-label="체크인">
        <QrCode />
      </button>
      {trailing.map((item) => (
        <button
          key={item.to}
          className={location.pathname === item.to ? "active" : ""}
          onClick={() => navigate(item.to)}
        >
          <item.icon />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
