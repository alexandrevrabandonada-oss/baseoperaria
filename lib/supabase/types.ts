export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LookupRow = {
  active: boolean;
  code: string;
  label: string;
  sort_order: number;
};

export type CompanyRole = "owner" | "admin" | "moderator" | "member" | "observer";
export type GovernanceRole = "admin" | "moderator" | "member";
export type ReportCategoryKind = "conditions" | "economic";
export type DemandKind = "conditions" | "economic" | "mixed";
export type NucleusScopeKind = "sector" | "theme";
export type ReportStatus = "open" | "triaged" | "resolved" | "closed" | "archived";
export type ClusterStatus = ReportStatus;
export type DemandStatus = "draft" | "open" | "planned" | "in_progress" | "completed" | "cancelled";
export type NucleusStatus = "active" | "archived";
export type NucleusMemberRole = "lead" | "member" | "observer";
export type ActionType = "meeting" | "campaign" | "follow_up" | "negotiation" | "inspection" | "other";
export type ActionStatus = "planned" | "active" | "done" | "cancelled";
export type ModerationEntityType =
  | "report"
  | "economic_report"
  | "report_attachment"
  | "economic_report_attachment"
  | "issue_cluster"
  | "demand"
  | "nucleus"
  | "action"
  | "company";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          id: string;
          initial_link: string;
          pseudonym: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          initial_link: string;
          pseudonym: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          initial_link?: string;
          pseudonym?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      severity_levels: {
        Row: LookupRow;
        Insert: {
          active?: boolean;
          code: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      frequency_levels: {
        Row: LookupRow;
        Insert: {
          active?: boolean;
          code: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      contract_types: {
        Row: LookupRow;
        Insert: {
          active?: boolean;
          code: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      salary_bands: {
        Row: LookupRow;
        Insert: {
          active?: boolean;
          code: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      issue_types: {
        Row: LookupRow;
        Insert: {
          active?: boolean;
          code: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      confirmation_types: {
        Row: LookupRow;
        Insert: {
          active?: boolean;
          code: string;
          label: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      company_memberships: {
        Row: {
          company_id: string;
          created_at: string;
          profile_id: string;
          role: CompanyRole;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          profile_id: string;
          role?: CompanyRole;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          profile_id?: string;
          role?: CompanyRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          active: boolean;
          company_id: string;
          code: string;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          code: string;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          code?: string;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sectors: {
        Row: {
          active: boolean;
          company_id: string;
          code: string;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          id: string;
          name: string;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          code: string;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          id?: string;
          name: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          code?: string;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      shifts: {
        Row: {
          active: boolean;
          company_id: string;
          code: string;
          created_at: string;
          created_by_profile_id: string;
          end_time: string | null;
          id: string;
          name: string;
          overnight: boolean;
          start_time: string | null;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          company_id: string;
          code: string;
          created_at?: string;
          created_by_profile_id: string;
          end_time?: string | null;
          id?: string;
          name: string;
          overnight?: boolean;
          start_time?: string | null;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          code?: string;
          created_at?: string;
          created_by_profile_id?: string;
          end_time?: string | null;
          id?: string;
          name?: string;
          overnight?: boolean;
          start_time?: string | null;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_categories: {
        Row: {
          active: boolean;
          category_kind: ReportCategoryKind;
          company_id: string;
          code: string;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category_kind: ReportCategoryKind;
          company_id: string;
          code: string;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category_kind?: ReportCategoryKind;
          company_id?: string;
          code?: string;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          category_id: string | null;
          company_id: string;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          frequency_code: string | null;
          id: string;
          occurred_at: string | null;
          sector_id: string | null;
          severity_code: string | null;
          shift_id: string | null;
          source_profile_id: string | null;
          status: ReportStatus;
          title: string;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          company_id: string;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          frequency_code?: string | null;
          id?: string;
          occurred_at?: string | null;
          sector_id?: string | null;
          severity_code?: string | null;
          shift_id?: string | null;
          source_profile_id?: string | null;
          status?: ReportStatus;
          title: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          company_id?: string;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          frequency_code?: string | null;
          id?: string;
          occurred_at?: string | null;
          sector_id?: string | null;
          severity_code?: string | null;
          shift_id?: string | null;
          source_profile_id?: string | null;
          status?: ReportStatus;
          title?: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_attachments: {
        Row: {
          byte_size: number | null;
          company_id: string;
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string | null;
          report_id: string;
          storage_bucket: string;
          storage_path: string;
          uploader_profile_id: string;
        };
        Insert: {
          byte_size?: number | null;
          company_id: string;
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type?: string | null;
          report_id: string;
          storage_bucket?: string;
          storage_path: string;
          uploader_profile_id: string;
        };
        Update: {
          byte_size?: number | null;
          company_id?: string;
          created_at?: string;
          file_name?: string;
          id?: string;
          mime_type?: string | null;
          report_id?: string;
          storage_bucket?: string;
          storage_path?: string;
          uploader_profile_id?: string;
        };
        Relationships: [];
      };
      report_confirmations: {
        Row: {
          confirmation_type_code: string;
          company_id: string;
          created_at: string;
          id: string;
          note: string | null;
          profile_id: string;
          report_id: string;
        };
        Insert: {
          confirmation_type_code: string;
          company_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          profile_id: string;
          report_id: string;
        };
        Update: {
          confirmation_type_code?: string;
          company_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          profile_id?: string;
          report_id?: string;
        };
        Relationships: [];
      };
      economic_reports: {
        Row: {
          category_id: string | null;
          company_id: string;
          contract_type_code: string | null;
          created_at: string;
          created_by_profile_id: string;
          currency_code: string;
          description: string | null;
          frequency_code: string | null;
          formal_role: string | null;
          id: string;
          issue_type_code: string | null;
          amount: string | null;
          reported_at: string | null;
          real_function: string | null;
          sector_id: string | null;
          severity_code: string | null;
          salary_band_code: string | null;
          shift_id: string | null;
          source_profile_id: string | null;
          status: ReportStatus;
          title: string;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          company_id: string;
          contract_type_code?: string | null;
          created_at?: string;
          created_by_profile_id: string;
          currency_code?: string;
          description?: string | null;
          frequency_code?: string | null;
          formal_role?: string | null;
          id?: string;
          issue_type_code?: string | null;
          amount?: string | number | null;
          reported_at?: string | null;
          real_function?: string | null;
          sector_id?: string | null;
          severity_code?: string | null;
          salary_band_code?: string | null;
          shift_id?: string | null;
          source_profile_id?: string | null;
          status?: ReportStatus;
          title: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          company_id?: string;
          contract_type_code?: string | null;
          created_at?: string;
          created_by_profile_id?: string;
          currency_code?: string;
          description?: string | null;
          frequency_code?: string | null;
          formal_role?: string | null;
          id?: string;
          issue_type_code?: string | null;
          amount?: string | number | null;
          reported_at?: string | null;
          real_function?: string | null;
          sector_id?: string | null;
          severity_code?: string | null;
          salary_band_code?: string | null;
          shift_id?: string | null;
          source_profile_id?: string | null;
          status?: ReportStatus;
          title?: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      economic_report_confirmations: {
        Row: {
          confirmation_type_code: string;
          company_id: string;
          created_at: string;
          economic_report_id: string;
          id: string;
          note: string | null;
          profile_id: string;
        };
        Insert: {
          confirmation_type_code: string;
          company_id: string;
          created_at?: string;
          economic_report_id: string;
          id?: string;
          note?: string | null;
          profile_id: string;
        };
        Update: {
          confirmation_type_code?: string;
          company_id?: string;
          created_at?: string;
          economic_report_id?: string;
          id?: string;
          note?: string | null;
          profile_id?: string;
        };
        Relationships: [];
      };
      economic_report_attachments: {
        Row: {
          byte_size: number | null;
          company_id: string;
          created_at: string;
          economic_report_id: string;
          file_name: string;
          id: string;
          mime_type: string | null;
          storage_bucket: string;
          storage_path: string;
          uploader_profile_id: string;
        };
        Insert: {
          byte_size?: number | null;
          company_id: string;
          created_at?: string;
          economic_report_id: string;
          file_name: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string;
          storage_path: string;
          uploader_profile_id: string;
        };
        Update: {
          byte_size?: number | null;
          company_id?: string;
          created_at?: string;
          economic_report_id?: string;
          file_name?: string;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          uploader_profile_id?: string;
        };
        Relationships: [];
      };
      issue_clusters: {
        Row: {
          category_id: string | null;
          company_id: string;
          created_at: string;
          created_by_profile_id: string;
          id: string;
          issue_type_code: string | null;
          severity_code: string | null;
          status: ReportStatus;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          company_id: string;
          created_at?: string;
          created_by_profile_id: string;
          id?: string;
          issue_type_code?: string | null;
          severity_code?: string | null;
          status?: ReportStatus;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          company_id?: string;
          created_at?: string;
          created_by_profile_id?: string;
          id?: string;
          issue_type_code?: string | null;
          severity_code?: string | null;
          status?: ReportStatus;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cluster_reports: {
        Row: {
          cluster_id: string;
          company_id: string;
          created_at: string;
          created_by_profile_id: string;
          report_id: string;
        };
        Insert: {
          cluster_id: string;
          company_id: string;
          created_at?: string;
          created_by_profile_id: string;
          report_id: string;
        };
        Update: {
          cluster_id?: string;
          company_id?: string;
          created_at?: string;
          created_by_profile_id?: string;
          report_id?: string;
        };
        Relationships: [];
      };
      cluster_economic_reports: {
        Row: {
          cluster_id: string;
          company_id: string;
          created_at: string;
          created_by_profile_id: string;
          economic_report_id: string;
        };
        Insert: {
          cluster_id: string;
          company_id: string;
          created_at?: string;
          created_by_profile_id: string;
          economic_report_id: string;
        };
        Update: {
          cluster_id?: string;
          company_id?: string;
          created_at?: string;
          created_by_profile_id?: string;
          economic_report_id?: string;
        };
        Relationships: [];
      };
      demands: {
        Row: {
          cluster_id: string | null;
          company_id: string;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          kind: DemandKind;
          id: string;
          priority_code: string | null;
          status: DemandStatus;
          title: string;
          sector_id: string | null;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          cluster_id?: string | null;
          company_id: string;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          kind?: DemandKind;
          id?: string;
          priority_code?: string | null;
          status?: DemandStatus;
          title: string;
          sector_id?: string | null;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          cluster_id?: string | null;
          company_id?: string;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          kind?: DemandKind;
          id?: string;
          priority_code?: string | null;
          status?: DemandStatus;
          title?: string;
          sector_id?: string | null;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      demand_supporters: {
        Row: {
          company_id: string;
          created_at: string;
          demand_id: string;
          note: string | null;
          profile_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          demand_id: string;
          note?: string | null;
          profile_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          demand_id?: string;
          note?: string | null;
          profile_id?: string;
        };
        Relationships: [];
      };
      nuclei: {
        Row: {
          company_id: string;
          created_at: string;
          created_by_profile_id: string;
          description: string | null;
          id: string;
          name: string;
          scope_kind: NucleusScopeKind;
          sector_id: string | null;
          theme: string | null;
          status: NucleusStatus;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by_profile_id: string;
          description?: string | null;
          id?: string;
          name: string;
          scope_kind?: NucleusScopeKind;
          sector_id?: string | null;
          theme?: string | null;
          status?: NucleusStatus;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by_profile_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          scope_kind?: NucleusScopeKind;
          sector_id?: string | null;
          theme?: string | null;
          status?: NucleusStatus;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      nucleus_members: {
        Row: {
          company_id: string;
          created_at: string;
          nucleus_id: string;
          profile_id: string;
          role: NucleusMemberRole;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          nucleus_id: string;
          profile_id: string;
          role?: NucleusMemberRole;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          nucleus_id?: string;
          profile_id?: string;
          role?: NucleusMemberRole;
        };
        Relationships: [];
      };
      actions: {
        Row: {
          action_type: ActionType;
          cluster_id: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string;
          created_by_profile_id: string;
          demand_id: string | null;
          details: string | null;
          id: string;
          nucleus_id: string | null;
          scheduled_at: string | null;
          status: ActionStatus;
          title: string;
          updated_at: string;
        };
        Insert: {
          action_type?: ActionType;
          cluster_id?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by_profile_id: string;
          demand_id?: string | null;
          details?: string | null;
          id?: string;
          nucleus_id?: string | null;
          scheduled_at?: string | null;
          status?: ActionStatus;
          title: string;
          updated_at?: string;
        };
        Update: {
          action_type?: ActionType;
          cluster_id?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by_profile_id?: string;
          demand_id?: string | null;
          details?: string | null;
          id?: string;
          nucleus_id?: string | null;
          scheduled_at?: string | null;
          status?: ActionStatus;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      moderation_events: {
        Row: {
          action_type: string;
          actor_profile_id: string | null;
          company_id: string;
          created_at: string;
          details: Json;
          entity_id: string;
          entity_type: ModerationEntityType | string;
          id: string;
          reason: string | null;
        };
        Insert: {
          action_type: string;
          actor_profile_id?: string | null;
          company_id: string;
          created_at?: string;
          details?: Json;
          entity_id: string;
          entity_type: ModerationEntityType | string;
          id?: string;
          reason?: string | null;
        };
        Update: {
          action_type?: string;
          actor_profile_id?: string | null;
          company_id?: string;
          created_at?: string;
          details?: Json;
          entity_id?: string;
          entity_type?: ModerationEntityType | string;
          id?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type EconomicReport = Database["public"]["Tables"]["economic_reports"]["Row"];
export type IssueCluster = Database["public"]["Tables"]["issue_clusters"]["Row"];
export type ClusterReportLink = Database["public"]["Tables"]["cluster_reports"]["Row"];
export type ClusterEconomicReportLink =
  Database["public"]["Tables"]["cluster_economic_reports"]["Row"];
export type EconomicReportAttachment =
  Database["public"]["Tables"]["economic_report_attachments"]["Row"];
