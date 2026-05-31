// app/api/admin/statements/route.js — 帳單列表 + 建立
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES,
  apiFetch, jsonOrEmpty, serviceUrl,
} from "@/lib/api";

export async function GET() {
  if (!SERVICES.billing) return NextResponse.json({ message: "帳單服務未設定" }, { status: 503 });
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  try {
    const res = await apiFetch(serviceUrl(SERVICES.billing, ENDPOINTS.billingStatements), { token });
    const data = await jsonOrEmpty(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "服務無法連線" }, { status: 503 });
  }
}

export async function POST(request) {
  if (!SERVICES.billing) return NextResponse.json({ message: "帳單服務未設定" }, { status: 503 });
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const body = await request.json().catch(() => ({}));

  try {
    const res = await apiFetch(serviceUrl(SERVICES.billing, ENDPOINTS.billingStatements), {
      token,
      method: "POST",
      body,
    });
    const data = await jsonOrEmpty(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "服務無法連線" }, { status: 503 });
  }
}