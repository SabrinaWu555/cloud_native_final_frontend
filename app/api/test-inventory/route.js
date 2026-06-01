import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  // 用大麥克的 UUID 試（你之前下單那個）
  const menuId = "98e6de6b-d20e-416c-be04-86d4f527385f";
  const dates = ["2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"];
  const results = {};
  for (const d of dates) {
    try {
      const res = await fetch(
        `http://32.236.51.177:8000/inventory/${menuId}?target_date=${d}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      results[d] = { status: res.status, body: await res.text() };
    } catch (e) {
      results[d] = { error: e.message };
    }
  }
  return NextResponse.json(results);
}