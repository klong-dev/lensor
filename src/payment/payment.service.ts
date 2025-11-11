import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentService {
  constructor(private ordersService: OrdersService) {}

  // VNPay payment creation (sandbox)
  async createVNPayPayment(userId: string, amount: number, orderInfo: string) {
    // Create order first
    const order = await this.ordersService.createOrder(
      userId,
      [],
      amount,
      'vnpay',
    );

    // VNPay parameters (sandbox mode)
    const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = `${process.env.BACKEND_URL}/payment/vnpay/callback`;
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
      vnp_Amount: amount * 100, // VNPay uses smallest currency unit
      vnp_CreateDate: new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0],
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: order.id,
    };

    return {
      paymentUrl: vnpUrl,
      params,
      orderId: order.id,
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

  // Verify VNPay callback
  async verifyVNPayCallback(params: any) {
    const orderId = params.vnp_TxnRef;
    const status = params.vnp_ResponseCode === '00' ? 'completed' : 'failed';

    await this.ordersService.updateOrderStatus(
      orderId,
      status,
      params.vnp_TransactionNo,
    );

    return { success: status === 'completed', orderId };
  }
}
