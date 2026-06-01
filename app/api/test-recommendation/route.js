// 臨時測試：看推薦 API 回什麼
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  const userId = (await cookies()).get("userId")?.value;

  const results = {
    cookies: { userId, hasToken: !!token },
  };

  // 測試:用自己的 userId 試 (admin or self 都行)
  if (userId) {
    try {
      const res = await fetch(
        `http://32.236.51.177:8000/recommendation/recommendations/for/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const text = await res.text();
      results[`GET /recommendations/for/${userId}`] = {
        status: res.status,
        body: text.slice(0, 2000),
      };
    } catch (e) {
      results[`GET /recommendations/for/${userId}`] = { error: e.message };
    }
  }

  return NextResponse.json(results);
}