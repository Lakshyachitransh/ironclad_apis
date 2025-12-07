#!/usr/bin/env node

/**
 * Diagnostic script to check permission categories
 * Usage: node check-permission-categories.js
 */

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Fetching all permissions...\n');

    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        code: true,
        category: true,
        name: true,
      },
      orderBy: { category: 'asc' },
    });

    console.log(`✅ Found ${permissions.length} permissions\n`);

    // Group by category
    const categories = {};
    permissions.forEach((p) => {
      if (!categories[p.category]) {
        categories[p.category] = [];
      }
      categories[p.category].push({ code: p.code, name: p.name });
    });

    // Display categories
    console.log('📋 Categories Found:\n');
    Object.keys(categories).sort().forEach((cat) => {
      console.log(`   ▸ "${cat}" (${categories[cat].length} permissions)`);
      categories[cat].forEach((p) => {
        console.log(`     • ${p.code} - ${p.name}`);
      });
      console.log();
    });

    // Check for spaces or special characters
    console.log('🔎 Category Analysis:\n');
    Object.keys(categories).forEach((cat) => {
      const hasLeadingSpace = cat !== cat.trimStart();
      const hasTrailingSpace = cat !== cat.trimEnd();
      const hasMixedCase = cat !== cat.toLowerCase();
      
      console.log(`   Category: "${cat}"`);
      console.log(`   • Length: ${cat.length}`);
      console.log(`   • Has leading space: ${hasLeadingSpace}`);
      console.log(`   • Has trailing space: ${hasTrailingSpace}`);
      console.log(`   • Mixed case: ${hasMixedCase}`);
      console.log(`   • Bytes: ${Buffer.from(cat).toString('hex')}`);
      console.log();
    });

    // Test query for live-class
    console.log('🧪 Testing "live-class" query:\n');
    
    const testQueries = [
      'live-class',
      'live-class',
      'Live-Class',
      'LIVE-CLASS',
      ' live-class',
      'live-class ',
      ' live-class ',
    ];

    for (const query of testQueries) {
      const results = await prisma.permission.findMany({
        where: {
          category: {
            equals: query,
            mode: 'insensitive',
          },
        },
      });
      console.log(`   Query "${query}": ${results.length} results`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
