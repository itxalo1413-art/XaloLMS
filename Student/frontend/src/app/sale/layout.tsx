"use client";

import { SaleLayout } from "@/components/sale/SaleLayout";

export default function SaleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SaleLayout>{children}</SaleLayout>;
}
