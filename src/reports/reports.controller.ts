import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: { userId: string },
  ) {
    const report = await this.reportsService.createReport(
      user.userId,
      createReportDto,
    );
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
