import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private imageServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.imageServiceUrl =
      this.configService.get<string>('IMAGE_SERVICE_URL') ||
      'http://localhost:5000';
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ original: string; thumbnail: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Create JWT token for image service
      const token = this.jwtService.sign(
        { sub: userId },
        { expiresIn: '5m' }, // Short-lived token for upload
      );

      // Create form data
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Call Python microservice
      const response = await axios.post(
        `${this.imageServiceUrl}/upload/single`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
          timeout: 60000, // 60s timeout for large files
        },
      );

      if (response.data.success) {
        return {
          original: response.data.data.original,
          thumbnail: response.data.data.thumbnail,
        };
      }

      throw new BadRequestException('Image processing failed');
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      if (error.response?.data?.error) {
        throw new BadRequestException(error.response.data.error);
      }
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<Array<{ original: string; thumbnail: string }>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      // Create JWT token
      const token = this.jwtService.sign({ sub: userId }, { expiresIn: '10m' });

      // Create form data
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      // Call Python microservice
      const response = await axios.post(
        `${this.imageServiceUrl}/upload/multiple`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
          timeout: 120000, // 120s timeout for multiple files
        },
      );

      if (response.data.success) {
        return response.data.data.uploaded.map((item: any) => ({
          original: item.original,
          thumbnail: item.thumbnail,
        }));
      }

      throw new BadRequestException('Image processing failed');
    } catch (error) {
      this.logger.error('Error uploading multiple files:', error);
      if (error.response?.data?.error) {
        throw new BadRequestException(error.response.data.error);
      }
      throw new BadRequestException('Failed to upload files');
    }
  }

  getImageServiceUrl(): string {
    return this.imageServiceUrl;
  }

  /**
   * Upload evidence files for reports
   * Uses the existing /upload/multiple endpoint
   * Returns only original URLs (evidence doesn't need thumbnails)
   */
  async uploadEvidenceFiles(
    files: Express.Multer.File[],
    userId: string,
    reportId: string,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No evidence files provided');
    }

    try {
      // Use the existing uploadMultipleFiles method
      const uploadResults = await this.uploadMultipleFiles(files, userId);

      // Return only original URLs (evidence doesn't need thumbnails)
      return uploadResults.map((item) => item.original);
    } catch (error) {
      this.logger.error('Error uploading evidence files:', error);
      throw new BadRequestException('Failed to upload evidence files');
    }
  }
}
