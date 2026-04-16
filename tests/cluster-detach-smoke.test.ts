import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getAdminWorkspaceContextMock,
  getAuthContextMock,
  isSupabaseConfiguredMock,
  recordModerationEventMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getAdminWorkspaceContextMock: vi.fn(),
  getAuthContextMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  recordModerationEventMock: vi.fn(),
  redirectMock: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
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
  detachEconomicReportFromClusterAction,
  detachReportFromClusterAction,
} from "../app/admin/clusters/actions";

const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLUSTER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REPORT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ECONOMIC_REPORT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const USER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function buildReportFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("report_id", REPORT_ID);
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function buildEconomicFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("economic_report_id", ECONOMIC_REPORT_ID);
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function createSupabaseMock({
  clusterCompanyId = COMPANY_ID,
}: {
  clusterCompanyId?: string;
} = {}) {
  const issueClustersQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn(async () => ({ data: { id: CLUSTER_ID, company_id: clusterCompanyId } })),
    select: vi.fn().mockReturnThis(),
  };

  const clusterReportsDeleteQuery = {
    eq: vi.fn().mockReturnThis(),
  };
  clusterReportsDeleteQuery.eq.mockImplementation((field: string) => {
    if (field === "company_id") {
      return Promise.resolve({ error: null });
    }

    return clusterReportsDeleteQuery;
  });

  const clusterEconomicDeleteQuery = {
    eq: vi.fn().mockReturnThis(),
  };
  clusterEconomicDeleteQuery.eq.mockImplementation((field: string) => {
    if (field === "company_id") {
      return Promise.resolve({ error: null });
    }

    return clusterEconomicDeleteQuery;
  });

  const clusterReportsTable = {
    delete: vi.fn(() => clusterReportsDeleteQuery),
  };

  const clusterEconomicReportsTable = {
    delete: vi.fn(() => clusterEconomicDeleteQuery),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") {
        return issueClustersQuery;
      }

      if (table === "cluster_reports") {
        return clusterReportsTable;
      }

      if (table === "cluster_economic_reports") {
        return clusterEconomicReportsTable;
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };

  return {
    client,
    clusterEconomicReportsTable,
    clusterReportsTable,
  };
}

describe("cluster detach actions smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isSupabaseConfiguredMock.mockReturnValue(true);
    getAuthContextMock.mockResolvedValue({ user: { id: USER_ID } });
    getAdminWorkspaceContextMock.mockResolvedValue({
      selectedCompany: { id: COMPANY_ID },
    });
  });

  it("detaches report link and records moderation audit", async () => {
    const supabase = createSupabaseMock({ clusterCompanyId: COMPANY_ID });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(detachReportFromClusterAction(buildReportFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=vinculo-removido",
    );

    expect(supabase.clusterReportsTable.delete).toHaveBeenCalled();
    expect(recordModerationEventMock).toHaveBeenCalledWith(
      supabase.client,
      expect.objectContaining({
        actionCode: "cluster_link",
        actorProfileId: USER_ID,
        companyId: COMPANY_ID,
        entityId: REPORT_ID,
        entityType: "report",
      }),
    );
  });

  it("detaches economic report link and records moderation audit", async () => {
    const supabase = createSupabaseMock({ clusterCompanyId: COMPANY_ID });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(detachEconomicReportFromClusterAction(buildEconomicFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=vinculo-removido",
    );

    expect(supabase.clusterEconomicReportsTable.delete).toHaveBeenCalled();
    expect(recordModerationEventMock).toHaveBeenCalledWith(
      supabase.client,
      expect.objectContaining({
        actionCode: "cluster_link",
        actorProfileId: USER_ID,
        companyId: COMPANY_ID,
        entityId: ECONOMIC_REPORT_ID,
        entityType: "economic_report",
      }),
    );
  });

  it("blocks report detach when cluster is outside selected company", async () => {
    const supabase = createSupabaseMock({
      clusterCompanyId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(detachReportFromClusterAction(buildReportFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=sem-permissao",
    );

    expect(supabase.clusterReportsTable.delete).not.toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("blocks economic detach when cluster is outside selected company", async () => {
    const supabase = createSupabaseMock({
      clusterCompanyId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(detachEconomicReportFromClusterAction(buildEconomicFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=sem-permissao",
    );

    expect(supabase.clusterEconomicReportsTable.delete).not.toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });
});