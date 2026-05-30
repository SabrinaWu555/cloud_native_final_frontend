// components/DateSelector.js — 多選日期選擇器
"use client";

export default function DateSelector({ days, selected = [], onChange }) {
  function toggle(value) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  }

  return (
    <div className="surface-panel rounded-lg p-3">
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--teal-600)]">
        選擇取餐日期（可多選未來一週內任意天）
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const active = selected.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              className={`flex min-w-[72px] shrink-0 flex-col items-center rounded-md border px-3 py-2 transition ${
                active
                  ? "border-[var(--navy-600)] bg-[var(--navy-600)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--navy-900)] hover:border-[var(--teal-200)]"
              }`}
            >
              <span className="text-sm font-bold">{d.label}</span>
              <span className={`text-xs ${active ? "text-white/80" : "text-slate-500"}`}>{d.md}</span>
              {/* {active && <span className="mt-0.5 text-[10px] text-white/90">✓ 已選</span>} */}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="mt-2 px-1 text-xs text-[var(--error-fg)]">請至少選擇一天</p>
      )}
    </div>
  );
}