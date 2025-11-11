import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class PaymentService {
  constructor(
    private ordersService: OrdersService,
    private configService: ConfigService,
  ) {}

  // Sort object keys and create query string for VNPay
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  // Create VNPay secure hash
  private createVNPaySecureHash(params: any): string {
    const sortedParams = this.sortObject(params);
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');
    const hmac = crypto.createHmac(
      'sha512',
      this.configService.get<string>('VNPAY_HASH_SECRET'),
    );
    return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  }

  // VNPay payment creation (sandbox)
  async createVNPayPayment(
    userId: string,
    amount: number,
    orderInfo: string,
    ipAddr: string = '127.0.0.1',
  ) {
    // Create order first
    const order = await this.ordersService.createOrder(
      userId,
      [],
      amount,
      'vnpay',
    );

    // Get current date in VNPay format: yyyyMMddHHmmss
    const date = new Date();
    const createDate =
      date.getFullYear().toString() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2);

    // VNPay parameters (sandbox mode)
    const vnpUrl = this.configService.get<string>('VNPAY_URL');
    const returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3005/payment/vnpay-return';

    const params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.configService.get<string>('VNPAY_TMN_CODE'),
      vnp_Amount: (amount * 100).toString(), // VNPay uses smallest currency unit (VND cents)
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${order.id}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: order.id,
    };

    // Create secure hash
    const secureHash = this.createVNPaySecureHash(params);
    params.vnp_SecureHash = secureHash;

    // Build payment URL
    const paymentUrl = `${vnpUrl}?${querystring.stringify(params)}`;

    return {
      paymentUrl,
      orderId: order.id,
      params,
    };
  }

  // Verify VNPay callback
  async verifyVNPayCallback(params: any) {
    const secureHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // Verify secure hash
    const calculatedHash = this.createVNPaySecureHash(params);

    if (secureHash !== calculatedHash) {
      return {
        success: false,
        message: 'Invalid signature',
      };
    }

    const orderId = params.vnp_TxnRef;
    const responseCode = params.vnp_ResponseCode;
    const status = responseCode === '00' ? 'completed' : 'failed';
    const transactionNo = params.vnp_TransactionNo;

    // Update order status
    await this.ordersService.updateOrderStatus(orderId, status, transactionNo);

    return {
      success: status === 'completed',
      orderId,
      responseCode,
      message: responseCode === '00' ? 'Payment successful' : 'Payment failed',
    };
  }

  // PayPal payment creation (sandbox)
  async createPayPalPayment(userId: string, amount: number) {
    const order = await this.ordersService.createOrder(
      userId,
      [],
      amount,
      'paypal',
    );

    // PayPal sandbox URL (simplified - actual implementation needs PayPal SDK)
    return {
      paymentUrl: `https://www.sandbox.paypal.com/checkoutnow?token=DEMO_${order.id}`,
      orderId: order.id,
      message: 'PayPal integration requires PayPal SDK setup',
    };
  }
}
