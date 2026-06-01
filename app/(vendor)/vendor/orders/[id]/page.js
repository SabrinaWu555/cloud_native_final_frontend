"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_LABELS = {
  ordered: "新訂單 (待處理)",
  preparing: "製作中",
  ready: "餐點已送達/可領取",
  completed: "已完成核銷",
  cancelled: "已取消/已拒單",
};

// 💡 商家狀態推進面板設定
const STATUS_FLOW = {
  ordered: { next: "preparing", label: "👨‍🍳 接受訂單並開始製作", color: "bg-[var(--navy-600)] hover:bg-[var(--navy-800)]" },
  preparing: { next: "ready", label: "🔔 製作完成，通知員工領取", color: "bg-[var(--teal-400)] hover:bg-[var(--teal-600)]" },
  ready: { next: "completed", label: "✅ 員工已取餐，確認核銷", color: "bg-green-600 hover:bg-green-700" },
};

export default function VendorOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || "讀取訂單失敗");

        if (!ignore) setOrder(data);
      } catch (err) {
        if (!ignore) setError(err.message || "讀取訂單失敗");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (id) loadOrder();
    return () => { ignore = true; };
  }, [id]);

  // 💡 商家專用：一鍵變更訂單狀態（PATCH）
  async function handleStatusChange(nextStatus) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "更新訂單狀態失敗");

      setOrder(data);
      setMessage(`訂單狀態已成功變更為：${STATUS_LABELS[nextStatus]}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "更新失敗");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="surface-panel rounded-lg p-8 text-sm text-slate-500">訂單明細讀取中...</div>;
  }

  if (error && !order) {
    return (
      <div className="surface-panel rounded-lg p-8">
        <p className="text-sm font-semibold text-[var(--error-fg)]">{error}</p>
        <Link href="/vendor/orders" className="mt-4 inline-flex text-sm font-bold text-[var(--navy-600)]">
          ← 返回訂單佇列
        </Link>
      </div>
    );
  }

  const currentStatus = order?.status;
  const isFinalStatus = ["cancelled", "completed"].includes(currentStatus);
  const currentFlow = STATUS_FLOW[currentStatus];

  return (
    <div className="w-full space-y-6">
      
      {/* 頂部標題列 */}
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/vendor/orders" className="text-sm font-bold text-[var(--navy-600)] hover:underline">
          ← 返回訂單佇列
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">
              Vendor Order Control
            </p>
            <h1 className="mt-2 text-2xl font-black text-[var(--navy-900)]">訂單編號 #{order.id}</h1>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-bold ${
            currentStatus === 'ordered' ? 'bg-blue-50 text-blue-600' :
            currentStatus === 'preparing' ? 'bg-yellow-50 text-yellow-600' :
            currentStatus === 'ready' ? 'bg-green-50 text-green-600' : 
            currentStatus === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {STATUS_LABELS[currentStatus] || currentStatus}
          </span>
        </div>
      </section>

      {/* 主內容區 */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* 左側：出餐核心核心資訊 (廚房看板模式) */}
        <div className="surface-panel space-y-6 rounded-lg p-6">
          <div>
            <p className="text-sm font-bold text-slate-500">工廠出餐品項</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--navy-900)]">{order.menu_name}</h2>
          </div>

          {/* 廚房最關心的核心大數字 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[var(--navy-50)] p-4 text-center">
              <p className="text-xs font-bold text-slate-500">需求數量</p>
              <p className="mt-1 text-4xl font-black text-[var(--navy-900)]">{order.quantity} <span className="text-xl">份</span></p>
            </div>
            <div className="rounded-lg bg-[var(--teal-50)] p-4 text-center">
              <p className="text-xs font-bold text-slate-500">預計領餐時間</p>
              <p className="mt-1 text-4xl font-black text-[var(--teal-600)]">{order.pickup_time || "12:20"}</p>
            </div>
          </div>

          {/* 員工備註說明 */}
          <div className="rounded-lg border border-[var(--line)] bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">員工客製化備註</p>
            <p className={`mt-2 text-sm font-medium ${order.note ? 'text-slate-800' : 'text-slate-400 italic'}`}>
              {order.note || "（無特殊備註要求）"}
            </p>
          </div>

          {/* 金額財務小計 */}
          <div className="border-t border-slate-100 pt-4">
            <dl className="grid gap-3 text-sm">
              <Info label="下單員工帳號" value={order.user_email || order.userId || "企業員工"} />
              <Info label="下單日期" value={order.order_date} />
              <Info label="餐點單價" value={`$${order.price}`} />
              <Info label="訂單總總價" value={`$${order.total_amount ?? (order.price * order.quantity)}`} />
            </dl>
          </div>
        </div>

        {/* 右側：商家狀態管理面板 */}
        <div className="surface-panel flex flex-col justify-between rounded-lg p-6">
          <div>
            <p className="text-sm font-bold text-slate-500">工作台操作</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">狀態流程控制</h2>
            
            {error && (
              <div className="mt-4 rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 rounded-md bg-[var(--success-bg)] px-3 py-2 text-sm font-medium text-[var(--success-fg)]">
                {message}
              </div>
            )}

            {/* 核心推進按鈕 */}
            <div className="mt-6">
              {!isFinalStatus && currentFlow ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">請在完成當前階段工作後點擊下方按鈕：</p>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleStatusChange(currentFlow.next)}
                    className={`min-h-14 w-full rounded-md text-base font-bold text-white shadow-md transition transform active:scale-95 disabled:bg-slate-300 ${currentFlow.color}`}
                  >
                    {saving ? "正在變更訂單狀態..." : currentFlow.label}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 py-8 text-center border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400">
                    {currentStatus === "completed" ? "🎉 此訂單已完成全流程核銷" : "🛑 此訂單已被取消/拒單"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 拒單/取消功能：只有在未做完前可以執行 */}
          {!isFinalStatus && (
            <div className="mt-8 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-2">若因食材不足或特殊狀況無法出餐：</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (window.confirm("確定要拒絕/取消這筆訂單嗎？此操作將發送通知給員工。")) {
                    handleStatusChange("cancelled");
                  }
                }}
                className="w-full rounded-md border border-[var(--error-fg)]/30 py-2.5 text-xs font-bold text-[var(--error-fg)] transition hover:bg-[var(--error-bg)] disabled:cursor-not-allowed"
              >
                🚨 商家主動拒單/取消訂單
              </button>
            </div>
          )}
        </div>

      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-2">
      <dt className="text-slate-500 text-xs">{label}</dt>
      <dd className="font-semibold text-slate-800">{value || "-"}</dd>
    </div>
  );
}