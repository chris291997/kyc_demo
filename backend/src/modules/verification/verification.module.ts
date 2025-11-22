import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationSession } from './verification.entity';
import { DocumentModule } from '../document/document.module';
import { FaceModule } from '../face/face.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationSession]),
    forwardRef(() => DocumentModule),
    forwardRef(() => FaceModule),
    StorageModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}

