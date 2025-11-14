import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { AdminWithdrawalActionDto } from './dto/admin-withdrawal-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminWithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Get()
  async getAllWithdrawals(@Query('status') status?: string) {
    const withdrawals = await this.withdrawalsService.getAllWithdrawals(status);
    return { data: withdrawals };
  }

  @Post(':id/action')
  async handleWithdrawal(
    @Param('id') withdrawalId: string,
    @Body() adminActionDto: AdminWithdrawalActionDto,
    @CurrentUser() user: { userId: string },
  ) {
    const withdrawal = await this.withdrawalsService.handleAdminAction(
      withdrawalId,
      user.userId,
      adminActionDto,
    );
    return {
      data: withdrawal,
      message: `Withdrawal ${adminActionDto.action} successfully`,
    };
  }
}
