import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
      <AdminHeader />
      <main className="flex-1 px-4 pb-10 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
