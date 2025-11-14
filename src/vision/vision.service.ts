import { Injectable, Logger } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private visionClient: ImageAnnotatorClient;
  private readonly enabled: boolean;
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    try {
      // Try API Key first (simpler setup)
      // Fall back to Service Account credentials
      const credentials = this.configService.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      );

      if (credentials) {
        this.visionClient = new ImageAnnotatorClient({
          keyFilename: credentials,
        });
        this.enabled = true;
        this.logger.log('Google Cloud Vision initialized with Service Account');
      } else {
        this.logger.warn(
          'GOOGLE_CLOUD_API_KEY or GOOGLE_APPLICATION_CREDENTIALS not set, Vision API disabled',
        );
        this.enabled = false;
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google Cloud Vision:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if image is NSFW using Google Cloud Vision SafeSearch
   * @param imageUrl - URL of the image to check
   * @returns true if image is NSFW (adult or violent content), false otherwise
   */
  async checkImageNSFW(imageUrl: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn('Vision API disabled, skipping NSFW check');
      return false; // Default to safe if API not available
    }

    try {
      // Download image from URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      const imageBuffer = Buffer.from(response.data);

      // Perform SafeSearch detection
      const [result] = await this.visionClient.safeSearchDetection({
        image: { content: imageBuffer },
      });

      const safeSearch = result.safeSearchAnnotation;

      if (!safeSearch) {
        this.logger.warn('No SafeSearch annotation returned');
        return false;
      }

      // Log SafeSearch results
      this.logger.debug('SafeSearch results:', {
        adult: safeSearch.adult,
        violence: safeSearch.violence,
        racy: safeSearch.racy,
      });

      // Consider image NSFW if:
      // - adult content is POSSIBLE, LIKELY or VERY_LIKELY
      // - violence content is LIKELY or VERY_LIKELY
      // - racy content is POSSIBLE, LIKELY or VERY_LIKELY (more strict for suggestive content)
      const isNSFW =
        safeSearch.adult === 'LIKELY' ||
        safeSearch.adult === 'VERY_LIKELY' ||
        safeSearch.violence === 'LIKELY' ||
        safeSearch.violence === 'VERY_LIKELY' ||
        safeSearch.racy === 'VERY_LIKELY';

      this.logger.log(`Image ${imageUrl} NSFW check: ${isNSFW}`);

      return isNSFW;
    } catch (error) {
      this.logger.error(`Error checking NSFW for ${imageUrl}:`, error);
      // On error, default to safe (false)
      return false;
    }
  }

  /**
   * Check multiple images for NSFW content
   * @param imageUrls - Array of image URLs to check
   * @returns Object mapping URL to NSFW status
   */
  async checkImagesNSFW(
    imageUrls: string[],
  ): Promise<{ [url: string]: boolean }> {
    const results: { [url: string]: boolean } = {};

    await Promise.all(
      imageUrls.map(async (url) => {
        results[url] = await this.checkImageNSFW(url);
      }),
    );

    return results;
  }

  /**
   * Get detailed SafeSearch annotation
   * @param imageUrl - URL of the image to check
   * @returns Detailed SafeSearch annotation
   */
  async getSafeSearchAnnotation(imageUrl: string): Promise<{
    adult: string;
    violence: string;
    racy: string;
    medical: string;
    spoof: string;
  } | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      const imageBuffer = Buffer.from(response.data);

      const [result] = await this.visionClient.safeSearchDetection({
        image: { content: imageBuffer },
      });

      const safeSearch = result.safeSearchAnnotation;

      if (!safeSearch) {
        return null;
      }

      return {
        adult: String(safeSearch.adult || 'UNKNOWN'),
        violence: String(safeSearch.violence || 'UNKNOWN'),
        racy: String(safeSearch.racy || 'UNKNOWN'),
        medical: String(safeSearch.medical || 'UNKNOWN'),
        spoof: String(safeSearch.spoof || 'UNKNOWN'),
      };
    } catch (error) {
      this.logger.error(
        `Error getting SafeSearch annotation for ${imageUrl}:`,
        error,
      );
      return null;
    }
  }
}
