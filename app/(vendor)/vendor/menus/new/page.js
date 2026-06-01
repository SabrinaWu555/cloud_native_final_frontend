// app/(vendor)/vendor/menus/new/page.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TAG_OPTIONS = [
  { code: "VEGETARIAN", label: "素食" },
  { code: "BEEF", label: "牛肉" },
  { code: "CHICKEN", label: "雞肉" },
  { code: "PORK", label: "豬肉" },
  { code: "LAMB", label: "羊肉" },
  { code: "CHINESE", label: "中式" },
  { code: "JAPANESE", label: "日式" },
  { code: "ITALIAN", label: "義式" },
  { code: "SOUTHEAST_ASIAN", label: "東南亞" },
  { code: "AMERICAN", label: "美式" },
  { code: "BUDGET", label: "便宜" },
  { code: "SPICY", label: "辣" },
  { code: "MILD", label: "不辣" },
];

export default function NewMenuPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  
  const [imagePreview, setImagePreview] = useState(""); // 預覽圖片用
  const [uploadedUrl, setUploadedUrl] = useState("");   // 最終要傳給後端的 S3 網址

  const [form, setForm] = useState({
    name: "",
    price: "",
    dailyLimit: "",
    tags: [],
  });

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function onTagChange(code) {
    setForm((prev) => {
      const isSelected = prev.tags.includes(code);
      const newTags = isSelected
        ? prev.tags.filter((t) => t !== code)
        : [...prev.tags, code];
      return { ...prev, tags: newTags };
    });
  }

  // ✨ 核心功能：處理圖片檔案上傳 (S3 Pre-signed URL 流程)
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. 前端本地預覽
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError("");

    try {
      // 2. 向後端請求 S3 Pre-signed URL
      // 注意：後端路徑根據 README 為 /api/v1/vendors/me/menus/upload-image-url
      // 這裡透過 Next.js Proxy 或實際 API Gateway 呼叫
      const res = await fetch(`/api/vendor/menus/upload-image-url?contentType=${encodeURIComponent(file.type)}`);
      
      if (!res.ok) throw new Error("無法取得上傳授權網址，狀態碼：" + res.status);
      
      const { uploadUrl, imageUrl } = await res.json();

      // 3. 使用 PUT 直接將二進位檔案上傳至 AWS S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("圖片上傳至 S3 失敗");

      // 4. 紀錄 S3 回傳的真實圖片網址，等等給表單送出用
      setUploadedUrl(imageUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || "圖片上傳失敗，請重試");
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.price || !form.dailyLimit) {
      setError("請填寫餐點名稱、價格與每日供應份數");
      return;
    }

    if (uploadingImage) {
      setError("圖片還在努力上傳中，請稍候...");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vendor/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          dailyLimit: Number(form.dailyLimit),
          // 如果商家沒上傳圖片，給一個漂亮的預設食物驚喜圖，避免後端報錯
          imageUrl: uploadedUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop",
          tags: form.tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "新增失敗，請檢查後端服務或資料格式");
        return;
      }

      router.push("/vendor/menus");
      router.refresh();
    } catch {
      setError("網路錯誤，請確認後端伺服器是否正常運作");
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
      <section className="surface-panel rounded-lg px-6 py-7 bg-white shadow-sm border border-[var(--line)]">
        <h1 className="text-2xl font-black text-[var(--navy-900)]">新增餐點</h1>
        <p className="mt-1 text-sm text-slate-500">填寫餐點基本資料，並上傳實體照片</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {/* 餐點名稱 */}
          <div>
            <label className="block text-sm font-bold text-[var(--navy-900)]">
              餐點名稱 <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="例：天晟招牌燒臘便當"
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
                placeholder="例：110"
                className="mt-1.5 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--navy-900)]">
                每日預設供應量 <span className="text-red-500">*</span>
              </label>
              <input
                name="dailyLimit"
                type="number"
                min="0"
                value={form.dailyLimit}
                onChange={onChange}
                placeholder="例：50"
                className="mt-1.5 w-full rounded-md border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20"
              />
            </div>
          </div>

          {/* ✨ 改版：實體圖片上傳欄位 */}
          <div>
            <label className="block text-sm font-bold text-[var(--navy-900)]">
              餐點照片 <span className="text-xs font-normal text-slate-500">（上傳後將自動儲存至雲端）</span>
            </label>
            
            <div className="mt-1.5 flex items-center gap-4">
              {/* 圖片預覽區 */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-slate-50 overflow-hidden text-slate-400">
                {imagePreview ? (
                  <img src={imagePreview} alt="預覽" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs">無照片</span>
                )}
                {/* 上傳中遮罩 */}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-bold text-white">
                    上傳中...
                  </div>
                )}
              </div>

              {/* 檔案選擇按鈕 */}
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 file:transition hover:file:bg-slate-200"
                />
                <p className="mt-1 text-xs text-slate-400">支援 JPG, PNG 格式</p>
              </div>
            </div>
          </div>

          {/* 食物標籤 (Tags) */}
          <div>
            <label className="block text-sm font-bold text-[var(--navy-900)] mb-2">
              餐點特徵標籤 <span className="text-xs font-normal text-slate-500">（供推薦系統使用，可複選）</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {TAG_OPTIONS.map((tag) => {
                const isChecked = form.tags.includes(tag.code);
                return (
                  <button
                    key={tag.code}
                    type="button"
                    onClick={() => onTagChange(tag.code)}
                    className={`flex items-center justify-center rounded-md border py-2 text-xs font-semibold transition ${
                      isChecked
                        ? "border-[var(--teal-600)] bg-[var(--teal-50)] text-[var(--teal-600)] shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* 按鈕組 */}
          <div className="flex gap-3 pt-2 border-t border-[var(--line)]">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 rounded-md bg-[var(--navy-600)] py-2.5 text-sm font-bold text-white transition hover:bg-[var(--navy-800)] disabled:opacity-50"
            >
              {loading ? "正在儲存上架..." : uploadingImage ? "請等待圖片上傳完成" : "確認上架餐點"}
            </button>
            <Link
              href="/vendor/menus"
              className="rounded-md border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              取消
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}