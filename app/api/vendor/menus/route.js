// app/api/vendor/menus/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SERVICES, ENDPOINTS } from "@/lib/api"; 

export async function POST(req) {
  try {
    const body = await req.json();
    
    // 1. 取得使用者的 Token (透過 Cookie)
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value; // 請確認你們存 token 的 cookie 名稱是不是 'token'

    // 2. 組合真實後端網址 (對應 api.js 裡的 vendorMeMenus)
    const backendBase = SERVICES.vendor || "http://140.113.62.166:3001";
    const targetUrl = `${backendBase}${ENDPOINTS.vendorMeMenus}`; // 應該會是 /api/v1/vendors/me/menus

    // 3. 攜帶 Token 發送 POST 請求給真實後端
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "後端拒絕新增餐點" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("POST Menu Error:", error);
    return NextResponse.json({ message: "內部伺服器錯誤" }, { status: 500 });
  }
}