import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
   * Returns paths for both original and thumbnail with full EXIF metadata
   */
  async processSingleImage(
    file: Express.Multer.File,
    authToken: string,
  ): Promise<{
    original: string;
    thumbnail: string;
    filename: string;
    metadata?: {
      // Basic Image Info
      width?: number;
      height?: number;
      dimensions?: string;
      fileSize?: number;
      format?: string;
      colorSpace?: string;
      bitDepth?: number;
      dpi?: number;
      orientation?: number;

      // Camera Info
      cameraMake?: string;
      cameraModel?: string;
      cameraSerialNumber?: string;

      // Lens Info
      lensMake?: string;
      lensModel?: string;
      lensSerialNumber?: string;
      focalLength?: string;
      focalLengthIn35mm?: string;

      // Exposure Settings
      iso?: number;
      aperture?: string;
      fStop?: string;
      shutterSpeed?: string;
      exposureTime?: string;
      exposureMode?: string;
      exposureProgram?: string;
      exposureBias?: string;
      meteringMode?: string;

      // Flash & Lighting
      flash?: string;
      flashMode?: string;
      whiteBalance?: string;
      lightSource?: string;

      // Other Settings
      focusMode?: string;
      focusDistance?: string;
      dateTimeOriginal?: string;
      dateTimeDigitized?: string;
      dateTime?: string;
      timezone?: string;

      // Author & Copyright
      artist?: string;
      author?: string;
      copyright?: string;

      // Software & Processing
      software?: string;
      processingMethod?: string;

      // GPS Location
      gpsLatitude?: number;
      gpsLongitude?: number;
      gpsAltitude?: number;
      gpsLocation?: string;

      // Additional Info
      contrast?: string;
      saturation?: string;
      sharpness?: string;
      brightness?: string;
      gainControl?: string;
      digitalZoomRatio?: string;
      sceneType?: string;
      sceneCaptureType?: string;
      subjectDistance?: string;
      subjectDistanceRange?: string;

      // RAW Processing
      rawProcessing?: string;
      toneMapping?: string;
      colorGrading?: string;
    };
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
   * Upload preset file (without image processing)
   * Accepts: .xmp, .lrtemplate, .dcp, .dng preset files
   */
  async uploadPresetFile(
    file: Express.Multer.File,
    authToken: string,
  ): Promise<{
    url: string;
    filename: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        `${this.imageServiceUrl}/upload/preset`,
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
        throw new BadRequestException('Preset file upload failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Error uploading preset file:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data?.error || 'Failed to upload preset file',
        );
      }
      throw new BadRequestException('Failed to upload preset file');
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

  /**
   * Get image file from Python service
   * @param filepath - Relative path like 'originals/filename.jpg' or 'thumbnails/filename.jpg'
   * @returns Image buffer
   */
  async getImage(filepath: string): Promise<Buffer> {
    try {
      const response = await axios.get(
        `${this.imageServiceUrl}/uploads/${filepath}`,
        {
          responseType: 'arraybuffer',
          timeout: 10000,
        },
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Error fetching image ${filepath}:`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          error.response?.data?.error || 'Image not found',
        );
      }
      throw new BadRequestException('Failed to fetch image');
    }
  }
}
