export function BdTopbar({
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
            <span>BD / SALE</span>
            <span className="text-border">/</span>
            <span className="text-foreground/40">{title}</span>
          </div>
          <h1 className="text-base font-black tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
