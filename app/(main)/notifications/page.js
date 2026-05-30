// app/(main)/notifications/page.js — 通知中心（列表）
import Link from "next/link";
import { cookies } from "next/headers";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES, USE_LOCAL_MOCKS,
  apiFetch, jsonOrEmpty, serviceUrl, withPathParams,
} from "@/lib/api";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";
import MarkAllReadButton from "@/components/MarkAllReadButton";

export const dynamic = "force-dynamic";

const TYPE_META = {
  pickup: { label: "領餐", className: "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]" },
  cancel: { label: "取消", className: "border-[var(--error-fg)] bg-[var(--error-bg)] text-[var(--error-fg)]" },
  today: { label: "今日訂單", className: "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]" },
};

async function getNotifications() {
  if (USE_LOCAL_MOCKS || !SERVICES.notification) return MOCK_NOTIFICATIONS;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = cookieStore.get("userId")?.value;
  const path = userId ? withPathParams(ENDPOINTS.notificationsByUser, { id: userId }) : ENDPOINTS.notifications;
  try {
    const res = await apiFetch(serviceUrl(SERVICES.notification, path), { token });
    if (!res.ok) return MOCK_NOTIFICATIONS;
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.notifications || MOCK_NOTIFICATIONS;
  } catch {
    return MOCK_NOTIFICATIONS;
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function NotificationsPage() {
  const items = await getNotifications();
  const isUnread = (n) => !n.read_at && !n.read;
  const unreadCount = items.filter(isUnread).length;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">Notifications</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--navy-900)]">通知中心</h1>
            <p className="mt-2 text-sm text-slate-600">點開通知閱讀內容。</p>
          </div>
          <MarkAllReadButton disabled={!unreadCount} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="未讀通知" value={unreadCount} tone="blue" />
        <Stat label="今日訂單提醒" value={items.filter((i) => i.type === "today").length} tone="green" />
        <Stat label="取消通知" value={items.filter((i) => i.type === "cancel").length} tone="red" />
      </section>

      <section className="surface-panel overflow-hidden rounded-lg">
        {!items.length ? (
          <div className="p-8 text-center text-sm text-slate-500">目前沒有通知。</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const meta = TYPE_META[item.type] || { label: "系統", className: "border-slate-300 bg-slate-100 text-slate-600" };
              const unread = isUnread(item);
              return (
                <Link key={item.id} href={`/notifications/${item.id}`} className="grid gap-4 p-5 transition hover:bg-[var(--surface-muted)] lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-[var(--navy-900)]">{item.title}</h2>
                      {unread && <span className="rounded-full bg-[var(--error-fg)] px-2 py-0.5 text-xs font-bold text-white">未讀</span>}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{formatDateTime(item.created_at)}</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--navy-600)]">查看 →</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const className =
    tone === "green"
      ? "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]"
      : tone === "red"
        ? "border-[var(--error-fg)] bg-[var(--error-bg)] text-[var(--error-fg)]"
        : "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]";
  return (
    <div className={`border-l-4 p-5 ${className}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}