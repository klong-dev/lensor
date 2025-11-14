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
import { AdminActionDto } from './dto/admin-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getAllReports(@Query('status') status?: string) {
    const reports = await this.reportsService.getAllReports(status);
    return { data: reports };
  }

  @Post(':id/action')
  async handleReport(
    @Param('id') reportId: string,
    @Body() adminActionDto: AdminActionDto,
    @CurrentUser() user: { userId: string },
  ) {
    const report = await this.reportsService.handleAdminAction(
      reportId,
      user.userId,
      adminActionDto,
    );
    return {
      data: report,
      message: `Report ${adminActionDto.action} successfully`,
    };
  }
}
