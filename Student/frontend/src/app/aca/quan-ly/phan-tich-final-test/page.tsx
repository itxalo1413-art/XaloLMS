"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AcaLayout } from "@/components/aca/AcaLayout";
import { AcaTopbar } from "@/components/aca/AcaTopbar";
import {
  fetchAcaStudents,
  fetchAcaClasses,
  fetchAca11Classes,
  type AcaStudent,
  type AcaClass,
  type Aca11Class,
} from "@/lib/acaManagementApi";

// ─── Helpers ────────────────────────────────────────────────────────────────

type ClassCategory = "F/C" | "M/U" | "A/S" | "1:1" | "Khác";

/**
 * Determine category from classCode prefix:
 *  F* (Foundation) or C* → F/C
 *  M* (Maintenance) or U* (Upstream) → M/U
 *  A* (Advanced) or S* (Soar) → A/S
 */
function getCategoryFromCode(classCode: string): ClassCategory {
  const p = (classCode || "").split("-")[0].trim().toUpperCase();
  if (p.startsWith("F") || p.startsWith("C")) return "F/C";
  if (p.startsWith("M") || p.startsWith("U")) return "M/U";
  if (p.startsWith("A") || p.startsWith("S")) return "A/S";
  return "Khác";
}

function parseScore(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s || s === "-") return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Min passing overall for each category */
const PASS_THRESHOLD: Record<string, number> = {
  "F/C": 4.5,
  "M/U": 6.0,
  "A/S": 7.0,
};

