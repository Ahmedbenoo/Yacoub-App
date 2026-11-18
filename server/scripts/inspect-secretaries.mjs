import { db } from '../src/db.ts';

const users = await db.query(
  `SELECT id, first_name, last_name, phone FROM users WHERE id LIKE '%secretary%' OR first_name LIKE '%مصطفى%'`,
);
console.log('users', users.rows);

const mem = await db.query(`SELECT user_id, clinic_id, role FROM memberships WHERE role = 'secretary'`);
console.log('secretary memberships', mem.rows);

const clinics = await db.query(
  `SELECT id, name, name_ar, owner_user_id FROM clinics WHERE name ILIKE '%dental%' OR name_ar ILIKE '%dental%' OR name LIKE '%مركز%'`,
);
console.log('clinics', clinics.rows);

process.exit(0);
