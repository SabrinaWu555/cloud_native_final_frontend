"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditMenuPage() {
  const router   = useRouter();
  const { id }   = useParams();

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState("");
  const [form,     setForm]     = useState({
    name:         "",
    category:     "",
    price:        "",
    daily_limit:  "",
    description:  "",
    is_available: true,
  });

  // 載入現有資料
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(`/api/vendor/menus/${id}`);
        if (!res.ok) throw new Error("載入失敗");
        const data = await res.json();
        setForm({
          name:         data.name         ?? "",
          category:     data.category     ?? "",
          price:        String(data.price ?? ""),
          daily_limit:  String(data.daily_limit ?? ""),
          description:  data.description  ?? "",
          is_available: data.is_available ?? true,
        });
      } catch {
        setError("無法載入餐點資料，請重新整理");
      } finally {
        setFetching(false);
      }
    }
    fetchMenu();
  }, [id]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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
      const res = await fetch(`/api/vendor/menus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:       Number(form.price),
          daily_limit: Number(form.daily_limit),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "更新失敗，請稍後再試");
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

  async function onDelete() {
    if (!confirm("確定要刪除這個餐點嗎？此操作無法復原。")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/menus/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "刪除失敗");
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

  if (fetching) {
    return (
      <div className="mx-auto w-full max-w-xl pt-12 text-center text-sm text-slate-400">
        載入中...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">

      {/* 麵包屑 */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/vendor"       className="hover:text-[var(--teal-600)]">工作台</Link>
        <span>/</span>
        <Link href="/vendor/menus" className="hover:text-[var(--teal-600)]">菜單管理</Link>
        <span>/</span>
        <span className="font-semibold text-[var(--navy-900)]">編輯餐點</span>
      </div>

      {/* 表單 */}
      <section className="surface-panel rounded-lg px-6 py-7">
        <h1 className="text-2xl font-black text-[var(--navy-900)]">編輯餐點</h1>
        <p className="mt-1 text-sm text-slate-500">修改餐點資料後按儲存生效</p>

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

          {/* 價格 + 每日份數 */}
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

          {/* 上架狀態 */}
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--line)] px-4 py-3">
            <input
              type="checkbox"
              name="is_available"
              checked={form.is_available}
              onChange={onChange}
              className="h-4 w-4 accent-[var(--teal-400)]"
            />
            <span className="text-sm font-semibold text-[var(--navy-900)]">
              目前上架中（取消勾選即下架）
            </span>
          </label>

          {/* 錯誤訊息 */}
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-500">
              {error}
            </p>
          )}

          {/* 按鈕列 */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-[var(--navy-600)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)] disabled:opacity-50"
            >
              {loading ? "儲存中..." : "儲存變更"}
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

      {/* 刪除區塊 */}
      <section className="rounded-lg border border-red-200 bg-red-50 px-6 py-5">
        <p className="text-sm font-bold text-red-600">危險操作</p>
        <p className="mt-1 text-sm text-slate-600">刪除後無法復原，所有相關紀錄將一併移除。</p>
        <button
          onClick={onDelete}
          disabled={loading}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
        >
          刪除此餐點
        </button>
      </section>

    </div>
  );
}