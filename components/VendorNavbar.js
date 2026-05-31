"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/vendor", label: "商家工作台" },
];

export default function VendorNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const displayName = user?.full_name || user?.email?.split("@")[0] || "商家";
  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--teal-600)]/30 bg-[var(--teal-600)] text-white shadow-sm">
      <div className="flex min-h-16 w-full flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/vendor" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xs font-black tracking-tight text-[var(--teal-600)]">
              TSMC
            </span>
            <span>
              <span className="block text-base font-bold leading-tight">企業訂餐平台</span>
              <span className="block text-xs font-medium text-[var(--teal-50)]">商家 · Vendor</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 border-l border-white/20 pl-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-tight">{displayName}</p>
              <p className="text-xs text-[var(--teal-50)]">vendor</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-black text-[var(--teal-600)]">
              {avatarChar}
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}