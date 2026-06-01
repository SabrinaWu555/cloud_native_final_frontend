// app/(vendor)/vendor/billing/page.js
import { cookies } from "next/headers";
import Link from "next/link";
import { 
  COOKIE_NAME, 
  SERVICES, 
  ENDPOINTS, 
  apiFetch, 
  jsonOrEmpty, 
  serviceUrl, 
  withPathParams,
  parseJwt 
} from "@/lib/api";

// 取得帳單與違規資料
async function getBillingData() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return { statements: [], incidents: [] };

  // 解出當前登入商家的 userId
  const { userId } = parseJwt(token);
  if (!userId) return { statements: [], incidents: [] };

  let statements = [];
  let incidents = [];

  // 1. 撈取帳單
  try {
    const sUrl = serviceUrl(SERVICES.billing, withPathParams(ENDPOINTS.billingStatementsByUser, { id: userId }));
    console.log("正在請求商家帳單:", sUrl);
    const res = await apiFetch(sUrl, { token });
    console.log(`Billing Statements 狀態碼: ${res.status}`);
    const data = await jsonOrEmpty(res);
    statements = Array.isArray(data) ? data : data.statements || [];
  } catch (err) {
    console.error("撈取帳單失敗:", err.message);
  }

  // 2. 撈取違規事件
  try {
    const iUrl = serviceUrl(SERVICES.billing, withPathParams(ENDPOINTS.billingIncidentsByUser, { id: userId }));
    console.log("正在請求商家違規事件:", iUrl);
    const res = await apiFetch(iUrl, { token });
    console.log(`Billing Incidents 狀態碼: ${res.status}`);
    const data = await jsonOrEmpty(res);
    incidents = Array.isArray(data) ? data : data.incidents || [];
  } catch (err) {
    console.error("撈取違規事件失敗:", err.message);
  }

  return { statements, incidents };
}

export default async function VendorBillingPage() {
  const { statements, incidents } = await getBillingData();

  return (
    <div className="w-full space-y-6">
      {/* 標題區 */}
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-7">
        <Link href="/vendor" className="text-xs font-semibold text-[var(--teal-600)] hover:underline">
          ← 返回工作台
        </Link>
        <div className="mt-3">
          <h1 className="text-3xl font-black text-[var(--navy-900)]">財務與對帳管理</h1>
          <p className="mt-1 text-sm text-slate-500">查看您的歷史營收帳單與平台違規紀錄</p>
        </div>
      </section>

      {/* 帳單模組 */}
      <section className="surface-panel rounded-lg p-5">
        <h2 className="mb-4 text-lg font-black text-[var(--navy-900)]">歷史對帳單</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-[var(--navy-50)] text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">帳單編號</th>
                <th className="px-5 py-3">結算區間</th>
                <th className="px-5 py-3">總餐點份數</th>
                <th className="px-5 py-3">結算總金額</th>
                <th className="px-5 py-3">付款狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statements.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--surface-muted)]">
                  <td className="px-5 py-4 font-semibold text-[var(--navy-900)]">#STMT-{s.id}</td>
                  <td className="px-5 py-4 text-slate-600">{s.period || "2024-01"}</td>
                  <td className="px-5 py-4 text-slate-600">{s.total_quantity ?? 0} 份</td>
                  <td className="px-5 py-4 font-bold text-[var(--navy-600)]">${Number(s.total_amount ?? 0).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.status === 'paid' ? 'bg-[var(--teal-50)] text-[var(--teal-600)]' : 'bg-yellow-50 text-yellow-600'}`}>
                      {s.status === 'paid' ? '已撥款' : '處理中'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!statements.length && (
            <div className="p-8 text-center text-sm text-slate-500">目前尚無歷史對帳單。</div>
          )}
        </div>
      </section>

      {/* 違規紀錄模組 */}
      <section className="surface-panel rounded-lg p-5">
        <h2 className="mb-4 text-lg font-black text-[var(--navy-900)]">店家違規事件紀錄</h2>
        <div className="space-y-3">
          {incidents.map((i) => (
            <div key={i.id} className="flex items-start justify-between rounded-lg border border-red-100 bg-red-50/30 p-4">
              <div>
                <h3 className="font-bold text-red-900">{i.title || "未依時供應餐點"}</h3>
                <p className="mt-1 text-sm text-slate-600">{i.description || "經系統與員工回報，該商家未於約定時間內送達餐點。"}</p>
                <p className="mt-2 text-xs text-slate-400">發生時間: {i.created_at?.slice(0, 10) ?? "—"}</p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  扣款懲罰: ${i.penalty_amount ?? 0}
                </span>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  狀態: {i.status === 'resolved' ? '已處理' : '調查中'}
                </p>
              </div>
            </div>
          ))}
          {!incidents.length && (
            <div className="p-8 text-center text-sm text-slate-500 text-slate-400">表現優良！目前沒有任何違規事件紀錄。</div>
          )}
        </div>
      </section>
    </div>
  );
}