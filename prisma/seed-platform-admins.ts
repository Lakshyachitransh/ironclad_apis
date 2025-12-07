/**
 * PLATFORM ADMIN SEED
 * 
 * Creates platform admin users for specified email domains
 * Users with @secnuo or @ironclad email domains are automatically platform admins
 */

import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Platform admin email domains
const PLATFORM_ADMIN_DOMAINS = ['@secnuo', '@ironclad'];

// Sample platform admin users to create
const PLATFORM_ADMIN_USERS = [
  {
    email: 'admin@secnuo',
    password: 'SecNuoAdmin123!',
    displayName: 'SecNuo Admin'
  },
  {
    email: 'admin@ironclad',
    password: 'IroncladAdmin123!',
    displayName: 'Ironclad Admin'
  },
  {
    email: 'support@ironclad',
    password: 'IroncladSupport123!',
    displayName: 'Ironclad Support'
  }
];

async function main() {
  console.log('🌱 Starting Platform Admin Seed...\n');

  try {
    // Step 1: Get the platform_admin role (used to verify it exists, not for assignment)
    console.log('📋 Checking platform_admin role...');
    const platformAdminRole = await prisma.role.findUnique({
      where: { code: 'platform_admin' }
    });

    if (!platformAdminRole) {
      console.error('❌ platform_admin role not found! Run seed-simplified-rbac.ts first.');
      process.exit(1);
    }
    console.log(`✅ Found platform_admin role\n`);

    // Step 2: Create platform admin users
    console.log('👥 Creating platform admin users...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const adminUser of PLATFORM_ADMIN_USERS) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: adminUser.email }
      });

      if (existing) {
        console.log(`⏭️  Skipped ${adminUser.email} (already exists)`);
        skippedCount++;
        continue;
      }

      // Hash password
      const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      const passwordHash = await bcrypt.hash(adminUser.password, salt);

      // Create user with platform_admin role
      const user = await prisma.user.create({
        data: {
          email: adminUser.email,
          displayName: adminUser.displayName,
          passwordHash,
          status: 'active',
          platformRoles: ['platform_admin']  // Directly assign platform_admin role
        }
      });

      console.log(`✅ Created platform admin: ${adminUser.email}`);
      createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`  • Created: ${createdCount} users`);
    console.log(`  • Skipped: ${skippedCount} users (already exist)`);
    console.log(`  • Role assigned: platform_admin`);
    console.log(`\n✨ Platform admin users seeded successfully!`);

  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
