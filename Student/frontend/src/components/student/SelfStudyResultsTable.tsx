"use client";

import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  title: string;
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
  getRowKey: (row: T) => string;
  /** Chia đều độ rộ cột (mặc định: true nếu không có cột nào khai báo width). */
  equalColumns?: boolean;
};

export function SelfStudyResultsTable<T>({
  title,
  columns,
  rows,
  emptyMessage,
  getRowKey,
  equalColumns: equalColumnsProp,
}: Props<T>) {
  const cell = "border-b border-primary/10 px-3 py-2.5 align-middle text-[11px]";
  const hasFixedWidths = columns.some((col) => col.width);
  const equalColumns = equalColumnsProp ?? !hasFixedWidths;
  const colPercent = `${100 / columns.length}%`;

  return (
    <div className="mt-5">
      <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">
        {title}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-card">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={equalColumns ? { width: colPercent } : undefined}
                className={equalColumns ? undefined : col.width}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`border-b border-primary/10 bg-background/60 px-3 py-2.5 align-middle text-[10px] font-black uppercase tracking-widest text-muted ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-[11px] font-medium text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowKey(row)} className="transition-colors hover:bg-background/40">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${cell} ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "warning" | "success" | "danger" | "primary" | "muted";
}) {
  const styles = {
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    primary: "bg-primary/10 text-primary",
    muted: "bg-zinc-100 text-muted",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${styles}`}>
      {label}
    </span>
  );
}

export function ExamLinkCell({ href }: { href: string | null }) {
  if (!href) return <span className="font-medium text-muted">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block max-w-full truncate font-semibold text-primary underline-offset-2 hover:underline"
    >
      Mở đề
    </a>
  );
}
