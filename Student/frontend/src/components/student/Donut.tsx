import * as React from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function Donut({
  value,
  label,
  sublabel,
}: {
  value: number; // 0..100
  label: string;
  sublabel?: string;
}) {
  const v = clamp(value, 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div className="relative grid place-items-center">
      <svg width="132" height="132" viewBox="0 0 120 120" className="block">
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="#E4E4E7"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="#A78BFA"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-2xl font-semibold tracking-tight text-zinc-900">
          {Math.round(v)}
        </div>
        <div className="text-[11px] font-medium text-zinc-500">{label}</div>
        {sublabel ? (
          <div className="mt-1 text-[11px] text-zinc-400">{sublabel}</div>
        ) : null}
      </div>
    </div>
  );
}

