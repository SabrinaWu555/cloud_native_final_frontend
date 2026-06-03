import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  // 試兩種可能的 admin endpoint
  const tries = [
    "/api/v1/admin/vendors",
    "/api/v1/admin/vendors?status=ALL",
    "/api/v1/admin/vendors?includeSuspended=true",
  ];

  const results = {};
  for (const path of tries) {
    try {
      const res = await fetch(
        `http://32.236.51.177:8000${path}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-user-role": "admin",
          },
        }
      );
      const text = await res.text();
      results[path] = {
        status: res.status,
        body: text.slice(0, 500),
      };
    } catch (e) {
      results[path] = { error: e.message };
    }
  }

  return NextResponse.json(results);
}