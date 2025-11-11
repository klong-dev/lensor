import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('vnpay/create')
  async createVNPayPayment(
    @Body() body: { amount: number; orderInfo: string },
    @CurrentUser() user: { userId: string },
  ) {
    const result = await this.paymentService.createVNPayPayment(
      user.userId,
      body.amount,
      body.orderInfo,
    );
    return { data: result };
  }

  @Get('vnpay/callback')
  @Public()
  async vnpayCallback(@Query() query: any) {
    const result = await this.paymentService.verifyVNPayCallback(query);
    return { data: result };
  }

  @Post('paypal/create')
  async createPayPalPayment(
    @Body() body: { amount: number },
    @CurrentUser() user: { userId: string },
  ) {
    const result = await this.paymentService.createPayPalPayment(
      user.userId,
      body.amount,
    );
    return { data: result };
  }
}
