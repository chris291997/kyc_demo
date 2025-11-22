import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentModule } from './modules/document/document.module';
import { FaceModule } from './modules/face/face.module';
import { VerificationModule } from './modules/verification/verification.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') === 'development';
        // In development, use synchronize for easier setup (creates tables automatically)
        // Set USE_SYNCHRONIZE=false in .env to use migrations instead
        const useSynchronize = isDevelopment && configService.get('USE_SYNCHRONIZE') !== 'false';
        
        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: configService.get('DATABASE_PORT'),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: false, // Don't run migrations automatically - use synchronize in dev or run manually
          synchronize: useSynchronize, // Auto-create tables in development
          logging: isDevelopment,
        };
      },
      inject: [ConfigService],
    }),

    // Feature modules
    DocumentModule,
    FaceModule,
    VerificationModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

