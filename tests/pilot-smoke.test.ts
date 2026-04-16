import { describe, expect, it } from "vitest";

import {
  normalizePath,
  parseEconomicReportCreateInput,
  parseOnboardingInput,
  parsePautaCreateInput,
  parseReportConfirmationInput,
  parseReportCreateInput,
  type ParseResult,
} from "../lib/validation/workflows";

function expectParsedValue<T>(result: ParseResult<T>): T {
  if ("error" in result) {
    throw new Error(`Expected parse success, got error: ${result.error}`);
  }

  return result.value;
}

describe("pilot critical flow smoke", () => {
  it("keeps the core create-and-link chain valid", () => {
    const companyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const reportId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const clusterId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

    const onboarding = expectParsedValue(
      parseOnboardingInput({
        initialLink: "  fabrica de montagem  ",
        pseudonym: "  Operaria teste  ",
      }),
    );

    expect(onboarding).toEqual({
      initialLink: "fabrica de montagem",
      pseudonym: "Operaria teste",
    });

    const report = expectParsedValue(
      parseReportCreateInput({
        categoryId: "11111111-1111-4111-8111-111111111111",
        companyId,
        description: "  Ruido constante e calor  ",
        frequencyCode: "frequent",
        sectorId: null,
        severityCode: "high",
        shiftId: null,
        title: "  Linha sem ventilacao  ",
        unitId: null,
      }),
    );

    expect(report.companyId).toBe(companyId);
    expect(report.frequencyCode).toBe("frequent");

    const economic = expectParsedValue(
      parseEconomicReportCreateInput({
        companyId,
        contractTypeCode: "permanent",
        description: "  Funcao exercida acima do cargo formal  ",
        formalRole: "  Operadora  ",
        issueTypeCode: "salario_baixo",
        realFunction: "  Operadora de linha  ",
        salaryBandCode: "mid",
        sectorId: null,
        severityCode: "critical",
        shiftId: null,
        unitId: null,
      }),
    );

    expect(economic.companyId).toBe(companyId);
    expect(economic.title).toContain("Operadora");

    const confirmation = expectParsedValue(
      parseReportConfirmationInput({
        confirmationTypeCode: "urgente",
        reportId,
      }),
    );

    expect(confirmation).toEqual({
      confirmationTypeCode: "urgente",
      reportId,
    });

    const pauta = expectParsedValue(
      parsePautaCreateInput({
        clusterId,
        companyId,
        description: "  Negociar reajuste e jornada com base nos relatos  ",
        kind: "mixed",
        priorityCode: "critical",
        sectorId: null,
        status: "open",
        title: "  Pauta de negociacao inicial  ",
        unitId: null,
      }),
    );

    expect(pauta.clusterId).toBe(clusterId);
    expect(pauta.companyId).toBe(companyId);
    expect(pauta.kind).toBe("mixed");
  });

  it("accepts only expected return paths in cluster and pauta flows", () => {
    expect(normalizePath("/admin/clusters?status=ok", "/pautas")).toBe(
      "/admin/clusters?status=ok",
    );
    expect(normalizePath("/pautas?company_id=1", "/admin/clusters")).toBe(
      "/pautas?company_id=1",
    );
    expect(normalizePath("https://evil.test/path", "/pautas")).toBe("/pautas");
    expect(normalizePath("/radar", "/pautas")).toBe("/pautas");
  });
});