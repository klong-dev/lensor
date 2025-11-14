import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ImageProcessingService } from '../products/image-processing.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Get(':folder/:filename')
  @Public()
  async serveFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Validate folder (security check)
      const allowedFolders = ['originals', 'thumbnails', 'presets'];
      if (!allowedFolders.includes(folder)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Invalid folder path',
        });
      }

      // Get image from Python service
      const imageBuffer = await this.imageProcessingService.getImage(
        `${folder}/${filename}`,
      );

      // Determine content type from filename
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentType =
        ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'png'
            ? 'image/png'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/jpeg';

      // Send image
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving file:', error);
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'File not found',
      });
    }
  }
}
