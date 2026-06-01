"use client";

import { useEffect, useMemo, useState } from "react";

const TYPE_META = {
  pickup: {
    label: "領餐",
    className: "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]",
  },
  cancel: {
    label: "取消",
    className: "border-[var(--error-fg)] bg-[var(--error-bg)] text-[var(--error-fg)]",
  },
  today: {
    label: "今日訂單",
    className: "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]",
  },
};

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data.message || "通知讀取失敗");
        }

        if (!ignore) {
          setItems(Array.isArray(data) ? data : data.notifications || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "通知讀取失敗");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read_at && !item.read).length,
    [items],
  );

  async function markRead(id) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });

    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true, read_at: new Date().toISOString() } : item,
      ),
    );
  }

  async function markAllRead() {
    const unreadItems = items.filter((item) => !item.read_at && !item.read);
    await Promise.all(unreadItems.map((item) => markRead(item.id)));
  }

  return (
    <div className="w-full space-y-6">
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">
              Notifications
            </p>
            <h1 className="mt-2 text-3xl font-black text-[var(--navy-900)]">通知中心</h1>
            <p className="mt-2 text-sm text-slate-600">
              領餐、取消與當日訂單提醒都會集中在這裡。
            </p>
          </div>
          <button
            onClick={markAllRead}
            disabled={!unreadCount}
            className="min-h-10 rounded-md bg-[var(--navy-600)] px-4 text-sm font-bold text-white transition hover:bg-[var(--navy-800)] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            全部已讀
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="未讀通知" value={unreadCount} tone="blue" />
        <Stat label="今日訂單提醒" value={items.filter((item) => item.type === "today").length} tone="green" />
        <Stat label="取消通知" value={items.filter((item) => item.type === "cancel").length} tone="red" />
      </section>

      <section className="surface-panel overflow-hidden rounded-lg">
        {loading && <div className="p-8 text-sm text-slate-500">通知讀取中...</div>}
        {error && <div className="p-8 text-sm font-semibold text-[var(--error-fg)]">{error}</div>}
        {!loading && !error && !items.length && (
          <div className="p-8 text-center text-sm text-slate-500">目前沒有通知。</div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const meta = TYPE_META[item.type] || {
                label: "系統",
                className: "border-slate-300 bg-slate-100 text-slate-600",
              };
              const unread = !item.read_at && !item.read;

              return (
                <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-[var(--navy-900)]">{item.title}</h2>
                      {unread && (
                        <span className="rounded-full bg-[var(--error-fg)] px-2 py-0.5 text-xs font-bold text-white">
                          未讀
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => markRead(item.id)}
                    disabled={!unread}
                    className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-bold text-[var(--navy-600)] transition hover:bg-[var(--navy-50)] disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {unread ? "標為已讀" : "已讀"}
                  </button>
                </article>
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

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
