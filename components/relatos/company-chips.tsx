import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { ReportCompanyOption } from "@/lib/supabase/relatos";
import { cn } from "@/lib/utils";

type CompanyChipsProps = {
  companies: ReportCompanyOption[];
  label?: string;
  selectedCompanyId?: string | null;
  targetPath: string;
};

export function CompanyChips({
  companies,
  label = "Empresa",
  selectedCompanyId,
  targetPath,
}: CompanyChipsProps) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={targetPath}
          className={cn(
            buttonVariants({ variant: selectedCompanyId ? "outline" : "default", size: "sm" }),
          )}
        >
          Todas
        </Link>
        {companies.map((company) => {
          const active = company.id === selectedCompanyId;

          return (
            <Link
              key={company.id}
              href={`${targetPath}?company_id=${company.id}`}
              className={cn(
                buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
              )}
            >
              {company.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
