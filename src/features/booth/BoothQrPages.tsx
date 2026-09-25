import { useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import QrScanner from "qr-scanner";
import qrScannerWorkerPath from "qr-scanner/qr-scanner-worker.min.js?url";
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
      `${window.location.origin}/check-in?code=${encodeURIComponent(code)}&booth=${encodeURIComponent(booth?.name ?? "부스")}`,
      {
        width: 640,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#121212", light: "#00000000" },
      },
    ).then(setImage);
  }, [code, booth?.name]);

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
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(() => params.get("code"));
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [targetName, setTargetName] = useState(() => params.get("booth") ?? "");
  useEffect(() => {
    QrScanner.WORKER_PATH = qrScannerWorkerPath;
    if (code || state !== "idle" || !videoRef.current) return;
    const scanner = new QrScanner(
      videoRef.current,
      ({ data }) => {
        try {
          const scannedUrl = new URL(data);
          const scannedCode = scannedUrl.searchParams.get("code");
          const scannedBooth = scannedUrl.searchParams.get("booth");
          if (scannedUrl.pathname !== "/check-in" || !scannedCode) {
            setMessage("CBFESTA 체크인 QR이 아닙니다.");
            return;
          }
          setCode(scannedCode);
          setTargetName(scannedBooth ?? "");
          setParams(scannedBooth ? { code: scannedCode, booth: scannedBooth } : { code: scannedCode }, { replace: true });
        } catch {
          setMessage("CBFESTA 체크인 QR이 아닙니다.");
        }
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: () => undefined,
      },
    );
    scannerRef.current = scanner;
    void scanner.start().catch(() => {
      setMessage("카메라를 사용할 수 없습니다. 브라우저 권한을 확인해주세요.");
    });
    return () => {
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [code, setParams, state]);
  const checkin = async () => {
    if (!code) return;
    if (!user) {
      const next = `/check-in?code=${encodeURIComponent(code)}${targetName ? `&booth=${encodeURIComponent(targetName)}` : ""}`;
      navigate(`/login?next=${encodeURIComponent(next)}`);
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
      {!code && state === "idle" && (
        <div className="checkin-scanner">
          <video ref={videoRef} muted playsInline />
          <QrCode aria-hidden="true" />
        </div>
      )}
      {code && <QrCode />}
      <span>CHECK-IN</span>
      {state === "idle" && code && user ? (
        <>
          <p className="checkin-target-label">방문할 부스</p>
          <h1>{targetName || "부스"}</h1>
          <p>이 부스를 방문한 것이 맞는지 확인해 주세요.</p>
          <button className="primary-action" onClick={() => void checkin()}>
            <CheckCircle2 /> 이 부스 방문 인증하기
          </button>
        </>
      ) : (
        <>
          <h1>
            {state === "done"
              ? "완료됐어요!"
              : code
                ? "로그인 후 방문을 인증하세요."
                : "QR을 스캔해주세요."}
          </h1>
          <p>{message || "부스 화면의 QR을 카메라로 비춰주세요."}</p>
        </>
      )}
      {state === "idle" && code && !user && (
        <button className="primary-action" onClick={() => void checkin()}>
          <CheckCircle2 /> 로그인하고 인증하기
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
            setTargetName("");
            setCode(null);
            setParams({}, { replace: true });
          }}
        >
          <RefreshCw /> 다시 시도
        </button>
      )}
    </main>
  );
}
