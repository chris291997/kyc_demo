import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { StorageService } from '../storage/storage.service';

@Controller('document')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly storageService: StorageService,
  ) {}

  @Post('process')
  @UseInterceptors(FileInterceptor('image'))
  async processDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    // Process with Regula Document Reader (no portrait in this endpoint)
    return await this.documentService.processDocument(sessionId, file);
  }

  @Get(':sessionId')
  async getDocumentResult(@Param('sessionId') sessionId: string) {
    const result = await this.documentService.findBySessionId(sessionId);

    if (!result) {
      throw new BadRequestException(
        `No document result found for session ${sessionId}`,
      );
    }

    return result;
  }

  @Get(':sessionId/face-image')
  async getFaceImage(@Param('sessionId') sessionId: string) {
    const faceImagePath =
      await this.documentService.getFaceImagePath(sessionId);

    if (!faceImagePath) {
      throw new BadRequestException('No face image found in document');
    }

    return { face_image_path: faceImagePath };
  }
}

