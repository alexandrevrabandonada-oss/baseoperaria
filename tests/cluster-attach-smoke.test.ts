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

import { attachEconomicReportToClusterAction } from "../app/admin/clusters/actions";

const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLUSTER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ECONOMIC_REPORT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const USER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function buildFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("economic_report_id", ECONOMIC_REPORT_ID);
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function createSupabaseMock({
  economicReportCompanyId = COMPANY_ID,
}: {
  economicReportCompanyId?: string;
} = {}) {
  const issueClustersQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: CLUSTER_ID, company_id: COMPANY_ID } })),
    select: vi.fn().mockReturnThis(),
  };

  const economicReportsQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn(async () => ({ data: { id: ECONOMIC_REPORT_ID, company_id: economicReportCompanyId } })),
    select: vi.fn().mockReturnThis(),
  };

  const clusterEconomicReportsTable = {
    insert: vi.fn(async () => ({ error: null })),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") {
        return issueClustersQuery;
      }

      if (table === "economic_reports") {
        return economicReportsQuery;
      }

      if (table === "cluster_economic_reports") {
        return clusterEconomicReportsTable;
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };

  return { client, clusterEconomicReportsTable };
}

describe("attachEconomicReportToClusterAction smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isSupabaseConfiguredMock.mockReturnValue(true);
    getAuthContextMock.mockResolvedValue({ user: { id: USER_ID } });
    getAdminWorkspaceContextMock.mockResolvedValue({
      selectedCompany: { id: COMPANY_ID },
    });
  });

  it("creates the cluster-economic link and records moderation audit", async () => {
    const supabase = createSupabaseMock({ economicReportCompanyId: COMPANY_ID });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(attachEconomicReportToClusterAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=vinculo-salvo",
    );

    expect(supabase.clusterEconomicReportsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster_id: CLUSTER_ID,
        company_id: COMPANY_ID,
        created_by_profile_id: USER_ID,
        economic_report_id: ECONOMIC_REPORT_ID,
      }),
    );

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

    const revalidatedPaths = revalidatePathMock.mock.calls.map((call) => String(call[0]));
    expect(revalidatedPaths).toEqual(
      expect.arrayContaining(["/admin", "/admin/clusters", `/admin/clusters/${CLUSTER_ID}`]),
    );
  });

  it("rejects when the economic report belongs to a different company", async () => {
    const supabase = createSupabaseMock({
      economicReportCompanyId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(attachEconomicReportToClusterAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=dados-invalidos",
    );

    expect(supabase.clusterEconomicReportsTable.insert).not.toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });
});