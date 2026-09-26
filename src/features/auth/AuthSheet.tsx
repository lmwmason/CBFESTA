import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Hash,
  IdCard,
  LockKeyhole,
  UserRound,
  GraduationCap,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./auth-context";

export function AuthSheet({ onClose }: { onClose?: () => void }) {
  // Only ever rendered for signed-out visitors — LoginPage redirects an
  // already-authenticated user away before this mounts. Account actions
  // (sign out, switch festival, jump to workspace) live in the header's
  // AccountMenu dropdown instead.
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({
    id: "",
    password: "",
    name: "",
    studentNumber: "",
    accountType: "student" as "student" | "teacher",
  });
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setState("saving");
    try {
      if (mode === "signin") await signIn(form.id, form.password);
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
          ? "아이디 또는 비밀번호를 확인해 주세요."
          : message,
      );
    }
  };
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
                <span>계정 유형</span>
                <div>
                  <GraduationCap />
                  <select
                    value={form.accountType}
                    onChange={(event) =>
                      setForm({ ...form, accountType: event.target.value as "student" | "teacher" })
                    }
                  >
                    <option value="student">학생</option>
                    <option value="teacher">교직원</option>
                  </select>
                </div>
              </label>
            </div>
          )}
          {mode === "signup" && form.accountType === "student" && (
            <label>
              <span>학번</span>
              <div>
                <Hash />
                <input
                  autoComplete="off"
                  required
                  pattern="[1-9][0-9]{3}"
                  value={form.studentNumber}
                  onChange={(event) =>
                    setForm({ ...form, studentNumber: event.target.value })
                  }
                  placeholder="2309"
                />
              </div>
            </label>
          )}
          <label>
            <span>아이디</span>
            <div>
              <IdCard />
              <input
                type="text"
                autoComplete="username"
                required
                pattern="[a-zA-Z0-9_-]{3,20}"
                value={form.id}
                onChange={(event) =>
                  setForm({ ...form, id: event.target.value })
                }
                placeholder="영문·숫자 3~20자"
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
