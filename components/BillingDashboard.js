// components/BillingDashboard.js — 福委會帳單儀表板
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_META = {
  pending: { label: "待結算", className: "bg-[var(--warning-bg)] text-[var(--warning-fg)]" },
  paid: { label: "已結算", className: "bg-[var(--success-bg)] text-[var(--success-fg)]" },
  closed: { label: "已關帳", className: "bg-slate-100 text-slate-600" },
};

function formatCurrency(n) {
  return "NT$ " + Number(n || 0).toLocaleString();
}

function formatDate(s) {
  if (!s) return "—";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(s));
}

// 取得「最近 6 個月」清單
function recentMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
    months.push({ value, label });
  }
  return months;
}

export default function BillingDashboard({ statements, vendors }) {
  const router = useRouter();
  const months = useMemo(recentMonths, []);
  const [periodFilter, setPeriodFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // 篩選
  const filtered = useMemo(() => {
    if (!periodFilter) return statements;
    return statements.filter((s) => (s.period || "").startsWith(periodFilter));
  }, [statements, periodFilter]);

  // 統計
  const stats = useMemo(() => {
    const total = filtered.reduce((s, x) => s + Number(x.total_amount || 0), 0);
    const counts = {
      pending: filtered.filter((s) => s.status === "pending").length,
      paid: filtered.filter((s) => s.status === "paid").length,
      closed: filtered.filter((s) => s.status === "closed").length,
    };
    return { total, counts };
  }, [filtered]);

  // 商家對照表（用 vendor_id 找名字）
  const vendorById = useMemo(() => {
    const m = {};
    for (const v of vendors) m[v.id] = v.name;
    return m;
  }, [vendors]);

  async function deleteStatement(id, label) {
    if (!window.confirm(`確定刪除帳單「${label}」嗎？`)) return;
    try {
      const res = await fetch(`/api/admin/statements/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "刪除失敗");
      router.refresh();
    } catch (err) {
      alert(err.message || "刪除失敗");
    }
  }

  function exportCSV() {
    if (filtered.length === 0) {
      alert("沒有資料可匯出");
      return;
    }
    const header = ["帳單編號", "商家", "結算期間", "總金額", "狀態", "建立日期"];
    const rows = filtered.map((s) => [
      s.id,
      vendorById[s.vendor_id] || `(${s.vendor_id})`,
      s.period || "—",
      Number(s.total_amount || 0),
      STATUS_META[s.status]?.label || s.status,
      formatDate(s.created_at),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // 加上 BOM，Excel 開啟才不會亂碼
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing_${periodFilter || "all"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--admin-coffee-600)]">
              Billing
            </p>
            <h1 className="mt-2 text-3xl font-black text-[var(--admin-coffee-900)]">帳單管理</h1>
            <p className="mt-1 text-sm text-slate-500">管理每月商家結算、匯出 CSV 報表</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              className="min-h-10 rounded-md border border-[var(--admin-coffee-400)] bg-white px-4 text-sm font-bold text-[var(--admin-coffee-700)] transition hover:bg-[var(--admin-coffee-50)]"
            >
              匯出 CSV
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="min-h-10 rounded-md bg-[var(--admin-coffee-600)] px-4 text-sm font-bold text-white transition hover:bg-[var(--admin-coffee-700)]"
            >
              ＋ 建立帳單
            </button>
          </div>
        </div>

        {/* 統計列 */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-md bg-[var(--admin-coffee-50)] p-3">
            <p className="text-xs font-semibold text-slate-600">{periodFilter || "全部"}總金額</p>
            <p className="mt-1 text-2xl font-black text-[var(--admin-coffee-700)]">
              {formatCurrency(stats.total)}
            </p>
          </div>
          <div className="rounded-md bg-[var(--warning-bg)] p-3 text-center">
            <p className="text-2xl font-black text-[var(--warning-fg)]">{stats.counts.pending}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">待結算</p>
          </div>
          <div className="rounded-md bg-[var(--success-bg)] p-3 text-center">
            <p className="text-2xl font-black text-[var(--success-fg)]">{stats.counts.paid}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">已結算</p>
          </div>
          <div className="rounded-md bg-slate-100 p-3 text-center">
            <p className="text-2xl font-black text-slate-700">{stats.counts.closed}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">已關帳</p>
          </div>
        </div>

        {/* 月份篩選 */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setPeriodFilter("")}
            className={`rounded-md border px-3 py-1.5 text-sm font-bold transition ${
              !periodFilter
                ? "border-[var(--admin-coffee-600)] bg-[var(--admin-coffee-600)] text-white"
                : "border-[var(--line)] bg-white text-slate-600 hover:border-[var(--admin-coffee-400)]"
            }`}
          >
            全部
          </button>
          {months.map((m) => {
            const active = periodFilter === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setPeriodFilter(m.value)}
                className={`rounded-md border px-3 py-1.5 text-sm font-bold transition ${
                  active
                    ? "border-[var(--admin-coffee-600)] bg-[var(--admin-coffee-600)] text-white"
                    : "border-[var(--line)] bg-white text-slate-600 hover:border-[var(--admin-coffee-400)]"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 列表 */}
      <section className="surface-panel rounded-lg p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase text-slate-500">
                <th className="py-3 pr-3">帳單編號</th>
                <th className="py-3 pr-3">商家</th>
                <th className="py-3 pr-3">結算期間</th>
                <th className="py-3 pr-3 text-right">總金額</th>
                <th className="py-3 pr-3">狀態</th>
                <th className="py-3 pr-3">建立日期</th>
                <th className="py-3 pr-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    {periodFilter ? `${periodFilter} 沒有帳單` : "尚未建立任何帳單"}
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const meta = STATUS_META[s.status] || { label: s.status, className: "bg-slate-100 text-slate-600" };
                return (
                  <tr key={s.id} className="hover:bg-[var(--surface-muted)]">
                    <td className="py-3 pr-3 font-mono text-xs text-slate-500">#{s.id}</td>
                    <td className="py-3 pr-3 font-semibold text-slate-900">
                      {vendorById[s.vendor_id] || `(${s.vendor_id})`}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">{s.period || "—"}</td>
                    <td className="py-3 pr-3 text-right font-black text-[var(--admin-coffee-700)]">
                      {formatCurrency(s.total_amount)}
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-slate-500">{formatDate(s.created_at)}</td>
                    <td className="py-3 pr-3 text-right">
                      <button
                        onClick={() => deleteStatement(s.id, `${vendorById[s.vendor_id] || s.vendor_id} - ${s.period}`)}
                        className="rounded-md border border-[var(--error-fg)]/30 px-3 py-1 text-xs font-bold text-[var(--error-fg)] transition hover:bg-[var(--error-fg)] hover:text-white"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">共 {filtered.length} 筆帳單</p>
      </section>

      {showCreate && <CreateStatementModal vendors={vendors} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateStatementModal({ vendors, onClose }) {
  const router = useRouter();
  const months = useMemo(recentMonths, []);
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");
  const [period, setPeriod] = useState(months[0]?.value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, statement_period: period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "建立失敗");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err.message || "建立失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="surface-panel w-full max-w-md rounded-lg p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-[var(--admin-coffee-900)]">建立帳單</h3>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
        </div>

        <p className="mb-4 rounded-md bg-[var(--surface-muted)] p-3 text-xs text-slate-600">
          系統會自動從訂單服務拉取該商家該月份的訂單，計算總金額後寫入帳單。
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">商家 *</span>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-coffee-400)]"
            >
              {vendors.length === 0 ? (
                <option value="">（沒有商家）</option>
              ) : (
                vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">結算期間 *</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-coffee-400)]"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
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
              disabled={saving || !vendorId}
              className="flex-1 rounded-md bg-[var(--admin-coffee-600)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--admin-coffee-700)] disabled:opacity-50"
            >
              {saving ? "計算中..." : "建立"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}