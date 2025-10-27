import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPost } from './entities/saved-post.entity';

@Injectable()
export class SavedPostsService {
  constructor(
    @InjectRepository(SavedPost)
    private savedPostRepository: Repository<SavedPost>,
  ) {}

  async save(userId: string, postId: string): Promise<SavedPost> {
    const existing = await this.savedPostRepository.findOne({
      where: { userId, postId },
    });

    if (existing) {
      return existing;
    }

    const savedPost = this.savedPostRepository.create({ userId, postId });
    return await this.savedPostRepository.save(savedPost);
  }

  async unsave(userId: string, postId: string): Promise<void> {
    await this.savedPostRepository.delete({ userId, postId });
  }

  async isSaved(userId: string, postId: string): Promise<boolean> {
    const count = await this.savedPostRepository.count({
      where: { userId, postId },
    });
    return count > 0;
  }

  async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ savedPosts: SavedPost[]; total: number }> {
    const [savedPosts, total] = await this.savedPostRepository.findAndCount({
      where: { userId },
      relations: ['post'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { savedPosts, total };
  }

  async toggle(userId: string, postId: string): Promise<{ saved: boolean }> {
    const existing = await this.savedPostRepository.findOne({
      where: { userId, postId },
    });

    if (existing) {
      await this.savedPostRepository.delete({ userId, postId });
      return { saved: false };
    } else {
      await this.savedPostRepository.save({ userId, postId });
      return { saved: true };
    }
  }
}
