"use client";

export function Topbar({
  title = "Thông tin học viên",
  onOpenMenu,
  onOpenProfile,
  profileName = "Học viên",
  profileSubtitle = "IELTS Scholar",
  avatarUrl,
}: {
  title?: string;
  onOpenMenu?: () => void;
  onOpenProfile?: () => void;
  profileName?: string;
  profileSubtitle?: string;
  avatarUrl?: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-primary/10 bg-white/80 px-6 py-[18px] backdrop-blur-md md:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary md:hidden"
          aria-label="Mở menu"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-60 mb-1">
          <span>Học viên</span>
          <span className="text-border">/</span>
          <span className="text-foreground/40">{title}</span>
        </div>
        <h1 className="text-base font-black text-foreground tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-soft border border-primary/10 group transition-all">
          <svg className="w-3.5 h-3.5 text-muted group-focus-within:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Tìm kiếm tài liệu..." className="bg-transparent border-none outline-none text-[11px] font-bold text-foreground placeholder:text-muted/60 w-48" />
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-primary/15">
           <div className="flex flex-col items-end hidden sm:flex">
             <span className="text-xs font-black text-foreground tracking-tight">{profileName}</span>
             <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{profileSubtitle}</span>
           </div>
           <button
             type="button"
             onClick={onOpenProfile}
             className="relative group cursor-pointer"
             aria-label="Mở hồ sơ học viên"
           >
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-premium group-hover:shadow-hover transition-all">
               <div className="w-full h-full rounded-[10px] bg-white overflow-hidden">
                 {avatarUrl ? (
                   <img
                     src={avatarUrl}
                     alt="Avatar"
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-sm font-black">
                     {profileName.slice(0, 1)}
                   </div>
                 )}
               </div>
             </div>
             <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-white"></div>
           </button>
        </div>
      </div>
    </header>
  );
}

