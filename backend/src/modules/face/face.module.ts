import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaceService } from './face.service';
import { FaceController } from './face.controller';
import { FaceResult } from './face-result.entity';
import { VerificationModule } from '../verification/verification.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FaceResult]),
    forwardRef(() => VerificationModule),
    StorageModule,
    forwardRef(() => DocumentModule),
  ],
  controllers: [FaceController],
  providers: [FaceService],
  exports: [FaceService],
})
export class FaceModule {}

