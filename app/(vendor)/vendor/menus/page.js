import { cookies } from "next/headers";
import { COOKIE_NAME, ENDPOINTS, SERVICES, apiFetch, jsonOrEmpty, serviceUrl } from "@/lib/api";
import { MOCK_MENUS } from "@/lib/mockData";
import Link from "next/link";

async function getMenus() {
  if (!SERVICES.vendor) return MOCK_MENUS;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  try {
    const res = await apiFetch(serviceUrl(SERVICES.vendor, ENDPOINTS.menus), { token });
    if (!res.ok) return MOCK_MENUS;
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.menus || MOCK_MENUS;
  } catch {
    return MOCK_MENUS;
  }
}

export default async function VendorMenusPage() {
  const menus = await getMenus();
  const available = menus.filter((m) => Number(m.daily_limit ?? 0) > 0);
  const soldOut   = menus.filter((m) => Number(m.daily_limit ?? 0) === 0);

  return (
    <div className="w-full space-y-6">

      {/* 標題 */}
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-7">
        <Link href="/vendor" className="text-xs font-semibold text-[var(--teal-600)] hover:underline">
          ← 返回工作台
        </Link>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--navy-900)]">菜單管理</h1>
            <p className="mt-1 text-sm text-slate-500">管理所有餐點品項與每日供應數量</p>
          </div>
          <Link
            href="/vendor/menus/new"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--navy-600)] px-5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)]"
          >
            + 新增餐點
          </Link>
        </div>
      </section>

      {/* 統計 */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "全部餐點",  value: menus.length,     color: "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]" },
          { label: "供應中",   value: available.length,  color: "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]" },
          { label: "已售完",   value: soldOut.length,    color: "border-red-300 bg-red-50 text-red-500" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border-l-4 p-4 ${s.color}`}>
            <p className="text-sm font-bold">{s.label}</p>
            <p className="mt-1 text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </section>

      {/* 供應中 */}
      {available.length > 0 && (
        <section className="surface-panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-black text-[var(--navy-900)]">供應中</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((menu) => <MenuCard key={menu.id} menu={menu} />)}
          </div>
        </section>
      )}

      {/* 已售完 */}
      {soldOut.length > 0 && (
        <section className="surface-panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-black text-slate-400">已售完</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {soldOut.map((menu) => <MenuCard key={menu.id} menu={menu} soldOut />)}
          </div>
        </section>
      )}
    </div>
  );
}

function MenuCard({ menu, soldOut = false }) {
  return (
    <article className={`rounded-md border p-4 ${soldOut ? "border-slate-100 bg-slate-50 opacity-60" : "border-[var(--line)] bg-white"}`}>
      {/* 圖片（如果有） */}
      {menu.image_url && (
        <img
          src={menu.image_url}
          alt={menu.name}
          className="mb-3 h-32 w-full rounded-md object-cover"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-[var(--navy-900)]">{menu.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{menu.category ?? "-"}</p>
        </div>
        <span className="text-lg font-black text-[var(--navy-600)]">${menu.price}</span>
      </div>

      {/* 庫存進度條 */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--navy-50)]">
        <div
          className={`h-full rounded-full ${soldOut ? "bg-slate-300" : "bg-[var(--teal-400)]"}`}
          style={{ width: `${Math.min(100, Number(menu.daily_limit ?? 0) * 5)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">
          剩餘 {menu.daily_limit ?? 0} 份
        </p>
        {/* 編輯按鈕 — 之後接 /vendor/menus/[id]/edit */}
        <Link
          href={`/vendor/menus/${menu.id}/edit`}
          className="text-xs font-semibold text-[var(--teal-600)] hover:underline"
        >
          編輯
        </Link>
      </div>
    </article>
  );
}