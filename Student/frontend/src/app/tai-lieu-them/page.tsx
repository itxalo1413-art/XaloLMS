"use client";

import { StudentLayout } from "@/app/StudentLayout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  contentTypeLabel,
  getRecentlyViewedDocuments,
  statusLabel,
} from "@/components/student/mockLearning";
import {
  CONTENT_CATALOG_UPDATE_EVENT,
  getPublishedCatalogDocuments,
} from "@/lib/contentCatalog";

const listSachTangThem: Array<{ title: string; url: string }> = [
  {
    title: "Tổng hợp Grammar Reference (with Exercises)",
    url: "https://drive.google.com/drive/u/3/folders/1V53diH4dcW7albn9bf2d0gBJgR2tJAoX",
  },
  {
    title: "Sách Cambridge 19",
    url: "https://drive.google.com/drive/u/3/folders/1j-Akt37UZVLH0i15LVrYJA6j-rPjeaqF",
  },
  {
    title: "Self-practice book (4 skills)",
    url: "https://drive.google.com/drive/u/3/folders/1mDI1B1rVrm8d4T3mSTvO9sZEt6xGTgex",
  },
  {
    title: "Reading (Edition 1 / Vol.1)",
    url: "https://drive.google.com/drive/u/3/folders/17rE0DqNu2GeMEngqivRyhpPTAzcvOi2b",
  },
  {
    title: "Sách Complete IELTS Band 4.0-5.0",
    url: "https://drive.google.com/drive/u/3/folders/1H1CgsTuVN4dR41a5SyRioHCMlw0bXtPg",
  },
  {
    title: "Sách Get ready for IELTS",
    url: "https://drive.google.com/drive/u/3/folders/1Z3wYTvNfC2251p4jh8-Alr4sAaw_ZOTd",
  },
  {
    title: "Sách Basic IELTS",
    url: "https://drive.google.com/drive/u/3/folders/1U46V2qD7bsHcTGy_E7c76sgChnQhdr6T",
  },
  {
    title: "Sách Cambridge Grammar for IELTS with answers",
    url: "https://drive.google.com/drive/u/3/folders/1_zrmaL0ZOsbWJv7-81psio4Izx45sUts",
  },
  {
    title: "Sách Collins Grammar for IELTS",
    url: "https://drive.google.com/drive/u/3/folders/1gBJxRUv-Se371UFKkhoSTWDig72DpSKy",
  },
  {
    title: "Sách Collins Listening for IELTS",
    url: "https://drive.google.com/drive/u/3/folders/1T3TJaQpIjQ_KehH2uxg7Gmp32cEyVKGH",
  },
  {
    title: "Sách Collins Reading for IELTS",
    url: "https://drive.google.com/drive/u/3/folders/1UIZBGJd5qbXMglSUuNyND7gNTWIG1pZj",
  },
  {
    title: "Sách Collins Vocabulary For IELTS",
    url: "https://drive.google.com/drive/u/3/folders/14LpxPklNRZ2NN9A6r0mP3JLozxcvvIse",
  },
  {
    title: "Sách Complete IELTS Band 5.0-6.5",
    url: "https://drive.google.com/drive/u/3/folders/1aRZi-lWMIoC7Kjcf4D-b0uhbOktQPv0c",
  },
  {
    title: "Sách Destination B1 & B2",
    url: "https://drive.google.com/drive/u/3/folders/17i6gD1Xt8M8xFcicLI8DkUsP3Oez5NRa",
  },
  {
    title: "Sách English Collocation in Use - Intermediate",
    url: "https://drive.google.com/drive/u/3/folders/1wjbl54fhGRiBfioqJNpw3jAX0XQm6Drk",
  },
  {
    title: "Sách English Vocabulary in Use - Upper Intermediate",
    url: "https://drive.google.com/drive/u/3/folders/10sI_9yWGnxIgMgHNlA_T5hbIwbOpGx5J",
  },
  {
    title: "Sách English Grammar in use - Intermediate",
    url: "https://drive.google.com/drive/u/3/folders/1Z_jFlkLC--qhv-rQ2mpCdApjVAumMO75",
  },
  {
    title: "Sách Essential Words for the IELTS - Barrons",
    url: "https://drive.google.com/drive/u/3/folders/162HzB9Kbb4f5NY4ZmkcV33I1WKv2awmj",
  },
  {
    title: "Inside Reading",
    url: "https://drive.google.com/drive/u/3/folders/1zgcZBArqWsryCKRFCWUEcV6cCcbvsuxE",
  },
  {
    title: "Sách Oxford Practice Grammar Intermediate",
    url: "https://drive.google.com/drive/u/3/folders/1uH2-HR6ySm5cV4tbk9MRvbjDjcvsKEWe",
  },
  {
    title: "Sách English Pronunciation in Use - Elementary",
    url: "https://drive.google.com/drive/u/3/folders/1OMSRJp8cyYju1r4MAb1ZPoyUwUYZ2WkN",
  },
  {
    title: "Sách Mindset for IELTS - Level 2",
    url: "https://drive.google.com/drive/u/3/folders/1eKiHFhoXZJqnNIyR5SOo94IJQdQfEPr8",
  },
  {
    title: "Sách Bridge to IELTS",
    url: "https://drive.google.com/drive/folders/1ahoYc3w7UC2wgteaGmYngvhdGv171If_?usp=drive_link",
  },
  {
    title: "Reading (Edition 2 / Vol.2)",
    url: "https://drive.google.com/drive/u/1/folders/11EwettkI_seDlhkmXcEYOeheIOxLl_Ol",
  },
  {
    title: "Reading (Edition 3 / Vol.3)",
    url: "https://drive.google.com/drive/u/1/folders/1nnG8woXSdD1IpGxRhsqTuvFzFzXsOKMZ",
  },
  {
    title: "Reading (Edition 4 / Vol.4)",
    url: "https://drive.google.com/drive/u/1/folders/1NxbiTc3Fbbj99LejYh2nmbZOm7X9k3b7",
  },
  {
    title: "Reading (Edition 5 / Vol.5)",
    url: "https://drive.google.com/drive/u/1/folders/1JYzJTs_RaxBiPxURrIEAFFVC6Vp1WGk2",
  },
  {
    title: "Bộ Guideline Speaking & Writing band 4.5 – 5.5+",
    url: "https://drive.google.com/drive/u/1/folders/1RL9q1JGWMK93Wr4E-r35Tgd2gE9-7rj6",
  },
  {
    title: "Writing Challenge",
    url: "https://drive.google.com/drive/u/1/folders/1oFIeaV7NpuJSPiy9NMjHXXYDCbgU-pAJ",
  },
  {
    title: "Sách English Grammar in Use - Elementary",
    url: "https://drive.google.com/drive/u/1/folders/1_MrBBKM1GjKkSOym68LqpgR5cbZjd3L3",
  },
  {
    title: "Sách Oxford Practice Grammar Basic",
    url: "https://drive.google.com/drive/u/1/folders/1syVf54tvbWC7Lie0mzPkMtcKJAS40j3Q",
  },
  {
    title: "Sách English Vocabulary in Use - Elementary and Intermediate",
    url: "https://drive.google.com/drive/u/1/folders/1QAvNXa0jG0HF8HdVcgzOO6Z2wvRPn7Va",
  },
  {
    title: "Sách Essential Reading for IELTS",
    url: "https://drive.google.com/drive/u/1/folders/1vVy6p9u4NKtMsZEzx8UxbGUX7a4gkOLZ",
  },
  {
    title: "Sách Listening Practice Through Dictation",
    url: "https://drive.google.com/drive/u/1/folders/1XEenTBEEMacbF17_kQOtVl9PM0wqc6hP",
  },
  {
    title: "Sách Mindset for IELTS - Level 1",
    url: "https://drive.google.com/drive/u/1/folders/1_vMmDEtTO5RaLhv5Kxnmhr1B-Jo_rG4y",
  },
  {
    title: "Sách Mindset for IELTS - Foundation",
    url: "https://drive.google.com/drive/u/1/folders/1AbGqhEwzqZYx1smXOhOYx43imZOPqY9d",
  },
  {
    title: "Sách Tactics for Listening",
    url: "https://drive.google.com/drive/u/1/folders/1zP7fJkEleaOv-snydOl8Lts2SAA66_a7",
  },
  {
    title: "Sách Complete IELTS Band 6.5–7.5",
    url: "https://drive.google.com/drive/folders/1tjO2mCP_KKfn45Tj4PZN1RzwXkYwCRxf?usp=sharing",
  },
  {
    title: "Sách Destination C1 & C2",
    url: "https://drive.google.com/drive/u/1/folders/1-baJfJ5e7lZQt0XpVnmP0cWqkS6vJGLN",
  },
  {
    title: "Sách English Collocations in Use - Advanced",
    url: "https://drive.google.com/drive/u/1/folders/1HWMdssS6PQc15TewXO9RKTNdfjoqf-jo",
  },
  {
    title: "Sách English Grammar in use - Advanced",
    url: "https://drive.google.com/drive/u/1/folders/15JgmciSAbXbRFaOajrIClX50NHKI3kqU",
  },
  {
    title: "Sách English Pronunciation in Use - Advanced",
    url: "https://drive.google.com/drive/u/1/folders/1xF-ZAJOSd2o-NoL7tkGXxodT8hyHMfyr",
  },
  {
    title: "Sách English Vocabulary in Use - Advanced",
    url: "https://drive.google.com/drive/u/1/folders/1yB4KOkVijg2JNQI2Gh0gkQAh_1IgGUDF",
  },
  {
    title: "Sách IELTS Advantage Skills",
    url: "https://drive.google.com/drive/u/1/folders/1gIBl3sdjs7wLyyNiDpuSigRcvuBoZrIV",
  },
  {
    title: "Sách Improve your Writing skill - 6.0-7.5",
    url: "https://drive.google.com/drive/u/3/folders/1jtspgB9_uku8buk05wPB34Jqz1SqsAfb",
  },
  {
    title: "Sách Mindset for IELTS - Level 3",
    url: "https://drive.google.com/drive/u/1/folders/1j-rqnFudqYvsdzTT1XVx-E8YzoQv2j3x",
  },
  {
    title: "Sách Oxford Practice Grammar Advanced",
    url: "https://drive.google.com/drive/u/1/folders/1eBxM7w5_OvZiZy2vV2Q9AsrpywewWQrM",
  },
];

