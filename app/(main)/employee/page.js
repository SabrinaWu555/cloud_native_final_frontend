// app/(main)/employee/page.js
import { cookies } from "next/headers";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS,
  apiFetch, jsonOrEmpty, serviceUrl,
} from "@/lib/api";
import { MOCK_VENDORS, getMockVendorsByZone } from "@/lib/mockData";
import { ZONES, isValidZone, zoneLabel, toBackendZone } from "@/lib/zones";import ZoneSelector from "@/components/ZoneSelector";
import VendorCard from "@/components/VendorCard";
import AiRecommendation from "@/components/AiRecommendation";


async function getVendors(zone) {
  if (USE_LOCAL_MOCKS || !SERVICES.vendor) return getMockVendorsByZone(zone);
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  try {
    const url = serviceUrl(SERVICES.vendor, ENDPOINTS.vendors) + `?factoryZone=${encodeURIComponent(toBackendZone(zone))}`;    const res = await apiFetch(url, { token });
    if (!res.ok) return [];
    const data = await jsonOrEmpty(res);
    const list = Array.isArray(data) ? data : data.vendors || data.items || [];
    return list.map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category || "未分類",
      rating: v.rating ?? 4.5,
      eta: v.eta || "—",
      description: v.description || "",
      tags: v.tags || [],
      image_url: v.imageUrl || v.image_url || null,
      is_open: v.status ? v.status === "ACTIVE" : true,
      zones: v.allowedAreas || (v.factoryZone ? [v.factoryZone] : []),
    }));
  } catch {
    return [];
  }
}

function filterVendors(vendors, query) {
  const kw = query.trim().toLowerCase();
  if (!kw) return vendors;
  return vendors.filter((v) =>
    [v.name, v.category, ...(v.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(kw)
  );
}

export default async function EmployeeHomePage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || "";
  const zone = isValidZone(params?.zone) ? params.zone : ZONES[0].value;

  const vendors = await getVendors(zone);
  const filtered = filterVendors(vendors, query);

  const carryQuery = new URLSearchParams({ zone, ...(query ? { q: query } : {}) }).toString();

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      {/* 簡化的頂部：只剩搜尋條 */}
      <section className="surface-panel rounded-lg p-4 sm:p-5">
        <form className="flex w-full gap-2">
          <input type="hidden" name="zone" value={zone} />
          <input
            name="q"
            defaultValue={query}
            placeholder="搜尋商家、分類、標籤"
            className="min-h-11 flex-1 rounded-md border border-[var(--line)] bg-white px-4 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50"
          />
          <button className="min-h-11 shrink-0 rounded-md bg-[var(--navy-600)] px-5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)]">
            查詢
          </button>
        </form>
      </section>

      <ZoneSelector selected={zone} />

      {/* AI 推薦（顯示餐點） */}
      <AiRecommendation zone={zone} />

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-black text-[var(--navy-900)]">{zoneLabel(zone)}區商家</h2>
          <p className="text-sm text-slate-500">共 {filtered.length} 間</p>
        </div>
        {filtered.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((v) => (
              <VendorCard key={v.id} vendor={v} query={carryQuery} />
            ))}
          </div>
        ) : (
          <div className="surface-panel rounded-lg p-8 text-center text-sm text-slate-500">
            {zoneLabel(zone)}廠區目前沒有符合條件的商家。
          </div>
        )}
      </section>
    </div>
  );
}