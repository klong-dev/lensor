import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Request, Response } from 'express';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('vnpay/create')
  async createVNPayPayment(
    @Body() body: { amount: number; orderInfo?: string },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      '127.0.0.1';

    const result = await this.paymentService.createVNPayPayment(
      user.userId,
      body.amount,
      body.orderInfo,
      ipAddr,
    );
    return { data: result };
  }

  @Get('vnpay-return')
  @Public()
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.paymentService.verifyVNPayCallback(query);

    // Redirect to frontend with payment result
    const redirectUrl = result.success
      ? `http://localhost:3000/payment/success?orderId=${result.orderId}`
      : `http://localhost:3000/payment/failed?orderId=${result.orderId}&code=${result.responseCode}`;

    return res.redirect(redirectUrl);
  }

  @Get('vnpay-ipn')
  @Public()
  async vnpayIPN(@Query() query: any) {
    const result = await this.paymentService.verifyVNPayCallback(query);
    return {
      RspCode: result.success ? '00' : '97',
      Message: result.message,
    };
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
