import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security + CORS
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser());  

  // Optional: prefix all routes with /api
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI config
  const config = new DocumentBuilder()
    .setTitle('Ironclad LMS API')
    .setDescription('API documentation for your multi-tenant SaaS LMS backend.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token' // security name
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    },
    customSiteTitle: 'Ironclad LMS API Docs'
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📘 API docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
