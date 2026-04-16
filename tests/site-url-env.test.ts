import { afterEach, describe, expect, it } from "vitest";

import { getSiteUrl } from "../lib/supabase/env";

const originalEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SITE_URL: process.env.SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  NODE_ENV: process.env.NODE_ENV,
};

function resetEnv() {
  process.env.NEXT_PUBLIC_SITE_URL = originalEnv.NEXT_PUBLIC_SITE_URL;
  process.env.SITE_URL = originalEnv.SITE_URL;
  process.env.VERCEL_PROJECT_PRODUCTION_URL =
    originalEnv.VERCEL_PROJECT_PRODUCTION_URL;
  process.env.VERCEL_URL = originalEnv.VERCEL_URL;
  process.env.NODE_ENV = originalEnv.NODE_ENV;
}

describe("getSiteUrl", () => {
  afterEach(() => {
    resetEnv();
  });

  it("uses NEXT_PUBLIC_SITE_URL when configured", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://baseoperaria.example.com";
    delete process.env.SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;

    expect(getSiteUrl("/auth/confirm?next=/onboarding")).toBe(
      "https://baseoperaria.example.com/auth/confirm?next=/onboarding",
    );
  });

  it("uses VERCEL project production URL when explicit site url is absent", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "baseoperaria.vercel.app";
    delete process.env.VERCEL_URL;

    expect(getSiteUrl("/auth/confirm")).toBe(
      "https://baseoperaria.vercel.app/auth/confirm",
    );
  });

  it("falls back to localhost only outside production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;

    expect(getSiteUrl("/auth/confirm")).toBe("http://localhost:3000/auth/confirm");
  });

  it("throws in production when no valid site url is available", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;

    expect(() => getSiteUrl("/auth/confirm")).toThrow(
      "Missing site URL in production. Configure NEXT_PUBLIC_SITE_URL or SITE_URL.",
    );
  });
});