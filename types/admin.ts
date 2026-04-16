export type AdminSectionSlug =
  | "empresas"
  | "unidades"
  | "setores"
  | "turnos"
  | "categorias"
  | "clusters";

export type AdminSectionItem = {
  description: string;
  href: string;
  label: string;
  slug: AdminSectionSlug;
};

export const adminSectionItems = [
  {
    description: "Base da empresa e escopo de organização",
    href: "/admin/empresas",
    label: "Empresas",
    slug: "empresas",
  },
  {
    description: "Unidades onde a base está organizada",
    href: "/admin/unidades",
    label: "Unidades",
    slug: "unidades",
  },
  {
    description: "Setores por empresa e unidade",
    href: "/admin/setores",
    label: "Setores",
    slug: "setores",
  },
  {
    description: "Turnos usados na leitura da base",
    href: "/admin/turnos",
    label: "Turnos",
    slug: "turnos",
  },
  {
    description: "Categorias para registrar problema e prova",
    href: "/admin/categorias",
    label: "Categorias",
    slug: "categorias",
  },
  {
    description: "Agrupamento de sinais antes da pauta",
    href: "/admin/clusters",
    label: "Clusters",
    slug: "clusters",
  },
] as const satisfies readonly AdminSectionItem[];

export function isAdminSectionSlug(value: string): value is AdminSectionSlug {
  return adminSectionItems.some((item) => item.slug === value);
}
