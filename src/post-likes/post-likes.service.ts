import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike } from './entities/post-like.entity';

@Injectable()
export class PostLikesService {
  constructor(
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
  ) {}

  async GetLikedPostsByUser(
    userId: string,
  ): Promise<{ message: string; data: PostLike[] }> {
    const like = await this.postLikeRepository.find({
      where: { userId },
    });

    return {
      message: 'success',
      data: like,
    };
  }
  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<PostLike> {
    // Check if already liked
    const existingLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this post');
    }

    const like = this.postLikeRepository.create({ postId, userId });
    return await this.postLikeRepository.save(like);
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.postLikeRepository.remove(like);
  }

  /**
   * Get all likes for a post
   */
  async getPostLikes(
    postId: string,
  ): Promise<{ count: number; likes: PostLike[] }> {
    const likes = await this.postLikeRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });

    return {
      count: likes.length,
      likes,
    };
  }

  /**
   * Check if user liked a post
   */
  async isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    return !!like;
  }

  /**
   * Get like count for a post
   */
  async getPostLikeCount(postId: string): Promise<number> {
    return await this.postLikeRepository.count({
      where: { postId },
    });
  }
}
