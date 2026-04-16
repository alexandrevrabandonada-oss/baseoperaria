import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AdminShell } from "@/components/layout/admin-shell";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
