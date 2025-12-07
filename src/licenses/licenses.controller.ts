import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CreateLicenseDto, UpdateLicenseDto, AssignLicenseUserDto, RevokeLicenseUserDto, CreateApplicationDto, UpdateApplicationDto, CreateApplicationFeatureDto } from './dto/create-license.dto';

@ApiTags('licenses')
@ApiBearerAuth('access-token')
@Controller('licenses')
export class LicensesController {
  constructor(private licensesService: LicensesService) {}

  // ============================================================================
  // Application Management Endpoints (Org Admin Only)
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new application',
    description: 'Create a new application that can be licensed to tenants. Only org admins can perform this action.'
  })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Application code already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createApplication(
    @Request() req,
    @Body() dto: CreateApplicationDto
  ): Promise<any> {
    return this.licensesService.createApplication(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('applications')
  @ApiOperation({ 
    summary: 'List all applications',
    description: 'Retrieve all applications in the system with their features.'
  })
  @ApiResponse({ status: 200, description: 'List of applications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getApplications(): Promise<any[]> {
    return this.licensesService.getApplications();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('applications/:applicationId')
  @ApiOperation({ 
    summary: 'Get application details',
    description: 'Retrieve detailed information about a specific application.'
  })
  @ApiParam({ name: 'applicationId', type: String, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application details' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getApplication(
    @Request() req,
    @Param('applicationId') applicationId: string
  ): Promise<any> {
    return this.licensesService.getApplication(applicationId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Patch('applications/:applicationId')
  @ApiOperation({ 
    summary: 'Update application',
    description: 'Update application information.'
  })
  @ApiParam({ name: 'applicationId', type: String, description: 'Application ID' })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async updateApplication(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateApplicationDto
  ): Promise<any> {
    return this.licensesService.updateApplication(applicationId, dto);
  }

  // ============================================================================
  // Application Features Endpoints (Org Admin Only)
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('applications/:applicationId/features')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add feature to application',
    description: 'Add a new feature/capability to an application.'
  })
  @ApiParam({ name: 'applicationId', type: String, description: 'Application ID' })
  @ApiBody({ type: CreateApplicationFeatureDto })
  @ApiResponse({ status: 201, description: 'Feature added successfully' })
  @ApiResponse({ status: 400, description: 'Feature already exists' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async addFeature(
    @Request() req,
    @Param('applicationId') applicationId: string,
    @Body() dto: CreateApplicationFeatureDto
  ): Promise<any> {
    return this.licensesService.addFeature(applicationId, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('applications/:applicationId/features')
  @ApiOperation({ 
    summary: 'List application features',
    description: 'Retrieve all features available for an application.'
  })
  @ApiParam({ name: 'applicationId', type: String, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'List of features' })
  async getFeatures(
    @Request() req,
    @Param('applicationId') applicationId: string
  ): Promise<any[]> {
    return this.licensesService.getApplicationFeatures(applicationId);
  }

  // ============================================================================
  // Tenant License Management Endpoints (Org Admin / Training Manager)
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('tenants/:tenantId/licenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create license for tenant',
    description: `Create a new license for a specific tenant to use an application.
    
Only org admins and training managers can create licenses for their tenant.`
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiBody({ type: CreateLicenseDto })
  @ApiResponse({ status: 201, description: 'License created successfully' })
  @ApiResponse({ status: 400, description: 'License already exists or invalid input' })
  @ApiResponse({ status: 404, description: 'Tenant or application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createLicense(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateLicenseDto
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.createLicense(tenantId, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('tenants/:tenantId/licenses')
  @ApiOperation({ 
    summary: 'List tenant licenses',
    description: 'Retrieve all licenses for a specific tenant.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'List of tenant licenses' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTenantLicenses(
    @Request() req,
    @Param('tenantId') tenantId: string
  ): Promise<any[]> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.getTenantLicenses(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('tenants/:tenantId/licenses/:licenseId')
  @ApiOperation({ 
    summary: 'Get license details',
    description: 'Retrieve detailed information about a specific license.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiResponse({ status: 200, description: 'License details' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLicense(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.getLicense(tenantId, licenseId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Patch('tenants/:tenantId/licenses/:licenseId')
  @ApiOperation({ 
    summary: 'Update license',
    description: 'Update license details like plan, max seats, or status.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiBody({ type: UpdateLicenseDto })
  @ApiResponse({ status: 200, description: 'License updated successfully' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLicense(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string,
    @Body() dto: UpdateLicenseDto
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.updateLicense(tenantId, licenseId, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('tenants/:tenantId/licenses/:licenseId/renew')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Renew license',
    description: 'Extend the expiration date of a license.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newEndDate: {
          type: 'string',
          format: 'date-time',
          description: 'New expiration date',
        },
      },
      required: ['newEndDate'],
    },
  })
  @ApiResponse({ status: 200, description: 'License renewed successfully' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async renewLicense(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string,
    @Body('newEndDate') newEndDate: string
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.renewLicense(tenantId, licenseId, newEndDate, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('tenants/:tenantId/licenses/:licenseId/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Suspend license',
    description: 'Suspend a license, preventing its use.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for suspension',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'License suspended successfully' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async suspendLicense(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string,
    @Body('reason') reason: string
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.suspendLicense(tenantId, licenseId, reason, req.user.id);
  }

  // ============================================================================
  // License User Assignment Endpoints (Org Admin / Training Manager)
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('tenants/:tenantId/licenses/:licenseId/assign-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Assign license to user',
    description: `Assign a license to a specific user within the tenant.
    
This increases the current seat count and grants the user access to the application.`
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiBody({ type: AssignLicenseUserDto })
  @ApiResponse({ status: 201, description: 'User license assigned successfully' })
  @ApiResponse({ status: 400, description: 'User already has license or max seats reached' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignLicenseToUser(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string,
    @Body() dto: AssignLicenseUserDto
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.assignLicenseToUser(tenantId, licenseId, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Post('tenants/:tenantId/licenses/:licenseId/revoke-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Revoke license from user',
    description: `Revoke a license assignment from a specific user.
    
This frees up a seat and revokes the user's access to the application.`
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiBody({ type: RevokeLicenseUserDto })
  @ApiResponse({ status: 200, description: 'User license revoked successfully' })
  @ApiResponse({ status: 404, description: 'License assignment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeLicenseFromUser(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string,
    @Body() dto: RevokeLicenseUserDto
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.revokeLicenseFromUser(tenantId, licenseId, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('tenants/:tenantId/licenses/:licenseId/users')
  @ApiOperation({ 
    summary: 'List users assigned to license',
    description: 'Retrieve all users who have been assigned a specific license.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiParam({ name: 'licenseId', type: String, description: 'License ID' })
  @ApiResponse({ status: 200, description: 'List of assigned users' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLicenseUsers(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('licenseId') licenseId: string
  ): Promise<any[]> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.getLicenseUsers(tenantId, licenseId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('my-licenses')
  @ApiOperation({ 
    summary: 'Get current user licenses',
    description: 'Retrieve all licenses assigned to the current user.'
  })
  @ApiResponse({ status: 200, description: 'List of user licenses' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserLicenses(
    @Request() req
  ): Promise<any[]> {
    return this.licensesService.getUserLicenses(req.user.tenantId, req.user.id);
  }

  // ============================================================================
  // License Analytics and Reporting Endpoints
  // ============================================================================

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('tenants/:tenantId/stats')
  @ApiOperation({ 
    summary: 'Get tenant license statistics',
    description: 'Retrieve comprehensive license usage statistics for a tenant.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'License usage statistics' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLicenseStats(
    @Request() req,
    @Param('tenantId') tenantId: string
  ): Promise<any> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.getLicenseUsageStats(tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('admin.manage')
  @Get('tenants/:tenantId/audit-log')
  @ApiOperation({ 
    summary: 'Get license audit log',
    description: 'Retrieve audit logs for all license operations in a tenant.'
  })
  @ApiParam({ name: 'tenantId', type: String, description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuditLog(
    @Request() req,
    @Param('tenantId') tenantId: string
  ): Promise<any[]> {
    if (req.user.tenantId !== tenantId && req.user.roles[0] !== 'org_admin') {
      throw new BadRequestException('You do not have access to this tenant');
    }

    return this.licensesService.getLicenseAuditLog(tenantId);
  }
}
