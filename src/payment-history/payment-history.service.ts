import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentHistory } from './entities/payment-history.entity';

export interface CreatePaymentHistoryDto {
  userId: string;
  orderId?: string;
  paymentMethod: string;
  transactionType: 'deposit' | 'payment' | 'refund' | 'withdrawal';
  amount: number;
  currency?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  description?: string;
  metadata?: any;
  balanceBefore?: number;
  balanceAfter?: number;
}

@Injectable()
export class PaymentHistoryService {
  constructor(
    @InjectRepository(PaymentHistory)
    private paymentHistoryRepository: Repository<PaymentHistory>,
  ) {}

  async findById(id: string): Promise<PaymentHistory | null> {
    return await this.paymentHistoryRepository.findOne({ where: { id } });
  }

  /**
   * Create payment history record
   */
  async createHistory(data: CreatePaymentHistoryDto): Promise<PaymentHistory> {
    const history = this.paymentHistoryRepository.create({
      ...data,
      currency: data.currency || 'VND',
    });

    return await this.paymentHistoryRepository.save(history);
  }

  /**
   * Get payment history by user ID
   */
  async getHistoryByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: PaymentHistory[]; total: number; page: number }> {
    const [data, total] = await this.paymentHistoryRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
    };
  }

  /**
   * Get payment history by order ID
   */
  async getHistoryByOrderId(orderId: string): Promise<PaymentHistory[]> {
    return await this.paymentHistoryRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update payment history status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    transactionId?: string,
    metadata?: any,
  ): Promise<PaymentHistory> {
    const history = await this.paymentHistoryRepository.findOne({
      where: { id },
    });

    if (!history) {
      throw new Error('Payment history not found');
    }

    history.status = status;
    if (transactionId) {
      history.transactionId = transactionId;
    }
    if (metadata) {
      history.metadata = { ...history.metadata, ...metadata };
    }

    return await this.paymentHistoryRepository.save(history);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(userId: string): Promise<{
    totalDeposit: number;
    totalPayment: number;
    totalRefund: number;
    transactionCount: number;
  }> {
    const histories = await this.paymentHistoryRepository.find({
      where: { userId, status: 'completed' },
    });

    const stats = histories.reduce(
      (acc, history) => {
        const amount = Number(history.amount);
        if (history.transactionType === 'deposit') {
          acc.totalDeposit += amount;
        } else if (history.transactionType === 'payment') {
          acc.totalPayment += amount;
        } else if (history.transactionType === 'refund') {
          acc.totalRefund += amount;
        }
        acc.transactionCount++;
        return acc;
      },
      {
        totalDeposit: 0,
        totalPayment: 0,
        totalRefund: 0,
        transactionCount: 0,
      },
    );

    return stats;
  }
}
