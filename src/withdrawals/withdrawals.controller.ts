import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  async createWithdrawal(
    @Body() createWithdrawalDto: CreateWithdrawalDto,
    @CurrentUser() user: { userId: string },
  ) {
    const withdrawal = await this.withdrawalsService.createWithdrawal(
      user.userId,
      createWithdrawalDto,
    );
    return {
      data: withdrawal,
      message:
        'Withdrawal request submitted successfully. Admin will process it soon.',
    };
  }

  @Get()
  async getMyWithdrawals(@CurrentUser() user: { userId: string }) {
    const withdrawals = await this.withdrawalsService.getMyWithdrawals(
      user.userId,
    );
    return { data: withdrawals };
  }

  @Get('statistics')
  async getWithdrawalStatistics(
    @CurrentUser() user: { userId: string },
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const stats = await this.withdrawalsService.getWithdrawalStatisticsByUser(
      user.userId,
      {
        year,
        month,
      },
    );
    return { data: stats };
  }

  @Get(':id')
  async getWithdrawal(
    @Param('id') withdrawalId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const withdrawal = await this.withdrawalsService.getWithdrawalById(
      withdrawalId,
      user.userId,
    );
    return { data: withdrawal };
  }
}
