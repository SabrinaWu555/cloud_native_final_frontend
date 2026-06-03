// lib/dates.js — 取餐日期工具
export function getNextDays(count = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // 用本地時區，不是 UTC
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