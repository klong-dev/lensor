import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB');
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    const filepath = join(this.uploadPath, filename);

    await fs.writeFile(filepath, file.buffer);

    return `/uploads/${filename}`;
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filepath = join(this.uploadPath, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
