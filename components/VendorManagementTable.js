// components/VendorManagementTable.js — 商家管理互動表格
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_META = {
  ACTIVE: { label: "營運中", className: "bg-[var(--success-bg)] text-[var(--success-fg)]" },
  SUSPENDED: { label: "已停權", className: "bg-[var(--error-bg)] text-[var(--error-fg)]" },
};

export default function VendorManagementTable({ vendors }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [violationFor, setViolationFor] = useState(null); // 當前要扣分的商家物件
  const [busyId, setBusyId] = useState(null); // 哪個正在 PUT 切換狀態

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (zoneFilter && v.factoryZone !== zoneFilter) return false;
      if (query) {
        const kw = query.toLowerCase();
        if (
          !v.name.toLowerCase().includes(kw) &&
          !(v.category || "").toLowerCase().includes(kw)
        ) return false;
      }
      return true;
    });
  }, [vendors, query, zoneFilter]);

  async function toggleStatus(vendor) {
    const newStatus = vendor.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const action = newStatus === "SUSPENDED" ? "停權" : "恢復營運";

    if (!window.confirm(`確定要將「${vendor.name}」${action}嗎？\n${
      newStatus === "SUSPENDED"
        ? "停權後員工點餐畫面將看不到此商家"
        : "恢復後員工可以再次訂購此商家的餐點"
    }`)) return;

    setBusyId(vendor.id);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: vendor.name,
          category: vendor.category,
          description: vendor.description,
          factoryZone: vendor.factoryZone,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "更新失敗");
      router.refresh();
    } catch (err) {
      alert(err.message || "更新失敗");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="surface-panel rounded-lg p-5 sm:p-6">
      {/* 搜尋 + 篩選 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋商家名稱或分類"
          className="min-h-10 flex-1 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--admin-coffee-400)] sm:max-w-xs"
        />
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--admin-coffee-400)]"
        >
          <option value="">全部廠區</option>
          <option value="A廠">A 廠</option>
          <option value="B廠">B 廠</option>
          <option value="C廠">C 廠</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-500">
              <th className="py-3 pr-3">商家名稱</th>
              <th className="py-3 pr-3">分類</th>
              <th className="py-3 pr-3">主廠區</th>
              <th className="py-3 pr-3">狀態</th>
              <th className="py-3 pr-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  沒有符合條件的商家
                </td>
              </tr>
            ) : filtered.map((v) => {
              const meta = STATUS_META[v.status] || { label: v.status || "未知", className: "bg-slate-100 text-slate-600" };
              const isActive = v.status === "ACTIVE";
              return (
                <tr key={v.id} className="hover:bg-[var(--surface-muted)]">
                  <td className="py-3 pr-3">
                    <p className="font-bold text-slate-900">{v.name}</p>
                    <p className="text-xs text-slate-400">{v.id.slice(0, 8)}...</p>
                  </td>
                  <td className="py-3 pr-3 text-slate-700">{v.category || "—"}</td>
                  <td className="py-3 pr-3 text-slate-700">{v.factoryZone || "—"}</td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setViolationFor(v)}
                        className="rounded-md border border-[var(--warning-fg)]/30 px-3 py-1 text-xs font-bold text-[var(--warning-fg)] transition hover:bg-[var(--warning-fg)] hover:text-white"
                      >
                        違規扣分
                      </button>
                      <button
                        onClick={() => toggleStatus(v)}
                        disabled={busyId === v.id}
                        className={`rounded-md px-3 py-1 text-xs font-bold transition disabled:opacity-50 ${
                          isActive
                            ? "border border-[var(--error-fg)]/30 text-[var(--error-fg)] hover:bg-[var(--error-fg)] hover:text-white"
                            : "border border-[var(--success-fg)]/30 text-[var(--success-fg)] hover:bg-[var(--success-fg)] hover:text-white"
                        }`}
                      >
                        {busyId === v.id ? "..." : isActive ? "停權" : "恢復營運"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">共 {filtered.length} 戶商家</p>

      {/* 違規扣分彈窗 */}
      {violationFor && (
        <ViolationModal
          vendor={violationFor}
          onClose={() => setViolationFor(null)}
        />
      )}
    </section>
  );
}

function ViolationModal({ vendor, onClose }) {
  const router = useRouter();
  const [points, setPoints] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("請填寫違規原因");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}?action=violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: Number(points),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "扣分失敗");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err.message || "扣分失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="surface-panel w-full max-w-md rounded-lg p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-[var(--admin-coffee-900)]">違規扣分</h3>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="mb-4 rounded-md bg-[var(--surface-muted)] p-3">
          <p className="text-xs text-slate-500">商家</p>
          <p className="font-bold text-slate-900">{vendor.name}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">扣分點數 *</span>
            <input
              type="number"
              min="1"
              max="100"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-coffee-400)]"
            />
            <p className="mt-1 text-xs text-slate-400">建議：輕微 1-3 分、中度 5-10 分、嚴重 15 分以上</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">違規原因 *</span>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="範例：餐點過期、送達延遲超過 30 分、衛生問題"
              className="w-full resize-none rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-coffee-400)]"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-[var(--line)] bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-[var(--warning-fg)] py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "處理中..." : "確認扣分"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}