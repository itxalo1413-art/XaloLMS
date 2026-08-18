"use client";

import { useEffect, useState } from "react";
import { NativeSelectChevron } from "@/components/student/ui";
import { fetchAcaStudents, type AcaStudent } from "@/lib/acaManagementApi";

type Props = {
  value: string;
  onChange: (studentId: string) => void;
  label?: string;
};

export function StudentRecordPicker({ value, onChange, label = "Chọn học viên" }: Props) {
  const [roster, setRoster] = useState<AcaStudent[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchAcaStudents()
      .then((rows) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const unique = rows.filter((s) => {
          const key = s.id || `${s.name}_${s.email}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setRoster(unique);
        if (!value && unique[0]?.id) onChange(unique[0].id);
      })
      .catch(() => {
        if (!cancelled) setRoster([]);
      });
    return () => {
      cancelled = true;
    };
    // Only load roster once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <label className="block rounded-2xl border border-primary/10 bg-white p-4 shadow-soft">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      <NativeSelectChevron
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-primary/15 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      >
        {roster.length === 0 ? (
          <option value="">Chưa có học viên</option>
        ) : (
          roster.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.email ? `— ${s.email}` : ""}
            </option>
          ))
        )}
      </NativeSelectChevron>
    </label>
  );
}
