"use client";

import { StudentLayout } from "@/app/StudentLayout";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  contentTypeLabel,
  getProgressMap,
  mockDocuments,
  statusLabel,
} from "@/components/student/mockLearning";

const listSachTangThem = [
  "Tổng hợp Grammar Reference (with Exercises)",
  "Cambridge 19",
  "Self-practice book (4 skills)",
  "Reading Vol.1",
  "Complete IELTS Band 4.0-5.0",
  "Get ready for IELTS",
  "Basic IELTS",
  "Cambridge Grammar for IELTS",
  "Collins Grammar for IELTS",
  "Collins Listening for IELTS",
  "Collins Reading for IELTS",
  "Collins Vocabulary For IELTS",
  "Complete IELTS Band 5.0-6.5",
  "Destination B1 & B2",
  "English Collocation in Use - Intermediate",
  "English Vocabulary in Use - Upper Intermediate",
  "English Grammar in Use - Intermediate",
  "Essential Words for IELTS (Barrons)",
  "Inside Reading",
  "Oxford Practice Grammar Intermediate",
  "English Pronunciation in Use - Elementary",
  "Mindset for IELTS Level 2",
  "Bridge to IELTS",
  "Reading Vol.2",
  "Reading Vol.3",
  "Reading Vol.4",
  "Reading Vol.5",
  "Guideline Speaking & Writing Band 4.5-5.5+",
  "Writing Challenge",
  "English Grammar in Use - Elementary",
  "Oxford Practice Grammar Basic",
  "English Vocabulary in Use - Elementary & Intermediate",
  "Essential Reading for IELTS",
  "Listening Practice Through Dictation",
  "Mindset for IELTS Level 1",
  "Mindset for IELTS Foundation",
  "Tactics for Listening",
  "Complete IELTS Band 6.5–7.5",
  "Destination C1 & C2",
  "English Collocations in Use – Advanced",
  "English Grammar in Use – Advanced",
  "English Pronunciation in Use – Advanced",
  "English Vocabulary in Use – Advanced",
  "IELTS Advantage Skills",
  "Improve your Writing skill 6.0–7.5",
  "Mindset for IELTS Level 3",
  "Oxford Practice Grammar Advanced",
];

