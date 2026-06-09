import Link from "next/link";
import {
  isWeakBcbQuestion,
  WEAK_BCB_ERROR_RATE_THRESHOLD,
  type BcbQuestionTypeRow,
} from "@/lib/guestBcbDiagnosis";

type Props = {
  rows: BcbQuestionTypeRow[];
  /** Hiện nút đăng ký khắc phục trên các dòng yếu (guest) */
  showWeakCta?: boolean;
};

function errorRateTone(rate: number): string {
  if (rate > WEAK_BCB_ERROR_RATE_THRESHOLD) return "text-danger font-black";
  if (rate >= 40) return "text-warning font-bold";
  return "text-success font-bold";
}

export function BcbQuestionTypeTable({ rows, showWeakCta = false }: Props) {
  const weakCount = rows.filter(isWeakBcbQuestion).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Bảng chẩn đoán theo dạng bài
          </div>
          <p className="mt-1 text-xs font-medium text-muted">
            Hiển thị toàn bộ {rows.length} dạng bài · {weakCount} dạng cần ưu tiên (tỷ lệ sai &gt;{" "}
            {WEAK_BCB_ERROR_RATE_THRESHOLD}%)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
          <span className="rounded-lg bg-danger/10 px-2 py-1 text-danger">
            &gt; {WEAK_BCB_ERROR_RATE_THRESHOLD}% — ưu tiên
          </span>
          <span className="rounded-lg bg-zinc-100 px-2 py-1 text-muted">≤ {WEAK_BCB_ERROR_RATE_THRESHOLD}% — duy trì</span>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-soft md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                <th className="px-4 py-3">Dạng bài</th>
                <th className="px-4 py-3 text-center">Tỷ lệ sai</th>
                <th className="px-4 py-3">Chẩn đoán</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const weak = isWeakBcbQuestion(row);
                return (
                  <tr
                    key={row.id}
                    className={[
                      "border-b border-primary/5 align-top",
                      weak ? "bg-secondary/5" : "hover:bg-zinc-50/80",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-black uppercase ${weak ? "text-secondary" : "text-foreground"}`}
                      >
                        {row.title}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center text-sm tabular-nums ${errorRateTone(row.errorRate)}`}>
                      {row.errorRate}%
                    </td>
                    <td className="px-4 py-3 text-xs font-medium leading-relaxed text-foreground">
                      {row.diagnosis}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const weak = isWeakBcbQuestion(row);
          return (
            <div
              key={row.id}
              className={[
                "rounded-2xl border p-4",
                weak ? "border-secondary/20 bg-secondary/5" : "border-zinc-100 bg-card shadow-soft",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <h5
                  className={`text-xs font-black uppercase ${weak ? "text-secondary" : "text-foreground"}`}
                >
                  {row.title}
                </h5>
                <span className={`shrink-0 text-sm tabular-nums ${errorRateTone(row.errorRate)}`}>
                  {row.errorRate}%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium leading-relaxed text-foreground">{row.diagnosis}</p>
              {showWeakCta && weak ? (
                <Link
                  href="#tu-van"
                  className="mt-3 block rounded-xl bg-secondary py-2 text-center text-xs font-bold text-white shadow-sm"
                >
                  Đăng ký khắc phục dạng bài yếu
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>

      {showWeakCta && weakCount > 0 ? (
        <div className="hidden md:grid md:grid-cols-2 md:gap-4">
          {rows.filter(isWeakBcbQuestion).map((row) => (
            <div
              key={`cta-${row.id}`}
              className="flex flex-col justify-between rounded-2xl border border-secondary/15 bg-secondary/5 p-4"
            >
              <div>
                <h5 className="text-xs font-black uppercase text-secondary">{row.title}</h5>
                <p className="mt-1 text-xs font-semibold text-foreground">{row.diagnosis}</p>
              </div>
              <Link
                href="#tu-van"
                className="mt-3 block rounded-xl bg-secondary py-2 text-center text-xs font-bold text-white"
              >
                Đăng ký khắc phục
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
