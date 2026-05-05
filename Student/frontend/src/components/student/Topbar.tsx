export function Topbar({
  title = "Dashboard",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between px-6 md:px-10 py-[18px] bg-background/80 backdrop-blur-md border-b border-black/[0.06]">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-60 mb-1">
          <span>Học viên</span>
          <span className="text-border">/</span>
          <span className="text-foreground/40">{title}</span>
        </div>
        <h1 className="text-base font-black text-foreground tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-soft group transition-all">
          <svg className="w-3.5 h-3.5 text-muted group-focus-within:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Tìm kiếm tài liệu..." className="bg-transparent border-none outline-none text-[11px] font-bold text-foreground placeholder:text-muted/60 w-48" />
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-background">
           <div className="flex flex-col items-end hidden sm:flex">
             <span className="text-xs font-black text-foreground tracking-tight">Dương Nguyên</span>
             <span className="text-[10px] font-black text-primary uppercase tracking-tighter">IELTS Scholar</span>
           </div>
           <div className="relative group cursor-pointer">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-soft p-0.5 shadow-premium group-hover:shadow-hover transition-all">
               <div className="w-full h-full rounded-[10px] bg-white overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80" alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               </div>
             </div>
             <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-white"></div>
           </div>
        </div>
      </div>
    </header>
  );
}

