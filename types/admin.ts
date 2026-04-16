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
    description: "Cadastro base da empresa piloto",
    href: "/admin/empresas",
    label: "Empresas",
    slug: "empresas",
  },
  {
    description: "Unidades vinculadas à empresa",
    href: "/admin/unidades",
    label: "Unidades",
    slug: "unidades",
  },
  {
    description: "Setores por empresa ou unidade",
    href: "/admin/setores",
    label: "Setores",
    slug: "setores",
  },
  {
    description: "Turnos operacionais",
    href: "/admin/turnos",
    label: "Turnos",
    slug: "turnos",
  },
  {
    description: "Categorias de relatos",
    href: "/admin/categorias",
    label: "Categorias",
    slug: "categorias",
  },
  {
    description: "Agrupamentos de relatos e pautas",
    href: "/admin/clusters",
    label: "Clusters",
    slug: "clusters",
  },
] as const satisfies readonly AdminSectionItem[];

export function isAdminSectionSlug(value: string): value is AdminSectionSlug {
  return adminSectionItems.some((item) => item.slug === value);
}
