"use client";

import { useEffect, useState } from "react";
import {
  getPortalProfile,
  PORTAL_PROFILE_UPDATE_EVENT,
  savePortalProfile,
  type PortalProfile,
  type PortalRole,
} from "@/lib/portalProfile";

type Props = {
  role: PortalRole;
  heading: string;
};

export function PortalProfileSection({ role, heading }: Props) {
  const [form, setForm] = useState<PortalProfile>(() => getPortalProfile(role));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setForm(getPortalProfile(role));
    sync();
    window.addEventListener(PORTAL_PROFILE_UPDATE_EVENT, sync);
    return () => window.removeEventListener(PORTAL_PROFILE_UPDATE_EVENT, sync);
  }, [role]);

  const save = () => {
    savePortalProfile(role, form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg space-y-6">
      <p className="text-sm text-muted">{heading}</p>
      <div className="space-y-4 rounded-2xl border border-primary/10 bg-white p-6 shadow-soft">
        {(
          [
            ["name", "Họ và tên"],
            ["title", "Chức danh"],
            ["email", "Email"],
            ["phone", "Số điện thoại"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
            <input
              type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm font-semibold"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
      >
        {saved ? "Đã lưu ✓" : "Lưu hồ sơ"}
      </button>
    </div>
  );
}
