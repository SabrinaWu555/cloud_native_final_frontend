// app/(main)/vendor/orders/page.js — 商家訂單列表
import Link from "next/link";
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  ENDPOINTS,
  SERVICES,
  USE_LOCAL_MOCKS,
  apiFetch,
  jsonOrEmpty,
  serviceUrl,
} from "@/lib/api";
import { MOCK_ORDERS } from "@/lib/mockData";

const STATUS_META = {
  ordered:   { label: "已下單", className: "bg-[var(--navy-50)] text-[var(--navy-600)]" },
  preparing: { label: "製作中", className: "bg-yellow-50 text-yellow-600" },
  ready:     { label: "可領取", className: "bg-[var(--success-bg)] text-[var(--success-fg)]" },
  completed: { label: "已完成", className: "bg-slate-100 text-slate-600" },
  cancelled: { label: "已取消", className: "bg-[var(--error-bg)] text-[var(--error-fg)]" },
};

async function getOrders() {
  if (USE_LOCAL_MOCKS) return MOCK_ORDERS;

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!SERVICES.order || !token) return MOCK_ORDERS;

  try {
    const res = await apiFetch(serviceUrl(SERVICES.order, ENDPOINTS.orders), { token });
    if (!res.ok) return MOCK_ORDERS;
    const data = await jsonOrEmpty(res);

    const list = Array.isArray(data) ? data : data.orders || [];

    return list.map((o) => ({
      id:            `ORD-${o.id}`,
      raw_id:        o.id,
      employee_name: o.employee_name || o.user_name || "—",
      menu_name:     o.menu_name || "—",
      status:        o.status,
      order_date:    o.created_at?.slice(0, 10),
      pickup_time:   o.pickup_time || o.pickup_date || null,
      quantity:      Number(o.quantity ?? 1),
      price:         Number(o.price ?? 0),
      total_amount:  Number(o.total_amount ?? 0) || Number(o.price ?? 0) * Number(o.quantity ?? 1),
      cancel_reason: o.cancel_reason || "",
    }));
  } catch {
    return MOCK_ORDERS;
  }
}

function statusMeta(status) {
  return STATUS_META[status] || { label: status || "未知", className: "bg-slate-100 text-slate-600" };
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit", day: "2-digit", weekday: "short",
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  
  const d = new Date(dateStr);
  
  if (isNaN(d.getTime())) {
    console.warn("發現不合法的日期字串:", dateStr);
    return "-"; 
  }
  
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function VendorOrdersPage({ searchParams }) {
  const params   = await searchParams;
  const status   = params?.status || "all";
  const orders   = await getOrders();
  const filtered = status === "all" ? orders : orders.filter((o) => o.status === status);

  const counts = {
    all:       orders.length,
    active:    orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">

      {/* 標題 */}
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/vendor" className="text-xs font-semibold text-[var(--teal-600)] hover:underline">
          ← 返回工作台
        </Link>
        <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">
          Order Management
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[var(--navy-900)]">所有訂單</h1>
            <p className="mt-2 text-sm text-slate-600">
              查看員工的訂餐紀錄，點進明細可查看完整資訊。
            </p>
          </div>
          <form className="flex gap-2">
            <select
              name="status"
              defaultValue={status}
              className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50"
            >
              <option value="all">全部狀態</option>
              <option value="ordered">已下單</option>
              <option value="preparing">製作中</option>
              <option value="ready">可領取</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <button className="rounded-md bg-[var(--navy-600)] px-4 text-sm font-bold text-white hover:bg-[var(--navy-800)]">
              篩選
            </button>
          </form>
        </div>
      </section>

      {/* 統計卡片 */}
      <section className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "全部",   value: counts.all,       color: "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]" },
          { label: "進行中", value: counts.active,    color: "border-yellow-400 bg-yellow-50 text-yellow-600" },
          { label: "已完成", value: counts.completed, color: "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]" },
          { label: "已取消", value: counts.cancelled, color: "border-red-300 bg-red-50 text-red-500" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border-l-4 p-4 ${s.color}`}>
            <p className="text-sm font-bold">{s.label}</p>
            <p className="mt-1 text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </section>

      {/* 訂單列表 */}
      <section className="surface-panel overflow-hidden rounded-lg">

        {/* 桌機表格 */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-[var(--navy-50)] text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">訂單編號</th>
                <th className="px-5 py-3">訂餐員工</th>
                <th className="px-5 py-3">餐點名稱</th>
                <th className="px-5 py-3">數量</th>
                <th className="px-5 py-3">金額</th>
                <th className="px-5 py-3">訂餐時間</th>
                <th className="px-5 py-3">出餐時間</th>
                <th className="px-5 py-3">狀態</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const meta = statusMeta(order.status);
                return (
                  <tr key={order.id} className="hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-4 font-semibold text-[var(--navy-900)]">{order.id}</td>
                    <td className="px-5 py-4 text-slate-600">{order.employee_name}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{order.menu_name}</td>
                    <td className="px-5 py-4 text-slate-600">{order.quantity} 份</td>
                    <td className="px-5 py-4 font-bold text-[var(--navy-600)]">
                      ${order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(order.order_date)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.target_time ? formatDateTime(order.target_time) : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/vendor/orders/${order.raw_id}`}
                        className="rounded-md border border-[var(--navy-100)] px-3 py-2 text-sm font-bold text-[var(--navy-600)] hover:bg-[var(--navy-50)]"
                      >
                        查看
                      </Link>
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
            return (
              <article key={order.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--navy-900)]">{order.menu_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.employee_name}・{order.quantity} 份
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">訂單 {formatDate(order.order_date)}</span>
                  <span className="font-black text-[var(--navy-600)]">
                    ${order.total_amount.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{order.id}</p>
                <Link
                  href={`/vendor/orders/${order.raw_id}`}
                  className="mt-4 inline-flex w-full justify-center rounded-md bg-[var(--navy-600)] px-3 py-2 text-sm font-bold text-white"
                >
                  查看訂單
                </Link>
              </article>
            );
          })}
        </div>

        {!filtered.length && (
          <div className="p-8 text-center text-sm text-slate-500">
            目前沒有符合條件的訂單。
          </div>
        )}
      </section>
    </div>
  );
}