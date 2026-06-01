"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewMenuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({
    name:        "",
    category:    "",
    price:       "",
    daily_limit: "",
    description: "",
  });

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.price || !form.daily_limit) {
      setError("請填寫餐點名稱、價格與每日供應份數");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vendor/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:       Number(form.price),
          daily_limit: Number(form.daily_limit),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "新增失敗，請稍後再試");
        return;
      }

      router.push("/vendor/menus");
      router.refresh();
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">

      {/* 麵包屑 */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/vendor" className="hover:text-[var(--teal-600)]">工作台</Link>
        <span>/</span>
        <Link href="/vendor/menus" className="hover:text-[var(--teal-600)]">菜單管理</Link>
        <span>/</span>
        <span className="font-semibold text-[var(--navy-900)]">新增餐點</span>
      </div>

      {/* 表單 */}
      <section className="surface-panel rounded-lg px-6 py-7">
        <h1 className="text-2xl font-black text-[var(--navy-900)]">新增餐點</h1>
        <p className="mt-1 text-sm text-slate-500">填寫餐點基本資料，建立後可在菜單管理頁編輯</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">

          {/* 餐點名稱 */}
          <div>
            <label className="block text-sm font-bold text-[var(--navy-900)]">
              餐點名稱 <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="例：雞腿便當"
              className="mt-1.5 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
            />
          </div>

          {/* 分類 */}
          <div>
            <label className="block text-sm font-bold text-[var(--navy-900)]">分類</label>
            <input
              name="category"
              value={form.category}
              onChange={onChange}
              placeholder="例：便當、麵食、素食"
              className="mt-1.5 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
            />
          </div>

          {/* 價格 + 每日份數（並排） */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-[var(--navy-900)]">
                價格（元） <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={onChange}
                placeholder="例：80"
                className="mt-1.5 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--navy-900)]">
                每日供應份數 <span className="text-red-500">*</span>
              </label>
              <input
                name="daily_limit"
                type="number"
                min="0"
                value={form.daily_limit}
                onChange={onChange}
                placeholder="例：30"
                className="mt-1.5 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-bold text-[var(--navy-900)]">餐點描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={3}
              placeholder="選填：食材說明、備注等"
              className="mt-1.5 w-full resize-none rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-500">
              {error}
            </p>
          )}

          {/* 按鈕 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-[var(--navy-600)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)] disabled:opacity-50"
            >
              {loading ? "新增中..." : "新增餐點"}
            </button>
            <Link
              href="/vendor/menus"
              className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              取消
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}