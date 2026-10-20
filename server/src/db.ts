import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));

type QueryResult<T> = { rows: T[] };

interface AppDatabase {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
}

function postgresDatabase(connectionString: string): AppDatabase {
  const ssl = /sslmode=require/i.test(connectionString) ? { rejectUnauthorized: false as const } : undefined;
  const pool = new pg.Pool({ connectionString, ssl });
  return {
    async query<T>(sql: string, params?: readonly unknown[]) {
      const result = params ? await pool.query(sql, params as unknown[]) : await pool.query(sql);
      return { rows: result.rows as T[] };
    },
    async exec(sql: string) {
      await pool.query(sql);
    },
  };
}

function localDatabase(): AppDatabase {
  const file = new PGlite(path.join(here, '..', 'data'));
  return {
    query: (sql, params) => file.query(sql, params as never[] | undefined),
    async exec(sql: string) {
      await file.exec(sql);
    },
  };
}

const databaseUrl = process.env.DATABASE_URL?.trim();

export const db: AppDatabase = databaseUrl ? postgresDatabase(databaseUrl) : localDatabase();

export const seedDemo = process.env.SEED_DEMO !== 'false';

export async function migrate(): Promise<void> {
  const sql = readFileSync(path.join(here, 'schema.sql'), 'utf8');
  await db.exec(sql);
}
