"use client";

import { useState } from "react";
import { TeacherLayout } from "@/components/teacher/TeacherLayout";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { PortalProfileSection } from "@/components/shared/PortalProfileSection";
import { TeacherStatsCard } from "@/components/teacher/TeacherStatsCard";
import { TeacherPublicInfoEditor } from "@/components/teacher/TeacherPublicInfoEditor";

export default function TeacherProfilePage() {
  const [activeTab, setActiveTab] = useState<"account" | "public">("public");

  return (
    <TeacherLayout>
      <TeacherTopbar
        title="Hồ sơ & Thông tin Giáo viên"
        subtitle="Quản lý tài khoản cá nhân và thông tin hiển thị cho học viên."
      />
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16 md:px-8 space-y-6">

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("public")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === "public"
                ? "bg-primary text-white shadow-md"
                : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Thông tin hiển thị cho Học viên
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
              activeTab === "account"
                ? "bg-primary text-white shadow-md"
                : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-foreground"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tài khoản cá nhân
          </button>
        </div>

        {/* Tab 1: Public Teacher Profile Editor */}
        {activeTab === "public" && <TeacherPublicInfoEditor />}

        {/* Tab 2: Account Settings */}
        {activeTab === "account" && (
          <div className="grid gap-8 md:grid-cols-12 items-start">
            <div className="md:col-span-7">
              <PortalProfileSection
                role="gv"
                heading="Cập nhật thông tin tài khoản hiển thị trên portal Giáo viên."
              />
            </div>
            <div className="md:col-span-5">
              <TeacherStatsCard />
            </div>
          </div>
        )}
      </main>
    </TeacherLayout>
  );
}
