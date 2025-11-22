import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

@Injectable()
export class StorageService {
  private uploadPath: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
    this.maxFileSize =
      parseInt(this.configService.get('MAX_FILE_SIZE')) || 10485760; // 10MB
    this.allowedTypes =
      this.configService
        .get('ALLOWED_FILE_TYPES')
        ?.split(',') || ['image/jpeg', 'image/png', 'image/jpg'];

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        await mkdir(this.uploadPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  async saveFile(
    file: Express.Multer.File,
    subfolder: string,
    sessionId: string,
  ): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Create subfolder path
    const folderPath = path.join(this.uploadPath, subfolder, sessionId);

    // Ensure folder exists
    await mkdir(folderPath, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}${ext}`;
    const filePath = path.join(folderPath, filename);

    // Save file
    await writeFile(filePath, file.buffer);

    return filePath;
  }

  async saveBase64Image(
    base64Data: string,
    subfolder: string,
    sessionId: string,
    type?: string,
  ): Promise<string> {
    // Remove data URI prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Convert to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Create subfolder path
    const folderPath = path.join(this.uploadPath, subfolder, sessionId);

    // Ensure folder exists
    await mkdir(folderPath, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const prefix = type ? `${type}_` : '';
    const filename = `${prefix}${timestamp}.jpg`;
    const filePath = path.join(folderPath, filename);

    // Save file
    await writeFile(filePath, imageBuffer);

    return filePath;
  }

  async saveBuffer(
    buffer: Buffer,
    subfolder: string,
    sessionId: string,
    filename?: string,
  ): Promise<string> {
    // Create subfolder path
    const folderPath = path.join(this.uploadPath, subfolder, sessionId);

    // Ensure folder exists
    await mkdir(folderPath, { recursive: true });

    // Generate filename if not provided
    if (!filename) {
      const timestamp = Date.now();
      filename = `${timestamp}.jpg`;
    }
    const filePath = path.join(folderPath, filename);

    // Save file
    await writeFile(filePath, buffer);

    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async deleteSessionFiles(sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(this.uploadPath, sessionId);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error deleting session files:', error);
    }
  }

  getFileUrl(filePath: string): string {
    // Return relative path for frontend access
    return filePath.replace(this.uploadPath, '/uploads');
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`,
      );
    }
  }

  getFilePath(filename: string, subfolder?: string): string {
    if (subfolder) {
      return path.join(this.uploadPath, subfolder, filename);
    }
    return path.join(this.uploadPath, filename);
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}

