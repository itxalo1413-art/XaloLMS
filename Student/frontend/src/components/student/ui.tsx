"use client";

import * as React from "react";

export function Panel({
  title,
  right,
  children,
  className = "",
  transparentTab = false,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  transparentTab?: boolean;
}) {
  return (
    <section className={["relative pt-[37px]", className].join(" ")}>
      {/* Folder Tab Shape — Match layout tab style and overlap body */}
      <div className="absolute top-0 left-0 z-20 h-[38px] min-w-[180px] md:min-w-[240px] w-max max-w-[90%] flex items-center">
        <svg
          className="absolute inset-0 w-full h-full text-card"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 40 C 10 40 8 0 20 0 L 80 0 C 92 0 90 40 100 40 L 100 41 L 0 41 Z"
            fill={transparentTab ? "none" : "currentColor"}
          />
          <path
            d="M 0 40 C 10 40 8 0 20 0 L 80 0 C 92 0 90 40 100 40"
            fill="none"
            stroke="currentColor"
            className="text-primary/10"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="relative z-10 flex w-full items-center justify-center px-8 md:px-14 pt-1">
          <div className="mr-2.5 h-3.5 w-1.5 rounded-full bg-gradient-to-b from-primary to-secondary shrink-0" />
          <div className="whitespace-nowrap text-[10px] md:text-[11px] font-black uppercase tracking-wider text-foreground truncate">
            {title}
          </div>
        </div>
      </div>

      {/* Folder Body */}
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl rounded-tl-none border border-primary/10 bg-card shadow-soft">
        <div className="relative flex min-h-[44px] shrink-0 items-center justify-center border-b border-primary/5 px-4 py-2.5 md:px-6">
          {right ? (
            <div className="text-center text-[10px] sm:text-[11px] font-medium text-muted/90 whitespace-nowrap">
              {right}
            </div>
          ) : null}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 pt-3 md:pt-4 scrollbar-thin">{children}</div>
      </div>
    </section>
  );
}

/** CollapsiblePanel — Same tab shape as Panel, but with a chevron toggle to expand/collapse content */
export function CollapsiblePanel({
  title,
  right,
  topContent,
  children,
  className = "",
  defaultOpen = false,
  isOpen,
  hideToggle = false,
  onToggle,
  transparentTab = false,
}: {
  title: string;
  right?: React.ReactNode;
  topContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  hideToggle?: boolean;
  onToggle?: (open: boolean) => void;
  transparentTab?: boolean;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  const handleToggle = () => {
    const next = !open;
    setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <section className={["relative pt-[37px]", className].join(" ")}>
      {/* Folder Tab Shape */}
      <div className="absolute top-0 left-0 z-20 h-[38px] min-w-[180px] md:min-w-[240px] w-max max-w-[90%] flex items-center">
        <svg
          className="absolute inset-0 w-full h-full text-card"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 40 C 10 40 8 0 20 0 L 80 0 C 92 0 90 40 100 40 L 100 41 L 0 41 Z"
            fill={transparentTab ? "none" : "currentColor"}
          />
          <path
            d="M 0 40 C 10 40 8 0 20 0 L 80 0 C 92 0 90 40 100 40"
            fill="none"
            stroke="currentColor"
            className="text-primary/10"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="relative z-10 flex w-full items-center justify-center px-8 md:px-14 pt-1">
          <div className="mr-2.5 h-3.5 w-1.5 rounded-full bg-gradient-to-b from-primary to-secondary shrink-0" />
          <div className="whitespace-nowrap text-[10px] md:text-[11px] font-black uppercase tracking-wider text-foreground truncate">
            {title}
          </div>
        </div>
      </div>

      {/* Folder Body */}
      <div className="relative z-10 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl rounded-tl-none border border-primary/10 bg-card shadow-soft">
        {/* Header row with toggle button */}
        <div className="relative flex min-h-[44px] w-full shrink-0 items-center justify-between border-b border-primary/5 px-4 py-2.5 md:px-6">
          {right ? (
            <div className="text-center text-[10px] sm:text-[11px] font-medium text-muted/90 whitespace-nowrap flex-1">
              {right}
            </div>
          ) : <div className="flex-1" />}
          {!hideToggle && (
            <button
              type="button"
              onClick={handleToggle}
              className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0edff] hover:bg-[#e4ddff] text-primary transition-all duration-300 active:scale-95 cursor-pointer shadow-2xs"
              aria-expanded={open}
              title={open ? "Thu gọn Bảng kết quả" : "Mở rộng Bảng kết quả"}
            >
              <div
                className="flex items-center justify-center transition-transform duration-300"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
          )}
        </div>

        {/* Top Content — Always Visible */}
        {topContent && (
          <div className="p-4 md:p-6 pb-4">
            {topContent}
          </div>
        )}

        {/* Animated Collapsible Content — Table Results */}
        {children && (
          <div
            ref={bodyRef}
            style={{
              display: "grid",
              gridTemplateRows: open ? "1fr" : "0fr",
              transition: "grid-template-rows 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div className="p-4 md:p-6 pt-3 md:pt-4 border-t border-zinc-100/80">
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
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
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          ...rest.style,
        }}
        className={[
          "w-full cursor-pointer appearance-none rounded-2xl border border-zinc-200 bg-white pl-4 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all focus:border-primary/45 focus:ring-2 focus:ring-primary/10",
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
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
        }}
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

