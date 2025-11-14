import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('evidence', 5)) // Max 5 evidence files
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: { userId: string },
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Upload evidence files if provided
    let evidenceUrls: string[] = [];
    if (files && files.length > 0) {
      const tempReportId = `temp_${Date.now()}`;
      evidenceUrls = await this.uploadService.uploadEvidenceFiles(
        files,
        user.userId,
        tempReportId,
      );
    }

    // Merge uploaded URLs with existing evidence URLs from body
    const allEvidence = [...(createReportDto.evidence || []), ...evidenceUrls];

    const report = await this.reportsService.createReport(user.userId, {
      ...createReportDto,
      evidence: allEvidence,
    });

    return {
      data: report,
      message: 'Report submitted successfully. It will be reviewed by admin.',
    };
  }

  @Get()
  async getMyReports(@CurrentUser() user: { userId: string }) {
    const reports = await this.reportsService.getMyReports(user.userId);
    return { data: reports };
  }

  @Get(':id')
  async getReportById(
    @Param('id') reportId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const report = await this.reportsService.getReportById(
      reportId,
      user.userId,
    );
    return { data: report };
  }
}
