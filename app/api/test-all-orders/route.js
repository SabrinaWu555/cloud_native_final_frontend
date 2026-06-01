// 臨時測試：admin 看後端所有訂單
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  // 注意：要用 admin token，不然 /orders 會被擋
  try {
    const res = await fetch(
      "http://32.236.51.177:8000/orders?range=upcoming",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      body: text.slice(0, 3000),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}