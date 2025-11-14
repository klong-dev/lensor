import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private notificationsService: NotificationsService,
  ) {}

  // Run every hour to check for orders ready for withdrawal
  @Cron(CronExpression.EVERY_HOUR)
  async checkOrdersReadyForWithdrawal() {
    this.logger.log('Checking orders ready for withdrawal...');

    const now = new Date();

    // Find completed orders that are past withdrawable date and not yet marked
    const orders = await this.orderRepository.find({
      where: {
        status: 'completed',
        canWithdraw: false,
        withdrawableAt: LessThan(now),
        reportId: IsNull(),
      },
    });

    this.logger.log(`Found ${orders.length} orders ready for withdrawal`);

    for (const order of orders) {
      try {
        // Update order to ready_for_withdrawal
        await this.orderRepository.update(order.id, {
          canWithdraw: true,
          status: 'ready_for_withdrawal',
        });

        // Get unique sellers from order items
        const orderItems = Array.isArray(order.items) ? order.items : [];
        const sellerIds = [
          ...new Set(orderItems.map((item: any) => item.sellerId)),
        ];

        // Notify each seller
        for (const sellerId of sellerIds) {
          if (sellerId) {
            const sellerItems = orderItems.filter(
              (item: any) => item.sellerId === sellerId,
            );
            const sellerEarnings = sellerItems.reduce(
              (sum: number, item: any) => sum + (item.subtotal || 0),
              0,
            );

            await this.notificationsService.createNotification(
              sellerId,
              'order_ready_for_withdrawal',
              'Earnings ready for withdrawal',
              `Order #${order.id} is now ready for withdrawal. Amount: ${sellerEarnings}`,
              { orderId: order.id, amount: sellerEarnings },
              `/orders/sold`,
            );
          }
        }

        this.logger.log(`Order ${order.id} marked as ready for withdrawal`);
      } catch (error) {
        this.logger.error(
          `Error processing order ${order.id}: ${error.message}`,
        );
      }
    }

    this.logger.log('Order withdrawal check completed');
  }
}
