#!/usr/bin/env node
/**
 * Admin User Initialization Script (self-contained ESM)
 * Creates or resets the admin user account using ENV vars.
 * Runs with plain `node` — no tsx/TypeScript needed.
 * ENV vars: INIT_ADMIN_USERNAME, INIT_ADMIN_PASSWORD, DATABASE_URL
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;

async function initAdmin() {
  const username = process.env.INIT_ADMIN_USERNAME || 'admin';
  const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('\nInitializing admin user...\n');

  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const id = randomBytes(12).toString('hex');

    // Upsert: insert or update if username already exists
    const result = await client.query(
      `INSERT INTO users (id, username, "passwordHash", role, "totpEnabled", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'ADMIN', false, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET
         "passwordHash" = $3,
         role = 'ADMIN',
         "totpEnabled" = false,
         "totpSecret" = NULL,
         "updatedAt" = NOW()
       RETURNING username`,
      [id, username, hashedPassword]
    );

    console.log(`Admin user created/updated: ${result.rows[0].username}`);
    console.log(`Password: ${password}`);
    console.log('\nIMPORTANT: Change this password after first login!\n');
    console.log(`Login at: ${process.env.NEXTAUTH_URL || 'https://hyfern.us'}/login\n`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
