import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export function AccountMenu() {
  const {
    user,
    memberships,
    activeMembership,
    activeRoles,
    setActiveFestival,
    signOut,
  } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user)
    return (
      <Link className="login-button" to="/login">
        <LogIn /> 로그인
      </Link>
    );

  const canAdmin = activeRoles.some((role) =>
    ["owner", "admin", "staff"].includes(role),
  );
  const canOperateBooth = activeRoles.includes("booth_operator");
  const name = user.user_metadata.full_name ?? user.user_metadata.login_id;

  return (
    <div className="account-menu" ref={ref}>
      <button
        className="login-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <ShieldCheck />
        <span className="account-label">
          <small>
            {canAdmin ? "ADMIN" : canOperateBooth ? "BOOTH DESK" : "MY ACCOUNT"}
          </small>
          <b>{name}</b>
        </span>
        <ChevronDown className="account-menu-chevron" />
      </button>
      {open && (
        <div className="account-dropdown">
          <div className="account-dropdown-head">
            <b>{name}</b>
            <small>
              {user.user_metadata.student_number
                ? `${user.user_metadata.student_number} · `
                : ""}
              {user.user_metadata.login_id}
            </small>
          </div>
          {canAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}>
              <LayoutDashboard /> 관리자 페이지
            </Link>
          )}
          {canOperateBooth && (
            <Link to="/booth" onClick={() => setOpen(false)}>
              <Store /> 부스 관리
            </Link>
          )}
          <Link to="/account" onClick={() => setOpen(false)}>
            <Settings /> 계정 설정
          </Link>
          {memberships.length > 1 && (
            <label className="account-dropdown-festival">
              <span>현재 축제</span>
              <select
                value={activeMembership?.festival_id}
                onChange={(event) =>
                  setActiveFestival(Number(event.target.value))
                }
              >
                {memberships.map((item) => (
                  <option key={item.festival_id} value={item.festival_id}>
                    {item.festivals?.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="account-dropdown-signout"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            <LogOut /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
