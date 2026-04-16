import { getMigrationFiles, isTimestampedMigrationName } from "./supabase-checks.mjs";

const migrations = await getMigrationFiles();
const invalidNames = migrations.filter((name) => !isTimestampedMigrationName(name));
const ordered = [...migrations].sort((a, b) => a.localeCompare(b));

if (invalidNames.length > 0) {
  console.error("Migrações com nome fora do padrão timestamp_sql:");
  for (const name of invalidNames) {
    console.error(`- ${name}`);
  }
  process.exitCode = 1;
}

console.log("Checklist de sync remoto do Supabase");
console.log("");
console.log("1. Confirmar login no Supabase CLI: `supabase login`");
console.log("2. Vincular o projeto remoto: `supabase link --project-ref <project-ref>`");
console.log("3. Revisar a ordem das migrations abaixo:");

for (const [index, name] of ordered.entries()) {
  console.log(`   ${index + 1}. ${name}`);
}

console.log("");
console.log("4. Aplicar as migrations no ambiente remoto: `supabase db push`");
console.log("5. Validar o ambiente remoto:");
console.log("   `npm run supabase:diagnose`");
console.log("");
console.log("Observação: o aplicativo não usa `service_role` em runtime. O acesso administrativo fica restrito ao processo de diagnóstico/operacao local.");
