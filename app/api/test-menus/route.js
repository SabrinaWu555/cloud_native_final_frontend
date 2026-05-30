// app/api/test-menus/route.js — 臨時測試菜單 API
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  // 用你剛剛測試出來的真實商家 ID
  const vendorIds = [
    "0a59533b-03b2-4862-a7d2-5e57c0201ec5", // 天晟燒臘
    "2751c7d6-a154-48da-8775-4c1ad77fcf24", // 美味便當
  ];

  const results = {};

  for (const id of vendorIds) {
    // 試兩個網址：不帶 date、帶今天的 date
    const urls = [
      `http://32.236.51.177:8000/api/v1/vendors/${id}/menus`,
      `http://32.236.51.177:8000/api/v1/vendors/${id}/menus?date=2026-05-31`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        results[url] = {
          status: res.status,
          body: text.slice(0, 1500),
        };
      } catch (e) {
        results[url] = { error: e.message };
      }
    }
  }

  // 順便也測一下 /api/v1/menus（全量菜單）
  try {
    const res = await fetch("http://32.236.51.177:8000/api/v1/menus", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    results["http://32.236.51.177:8000/api/v1/menus"] = {
      status: res.status,
      body: text.slice(0, 1500),
    };
  } catch (e) {
    results["http://32.236.51.177:8000/api/v1/menus"] = { error: e.message };
  }

  return NextResponse.json(results);
}