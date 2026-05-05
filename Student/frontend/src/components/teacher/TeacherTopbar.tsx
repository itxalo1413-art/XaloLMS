export function TeacherTopbar({
  crumb = "Giáo viên",
  title,
  subtitle,
}: {
  crumb?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#f6f7fb]/90 px-6 py-[18px] backdrop-blur-md md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>{crumb}</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-500">{title}</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
