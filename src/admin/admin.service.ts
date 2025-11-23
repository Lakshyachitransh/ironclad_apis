import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AdminService {
  private readonly envFilePath = path.join(process.cwd(), '.env');

  constructor(private configService: ConfigService) {}

  /**
   * Update PostgreSQL connection details and run Prisma migrations
   */
  async updateDatabaseConfig(
    host: string,
    port: number,
    username: string,
    password: string,
    database: string
  ) {
    try {
      // Validate inputs
      if (!host || !username || !password || !database) {
        throw new BadRequestException('All database fields are required: host, port, username, password, database');
      }

      if (port < 1 || port > 65535) {
        throw new BadRequestException('Invalid port number. Port must be between 1 and 65535');
      }

      // Build connection string
      const connectionString = `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

      // Read current .env file
      let envContent = fs.readFileSync(this.envFilePath, 'utf-8');

      // Update or add DATABASE_URL
      if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL="${connectionString}"`
        );
      } else {
        envContent += `\nDATABASE_URL="${connectionString}"`;
      }

      // Write updated .env file
      fs.writeFileSync(this.envFilePath, envContent, 'utf-8');

      // Update process.env so it takes effect immediately
      process.env.DATABASE_URL = connectionString;

      return {
        success: true,
        message: 'Database configuration updated successfully',
        host,
        port,
        username,
        database,
        connectionString: connectionString.replace(password, '****')
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update database config: ${error.message}`);
    }
  }

  /**
   * Run Prisma migrations
   */
  async runMigrations() {
    try {
      console.log('Starting Prisma migrations...');
      
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr && !stderr.includes('warn')) {
        console.error('Migration stderr:', stderr);
      }

      console.log('Migrations completed successfully');

      return {
        success: true,
        message: 'Prisma migrations deployed successfully',
        output: stdout
      };
    } catch (error) {
      console.error('Migration error:', error);
      throw new BadRequestException(`Failed to run migrations: ${error.message}`);
    }
  }

  /**
   * Run migrations and push schema
   */
  async updateDatabaseAndMigrate(
    host: string,
    port: number,
    username: string,
    password: string,
    database: string
  ) {
    try {
      // First update the config
      const configResult = await this.updateDatabaseConfig(host, port, username, password, database);

      // Wait a moment for environment to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then run migrations
      const migrationResult = await this.runMigrations();

      return {
        success: true,
        message: 'Database configuration updated and migrations completed',
        config: configResult,
        migration: migrationResult
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update database and run migrations: ${error.message}`);
    }
  }

  /**
   * Get current database configuration (without password)
   */
  async getCurrentDatabaseConfig() {
    try {
      const databaseUrl = process.env.DATABASE_URL || '';
      
      if (!databaseUrl) {
        return {
          configured: false,
          message: 'No DATABASE_URL configured'
        };
      }

      // Parse connection string
      const urlRegex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = databaseUrl.match(urlRegex);

      if (!match) {
        return {
          configured: true,
          connectionString: '****',
          message: 'DATABASE_URL is configured but unable to parse'
        };
      }

      const [, username, , host, port, database] = match;

      return {
        configured: true,
        host,
        port: parseInt(port),
        username,
        database,
        connectionString: databaseUrl.replace(/:[^@]+@/, ':****@')
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get database config: ${error.message}`);
    }
  }
}
