import {
  accessBySubject,
  dashboardKpis,
  newContentWeek,
  popularDocuments,
  usageTrendLabels,
  usageTrendValues,
} from "./mockData";

const fmt = (n: number) => n.toLocaleString("vi-VN");

export function DashboardHome() {
  const maxTrend = Math.max(...usageTrendValues, 1);
  const maxPop = Math.max(...popularDocuments.map((d) => d.views), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Tổng tài liệu", v: fmt(dashboardKpis.totalDocuments), tint: "text-[#6a5acd]" },
          { k: "Người dùng", v: fmt(dashboardKpis.totalUsers), tint: "text-zinc-900" },
          { k: "Lượt xem tuần", v: fmt(dashboardKpis.docViewsWeek), tint: "text-[#0369a1]" },
          { k: "TB phiên (phút)", v: dashboardKpis.avgSessionMin.toFixed(1), tint: "text-[#fe7794]" },
        ].map((card) => (
          <div
            key={card.k}
            className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase   text-zinc-500">
              {card.k}
            </div>
            <div className={`mt-2 text-2xl font-black ${card.tint}`}>{card.v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900">Tài liệu được xem nhiều</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Theo tuần (demo).</p>
          <ul className="mt-4 space-y-3">
            {popularDocuments.map((d) => (
              <li key={d.id}>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                  <span className="min-w-0 truncate text-zinc-800">{d.title}</span>
                  <span className="shrink-0 text-zinc-500">{fmt(d.views)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[#6a5acd]"
                    style={{ width: `${(d.views / maxPop) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900">Truy cập theo môn học</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Phần trăm lượt mở tài liệu (ước lượng).</p>
          <ul className="mt-5 space-y-3">
            {accessBySubject.map((row) => (
              <li key={row.subject}>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                  <span>{row.subject}</span>
                  <span>{row.pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[#fe7794]"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-zinc-900">Xu hướng sử dụng</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Lượt truy cập theo ngày (demo).</p>
          <div className="mt-8 flex h-44 items-end justify-between gap-2 border-b border-zinc-100 pb-0">
            {usageTrendLabels.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[#6a5acd]/90 to-[#6a5acd]/40 transition-all hover:opacity-90"
                  style={{
                    height: `${(usageTrendValues[i]! / maxTrend) * 100}%`,
                    minHeight: "8px",
                  }}
                  title={`${usageTrendValues[i]}k`}
                />
                <span className="text-[10px] font-bold text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900">Nội dung mới</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Vừa thêm vào kho.</p>
          <ul className="mt-4 space-y-3">
            {newContentWeek.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3"
              >
                <div className="text-xs font-bold text-zinc-900">{n.title}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{n.category}</span>
                  <span>{n.when}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
