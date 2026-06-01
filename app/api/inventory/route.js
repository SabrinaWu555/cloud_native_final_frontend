// app/api/inventory/route.js — 查多個菜單在某日的庫存
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, SERVICES, apiFetch } from "@/lib/api";

export async function POST(request) {
  if (!SERVICES.order) return NextResponse.json({ inventory: {} });
  const { menuIds, date } = await request.json();
  if (!Array.isArray(menuIds) || !date) {
    return NextResponse.json({ inventory: {} });
  }
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  // 平行查每個 menu 的庫存
  const results = await Promise.all(
    menuIds.map(async (menuId) => {
      try {
        const res = await apiFetch(
          `${SERVICES.order}/inventory/${encodeURIComponent(menuId)}?target_date=${date}`,
          { token }
        );
        if (!res.ok) return [menuId, null];
        const data = await res.json();
        // 後端回 { remaining: N } 或類似格式，看後端怎麼回
        return [menuId, data.remaining ?? data.quantity ?? null];
      } catch {
        return [menuId, null];
      }
    })
  );

  const inventory = {};
  for (const [id, qty] of results) inventory[id] = qty;
  return NextResponse.json({ inventory });
}