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
    return <AdminShell pathname={pathname}>{children}</AdminShell>;
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="mx-auto flex min-h-dvh w-full max-w-[84rem] flex-col px-3 sm:px-4 lg:px-5">
        <SiteHeader pathname={pathname} />
        <main className="flex-1 px-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-2 sm:pb-12 sm:pt-5 lg:pt-6">
          {children}
        </main>
        <MobileBottomNav pathname={pathname} />
      </div>
    </div>
  );
}
