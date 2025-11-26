import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { WebhookDto } from './dto/webhook.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('api/payos')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private paymentService: PaymentService) {}

  @Post('create')
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentService.createPaymentLink(createPaymentDto, user.userId);
  }

  @Post('webhook')
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
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPaymentStatus(paymentId);
  }
}
