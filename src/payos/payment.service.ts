import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentHistoryService } from 'src/payment-history/payment-history.service';
import { WalletService } from 'src/wallet/wallet.service';

// Use require for PayOS due to module compatibility issues
const PayOS = require('@payos/node');

@Injectable()
export class PaymentService {
  private payOS: any;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private paymentHistoryService: PaymentHistoryService,
    private walletService: WalletService,
  ) {
    this.payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID || '',
      process.env.PAYOS_API_KEY || '',
      process.env.PAYOS_CHECKSUM_KEY || '',
    );
  }

  async createPaymentLink(createPaymentDto: CreatePaymentDto, userId) {
    try {
      // Validate items exist and prices match
      const { amount } = createPaymentDto;

      const balanceBefore = await this.walletService.getBalance(userId);
      // Create order in database with PENDING_PAYMENT status
      const paymentHistory = await this.paymentHistoryService.createHistory({
        userId,
        orderId: null, // No order for wallet deposit
        paymentMethod: 'vnpay',
        transactionType: 'deposit',
        amount,
        status: 'pending',
        transactionId: 'LENSOR_RECHARGE_' + Date.now(),
        description: `VNPay deposit ${amount.toLocaleString()} VND`,
        metadata: {
          vnpayResponse: null,
          txnRef: null,
        },
        balanceBefore,
        balanceAfter: balanceBefore, // Will update after adding balance
      });

      // Create PayOS payment link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

      const paymentData = {
        orderCode: paymentHistory.id,
        amount: amount,
        description: `#${paymentHistory.amount}VNĐ - PayOS deposit`,
        cancelUrl: `${frontendUrl}/payment/failed?orderCode=${paymentHistory.id}`,
        returnUrl: `${frontendUrl}/payment/success?orderCode=${paymentHistory.id}`,
      };

      this.logger.log(
        `Creating payment link for order ${paymentHistory.transactionId}`,
      );
      const paymentLink = await this.payOS.createPaymentLink(paymentData);

      // // Save payment info to database
      // await this.ordersService.updatePaymentInfo(order.id, {
      //   paymentLinkId: paymentLink.paymentLinkId,
      //   paymentUrl: paymentLink.checkoutUrl,
      // });

      return {
        success: true,
        message: 'Tạo liên kết thanh toán thành công',
        data: {
          orderCode: paymentHistory.transactionId,
          orderNumber: paymentHistory.transactionId,
          paymentUrl: paymentLink.checkoutUrl,
          qrCode: paymentLink.qrCode,
          amount: amount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Payment link creation failed: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Cannot create payment link');
    }
  }

  async handleWebhook(webhookData: any) {
    try {
      this.logger.log(
        `Processing webhook for order ${webhookData.data?.orderCode}`,
      );
      this.logger.debug(`Webhook data: ${JSON.stringify(webhookData)}`);

      // PayOS webhook data structure can vary, handle both formats
      const orderCode = webhookData.orderCode || webhookData.data?.orderCode;
      const amount = webhookData.data?.amount;
      const code = webhookData.data?.code;
      const desc = webhookData.data?.desc;
      const reference =
        webhookData.reference || webhookData.data?.reference || null;
      const transactionDateTime =
        webhookData.transactionDateTime ||
        webhookData.data?.transactionDateTime;

      if (!orderCode) {
        this.logger.error('Missing orderCode in webhook data');
        throw new BadRequestException('Missing orderCode');
      }

      // Get order from database
      const payment = await this.paymentHistoryService.findById(orderCode);

      if (!payment) {
        this.logger.error(`Order ${orderCode} not found`);
        throw new BadRequestException('Order not found');
      }

      // Verify amount matches (if amount is provided)
      if (amount && Number(amount) !== Number(payment.amount)) {
        this.logger.log(
          `Amount mismatch for order ${orderCode}: expected ${payment.amount}, got ${amount}`,
        );
        throw new BadRequestException('Amount mismatch');
      }

      // Update order based on payment status
      if (code === '00') {
        // Payment successful
        this.logger.log(`Payment successful for order ${orderCode}`);

        await this.paymentHistoryService.updateStatus(
          payment.id,
          'completed',
          reference,
          { transactionDateTime },
        );

        await this.walletService.addBalance(
          payment.userId,
          amount,
          `VNPay deposit ${amount.toLocaleString()} VND`,
        );
      } else {
        // Payment failed or cancelled
        this.logger.warn(`Payment failed for order ${orderCode}: ${desc}`);
        await this.paymentHistoryService.updateStatus(
          payment.id,
          'failed',
          reference,
          { transactionDateTime },
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Webhook handling failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPaymentStatus(paymentId: number) {
    const payment = await this.paymentHistoryService.findById(paymentId);

    if (!payment) {
      throw new BadRequestException('Order not found');
    }

    return {
      success: true,
      data: {
        orderCode: payment.id,
        orderNumber: payment.transactionId,
        status: payment.status,
        paymentStatus: payment.status,
        amount: payment.amount,
        paidAt: payment.updatedAt,
        transactionId: payment.transactionId,
      },
    };
  }
}
