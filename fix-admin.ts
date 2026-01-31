import { PrismaClient } from './generated/prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete existing admin user and all associations
    const adminEmail = 'admin@ironclad.local';
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (admin) {
      // Delete all UserTenant associations
      await prisma.userTenant.deleteMany({ where: { userId: admin.id } });
      // Delete the user
      await prisma.user.delete({ where: { id: admin.id } });
      console.log('❌ Deleted existing admin user');
    }
    
    // Create new admin with platform roles only (no tenant)
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash('Admin@123456', saltRounds);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        displayName: 'Platform Admin',
        platformRoles: ['superadmin', 'platform_admin'],
        status: 'active'
      }
    });
    
    console.log('✅ Platform admin created (no tenant association)');
    console.log('   Email: admin@ironclad.local');
    console.log('   Password: Admin@123456');
    console.log('   platformRoles: superadmin, platform_admin');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
