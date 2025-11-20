import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from './entities/user-follow.entity';
import { UpdateUserFollowDto } from './dto/update-user-follow.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UserFollowsService {
  constructor(
    @InjectRepository(UserFollow)
    private userFollowRepository: Repository<UserFollow>,
    private notificationsService: NotificationsService,
  ) {}

  async follow(
    followerId: string,
    followingId: string,
    settings?: {
      notifyOnPost?: boolean;
      notifyOnComment?: boolean;
      notifyOnVote?: boolean;
    },
  ): Promise<UserFollow> {
    // Check if already following
    const existing = await this.userFollowRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    if (existing) {
      throw new ConflictException('You are already following this user');
    }

    const follow = this.userFollowRepository.create({
      followerId,
      followingId,
      notifyOnPost: settings?.notifyOnPost ?? true,
      notifyOnComment: settings?.notifyOnComment ?? true,
      notifyOnVote: settings?.notifyOnVote ?? false,
    });

    const saved = await this.userFollowRepository.save(follow);

    // Create notification for followed user
    try {
      await this.notificationsService.create({
        userId: followingId,
        action: 'started following you',
        targetId: followerId,
        targetType: 'user',
        category: 'social',
        icon: '👤',
        metadata: { followerId },
      });
    } catch (error) {
      // Log error but don't fail the follow operation
      console.error('Failed to create follow notification:', error);
    }

    return saved;
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const result = await this.userFollowRepository.delete({
      followerId,
      followingId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Follow relationship not found');
    }
  }

  async updateSettings(
    followerId: string,
    followingId: string,
    updateDto: UpdateUserFollowDto,
  ): Promise<UserFollow> {
    const follow = await this.userFollowRepository.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    Object.assign(follow, updateDto);
    return await this.userFollowRepository.save(follow);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.userFollowRepository.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }

  async getFollowSettings(
    followerId: string,
    followingId: string,
  ): Promise<UserFollow | null> {
    return await this.userFollowRepository.findOne({
      where: { followerId, followingId },
    });
  }

  async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ followers: UserFollow[]; total: number }> {
    const [followers, total] = await this.userFollowRepository.findAndCount({
      where: { followingId: userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { followers, total };
  }

  async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ following: UserFollow[]; total: number }> {
    const [following, total] = await this.userFollowRepository.findAndCount({
      where: { followerId: userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { following, total };
  }

  async getFollowersToNotify(
    userId: string,
    eventType: 'post' | 'comment' | 'vote',
  ): Promise<string[]> {
    const field =
      eventType === 'post'
        ? 'notifyOnPost'
        : eventType === 'comment'
          ? 'notifyOnComment'
          : 'notifyOnVote';

    const followers = await this.userFollowRepository.find({
      where: { followingId: userId, [field]: true },
    });

    return followers.map((f) => f.followerId);
  }

  async getFollowerCount(userId: string): Promise<number> {
    return await this.userFollowRepository.count({
      where: { followingId: userId },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return await this.userFollowRepository.count({
      where: { followerId: userId },
    });
  }
}
