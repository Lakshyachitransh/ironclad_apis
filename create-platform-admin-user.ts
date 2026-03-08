import { PrismaClient } from './generated/prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const email = 'arvind.chauhan@secnuo.com';
  const password = 'SecNuo@123!'; // Generate random password
  const displayName = 'Arvind Chauhan';

  console.log('🌱 Creating Platform Admin User...\n');

  try {
    // Check if user already exists in PlatformUser table
    const existing = await prisma.platformUser.findUnique({
      where: { email }
    });

    if (existing) {
      console.log(`⏭️  User ${email} already exists`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Display Name: ${existing.displayName}`);
      console.log(`   Status: ${existing.status}`);
      console.log(`   Platform Roles: ${existing.platformRoles?.join(', ') || 'none'}`);
      process.exit(0);
    }

    // Hash password
    const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create platform admin user in PlatformUser table
    const user = await prisma.platformUser.create({
      data: {
        email,
        displayName,
        passwordHash,
        status: 'active',
        platformRoles: ['platform_admin']
      }
    });

    console.log(`✅ Platform Admin Created Successfully!\n`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Display Name: ${user.displayName}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🎭 Roles: ${user.platformRoles?.join(', ')}`);
    console.log(`✨ Status: ${user.status}`);
    console.log(`\n⚠️  Save the password securely. Share with user immediately.`);

  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
