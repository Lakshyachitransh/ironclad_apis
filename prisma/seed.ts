// prisma/seed.ts
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const app = await prisma.application.upsert({
    where: { code: 'LMS' },
    update: {},
    create: { code: 'LMS', name: 'Learning Management System' }
  });

  const platform = await prisma.tenant.upsert({
    where: { name: 'platform' },
    update: {},
    create: { name: 'platform' }
  });

  const adminEmail = 'admin@ironclad.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash('ChangeMe123!', saltRounds);
    const u = await prisma.user.create({ data: { email: adminEmail, passwordHash: hash, displayName: 'Platform Admin' } });
    await prisma.userTenant.create({ data: { userId: u.id, tenantId: platform.id, roles: ['superadmin','platform_admin'] } });
    console.log('Created admin:', adminEmail, 'password ChangeMe123!');
  } else {
    console.log('Admin already exists.');
  }
}
main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
