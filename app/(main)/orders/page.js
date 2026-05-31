// app/(main)/orders/page.js — 歷史訂單列表
import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS, apiFetch, jsonOrEmpty, serviceUrl } from "@/lib/api";
import { MOCK_ORDERS } from "@/lib/mockData";

const STATUS_META = {
  ordered: { label: "已下單", className: "bg-[var(--navy-50)] text-[var(--navy-600)]" },
  ready: { label: "可領取", className: "bg-[var(--success-bg)] text-[var(--success-fg)]" },
  completed: { label: "已完成", className: "bg-slate-100 text-slate-600" },
  cancelled: { label: "已取消", className: "bg-[var(--error-bg)] text-[var(--error-fg)]" },
};

async function getOrders() {
  if (USE_LOCAL_MOCKS) return MOCK_ORDERS;

  // 打自己的 /api/orders（會帶 cookie 自動轉發到後端）
  // 這是 server component，所以要用絕對網址
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!SERVICES.order || !token) return MOCK_ORDERS;

  try {
    // 直接打後端，跟 /api/orders/route.js 同樣邏輯但不繞一圈
    const res = await apiFetch(serviceUrl(SERVICES.order, ENDPOINTS.ordersMe), { token });
    if (!res.ok) return MOCK_ORDERS;
    const data = await jsonOrEmpty(res);

    // 後端格式: { orders: [...], count: N }
    const list = Array.isArray(data) ? data : data.orders || [];

    // 把後端的 snake_case 翻譯成前端期待的格式
    return list.map((o) => ({
      id: `ORD-${o.id}`,
      raw_id: o.id,
      vendor_id: o.vendor_id,
      vendor_name: o.vendor_name || "—",
      status: o.status,
      order_date: o.created_at?.slice(0, 10),
      target_date: o.pickup_date,
      pickup_time: "12:20",
      items: [{
        menu_id: o.menu_id,
        name: o.menu_name,
        price: Number(o.price),
        quantity: Number(o.quantity),
      }],
      total_amount: Number(o.price) * Number(o.quantity),
      cancel_reason: o.cancel_reason || "",
    }));
  } catch {
    return MOCK_ORDERS;
  }
}

function statusMeta(status) {
  return STATUS_META[status] || { label: status || "未知", className: "bg-slate-100 text-slate-600" };
}

function formatDate(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit", weekday: "short" }).format(new Date(date));
}

// 把一筆訂單整理成「餐點數 / 餐點名稱 / 總金額」
function orderSummary(order) {
  const items = order.items?.length
    ? order.items
    : order.menu_name
      ? [{ name: order.menu_name, quantity: order.quantity || 1, price: order.price }]
      : [];
  const count = items.reduce((s, i) => s + (i.quantity || 1), 0);
  const names = items.map((i) => i.name).filter(Boolean);
  const namesText = names.length === 0 ? "-" : names.length <= 2 ? names.join("、") : `${names[0]} 等 ${names.length} 項`;
  const total = order.total_amount ?? items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  return { count, namesText, total };
}

export default async function OrdersPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status || "all";
  const orders = await getOrders();
  const filtered = status === "all" ? orders : orders.filter((o) => o.status === status);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">Order History</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[var(--navy-900)]">歷史訂單</h1>
            <p className="mt-2 text-sm text-slate-600">查看訂單與配送日期，進入明細可填寫原因取消。</p>
          </div>
          <form className="flex gap-2">
            <select name="status" defaultValue={status} className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50">
              <option value="all">全部狀態</option>
              <option value="ordered">已下單</option>
              <option value="ready">可領取</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <button className="rounded-md bg-[var(--navy-600)] px-4 text-sm font-bold text-white hover:bg-[var(--navy-800)]">篩選</button>
          </form>
        </div>
      </section>

      <section className="surface-panel overflow-hidden rounded-lg">
        {/* 桌機表格 */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-[var(--navy-50)] text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">訂單編號</th>
                <th className="px-5 py-3">配送日期</th>
                <th className="px-5 py-3">商家</th>
                <th className="px-5 py-3">餐點名稱</th>
                <th className="px-5 py-3">餐點數</th>
                <th className="px-5 py-3">總金額</th>
                <th className="px-5 py-3">狀態</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const meta = statusMeta(order.status);
                const { count, namesText, total } = orderSummary(order);
                return (
                  <tr key={order.id} className="hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-4 font-semibold text-[var(--navy-900)]">{order.id}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(order.target_date || order.order_date)}</td>
                    <td className="px-5 py-4 text-slate-600">{order.vendor_name}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{namesText}</td>
                    <td className="px-5 py-4 text-slate-600">{count} 份</td>
                    <td className="px-5 py-4 font-bold text-[var(--navy-600)]">${total}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/orders/${order.id}`} className="rounded-md border border-[var(--navy-100)] px-3 py-2 text-sm font-bold text-[var(--navy-600)] hover:bg-[var(--navy-50)]">查看</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 手機卡片 */}
        <div className="grid gap-3 p-4 lg:hidden">
          {filtered.map((order) => {
            const meta = statusMeta(order.status);
            const { count, namesText, total } = orderSummary(order);
            return (
              <article key={order.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--navy-900)]">{namesText}</p>
                    <p className="mt-1 text-sm text-slate-500">{order.vendor_name}・{count} 份</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">配送 {formatDate(order.target_date || order.order_date)}</span>
                  <span className="font-black text-[var(--navy-600)]">${total}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{order.id}</p>
                <Link href={`/orders/${order.id}`} className="mt-4 inline-flex w-full justify-center rounded-md bg-[var(--navy-600)] px-3 py-2 text-sm font-bold text-white">查看訂單</Link>
              </article>
            );
          })}
        </div>

        {!filtered.length && <div className="p-8 text-center text-sm text-slate-500">目前沒有符合條件的訂單。</div>}
      </section>
    </div>
  );
}