import {
  Controller,
  Post,
  UseGuards,
  Param,
  Get,
  Body
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ 
    summary: 'Create a new tenant',
    description: 'Creates a new tenant organization.'
  })
  @ApiBody({ 
    schema: {
      example: {
        name: 'Acme Corporation'
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tenant created successfully',
    schema: {
      example: {
        id: '456e7890-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        createdAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Tenant name already exists' })
  async create(@Body() dto: CreateTenantDto) {
    return this.svc.createTenant(dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':name')
  @ApiOperation({ 
    summary: 'Get tenant by name',
    description: 'Retrieves a tenant by its name.'
  })
  @ApiParam({ name: 'name', type: String, description: 'Tenant name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tenant found',
    schema: {
      example: {
        id: '456e7890-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        createdAt: '2025-11-19T10:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenant(@Param('name') name: string) {
    console.log("AUTH USER =");
    return this.svc.getTenantByName(name);
  }

  @Get()
  @ApiOperation({ 
    summary: 'List all tenants',
    description: 'Retrieves a list of all tenants in the system.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all tenants',
    schema: {
      example: [
        {
          id: '456e7890-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          createdAt: '2025-11-19T10:00:00Z'
        },
        {
          id: '567f8901-e89b-12d3-a456-426614174001',
          name: 'Tech Innovations Inc',
          createdAt: '2025-11-19T11:00:00Z'
        }
      ]
    }
  })
  async getAllsTenant(){
    return this.svc.getAllTenant();
  }
}
