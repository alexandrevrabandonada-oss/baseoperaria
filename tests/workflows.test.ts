import { describe, expect, it } from "vitest";

import {
  normalizeEmail,
  parseEconomicReportCreateInput,
  parseOnboardingInput,
  parsePautaCreateInput,
  parseReportConfirmationInput,
  parseReportCreateInput,
} from "../lib/validation/workflows";

describe("workflow validation", () => {
  it("normalizes onboarding input and email", () => {
    expect(normalizeEmail("  USER@Example.com  ")).toBe("user@example.com");

    const result = parseOnboardingInput({
      initialLink: "  chão de fábrica  ",
      pseudonym: "  Operária  ",
    });

    expect("value" in result ? result.value : null).toEqual({
      initialLink: "chão de fábrica",
      pseudonym: "Operária",
    });
  });

  it("validates report creation", () => {
    const result = parseReportCreateInput({
      categoryId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      description: "  Falta de ventilação  ",
      frequencyCode: "frequent",
      sectorId: null,
      severityCode: "high",
      shiftId: null,
      title: "  Calor excessivo  ",
      unitId: null,
    });

    expect("value" in result ? result.value : null).toEqual({
      categoryId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      description: "Falta de ventilação",
      frequencyCode: "frequent",
      sectorId: null,
      severityCode: "high",
      shiftId: null,
      title: "Calor excessivo",
      unitId: null,
    });
  });

  it("validates economic report creation", () => {
    const result = parseEconomicReportCreateInput({
      companyId: "33333333-3333-4333-8333-333333333333",
      contractTypeCode: "permanent",
      description: "  Diferença entre função formal e prática  ",
      formalRole: "  Operadora  ",
      issueTypeCode: "salario_baixo",
      realFunction: "  Operadora de linha  ",
      salaryBandCode: "mid",
      sectorId: null,
      severityCode: "critical",
      shiftId: null,
      unitId: null,
    });

    expect("value" in result ? result.value : null).toEqual({
      companyId: "33333333-3333-4333-8333-333333333333",
      contractTypeCode: "permanent",
      description: "Diferença entre função formal e prática",
      formalRole: "Operadora",
      issueTypeCode: "salario_baixo",
      realFunction: "Operadora de linha",
      salaryBandCode: "mid",
      sectorId: null,
      severityCode: "critical",
      shiftId: null,
      title: "Salário baixo · Operadora",
      unitId: null,
    });
  });

  it("validates confirmation input", () => {
    const result = parseReportConfirmationInput({
      confirmationTypeCode: "urgente",
      reportId: "44444444-4444-4444-8444-444444444444",
    });

    expect("value" in result ? result.value : null).toEqual({
      confirmationTypeCode: "urgente",
      reportId: "44444444-4444-4444-8444-444444444444",
    });
  });

  it("validates pauta creation", () => {
    const result = parsePautaCreateInput({
      clusterId: "55555555-5555-4555-8555-555555555555",
      companyId: "66666666-6666-4666-8666-666666666666",
      description: "  Consolidar negociação  ",
      kind: "mixed",
      priorityCode: "critical",
      sectorId: null,
      status: "open",
      title: "  Reajuste e jornada  ",
      unitId: null,
    });

    expect("value" in result ? result.value : null).toEqual({
      clusterId: "55555555-5555-4555-8555-555555555555",
      companyId: "66666666-6666-4666-8666-666666666666",
      description: "Consolidar negociação",
      kind: "mixed",
      priorityCode: "critical",
      sectorId: null,
      status: "open",
      title: "Reajuste e jornada",
      unitId: null,
    });
  });
});
