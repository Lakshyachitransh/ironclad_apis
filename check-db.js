const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== Checking database permissions ===\n');
    
    // Count permissions
    const count = await prisma.permission.count();
    console.log('Total permissions:', count);
    
    // Get all unique categories
    const perms = await prisma.permission.findMany({
      select: { category: true }
    });
    
    const categories = [...new Set(perms.map(p => p.category))];
    console.log('\nAll unique categories in DB:', categories);
    
    // Check for 'courses' specifically
    const courses = await prisma.permission.findMany({
      where: { category: 'courses' }
    });
    console.log('\nPermissions with category = "courses":', courses.length);
    
    // Show a few examples
    if (courses.length > 0) {
      console.log('Sample:', courses.slice(0, 2).map(c => ({ code: c.code, category: c.category })));
    }
    
    // Check raw SQL
    const result = await prisma.$queryRaw`SELECT DISTINCT category FROM "Permission" ORDER BY category`;
    console.log('\nRaw SQL DISTINCT categories:', result.map(r => r.category));
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
