import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'lakshya@secnuo.com';
  const password = '1103@';
  const displayName = 'Lakshya';

  console.log('🔐 Creating admin user...');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Display Name: ${displayName}`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ User with email ${email} already exists!`);
      console.log(`ID: ${existingUser.id}`);
      console.log(`Roles: ${existingUser.platformRoles.join(', ')}`);
      process.exit(0);
    }

    // Hash the password with bcrypt
    console.log('🔒 Hashing password...');
    const salt = 12;
    const passwordHash = await bcrypt.hash(password, salt);
    console.log(`✓ Password hashed (salt rounds: ${salt})`);

    // Create the user
    console.log('💾 Saving to database...');
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        platformRoles: ['platform_admin'],
        status: 'active',
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Platform Roles: ${user.platformRoles.join(', ')}`);
    console.log(`   Password Hash: ${passwordHash.substring(0, 20)}...`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
