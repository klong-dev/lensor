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

    // Calculate fee (17%) and actual amount
    const feeRate = 0.17; // 17%
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

    // Update withdrawal
    withdrawal.status = action;
    withdrawal.adminResponse = adminResponse || '';
    withdrawal.adminId = adminId;
    withdrawal.processedAt = new Date();

    await this.withdrawalRepository.save(withdrawal);

    if (action === 'approved') {
      // Create payment history for withdrawal (no wallet deduction needed)
      await this.paymentHistoryService.createHistory({
        userId: withdrawal.userId,
        orderId: null,
        paymentMethod: 'bank_transfer',
        transactionType: 'withdrawal',
        amount: Number(withdrawal.actualAmount), // Amount actually received
        status: 'completed',
        transactionId: withdrawalId,
        description: `Rút tiền về ${withdrawal.bankInfo.bankName} - ${withdrawal.bankInfo.accountNumber}`,
        metadata: {
          withdrawalId,
          orderIds: withdrawal.orderIds,
          bankInfo: withdrawal.bankInfo,
          totalAmount: withdrawal.amount,
          fee: withdrawal.fee,
          feeRate: '17%',
          actualAmount: withdrawal.actualAmount,
        },
        balanceBefore: 0, // Not using wallet for order earnings
        balanceAfter: 0,
      });

      // Update orders status to 'withdrawn'
      await this.ordersService.updateOrdersStatus(
        withdrawal.orderIds,
        'withdrawn',
      );

      // Notify seller - Withdrawal approved with fee breakdown
      await this.notificationsService.createNotification(
        withdrawal.userId,
        'withdrawal_approved',
        'Yêu cầu rút tiền đã được chấp nhận',
        `Yêu cầu rút tiền đã được chấp nhận:\n• Tổng tiền đơn hàng: ${Number(withdrawal.amount).toLocaleString('vi-VN')} VNĐ\n• Phí hệ thống (17%): ${Number(withdrawal.fee).toLocaleString('vi-VN')} VNĐ\n• Số tiền thực nhận: ${Number(withdrawal.actualAmount).toLocaleString('vi-VN')} VNĐ\n\nTiền sẽ được chuyển về tài khoản ${withdrawal.bankInfo.bankName} - ${withdrawal.bankInfo.accountNumber} (${withdrawal.bankInfo.accountHolder}) trong vòng 1-3 ngày làm việc.${adminResponse ? `\n\nGhi chú từ admin: ${adminResponse}` : ''}`,
        {
          withdrawalId,
          totalAmount: withdrawal.amount,
          fee: withdrawal.fee,
          actualAmount: withdrawal.actualAmount,
          bankInfo: withdrawal.bankInfo,
        },
        `/withdrawals/${withdrawalId}`,
      );
    } else if (action === 'rejected') {
      // Restore orders to ready_for_withdrawal
      await this.ordersService.updateOrdersStatus(
        withdrawal.orderIds,
        'ready_for_withdrawal',
      );

      // Notify seller - Withdrawal rejected
      await this.notificationsService.createNotification(
        withdrawal.userId,
        'withdrawal_rejected',
        'Yêu cầu rút tiền bị từ chối',
        `Yêu cầu rút tiền ${Number(withdrawal.amount).toLocaleString('vi-VN')} VNĐ đã bị từ chối. Lý do: ${adminResponse || 'Không có lý do cụ thể'}. Vui lòng kiểm tra lại thông tin thẻ ngân hàng hoặc liên hệ admin.`,
        {
          withdrawalId,
          amount: withdrawal.amount,
          reason: adminResponse,
        },
        `/withdrawals/${withdrawalId}`,
      );
    }

    return withdrawal;
  }
}