export default function TaiLieuThemPage() {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const progressMap = getProgressMap();

  const suggestedDocuments = useMemo(() => {
    return mockDocuments.slice(0, 3);
  }, []);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = mockDocuments.filter((doc) => {
      const matchQuery =
        normalized.length === 0 ||
        doc.title.toLowerCase().includes(normalized) ||
        doc.description.toLowerCase().includes(normalized);
      const matchSubject = subjectFilter === "all" || doc.subject === subjectFilter;
      const matchType = typeFilter === "all" || doc.type === typeFilter;
      return matchQuery && matchSubject && matchType;
    });

    const sorted = [...rows];
    if (sortBy === "newest") sorted.reverse();
    if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [query, subjectFilter, typeFilter, sortBy]);

  const quickResults = useMemo(() => {
    if (!query.trim()) return [];
    return filteredDocuments.slice(0, 4);
  }, [query, filteredDocuments]);

  const subjects = Array.from(new Set(mockDocuments.map((doc) => doc.subject)));

  return (
    <StudentLayout>
      <div className="flex flex-col pb-20">
        <header>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Thư viện tài liệu</h2>
          <p className="text-muted text-sm mt-1 font-medium">Tìm kiếm và ôn tập các tài liệu bổ trợ cho khóa học.</p>
        </header>

        {/* Section: LỚP LUYỆN ĐỀ */}
        <section className="mt-[18px]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Lớp luyện đề tập trung</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-soft">
              <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Lịch học tập trung
              </h3>
              <ul className="space-y-4">
                {[
                  { day: "Chủ Nhật", time: "9h - 11h30", activity: "Làm đề tập trung" },
                  { day: "Thứ 3", time: "19h45 - 21h30", activity: "Sửa W - L - R" },
                  { day: "Thứ 7", time: "19h45 - 21h30", activity: "Sửa Speaking" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-foreground">{item.day}</span>
                      <span className="text-[10px] font-bold text-muted uppercase">{item.time}</span>
                    </div>
                    <span className="text-sm font-bold text-primary bg-primary-soft px-3 py-1 rounded-lg transition-colors group-hover:bg-primary group-hover:text-white">
                      {item.activity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-foreground p-8 rounded-2xl shadow-premium relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15.6 11.6L22 7v10l-6.4-4.6v-0.8z"></path><rect x="2" y="7" width="12" height="10" rx="2" ry="2"></rect></svg>
                Thông tin Zoom
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl backdrop-blur hover:bg-white/10 transition-all">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Meeting ID</span>
                  <span className="text-base font-black text-white tracking-wider">853 7727 0229</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl backdrop-blur hover:bg-white/10 transition-all">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Mật mã</span>
                  <span className="text-base font-black text-white tracking-wider">123456</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-background">
                    <th className="px-6 py-5 font-black text-muted uppercase tracking-widest text-[10px]">Test/Date</th>
                    <th className="px-4 py-5 font-black text-muted uppercase tracking-widest text-[10px] text-center">Listening</th>
                    <th className="px-4 py-5 font-black text-muted uppercase tracking-widest text-[10px] text-center">Reading</th>
                    <th className="px-4 py-5 font-black text-muted uppercase tracking-widest text-[10px] text-center">Writing</th>
                    <th className="px-4 py-5 font-black text-muted uppercase tracking-widest text-[10px] text-center">Speaking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background">
                  {[
                    { name: "LĐ16 | Bùi Phạm Diệu Linh", l: "—", r: "—", w: "5.5", s: "—" },
                    { name: "LĐ17 | Bùi Phạm Diệu Linh", l: "6.0", r: "5.5", w: "4.5", s: "—" },
                    { name: "LĐ18 | Bùi Phạm Diệu Linh", l: "—", r: "—", w: "—", s: "—" },
                    { name: "LĐ19 | Bùi Phạm Diệu Linh", l: "—", r: "—", w: "—", s: "—" },
                    { name: "LĐ 20 | Bùi Phạm Diệu Linh", l: "8.0", r: "6.0", w: "5.5", s: "—" },
                    { name: "LĐ 21 | Bùi Phạm Diệu Linh", l: "6.5", r: "5.0", w: "5.0", s: "—" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-background transition-colors group">
                      <td className="px-6 py-4 font-bold text-foreground/80 whitespace-nowrap group-hover:text-primary">{row.name}</td>
                      <td className={`px-4 py-4 text-center font-black ${row.l !== '—' ? 'text-primary' : 'text-muted/30'}`}>{row.l}</td>
                      <td className={`px-4 py-4 text-center font-black ${row.r !== '—' ? 'text-info' : 'text-muted/30'}`}>{row.r}</td>
                      <td className={`px-4 py-4 text-center font-black ${row.w !== '—' ? 'text-secondary' : 'text-muted/30'}`}>{row.w}</td>
                      <td className={`px-4 py-4 text-center font-black ${row.s !== '—' ? 'text-warning' : 'text-muted/30'}`}>{row.s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section: WELCOME PACKAGE */}
        <section className="mt-12">
           <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
            <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Welcome Package</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Computer trial", color: "text-primary", icon: "💻", items: ["LISTENING", "READING", "WRITING T1", "WRITING T2"] },
              { label: "Registration guide", color: "text-info", icon: "📑", items: ["HƯỚNG DẪN ĐĂNG KÝ THI.docx"] },
              { label: "Orientation guide", color: "text-secondary", icon: "🚀", items: ["Solidifying Stage Craft"] },
              { label: "Resource Website", color: "text-warning", icon: "🌐", items: ["bestmytest.com/ielts"] }
            ].map((box, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-hover transition-all group">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl mb-4 group-hover:bg-primary/5 transition-colors">
                  {box.icon}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${box.color}`}>{box.label}</div>
                <ul className="text-xs font-bold text-muted space-y-2">
                  {box.items.map((it, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-background"></div>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Search & Filter */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-info rounded-full"></div>
            <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Tìm kiếm & Phân loại</h3>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-soft space-y-8">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên tài liệu hoặc từ khóa…"
                className="w-full h-14 rounded-2xl bg-background px-6 pl-14 text-sm font-bold text-foreground outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { val: subjectFilter, set: setSubjectFilter, options: [{l: "Tất cả skill", v: "all"}, ...subjects.map(s => ({l: s, v: s}))] },
                { val: typeFilter, set: setTypeFilter, options: [{l: "Tất cả loại", v: "all"}, {l: "PDF", v: "PDF"}, {l: "Video", v: "Video"}, {l: "Text", v: "Text"}] },
                { val: sortBy, set: setSortBy, options: [{l: "Mức độ liên quan", v: "relevance"}, {l: "Mới nhất", v: "newest"}, {l: "Tên A-Z", v: "title"}] }
              ].map((filter, i) => (
                <div key={i} className="relative group">
                  <select
                    value={filter.val}
                    onChange={(e) => filter.set(e.target.value)}
                    className="w-full h-12 appearance-none rounded-xl bg-background px-4 pr-10 text-xs font-black text-muted uppercase tracking-widest outline-none focus:bg-white transition-all cursor-pointer group-hover:bg-zinc-50"
                  >
                    {filter.options.map((opt, j) => <option key={j} value={opt.v}>{opt.l}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Suggested Documents */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-warning rounded-full"></div>
            <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Tài liệu gợi ý</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {suggestedDocuments.map((doc) => (
              <article key={doc.id} className="bg-white rounded-2xl shadow-soft p-6 flex flex-col group hover:shadow-hover transition-all duration-300">
                <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{doc.subject}</div>
                <h4 className="text-base font-extrabold text-foreground mb-3 group-hover:text-primary transition-colors">{doc.title}</h4>
                <p className="text-xs font-medium text-muted leading-relaxed flex-1 mb-6">{doc.description}</p>
                <div className="p-3 bg-background rounded-xl mb-6">
                   <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Vì sao gợi ý?</div>
                   <div className="text-[10px] font-bold text-muted">{doc.suggestedReason}</div>
                </div>
                <Link href={`/tai-lieu-them/xem/${doc.id}`} className="w-full py-3 bg-foreground text-white text-[10px] font-black rounded-xl shadow-premium hover:shadow-2xl text-center uppercase tracking-widest transition-all active:scale-95">
                  Mở xem ngay
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* List: Tài liệu khác */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Sách tặng thêm</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {listSachTangThem.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-soft p-4 flex items-center gap-4 hover:bg-background transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-[10px] font-black text-muted group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                <span className="text-xs font-bold text-muted leading-snug group-hover:text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </StudentLayout>
  );
}
