import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Minus,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import type { Tables } from "../../lib/supabase/database.types";
import { supabase } from "../../lib/supabase/client";
import {
  createInventoryItem,
  deleteInventoryItem,
  getBoothInventory,
  subscribeToBoothOperations,
  updateInventoryItem,
} from "../../lib/supabase/services";
import { useAuth } from "../auth/auth-context";

type InventoryItem = Tables<"inventory_items">;

export function BoothInventoryPage() {
  const { user } = useAuth();
  const [booth, setBooth] = useState<Tables<"booths"> | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [lowStockAt, setLowStockAt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (boothId: number) => {
    try {
      setItems(await getBoothInventory(boothId));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "재고를 불러오지 못했습니다.",
      );
    }
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    void supabase
      .from("booth_members")
      .select("booth_id, booths(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        const item = (data?.booths as Tables<"booths"> | null) ?? null;
        setBooth(item);
        if (item) await load(item.id);
        setLoading(false);
      });
  }, [user, load]);

  useEffect(() => {
    if (!booth) return;
    return subscribeToBoothOperations(booth.id, () => void load(booth.id));
  }, [booth, load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!booth || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createInventoryItem({
        booth_id: booth.id,
        name: name.trim(),
        quantity: 0,
        low_stock_at: lowStockAt,
      });
      setName("");
      setLowStockAt(5);
      await load(booth.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "품목을 추가하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  const adjust = async (item: InventoryItem, delta: number) => {
    if (!booth) return;
    setError("");
    try {
      await updateInventoryItem(item.id, {
        quantity: Math.max(0, item.quantity + delta),
      });
      await load(booth.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "수량을 바꾸지 못했습니다.",
      );
    }
  };

  const toggleVisible = async (item: InventoryItem) => {
    if (!booth) return;
    setError("");
    try {
      await updateInventoryItem(item.id, { is_visible: !item.is_visible });
      await load(booth.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "공개 상태를 바꾸지 못했습니다.",
      );
    }
  };

  const remove = async (item: InventoryItem) => {
    if (!booth) return;
    setError("");
    try {
      await deleteInventoryItem(item.id);
      await load(booth.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "품목을 삭제하지 못했습니다.",
      );
    }
  };

  if (loading)
    return (
      <main className="workspace">
        <div className="workspace-loading">불러오는 중…</div>
      </main>
    );
  if (!booth)
    return (
      <main className="workspace">
        <section className="workspace-empty">
          <Package />
          <h2>배정된 부스가 없어요.</h2>
          <p>축제 관리자가 이 계정에 부스 운영 권한을 연결하면 재고 관리가 열립니다.</p>
        </section>
      </main>
    );

  return (
    <main className="workspace">
      <header className="workspace-head">
        <div>
          <span>BOOTH DESK</span>
          <h1>{booth.name} 재고</h1>
          <p>
            <i /> 품목 {items.length}개
          </p>
        </div>
      </header>
      {error && <p className="form-error">{error}</p>}
      <form className="inventory-add" onSubmit={submit}>
        <input
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="품목 이름 (예: 폴라로이드 필름)"
        />
        <label>
          <span>저재고 기준</span>
          <input
            type="number"
            min={0}
            max={999}
            value={lowStockAt}
            onChange={(event) => setLowStockAt(Number(event.target.value))}
          />
        </label>
        <button className="primary-action" disabled={saving}>
          <Plus /> 추가
        </button>
      </form>
      <section className="inventory-list">
        {items.map((item) => {
          const low = item.quantity <= item.low_stock_at;
          return (
            <article className="inventory-row" key={item.id}>
              <span>
                <b>{item.name}</b>
                {low && (
                  <em className="warning">
                    <AlertTriangle /> 재고 부족
                  </em>
                )}
              </span>
              <span className="inventory-stepper">
                <button type="button" onClick={() => void adjust(item, -1)}>
                  <Minus />
                </button>
                <b>{item.quantity}</b>
                <button type="button" onClick={() => void adjust(item, 1)}>
                  <Plus />
                </button>
              </span>
              <button
                className={`visibility ${item.is_visible ? "visible" : ""}`}
                onClick={() => void toggleVisible(item)}
              >
                {item.is_visible ? <Eye /> : <EyeOff />}{" "}
                {item.is_visible ? "공개" : "숨김"}
              </button>
              <button aria-label={`${item.name} 삭제`} onClick={() => void remove(item)}>
                <Trash2 />
              </button>
            </article>
          );
        })}
        {items.length === 0 && (
          <div className="management-empty">
            <Package />
            <h2>등록된 품목이 없어요.</h2>
          </div>
        )}
      </section>
    </main>
  );
}
