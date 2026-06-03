"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderCompleteButton({ orderId, status }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canComplete = status === "ready";

  if (!canComplete) return null;

  async function completeOrder() {
    if (!window.confirm("確認已收到餐點，將訂單標記為已完成？")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, { method: "PATCH" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "操作失敗");
      setMessage("訂單已標記為已完成");
      router.refresh();
    } catch (err) {
      setError(err.message || "操作失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-3 rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-3 rounded-md bg-[var(--success-bg)] px-3 py-2 text-sm font-medium text-[var(--success-fg)]">
          {message}
        </div>
      )}
      <button
        onClick={completeOrder}
        disabled={saving}
        className="min-h-11 w-full rounded-md bg-[var(--teal-600)] px-6 text-sm font-bold text-white transition hover:bg-[var(--teal-700)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "處理中..." : "已收到"}
      </button>
    </div>
  );
}
