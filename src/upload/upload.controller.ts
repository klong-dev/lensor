import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.uploadService.uploadFile(file, userId);
    return {
      data: {
        url,
      },
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const urls = await this.uploadService.uploadMultipleFiles(files, userId);
    return {
      data: {
        urls,
      },
    };
  }

  @Post('evidence')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 evidence files
  async uploadEvidence(
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Generate temporary reportId (will be replaced with actual reportId after report creation)
    const tempReportId = `temp_${Date.now()}`;
    const urls = await this.uploadService.uploadEvidenceFiles(
      files,
      userId,
      tempReportId,
    );
    return {
      data: {
        urls,
      },
      message: 'Evidence files uploaded successfully',
    };
  }
}
