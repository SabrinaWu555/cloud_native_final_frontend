import { cookies } from "next/headers";
import Link from "next/link";
import { COOKIE_NAME, ENDPOINTS, SERVICES, apiFetch, jsonOrEmpty, serviceUrl } from "@/lib/api";
import { MOCK_MENUS, MOCK_ORDERS } from "@/lib/mockData";

async function getOrders() {
  if (!SERVICES.order) {
    console.warn("services.order is not configured, using mock orders");
    return MOCK_ORDERS;
  }
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  try {
    const url = serviceUrl(SERVICES.order, ENDPOINTS.vendorOrders);
    console.log("Asking for vendor orders:", url);

    const res = await apiFetch(url, { token });
    console.log(`Vendor Orders status: ${res.status}`);

    if (!res.ok) {
      console.error(`Vendor Orders failed with status: ${res.status}`);
      return MOCK_ORDERS;
    }
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.orders || MOCK_ORDERS;
  } catch (err) {
    console.error("Network error while fetching vendor orders", err.message);
    return MOCK_ORDERS;
  }
}

async function getMenus() {
  if (!SERVICES.vendor) return MOCK_MENUS;

  const token = (await cookies()).get(COOKIE_NAME)?.value;

  try {
    const res = await apiFetch(serviceUrl(SERVICES.vendor, ENDPOINTS.menus), { token });
    if (!res.ok) return MOCK_MENUS;
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.menus || MOCK_MENUS;
  } catch (err) {
    console.error("Network error while fetching vendor menus", err.message);
    return MOCK_MENUS;
  }
  }

export default async function VendorPage() {
  const [orders, menus] = await Promise.all([getOrders(), getMenus()]);
  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const availableMenus = menus.filter((menu) => Number(menu.daily_limit ?? 0) > 0);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount ?? order.price ?? 0), 0);

  return (
    <div className="w-full space-y-6">
      <section className="surface-panel grid gap-5 rounded-lg px-4 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-7">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">
            Vendor Console
          </p>
          <h1 className="mt-2 text-3xl font-black text-[var(--navy-900)]">商家工作台</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            管理今日供應、查看待出餐訂單，之後可直接接商家菜單與訂單服務。
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/vendor/notifications"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--navy-100)] bg-white px-5 text-sm font-bold text-[var(--navy-600)] transition hover:bg-[var(--surface-muted)]"
          >
            通知中心
          </Link>
          <Link
            href="/vendor/menus/new"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--navy-600)] px-5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)]"
          >
            新增餐點
          </Link>
        </div>
      </section>

      {/* 三欄統計：整合舊版可點擊跳轉專屬路徑功能 */}
      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="待處理訂單" value={activeOrders.length} tone="navy" href="/vendor/orders" />
        <Stat label="供應中餐點" value={availableMenus.length} tone="teal" href="/vendor/menus" />
        <Stat label="今日金額" value={`$${revenue}`} tone="amber" href="/vendor/billing" />
      </section>

      {/* 主內容：菜單 + 訂單 */}
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* 菜單列表：加入「管理菜單 →」跳轉連結 */}
        <div className="surface-panel rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-500">菜單供應</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">今日上架餐點</h2>
            </div>
            <Link
              href="/vendor/menus"
              className="text-xs font-semibold text-[var(--teal-600)] hover:underline"
            >
              管理菜單 →
            </Link>
          </div>
          <div className="grid gap-3">
            {menus.map((menu) => (
              <article key={menu.id} className="rounded-md border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-[var(--navy-900)]">{menu.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{menu.category}</p>
                  </div>
                  <span className="text-lg font-black text-[var(--navy-600)]">${menu.price}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--navy-50)]">
                  <div
                    className="h-full rounded-full bg-[var(--teal-400)]"
                    style={{ width: `${Math.min(100, Number(menu.daily_limit ?? 0) * 5)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  剩餘 {menu.daily_limit ?? 0} 份
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* 訂單表格：整合舊版完整欄位（訂餐時間/出餐時間）、訂單詳細頁跳轉、精緻化狀態色標 */}
        <div className="surface-panel overflow-hidden rounded-lg">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
            <div>
              <p className="text-sm font-bold text-slate-500">出餐佇列</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">近期訂單</h2>
            </div>
            <Link
              href="/vendor/orders"
              className="text-xs font-semibold text-[var(--teal-600)] hover:underline"
            >
              查看全部 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-[var(--navy-50)] text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">訂單編號</th>
                  <th className="px-5 py-3">餐點名稱</th>
                  <th className="px-5 py-3">訂餐時間</th>
                  <th className="px-5 py-3">出餐時間</th>
                  <th className="px-5 py-3">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="bg-white transition hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-4">
                      <Link
                        href={`/vendor/orders/${order.id}`}
                        className="font-semibold text-[var(--navy-600)] hover:underline"
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{order.menu_name ?? "-"}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString("zh-TW", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{order.pickup_time || "-"}</td>
                    <td className="px-5 py-4">
                      <Status value={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone, href }) {
  const className =
    tone === "teal"
      ? "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]"
      : tone === "amber"
        ? "border-[var(--warning-fg)] bg-[var(--warning-bg)] text-[var(--warning-fg)]"
        : "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]";

  const inner = (
    <>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {href && <p className="mt-3"></p>}
    </>
  );

  return href ? (
    <Link
      href={href}
      className={`block rounded-lg border-l-4 p-5 transition hover:brightness-95 ${className}`}
    >
      {inner}
    </Link>
  ) : (
    <div className={`rounded-lg border-l-4 p-5 ${className}`}>{inner}</div>
  );
}

function Status({ value }) {
  const map = {
    ordered: { label: "已下單", color: "bg-blue-50 text-blue-600" },
    preparing: { label: "製作中", color: "bg-yellow-50 text-yellow-600" },
    ready: { label: "可領取", color: "bg-green-50 text-green-600" },
    completed: { label: "已完成", color: "bg-slate-100 text-slate-500" },
    cancelled: { label: "已取消", color: "bg-red-50 text-red-400" },
  };

  const { label = value ?? "未知", color = "bg-[var(--navy-50)] text-[var(--navy-600)]" } =
    map[value] ?? {};

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}