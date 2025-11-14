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

      // Get file from Python service
      const fileBuffer = await this.imageProcessingService.getImage(
        `${folder}/${filename}`,
      );

      // Determine content type from filename
      const ext = filename.split('.').pop()?.toLowerCase();
      let contentType: string;

      // Image formats
      if (ext === 'jpg' || ext === 'jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === 'png') {
        contentType = 'image/png';
      } else if (ext === 'webp') {
        contentType = 'image/webp';
      }
      // Preset formats
      else if (ext === 'xmp') {
        contentType = 'application/xml';
      } else if (ext === 'lrtemplate') {
        contentType = 'application/octet-stream';
      } else if (ext === 'dcp') {
        contentType = 'application/octet-stream';
      } else if (ext === 'dng') {
        contentType = 'image/x-adobe-dng';
      } else {
        contentType = 'application/octet-stream';
      }

      // Send file
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      });

      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving file:', error);
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'File not found',
      });
    }
  }
}
