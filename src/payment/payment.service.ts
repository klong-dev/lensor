import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentHistoryService } from '../payment-history/payment-history.service';
import * as crypto from 'crypto';
import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
} from '@paypal/paypal-server-sdk';
import type { OrderRequest } from '@paypal/paypal-server-sdk';

@Injectable()
export class PaymentService {
  private paypalClient: Client;
  private ordersController: OrdersController;

  constructor(
    private ordersService: OrdersService,
    private walletService: WalletService,
    private paymentHistoryService: PaymentHistoryService,
    private configService: ConfigService,
  ) {
    // Initialize PayPal Client
    this.paypalClient = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: this.configService.get<string>('PAYPAL_CLIENT_ID'),
        oAuthClientSecret: this.configService.get<string>(
          'PAYPAL_CLIENT_SECRET',
        ),
      },
      environment:
        this.configService.get<string>('PAYPAL_MODE') === 'production'
          ? Environment.Production
          : Environment.Sandbox,
    });
    this.ordersController = new OrdersController(this.paypalClient);
  }

  // Sort object keys and create query string for VNPay
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  // Create VNPay secure hash for payment request
  private createVNPaySecureHash(params: any): string {
    // Remove vnp_SecureHash and vnp_SecureHashType if exists (don't modify original)
    const paramsToHash = { ...params };
    delete paramsToHash.vnp_SecureHash;
    delete paramsToHash.vnp_SecureHashType;

    const sortedParams = this.sortObject(paramsToHash);

    // Create sign data string - VNPay encodes BOTH key and value
    const signData = Object.keys(sortedParams)
      .map((key) => {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(sortedParams[key]);
        return `${encodedKey}=${encodedValue}`;
      })
      .join('&');

    console.log('VNPay Sign Data:', signData);

    // Create HMAC SHA512
    const hmac = crypto.createHmac(
      'sha512',
      this.configService.get<string>('VNPAY_HASH_SECRET'),
    );
    const secureHash = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    console.log('VNPay Secure Hash:', secureHash);
    return secureHash;
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

    const orderInfoText = orderInfo || `Thanh toan don hang ${order.id}`;

    // All params for payment request (before adding vnp_SecureHash)
    const params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.configService.get<string>('VNPAY_TMN_CODE'),
      vnp_Amount: (amount * 100).toString(), // VNPay uses smallest currency unit (VND cents)
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderInfoText,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: order.id,
    };

    // Create secure hash from all params (using raw values)
    const secureHash = this.createVNPaySecureHash(params);

    // Add secure hash to params
    params.vnp_SecureHash = secureHash;

    // Build payment URL - params must be sorted and URL encoded
    const sortedParams = this.sortObject(params);
    const queryString = Object.keys(sortedParams)
      .map((key) => {
        // VNPay uses application/x-www-form-urlencoded format
        // Spaces become '+' not '%20'
        const encodedValue = encodeURIComponent(sortedParams[key]).replace(
          /%20/g,
          '+',
        );
        return `${key}=${encodedValue}`;
      })
      .join('&');
    const paymentUrl = `${vnpUrl}?${queryString}`;

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

    // Verify secure hash (same method as payment creation)
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
    const amount = parseInt(params.vnp_Amount) / 100; // Convert from VND cents to VND

    // Get order to find userId
    const order = await this.ordersService.getOrderById(orderId);
    const userId = order.userId;

    // Get wallet balance before transaction
    const balanceBefore = await this.walletService.getBalance(userId);

    // Create payment history record
    const paymentHistory = await this.paymentHistoryService.createHistory({
      userId,
      orderId,
      paymentMethod: 'vnpay',
      transactionType: 'deposit',
      amount,
      status,
      transactionId: transactionNo,
      description: `VNPay deposit - Order #${orderId}`,
      metadata: {
        vnpayResponse: params,
      },
      balanceBefore,
      balanceAfter: balanceBefore, // Will update after adding balance
    });

    // If payment successful, add money to wallet
    if (status === 'completed') {
      await this.walletService.addBalance(
        userId,
        amount,
        `VNPay deposit - Order #${orderId}`,
      );

      const balanceAfter = await this.walletService.getBalance(userId);

      // Update payment history with new balance
      await this.paymentHistoryService.updateStatus(
        paymentHistory.id,
        'completed',
        transactionNo,
        { balanceAfter },
      );
    }

    // Update order status
    await this.ordersService.updateOrderStatus(orderId, status, transactionNo);

    return {
      success: status === 'completed',
      orderId,
      responseCode,
      amount,
      balanceBefore,
      balanceAfter:
        status === 'completed'
          ? await this.walletService.getBalance(userId)
          : balanceBefore,
      message: responseCode === '00' ? 'Payment successful' : 'Payment failed',
    };
  }

  // PayPal payment creation (sandbox)
  async createPayPalPayment(
    userId: string,
    amount: number,
    orderInfo: string = 'Purchase from Lensor',
  ) {
    // Create order first
    const order = await this.ordersService.createOrder(
      userId,
      [],
      amount,
      'paypal',
    );

    try {
      // Create PayPal order request
      const orderRequest: OrderRequest = {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: order.id,
            description: orderInfo,
            customId: order.id,
            softDescriptor: 'LENSOR',
            amount: {
              currencyCode: 'USD',
              value: (amount / 23000).toFixed(2), // Convert VND to USD (approximate rate)
              breakdown: {
                itemTotal: {
                  currencyCode: 'USD',
                  value: (amount / 23000).toFixed(2),
                },
              },
            },
          },
        ],
        applicationContext: {
          returnUrl: `${this.configService.get<string>('PAYPAL_RETURN_URL') || 'http://localhost:3005/payment/paypal-return'}?orderId=${order.id}`,
          cancelUrl: `${this.configService.get<string>('PAYPAL_CANCEL_URL') || 'http://localhost:3005/payment/paypal-cancel'}?orderId=${order.id}`,
          brandName: 'Lensor',
          landingPage: OrderApplicationContextLandingPage.Billing,
          userAction: OrderApplicationContextUserAction.PayNow,
        },
      };

      // Create PayPal order
      const response = await this.ordersController.createOrder({
        body: orderRequest,
      });

      // Get approval URL
      const approvalUrl = response.result.links?.find(
        (link) => link.rel === 'approve',
      )?.href;

      return {
        success: true,
        paymentUrl: approvalUrl,
        orderId: order.id,
        paypalOrderId: response.result.id,
        status: response.result.status,
      };
    } catch (error) {
      console.error('PayPal order creation error:', error);
      // Update order status to failed
      await this.ordersService.updateOrderStatus(order.id, 'failed', null);
      throw new Error(
        `Failed to create PayPal payment: ${error.message || 'Unknown error'}`,
      );
    }
  }

  // Capture PayPal payment
  async capturePayPalPayment(paypalOrderId: string, orderId: string) {
    try {
      const response = await this.ordersController.captureOrder({
        id: paypalOrderId,
      });

      const captureStatus = response.result.status;
      const status = captureStatus === 'COMPLETED' ? 'completed' : 'failed';

      // Get transaction ID
      const transactionId =
        response.result.purchaseUnits?.[0]?.payments?.captures?.[0]?.id || null;

      // Get order to find userId and amount
      const order = await this.ordersService.getOrderById(orderId);
      const userId = order.userId;
      const amount = Number(order.totalAmount);

      // Get wallet balance before transaction
      const balanceBefore = await this.walletService.getBalance(userId);

      // Create payment history record
      const paymentHistory = await this.paymentHistoryService.createHistory({
        userId,
        orderId,
        paymentMethod: 'paypal',
        transactionType: 'deposit',
        amount,
        status,
        transactionId,
        description: `PayPal deposit - Order #${orderId}`,
        metadata: {
          paypalResponse: response.result,
        },
        balanceBefore,
        balanceAfter: balanceBefore,
      });

      // If payment successful, add money to wallet
      if (status === 'completed') {
        await this.walletService.addBalance(
          userId,
          amount,
          `PayPal deposit - Order #${orderId}`,
        );

        const balanceAfter = await this.walletService.getBalance(userId);

        // Update payment history with new balance
        await this.paymentHistoryService.updateStatus(
          paymentHistory.id,
          'completed',
          transactionId,
          { balanceAfter },
        );
      }

      // Update order status
      await this.ordersService.updateOrderStatus(
        orderId,
        status,
        transactionId,
      );

      return {
        success: status === 'completed',
        orderId,
        paypalOrderId,
        transactionId,
        status: captureStatus,
        amount,
        balanceBefore,
        balanceAfter:
          status === 'completed'
            ? await this.walletService.getBalance(userId)
            : balanceBefore,
        message:
          status === 'completed'
            ? 'Payment captured successfully'
            : 'Payment capture failed',
      };
    } catch (error) {
      console.error('PayPal capture error:', error);
      await this.ordersService.updateOrderStatus(orderId, 'failed', null);
      return {
        success: false,
        orderId,
        paypalOrderId,
        message: `Payment capture failed: ${error.message || 'Unknown error'}`,
      };
    }
  }

  // Create payment with channel selection
  async createPayment(
    userId: string,
    amount: number,
    paymentChannel: 'vnpay' | 'paypal',
    orderInfo: string,
    ipAddr?: string,
  ) {
    if (paymentChannel === 'vnpay') {
      return await this.createVNPayPayment(userId, amount, orderInfo, ipAddr);
    } else if (paymentChannel === 'paypal') {
      return await this.createPayPalPayment(userId, amount, orderInfo);
    } else {
      throw new Error(`Unsupported payment channel: ${paymentChannel}`);
    }
  }
}
