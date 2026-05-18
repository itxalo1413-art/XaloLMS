"use client";

import { StudentLayout } from "@/app/StudentLayout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  contentTypeLabel,
  getRecentlyViewedDocuments,
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

  const [recentlyViewed, setRecentlyViewed] = useState(() => getRecentlyViewedDocuments(4, {}));

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewedDocuments(4));
  }, []);

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
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Kho tài liệu</h2>
          <p className="text-muted text-sm mt-1 font-medium">Tìm kiếm, gợi ý và truy cập nhanh tài liệu học tập mọi lúc.</p>
        </header>

                {/* Section: WELCOME PACKAGE */}
                <section className="mt-12">
           <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Welcome Package</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Computer trial",
                color: "text-primary",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M8 20h8M10 16v4m4-4v4" />
                  </svg>
                ),
                items: ["LISTENING", "READING", "WRITING T1", "WRITING T2"],
              },
              {
                label: "Registration guide",
                color: "text-info",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <path d="M14 3v6h6M8 13h8M8 17h6" />
                  </svg>
                ),
                items: ["HƯỚNG DẪN ĐĂNG KÝ THI.docx"],
              },
              {
                label: "Orientation guide",
                color: "text-secondary",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M10 14l1.5-4.5L16 8l-1.5 4.5L10 14z" />
                  </svg>
                ),
                items: ["Solidifying Stage Craft"],
              },
              {
                label: "Resource Website",
                color: "text-warning",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                  </svg>
                ),
                items: ["bestmytest.com/ielts"],
              },
            ].map((box, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-hover transition-all group">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/5 transition-colors">
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

        <section className="mt-10">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-6 w-1.5 rounded-full bg-secondary"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Đã xem gần đây</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                href={`/tai-lieu-them/xem/${item.id}`}
                className="group block rounded-2xl bg-white p-5 shadow-soft transition-all duration-300 hover:shadow-hover"
              >
                <article>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                        <span className="rounded bg-background px-1.5 py-0.5">{contentTypeLabel(item.type)}</span>
                        <span>•</span>
                        <span>{item.subject}</span>
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
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
                  <div className="mt-4 flex items-center justify-between border-t border-background pt-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Vị trí đọc: <span className="ml-1 text-foreground">{item.position}</span>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted transition-all group-hover:bg-primary group-hover:text-white">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>



        {/* Search & Filter */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-info rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Kho tài liệu</h3>
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
                    className="w-full h-11 appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-bold text-foreground shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
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
            <h3 className="text-sm font-black text-muted uppercase">Tài liệu gợi ý</h3>
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
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Sách tặng thêm</h3>
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
