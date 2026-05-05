"use client";

import { StudentLayout } from "@/app/StudentLayout";
import { Field, Select } from "@/components/student/ui";
import {
  contentTypeLabel,
  getRecentlyViewedDocuments,
  statusLabel,
} from "@/components/student/mockLearning";

const student = {
  name: "Dương Ngọc Khôi Nguyên",
  bcb: "BCB",
  scores: {
    listening: 7.5,
    reading: 5.5,
    writing: 6.0,
    speaking: 4.5,
    overall: 6.0,
  },
};

export default function Home() {
  const recentlyViewed = getRecentlyViewedDocuments(4);

  return (
    <StudentLayout>
      <div className="space-y-10 pb-20">
        
        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              Chào mừng quay trở lại, {student.name.split(' ').pop()}!
            </h2>
            <p className="text-muted text-sm mt-1 font-medium">
              Đây là tổng quan về quá trình học tập của bạn.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Đang hoạt động
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              IELTS Scholar
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Main Content Area - 8 columns */}
          <div className="xl:col-span-8 space-y-10">
            
            {/* Section: STUDENT PROFILE */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Thông tin học viên</h3>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
                
                <div className="relative bg-white p-8 rounded-2xl shadow-soft overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {[
                      { k: "Họ và tên", v: student.name, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "text-primary bg-primary/5" },
                      { k: "Ngày sinh", v: "—", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-muted bg-background" },
                      { k: "Cung hoàng đạo", v: "—", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", color: "text-warning bg-warning/10" },
                      { k: "Email & Số điện thoại", v: "nguyenduong939705@gmail.com • 0947 188 794", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "text-info bg-info/10" },
                      { k: "Động lực học tập", v: "Học để lấy bằng đi du học và phát triển sự nghiệp.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z", color: "text-success bg-success/10" },
                    ].map((row, idx) => (
                      <div key={row.k} className={`flex gap-4 items-start p-2 rounded-xl transition-all hover:bg-background ${idx === 4 ? 'md:col-span-2' : ''}`}>
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${row.color}`}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={row.icon} />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{row.k}</span>
                          <span className="text-sm font-bold text-foreground mt-1 leading-relaxed">{row.v}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section: RECENTLY VIEWED */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Đã xem gần đây</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentlyViewed.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-2xl shadow-soft p-5 hover:shadow-hover transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </div>
                        <div className="mt-1.5 text-xs font-medium text-muted flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-background">{contentTypeLabel(item.type)}</span>
                          <span>•</span>
                          <span>{item.subject}</span>
                        </div>
                      </div>
                      <span
                        className={[
                          "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                          item.status === "completed"
                            ? "bg-success/10 text-success"
                            : item.status === "in_progress"
                              ? "bg-warning/10 text-warning"
                              : "bg-background text-muted",
                        ].join(" ")}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-background flex items-center justify-between">
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        Vị trí đọc: <span className="text-foreground ml-1">{item.position}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Section: AIMS AND ASPIRATIONS */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-info rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Mục tiêu & Dự định</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Ngày thi dự kiến", value: "10/08/2026", img: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80", color: "text-primary" },
                  { title: "Đếm ngược", value: "Còn 108 ngày", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80", color: "text-success", badge: "TRUNG BÌNH" },
                  { title: "Band điểm mục tiêu", value: "7.5 Overall", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", color: "text-warning" }
                ].map((card, i) => (
                  <div key={i} className="rounded-2xl bg-white shadow-soft overflow-hidden hover:shadow-hover transition-all group">
                    <div className="h-24 w-full relative overflow-hidden">
                      <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent"></div>
                    </div>
                    <div className="p-5">
                      <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{card.title}</div>
                      <div className={`text-base font-extrabold ${card.color} tracking-tight`}>{card.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: BCB Grading & Diagnosis */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Bảng Chẩn Bệnh (BCB)</h3>
              </div>

              <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div className="divide-y divide-background">
                  {[
                    { k: "LISTENING", v: "Bạn hiểu phần lớn từ vựng trong nhiều chủ đề, kể cả thuật ngữ học thuật. Bạn nắm được nội dung, liên kết giữa các câu." },
                    { k: "READING", v: "Bạn sử dụng chiến thuật đọc hiệu quả để xác định thông tin chính. Hiểu được các lập luận trong văn bản học thuật." },
                    { k: "WRITING", v: "Nắm được yêu cầu của đề, biết cách phát triển ý. Cần cải thiện chính tả và ngữ pháp để bài mượt mà hơn." },
                    { k: "SPEAKING", v: "Nói tương đối rõ ràng nhưng đôi khi vẫn còn ngắt quãng. Cần mở rộng từ vựng cho các chủ đề học thuật phức tạp hơn." },
                    { k: "OVERALL", v: "Người dùng khá: Sử dụng ngôn ngữ hiệu quả, thỉnh thoảng có lỗi dùng từ chưa phù hợp. Hiểu được ngôn ngữ phức tạp.", primary: true },
                  ].map((item) => (
                    <div key={item.k} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-background transition-colors">
                      <div className="w-24 shrink-0">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.primary ? 'bg-primary text-white shadow-premium' : 'bg-background text-muted'
                        }`}>
                          {item.k}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-muted leading-relaxed">
                        {item.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>

          {/* Right Sidebar - 4 columns */}
          <div className="xl:col-span-4 space-y-10">
            
            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Điểm đầu vào</h3>
              </div>
              
              <div className="p-8 bg-white rounded-3xl shadow-premium flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
                
                <div className="w-full flex justify-between items-center mb-10">
                  <div className="text-xs font-black text-foreground uppercase tracking-widest">Entrance Result</div>
                  <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">BCB ARCHIVE</div>
                </div>

                {/* Score Circle */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-background" />
                    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="264" strokeDashoffset={264 * (1 - 6.0 / 9)} className="text-primary" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-foreground">{student.scores.overall}</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2">Overall</span>
                  </div>
                </div>
                
                <div className="mt-12 grid grid-cols-2 gap-4 w-full">
                  {[
                    { k: "Listening", v: student.scores.listening, c: "text-primary" },
                    { k: "Reading", v: student.scores.reading, c: "text-info" },
                    { k: "Writing", v: student.scores.writing, c: "text-secondary" },
                    { k: "Speaking", v: student.scores.speaking, c: "text-warning" },
                  ].map((s) => (
                    <div key={s.k} className="bg-background p-4 rounded-2xl">
                      <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{s.k}</div>
                      <div className={`text-lg font-black ${s.c}`}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-foreground rounded-full"></div>
                <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Thói quen học tập</h3>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-soft space-y-6">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-muted uppercase tracking-widest">Phương pháp học</label>
                    <div className="p-3 bg-background rounded-xl text-sm font-bold text-foreground">
                      Tập trung luyện đề thực tế
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-muted uppercase tracking-widest">Thời gian cam kết</label>
                    <div className="p-3 bg-background rounded-xl text-sm font-bold text-foreground">
                      Trên 10 giờ / tuần
                    </div>
                 </div>
                 <button className="w-full py-4 bg-foreground text-white text-xs font-black rounded-xl shadow-premium hover:shadow-2xl transition-all active:scale-[0.98] uppercase tracking-widest">
                   Cập nhật thông tin
                 </button>
              </div>
            </section>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
