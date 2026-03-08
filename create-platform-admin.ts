import { PrismaClient } from './generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'lakshya@secnuo.com';
  const password = '1103@';
  const displayName = 'Lakshya';
  const platformRole = 'platform_admin';

  // Check if user already exists
  const existing = await prisma.platformUser.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Platform user with email ${email} already exists`);
    console.log(`ID: ${existing.id}`);
    console.log(`Roles: ${existing.platformRoles.join(', ')}`);
    return;
  }

  // Verify platform_admin role exists
  const roleExists = await prisma.role.findUnique({
    where: { code: platformRole },
  });

  if (!roleExists) {
    console.error(`❌ Role "${platformRole}" does not exist in the database`);
    process.exit(1);
  }

  // Hash the password
  const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create the platform user with platform_admin role
  const user = await prisma.platformUser.create({
    data: {
      email,
      passwordHash,
      displayName,
      platformRoles: [platformRole],
      status: 'active',
    },
  });

  console.log('✅ Platform admin user created successfully!');
  console.log(`Email: ${user.email}`);
  console.log(`Display Name: ${user.displayName}`);
  console.log(`ID: ${user.id}`);
  console.log(`Platform Roles: ${user.platformRoles.join(', ')}`);
  console.log(`Status: ${user.status}`);
  console.log(`Created At: ${user.createdAt}`);
}

main()
  .catch((error) => {
    console.error('❌ Error creating platform admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
