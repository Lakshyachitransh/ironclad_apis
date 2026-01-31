import { PrismaClient } from './generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'lakshya@secnuo.com';
  const password = '1103@';
  const displayName = 'Lakshya';

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`User with email ${email} already exists`);
    return;
  }

  // Hash the password
  const salt = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create the user with platform_admin role
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      platformRoles: ['platform_admin'],
      status: 'active',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`Email: ${user.email}`);
  console.log(`Display Name: ${user.displayName}`);
  console.log(`ID: ${user.id}`);
  console.log(`Platform Roles: ${user.platformRoles.join(', ')}`);
}

main()
  .catch((error) => {
    console.error('Error creating admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