export default function TaiLieuThemPage() {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [catalogDocs, setCatalogDocs] = useState(() => getPublishedCatalogDocuments());

  const [recentlyViewed, setRecentlyViewed] = useState(() => getRecentlyViewedDocuments(4, {}));

  useEffect(() => {
    const sync = () => setCatalogDocs(getPublishedCatalogDocuments());
    sync();
    setRecentlyViewed(getRecentlyViewedDocuments(4));
    window.addEventListener(CONTENT_CATALOG_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONTENT_CATALOG_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const suggestedDocuments = useMemo(() => {
    return catalogDocs.slice(0, 3);
  }, [catalogDocs]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = catalogDocs.filter((doc) => {
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
  }, [catalogDocs, query, subjectFilter, typeFilter, sortBy]);

  const quickResults = useMemo(() => {
    if (!query.trim()) return [];
    return filteredDocuments.slice(0, 4);
  }, [query, filteredDocuments]);

  const filteredSachTangThem = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return listSachTangThem;
    return listSachTangThem.filter((item) =>
      item.title.toLowerCase().includes(normalized),
    );
  }, [query]);

  const subjects = Array.from(new Set(catalogDocs.map((doc) => doc.subject)));

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
                label: "Computer based trial",
                badgeText: "4 bài thi thử",
                borderClass: "border-indigo-100 hover:border-indigo-300",
                badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
                iconBg: "bg-indigo-50 text-indigo-600",
                desc: "Đề thi thử máy tính mô phỏng kỳ thi chính thức qua hệ thống Inspera",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M8 20h8M10 16v4m4-4v4" />
                  </svg>
                ),
                items: [
                  {
                    title: "LISTENING",
                    subtitle: "Demo Inspera Player",
                    url: "https://demo-ielts.inspera.com/player/?assessmentRunId=131012334&context=exam#/section/128121996/question/128121965/scorableItem/1",
                  },
                  {
                    title: "READING",
                    subtitle: "Demo Inspera Player",
                    url: "https://demo-ielts.inspera.com/player/?assessmentRunId=131013388&context=exam#/section/128121930/question/128121896/scorableItem/1",
                  },
                  {
                    title: "WRITING (TASK 1)",
                    subtitle: "Exam Inspera Player",
                    url: "https://ielts.inspera.com/player/?assessmentRunId=189733708&context=exam#/section/166780572/question/145425559/scorableItem/1",
                  },
                  {
                    title: "WRITING (TASK 2)",
                    subtitle: "Exam Inspera Player",
                    url: "https://ielts.inspera.com/player/?assessmentRunId=189733579&context=exam#/section/145423437/question/145422735/scorableItem/1",
                  },
                ],
              },
              {
                label: "REGISTRATION guide",
                badgeText: "Google Docs",
                borderClass: "border-emerald-100 hover:border-emerald-300",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                iconBg: "bg-emerald-50 text-emerald-600",
                desc: "Hướng dẫn chi tiết từng bước đăng ký thi IELTS tại IDP & British Council",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <path d="M14 3v6h6M8 13h8M8 17h6" />
                  </svg>
                ),
                items: [
                  {
                    title: "HƯỚNG DẪN ĐĂNG KÝ THI IELTS Ở IDP VÀ BRITISH COUNCIL.docx",
                    subtitle: "Mở tài liệu Google Docs",
                    url: "https://docs.google.com/document/d/1TjpPcFVRi4yKOF0EqRqQMipkkCm_vGap/edit#heading=h.mql4quhnwgn5",
                  },
                ],
              },
              {
                label: "ORientation GUIDE",
                badgeText: "Craft Page",
                borderClass: "border-amber-100 hover:border-amber-300",
                badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60",
                iconBg: "bg-amber-50 text-amber-600",
                desc: "Tài liệu định hướng và phương pháp học lộ trình Solidifying Stage",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M10 14l1.5-4.5L16 8l-1.5 4.5L10 14z" />
                  </svg>
                ),
                items: [
                  {
                    title: "https://xle.craft.me/SolidifyingStage",
                    subtitle: "Solidifying Stage Craft Guide",
                    url: "https://xle.craft.me/SolidifyingStage",
                  },
                ],
              },
              {
                label: "STUDY RESOURCE WEBSITE",
                badgeText: "Web Practice",
                borderClass: "border-sky-100 hover:border-sky-300",
                badgeClass: "bg-sky-50 text-sky-700 border-sky-200/60",
                iconBg: "bg-sky-50 text-sky-600",
                desc: "Kho đề thi thử IELTS Full Test & bài luyện tập trực tuyến miễn phí",
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                  </svg>
                ),
                items: [
                  {
                    title: "https://www.bestmytest.com/ielts/practice-test",
                    subtitle: "BestMyTest IELTS Practice Test",
                    url: "https://www.bestmytest.com/ielts/practice-test",
                  },
                ],
              },
            ].map((box, i) => (
              <div
                key={i}
                className={`bg-white p-6 rounded-2xl shadow-soft hover:shadow-hover border ${box.borderClass} transition-all group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${box.iconBg} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                      {box.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${box.badgeClass}`}>
                      {box.badgeText}
                    </span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-foreground mb-1">
                    {box.label}
                  </div>
                  <p className="text-[11px] text-muted font-medium mb-4 leading-relaxed">
                    {box.desc}
                  </p>
                </div>

                <div className="space-y-2 mt-auto">
                  {box.items.map((it, j) => (
                    <a
                      key={j}
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/item flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-primary/40 hover:shadow-xs transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground group-hover/item:text-primary transition-colors truncate">
                          {it.title}
                        </div>
                        {it.subtitle ? (
                          <div className="text-[10px] text-muted font-medium truncate mt-0.5">
                            {it.subtitle}
                          </div>
                        ) : null}
                      </div>
                      <svg
                        className="w-4 h-4 text-muted/50 group-hover/item:text-primary shrink-0 transition-transform group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  ))}
                </div>
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

        {/* List: Sách tặng thêm */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted">
                Sách tặng thêm ({filteredSachTangThem.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-muted/60 hidden sm:inline">
              Nhấp vào sách để mở thư mục Google Drive
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSachTangThem.map((item, index) => (
              <a
                key={item.url || index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Mở Drive: ${item.title}`}
                className="bg-white rounded-2xl shadow-soft p-4 flex items-center justify-between gap-3 hover:bg-zinc-50 hover:shadow-md hover:border-primary/30 border border-transparent transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-[10px] font-black text-muted group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <span className="text-xs font-bold text-muted leading-snug group-hover:text-foreground line-clamp-2">
                    {item.title}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-muted/40 group-hover:text-primary shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </section>

      </div>
    </StudentLayout>
  );
}
