import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PostComment } from './entities/post-comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PostCommentsService {
  constructor(
    @InjectRepository(PostComment)
    private commentRepository: Repository<PostComment>,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Create a comment on a post
   */
  async createComment(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<PostComment> {
    const comment = this.commentRepository.create({
      postId,
      userId,
      ...createCommentDto,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Fetch user info
    const user = await this.supabaseService.getUserById(userId);
    savedComment.user = {
      id: userId,
      name: user?.name || user?.email || 'Unknown User',
      avatarUrl: user?.avatar_url || '/images/default_avatar.jpg',
    };

    return savedComment;
  }

  /**
   * Get all comments for a post (with user info)
   */
  async getPostComments(postId: string): Promise<PostComment[]> {
    const comments = await this.commentRepository.find({
      where: { postId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    // Fetch user info for each comment
    return await Promise.all(
      comments.map(async (comment) => {
        const user = await this.supabaseService.getUserById(comment.userId);
        return {
          ...comment,
          user: {
            id: comment.userId,
            name: user?.name || user?.email || 'Unknown User',
            avatarUrl: user?.avatar_url || '/images/default_avatar.jpg',
          },
        };
      }),
    );
  }

  /**
   * Get comment count for a post
   */
  async getCommentCount(postId: string): Promise<number> {
    return await this.commentRepository.count({
      where: { postId, deletedAt: IsNull() },
    });
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.deletedAt = new Date();
    await this.commentRepository.save(comment);
  }
}
