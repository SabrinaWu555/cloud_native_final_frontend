// app/(main)/notifications/[id]/page.js — 通知明細（開啟即標為已讀）
import Link from "next/link";
import { cookies } from "next/headers";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS,
  apiFetch, jsonOrEmpty, serviceUrl, withPathParams,
} from "@/lib/api";
import { getMockNotification, markMockNotificationRead } from "@/lib/mockData";

export const dynamic = "force-dynamic";

const TYPE_LABELS = { pickup: "領餐通知", cancel: "取消通知", today: "今日訂單提醒" };

async function loadAndRead(id) {
  if (USE_LOCAL_MOCKS || !SERVICES.notification) {
    const n = getMockNotification(id);
    if (n) markMockNotificationRead(id);
    return n;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = cookieStore.get("userId")?.value;
  try {
    const path = userId ? withPathParams(ENDPOINTS.notificationsByUser, { id: userId }) : ENDPOINTS.notifications;
    const res = await apiFetch(serviceUrl(SERVICES.notification, path), { token });
    const data = await jsonOrEmpty(res);
    const list = Array.isArray(data) ? data : data.notifications || [];
    const found = list.find((n) => String(n.id) === String(id)) || null;
    if (userId) {
      await apiFetch(
        serviceUrl(SERVICES.notification, withPathParams(ENDPOINTS.notificationMarkRead, { id: userId })),
        { token, method: "PATCH", body: { notificationId: id, notification_id: id, read: true } }
      ).catch(() => {});
    }
    return found || getMockNotification(id);
  } catch {
    return getMockNotification(id);
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function NotificationDetailPage({ params }) {
  const { id } = await params;
  const item = await loadAndRead(id);

  if (!item) {
    return (
      <div className="surface-panel mx-auto max-w-[1440px] rounded-lg p-8 text-center">
        <p className="text-sm text-slate-500">找不到這則通知。</p>
        <Link href="/notifications" className="mt-3 inline-block text-sm font-bold text-[var(--navy-600)]">← 回通知中心</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[820px] space-y-5">
      <Link href="/notifications" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition hover:text-[var(--navy-600)]">← 回通知中心</Link>

      <article className="surface-panel rounded-lg p-6 sm:p-8">
        <span className="inline-flex rounded-full bg-[var(--navy-50)] px-3 py-1 text-xs font-bold text-[var(--navy-600)]">
          {TYPE_LABELS[item.type] || "系統通知"}
        </span>
        <h1 className="mt-4 text-2xl font-black text-[var(--navy-900)]">{item.title}</h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">{formatDateTime(item.created_at)}</p>
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="text-base leading-7 text-slate-700">{item.message}</p>
        </div>
        <p className="mt-6 rounded-md bg-[var(--success-bg)] px-3 py-2 text-sm font-medium text-[var(--success-fg)]">這則通知已標記為已讀。</p>
      </article>
    </div>
  );
}