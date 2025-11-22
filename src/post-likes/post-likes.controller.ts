import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PostLikesService } from './post-likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  /**
   * POST /posts/:id/like
   * Like a post
   */
  @Get('liked')
  @Public()
  async getLikedPosts(@CurrentUser() user: { userId: string }) {
    const result = await this.postLikesService.GetLikedPostsByUser(user.userId);
    return {
      data: result,
    };
  }

  @Post(':id/like')
  async likePost(
    @Param('id', ParseUUIDPipe) postId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const like = await this.postLikesService.likePost(postId, user.userId);
    return {
      data: like,
      message: 'Post liked successfully',
    };
  }

  /**
   * DELETE /posts/:id/like
   * Unlike a post
   */
  @Delete(':id/like')
  async unlikePost(
    @Param('id', ParseUUIDPipe) postId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.postLikesService.unlikePost(postId, user.userId);
    return {
      message: 'Post unliked successfully',
    };
  }

  /**
   * GET /posts/:id/likes
   * Get all likes for a post
   */
  @Get(':id/likes')
  @Public()
  async getPostLikes(@Param('id', ParseUUIDPipe) postId: string) {
    const result = await this.postLikesService.getPostLikes(postId);
    return {
      data: result,
    };
  }

  /**
   * GET /posts/:id/is-liked
   * Check if current user liked a post
   */
  @Get(':id/is-liked')
  async isPostLiked(
    @Param('id', ParseUUIDPipe) postId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const isLiked = await this.postLikesService.isPostLikedByUser(
      postId,
      user.userId,
    );
    return {
      data: { isLiked },
    };
  }
}
