// app/(main)/vendor/billing/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  ENDPOINTS,
  SERVICES,
  apiFetch,
  jsonOrEmpty,
  serviceUrl,
  withPathParams,
} from "@/lib/api";

const MOCK_STATEMENTS = [
  { id: "STM-001", statement_period: "2026-04", total_amount: 24800, status: "synced",  synced_at: "2026-05-03T10:00:00Z" },
  { id: "STM-002", statement_period: "2026-03", total_amount: 31200, status: "synced",  synced_at: "2026-04-02T09:30:00Z" },
  { id: "STM-003", statement_period: "2026-02", total_amount: 18900, status: "pending", synced_at: null },
];

// 從 JWT 解出 userId（不需要額外 API call）
function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return payload.userId ?? payload.id ?? null;
  } catch {
    return null;
  }
}

async function getStatements() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !SERVICES.billing) return MOCK_STATEMENTS;

  const userId = getUserIdFromToken(token);
  if (!userId) return MOCK_STATEMENTS;

  try {
    // 用 /billing/statements/user/:id 取自己的結帳單
    const path = withPathParams(ENDPOINTS.billingStatementsByUser, { id: userId });
    const res  = await apiFetch(serviceUrl(SERVICES.billing, path), { token });
    if (!res.ok) return MOCK_STATEMENTS;
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.statements || MOCK_STATEMENTS;
  } catch {
    return MOCK_STATEMENTS;
  }
}

const STATUS_MAP = {
  synced:  { label: "已同步薪資", color: "bg-[var(--teal-50)] text-[var(--teal-600)] border-[var(--teal-400)]" },
  pending: { label: "待結帳",     color: "bg-yellow-50 text-yellow-600 border-yellow-300" },
  failed:  { label: "同步失敗",   color: "bg-red-50 text-red-500 border-red-300" },
};

export default async function VendorBillingPage() {
  const statements   = await getStatements();
  const totalSynced  = statements.filter((s) => s.status === "synced" ).reduce((sum, s) => sum + Number(s.total_amount ?? 0), 0);
  const totalPending = statements.filter((s) => s.status !== "synced" ).reduce((sum, s) => sum + Number(s.total_amount ?? 0), 0);

  return (
    <div className="w-full space-y-6">

      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-7">
        <Link href="/vendor" className="text-xs font-semibold text-[var(--teal-600)] hover:underline">
          ← 返回工作台
        </Link>
        <h1 className="mt-3 text-3xl font-black text-[var(--navy-900)]">帳務管理</h1>
        <p className="mt-1 text-sm text-slate-500">查看每月結帳單與薪資扣款同步狀態</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border-l-4 border-[var(--teal-400)] bg-[var(--teal-50)] p-5 text-[var(--teal-600)]">
          <p className="text-sm font-bold">已結帳總額</p>
          <p className="mt-2 text-3xl font-black">${totalSynced.toLocaleString()}</p>
          <p className="mt-1 text-xs font-semibold opacity-70">已同步薪資系統</p>
        </div>
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-5 text-yellow-600">
          <p className="text-sm font-bold">待結帳金額</p>
          <p className="mt-2 text-3xl font-black">${totalPending.toLocaleString()}</p>
          <p className="mt-1 text-xs font-semibold opacity-70">尚未同步</p>
        </div>
        <div className="rounded-lg border-l-4 border-[var(--navy-600)] bg-[var(--navy-50)] p-5 text-[var(--navy-600)]">
          <p className="text-sm font-bold">結帳單筆數</p>
          <p className="mt-2 text-3xl font-black">{statements.length}</p>
          <p className="mt-1 text-xs font-semibold opacity-70">份</p>
        </div>
      </section>

      <section className="surface-panel overflow-hidden rounded-lg">
        <div className="border-b border-[var(--line)] p-5">
          <h2 className="text-lg font-black text-[var(--navy-900)]">月結帳單</h2>
          <p className="mt-1 text-sm text-slate-500">每月由福委會系統自動產生，同步至公司薪資扣款系統</p>
        </div>

        {statements.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">尚無結帳單</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-[var(--navy-50)] text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">結帳單編號</th>
                  <th className="px-5 py-3">結帳區間</th>
                  <th className="px-5 py-3">金額</th>
                  <th className="px-5 py-3">同步時間</th>
                  <th className="px-5 py-3">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statements.map((s) => {
                  const { label = s.status, color = "bg-slate-100 text-slate-500 border-slate-200" } =
                    STATUS_MAP[s.status] ?? {};
                  return (
                    <tr key={s.id} className="bg-white transition hover:bg-[var(--surface-muted)]">
                      <td className="px-5 py-4 font-semibold text-[var(--navy-900)]">{s.id}</td>
                      <td className="px-5 py-4 text-slate-700">{s.statement_period ?? "-"}</td>
                      <td className="px-5 py-4 font-black text-[var(--navy-900)]">
                        ${Number(s.total_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {s.synced_at
                          ? new Date(s.synced_at).toLocaleString("zh-TW", {
                              year: "numeric", month: "2-digit", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${color}`}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[var(--navy-600)]/10 bg-[var(--navy-50)] px-5 py-4">
        <p className="text-sm font-bold text-[var(--navy-600)]">帳務說明</p>
        <p className="mt-1 text-sm text-slate-600">
          結帳單由福委會每月批次產生，並自動透過薪資系統對員工進行扣款。
          如有疑問請透過申訴系統反映，或聯繫廠區福委會。
        </p>
      </section>

    </div>
  );
}