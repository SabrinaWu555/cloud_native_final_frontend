import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  ENDPOINTS,
  SERVICES,
  apiFetch,
  jsonOrEmpty,
  serviceUrl,
  withPathParams,
} from "@/lib/api";

function fallbackRecommendation(menus = []) {
  const available = menus.filter((menu) => Number(menu.daily_limit ?? menu.remaining ?? 0) > 0);
  const menu =
    [...available].sort((a, b) => Number(b.ai_score ?? 0) - Number(a.ai_score ?? 0))[0] ||
    menus[0] ||
    null;

  return {
    menu,
    reason: menu ? "目前以剩餘供應、價格與健康取向做本地排序。" : "目前沒有可推薦餐點。",
  };
}

export async function GET() {
  if (!SERVICES.recommendation) {
    return NextResponse.json(fallbackRecommendation());
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ message: "缺少使用者 ID" }, { status: 400 });
  }

  try {
    const res = await apiFetch(
      serviceUrl(
        SERVICES.recommendation,
        withPathParams(ENDPOINTS.recommendationCacheForUser, { id: userId }),
      ),
      { token },
    );
    const data = await jsonOrEmpty(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(fallbackRecommendation());
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));

  if (!SERVICES.recommendation) {
    return NextResponse.json(fallbackRecommendation(payload.menus || []));
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const userId = cookieStore.get("userId")?.value || payload.userId || payload.user_id;

  try {
    const res = await apiFetch(serviceUrl(SERVICES.recommendation, ENDPOINTS.recommendationCache), {
      token,
      method: "POST",
      body: {
        ...payload,
        userId,
        user_id: userId,
      },
    });
    const data = await jsonOrEmpty(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(fallbackRecommendation(payload.menus || []));
  }
}
