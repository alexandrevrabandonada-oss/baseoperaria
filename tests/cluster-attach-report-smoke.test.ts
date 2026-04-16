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

import { attachReportToClusterAction } from "../app/admin/clusters/actions";

const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLUSTER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REPORT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const USER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function buildFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("report_id", REPORT_ID);
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function createSupabaseMock({ reportCompanyId = COMPANY_ID }: { reportCompanyId?: string } = {}) {
  const issueClustersQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: CLUSTER_ID, company_id: COMPANY_ID } })),
    select: vi.fn().mockReturnThis(),
  };

  const reportsQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { id: REPORT_ID, company_id: reportCompanyId } })),
    select: vi.fn().mockReturnThis(),
  };

  const clusterReportsTable = {
    insert: vi.fn(async () => ({ error: null })),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") {
        return issueClustersQuery;
      }

      if (table === "reports") {
        return reportsQuery;
      }

      if (table === "cluster_reports") {
        return clusterReportsTable;
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };

  return { client, clusterReportsTable };
}

describe("attachReportToClusterAction smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isSupabaseConfiguredMock.mockReturnValue(true);
    getAuthContextMock.mockResolvedValue({ user: { id: USER_ID } });
    getAdminWorkspaceContextMock.mockResolvedValue({
      selectedCompany: { id: COMPANY_ID },
    });
  });

  it("creates the cluster-report link and records moderation audit", async () => {
    const supabase = createSupabaseMock({ reportCompanyId: COMPANY_ID });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(attachReportToClusterAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=vinculo-salvo",
    );

    expect(supabase.clusterReportsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster_id: CLUSTER_ID,
        company_id: COMPANY_ID,
        created_by_profile_id: USER_ID,
        report_id: REPORT_ID,
      }),
    );

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

    const revalidatedPaths = revalidatePathMock.mock.calls.map((call) => String(call[0]));
    expect(revalidatedPaths).toEqual(
      expect.arrayContaining(["/admin", "/admin/clusters", `/admin/clusters/${CLUSTER_ID}`]),
    );
  });

  it("rejects when the report belongs to a different company", async () => {
    const supabase = createSupabaseMock({
      reportCompanyId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(attachReportToClusterAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=dados-invalidos",
    );

    expect(supabase.clusterReportsTable.insert).not.toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });
});