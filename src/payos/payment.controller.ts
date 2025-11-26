import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookDto } from './dto/webhook.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('payos')
export class PayOSController {
  private readonly logger = new Logger(PayOSController.name);

  constructor(private paymentService: PaymentService) {}

  @Post('create')
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentService.createPaymentLink(createPaymentDto, user.userId);
  }

  @Post('webhook')
  @Public()
  async handleWebhook(@Body() webhookData: WebhookDto) {
    try {
      const result = await this.paymentService.handleWebhook(webhookData);

      return result;
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: number) {
    return this.paymentService.getPaymentStatus(paymentId);
  }
}
