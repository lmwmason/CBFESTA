import { useEffect, useState, type FormEvent } from "react";
import { Save, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Tables } from "../../lib/supabase/database.types";
import { supabase } from "../../lib/supabase/client";
import { updateBooth, uploadBoothAsset } from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

export function BoothSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booth, setBooth] = useState<Tables<"booths"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    short_description: "",
    description: "",
    location: "",
    accent_color: "#f52a9a",
    status: "draft",
    queue_enabled: true,
    session_minutes: 5,
    concurrent_capacity: 1,
  });

  useEffect(() => {
    if (!supabase || !user) return;
    void supabase
      .from("booth_members")
      .select("booth_id, booths(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError || !data?.booths) {
          setError(loadError?.message ?? "담당 부스를 찾을 수 없습니다.");
          return;
        }
        const item = data.booths as unknown as Tables<"booths">;
        setBooth(item);
        setForm({
          name: item.name,
          short_description: item.short_description ?? "",
          description: item.description ?? "",
          location: item.location ?? "",
          accent_color: item.accent_color,
          status: item.status,
          queue_enabled: item.queue_enabled,
          session_minutes: item.session_minutes,
          concurrent_capacity: item.concurrent_capacity,
        });
      });
  }, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!booth) return;
    setSaving(true);
    setError("");
    try {
      await updateBooth(booth.id, {
        ...form,
        short_description: form.short_description || null,
        description: form.description || null,
        location: form.location || null,
      });
      navigate("/booth");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "부스 정보를 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (slot: "logo" | "cover", file: File) => {
    if (!booth) return;
    setUploading(slot);
    setError("");
    try {
      const url = await uploadBoothAsset(booth.festival_id, booth.id, slot, file);
      const updated = await updateBooth(booth.id, {
        [slot === "logo" ? "logo_url" : "cover_url"]: url,
      });
      setBooth(updated);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "이미지를 업로드하지 못했습니다.",
      );
    } finally {
      setUploading(null);
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <Link className="back-link" to="/booth">
            부스 운영
          </Link>
          <span>BOOTH SETTINGS</span>
          <h1>부스 꾸미기</h1>
          <p>학생에게 보이는 소개와 현장 운영 상태를 직접 관리합니다.</p>
        </div>
      </header>
      <form className="editor-form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          <span>부스 로고</span>
          {booth?.logo_url && (
            <img className="team-logo-preview" src={booth.logo_url} alt="" />
          )}
          <label className="upload-zone">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={!booth || uploading !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage("logo", file);
              }}
            />
            <Upload />
            <b>{uploading === "logo" ? "업로드 중…" : "로고 이미지 선택"}</b>
            <small>PNG, JPG, WEBP, SVG · 10MB 이하</small>
          </label>
        </label>
        <label>
          <span>부스 대표 이미지</span>
          {booth?.cover_url && (
            <img className="team-logo-preview" src={booth.cover_url} alt="" />
          )}
          <label className="upload-zone">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={!booth || uploading !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage("cover", file);
              }}
            />
            <Upload />
            <b>{uploading === "cover" ? "업로드 중…" : "대표 이미지 선택"}</b>
            <small>PNG, JPG, WEBP, SVG · 10MB 이하</small>
          </label>
        </label>
        <label>
          <span>부스 이름</span>
          <input
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          <span>한 줄 소개</span>
          <input
            maxLength={160}
            value={form.short_description}
            onChange={(e) =>
              setForm({ ...form, short_description: e.target.value })
            }
            placeholder="예: 친구들과 사진을 남기는 포토 부스"
          />
        </label>
        <label>
          <span>상세 안내</span>
          <textarea
            rows={8}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={"마크다운으로 작성할 수 있어요.\n예: **굵게**, *기울임*, - 목록, [링크](https://...)"}
          />
          <small>마크다운 문법을 지원합니다. (굵게, 기울임, 목록, 링크 등)</small>
        </label>
        <label>
          <span>위치</span>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="예: 운동장 중앙"
          />
        </label>
        <label>
          <span>운영 상태</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="open">운영 중</option>
            <option value="paused">잠시 멈춤</option>
            <option value="closed">운영 종료</option>
            <option value="draft">비공개</option>
          </select>
        </label>
        <label>
          <span>1회당 소요 시간 (분)</span>
          <input
            type="number"
            min="1"
            max="240"
            value={form.session_minutes}
            onChange={(e) =>
              setForm({ ...form, session_minutes: Number(e.target.value) })
            }
          />
          <small>한 팀(또는 한 명)을 처리하는 데 걸리는 시간이에요.</small>
        </label>
        <label>
          <span>동시 진행 가능 인원 (팀)</span>
          <input
            type="number"
            min="1"
            max="50"
            value={form.concurrent_capacity}
            onChange={(e) =>
              setForm({
                ...form,
                concurrent_capacity: Number(e.target.value),
              })
            }
          />
          <small>
            인생네컷처럼 여럿이 같이 하는 부스는 팀 단위로, 동시에 여러 팀을
            받을 수 있으면 그 수만큼 입력하세요. 예상 대기 시간은 현재 줄
            길이로 자동 계산돼요.
          </small>
        </label>
        <label>
          <span>줄서기 받기</span>
          <select
            value={form.queue_enabled ? "on" : "off"}
            onChange={(e) =>
              setForm({ ...form, queue_enabled: e.target.value === "on" })
            }
          >
            <option value="on">받는 중</option>
            <option value="off">잠시 중단</option>
          </select>
          <small>중단하면 운영 상태와 별개로 학생이 줄서기 버튼을 볼 수 없어요.</small>
        </label>
        <label>
          <span>대표 색상</span>
          <span className="color-choice">
            <input
              type="color"
              value={form.accent_color}
              onChange={(e) =>
                setForm({ ...form, accent_color: e.target.value })
              }
            />
            <b>{form.accent_color}</b>
          </span>
        </label>
        <footer>
          <Link className="secondary-action" to="/booth">
            취소
          </Link>
          <button className="primary-action" disabled={saving || !booth}>
            <Save /> {saving ? "저장 중…" : "변경 저장"}
          </button>
        </footer>
      </form>
    </main>
  );
}
