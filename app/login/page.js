"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const roleMeta = {
  employee: { label: "員工", title: "Employee Portal", fallback: "/employee" },
  vendor: { label: "商家", title: "Vendor Console", fallback: "/vendor" },
  committee: { label: "福委會", title: "Committee Desk", fallback: "/committee" },
  admin: { label: "福委會", title: "Committee Desk", fallback: "/committee" },
};

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--neutral-bg)]" />}>
      <LoginPanel />
    </Suspense>
  );
}

function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRole = searchParams.get("role") || "employee";
  const nextPath = safeNext(searchParams.get("next"));
  const meta = roleMeta[selectedRole] || roleMeta.employee;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const portalLinks = useMemo(
    () => [
      { key: "employee", label: "員工", href: "/login?role=employee&next=/employee" },
      { key: "vendor", label: "商家", href: "/login?role=vendor&next=/vendor" },
      { key: "committee", label: "福委會", href: "/login?role=committee&next=/committee" },
    ],
    [],
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedRole }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "登入失敗，請再試一次");
        return;
      }

      const destination =
        nextPath || roleMeta[data.role]?.fallback || roleMeta[selectedRole]?.fallback || "/employee";
      router.push(destination);
      router.refresh();
    } catch {
      setError("無法連線，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-shell grid min-h-screen px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
      <section className="motion-fade-up hidden items-center text-white lg:flex">
        <div className="max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 rounded-md border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-white text-xs font-black text-[var(--navy-800)]">
              TSMC
            </span>
            <span className="text-sm font-semibold text-white/80">企業訂餐平台</span>
          </Link>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-[var(--teal-200)]">
            {meta.title}
          </p>
          <h1 className="mt-3 text-5xl font-black leading-tight">登入 {meta.label} 工作台</h1>
          {/* <p className="mt-5 text-base leading-7 text-[var(--navy-50)]">
            每個角色都有獨立工作台，讓訂餐、出餐和案件處理維持清楚的責任邊界。
          </p> */}
        </div>
      </section>

      <section className="flex items-center justify-center">
        <div className="motion-fade-up-delay glass-panel w-full max-w-md rounded-lg p-5 sm:p-6">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--navy-800)] text-xs font-black text-white">
                TSMC
              </span>
              <span>
                <span className="block font-black text-[var(--navy-900)]">企業訂餐平台</span>
                <span className="block text-xs font-semibold text-[var(--teal-600)]">
                  {meta.label}登入
                </span>
              </span>
            </Link>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {portalLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                  item.key === selectedRole
                    ? "border-[var(--teal-400)] bg-[var(--teal-50)] text-[var(--teal-600)]"
                    : "border-[var(--line)] bg-white text-slate-600 hover:border-[var(--navy-100)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold text-[var(--teal-600)]">{meta.label}登入</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--navy-900)]">歡迎回來</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">密碼</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                required
                className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[var(--navy-600)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)] disabled:opacity-60"
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            員工尚未建立帳號？{" "}
            <Link href="/register" className="font-bold text-[var(--navy-600)] hover:underline">
              建立員工帳號
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
