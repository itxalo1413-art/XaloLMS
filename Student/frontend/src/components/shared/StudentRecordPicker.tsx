"use client";

import { listStudentRoster } from "@/lib/studentRoster";
import { NativeSelectChevron } from "@/components/student/ui";

type Props = {
  value: string;
  onChange: (studentId: string) => void;
  label?: string;
};

export function StudentRecordPicker({ value, onChange, label = "Chọn học viên" }: Props) {
  const roster = listStudentRoster();

  return (
    <label className="block rounded-2xl border border-primary/10 bg-white p-4 shadow-soft">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      <NativeSelectChevron
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-primary/15 bg-white text-sm font-bold text-foreground shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      >
        {roster.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.group}
          </option>
        ))}
      </NativeSelectChevron>
    </label>
  );
}
