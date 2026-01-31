import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create platform tenant
    const platform = await prisma.tenant.upsert({
      where: { name: 'platform' },
      update: {},
      create: { name: 'platform' }
    });
    console.log('✅ Platform tenant created/found');

    // 2. Create admin user
    const adminEmail = 'admin@ironclad.local';
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!existing) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      const hash = await bcrypt.hash('Admin@123456', saltRounds);
      
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: hash,
          displayName: 'Platform Admin',
          platformRoles: ['superadmin', 'platform_admin'],
          status: 'active'
        }
      });

      console.log('✅ Admin user created');
      console.log('   Email: admin@ironclad.local');
      console.log('   Password: Admin@123456');
    } else {
      console.log('✅ Admin user already exists');
    }

    // 3. Create permissions with correct schema
    const permissions = [
      // Auth
      { code: 'auth.register', name: 'Register', resource: 'auth', action: 'register', category: 'auth' },
      { code: 'auth.login', name: 'Login', resource: 'auth', action: 'login', category: 'auth' },
      
      // Users
      { code: 'users.create', name: 'Create user', resource: 'users', action: 'create', category: 'users' },
      { code: 'users.list', name: 'List users', resource: 'users', action: 'list', category: 'users' },
      { code: 'users.view', name: 'View user', resource: 'users', action: 'view', category: 'users' },
      { code: 'users.update', name: 'Update user', resource: 'users', action: 'update', category: 'users' },
      { code: 'users.delete', name: 'Delete user', resource: 'users', action: 'delete', category: 'users' },
      
      // Courses
      { code: 'courses.create', name: 'Create course', resource: 'courses', action: 'create', category: 'courses' },
      { code: 'courses.list', name: 'List courses', resource: 'courses', action: 'list', category: 'courses' },
      { code: 'courses.view', name: 'View course', resource: 'courses', action: 'view', category: 'courses' },
      { code: 'courses.update', name: 'Update course', resource: 'courses', action: 'update', category: 'courses' },
      { code: 'courses.delete', name: 'Delete course', resource: 'courses', action: 'delete', category: 'courses' },
      
      // Exercises
      { code: 'exercises.create', name: 'Create exercise', resource: 'exercises', action: 'create', category: 'exercises' },
      { code: 'exercises.list', name: 'List exercises', resource: 'exercises', action: 'list', category: 'exercises' },
      { code: 'exercises.view', name: 'View exercise', resource: 'exercises', action: 'view', category: 'exercises' },
      { code: 'exercises.submit', name: 'Submit exercise', resource: 'exercises', action: 'submit', category: 'exercises' },
      
      // Admin
      { code: 'admin.manage', name: 'Admin access', resource: 'admin', action: 'manage', category: 'admin' },
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: perm
      });
    }
    console.log('✅ Permissions created/updated');

    // 4. Create superadmin role
    const superAdminRole = await prisma.role.upsert({
      where: { code: 'superadmin' },
      update: {},
      create: {
        code: 'superadmin',
        name: 'Super Administrator',
        description: 'Platform super admin with all permissions',
        isSystem: true,
        category: 'system'
      }
    });
    console.log('✅ Super admin role created/found');

    // 5. Assign all permissions to superadmin role
    const allPermissions = await prisma.permission.findMany();
    
    // First delete existing role permissions for superadmin
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id }
    });

    // Then create new ones
    for (const perm of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: perm.id
        }
      });
    }
    console.log('✅ Permissions assigned to superadmin role');

    console.log('\n🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
