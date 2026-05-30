// components/OrderCancelPanel.js — 取消訂單（client）
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderCancelPanel({ orderId, status, initialReason = "" }) {
  const router = useRouter();
  const [reason, setReason] = useState(initialReason);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const locked = ["cancelled", "completed"].includes(status);

  async function cancelOrder() {
    if (!window.confirm("確定要取消這筆訂單嗎？")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, cancel_reason: reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "取消失敗");
      setMessage("訂單已取消");
      router.refresh();
    } catch (err) {
      setError(err.message || "取消失敗");
    } finally {
      setSaving(false);
    }
  }

  if (locked) {
    return (
      <div className="surface-panel h-fit rounded-lg p-5">
        <p className="text-sm font-bold text-slate-500">取消訂單</p>
        <p className="mt-3 rounded-md bg-[var(--surface-muted)] p-4 text-sm text-slate-500">
          此訂單狀態為「{status === "completed" ? "已完成" : "已取消"}」，無法取消。
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel h-fit rounded-lg p-5">
      <p className="text-sm font-bold text-slate-500">取消訂單</p>
      <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">填寫取消原因</h2>

      {error && <div className="mt-4 rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">{error}</div>}
      {message && <div className="mt-4 rounded-md bg-[var(--success-bg)] px-3 py-2 text-sm font-medium text-[var(--success-fg)]">{message}</div>}

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-semibold text-slate-700">取消原因</span>
        <textarea
          rows="4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="例如：臨時有會議、改約其他時間"
          className="w-full resize-none rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50"
        />
      </label>

      <button
        onClick={cancelOrder}
        disabled={saving}
        className="mt-5 min-h-11 w-full rounded-md border border-[var(--error-fg)]/30 bg-[var(--error-bg)] px-6 text-sm font-bold text-[var(--error-fg)] transition hover:bg-[var(--error-fg)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "處理中..." : "確認取消訂單"}
      </button>
    </div>
  );
}