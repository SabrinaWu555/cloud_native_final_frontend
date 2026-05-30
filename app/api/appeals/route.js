// app/api/appeals/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS,
  apiFetch, jsonOrEmpty, serviceUrl, withPathParams,
} from "@/lib/api";
import { MOCK_APPEALS } from "@/lib/mockData";

// 後端 status → 前端 status（沿用你原本的詞彙）
function mapStatusFromBackend(s) {
  if (s === "pending") return "submitted";
  if (s === "approved") return "resolved";
  if (s === "rejected") return "rejected";
  return s || "submitted";
}

// 把後端的 appeal 翻譯成前端習慣的格式
// 後端的 reason 是「[類型代碼] 文字描述」的合併字串，這裡拆回兩個欄位
function toFrontend(a) {
  let reasonCode = "other";
  let message = a.reason || "";
  const m = /^\[([^\]]+)\]\s*(.*)$/s.exec(message);
  if (m) {
    reasonCode = m[1];
    message = m[2];
  }
  return {
    id: `APL-${a.id}`,           // 給前端看的字串 ID
    raw_id: a.id,                 // 後端真實的數字 ID（之後 PATCH/DELETE 會用）
    order_id: a.order_id,
    employee_id: a.employee_id,
    vendor_id: a.vendor_id,
    reason: reasonCode,           // 類型代碼
    message,                      // 描述文字
    status: mapStatusFromBackend(a.status),
    refund_amount: a.refund_amount,
    admin_notes: a.admin_notes,
    created_at: a.created_at,
  };
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));

  if (!payload.orderId && !payload.order_id) {
    return NextResponse.json({ message: "請選擇關聯訂單" }, { status: 400 });
  }
  if (!payload.message) {
    return NextResponse.json({ message: "請輸入申訴內容" }, { status: 400 });
  }

  if (USE_LOCAL_MOCKS || !SERVICES.appeal) {
    return NextResponse.json(
      { id: `APL-DEMO-${Date.now()}`, status: "submitted", ...payload, mock: true },
      { status: 201 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = Number(cookieStore.get("userId")?.value);

  // 你的訂單 id 目前是字串(ORD-...)，後端要 integer → 暫時用 demo 編號
  // 等訂單服務接上後，會是真的數字 id
  const orderIdRaw = payload.orderId || payload.order_id;
  const orderIdInt = Number.isFinite(Number(orderIdRaw)) ? Number(orderIdRaw) : 1;
  // ↑ 訂單服務還沒接，先用 1 讓申訴能送進去；等接上後會是真的訂單 id
  // 把前端的「類型 + 描述」合併成後端要的 reason 一個欄位
  const reason = `[${payload.reason || "other"}] ${payload.message}`;

  // 員工建立時必須帶 employee_id = userId，否則後端會擋
  const body = {
    order_id: orderIdInt,
    reason,
    employee_id: userId,
  };

  try {
    const res = await apiFetch(serviceUrl(SERVICES.appeal, ENDPOINTS.appeals), {
      token,
      method: "POST",
      body,
    });
    const data = await jsonOrEmpty(res);
    if (!res.ok) {
      return NextResponse.json(
        { message: data.error || "送出申訴失敗" },
        { status: res.status }
      );
    }
    return NextResponse.json(toFrontend(data), { status: 201 });
  } catch {
    return NextResponse.json({ message: "申訴服務無法連線" }, { status: 503 });
  }
}

export async function GET() {
  if (USE_LOCAL_MOCKS || !SERVICES.appeal) {
    return NextResponse.json(MOCK_APPEALS);
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = cookieStore.get("userId")?.value;

  // 員工只能打 by-user；admin 兩種都行，我們統一也走 by-user 比較單純
  const path = userId
    ? `${ENDPOINTS.appeals}/user/${encodeURIComponent(userId)}`
    : ENDPOINTS.appeals;

  try {
    const res = await apiFetch(serviceUrl(SERVICES.appeal, path), { token });
    if (!res.ok) return NextResponse.json(MOCK_APPEALS);
    const data = await jsonOrEmpty(res);
    const list = Array.isArray(data) ? data : data.appeals || [];
    return NextResponse.json(list.map(toFrontend));
  } catch {
    return NextResponse.json(MOCK_APPEALS);
  }
}