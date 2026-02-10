#!/usr/bin/env tsx
/**
 * Admin User Initialization Script
 * Creates or resets the admin user account using ENV vars
 * Usage: npm run reset-admin
 * ENV vars: INIT_ADMIN_USERNAME, INIT_ADMIN_PASSWORD
 */

import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth-utils';
import { Role } from '../app/generated/prisma';

async function initAdmin() {
  const username = process.env.INIT_ADMIN_USERNAME || 'admin';
  const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';

  console.log('\n🔧 Initializing admin user...\n');

  try {
    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.upsert({
      where: { username },
      update: {
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        totpEnabled: false,
        totpSecret: null,
      },
      create: {
        username,
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        totpEnabled: false,
      },
    });

    console.log(`✅ Admin user created/updated: ${admin.username}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    console.log(`📍 Login at: ${process.env.NEXTAUTH_URL || 'https://hyfern.us'}/login\n`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

initAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
