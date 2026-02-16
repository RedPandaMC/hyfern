#!/usr/bin/env node
/**
 * Admin User Initialization Script (self-contained ESM)
 * Creates or resets the admin user account using ENV vars.
 * Uses better-sqlite3 for SQLite database.
 * ENV vars: INIT_ADMIN_USERNAME, INIT_ADMIN_PASSWORD, DATABASE_URL
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALT_ROUNDS = 12;

async function initAdmin() {
  const username = process.env.INIT_ADMIN_USERNAME || 'admin';
  const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Extract file path from DATABASE_URL (format: file:/path/to/file.db)
  let dbPath = databaseUrl;
  if (databaseUrl.startsWith('file:')) {
    dbPath = databaseUrl.substring(5);
  }

  console.log('\nInitializing admin user...\n');
  console.log(`Database path: ${dbPath}`);

  const db = new Database(dbPath);

  try {
    // Ensure tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'VIEWER',
        "totpSecret" TEXT,
        "totpEnabled" INTEGER NOT NULL DEFAULT 0,
        "recoveryCodes" TEXT DEFAULT '[]',
        "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
        "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "expiresAt" TEXT NOT NULL,
        "lastActiveAt" TEXT NOT NULL DEFAULT (datetime('now')),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS installed_mods (
        id TEXT PRIMARY KEY,
        "curseforgeId" INTEGER UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        version TEXT NOT NULL,
        "fileName" TEXT UNIQUE NOT NULL,
        "installedAt" TEXT NOT NULL DEFAULT (datetime('now')),
        "installedBy" TEXT NOT NULL REFERENCES users(id),
        "isCore" INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS login_attempts (
        id TEXT PRIMARY KEY,
        "ipAddress" TEXT NOT NULL,
        success INTEGER NOT NULL,
        "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const id = randomBytes(12).toString('hex');
    const now = new Date().toISOString();

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

    if (existingUser) {
      // Update existing user
      db.prepare(`
        UPDATE users SET
          "passwordHash" = ?,
          role = 'ADMIN',
          "totpEnabled" = 0,
          "totpSecret" = NULL,
          "updatedAt" = ?
        WHERE username = ?
      `).run(hashedPassword, now, username);
      console.log(`Admin user updated: ${username}`);
    } else {
      // Insert new user
      db.prepare(`
        INSERT INTO users (id, username, "passwordHash", role, "totpEnabled", "createdAt", "updatedAt")
        VALUES (?, ?, ?, 'ADMIN', 0, ?, ?)
      `).run(id, username, hashedPassword, now, now);
      console.log(`Admin user created: ${username}`);
    }

    console.log(`Password: ${password}`);
    console.log('\nIMPORTANT: Change this password after first login!\n');
    console.log(`Login at: ${process.env.NEXTAUTH_URL || 'https://hyfern.us'}/login\n`);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
