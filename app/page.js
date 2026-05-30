import Link from "next/link";

const portals = [
  {
    label: "員工",
    title: "Employee Portal",
    description: "今日菜單、訂單紀錄、通知與申訴",
    href: "/login?role=employee&next=/employee",
    accent: "var(--teal-400)",
  },
  {
    label: "商家",
    title: "Vendor Console",
    description: "上傳、編輯菜單、管理餐點供應與訂單、通知",
    href: "/login?role=vendor&next=/vendor",
    accent: "var(--navy-400)",
  },
  {
    label: "福委會",
    title: "Committee Desk",
    description: "申訴案件、扣款事件與申訴案件處理",
    href: "/login?role=committee&next=/committee",
    accent: "var(--teal-600)",
  },
];

const signals = [
  { label: "Microservices", value: "5" },
  { label: "Portal Roles", value: "3" },
  { label: "Cutoff", value: "10:30" },
];

export default function PortalPage() {
  return (
    <main className="portal-shell flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] lg:items-center">
        <section className="motion-fade-up text-white">
          <div className="inline-flex items-center gap-3 rounded-md border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-white text-xs font-black text-[var(--navy-800)]">
              TSMC
            </span>
            {/*<span className="text-sm font-semibold text-white/80">Corporate Meal Platform</span>*/}
          </div>

          <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            企業訂餐系統
          </h1>
          {/* <p className="mt-5 max-w-xl text-base leading-7 text-[var(--navy-50)] sm:text-lg">
            以員工午餐流程為核心，串接 IAM、通知、推薦、帳務與申訴服務，讓每日訂餐和後續處理集中在同一個入口。
          </p> */}

          {/* <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {signals.map((item) => (
              <div key={item.label} className="rounded-md border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold text-[var(--teal-200)]">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-white">{item.value}</p>
              </div>
            ))}
          </div> */}
        </section>

        <section className="motion-fade-up-delay glass-panel rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-600)]">
                Portal
              </p>
              <h2 className="mt-1 text-2xl font-black text-[var(--navy-900)]">選擇工作台</h2>
            </div>
            {/* <span className="motion-float hidden h-12 w-12 rounded-md border border-[var(--teal-200)] bg-[var(--teal-50)] sm:block" /> */}
          </div>

          <div className="grid gap-3">
            {portals.map((portal, index) => (
              <Link
                key={portal.label}
                href={portal.href}
                className="motion-sweep group grid gap-4 rounded-md border border-[var(--line)] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--teal-200)] hover:shadow-lg sm:grid-cols-[auto_1fr_auto] sm:items-center"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-md text-sm font-black text-white"
                  style={{ backgroundColor: portal.accent }}
                >
                  {portal.label.slice(0, 1)}
                </span>
                <span>
                  <span className="block text-lg font-black text-[var(--navy-900)]">
                    {portal.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-[var(--navy-400)]">
                    {portal.title}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">
                    {portal.description}
                  </span>
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--navy-100)] text-lg font-black text-[var(--navy-600)] transition group-hover:border-[var(--teal-400)] group-hover:bg-[var(--teal-50)]">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