interface CategoryStats {
  category: ClassCategory;
  total: number;
  tested: number;
  notTested: number;
  passed: number;
  failedButTested: number;
  passRate: number | null; // null → not applicable (1:1)
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PhanTichFinalTestPage() {
  const [students, setStudents] = useState<AcaStudent[]>([]);
  const [classes, setClasses] = useState<AcaClass[]>([]);
  const [classes11, setClasses11] = useState<Aca11Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | "all">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stList, clList, cl11List] = await Promise.all([
        fetchAcaStudents(),
        fetchAcaClasses(),
        fetchAca11Classes(),
      ]);
      setStudents(stList);
      setClasses(clList);
      setClasses11(cl11List);
    } catch (err: any) {
      setError(err.message || "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Available years from class openDate + classes11 startDate ────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    classes.forEach((c) => {
      if (c.openDate) {
        const parts = c.openDate.split("/");
        if (parts.length === 3) {
          const y = parseInt(parts[2], 10);
          if (!isNaN(y)) yrs.add(y);
        }
      }
    });
    // Also include years from 1:1 classes (using startDate in dd/mm/yyyy format)
    classes11.forEach((c) => {
      if (c.startDate) {
        const parts = c.startDate.split("/");
        if (parts.length === 3) {
          const y = parseInt(parts[2], 10);
          if (!isNaN(y)) yrs.add(y);
        }
      }
    });
    const cur = new Date().getFullYear();
    yrs.add(cur);
    return Array.from(yrs).sort((a, b) => a - b);
  }, [classes, classes11]);

  // ── Build a lookup: classId → AcaClass ────────────────────────────────
  const classById = useMemo(() => {
    const m = new Map<string, AcaClass>();
    classes.forEach((c) => m.set(c.id, c));
    return m;
  }, [classes]);

  // ── Filter classes by year ─────────────────────────────────────────────
  const filteredClassIds = useMemo(() => {
    if (filterYear === "all") return new Set(classes.map((c) => c.id));
    const ids = new Set<string>();
    classes.forEach((c) => {
      if (c.openDate) {
        const parts = c.openDate.split("/");
        if (parts.length === 3 && parseInt(parts[2], 10) === filterYear) {
          ids.add(c.id);
        }
      }
    });
    return ids;
  }, [classes, filterYear]);

  // ── Detailed student rows for drilldown table ──────────────────────────
  interface StudentRow {
    name: string;
    email: string;
    classCode: string;
    category: ClassCategory;
    finalOverall: number | null;
    passed: boolean | null; // null = 1:1 (not graded)
    cycleLabel?: string; // e.g. "Chặng 1", "Chặng 2"
  }

  /**
   * Emit 1 row per cycle (chặng) per student.
   *
   * Priority:
   *  1. If student has cycles[] → use each cycle's classCode + finalScores/finalScore.
   *  2. Otherwise fall back to legacy l1/l2/l3 + f1/f2/f3 fields.
   *
   * Year filter applies to the AcaClass that matches the cycle's classCode.
   */
  const studentRows = useMemo((): StudentRow[] => {
    const rows: StudentRow[] = [];

    // Build a lookup: classCode (normalized, upper) → AcaClass
    const classByCode = new Map<string, AcaClass>();
    classes.forEach((c) => {
      if (c.classCode) classByCode.set(c.classCode.toUpperCase(), c);
    });

    const pushCycleRow = (
      st: AcaStudent,
      cycleClassCode: string,
      finalScoresO: string | number | undefined,
      finalScoreStr: string | undefined,
      cycleLabel: string
    ) => {
      const code = cycleClassCode.toUpperCase();
      const cls = classByCode.get(code);

      // Year filter: skip if the class year doesn't match
      if (filterYear !== "all") {
        if (!cls || !cls.openDate) return; // no date info → skip when filtering
        const parts = cls.openDate.split("/");
        if (parts.length === 3) {
          const y = parseInt(parts[2], 10);
          if (isNaN(y) || y !== filterYear) return;
        }
      }

      const category = getCategoryFromCode(cycleClassCode);

      // Prefer detailed finalScores.o, fall back to simple finalScore string
      const finalO =
        parseScore(finalScoresO) ??
        parseScore(finalScoreStr);

      const threshold = PASS_THRESHOLD[category] ?? null;
      const passed =
        finalO !== null && threshold !== null ? finalO >= threshold : null;

      rows.push({
        name: st.name,
        email: st.email,
        classCode: cycleClassCode,
        category,
        finalOverall: finalO,
        passed,
        cycleLabel,
      });
    };

    students.forEach((st) => {
      if (st.cycles && st.cycles.length > 0) {
        // ── Use cycles[] (preferred, supports multiple chặng per lớp) ──
        st.cycles.forEach((cyc, idx) => {
          if (!cyc.classCode) return;
          pushCycleRow(
            st,
            cyc.classCode,
            cyc.finalScores?.o,
            cyc.finalScore,
            `Chặng ${idx + 1}`
          );
        });
      } else {
        // ── Fallback to legacy l1/f1, l2/f2, l3/f3 fields ──
        const legacySlots: Array<{ l?: string; f?: string; label: string }> = [
          { l: st.l1, f: st.f1, label: "Chặng 1 (L1)" },
          { l: st.l2, f: st.f2, label: "Chặng 2 (L2)" },
          { l: st.l3, f: st.f3, label: "Chặng 3 (L3)" },
        ];
        legacySlots.forEach(({ l, f, label }) => {
          if (!l || l === "-") return;
          pushCycleRow(st, l, undefined, f, label);
        });

        // If no l1/l2 either, fall back to classId-based entry (original behaviour)
        if ((!st.l1 || st.l1 === "-") && (!st.l2 || st.l2 === "-") && (!st.l3 || st.l3 === "-")) {
          if (!filteredClassIds.has(st.classId)) return;
          const cls = classById.get(st.classId);
          const classCode = cls?.classCode || "";
          const category = getCategoryFromCode(classCode);
          const finalO = parseScore(st.finalScores?.o);
          const threshold = PASS_THRESHOLD[category] ?? null;
          const passed =
            finalO !== null && threshold !== null ? finalO >= threshold : null;
          rows.push({
            name: st.name,
            email: st.email,
            classCode,
            category,
            finalOverall: finalO,
            passed,
          });
        }
      }
    });

    // 1:1 students (from Aca11Classes) – count each class as 1 student entry
    classes11.forEach((cl) => {
      // Apply year filter using startDate (dd/mm/yyyy)
      if (filterYear !== "all" && cl.startDate) {
        const parts = cl.startDate.split("/");
        if (parts.length === 3) {
          const y = parseInt(parts[2], 10);
          if (!isNaN(y) && y !== filterYear) return;
        }
      }
      rows.push({
        name: cl.className,
        email: "",
        classCode: cl.className,
        category: "1:1",
        finalOverall: parseScore(cl.finalScores?.o),
        passed: null,
      });
    });

    return rows;
  }, [students, classes11, classById, filteredClassIds, classes, filterYear]);

  // ── Aggregate stats by category ───────────────────────────────────────
  const stats = useMemo((): CategoryStats[] => {
    const categories: ClassCategory[] = ["F/C", "M/U", "A/S", "1:1"];
    return categories.map((cat) => {
      const group = studentRows.filter((r) => r.category === cat);
      const total = group.length;
      const tested = group.filter((r) => r.finalOverall !== null).length;
      const notTested = total - tested;

      if (cat === "1:1") {
        return {
          category: cat,
          total,
          tested,
          notTested,
          passed: 0,
          failedButTested: 0,
          passRate: null,
        };
      }

      const passed = group.filter((r) => r.passed === true).length;
      const failedButTested = group.filter(
        (r) => r.finalOverall !== null && r.passed === false
      ).length;
      const passRate = tested > 0 ? (passed / tested) * 100 : null;

      return { category: cat, total, tested, notTested, passed, failedButTested, passRate };
    });
  }, [studentRows]);

  // ── Totals row ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const gradedCats = stats.filter((s) => s.category !== "1:1");
    const total = stats.reduce((a, s) => a + s.total, 0);
    const tested = stats.reduce((a, s) => a + s.tested, 0);
    const notTested = stats.reduce((a, s) => a + s.notTested, 0);
    const passed = gradedCats.reduce((a, s) => a + s.passed, 0);
    const failedButTested = gradedCats.reduce((a, s) => a + s.failedButTested, 0);
    const testedGraded = gradedCats.reduce((a, s) => a + s.tested, 0);
    const passRate = testedGraded > 0 ? (passed / testedGraded) * 100 : null;
    return { total, tested, notTested, passed, failedButTested, passRate };
  }, [stats]);

  // ── Category colors ───────────────────────────────────────────────────
  const catStyle: Record<ClassCategory, { bg: string; text: string; dot: string }> = {
    "F/C": { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
    "M/U": { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500" },
    "A/S": { bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-500" },
    "1:1": { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
    "Khác": { bg: "bg-zinc-50", text: "text-zinc-600", dot: "bg-zinc-400" },
  };

  // ── Drilldown ─────────────────────────────────────────────────────────
  const [drillCategory, setDrillCategory] = useState<ClassCategory | null>(null);
  const [drillFilter, setDrillFilter] = useState<"all" | "tested" | "notTested" | "passed" | "failed">("all");

  const drillRows = useMemo(() => {
    if (!drillCategory) return [];
    return studentRows
      .filter((r) => r.category === drillCategory)
      .filter((r) => {
        if (drillFilter === "tested") return r.finalOverall !== null;
        if (drillFilter === "notTested") return r.finalOverall === null;
        if (drillFilter === "passed") return r.passed === true;
        if (drillFilter === "failed") return r.finalOverall !== null && r.passed === false;
        return true;
      })
      .sort((a, b) => (b.finalOverall ?? -1) - (a.finalOverall ?? -1));
  }, [studentRows, drillCategory, drillFilter]);

  return (
    <AcaLayout>
      <AcaTopbar title="Phân tích Final Test" subtitle="Kết quả theo phân loại lớp" />
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* ── Header & Year Filter ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">
              Phân tích kết quả theo phân loại lớp
            </h1>
            <p className="mt-1 text-xs text-muted font-semibold">
              Chuẩn điểm đạt:&nbsp;
              <span className="font-black text-emerald-700">F/C ≥ 4.5</span>
              &nbsp;·&nbsp;
              <span className="font-black text-blue-700">M/U ≥ 6.0</span>
              &nbsp;·&nbsp;
              <span className="font-black text-purple-700">A/S ≥ 7.0</span>
              &nbsp;·&nbsp;
              <span className="font-black text-amber-700">1:1 không xét điểm final</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Năm</label>
            <select
              value={filterYear}
              onChange={(e) =>
                setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="h-9 rounded-xl border border-zinc-200 px-3 text-sm font-bold text-foreground outline-none focus:border-primary/50 bg-white"
            >
              <option value="all">Tất cả</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void loadData()}
              className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all"
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-muted">
            Đang tải dữ liệu…
          </div>
        ) : (
          <>
            {/* ── Summary Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => {
                const st = catStyle[s.category];
                const rate =
                  s.passRate !== null ? `${s.passRate.toFixed(1)}%` : "—";
                return (
                  <button
                    key={s.category}
                    type="button"
                    onClick={() => {
                      setDrillCategory(drillCategory === s.category ? null : s.category);
                      setDrillFilter("all");
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
                      drillCategory === s.category
                        ? "border-primary shadow-premium"
                        : "border-zinc-100 bg-white hover:border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <span className={`text-xs font-black uppercase tracking-widest ${st.text}`}>
                        {s.category}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-foreground tabular-nums">
                      {s.total}
                      <span className="ml-1 text-xs font-semibold text-muted">HS</span>
                    </div>
                    <div className="mt-2 space-y-0.5 text-[11px] font-semibold text-zinc-500">
                      <div>Đã thi: <span className="font-black text-foreground">{s.tested}</span></div>
                      <div>Chưa thi: <span className="font-black text-zinc-400">{s.notTested}</span></div>
                      {s.category !== "1:1" && (
                        <div>
                          Tỷ lệ đạt:{" "}
                          <span className={`font-black ${s.passRate !== null && s.passRate >= 60 ? "text-emerald-600" : "text-red-500"}`}>
                            {rate}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Main Table ──────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-soft">
              {/* Title bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                  Bảng tổng hợp kết quả Final Test
                </h2>
                <span className="text-[11px] font-bold text-muted px-2 py-0.5 bg-zinc-100 rounded-full">
                  {filterYear === "all" ? "Tất cả năm" : `Năm ${filterYear}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-5 py-3">Phân loại</th>
                      <th className="px-5 py-3 text-center">Tổng số HS</th>
                      <th className="px-5 py-3 text-center">Đã thi</th>
                      <th className="px-5 py-3 text-center">Chưa thi</th>
                      <th className="px-5 py-3 text-center">Đạt chuẩn</th>
                      <th className="px-5 py-3 text-center">Thi nhưng không đạt</th>
                      <th className="px-5 py-3 text-center">Tỷ lệ đạt (trên số đã thi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => {
                      const st = catStyle[s.category];
                      const rate =
                        s.passRate !== null ? `${s.passRate.toFixed(1)}%` : "Không xét";
                      const isGood = s.passRate !== null && s.passRate >= 60;
                      return (
                        <tr
                          key={s.category}
                          className="border-b border-zinc-50 hover:bg-zinc-50/60 cursor-pointer transition-colors"
                          onClick={() => {
                            setDrillCategory(drillCategory === s.category ? null : s.category);
                            setDrillFilter("all");
                          }}
                        >
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {s.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-black text-foreground tabular-nums">
                            {s.total}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold tabular-nums text-zinc-700">
                            {s.tested}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold tabular-nums text-zinc-400">
                            {s.notTested}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {s.category === "1:1" ? (
                              <span className="text-[11px] font-bold text-amber-600">Không xét</span>
                            ) : (
                              <span className="font-black text-emerald-700 tabular-nums">{s.passed}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {s.category === "1:1" ? (
                              <span className="text-[11px] font-bold text-amber-600">Không xét</span>
                            ) : (
                              <span className="font-black text-red-500 tabular-nums">{s.failedButTested}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {s.category === "1:1" ? (
                              <span className="text-[11px] font-bold text-amber-600">Không xét</span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                                isGood
                                  ? "bg-emerald-50 text-emerald-700"
                                  : s.passRate !== null
                                  ? "bg-red-50 text-red-600"
                                  : "bg-zinc-100 text-zinc-500"
                              }`}>
                                {rate}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Totals row */}
                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                      <td className="px-5 py-4">
                        <span className="text-xs font-black uppercase tracking-wider text-primary">
                          TỔNG CỘNG
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-black text-foreground text-sm tabular-nums">
                        {totals.total}
                      </td>
                      <td className="px-5 py-4 text-center font-black text-zinc-700 tabular-nums">
                        {totals.tested}
                      </td>
                      <td className="px-5 py-4 text-center font-black text-zinc-400 tabular-nums">
                        {totals.notTested}
                      </td>
                      <td className="px-5 py-4 text-center font-black text-emerald-700 tabular-nums">
                        {totals.passed}
                      </td>
                      <td className="px-5 py-4 text-center font-black text-red-500 tabular-nums">
                        {totals.failedButTested}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                          totals.passRate !== null && totals.passRate >= 60
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {totals.passRate !== null ? `${totals.passRate.toFixed(1)}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Progress bars visual ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats
                .filter((s) => s.category !== "1:1" && s.tested > 0)
                .map((s) => {
                  const st = catStyle[s.category];
                  const pct = s.passRate ?? 0;
                  return (
                    <div key={s.category} className="rounded-2xl bg-white border border-zinc-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-black uppercase ${st.text}`}>{s.category}</span>
                        <span className={`text-sm font-black tabular-nums ${pct >= 60 ? "text-emerald-700" : "text-red-500"}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${st.dot}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] font-bold text-muted">
                        <span>Đạt: {s.passed}</span>
                        <span>Không đạt: {s.failedButTested}</span>
                        <span>Chưa thi: {s.notTested}</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* ── Drilldown table ──────────────────────────────────────── */}
            {drillCategory && (
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-soft animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${catStyle[drillCategory].dot}`}
                    />
                    <h3 className="text-sm font-black text-foreground">
                      Chi tiết học viên —{" "}
                      <span className={catStyle[drillCategory].text}>{drillCategory}</span>
                    </h3>
                    <span className="text-xs font-bold text-muted bg-zinc-100 px-2 py-0.5 rounded-full">
                      {drillRows.length} học viên
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "tested", "notTested", "passed", "failed"] as const).map((f) => {
                      if (drillCategory === "1:1" && (f === "passed" || f === "failed")) return null;
                      const labels: Record<string, string> = {
                        all: "Tất cả",
                        tested: "Đã thi",
                        notTested: "Chưa thi",
                        passed: "Đạt",
                        failed: "Không đạt",
                      };
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setDrillFilter(f)}
                          className={`rounded-xl px-3 py-1 text-[11px] font-bold transition-all ${
                            drillFilter === f
                              ? "bg-primary text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {labels[f]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-muted">
                        <th className="px-5 py-2.5">#</th>
                        <th className="px-5 py-2.5">Tên học viên</th>
                        <th className="px-5 py-2.5">Email</th>
                        <th className="px-5 py-2.5">Mã lớp</th>
                        <th className="px-5 py-2.5 text-center">Chặng</th>
                        <th className="px-5 py-2.5 text-center">Điểm Final Overall</th>
                        {drillCategory !== "1:1" && (
                          <th className="px-5 py-2.5 text-center">Kết quả</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {drillRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                            Không có học viên nào.
                          </td>
                        </tr>
                      ) : (
                        drillRows.map((r, idx) => (
                          <tr
                            key={`${r.email}-${r.classCode}-${idx}`}
                            className="border-b border-zinc-50 hover:bg-zinc-50/60 text-xs font-semibold"
                          >
                            <td className="px-5 py-2.5 tabular-nums text-muted">{idx + 1}</td>
                            <td className="px-5 py-2.5 font-bold text-foreground">{r.name}</td>
                            <td className="px-5 py-2.5 text-zinc-500">{r.email || "—"}</td>
                            <td className="px-5 py-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${catStyle[r.category].bg} ${catStyle[r.category].text}`}>
                                {r.classCode || "—"}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-center">
                              {r.cycleLabel ? (
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{r.cycleLabel}</span>
                              ) : <span className="text-zinc-400">—</span>}
                            </td>
                            <td className="px-5 py-2.5 text-center">
                              {r.finalOverall !== null ? (
                                <span className="font-black text-foreground tabular-nums">
                                  {r.finalOverall.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-zinc-400 italic text-[10px]">Chưa thi</span>
                              )}
                            </td>
                            {drillCategory !== "1:1" && (
                              <td className="px-5 py-2.5 text-center">
                                {r.passed === true ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                                    ✓ Đạt
                                  </span>
                                ) : r.passed === false ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black">
                                    ✗ Không đạt
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 italic text-[10px]">—</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </AcaLayout>
  );
}
