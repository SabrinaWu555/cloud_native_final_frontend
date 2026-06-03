// app/api/admin/appeals/notify/route.js
// 福委會審核完申訴後，發通知給員工 + 商家
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, SERVICES, apiFetch, jsonOrEmpty } from "@/lib/api";

// 用 vendor_id (UUID) 查商家的 userId (integer)
async function getVendorUserId(vendorId, token) {
  if (!vendorId || !SERVICES.vendor) return null;
  try {
    const res = await apiFetch(
      `${SERVICES.vendor}/api/v1/admin/vendors/${encodeURIComponent(vendorId)}`,
      { token }
    );
    if (!res.ok) return null;
    const data = await jsonOrEmpty(res);
    return data.userId ?? data.user_id ?? null;
  } catch {
    return null;
  }
}

// 用 vendor_id 查商家名稱（讓通知好看）
async function getVendorName(vendorId, token) {
  if (!vendorId || !SERVICES.vendor) return "";
  try {
    const res = await apiFetch(`${SERVICES.vendor}/api/v1/vendors`, { token });
    if (!res.ok) return "";
    const data = await jsonOrEmpty(res);
    const list = Array.isArray(data) ? data : data.vendors || [];
    return list.find((v) => v.id === vendorId)?.name || "";
  } catch {
    return "";
  }
}

// 發單筆通知
async function sendNotification({ user_id, title, content, token }) {
  if (!user_id || !SERVICES.notification) return false;
  try {
    const res = await apiFetch(`${SERVICES.notification}/notifications`, {
      token,
      method: "POST",
      body: { user_id, title, content },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const {
    appealId,
    action,         // "approve" | "reject"
    refund = 0,
    adminNotes = "",
    employeeId,
    vendorId,
    orderId,
  } = payload;

  // 找出商家名稱（如果有）
  const vendorName = await getVendorName(vendorId, token);

  // 訂單編號顯示用（拆成短版）
  const shortOrderId = String(orderId || "").slice(0, 8);

  const results = { employeeNotified: false, vendorNotified: false };

  // === 通知員工 ===
  if (action === "approve") {
    results.employeeNotified = await sendNotification({
      user_id: employeeId,
      title: `您的申訴已核准（APL-${appealId}）`,
      content: `您針對訂單 ORD-${shortOrderId}（${vendorName || "—"}）提出的申訴已通過審核。\n\n退款金額：NT$ ${refund}\n${adminNotes ? `\n備註：${adminNotes}` : ""}\n\n款項將以原付款方式退回，謝謝您的回報。`,
      token,
    });
  } else {
    results.employeeNotified = await sendNotification({
      user_id: employeeId,
      title: `您的申訴未通過（APL-${appealId}）`,
      content: `您針對訂單 ORD-${shortOrderId}（${vendorName || "—"}）提出的申訴經審核後未通過。\n${adminNotes ? `\n駁回原因：${adminNotes}` : ""}\n\n若有疑問請聯繫福委會。`,
      token,
    });
  }

  // === 通知商家（用 vendorId 查 userId）===
  const vendorUserId = await getVendorUserId(vendorId, token);
  console.log("商家用戶 ID:", vendorUserId);
  if (vendorUserId) {
    if (action === "approve") {
      results.vendorNotified = await sendNotification({
        user_id: vendorUserId,
        title: `您有申訴案件被核准（APL-${appealId}）`,
        content: `訂單 ORD-${shortOrderId} 的客訴已由福委會核准成立。\n\n退款金額：NT$ ${refund}\n違規點數：+1\n${adminNotes ? `\n審核備註：${adminNotes}` : ""}\n\n請改善服務品質，避免後續違規累積。`,
        token,
      });
    } else {
      results.vendorNotified = await sendNotification({
        user_id: vendorUserId,
        title: `申訴案件結案（APL-${appealId}）`,
        content: `針對您訂單 ORD-${shortOrderId} 的申訴經審核後未成立。\n${adminNotes ? `\n審核備註：${adminNotes}` : ""}\n\n感謝您的服務。`,
        token,
      });
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}