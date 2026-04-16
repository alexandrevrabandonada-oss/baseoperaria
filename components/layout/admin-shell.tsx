import type { ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";

type AdminShellProps = {
  children: ReactNode;
  pathname: string;
};

export function AdminShell({ children, pathname }: AdminShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[84rem] flex-col px-3 sm:px-4 lg:px-5">
      <AdminHeader pathname={pathname} />
      <main className="flex-1 px-1 pb-12 pt-4 sm:px-2 sm:pt-5 lg:pt-6">{children}</main>
    </div>
  );
}
