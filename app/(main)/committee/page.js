import { cookies } from "next/headers";
import { COOKIE_NAME, ENDPOINTS, SERVICES, apiFetch, jsonOrEmpty, serviceUrl } from "@/lib/api";
import { MOCK_APPEALS, MOCK_INCIDENTS, MOCK_USERS } from "@/lib/mockData";

async function fetchCollection(service, path, fallback) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  try {
    const res = await apiFetch(serviceUrl(service, path), { token });
    if (!res.ok) return fallback;
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.items || data.appeals || data.incidents || data.users || fallback;
  } catch {
    return fallback;
  }
}

export default async function CommitteePage() {
  const [appeals, incidents, users] = await Promise.all([
    fetchCollection(SERVICES.appeal, ENDPOINTS.appeals, MOCK_APPEALS),
    fetchCollection(SERVICES.billing, ENDPOINTS.billingIncidents, MOCK_INCIDENTS),
    fetchCollection(SERVICES.iam, ENDPOINTS.iamUsers, MOCK_USERS),
  ]);
  const openAppeals = appeals.filter((item) => !["resolved", "closed", "rejected"].includes(item.status));
  const openIncidents = incidents.filter((item) => !["resolved", "closed"].includes(item.status));

  return (
    <div className="w-full space-y-6">
      <section className="surface-panel rounded-lg px-4 py-5 sm:px-6 lg:px-7">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">
          Committee Desk
        </p>
        <h1 className="mt-2 text-3xl font-black text-[var(--navy-900)]">福委會工作台</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          集中檢視員工申訴、帳務事件與 IAM 使用者狀態，方便後續分派與追蹤。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="待處理申訴" value={openAppeals.length} tone="navy" />
        <Stat label="帳務事件" value={openIncidents.length} tone="amber" />
        <Stat label="IAM 使用者" value={users.length} tone="teal" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel overflow-hidden rounded-lg">
          <div className="border-b border-[var(--line)] p-5">
            <p className="text-sm font-bold text-slate-500">案件佇列</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">申訴案件</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {appeals.map((appeal) => (
              <article key={appeal.id} className="grid gap-4 bg-white p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-[var(--navy-900)]">{appeal.id}</h3>
                    <Status value={appeal.status} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {appeal.employee_name || "員工"} · {appeal.order_id || appeal.orderId || "未指定訂單"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{appeal.message}</p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reason</p>
                  <p className="mt-1 text-sm font-bold text-[var(--navy-600)]">
                    {appeal.reason || "-"}
                  </p>
                </div>
              </article>
            ))}
            {!appeals.length && <p className="p-6 text-sm text-slate-500">目前沒有申訴案件。</p>}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="surface-panel rounded-lg p-5">
            <p className="text-sm font-bold text-slate-500">帳務事件</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">Billing Incidents</h2>
            <div className="mt-4 grid gap-3">
              {incidents.map((incident) => (
                <article key={incident.id} className="rounded-md border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[var(--navy-900)]">{incident.title || incident.id}</h3>
                      <p className="mt-1 text-sm text-slate-500">{incident.id}</p>
                    </div>
                    <span className="font-black text-[var(--warning-fg)]">
                      ${incident.amount ?? 0}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Status value={incident.status} />
                  </div>
                </article>
              ))}
              {!incidents.length && <p className="text-sm text-slate-500">目前沒有帳務事件。</p>}
            </div>
          </div>

          <div className="surface-panel rounded-lg p-5">
            <p className="text-sm font-bold text-slate-500">使用者概況</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">IAM Users</h2>
            <div className="mt-4 grid gap-3">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id || user.email}
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-[var(--navy-900)]">{user.email}</p>
                    <p className="text-sm text-slate-500">ID {user.id || user.userId || "-"}</p>
                  </div>
                  <span className="rounded-full bg-[var(--teal-50)] px-2.5 py-1 text-xs font-bold text-[var(--teal-600)]">
                    {user.role || "employee"}
                  </span>
                </div>
              ))}
              {!users.length && <p className="text-sm text-slate-500">目前沒有使用者資料。</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const className =
    tone === "teal"
      ? "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]"
      : tone === "amber"
        ? "border-[var(--warning-fg)] bg-[var(--warning-bg)] text-[var(--warning-fg)]"
        : "border-[var(--navy-600)] bg-[var(--navy-50)] text-[var(--navy-600)]";

  return (
    <div className={`rounded-lg border-l-4 p-5 ${className}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Status({ value }) {
  const closed = ["resolved", "closed", "completed"].includes(value);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        closed
          ? "bg-[var(--success-bg)] text-[var(--success-fg)]"
          : "bg-[var(--navy-50)] text-[var(--navy-600)]"
      }`}
    >
      {value || "open"}
    </span>
  );
}
