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

import { saveClusterAction } from "../app/admin/clusters/actions";

const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLUSTER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function buildCreateFormData() {
  const formData = new FormData();
  formData.set("company_id", COMPANY_ID);
  formData.set("title", "Cluster piloto");
  formData.set("summary", "Resumo inicial");
  formData.set("status", "open");
  formData.set("return_to", "/admin/clusters");
  return formData;
}

function buildUpdateFormData() {
  const formData = buildCreateFormData();
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("return_to", "/admin/clusters?company_id=1");
  return formData;
}

function createSupabaseForCreate({
  genericError = false,
  uniqueViolation = false,
}: {
  genericError?: boolean;
  uniqueViolation?: boolean;
} = {}) {
  const insertSelect = {
    single: vi.fn(async () => {
      if (uniqueViolation) {
        return { data: null, error: { code: "23505" } };
      }

      if (genericError) {
        return { data: null, error: { code: "XX000" } };
      }

      return { data: { id: CLUSTER_ID }, error: null };
    }),
  };

  const issueClustersTable = {
    insert: vi.fn(() => ({
      select: vi.fn(() => insertSelect),
    })),
  };

  return {
    issueClustersTable,
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") {
        return issueClustersTable;
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };
}

function createSupabaseForUpdate({
  clusterBelongsToCompany = true,
  genericError = false,
  uniqueViolation = false,
}: {
  clusterBelongsToCompany?: boolean;
  genericError?: boolean;
  uniqueViolation?: boolean;
} = {}) {
  const issueClustersRead = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({
      data: clusterBelongsToCompany
        ? { id: CLUSTER_ID, company_id: COMPANY_ID }
        : { id: CLUSTER_ID, company_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
    })),
  };

  const updateChain = {
    eq: vi.fn().mockReturnThis(),
  };
  updateChain.eq.mockImplementation((field: string) => {
    if (field === "company_id") {
      if (uniqueViolation) {
        return Promise.resolve({ error: { code: "23505" } });
      }

      if (genericError) {
        return Promise.resolve({ error: { code: "XX000" } });
      }

      return Promise.resolve({ error: null });
    }

    return updateChain;
  });

  const issueClustersTable = {
    ...issueClustersRead,
    update: vi.fn(() => updateChain),
  };

  return {
    issueClustersTable,
    from: vi.fn((table: string) => {
      if (table === "issue_clusters") {
        return issueClustersTable;
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };
}

describe("saveClusterAction smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isSupabaseConfiguredMock.mockReturnValue(true);
    getAuthContextMock.mockResolvedValue({ user: { id: USER_ID } });
    getAdminWorkspaceContextMock.mockResolvedValue({
      selectedCompany: { id: COMPANY_ID },
    });
  });

  it("creates cluster and redirects to cluster detail", async () => {
    const supabase = createSupabaseForCreate({ uniqueViolation: false });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildCreateFormData())).rejects.toThrow(
      `REDIRECT:/admin/clusters/${CLUSTER_ID}?status=cluster-salvo`,
    );

    expect(supabase.issueClustersTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: COMPANY_ID,
        created_by_profile_id: USER_ID,
        status: "open",
        title: "Cluster piloto",
      }),
    );

    expect(recordModerationEventMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        actionCode: "review",
        actorProfileId: USER_ID,
        companyId: COMPANY_ID,
        entityId: CLUSTER_ID,
        entityType: "issue_cluster",
      }),
    );

    const revalidatedPaths = revalidatePathMock.mock.calls.map((call) => String(call[0]));
    expect(revalidatedPaths).toEqual(
      expect.arrayContaining(["/admin", "/admin/clusters", `/admin/clusters/${CLUSTER_ID}`]),
    );
  });

  it("updates existing cluster and redirects back with success status", async () => {
    const supabase = createSupabaseForUpdate({ uniqueViolation: false });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildUpdateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?company_id=1&status=cluster-salvo",
    );

    expect(supabase.issueClustersTable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "open",
        summary: "Resumo inicial",
        title: "Cluster piloto",
      }),
    );
    expect(recordModerationEventMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        details: { operation: "update" },
        entityId: CLUSTER_ID,
      }),
    );
  });

  it("returns duplicate status on create unique violation", async () => {
    const supabase = createSupabaseForCreate({ uniqueViolation: true });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildCreateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=cluster-ja-existente",
    );

    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("returns duplicate status on update unique violation", async () => {
    const supabase = createSupabaseForUpdate({ uniqueViolation: true });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildUpdateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?company_id=1&status=cluster-ja-existente",
    );

    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("returns generic error status on create database failure", async () => {
    const supabase = createSupabaseForCreate({ genericError: true });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildCreateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=erro",
    );

    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("returns generic error status on update database failure", async () => {
    const supabase = createSupabaseForUpdate({ genericError: true });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildUpdateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?company_id=1&status=erro",
    );

    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });

  it("returns sem-permissao when admin workspace has no selected company", async () => {
    createClientMock.mockResolvedValue({ from: vi.fn() });
    getAdminWorkspaceContextMock.mockResolvedValue({ selectedCompany: null });

    await expect(saveClusterAction(buildCreateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?status=sem-permissao",
    );
  });

  it("returns sem-permissao when updating cluster from another company", async () => {
    const supabase = createSupabaseForUpdate({ clusterBelongsToCompany: false });
    createClientMock.mockResolvedValue(supabase);

    await expect(saveClusterAction(buildUpdateFormData())).rejects.toThrow(
      "REDIRECT:/admin/clusters?company_id=1&status=sem-permissao",
    );

    expect(supabase.issueClustersTable.update).not.toHaveBeenCalled();
    expect(recordModerationEventMock).not.toHaveBeenCalled();
  });
});