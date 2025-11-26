import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { AdminWithdrawalActionDto } from './dto/admin-withdrawal-action.dto';
import { OrdersService } from '../orders/orders.service';
import { BankCardsService } from '../bank-cards/bank-cards.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentHistoryService } from '../payment-history/payment-history.service';
import { SystemVariablesService } from '../system-variables/system-variables.service';
import { ProductsService } from '../products/products.service';
import { CheckWithdrawalDto } from './dto/check-withdrawal.dto';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    private ordersService: OrdersService,
    private bankCardsService: BankCardsService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private paymentHistoryService: PaymentHistoryService,
    private systemVariablesService: SystemVariablesService,
    private productsService: ProductsService,
  ) {}

  async createWithdrawal(
    userId: string,
    createWithdrawalDto: CreateWithdrawalDto,
  ) {
    const { bankCardId, orderIds, note } = createWithdrawalDto;

    // Verify bank card belongs to user
    const bankCard = await this.bankCardsService.getCardById(
      bankCardId,
      userId,
    );

    // Verify all orders are ready for withdrawal and belong to user
    const orders = await this.ordersService.getOrdersByIds(orderIds);

    if (orders.length !== orderIds.length) {
      throw new BadRequestException('Some orders not found');
    }

    let totalAmount = 0;
    const invalidOrders = [];

    for (const order of orders) {
      // Check if seller in order items matches userId
      const orderItems = Array.isArray(order.items) ? order.items : [];
      const isOrderSeller = orderItems.some(
        (item: any) => item.sellerId === userId,
      );

      if (!isOrderSeller) {
        invalidOrders.push(
          `Order ${order.id} does not belong to you as seller`,
        );
        continue;
      }

      if (order.status !== 'ready_for_withdrawal') {
        invalidOrders.push(
          `Order ${order.id} is not ready for withdrawal (status: ${order.status})`,
        );
        continue;
      }

      if (!order.canWithdraw) {
        invalidOrders.push(`Order ${order.id} is not eligible for withdrawal`);
        continue;
      }

      // Calculate seller's amount from this order
      const sellerAmount = orderItems
        .filter((item: any) => item.sellerId === userId)
        .reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);

      totalAmount += sellerAmount;
    }

    if (invalidOrders.length > 0) {
      throw new BadRequestException(
        `Invalid orders: ${invalidOrders.join(', ')}`,
      );
    }

    if (totalAmount === 0) {
      throw new BadRequestException(
        'Total withdrawal amount must be greater than 0',
      );
    }

    // Calculate fee (use system variable)
    const feeRate =
      (await this.systemVariablesService.getVariable('discountRate')) / 100;
    const fee = totalAmount * feeRate;
    const actualAmount = totalAmount - fee;

    // Create withdrawal request
    const withdrawal = this.withdrawalRepository.create({
      userId,
      bankCardId,
      amount: totalAmount,
      fee,
      actualAmount,
      orderIds,
      note,
      status: 'pending',
      bankInfo: {
        bankName: bankCard.bankName,
        accountNumber: bankCard.accountNumber,
        accountHolder: bankCard.accountHolder,
      },
    });

    const savedWithdrawal = await this.withdrawalRepository.save(withdrawal);

    // Update orders status to 'withdrawing'
    await this.ordersService.updateOrdersStatus(orderIds, 'withdrawing');

    return savedWithdrawal;
  }

  async checkWithdrawal(
    userId: string,
    checkWithdrawalDto: CheckWithdrawalDto,
  ) {
    const { orderIds } = checkWithdrawalDto;
    const orders = await Promise.all(
      orderIds.map((orderId) => this.ordersService.getOrderById(orderId)),
    );
    let totalAmount = 0;
    let discountAmount = 0;
    for (const order of orders) {
      const products = Array.isArray(order.items) ? order.items : [];
      const productArray = [];
      for (const product of products) {
        const prod = await this.productsService.findOne(product.productId);
        totalAmount += prod.price;
        productArray.push(prod);
      }
      await Promise.all(productArray);
      order.items = productArray;
    }
    discountAmount =
      totalAmount *
      ((await this.systemVariablesService.getVariable('discountRate')) / 100);
    return {
      success: true,
      message: 'Check completed',
      data: {
        totalAmount,
        discountAmount,
        payableAmount: totalAmount - discountAmount,
        orders,
      },
    };
  }

  async getMyWithdrawals(userId: string) {
    return await this.withdrawalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getWithdrawalById(withdrawalId: string, userId: string) {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId, userId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  // Admin methods
  async getAllWithdrawals(status?: string) {
    const where = status ? { status } : {};
    return await this.withdrawalRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async handleAdminAction(
    withdrawalId: string,
    adminId: string,
    adminActionDto: AdminWithdrawalActionDto,
    paymentProofImageUrl?: string[],
  ) {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal has already been processed');
    }

    const { action, adminResponse } = adminActionDto;

    // Update basic withdrawal info
    withdrawal.status = action;
    withdrawal.adminResponse = adminResponse || '';
    withdrawal.adminId = adminId;
    withdrawal.processedAt = new Date();

    if (action === 'approved') {
      if (!paymentProofImageUrl) {
        throw new BadRequestException(
          'Payment proof image is required for approval.',
        );
      }
      withdrawal.paymentProofImageUrl = paymentProofImageUrl;
    }

    // Save changes before proceeding
    const updatedWithdrawal = await this.withdrawalRepository.save(withdrawal);

    if (action === 'approved') {
      // Create payment history for the successful withdrawal
      const feeRate =
        (await this.systemVariablesService.getVariable('discountRate')) ?? 0.17;
      await this.paymentHistoryService.createHistory({
        userId: updatedWithdrawal.userId,
        orderId: null,
        paymentMethod: 'bank_transfer',
        transactionType: 'withdrawal',
        amount: Number(updatedWithdrawal.actualAmount),
        status: 'completed',
        transactionId: withdrawalId,
        description: `Rút tiền về ${updatedWithdrawal.bankInfo.bankName} - ${updatedWithdrawal.bankInfo.accountNumber}`,
        metadata: {
          withdrawalId,
          orderIds: updatedWithdrawal.orderIds,
          bankInfo: updatedWithdrawal.bankInfo,
          totalAmount: updatedWithdrawal.amount,
          fee: updatedWithdrawal.fee,
          feeRate: `${feeRate * 100}%`,
          actualAmount: updatedWithdrawal.actualAmount,
          paymentProofImageUrl: updatedWithdrawal.paymentProofImageUrl,
        },
        balanceBefore: 0, // Not applicable for direct withdrawal
        balanceAfter: 0, // Not applicable for direct withdrawal
      });

      // Finalize order statuses
      await this.ordersService.updateOrdersStatus(
        updatedWithdrawal.orderIds,
        'withdrawn',
      );

      // Notify the seller
      await this.notificationsService.createNotification(
        updatedWithdrawal.userId,
        'withdrawal_approved',
        'Yêu cầu rút tiền đã được chấp nhận',
        `Yêu cầu rút tiền đã được chấp nhận:\n• Tổng tiền đơn hàng: ${Number(
          updatedWithdrawal.amount,
        ).toLocaleString(
          'vi-VN',
        )} VNĐ\n• Phí hệ thống (${feeRate * 100}%): ${Number(
          updatedWithdrawal.fee,
        ).toLocaleString('vi-VN')} VNĐ\n• Số tiền thực nhận: ${Number(
          updatedWithdrawal.actualAmount,
        ).toLocaleString('vi-VN')} VNĐ\n\nTiền sẽ được chuyển về tài khoản ${
          updatedWithdrawal.bankInfo.bankName
        } - ${updatedWithdrawal.bankInfo.accountNumber} (${updatedWithdrawal.bankInfo.accountHolder}) trong vòng 1-3 ngày làm việc.${
          adminResponse ? `\n\nGhi chú từ admin: ${adminResponse}` : ''
        }`,
        {
          withdrawalId,
          totalAmount: updatedWithdrawal.amount,
          fee: updatedWithdrawal.fee,
          actualAmount: updatedWithdrawal.actualAmount,
          bankInfo: updatedWithdrawal.bankInfo,
          paymentProofImageUrl: updatedWithdrawal.paymentProofImageUrl,
        },
        `/withdrawals/${withdrawalId}`,
      );
    } else if (action === 'rejected') {
      // Restore orders to their previous state
      await this.ordersService.updateOrdersStatus(
        withdrawal.orderIds,
        'ready_for_withdrawal',
      );

      // Notify the seller of the rejection
      await this.notificationsService.createNotification(
        withdrawal.userId,
        'withdrawal_rejected',
        'Yêu cầu rút tiền bị từ chối',
        `Yêu cầu rút tiền ${Number(withdrawal.amount).toLocaleString(
          'vi-VN',
        )} VNĐ đã bị từ chối. Lý do: ${
          adminResponse || 'Không có lý do cụ thể'
        }. Vui lòng kiểm tra lại thông tin thẻ ngân hàng hoặc liên hệ admin.`,
        {
          withdrawalId,
          amount: withdrawal.amount,
          reason: adminResponse,
        },
        `/withdrawals/${withdrawalId}`,
      );
    }

    return updatedWithdrawal;
  }

  async getWithdrawalStatisticsByAdmin(options: {
    year?: number;
    month?: number;
  }) {
    const { year, month } = options;

    const queryBuilder =
      this.withdrawalRepository.createQueryBuilder('withdrawal');

    queryBuilder.where('withdrawal.status = :status', { status: 'approved' });

    // Nếu có month thì BẮT BUỘC phải có year
    if (month && !year) {
      throw new BadRequestException('Year is required when filtering by month');
    }

    if (year) {
      queryBuilder.andWhere(
        'EXTRACT(YEAR FROM withdrawal.processedAt) = :year',
        { year },
      );
    }

    if (month) {
      queryBuilder.andWhere(
        'EXTRACT(MONTH FROM withdrawal.processedAt) = :month',
        { month },
      );
    }

    const result = await queryBuilder
      .select('SUM(withdrawal.amount)', 'totalAmount')
      .addSelect('SUM(withdrawal.fee)', 'totalFee')
      .addSelect('SUM(withdrawal.actualAmount)', 'totalActualAmount')
      .addSelect('COUNT(withdrawal.id)', 'totalWithdrawals')
      .getRawOne();

    const formatVND = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    };

    const totalAmount = parseFloat(result.totalAmount) || 0;
    const totalFee = parseFloat(result.totalFee) || 0;
    const totalActualAmount = parseFloat(result.totalActualAmount) || 0;
    const totalWithdrawals = parseInt(result.totalWithdrawals, 10) || 0;

    return {
      totalWithdrawals,
      totalAmount,
      totalFee,
      totalActualAmount,
      formattedTotalAmount: formatVND(totalAmount),
      formattedTotalFee: formatVND(totalFee),
      formattedTotalActualAmount: formatVND(totalActualAmount),
      filters: {
        year: year || 'all',
        month: month || 'all',
      },
    };
  }

  async getWithdrawalStatisticsByUser(
    userId: string,
    options: {
      year?: number;
      month?: number;
    },
  ) {
    const { year, month } = options;

    const queryBuilder =
      this.withdrawalRepository.createQueryBuilder('withdrawal');

    queryBuilder.where('withdrawal.status = :status', { status: 'approved' });
    queryBuilder.andWhere('withdrawal.userId = :userId', { userId });

    // Nếu có month thì BẮT BUỘC phải có year
    if (month && !year) {
      throw new BadRequestException('Year is required when filtering by month');
    }

    if (year) {
      queryBuilder.andWhere(
        'EXTRACT(YEAR FROM withdrawal.processedAt) = :year',
        { year },
      );
    }

    if (month) {
      queryBuilder.andWhere(
        'EXTRACT(MONTH FROM withdrawal.processedAt) = :month',
        { month },
      );
    }

    const result = await queryBuilder
      .select('SUM(withdrawal.amount)', 'totalAmount')
      .addSelect('SUM(withdrawal.fee)', 'totalFee')
      .addSelect('SUM(withdrawal.actualAmount)', 'totalActualAmount')
      .addSelect('COUNT(withdrawal.id)', 'totalWithdrawals')
      .getRawOne();

    const totalAmount = parseFloat(result.totalAmount) || 0;
    const totalFee = parseFloat(result.totalFee) || 0;
    const totalActualAmount = parseFloat(result.totalActualAmount) || 0;
    const totalWithdrawals = parseInt(result.totalWithdrawals, 10) || 0;

    return {
      totalWithdrawals,
      totalAmount,
      totalFee,
      totalActualAmount,
      filters: {
        year: year || 'all',
        month: month || 'all',
      },
    };
  }
}
