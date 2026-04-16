import { Button } from "@/components/ui/button";
import { saveClusterAction } from "@/app/admin/clusters/actions";
import type { ClusterCategoryOption } from "@/lib/supabase/clusters";
import { clusterStatusOptions } from "@/types/clusters";

type ClusterFormProps = {
  categories: ClusterCategoryOption[];
  cluster?: {
    categoryId: string | null;
    id: string;
    status: string;
    summary: string | null;
    title: string;
  } | null;
  companyId: string;
  companyName: string;
  returnTo: string;
  submitLabel: string;
  title: string;
  description: string;
};

function groupCategories(categories: ClusterCategoryOption[]) {
  return categories.reduce(
    (acc, category) => {
      acc[category.kind].push(category);
      return acc;
    },
    {
      conditions: [] as ClusterCategoryOption[],
      economic: [] as ClusterCategoryOption[],
    },
  );
}

export function ClusterForm({
  categories,
  cluster,
  companyId,
  companyName,
  returnTo,
  submitLabel,
  title,
  description,
}: ClusterFormProps) {
  const groupedCategories = groupCategories(categories);

  return (
    <form action={saveClusterAction} className="flex flex-col gap-4">
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="cluster_id" value={cluster?.id ?? ""} />

      <section className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Empresa selecionada
        </p>
        <h2 className="mt-1 text-base font-semibold">{companyName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Título
          <input
            type="text"
            name="title"
            required
            minLength={2}
            maxLength={120}
            defaultValue={cluster?.title ?? ""}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder={title}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={cluster?.status ?? "open"}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {clusterStatusOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Descrição
        <textarea
          name="summary"
          maxLength={240}
          rows={4}
          defaultValue={cluster?.summary ?? ""}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="Resumo curto para orientar a análise do cluster."
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium">
        Categoria
        <select
          name="category_id"
          defaultValue={cluster?.categoryId ?? ""}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Sem categoria</option>
          <optgroup label="Condições de trabalho">
            {groupedCategories.conditions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Pauta econômica">
            {groupedCategories.economic.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
