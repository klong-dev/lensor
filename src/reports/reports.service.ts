import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { OrdersService } from '../orders/orders.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private ordersService: OrdersService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
  ) {}

  async createReport(userId: string, createReportDto: CreateReportDto) {
    // Get order to verify buyer and check 3-day window
    const order = await this.ordersService.getOrder(
      createReportDto.orderId,
      userId,
    );

    if (!order) {
      throw new BadRequestException('Order not found or access denied');
    }

    if (order.status !== 'completed') {
      throw new BadRequestException('Can only report completed orders');
    }

    // Check if within 3-day window
    const now = new Date();
    const orderDate = new Date(order.createdAt);
    const daysDiff = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff > 3) {
      throw new BadRequestException(
        'Report period has expired. You can only report within 3 days of purchase.',
      );
    }

    // Check if already reported
    const existingReport = await this.reportRepository.findOne({
      where: { orderId: createReportDto.orderId },
    });

    if (existingReport) {
      throw new BadRequestException('Order has already been reported');
    }

    // Find seller from order items
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const productItem = orderItems.find(
      (item: any) => item.productId === createReportDto.productId,
    );

    if (!productItem) {
      throw new BadRequestException('Product not found in order');
    }

    const sellerId = productItem.sellerId;

    // Create report
    const report = this.reportRepository.create({
      orderId: createReportDto.orderId,
      buyerId: userId,
      sellerId,
      productId: createReportDto.productId,
      reason: createReportDto.reason,
      evidence: createReportDto.evidence || [],
      status: 'pending',
    });

    const savedReport = await this.reportRepository.save(report);

    // Update order status
    await this.ordersService.updateOrderStatus(
      createReportDto.orderId,
      'reported',
      null,
    );

    // Notify seller
    await this.notificationsService.createNotification(
      sellerId,
      'report_created',
      'Your product has been reported',
      `A buyer has reported order #${createReportDto.orderId}. The order is under review.`,
      { reportId: savedReport.id, orderId: createReportDto.orderId },
      `/reports/${savedReport.id}`,
    );

    return savedReport;
  }

  async getMyReports(userId: string) {
    return await this.reportRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async getReportById(reportId: string, userId: string) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Check if user is buyer or seller
    if (report.buyerId !== userId && report.sellerId !== userId) {
      throw new BadRequestException('Access denied');
    }

    return report;
  }

  // Admin methods
  async getAllReports(status?: string) {
    const where = status ? { status } : {};
    return await this.reportRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async handleAdminAction(
    reportId: string,
    adminId: string,
    adminActionDto: AdminActionDto,
  ) {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== 'pending') {
      throw new BadRequestException('Report has already been processed');
    }

    const { action, adminResponse } = adminActionDto;

    // Update report
    report.status = action;
    report.adminResponse = adminResponse || '';
    report.adminId = adminId;
    report.resolvedAt = new Date();

    await this.reportRepository.save(report);

    // Get order
    const order = await this.ordersService.getOrderById(report.orderId);

    if (action === 'approved') {
      // Refund buyer
      await this.walletService.addBalance(
        report.buyerId,
        Number(order.totalAmount),
        `Refund for order #${report.orderId} - Report approved`,
      );

      // Update order status
      await this.ordersService.updateOrderStatus(
        report.orderId,
        'refunded',
        null,
      );

      // Notify buyer
      await this.notificationsService.createNotification(
        report.buyerId,
        'report_approved',
        'Your report has been approved',
        `Your report has been approved. Amount ${order.totalAmount} has been refunded to your wallet.`,
        { reportId, orderId: report.orderId },
        `/orders/${report.orderId}`,
      );

      // Notify seller
      await this.notificationsService.createNotification(
        report.sellerId,
        'report_approved',
        'Report against your product was approved',
        `The report for order #${report.orderId} has been approved. The buyer has been refunded.`,
        { reportId, orderId: report.orderId },
        `/reports/${reportId}`,
      );
    } else if (action === 'rejected') {
      // Restore order to ready_for_withdrawal
      await this.ordersService.updateOrderStatus(
        report.orderId,
        'ready_for_withdrawal',
        null,
      );

      // Notify buyer
      await this.notificationsService.createNotification(
        report.buyerId,
        'report_rejected',
        'Your report has been rejected',
        `Your report has been rejected. Reason: ${adminResponse}`,
        { reportId, orderId: report.orderId },
        `/reports/${reportId}`,
      );

      // Notify seller
      await this.notificationsService.createNotification(
        report.sellerId,
        'report_rejected',
        'Report against your product was rejected',
        `The report for order #${report.orderId} has been rejected. You can now withdraw your earnings.`,
        { reportId, orderId: report.orderId },
        `/orders/${report.orderId}`,
      );
    } else if (action === 'need_more_info') {
      // Keep status as pending, request more info from buyer
      report.status = 'pending';
      await this.reportRepository.save(report);

      // Notify buyer
      await this.notificationsService.createNotification(
        report.buyerId,
        'report_need_info',
        'More information needed for your report',
        `Admin needs more information: ${adminResponse}`,
        { reportId, orderId: report.orderId },
        `/reports/${reportId}`,
      );
    }

    return report;
  }
}
