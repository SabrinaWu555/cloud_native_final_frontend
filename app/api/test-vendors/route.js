// app/api/test-vendors/route.js — 臨時測試用
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  const results = {};

  // 試三種網址、無 query、A、A區，看哪個有資料
  const urls = [
    "http://32.236.51.177:8000/api/v1/vendors",
    "http://32.236.51.177:8000/api/v1/vendors?factoryZone=A",
    "http://32.236.51.177:8000/api/v1/vendors?factoryZone=A%E5%8D%80", // A區
    "http://32.236.51.177:8000/api/v1/vendors?factoryZone=B",
    "http://32.236.51.177:8000/api/v1/vendors?factoryZone=C",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      results[url] = {
        status: res.status,
        body: text.slice(0, 800), // 只看前 800 字，避免太長
      };
    } catch (e) {
      results[url] = { error: e.message };
    }
  }

  return NextResponse.json(results, { status: 200 });
}