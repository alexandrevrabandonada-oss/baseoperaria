import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getAdminWorkspaceContextMock,
  getAuthContextMock,
  isSupabaseConfiguredMock,
  recordModerationEventMock,
  redirectMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getAdminWorkspaceContextMock: vi.fn(),
  getAuthContextMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  recordModerationEventMock: vi.fn(),
  redirectMock: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/lib/supabase/queries", () => ({
  getAuthContext: getAuthContextMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminWorkspaceContext: getAdminWorkspaceContextMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/moderation", () => ({
  recordModerationEvent: recordModerationEventMock,
}));

import {
  attachEconomicReportToClusterAction,
  attachReportToClusterAction,
  detachEconomicReportFromClusterAction,
  detachReportFromClusterAction,
} from "../app/admin/clusters/actions";

const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLUSTER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REPORT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ECONOMIC_REPORT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const USER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function reportAttachFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("report_id", REPORT_ID);
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function economicAttachFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("economic_report_id", ECONOMIC_REPORT_ID);
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function reportDetachFormData() {
  return reportAttachFormData();
}

function economicDetachFormData() {
  return economicAttachFormData();
}

function createDeleteChainWithError() {
  const chain = {
    eq: vi.fn().mockReturnThis(),
  };
  chain.eq.mockImplementation((field: string) => {
    if (field === "company_id") {
      return Promise.resolve({ error: { code: "XX000" } });
    }
    return chain;
  });
  return chain;
}

function createSupabaseForReportAttachError() {
  const issueClusters = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: CLUSTER_ID, company_id: COMPANY_ID } })),
  };
  const reports = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: REPORT_ID, company_id: COMPANY_ID } })),
  };
  const clusterReports = {
    insert: vi.fn(async () => ({ error: { code: "XX000" } })),
  };

  return {
    clusterReports,
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") return issueClusters;
      if (table === "reports") return reports;
      if (table === "cluster_reports") return clusterReports;
      throw new Error(`Unexpected table access: ${table}`);
    }),
  };
}

function createSupabaseForEconomicAttachError() {
  const issueClusters = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: CLUSTER_ID, company_id: COMPANY_ID } })),
  };
  const economicReports = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: ECONOMIC_REPORT_ID, company_id: COMPANY_ID } })),
  };
  const clusterEconomicReports = {
    insert: vi.fn(async () => ({ error: { code: "XX000" } })),
  };

  return {
    clusterEconomicReports,
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") return issueClusters;
      if (table === "economic_reports") return economicReports;
      if (table === "cluster_economic_reports") return clusterEconomicReports;
      throw new Error(`Unexpected table access: ${table}`);
    }),
  };
}

function createSupabaseForDetachError() {
  const issueClusters = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: CLUSTER_ID, company_id: COMPANY_ID } })),
  };
  const clusterReports = {
    delete: vi.fn(() => createDeleteChainWithError()),
  };
  const clusterEconomicReports = {
    delete: vi.fn(() => createDeleteChainWithError()),
  };

  return {
    clusterEconomicReports,
    clusterReports,
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") return issueClusters;
      if (table === "cluster_reports") return clusterReports;
      if (table === "cluster_economic_reports") return clusterEconomicReports;
      throw new Error(`Unexpected table access: ${table}`);
    }),
  };
}

describe("cluster actions database-error smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseConfiguredMock.mockReturnValue(true);
    getAuthContextMock.mockResolvedValue({ user: { id: USER_ID } });
    getAdminWorkspaceContextMock.mockResolvedValue({ selectedCompany: { id: COMPANY_ID } });
  });

  it("falls back to status=erro when report attach insert fails", async () => {
    const supabase = createSupabaseForReportAttachError();
    createClientMock.mockResolvedValue(supabase);

    await expect(attachReportToClusterAction(reportAttachFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=erro",
    );

    expect(supabase.clusterReports.insert).toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("falls back to status=erro when economic attach insert fails", async () => {
    const supabase = createSupabaseForEconomicAttachError();
    createClientMock.mockResolvedValue(supabase);

    await expect(attachEconomicReportToClusterAction(economicAttachFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=erro",
    );

    expect(supabase.clusterEconomicReports.insert).toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("falls back to status=erro when report detach delete fails", async () => {
    const supabase = createSupabaseForDetachError();
    createClientMock.mockResolvedValue(supabase);

    await expect(detachReportFromClusterAction(reportDetachFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=erro",
    );

    expect(supabase.clusterReports.delete).toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("falls back to status=erro when economic detach delete fails", async () => {
    const supabase = createSupabaseForDetachError();
    createClientMock.mockResolvedValue(supabase);

    await expect(detachEconomicReportFromClusterAction(economicDetachFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=erro",
    );

    expect(supabase.clusterEconomicReports.delete).toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });
});