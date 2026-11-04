/**
 * Server-side recovery tool (needs access to the server machine / database URL; never exposed over HTTP).
 *   npm run admin:reset   → issues a new one-time Super Admin password (must be changed at next sign-in)
 * For a hosted Postgres database, run it with DATABASE_URL set to that database.
 */
import { getDb, type UserRow } from './db.ts';
import { revokeUserSessions } from './auth.ts';
import { clearLoginFailures, generatePassword, hashPassword } from './security.ts';

if (process.argv[2] !== 'reset-admin') {
  console.log('Usage: npm run admin:reset');
  process.exit(1);
}
const db = await getDb();
const admin = await db.get<UserRow>("SELECT * FROM users WHERE role = 'admin'");
if (!admin) {
  console.log('No Super Admin exists yet — start the server once to create it.');
  process.exit(0);
}
const pw = generatePassword(18);
const now = Date.now();
await db.run('UPDATE users SET password_hash = ?, must_change_password = 1, active = 1, password_changed_at = ?, updated_at = ? WHERE id = ?', [
  await hashPassword(pw),
  now,
  now,
  admin.id,
]);
await revokeUserSessions(admin.id);
await clearLoginFailures(admin.username, true);
console.log(`\nSuper Admin password reset.\n  Username: ${admin.username}\n  One-time password: ${pw}\nSign in at /#/admin/login; you will be asked to choose a new password.\n`);
process.exit(0);
