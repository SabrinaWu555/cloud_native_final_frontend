// app/api/test-order/route.js — 臨時測試訂單 API
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  const results = {};

  // 1. 先撈自己的訂單列表
  try {
    const res = await fetch("http://32.236.51.177:8000/orders/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    results["GET /orders/me"] = { status: res.status, body: text.slice(0, 1500) };
  } catch (e) {
    results["GET /orders/me"] = { error: e.message };
  }

  // 2. 試著建立一筆訂單（用招牌烤雞）
  try {
    const res = await fetch("http://32.236.51.177:8000/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vendor_id: "0a59533b-03b2-4862-a7d2-5e57c0201ec5",
        menu_id: "8f16f6e3-a1e4-4e1c-8d51-82a4d7be91d4",
        menu_name: "招牌烤雞",
        price: 109,
        quantity: 1,
        pickup_date: "2026-06-01",
      }),
    });
    const text = await res.text();
    results["POST /orders"] = { status: res.status, body: text.slice(0, 1500) };
  } catch (e) {
    results["POST /orders"] = { error: e.message };
  }

  return NextResponse.json(results);
}