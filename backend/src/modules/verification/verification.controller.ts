import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { DocumentService } from '../document/document.service';
import { FaceService } from '../face/face.service';
import { StorageService } from '../storage/storage.service';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly documentService: DocumentService,
    private readonly faceService: FaceService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createVerificationDto: CreateVerificationDto) {
    return this.verificationService.create(createVerificationDto);
  }

  @Get()
  findAll() {
    return this.verificationService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.verificationService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.verificationService.findOne(id);
  }

  @Get(':id/report')
  getReport(@Param('id') id: string) {
    return this.verificationService.getReport(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVerificationDto: UpdateVerificationDto,
  ) {
    return this.verificationService.update(id, updateVerificationDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.verificationService.updateStatus(id, status);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 2)) // Accept up to 2 images
  async uploadVerificationImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('documentIndex') documentIndex?: string,
    @Body('faceIndex') faceIndex?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    console.log(`📥 Processing ${files.length} file(s) for session ${id}`);
    console.log(`📋 documentIndex: ${documentIndex}, faceIndex: ${faceIndex}`);

    // Determine upload type based on indices
    let documentFile: Express.Multer.File | undefined;
    let portraitFile: Express.Multer.File | undefined;

    // Check if this is a document-only upload
    if (documentIndex !== undefined && faceIndex === undefined) {
      console.log('📄 Document-only upload detected');
      documentFile = files[0];
      portraitFile = undefined;
    }
    // Check if this is a portrait-only upload (for face matching step)
    else if (faceIndex !== undefined && documentIndex === undefined) {
      console.log('👤 Portrait-only upload detected');
      
      // Get existing document to perform face match
      const existingDoc = await this.documentService.findBySessionId(id);
      if (!existingDoc) {
        throw new BadRequestException('Document must be uploaded first before portrait');
      }

      // For portrait-only, we need to re-process with both document and portrait
      // Load the original document file
      const fs = await import('fs');
      const documentBuffer = fs.readFileSync(existingDoc.document_image_path);
      
      // Create a multer file object for the existing document
      documentFile = {
        buffer: documentBuffer,
        originalname: 'document.jpg',
        mimetype: 'image/jpeg',
        fieldname: 'images',
        encoding: '7bit',
        size: documentBuffer.length,
      } as Express.Multer.File;
      
      portraitFile = files[0]; // The newly uploaded portrait
    }
    // Both files uploaded together
    else if (files.length === 2) {
      console.log('📄👤 Document + Portrait upload detected');
      documentFile = files[parseInt(documentIndex || '0')];
      portraitFile = files[parseInt(faceIndex || '1')];
    }
    // Single file, assume it's document
    else {
      console.log('📄 Single file upload, assuming document');
      documentFile = files[0];
    }

    if (!documentFile) {
      throw new BadRequestException('Document image is required');
    }

    console.log(`📄 Document: Yes`);
    console.log(`👤 Portrait: ${portraitFile ? 'Yes' : 'No'}`);

    // Call document service with both files (portrait is optional)
    const result = await this.documentService.processDocument(
      id,
      documentFile,
      portraitFile,
    );

    return {
      success: true,
      session_id: id,
      document_result: result.document_result,
      face_match_result: result.face_match_result,
      message: portraitFile
        ? 'Document and portrait processed successfully'
        : 'Document processed successfully. Please upload portrait image.',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.verificationService.remove(id);
  }
}

