import { cookies } from "next/headers";
import Link from "next/link";
import { 
  COOKIE_NAME, 
  ENDPOINTS, 
  SERVICES, 
  USE_LOCAL_MOCKS,
  apiFetch, 
  jsonOrEmpty, 
  serviceUrl 
} from "@/lib/api";
import { MOCK_MENUS, MOCK_ORDERS } from "@/lib/mockData";
import { use } from "react";

async function resolveVendorId(token) {
  // Try JWT payload first
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    const id = payload.vendorId || payload.vendor_id || payload.merchantId || "";
    if (id) return String(id);
  } catch {}

  // Fallback: call /vendors/me
  if (SERVICES.vendor) {
    try {
      const res = await apiFetch(serviceUrl(SERVICES.vendor, ENDPOINTS.vendorMe ?? "/api/v1/vendors/me"), { token });
      if (res.ok) {
        const d = await res.json();
        const id = d.id || d.vendorId || d.data?.id || "";
        if (id) return String(id);
      }
    } catch {}
  }

  return "";
}

async function getOrders(rangeParam, fromParam, toParam) {
  if (USE_LOCAL_MOCKS) {
    console.warn("Using local mock orders data. To fetch from backend, set USE_LOCAL_MOCKS=false in environment variables.");
    return MOCK_ORDERS;
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!SERVICES.order || !token) return MOCK_ORDERS;

  try {
    const vendorId = (await cookies()).get("userId")?.value;
    console.log("Resolved vendor ID:", vendorId);
    if (!vendorId) {
      console.error("getOrders: could not resolve vendor ID");
      return MOCK_ORDERS;
    }

    const basePath = `/vendor/orders/vendor/${vendorId}`;
    const base = serviceUrl(SERVICES.order, basePath);

    const { from, to } = calculateDates(rangeParam, fromParam, toParam);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to)   qs.set("to", to);
    
    const url = qs.size ? `${base}?${qs.toString()}` : base;

    console.log("Sending request to backend URL:", url);

    const res = await apiFetch(url, { token });
    if (!res.ok) {
      console.error(`Backend error: ${res.status}`);
      return MOCK_ORDERS;
    }

    const data = await jsonOrEmpty(res);
    const list = Array.isArray(data) ? data : data.orders ?? [];

    return list.map((o) => {
      const price = Number(o.price ?? o.price_snapshot ?? 0);
      const qty   = Number(o.quantity ?? 1);
      return {
        id:            String(o.id).startsWith("ORD-") ? o.id : `ORD-${o.id}`,
        raw_id:        o.raw_id ?? o.id,
        employee_name: o.employee_name ?? o.user_name ?? (o.user_id ? `員工 #${o.user_id}` : "未知員工"),
        menu_name:     o.menu_name ?? o.items?.[0]?.name ?? "未知餐點",
        status:        o.status ?? "pending",
        order_date:    (o.order_date ?? o.created_at)?.slice(0, 10) ?? null,
        pickup_date:   o.pickup_date ?? o.target_date ?? null,
        quantity:      qty,
        price,
        total_amount:  Number(o.total_amount ?? o.total_price ?? price * qty),
        cancel_reason: o.cancel_reason ?? "",
      };
    });
  } catch (error) {
    console.error("取得訂單時發生嚴重例外錯誤:", error);
    return MOCK_ORDERS;
  }
}

function calculateDates(rangeParam, fromParam, toParam) {
  if (fromParam && toParam) {
    return { from: fromParam, to: toParam };
  }

  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localISODate = (date) => new Date(date.getTime() - tzOffset).toISOString().split("T")[0];

  if (rangeParam === "today") {
    const dateStr = localISODate(today);
    return { from: dateStr, to: dateStr };
  }

  if (rangeParam === "upcoming") {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const endDay = new Date();
    endDay.setDate(today.getDate() + 7);

    return { from: localISODate(tomorrow), to: localISODate(endDay) };
  }

  if (rangeParam === "history") {
    const past = new Date();
    past.setMonth(today.getMonth() - 3);
    return { from: localISODate(past), to: localISODate(today) };
  }

  return { from: "", to: "" };
}

