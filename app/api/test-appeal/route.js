// 臨時測試
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  const userId = (await cookies()).get("userId")?.value;
  const role = (await cookies()).get("role")?.value;

  const results = { cookies: { userId, role, tokenLen: token?.length } };

  // 試 admin 端點
  try {
    const res = await fetch("http://32.236.51.177:8000/appeal-admin/appeals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    results["GET /appeals"] = { status: res.status, body: (await res.text()).slice(0, 1500) };
  } catch (e) {
    results["GET /appeals"] = { error: e.message };
  }

  // 試 by-user 端點
  if (userId) {
    try {
      const res = await fetch(`http://32.236.51.177:8000/appeal-admin/appeals/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      results[`GET /appeals/user/${userId}`] = { status: res.status, body: (await res.text()).slice(0, 1500) };
    } catch (e) {
      results[`GET /appeals/user/${userId}`] = { error: e.message };
    }
  }

  return NextResponse.json(results);
}