import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    return await this.notificationRepository.save(notification);
  }

  async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    notifications: Notification[];
    meta: { unreadCount: number; totalCount: number };
  }> {
    const [notifications, totalCount] =
      await this.notificationRepository.findAndCount({
        where: { userId },
        order: { time: 'DESC' },
        take: limit,
        skip: offset,
      });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return {
      notifications,
      meta: {
        unreadCount,
        totalCount,
      },
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    await this.notificationRepository.update({ id, userId }, { read: true });
    return await this.notificationRepository.findOne({ where: { id } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId }, { read: true });
  }

  async update(
    id: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    await this.notificationRepository.update(
      { id, userId },
      updateNotificationDto,
    );
    return await this.notificationRepository.findOne({ where: { id } });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  // Helper method for creating notifications easily
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any,
    actionUrl?: string,
  ) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      action: title, // Keep backward compatibility
      metadata,
      actionUrl,
      targetId: metadata?.orderId || metadata?.reportId || null,
      targetType: metadata?.orderId
        ? 'order'
        : metadata?.reportId
          ? 'report'
          : null,
    });

    return await this.notificationRepository.save(notification);
  }
}
