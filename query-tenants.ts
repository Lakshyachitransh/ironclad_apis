import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: { 
        id: true, 
        name: true, 
        status: true, 
        createdAt: true 
      }
    });
    console.log('\n📍 Available Tenants:\n');
    console.table(tenants);
  } finally {
    await prisma.$disconnect();
  }
}

getTenants();
