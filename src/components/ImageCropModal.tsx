import { useEffect, useState } from "react";
import { Crop, X } from "lucide-react";

export function ImageCropModal({
  file,
  aspect,
  title,
  onCancel,
  onCropped,
}: {
  file: File;
  aspect: number;
  title: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [offset, setOffset] = useState(0.5);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [url]);

  if (!natural) return null;

  const isWide = natural.w / natural.h > aspect;
  const cropW = isWide ? natural.h * aspect : natural.w;
  const cropH = isWide ? natural.h : natural.w / aspect;
  const maxOffsetX = isWide ? natural.w - cropW : 0;
  const maxOffsetY = !isWide ? natural.h - cropH : 0;
  const offsetX = maxOffsetX * offset;
  const offsetY = maxOffsetY * offset;
  const canPan = maxOffsetX > 0 || maxOffsetY > 0;

  const confirm = () => {
    setBusy(true);
    const outW = 1200;
    const outH = Math.round(outW / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, offsetX, offsetY, cropW, cropH, 0, 0, outW, outH);
      canvas.toBlob(
        (blob) => {
          setBusy(false);
          if (!blob) return;
          const base = file.name.replace(/\.[^.]+$/, "");
          onCropped(new File([blob], `${base}-crop.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    img.src = url;
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal">
        <header>
          <b>{title}</b>
          <button type="button" onClick={onCancel} aria-label="닫기">
            <X />
          </button>
        </header>
        <div
          className="crop-modal-frame"
          style={{ aspectRatio: `${natural.w} / ${natural.h}` }}
        >
          <img src={url} alt="" />
          <div
            className="crop-modal-window"
            style={{
              left: `${(offsetX / natural.w) * 100}%`,
              top: `${(offsetY / natural.h) * 100}%`,
              width: `${(cropW / natural.w) * 100}%`,
              height: `${(cropH / natural.h) * 100}%`,
            }}
          />
        </div>
        {canPan && (
          <input
            className="crop-modal-slider"
            type="range"
            min={0}
            max={100}
            value={offset * 100}
            onChange={(event) => setOffset(Number(event.target.value) / 100)}
          />
        )}
        <footer>
          <button type="button" className="secondary-action" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="primary-action"
            disabled={busy}
            onClick={confirm}
          >
            <Crop /> {busy ? "자르는 중…" : "이 영역으로 자르기"}
          </button>
        </footer>
      </div>
    </div>
  );
}
