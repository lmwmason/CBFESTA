import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Hash,
  LockKeyhole,
  LogOut,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./auth-context";

export function AuthSheet({ onClose }: { onClose?: () => void }) {
  const {
    signIn,
    signUp,
    user,
    memberships,
    activeMembership,
    setActiveFestival,
    signOut,
  } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    studentNumber: "",
  });
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setState("saving");
    try {
      if (mode === "signin") await signIn(form.email, form.password);
      else await signUp(form);
      onClose?.();
    } catch (caught) {
      setState("idle");
      const message =
        caught instanceof Error
          ? caught.message
          : "요청을 처리하지 못했습니다.";
      setError(
        message.includes("Invalid login")
          ? "이메일 또는 비밀번호를 확인해 주세요."
          : message,
      );
    }
  };
  if (user)
    return (
      <motion.section
        className="auth-sheet"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        {onClose && (
          <button className="sheet-close" onClick={onClose}>
            <X />
          </button>
        )}
        <span>MY ACCOUNT</span>
        <h2>{user.user_metadata.full_name ?? user.email?.split("@")[0]}</h2>
        <p>
          {user.user_metadata.student_number
            ? `${user.user_metadata.student_number} · `
            : ""}
          {user.email}
        </p>
        {memberships.length > 0 && (
          <label className="account-festival">
            <span>현재 축제</span>
            <select
              value={activeMembership?.festival_id}
              onChange={(event) =>
                setActiveFestival(Number(event.target.value))
              }
            >
              {memberships.map((item) => (
                <option key={item.festival_id} value={item.festival_id}>
                  {item.festivals?.name} · {item.role}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="secondary-action signout-button"
          onClick={async () => {
            await signOut();
            onClose?.();
          }}
        >
          <LogOut /> 로그아웃
        </button>
      </motion.section>
    );
  return (
    <motion.section
      className="auth-sheet"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(event) => event.stopPropagation()}
    >
      {onClose && (
        <button className="sheet-close" onClick={onClose} aria-label="닫기">
          <X />
        </button>
      )}
      <span>{mode === "signin" ? "SIGN IN" : "JOIN CBFESTA"}</span>
      <h2>{mode === "signin" ? "다시 만났네요" : "축제를 시작해요"}</h2>
      <>
        <div className="auth-tabs">
          <button
            className={mode === "signin" ? "active" : ""}
            onClick={() => {
              setMode("signin");
              setError("");
            }}
          >
            로그인
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            회원가입
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <div className="auth-row">
              <label>
                <span>이름</span>
                <div>
                  <UserRound />
                  <input
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="홍길동"
                    maxLength={40}
                  />
                </div>
              </label>
              <label>
                <span>학번</span>
                <div>
                  <Hash />
                  <input
                    autoComplete="off"
                    required
                    pattern="[A-Za-z0-9-]{2,20}"
                    value={form.studentNumber}
                    onChange={(event) =>
                      setForm({ ...form, studentNumber: event.target.value })
                    }
                    placeholder="20260101"
                  />
                </div>
              </label>
            </div>
          )}
          <label>
            <span>이메일</span>
            <div>
              <Mail />
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="name@example.com"
              />
            </div>
          </label>
          <label>
            <span>비밀번호</span>
            <div>
              <LockKeyhole />
              <input
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="8자 이상"
              />
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" disabled={state === "saving"}>
            {state === "saving"
              ? "처리 중…"
              : mode === "signin"
                ? "로그인"
                : "계정 만들기"}{" "}
            <ArrowRight />
          </button>
        </form>
      </>
    </motion.section>
  );
}
