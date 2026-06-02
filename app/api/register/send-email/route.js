// app/api/register/send-email/route.js — 寄驗證碼 BFF
import { NextResponse } from "next/server";
import { SERVICES, apiFetch, jsonOrEmpty } from "@/lib/api";

export async function POST(request) {
  if (!SERVICES.vendor) {
    return NextResponse.json({ message: "服務未設定" }, { status: 503 });
  }

  const { email, code } = await request.json().catch(() => ({}));
  if (!email || !code) {
    return NextResponse.json({ message: "email 和 code 都必填" }, { status: 400 });
  }

  try {
    // 假設 register service 提供 POST /api/v1/register/send-verification-email
    const res = await apiFetch(
      `${SERVICES.vendor}/api/v1/register/send-verification-email`,
      {
        method: "POST",
        body: { email, code },
      }
    );
    const data = await jsonOrEmpty(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "服務無法連線" }, { status: 503 });
  }
}