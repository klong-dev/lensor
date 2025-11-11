import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async createOrder(
    userId: string,
    items: any[],
    totalAmount: number,
    paymentMethod: string,
  ) {
    const order = this.orderRepository.create({
      userId,
      items,
      totalAmount,
      paymentMethod,
      status: 'pending',
    });
    return await this.orderRepository.save(order);
  }

  async getOrders(userId: string) {
    return await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrder(orderId: string, userId: string) {
    return await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
  }

  async getOrderById(orderId: string) {
    return await this.orderRepository.findOne({
      where: { id: orderId },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    transactionId?: string,
  ) {
    await this.orderRepository.update(orderId, { status, transactionId });
  }
}
