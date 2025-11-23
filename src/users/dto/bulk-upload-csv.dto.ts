import { IsEmail, IsString, IsOptional } from 'class-validator';

export class BulkUploadUserCsvDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  defaultRoles?: string; // comma-separated roles (e.g., "learner,viewer")
}

export interface CsvUserRow {
  email: string;
  displayName?: string;
  password?: string;
  roles?: string; // comma-separated
}
