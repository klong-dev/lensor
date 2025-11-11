import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { PaymentHistoryService } from './payment-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payment-history')
@UseGuards(JwtAuthGuard)
export class PaymentHistoryController {
  constructor(
    private readonly paymentHistoryService: PaymentHistoryService,
  ) {}

  @Get()
  async getHistory(
    @CurrentUser() user: { userId: string },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.paymentHistoryService.getHistoryByUserId(
      user.userId,
      parseInt(page),
      parseInt(limit),
    );

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit)),
      },
    };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: { userId: string }) {
    const stats = await this.paymentHistoryService.getPaymentStats(
      user.userId,
    );
    return { data: stats };
  }

  @Get('order/:orderId')
  async getHistoryByOrder(@Param('orderId') orderId: string) {
    const history = await this.paymentHistoryService.getHistoryByOrderId(
      orderId,
    );
    return { data: history };
  }
}
