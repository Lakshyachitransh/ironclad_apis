import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    
    // Try to get tenantId from headers, body, or query
    let tenantId = req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId;
    
    // If tenantId not found, try to get it from tenantName in body (for live-class creation)
    if (!tenantId && req.body?.tenantName) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { name: req.body.tenantName }
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    // If tenantId still not found, try to look it up from courseId (for module/lesson creation and course endpoints)
    let courseId = req.body?.courseId || req.params?.id || req.params?.courseId;
    if (!tenantId && courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { tenantId: true }
      });
      if (course) {
        tenantId = course.tenantId;
      }
    }

    // If tenantId still not found, try to look it up from liveClassId
    if (!tenantId && req.body?.liveClassId) {
      const liveClass = await this.prisma.liveClass.findUnique({
        where: { id: req.body.liveClassId },
        select: { tenantId: true }
      });
      if (liveClass) {
        tenantId = liveClass.tenantId;
      }
    }

    // If tenantId still not found, try to look it up from lessonId (for lesson endpoints)
    if (!tenantId && (req.params?.lessonId || req.body?.lessonId)) {
      const lessonId = req.params?.lessonId || req.body?.lessonId;
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { module: { select: { course: { select: { tenantId: true } } } } }
      });
      if (lesson?.module?.course?.tenantId) {
        tenantId = lesson.module.course.tenantId;
      }
    }

    // If tenantId still not found, try to look it up from moduleId
    if (!tenantId && (req.params?.moduleId || req.body?.moduleId)) {
      const moduleId = req.params?.moduleId || req.body?.moduleId;
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        select: { course: { select: { tenantId: true } } }
      });
      if (module?.course?.tenantId) {
        tenantId = module.course.tenantId;
      }
    }

    if (!user || !tenantId) throw new ForbiddenException('user or tenant missing');

    // Check if user is org_admin - if so, allow access to any tenant
    if (user.roles && Array.isArray(user.roles) && user.roles.includes('org_admin')) {
      req.user.tenantId = tenantId;
      req.user.roles = user.roles;
      return true;
    }

    // For non-org_admin users, verify they belong to the tenant
    const ut = await this.prisma.userTenant.findFirst({
      where: { userId: user.id, tenantId: String(tenantId) }
    });
    if (!ut) throw new ForbiddenException('not a member of tenant');
    const userRoles = ut.roles || [];
    const has = userRoles.some(r => requiredRoles.includes(r));
    if (!has) throw new ForbiddenException('insufficient role');
    // attach tenant context
    req.user.tenantId = tenantId;
    req.user.roles = userRoles;
    return true;
  }
}
