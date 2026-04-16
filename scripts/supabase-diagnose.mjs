import postgres from "postgres";

import {
  expectedBuckets,
  expectedPolicies,
  expectedPublicTables,
} from "./supabase-checks.mjs";

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Defina SUPABASE_DB_URL ou DATABASE_URL com a string de conexão do banco remoto para executar o diagnóstico.",
  );
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 1,
  ssl: "require",
});

function okLabel(value) {
  return value ? "OK" : "FALHA";
}

async function tableExists(schema, table) {
  const rows = await sql`
    select
      exists (
        select 1
        from information_schema.tables
        where table_schema = ${schema}
          and table_name = ${table}
      ) as exists,
      coalesce((
        select c.relrowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = ${schema}
          and c.relname = ${table}
          and c.relkind = 'r'
      ), false) as rls_enabled
  `;

  return rows[0] ?? { exists: false, rls_enabled: false };
}

async function bucketStatus(bucketId) {
  const rows = await sql`
    select public as is_public
    from storage.buckets
    where id = ${bucketId}
  `;

  return rows[0] ?? { is_public: null };
}

async function policyExists(schema, table, policy) {
  const rows = await sql`
    select exists (
      select 1
      from pg_policies
      where schemaname = ${schema}
        and tablename = ${table}
        and policyname = ${policy}
    ) as exists
  `;

  return Boolean(rows[0]?.exists);
}

const missingTables = [];
const missingRls = [];
for (const table of expectedPublicTables) {
  const result = await tableExists("public", table);
  const exists = Boolean(result.exists);
  const rlsEnabled = Boolean(result.rls_enabled);

  if (!exists) {
    missingTables.push(`public.${table}`);
  }

  if (!rlsEnabled) {
    missingRls.push(`public.${table}`);
  }
}

const bucketProblems = [];
for (const bucket of expectedBuckets) {
  const status = await bucketStatus(bucket.id);
  if (status.is_public === null) {
    bucketProblems.push(`${bucket.id} ausente`);
    continue;
  }

  if (bucket.isPrivate && status.is_public) {
    bucketProblems.push(`${bucket.id} está público`);
  }
}

const missingPolicies = [];
for (const policy of expectedPolicies) {
  const found = await policyExists(policy.schema, policy.table, policy.policy);
  if (!found) {
    missingPolicies.push(`${policy.schema}.${policy.table} -> ${policy.policy}`);
  }
}

console.log("Diagnóstico remoto do Supabase");
console.log("");
console.log("Tabelas principais:");
if (missingTables.length === 0) {
  console.log(`- ${okLabel(true)} todas as tabelas principais existem`);
} else {
  console.log(`- ${okLabel(false)} tabelas ausentes`);
  for (const item of missingTables) {
    console.log(`  - ${item}`);
  }
}

console.log("");
console.log("RLS:");
if (missingRls.length === 0) {
  console.log(`- ${okLabel(true)} RLS habilitado em todas as tabelas principais`);
} else {
  console.log(`- ${okLabel(false)} RLS ausente em:`);
  for (const item of missingRls) {
    console.log(`  - ${item}`);
  }
}

console.log("");
console.log("Buckets privados:");
if (bucketProblems.length === 0) {
  console.log(`- ${okLabel(true)} buckets privados esperados presentes`);
} else {
  console.log(`- ${okLabel(false)} problemas em buckets:`);
  for (const item of bucketProblems) {
    console.log(`  - ${item}`);
  }
}

console.log("");
console.log("Policies mínimas:");
if (missingPolicies.length === 0) {
  console.log(`- ${okLabel(true)} policies mínimas encontradas`);
} else {
  console.log(`- ${okLabel(false)} policies ausentes:`);
  for (const item of missingPolicies) {
    console.log(`  - ${item}`);
  }
}

console.log("");
const hasFailures =
  missingTables.length > 0 || missingRls.length > 0 || bucketProblems.length > 0 || missingPolicies.length > 0;

if (hasFailures) {
  console.error("Diagnóstico final: FALHA");
  process.exitCode = 1;
} else {
  console.log("Diagnóstico final: OK");
}

await sql.end({ timeout: 5 });
