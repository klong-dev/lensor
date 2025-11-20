import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { WithdrawalsService } from './withdrawals.service';
import { AdminWithdrawalActionDto } from './dto/admin-withdrawal-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminWithdrawalsController {
  constructor(
    private readonly withdrawalsService: WithdrawalsService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  async getAllWithdrawals(@Query('status') status?: string) {
    const withdrawals = await this.withdrawalsService.getAllWithdrawals(status);
    return { data: withdrawals };
  }

  @Post(':id/action')
  @UseInterceptors(FilesInterceptor('paymentProof', 5))
  async handleWithdrawal(
    @Param('id') withdrawalId: string,
    @Body() adminActionDto: AdminWithdrawalActionDto,
    @CurrentUser() user: { userId: string },
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    console.log('Files received:', files);

    // Upload evidence files if provided
    let paymentProofImageUrl: string[] = [];
    if (files && files.length > 0) {
      const tempProofId = `temp_${Date.now()}`;
      paymentProofImageUrl = await this.uploadService.uploadEvidenceFiles(
        files,
        user.userId,
        tempProofId,
      );
    }

    console.log('Payment Proof Image URLs:', paymentProofImageUrl);

    const withdrawal = await this.withdrawalsService.handleAdminAction(
      withdrawalId,
      user.userId,
      adminActionDto,
      paymentProofImageUrl,
    );
    return {
      data: withdrawal,
      message: `Withdrawal ${adminActionDto.action} successfully`,
    };
  }
}
