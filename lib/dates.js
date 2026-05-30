// lib/dates.js — 產生「今天起未來 N 天」的日期清單
export function getNextDays(count = 7) {
  const WD = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const label = i === 0 ? "今天" : i === 1 ? "明天" : WD[d.getDay()];
    days.push({ value, label, md: `${d.getMonth() + 1}/${d.getDate()}` });
  }
  return days;
}

export function isValidDate(value, days) {
  return days.some((d) => d.value === value);
}