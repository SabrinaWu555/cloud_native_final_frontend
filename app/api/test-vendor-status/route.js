// 臨時測試：看商家的 status 實際值
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  try {
    const res = await fetch("http://32.236.51.177:8000/api/v1/vendors", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}