import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async createTenant(name: string) {
    return this.prisma.tenant.create({ data: { name }});
  }

  async getTenant(id: string) {
    return this.prisma.tenant.findUnique({ where: { id }});
  }

  async getTenantByName(name: string) {
    return this.prisma.tenant.findUnique({ where: { name }});
  }

  async getAllTenant(){
    return this.prisma.tenant.findMany()
  }
}

