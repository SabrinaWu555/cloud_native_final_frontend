// lib/dates.js — 取餐日期工具

/**
 * @param {number} maxOffset 最大天數偏移（包含），預設 6（即顯示到 D+6）
 *                          看後端庫存推幾天決定，現在後端推 D+0~D+6
 */
export function getNextDays(maxOffset = 7) {
  const days = [];
  const now = new Date();
  const hour = now.getHours();

  // 17:00 後，明天已截止，從後天起算
  const startOffset = hour >= 17 ? 2 : 1;

  for (let i = startOffset; i <= maxOffset; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    // 用本地時區
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const value = `${y}-${m}-${day}`;
    const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    const label = `${d.getMonth() + 1}/${d.getDate()} (${weekday})`;
    days.push({ value, label });
  }
  return days;
}

export function isValidDate(value) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}