// components/AiRecommendation.js — AI 推薦餐點（橫向滑動卡片）
import Link from "next/link";

// 之後串接時，呼叫 GET /recommendation/recommendations/for/:userId
// 預期回傳格式：[{ menu_id, name, vendor_id, vendor_name, price, daily_limit }]
async function getRecommendations(/* zone, userId, token */) {
  // TODO: 接 Recommendation service
  // const res = await apiFetch(serviceUrl(SERVICES.recommendation, `/recommendations/for/${userId}`), { token });
  // ...
  return null; // 目前先回 null
}

export default async function AiRecommendation({ zone }) {
  const items = await getRecommendations(/* zone, userId, token */);

  return (
    <section className="rounded-lg border border-[var(--teal-200)] bg-[var(--teal-50)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-[var(--teal-600)]">AI 為你推薦</p>
          <p className="text-xs text-slate-500">依你的訂餐紀錄為你挑出今日值得試試的餐點</p>
        </div>
        {!items && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">尚未串接</span>
        )}
      </div>

      {items && items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <Link
              key={item.menu_id}
              href={`/employee/vendors/${item.vendor_id}?zone=${zone}`}
              className="group flex w-[240px] shrink-0 flex-col rounded-lg border border-white bg-white p-3 shadow-sm transition hover:border-[var(--teal-400)] hover:shadow-md"
            >
              <div className="aspect-[5/4] w-full rounded-md bg-gradient-to-br from-[var(--navy-50)] to-[var(--teal-50)]">
                <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
              </div>
              <div className="mt-3">
                <h3 className="line-clamp-1 font-bold text-[var(--navy-900)]">{item.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.vendor_name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-black text-[var(--navy-600)]">${item.price}</span>
                  <span className="text-xs text-slate-500">剩 {item.daily_limit} 份</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          LLM？
        </p>
      )}
    </section>
  );
}