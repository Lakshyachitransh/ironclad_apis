import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLicenseDto, UpdateLicenseDto, AssignLicenseUserDto, RevokeLicenseUserDto, CreateApplicationDto, UpdateApplicationDto, CreateApplicationFeatureDto } from './dto/create-license.dto';

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // Application Management (Org Admin)
  // ============================================================================

  async createApplication(dto: CreateApplicationDto): Promise<any> {
    // Check if application code already exists
    const existing = await this.prisma.application.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException('Application code already exists');
    }

    const application = await this.prisma.application.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
      },
    });

    return application;
  }

  async updateApplication(applicationId: string, dto: UpdateApplicationDto): Promise<any> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: dto,
      include: { features: true },
    });
  }

  async getApplications(): Promise<any[]> {
    return this.prisma.application.findMany({
      include: { features: true, licenses: true },
      orderBy: { name: 'asc' },
    });
  }

  async getApplication(applicationId: string): Promise<any> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { features: true, licenses: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  // ============================================================================
  // Application Features (Org Admin)
  // ============================================================================

  async addFeature(applicationId: string, dto: CreateApplicationFeatureDto): Promise<any> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if feature already exists
    const existingFeature = await this.prisma.applicationFeature.findUnique({
      where: { applicationId_code: { applicationId, code: dto.code } },
    });

    if (existingFeature) {
      throw new BadRequestException('Feature code already exists for this application');
    }

    return this.prisma.applicationFeature.create({
      data: {
        applicationId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async getApplicationFeatures(applicationId: string): Promise<any[]> {
    return this.prisma.applicationFeature.findMany({
      where: { applicationId },
      orderBy: { name: 'asc' },
    });
  }

  // ============================================================================
  // License Management (Org Admin)
  // ============================================================================

  async createLicense(tenantId: string, dto: CreateLicenseDto, createdBy: string): Promise<any> {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Verify application exists
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if license already exists for this tenant-app combo
    const existingLicense = await this.prisma.tenantApplicationLicense.findUnique({
      where: { tenant_app_license: { tenantId, applicationId: dto.applicationId } },
    });

    if (existingLicense) {
      throw new BadRequestException('License already exists for this tenant and application');
    }

    const license = await this.prisma.tenantApplicationLicense.create({
      data: {
        tenantId,
        applicationId: dto.applicationId,
        plan: dto.plan,
        maxSeats: dto.maxSeats,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        autoRenew: dto.autoRenew ?? false,
        notes: dto.notes,
        createdBy,
      },
      include: { application: true, licenseUsers: true },
    });

    // Create audit log
    await this.createAuditLog(tenantId, license.id, 'create', JSON.stringify(dto), createdBy);

    return license;
  }

  async updateLicense(tenantId: string, licenseId: string, dto: UpdateLicenseDto, updatedBy: string): Promise<any> {
    // Verify license exists and belongs to tenant
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
      include: { application: true, licenseUsers: true },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    const updated = await this.prisma.tenantApplicationLicense.update({
      where: { id: licenseId },
      data: {
        plan: dto.plan ?? license.plan,
        maxSeats: dto.maxSeats ?? license.maxSeats,
        endDate: dto.endDate ? new Date(dto.endDate) : license.endDate,
        autoRenew: dto.autoRenew ?? license.autoRenew,
        notes: dto.notes ?? license.notes,
        status: dto.status ?? license.status,
        updatedAt: new Date(),
      },
      include: { application: true, licenseUsers: true },
    });

    // Create audit log
    await this.createAuditLog(tenantId, licenseId, 'update', JSON.stringify(dto), updatedBy);

    return updated;
  }

  async getTenantLicenses(tenantId: string): Promise<any[]> {
    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenantApplicationLicense.findMany({
      where: { tenantId },
      include: { application: true, licenseUsers: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLicense(tenantId: string, licenseId: string): Promise<any> {
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
      include: { application: true, licenseUsers: true },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    // Check if license is expired
    if (license.endDate && new Date() > license.endDate) {
      return {
        ...license,
        status: 'expired',
      };
    }

    return license;
  }

  async renewLicense(tenantId: string, licenseId: string, newEndDate: string, renewedBy: string): Promise<any> {
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    const updated = await this.prisma.tenantApplicationLicense.update({
      where: { id: licenseId },
      data: {
        endDate: new Date(newEndDate),
        updatedAt: new Date(),
      },
      include: { application: true, licenseUsers: true },
    });

    // Create audit log
    await this.createAuditLog(tenantId, licenseId, 'renew', JSON.stringify({ newEndDate }), renewedBy);

    return updated;
  }

  async suspendLicense(tenantId: string, licenseId: string, reason: string, suspendedBy: string): Promise<any> {
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    const updated = await this.prisma.tenantApplicationLicense.update({
      where: { id: licenseId },
      data: {
        status: 'suspended',
        updatedAt: new Date(),
      },
      include: { application: true, licenseUsers: true },
    });

    // Create audit log
    await this.createAuditLog(tenantId, licenseId, 'suspend', reason, suspendedBy);

    return updated;
  }

  // ============================================================================
  // License User Management (Org Admin / Training Manager)
  // ============================================================================

  async assignLicenseToUser(tenantId: string, licenseId: string, dto: AssignLicenseUserDto, assignedBy: string): Promise<any> {
    // Verify license exists and belongs to tenant
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
      include: { licenseUsers: true },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    // Check if user already has this license
    const existingAssignment = await this.prisma.licenseUser.findUnique({
      where: { license_user_unique: { licenseId, userId: dto.userId } },
    });

    if (existingAssignment) {
      throw new BadRequestException('User already has this license assigned');
    }

    // Check seat availability
    if (license.currentSeats >= license.maxSeats) {
      throw new BadRequestException(`Maximum seats (${license.maxSeats}) reached for this license`);
    }

    const licenseUser = await this.prisma.licenseUser.create({
      data: {
        licenseId,
        userId: dto.userId,
      },
    });

    // Update current seats count
    await this.prisma.tenantApplicationLicense.update({
      where: { id: licenseId },
      data: { currentSeats: { increment: 1 } },
    });

    // Create audit log
    await this.createAuditLog(tenantId, licenseId, 'assign', JSON.stringify({ userId: dto.userId }), assignedBy);

    return licenseUser;
  }

  async revokeLicenseFromUser(tenantId: string, licenseId: string, dto: RevokeLicenseUserDto, revokedBy: string): Promise<any> {
    // Verify license exists and belongs to tenant
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    // Find and update the license user
    const licenseUser = await this.prisma.licenseUser.findUnique({
      where: { license_user_unique: { licenseId, userId: dto.userId } },
    });

    if (!licenseUser) {
      throw new NotFoundException('User license assignment not found');
    }

    const updated = await this.prisma.licenseUser.update({
      where: { id: licenseUser.id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });

    // Update current seats count
    await this.prisma.tenantApplicationLicense.update({
      where: { id: licenseId },
      data: { currentSeats: { decrement: 1 } },
    });

    // Create audit log
    await this.createAuditLog(tenantId, licenseId, 'revoke', JSON.stringify({ userId: dto.userId, reason: dto.reason }), revokedBy);

    return updated;
  }

  async getLicenseUsers(tenantId: string, licenseId: string): Promise<any[]> {
    // Verify license exists and belongs to tenant
    const license = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license || license.tenantId !== tenantId) {
      throw new NotFoundException('License not found or access denied');
    }

    return this.prisma.licenseUser.findMany({
      where: { licenseId },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getUserLicenses(tenantId: string, userId: string): Promise<any[]> {
    return this.prisma.licenseUser.findMany({
      where: {
        userId,
        license: { tenantId },
      },
      include: { license: { include: { application: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async checkUserLicenseAccess(tenantId: string, userId: string, applicationId: string): Promise<boolean> {
    const license = await this.prisma.licenseUser.findFirst({
      where: {
        userId,
        license: {
          tenantId,
          applicationId,
          status: 'active',
        },
      },
    });

    if (!license) {
      return false;
    }

    // Check if license is active and not revoked
    if (license.status !== 'active') {
      return false;
    }

    // Check if license is expired
    const licenseData = await this.prisma.tenantApplicationLicense.findUnique({
      where: { id: license.licenseId },
    });

    if (licenseData.endDate && new Date() > licenseData.endDate) {
      return false;
    }

    return true;
  }

  // ============================================================================
  // License Statistics and Usage
  // ============================================================================

  async getLicenseUsageStats(tenantId: string): Promise<any> {
    const licenses = await this.prisma.tenantApplicationLicense.findMany({
      where: { tenantId },
      include: { application: true, licenseUsers: true },
    });

    const stats = {
      totalLicenses: licenses.length,
      activeLicenses: licenses.filter(l => l.status === 'active').length,
      expiredLicenses: licenses.filter(l => new Date() > (l.endDate || new Date('2099-12-31'))).length,
      suspendedLicenses: licenses.filter(l => l.status === 'suspended').length,
      totalSeatsUsed: licenses.reduce((acc, l) => acc + l.currentSeats, 0),
      totalSeatsAvailable: licenses.reduce((acc, l) => acc + l.maxSeats, 0),
      licenses: licenses.map(l => ({
        id: l.id,
        application: l.application.name,
        plan: l.plan,
        status: l.status,
        seatsUsed: l.currentSeats,
        seatsAvailable: l.maxSeats,
        seatUtilization: ((l.currentSeats / l.maxSeats) * 100).toFixed(2) + '%',
        expiresAt: l.endDate,
        userCount: l.licenseUsers.length,
      })),
    };

    return stats;
  }

  async getLicenseAuditLog(tenantId: string, licenseId?: string): Promise<any[]> {
    return this.prisma.licenseAudit.findMany({
      where: {
        tenantId,
        ...(licenseId && { licenseId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  private async createAuditLog(tenantId: string, licenseId: string, action: string, details: string, performedBy: string): Promise<void> {
    await this.prisma.licenseAudit.create({
      data: {
        tenantId,
        licenseId,
        action,
        details,
        performedBy,
      },
    });
  }
}
