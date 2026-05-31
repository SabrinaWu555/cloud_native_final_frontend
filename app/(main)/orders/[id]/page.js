// app/(main)/orders/[id]/page.js — 訂單明細
import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS, apiFetch, jsonOrEmpty, serviceUrl } from "@/lib/api";
import { getMockOrder } from "@/lib/mockData";
import OrderCancelPanel from "@/components/OrderCancelPanel";

const STATUS_LABELS = { ordered: "已下單", ready: "可領取", completed: "已完成", cancelled: "已取消" };

async function getOrder(id) {
  if (USE_LOCAL_MOCKS || !SERVICES.order) return getMockOrder(id);
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  try {
    const res = await apiFetch(serviceUrl(SERVICES.order, ENDPOINTS.orders) + `/${encodeURIComponent(id)}`, { token });
    if (!res.ok) return getMockOrder(id);
    return await jsonOrEmpty(res);
  } catch {
    return getMockOrder(id);
  }
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <div className="surface-panel mx-auto max-w-[1440px] rounded-lg p-8">
        <p className="text-sm font-semibold text-[var(--error-fg)]">找不到這筆訂單。</p>
        <Link href="/orders" className="mt-4 inline-flex text-sm font-bold text-[var(--navy-600)]">返回歷史訂單</Link>
      </div>
    );
  }

  const items = order.items?.length
    ? order.items
    : order.menu_name
      ? [{ name: order.menu_name, quantity: order.quantity || 1, price: order.price }]
      : [];
  const total = order.total_amount ?? items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/orders" className="text-sm font-bold text-[var(--navy-600)] hover:underline">返回歷史訂單</Link>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">Order Detail</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--navy-900)]">{order.id}</h1>
            <p className="mt-1 text-sm text-slate-500">配送日期：{order.target_date || order.order_date || "-"}・{order.vendor_name}</p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-[var(--navy-50)] px-3 py-1.5 text-sm font-bold text-[var(--navy-600)]">
            {STATUS_LABELS[order.status] || order.status || "未知"}
          </span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* 左：餐點明細 */}
        <div className="surface-panel rounded-lg p-5">
          <p className="text-sm font-bold text-slate-500">餐點明細</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-bold text-[var(--navy-900)]">{item.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">${item.price} × {item.quantity}</p>
                </div>
                <span className="font-bold text-slate-900">${(item.price || 0) * (item.quantity || 1)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-semibold text-slate-500">總金額</span>
            <span className="text-2xl font-black text-[var(--navy-600)]">${total}</span>
          </div>
        </div>

        {/* 右：只剩取消 */}
        <OrderCancelPanel
          orderId={order.id}
          status={order.status}
          targetDate={order.target_date}     // ← 新增這行
          initialReason={order.cancel_reason || ""}
        />
      </section>
    </div>
  );
}