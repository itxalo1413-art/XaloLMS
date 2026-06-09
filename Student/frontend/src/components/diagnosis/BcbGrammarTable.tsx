import type { BcbGrammarRow } from "@/lib/guestBcbDiagnosis";

type Props = {
  rows: BcbGrammarRow[];
  filter: "all" | "red" | "yellow";
  onFilterChange: (f: "all" | "red" | "yellow") => void;
};

const SEVERITY_LABEL = {
  red: "Cần khắc phục ngay",
  yellow: "Cần luyện thêm",
  green: "Theo dõi",
} as const;

function severityClass(severity: BcbGrammarRow["severity"]) {
  if (severity === "red") return "bg-danger/10 text-danger";
  if (severity === "yellow") return "bg-warning/10 text-warning";
  return "bg-success/10 text-success";
}

export function BcbGrammarTable({ rows, filter, onFilterChange }: Props) {
  const filtered =
    filter === "all" ? rows : rows.filter((r) => r.severity === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Bảng chẩn đoán ngữ pháp
          </div>
          <p className="mt-1 text-xs font-medium text-muted">
            Toàn bộ {rows.length} chuyên đề lỗi ngữ pháp trong bài làm
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: "Tất cả" },
              { id: "red" as const, label: "Đỏ" },
              { id: "yellow" as const, label: "Vàng" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={[
                "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                filter === f.id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 bg-background text-[10px] font-black uppercase tracking-widest text-muted">
                <th className="px-4 py-3">Chuyên đề</th>
                <th className="px-4 py-3 text-center">Số lỗi</th>
                <th className="px-4 py-3">Mức độ</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Ví dụ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-primary/5 align-top hover:bg-zinc-50/80">
                  <td className="px-4 py-3 text-xs font-bold text-foreground">{row.topic}</td>
                  <td className="px-4 py-3 text-center text-sm font-black tabular-nums text-foreground">
                    {row.errorCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold ${severityClass(row.severity)}`}
                    >
                      {SEVERITY_LABEL[row.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium leading-relaxed text-foreground">
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{row.examples ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
