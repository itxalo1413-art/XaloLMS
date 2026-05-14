"use client";

import * as React from "react";

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-2xl bg-white shadow-soft border border-primary/10 overflow-hidden",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
          <div className="text-xs font-black text-foreground uppercase">{title}</div>
        </div>
        {right ? <div className="text-[10px] font-bold text-muted uppercase">{right}</div> : null}
      </div>
      <div className="px-6 pb-6 pt-2">{children}</div>
    </section>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "progress" | "todo";
}) {
  const styles =
    tone === "progress"
      ? "bg-primary/10 text-primary"
      : tone === "todo"
        ? "bg-secondary/10 text-secondary"
        : "bg-background text-muted";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase  ",
        styles,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[10px] font-black text-muted uppercase tracking-widest">{label}</div>
      {children}
    </label>
  );
}

/** Native `<select>` + overlay chevron (same pattern as kho tài liệu / HabitSelect). */
export function NativeSelectChevron({
  className = "",
  children,
  ...rest
}: React.ComponentProps<"select">) {
  return (
    <div className="relative group">
      <select
        {...rest}
        className={[
          "w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
}: {
  value: string;
  onChange?: (next: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    </div>
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-xl bg-background px-4 py-3 text-sm font-bold text-foreground shadow-sm outline-none transition-all placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-primary/5"
    />
  );
}

