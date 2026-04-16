import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("..", import.meta.url));
export const migrationsDir = path.join(projectRoot, "supabase", "migrations");

export const expectedPublicTables = [
  "profiles",
  "companies",
  "company_memberships",
  "units",
  "sectors",
  "shifts",
  "report_categories",
  "reports",
  "report_attachments",
  "report_confirmations",
  "economic_reports",
  "economic_report_confirmations",
  "economic_report_attachments",
  "issue_clusters",
  "cluster_reports",
  "cluster_economic_reports",
  "demands",
  "demand_supporters",
  "nuclei",
  "nucleus_members",
  "actions",
  "moderation_events",
  "severity_levels",
  "frequency_levels",
  "contract_types",
  "salary_bands",
  "issue_types",
  "confirmation_types",
];

export const expectedBuckets = [
  { id: "report-attachments", isPrivate: true },
  { id: "economic-report-attachments", isPrivate: true },
];

export const expectedPolicies = [
  { schema: "public", table: "profiles", policy: "profiles_select_own" },
  { schema: "public", table: "profiles", policy: "profiles_insert_own" },
  { schema: "public", table: "profiles", policy: "profiles_update_own" },
  { schema: "public", table: "companies", policy: "companies_select_members" },
  { schema: "public", table: "companies", policy: "companies_insert_owner" },
  { schema: "public", table: "companies", policy: "companies_manage_admins" },
  { schema: "public", table: "companies", policy: "companies_delete_admins" },
  {
    schema: "public",
    table: "company_memberships",
    policy: "company_memberships_select_company_members",
  },
  {
    schema: "public",
    table: "company_memberships",
    policy: "company_memberships_insert_admins",
  },
  {
    schema: "public",
    table: "company_memberships",
    policy: "company_memberships_update_admins",
  },
  {
    schema: "public",
    table: "company_memberships",
    policy: "company_memberships_delete_self_or_admin",
  },
  { schema: "public", table: "severity_levels", policy: "lookup_select_authenticated" },
  { schema: "public", table: "frequency_levels", policy: "lookup_select_authenticated" },
  { schema: "public", table: "contract_types", policy: "lookup_select_authenticated" },
  { schema: "public", table: "salary_bands", policy: "lookup_select_authenticated" },
  { schema: "public", table: "issue_types", policy: "lookup_select_authenticated" },
  { schema: "public", table: "confirmation_types", policy: "lookup_select_authenticated" },
  { schema: "public", table: "units", policy: "units_select_members" },
  { schema: "public", table: "units", policy: "units_insert_admins" },
  { schema: "public", table: "units", policy: "units_manage_admins" },
  { schema: "public", table: "units", policy: "units_delete_admins" },
  { schema: "public", table: "sectors", policy: "sectors_select_members" },
  { schema: "public", table: "sectors", policy: "sectors_insert_admins" },
  { schema: "public", table: "sectors", policy: "sectors_manage_admins" },
  { schema: "public", table: "sectors", policy: "sectors_delete_admins" },
  { schema: "public", table: "shifts", policy: "shifts_select_members" },
  { schema: "public", table: "shifts", policy: "shifts_insert_admins" },
  { schema: "public", table: "shifts", policy: "shifts_manage_admins" },
  { schema: "public", table: "shifts", policy: "shifts_delete_admins" },
  { schema: "public", table: "report_categories", policy: "report_categories_select_members" },
  { schema: "public", table: "report_categories", policy: "report_categories_insert_admins" },
  { schema: "public", table: "report_categories", policy: "report_categories_manage_admins" },
  { schema: "public", table: "report_categories", policy: "report_categories_delete_admins" },
  { schema: "public", table: "reports", policy: "reports_select_members" },
  { schema: "public", table: "reports", policy: "reports_insert_members" },
  { schema: "public", table: "reports", policy: "reports_manage_creator_or_admin" },
  { schema: "public", table: "reports", policy: "reports_delete_creator_or_admin" },
  { schema: "public", table: "reports", policy: "reports_manage_moderators" },
  { schema: "public", table: "report_attachments", policy: "report_attachments_select_members" },
  { schema: "public", table: "report_attachments", policy: "report_attachments_insert_members" },
  {
    schema: "public",
    table: "report_attachments",
    policy: "report_attachments_manage_uploader_or_admin",
  },
  {
    schema: "public",
    table: "report_attachments",
    policy: "report_attachments_delete_uploader_or_admin",
  },
  { schema: "public", table: "report_confirmations", policy: "report_confirmations_select_members" },
  { schema: "public", table: "report_confirmations", policy: "report_confirmations_insert_self" },
  {
    schema: "public",
    table: "report_confirmations",
    policy: "report_confirmations_manage_self_or_admin",
  },
  {
    schema: "public",
    table: "report_confirmations",
    policy: "report_confirmations_delete_self_or_admin",
  },
  { schema: "public", table: "economic_reports", policy: "economic_reports_select_members" },
  { schema: "public", table: "economic_reports", policy: "economic_reports_insert_members" },
  {
    schema: "public",
    table: "economic_reports",
    policy: "economic_reports_manage_creator_or_admin",
  },
  {
    schema: "public",
    table: "economic_reports",
    policy: "economic_reports_delete_creator_or_admin",
  },
  { schema: "public", table: "economic_reports", policy: "economic_reports_manage_moderators" },
  {
    schema: "public",
    table: "economic_report_confirmations",
    policy: "economic_report_confirmations_select_members",
  },
  {
    schema: "public",
    table: "economic_report_confirmations",
    policy: "economic_report_confirmations_insert_self",
  },
  {
    schema: "public",
    table: "economic_report_confirmations",
    policy: "economic_report_confirmations_manage_self_or_admin",
  },
  {
    schema: "public",
    table: "economic_report_confirmations",
    policy: "economic_report_confirmations_delete_self_or_admin",
  },
  {
    schema: "public",
    table: "economic_report_attachments",
    policy: "economic_report_attachments_select_members",
  },
  {
    schema: "public",
    table: "economic_report_attachments",
    policy: "economic_report_attachments_insert_members",
  },
  {
    schema: "public",
    table: "economic_report_attachments",
    policy: "economic_report_attachments_manage_uploader_or_admin",
  },
  {
    schema: "public",
    table: "economic_report_attachments",
    policy: "economic_report_attachments_delete_uploader_or_admin",
  },
  { schema: "public", table: "issue_clusters", policy: "issue_clusters_select_members" },
  { schema: "public", table: "issue_clusters", policy: "issue_clusters_insert_admins" },
  { schema: "public", table: "issue_clusters", policy: "issue_clusters_manage_admins" },
  { schema: "public", table: "issue_clusters", policy: "issue_clusters_delete_admins" },
  { schema: "public", table: "cluster_reports", policy: "cluster_reports_select_members" },
  { schema: "public", table: "cluster_reports", policy: "cluster_reports_insert_admins" },
  { schema: "public", table: "cluster_reports", policy: "cluster_reports_manage_admins" },
  { schema: "public", table: "cluster_reports", policy: "cluster_reports_delete_admins" },
  { schema: "public", table: "cluster_reports", policy: "cluster_reports_insert_moderators" },
  { schema: "public", table: "cluster_reports", policy: "cluster_reports_delete_moderators" },
  {
    schema: "public",
    table: "cluster_economic_reports",
    policy: "cluster_economic_reports_select_members",
  },
  {
    schema: "public",
    table: "cluster_economic_reports",
    policy: "cluster_economic_reports_insert_admins",
  },
  {
    schema: "public",
    table: "cluster_economic_reports",
    policy: "cluster_economic_reports_manage_admins",
  },
  {
    schema: "public",
    table: "cluster_economic_reports",
    policy: "cluster_economic_reports_delete_admins",
  },
  {
    schema: "public",
    table: "cluster_economic_reports",
    policy: "cluster_economic_reports_insert_moderators",
  },
  {
    schema: "public",
    table: "cluster_economic_reports",
    policy: "cluster_economic_reports_delete_moderators",
  },
  { schema: "public", table: "demands", policy: "demands_select_members" },
  { schema: "public", table: "demands", policy: "demands_insert_members" },
  { schema: "public", table: "demands", policy: "demands_manage_creator_or_admin" },
  { schema: "public", table: "demands", policy: "demands_delete_creator_or_admin" },
  { schema: "public", table: "demand_supporters", policy: "demand_supporters_select_members" },
  { schema: "public", table: "demand_supporters", policy: "demand_supporters_insert_self" },
  { schema: "public", table: "demand_supporters", policy: "demand_supporters_delete_self_or_admin" },
  { schema: "public", table: "nuclei", policy: "nuclei_select_members" },
  { schema: "public", table: "nuclei", policy: "nuclei_insert_members" },
  { schema: "public", table: "nuclei", policy: "nuclei_manage_creator_or_admin" },
  { schema: "public", table: "nuclei", policy: "nuclei_delete_creator_or_admin" },
  { schema: "public", table: "nucleus_members", policy: "nucleus_members_select_members" },
  { schema: "public", table: "nucleus_members", policy: "nucleus_members_insert_self_or_admin" },
  {
    schema: "public",
    table: "nucleus_members",
    policy: "nucleus_members_delete_self_or_admin",
  },
  { schema: "public", table: "actions", policy: "actions_select_members" },
  { schema: "public", table: "actions", policy: "actions_insert_admins" },
  { schema: "public", table: "actions", policy: "actions_manage_admins" },
  { schema: "public", table: "actions", policy: "actions_delete_admins" },
  { schema: "public", table: "moderation_events", policy: "moderation_events_select_admins" },
  { schema: "public", table: "moderation_events", policy: "moderation_events_insert_admins" },
  { schema: "public", table: "moderation_events", policy: "moderation_events_manage_admins" },
  { schema: "public", table: "moderation_events", policy: "moderation_events_delete_admins" },
  { schema: "public", table: "moderation_events", policy: "moderation_events_select_moderators" },
  { schema: "public", table: "moderation_events", policy: "moderation_events_insert_moderators" },
  { schema: "storage", table: "objects", policy: "report_attachments_insert" },
  { schema: "storage", table: "objects", policy: "report_attachments_select" },
  { schema: "storage", table: "objects", policy: "report_attachments_update" },
  { schema: "storage", table: "objects", policy: "report_attachments_delete" },
  { schema: "storage", table: "objects", policy: "economic_report_attachments_insert" },
  { schema: "storage", table: "objects", policy: "economic_report_attachments_select" },
  { schema: "storage", table: "objects", policy: "economic_report_attachments_update" },
  { schema: "storage", table: "objects", policy: "economic_report_attachments_delete" },
];

export async function getMigrationFiles() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function isTimestampedMigrationName(name) {
  return /^\d{14}_.+\.sql$/.test(name);
}