async function getBillingRevenue() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !SERVICES.vendor || !SERVICES.billing) return 0;

  try {
    const meRes = await apiFetch(serviceUrl(SERVICES.vendor, ENDPOINTS.vendorMe), { token });
    if (!meRes.ok) return 0;
    const me = await meRes.json();
    const vendorId = me.id;
    if (!vendorId) return 0;

    const statementsRes = await apiFetch(
      serviceUrl(SERVICES.billing, `/billing/billing/statements/user/${vendorId}`),
      { token },
    );
    if (!statementsRes.ok) return 0;
    const statements = await jsonOrEmpty(statementsRes);
    const list = Array.isArray(statements) ? statements : [];
    return list.reduce((sum, s) => sum + Number(s.total_amount ?? 0), 0);
  } catch {
    return 0;
  }
}

async function getMenus() {
  if (!SERVICES.vendor) return MOCK_MENUS;

  const token = (await cookies()).get(COOKIE_NAME)?.value;

  try {
    const res = await apiFetch(serviceUrl(SERVICES.vendor, ENDPOINTS.vendorMeMenus), { token });
    if (!res.ok) return MOCK_MENUS;
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.menus || MOCK_MENUS;
  } catch (err) {
    console.error("Network error while fetching vendor menus", err.message);
    return MOCK_MENUS;
  }
}

export default async function VendorPage() {
  const [orders, menus, revenue] = await Promise.all([getOrders("upcoming"), getMenus(), getBillingRevenue()]);
  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const availableMenus = menus.filter((menu) => Number(menu.effectiveDailyLimit ?? 0) > 0 && menu.isActive);

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
            href="/vendor/menus/new"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--navy-600)] px-5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)]"
          >
            新增餐點
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="待處理訂單" value={activeOrders.length} tone="navy" href="/vendor/orders" />
        <Stat label="供應中餐點" value={availableMenus.length} tone="teal" href="/vendor/menus" />
        <Stat label="本月總營收" value={`$${revenue}`} tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
            {availableMenus.map((menu) => (
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
                    style={{ width: `${Math.min(100, Number(menu.effectiveDailyLimit ?? 0) * 5)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  剩餘 {menu.effectiveDailyLimit ?? 0} 份
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* 訂單表格區塊（已修正壓縮與時間空白問題） */}
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
            {/* 加上 table-fixed 嚴格控制各欄位比例 */}
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm table-fixed">
              <thead className="bg-[var(--navy-50)] text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 w-[130px]">訂單編號</th>
                  <th className="px-5 py-3 w-[120px]">餐點名稱</th>
                  <th className="px-5 py-3 w-[120px]">訂餐時間</th>
                  <th className="px-5 py-3 w-[120px]">出餐時間</th>
                  <th className="px-5 py-3 w-[100px]">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="bg-white transition hover:bg-[var(--surface-muted)]">
                    {/* 訂單編號：設定最大寬度並加上 truncate，滑鼠懸停顯示完整 ID */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/vendor/orders/${order.raw_id}`}
                        className="font-semibold text-[var(--navy-600)] hover:underline block truncate max-w-[100px]"
                        title={order.id}
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700 truncate" title={order.menu_name}>
                      {order.menu_name ?? "-"}
                    </td>
                    {/* 修正：讀取 map 整理後的 order_date */}
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {order.order_date ?? "-"}
                    </td>
                    {/* 修正：讀取 map 整理後的 pickup_date */}
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {order.pickup_date ?? "-"}
                    </td>
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
    confirmed: { label: "已確認", color: "bg-blue-50 text-blue-600" },
  };

  const { label = value ?? "未知", color = "bg-[var(--navy-50)] text-[var(--navy-600)]" } =
    map[value] ?? {};

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color} whitespace-nowrap`}>
      {label}
    </span>
  );
}