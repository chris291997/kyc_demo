import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  // Serve static files from uploads directory
  const uploadPath = app.get(ConfigService).get('UPLOAD_PATH') || './uploads';
  app.useStaticAssets(join(process.cwd(), uploadPath), {
    prefix: '/uploads/',
  });

  // Increase body size limit for base64 images (20MB)
  app.use(require('express').json({ limit: '20mb' }));
  app.use(require('express').urlencoded({ limit: '20mb', extended: true }));
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 4000;
  const corsOrigin = configService.get('CORS_ORIGIN') || 'http://localhost:3000';

  // Enable CORS - handle multiple origins separated by comma
  const origins = corsOrigin.split(',').map((origin: string) => origin.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`🚀 KYC Demo Backend is running on: http://localhost:${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/api`);
  console.log(`🔍 Document Reader: ${configService.get('REGULA_DOC_READER_URL')}`);
  console.log(`👤 Face SDK: ${configService.get('REGULA_FACE_SDK_URL')}`);
  console.log(`📁 Static files served from: ${join(process.cwd(), uploadPath)}`);
}

bootstrap();

