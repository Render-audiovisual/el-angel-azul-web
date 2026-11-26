// `npm test` lo carga con `node --test --import` antes de cada archivo de test.
// Así una variable real exportada en la terminal (base de Supabase, Resend,
// claves del admin) nunca llega a los tests. Cada test define después sus
// propios valores ficticios.
const SECRETAS = /^(DATABASE_URL|SUPABASE_|RESEND_|EAA_EMAIL_|EAA_POSTGRES_|GOOGLE_|EAA_.*PASSWORD)/;

for (const key of Object.keys(process.env)) {
  if (SECRETAS.test(key)) delete process.env[key];
}
