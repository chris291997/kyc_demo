import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FaceService } from './face.service';
import { StorageService } from '../storage/storage.service';
import { DocumentService } from '../document/document.service';

@Controller('face')
export class FaceController {
  constructor(
    private readonly faceService: FaceService,
    private readonly storageService: StorageService,
    private readonly documentService: DocumentService,
  ) {}

  @Post('liveness')
  async checkLiveness(
    @Body('sessionId') sessionId: string,
    @Body('imageBase64') imageBase64?: string,
    @Body('livenessResult') livenessResult?: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    let savedPath: string | null = null;

    // Handle base64 image
    if (imageBase64) {
      savedPath = await this.storageService.saveBase64Image(
        imageBase64,
        'faces',
        sessionId,
        'liveness',
      );
    }
    // Handle file upload
    else if (file) {
      savedPath = await this.storageService.saveFile(
        file,
        'faces',
        sessionId,
      );
    }

    // If liveness result is provided from frontend (Regula Web SDK did the check)
    if (livenessResult) {
      return await this.faceService.saveLivenessResult(
        sessionId,
        livenessResult,
        savedPath,
      );
    }

    // Otherwise, perform liveness check on backend
    if (!savedPath) {
      throw new BadRequestException('No image data provided');
    }

    return await this.faceService.checkLiveness(sessionId, savedPath);
  }

  @Post('match')
  async matchFaces(
    @Body('sessionId') sessionId: string,
    @Body('imageBase64') imageBase64?: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    // Get face image from document
    const documentFacePath =
      await this.documentService.getFaceImagePath(sessionId);

    if (!documentFacePath) {
      throw new BadRequestException(
        'No face image found in document. Please process document first.',
      );
    }

    let selfiePath: string;

    // Handle base64 image
    if (imageBase64) {
      selfiePath = await this.storageService.saveBase64Image(
        imageBase64,
        'faces',
        sessionId,
        'selfie',
      );
    }
    // Handle file upload
    else if (files && files.length > 0) {
      selfiePath = await this.storageService.saveFile(
        files[0],
        'faces',
        sessionId,
      );
    } else {
      throw new BadRequestException('No image data provided (base64 or file required)');
    }

    // Perform face matching with document face
    return await this.faceService.matchFaces(sessionId, documentFacePath, selfiePath);
  }

  @Post('match-with-document')
  @UseInterceptors(FileInterceptor('selfie'))
  async matchWithDocument(
    @UploadedFile() selfie: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!selfie) {
      throw new BadRequestException('Selfie image is required');
    }

    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    // Get face image from document
    const documentFacePath =
      await this.documentService.getFaceImagePath(sessionId);

    if (!documentFacePath) {
      throw new BadRequestException(
        'No face image found in document. Please process document first.',
      );
    }

    // Save selfie
    const selfiePath = await this.storageService.saveFile(
      selfie,
      'faces',
      sessionId,
    );

    // Match selfie with document face
    return await this.faceService.matchFaces(
      sessionId,
      documentFacePath,
      selfiePath,
    );
  }

  @Get(':sessionId')
  async getFaceResult(@Param('sessionId') sessionId: string) {
    const result = await this.faceService.findBySessionId(sessionId);

    if (!result) {
      throw new BadRequestException(
        `No face result found for session ${sessionId}`,
      );
    }

    return result;
  }
}


