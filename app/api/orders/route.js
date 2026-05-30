// app/api/orders/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS,
  apiFetch, jsonOrEmpty, serviceUrl,
} from "@/lib/api";
import { MOCK_MENUS, MOCK_ORDERS } from "@/lib/mockData";

// 把後端訂單翻譯成前端的格式
function toFrontendOrder(o) {
  return {
    id: `ORD-${o.id}`,
    raw_id: o.id,
    vendor_id: o.vendor_id,
    vendor_name: o.vendor_name || "—",
    status: o.status, // pending/confirmed/cancelled/completed
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
  };
}

// mock 模式用的假訂單建立
function createMockOrder(payload) {
  const items = Array.isArray(payload.items) && payload.items.length
    ? payload.items.map((i) => ({ menu_id: i.menu_id, name: i.name, price: Number(i.price), quantity: Number(i.quantity) }))
    : [{ menu_id: payload.menu_id, name: "示範餐點", price: 100, quantity: 1 }];
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return {
    id: `ORD-DEMO-${Date.now()}`,
    vendor_name: payload.vendor_name || "示範商家",
    items,
    total_amount: total,
    status: "confirmed",
    order_date: new Date().toISOString().slice(0, 10),
    target_date: payload.target_date || payload.targetDate || new Date().toISOString().slice(0, 10),
    pickup_time: "12:20",
    cancel_reason: "",
    mock: true,
  };
}

export async function GET() {
  if (USE_LOCAL_MOCKS || !SERVICES.order) {
    return NextResponse.json(MOCK_ORDERS);
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;

  try {
    // 訂單服務有 /orders/me，用 token 認身分，不用帶 userId
    const res = await apiFetch(serviceUrl(SERVICES.order, ENDPOINTS.ordersMe), { token });
    if (!res.ok) return NextResponse.json(MOCK_ORDERS);
    const data = await jsonOrEmpty(res);
    const list = Array.isArray(data) ? data : data.orders || [];

    // 把同一個 created_at + vendor + pickup_date 的訂單合併成一筆 (前端購物車一次下多筆會在後端產生多筆)
    const grouped = {};
    for (const o of list) {
      const mapped = toFrontendOrder(o);
      const key = `${o.vendor_id}_${o.pickup_date}_${o.created_at?.slice(0, 16)}`;
      if (!grouped[key]) {
        grouped[key] = mapped;
      } else {
        grouped[key].items.push(...mapped.items);
        grouped[key].total_amount += mapped.total_amount;
      }
    }

    return NextResponse.json(Object.values(grouped));
  } catch {
    return NextResponse.json(MOCK_ORDERS);
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const hasItems = Array.isArray(payload.items) && payload.items.length > 0;
  if (!hasItems && !payload.menuId && !payload.menu_id) {
    return NextResponse.json({ message: "購物車是空的" }, { status: 400 });
  }

  if (USE_LOCAL_MOCKS || !SERVICES.order) {
    return NextResponse.json(createMockOrder(payload), { status: 201 });
  }

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const items = hasItems
    ? payload.items
    : [{ menu_id: payload.menuId || payload.menu_id, name: "餐點", price: 0, quantity: 1 }];

  // 訂單服務一筆品項一張 API call → 平行送出
  const results = await Promise.allSettled(
    items.map((item) =>
      apiFetch(serviceUrl(SERVICES.order, ENDPOINTS.orders), {
        token,
        method: "POST",
        body: {
          vendor_id: Number(payload.vendor_id || payload.vendorId),
          menu_id: Number(item.menu_id),
          menu_name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          pickup_date: payload.target_date || payload.targetDate,
        },
      }).then(async (r) => ({ ok: r.ok, status: r.status, data: await jsonOrEmpty(r) }))
    )
  );

  const successes = results.filter((r) => r.status === "fulfilled" && r.value.ok);
  const failures = results.filter((r) => r.status !== "fulfilled" || !r.value.ok);

  if (failures.length > 0) {
    // 至少有一筆失敗
    const firstError = failures[0];
    const msg = firstError.value?.data?.detail || firstError.value?.data?.message || "部分品項下單失敗";
    return NextResponse.json(
      { message: msg, successCount: successes.length, failureCount: failures.length },
      { status: 207 } // Multi-Status
    );
  }

  return NextResponse.json({ ok: true, count: successes.length }, { status: 201 });
}