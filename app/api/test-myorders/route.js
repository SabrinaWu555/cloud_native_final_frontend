// 臨時測試：直接看訂單服務原始回傳
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;

  try {
    const res = await fetch(
      "http://32.236.51.177:8000/orders/me",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const text = await res.text();
    return NextResponse.json({
      userId,
      status: res.status,
      body: text,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}