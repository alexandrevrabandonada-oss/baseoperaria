import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";

type AdminShellProps = {
  children: ReactNode;
  pathname: string;
};

export function AdminShell({ children, pathname }: AdminShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col sm:px-4">
      <AdminHeader pathname={pathname} />
      <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8">{children}</main>
    </div>
  );
}
