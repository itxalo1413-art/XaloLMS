export function AcaTopbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-primary/10 bg-white/80 px-6 py-[18px] backdrop-blur-md md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 w-full">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
          <span>ACA</span>
          <span className="text-border">/</span>
          <span className="text-foreground/40">{title}</span>
        </div>
        <h1 className="text-base font-black tracking-tight text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        ) : null}
        </div>
        <div className="hidden lg:flex items-center gap-3 rounded-xl border border-primary/10 bg-white px-4 py-2.5 shadow-soft transition-all group">
          <svg className="w-3.5 h-3.5 text-muted group-focus-within:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Tìm kiếm nội dung..." className="w-44 border-none bg-transparent text-[11px] font-bold text-foreground outline-none placeholder:text-muted/60" />
        </div>
      </div>
    </header>
  );
}
