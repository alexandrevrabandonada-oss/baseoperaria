import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getAuthContextMock,
  getPautaCreateContextMock,
  isSupabaseConfiguredMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getAuthContextMock: vi.fn(),
  getPautaCreateContextMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
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

vi.mock("@/lib/supabase/pautas", () => ({
  getPautaCreateContext: getPautaCreateContextMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { saveDemandAction } from "../app/pautas/actions";

const COMPANY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLUSTER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const DEMAND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const USER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function buildFormData() {
  const formData = new FormData();
  formData.set("cluster_id", CLUSTER_ID);
  formData.set("company_id", COMPANY_ID);
  formData.set("description", "Negociar pauta coletiva");
  formData.set("kind", "mixed");
  formData.set("priority_code", "critical");
  formData.set("status", "open");
  formData.set("title", "Pauta inicial");

  return formData;
}

function createSupabaseMock({ hasMembership = true }: { hasMembership?: boolean } = {}) {
  const membershipQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: hasMembership ? { company_id: COMPANY_ID } : null })),
    select: vi.fn().mockReturnThis(),
  };

  const demandsInsertQuery = {
    select: vi.fn().mockReturnThis(),
    single: vi.fn(async () => ({ data: { id: DEMAND_ID }, error: null })),
  };

  const demandsTable = {
    insert: vi.fn(() => demandsInsertQuery),
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "company_memberships") {
        return membershipQuery;
      }

      if (table === "demands") {
        return demandsTable;
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };

  return { client, demandsTable };
}

describe("saveDemandAction smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    isSupabaseConfiguredMock.mockReturnValue(true);
    getAuthContextMock.mockResolvedValue({ user: { id: USER_ID } });
    getPautaCreateContextMock.mockResolvedValue({
      companyId: COMPANY_ID,
      sectorOptions: [],
      unitOptions: [],
    });
  });

  it("creates a demand from a valid cluster and redirects to pauta detail", async () => {
    const supabase = createSupabaseMock({ hasMembership: true });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(saveDemandAction({}, buildFormData())).rejects.toThrow(
      `REDIRECT:/pautas/${DEMAND_ID}?status=pauta-salva`,
    );

    expect(supabase.demandsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster_id: CLUSTER_ID,
        company_id: COMPANY_ID,
        created_by_profile_id: USER_ID,
        kind: "mixed",
        priority_code: "critical",
        status: "open",
        title: "Pauta inicial",
      }),
    );

    const revalidatedPaths = revalidatePathMock.mock.calls.map((call) => String(call[0]));
    expect(revalidatedPaths).toEqual(
      expect.arrayContaining([
        "/pautas",
        `/pautas?company_id=${COMPANY_ID}`,
        `/pautas/${DEMAND_ID}`,
        "/admin/clusters",
        `/admin/clusters/${CLUSTER_ID}`,
      ]),
    );
  });

  it("rejects when cluster context does not belong to the selected company", async () => {
    getPautaCreateContextMock.mockResolvedValue({
      companyId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      sectorOptions: [],
      unitOptions: [],
    });

    const result = await saveDemandAction({}, buildFormData());

    expect(result).toEqual({
      error: "Você não tem permissão para criar pauta a partir deste cluster.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});