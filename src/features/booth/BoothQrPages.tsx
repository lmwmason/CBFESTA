import { useEffect, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { CheckCircle2, MonitorUp, QrCode, RefreshCw, Store } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import { supabase } from "../../lib/supabase/client";
import { createQr, redeemQr } from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

export function BoothDisplaySetupPage() {
  const { activeMembership, user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [booth, setBooth] = useState<Tables<"booths"> | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    if (!supabase || !userId) return;
    void supabase
      .from("booth_members")
      .select("booth_id, booths(*)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setBooth(data?.booths as Tables<"booths"> | null));
  }, [userId]);
  const launch = async () => {
    if (!booth || !activeMembership) return;
    setCreating(true);
    setError("");
    try {
      const { code } = await createQr({
        festivalId: activeMembership.festival_id,
        boothId: booth.id,
        label: `${booth.name} check-in`,
      });
      navigate(`/booth/${booth.id}/display?code=${code}`, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "QR을 만들지 못했습니다.",
      );
    } finally {
      setCreating(false);
    }
  };
  return (
    <main className="display-setup">
      <span>BOOTH MONITOR</span>
      <h1>
        {booth?.name ?? "부스"}
        <br />
        QR 화면
      </h1>
      <p>
        모니터에서 이 화면을 열어두면 학생이 각자 휴대폰으로 인증할 수 있습니다.
      </p>
      {error && <p className="form-error">{error}</p>}
      <button
        className="primary-action"
        disabled={!booth || creating}
        onClick={() => void launch()}
      >
        <MonitorUp /> {creating ? "QR 준비 중…" : "모니터 QR 열기"}
      </button>
    </main>
  );
}

export function BoothDisplayPage() {
  const { boothId } = useParams();
  const [params] = useSearchParams();
  const code = params.get("code");
  const [image, setImage] = useState("");
  const [booth, setBooth] = useState<Tables<"booths"> | null>(null);

  useEffect(() => {
    if (!code) return;
    void QRCode.toDataURL(
      `${window.location.origin}/check-in?code=${encodeURIComponent(code)}`,
      {
        width: 640,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#121212", light: "#00000000" },
      },
    ).then(setImage);
  }, [code]);

  useEffect(() => {
    const id = Number(boothId);
    if (!supabase || Number.isNaN(id)) return;
    void supabase
      .from("booths")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setBooth(data));
  }, [boothId]);

  if (!code)
    return (
      <main className="display-screen">
        <h1>유효하지 않은 QR 화면입니다.</h1>
      </main>
    );
  const accent = booth?.accent_color ?? "#121212";
  return (
    <main
      className="display-screen"
      style={{ "--display-accent": accent } as CSSProperties}
    >
      <header>
        <span className="display-screen-booth">
          {booth?.logo_url ? (
            <img src={booth.logo_url} alt="" />
          ) : (
            <i style={{ backgroundColor: accent }}>
              <Store />
            </i>
          )}
          {booth?.name ?? "CBFESTA"}
        </span>
        <b>BOOTH CHECK-IN</b>
      </header>
      <section>
        <div className="display-qr-frame">
          {image ? (
            <img src={image} alt="학생 인증 QR 코드" />
          ) : (
            <RefreshCw className="spin" />
          )}
        </div>
        <h1>
          QR을 스캔해
          <br />
          참여를 인증하세요.
        </h1>
        <p>로그인 후 자동으로 체크인됩니다.</p>
      </section>
      <footer>CBFESTA</footer>
    </main>
  );
}

export function StudentCheckinPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const code = params.get("code");
  const [state, setState] = useState<"idle" | "checking" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const checkin = async () => {
    if (!code) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/check-in?code=${code}`)}`);
      return;
    }
    setState("checking");
    try {
      const result = await redeemQr(code);
      setState("done");
      setMessage(
        result.type === "mission"
          ? `인증 완료 · +${result.points} P`
          : "체크인이 완료됐어요.",
      );
    } catch (caught) {
      setState("error");
      setMessage(
        caught instanceof Error ? caught.message : "인증하지 못했습니다.",
      );
    }
  };
  return (
    <main className="student-checkin">
      <QrCode />
      <span>CHECK-IN</span>
      <h1>{state === "done" ? "완료됐어요!" : "참여를 인증할까요?"}</h1>
      <p>{message || "부스 QR을 통해 현장 참여를 기록합니다."}</p>
      {state === "idle" && (
        <button className="primary-action" onClick={() => void checkin()}>
          <CheckCircle2 /> 인증하기
        </button>
      )}
      {state === "checking" && <p>인증 중…</p>}
      {state === "done" && (
        <Link className="secondary-action" to="/">
          축제로 돌아가기
        </Link>
      )}
      {state === "error" && (
        <button
          className="secondary-action"
          onClick={() => {
            setState("idle");
            setMessage("");
          }}
        >
          <RefreshCw /> 다시 시도
        </button>
      )}
    </main>
  );
}
