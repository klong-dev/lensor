import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// @ts-ignore
// eslint-disable-next-line
const FormData = require('form-data');

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly imageServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.imageServiceUrl =
      this.configService.get<string>('IMAGE_SERVICE_URL') ||
      'http://localhost:5000';
  }

  /**
   * Process single image file (RAW or regular image)
   * Returns paths for both original and thumbnail
   */
  async processSingleImage(
    file: Express.Multer.File,
    authToken: string,
  ): Promise<{
    original: string;
    thumbnail: string;
    filename: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        `${this.imageServiceUrl}/upload/single`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      if (!response.data.success) {
        throw new BadRequestException('Image processing failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error processing image:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data?.error || 'Failed to process image',
        );
      }
      throw new BadRequestException('Failed to process image');
    }
  }

  /**
   * Process multiple image files
   * Returns array of processed images
   */
  async processMultipleImages(
    files: Express.Multer.File[],
    authToken: string,
  ): Promise<{
    uploaded: Array<{
      original: string;
      thumbnail: string;
      filename: string;
    }>;
    failed: Array<{ filename: string; error: string }>;
    total: number;
    successful: number;
    failed_count: number;
  }> {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      const response = await axios.post(
        `${this.imageServiceUrl}/upload/multiple`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      if (!response.data.success) {
        throw new BadRequestException('Image processing failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error processing multiple images:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data?.error || 'Failed to process images',
        );
      }
      throw new BadRequestException('Failed to process images');
    }
  }

  /**
   * Check if image service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.imageServiceUrl}/health`, {
        timeout: 5000,
      });
      return response.data.status === 'healthy';
    } catch (error) {
      this.logger.error('Image service health check failed:', error);
      return false;
    }
  }
}
