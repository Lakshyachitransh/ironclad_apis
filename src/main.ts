import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable WebSocket support with Socket.IO
  app.useWebSocketAdapter(new IoAdapter(app));

  // Increase body size limit for large uploads (e.g., audio/video)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.raw({ limit: '50mb' }));
  app.use(express.text({ limit: '50mb' }));

  // Security + CORS (also applies to WebSocket)
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
  console.log(`🎬 WebSocket available at http://localhost:${port}/ws-live-class`);
}

bootstrap();
