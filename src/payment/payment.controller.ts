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

  @Post('create')
  async createPayment(
    @Body()
    body: {
      amount: number;
      paymentChannel: 'vnpay' | 'paypal';
      orderInfo?: string;
    },
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      '127.0.0.1';

    const result = await this.paymentService.createPayment(
      user.userId,
      body.amount,
      body.paymentChannel,
      body.orderInfo,
      ipAddr,
    );
    return { data: result };
  }

  @Get('vnpay-return')
  @Public()
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.paymentService.verifyVNPayCallback(query);
    return res
      .status(200)
      .json({ data: { success: result.success, txnRef: result.txnRef } });
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
    @Body() body: { amount: number; orderInfo?: string },
    @CurrentUser() user: { userId: string },
  ) {
    const result = await this.paymentService.createPayPalPayment(
      user.userId,
      body.amount,
      body.orderInfo,
    );
    return { data: result };
  }

  @Get('paypal-return')
  @Public()
  async paypalReturn(@Query() query: any, @Res() res: Response) {
    const { token, userId } = query;

    if (!token || !userId) {
      return res.redirect(
        `http://localhost:3000/payment/failed?error=missing_params`,
      );
    }

    try {
      const result = await this.paymentService.capturePayPalPayment(
        token,
        userId,
      );

      const redirectUrl = result.success
        ? `http://localhost:3000/payment/success?transactionId=${result.transactionId}&amount=${result.amount}`
        : `http://localhost:3000/payment/failed?message=${result.message}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(
        `http://localhost:3000/payment/failed?error=${error.message}`,
      );
    }
  }

  @Get('paypal-cancel')
  @Public()
  async paypalCancel(@Query() query: any, @Res() res: Response) {
    // Payment cancelled by user
    return res.redirect(`http://localhost:3000/payment/cancelled`);
  }

  // Verify payment status (for frontend after redirect)
  @Post('verify-vnpay')
  @Public()
  async verifyVNPayPayment(@Body() body: any) {
    const result = await this.paymentService.verifyVNPayCallback(body);
    return {
      success: result.success,
      txnRef: result.txnRef,
      responseCode: result.responseCode,
      amount: result.amount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      message: result.message,
    };
  }

  @Post('verify-paypal')
  @Public()
  async verifyPayPalPayment(@Body() body: { token: string; userId: string }) {
    const { token, userId } = body;

    if (!token || !userId) {
      return {
        success: false,
        message: 'Missing token or userId',
      };
    }

    const result = await this.paymentService.capturePayPalPayment(
      token,
      userId,
    );

    return {
      success: result.success,
      transactionId: result.transactionId,
      amount: result.amount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      message: result.message,
    };
  }
}
