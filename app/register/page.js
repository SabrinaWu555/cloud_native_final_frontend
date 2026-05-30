"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const initialForm = {
  employeeNo: "",
  name: "",
  department: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeNo: form.employeeNo,
          employee_no: form.employeeNo,
          name: form.name,
          department: form.department,
          phone: form.phone,
          email: form.email,
          password: form.password,
          role: "employee",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "註冊失敗，請確認資料後再試一次");
        return;
      }

      setSuccess("帳號建立成功，正在前往登入頁。");
      setForm(initialForm);
      setTimeout(() => router.push("/login?role=employee&next=/employee"), 800);
    } catch {
      setError("無法連線，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--neutral-bg)]">
      <header className="border-b border-[var(--line)] bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--navy-800)] text-xs font-black text-white">
              TSMC
            </span>
            <span>
              <span className="block font-black text-[var(--navy-900)]">企業訂餐平台</span>
              <span className="block text-xs font-semibold text-[var(--teal-600)]">員工註冊</span>
            </span>
          </Link>
          <Link
            href="/login?role=employee&next=/employee"
            className="text-sm font-bold text-[var(--navy-600)] hover:underline"
          >
            返回登入
          </Link>
        </div>
      </header>

      <div className="grid w-full gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <section className="rounded-lg bg-[var(--navy-900)] p-6 text-white lg:min-h-[calc(100vh-132px)]">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--teal-200)]">
            Register
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight">建立員工訂餐帳號</h1>
          <div className="mt-8 grid gap-3 text-sm">
            <Step index="1" label="建立 IAM 使用者" />
            <Step index="2" label="建立員工資料" />
            <Step index="3" label="前往員工端登入" />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="surface-panel grid gap-5 rounded-lg p-6">
          {error && (
            <div className="rounded-md bg-[var(--error-bg)] px-3 py-2 text-sm font-medium text-[var(--error-fg)]">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-[var(--success-bg)] px-3 py-2 text-sm font-medium text-[var(--success-fg)]">
              {success}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="員工編號"
              value={form.employeeNo}
              onChange={(value) => updateField("employeeNo", value)}
              required
            />
            <Field
              label="姓名"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              required
            />
            <Field
              label="部門"
              value={form.department}
              onChange={(value) => updateField("department", value)}
              required
            />
            <Field
              label="電話"
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="密碼"
              type="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
              required
            />
            <Field
              label="確認密碼"
              type="password"
              value={form.confirmPassword}
              onChange={(value) => updateField("confirmPassword", value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-11 rounded-md bg-[var(--navy-600)] px-6 text-sm font-bold text-white transition hover:bg-[var(--navy-800)] disabled:opacity-60"
          >
            {loading ? "建立中..." : "建立帳號"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, type = "text", value, onChange, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-200)]/50"
      />
    </label>
  );
}

function Step({ index, label }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/10 px-3 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-200)] text-sm font-black text-[var(--navy-900)]">
        {index}
      </span>
      <span className="font-semibold text-white/80">{label}</span>
    </div>
  );
}
