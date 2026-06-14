// Zugang zur /admin-Seite per Code (serverseitig geprüft).
// Optional über Env überschreibbar: ADMIN_CODE=...
const ADMIN_CODE = process.env.ADMIN_CODE || '100531'

// Empfänger der "Testmail an mich" (kein Login nötig → feste Adresse).
export const ADMIN_TEST_EMAIL = process.env.ADMIN_TEST_EMAIL || 'dschreiner103@gmail.com'

// Prüft den vom Client gesendeten Code (Header x-admin-code).
export function checkAdminCode(code) {
  return !!code && String(code).trim() === ADMIN_CODE
}
