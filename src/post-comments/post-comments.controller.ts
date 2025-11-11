import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PostCommentsService } from './post-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostCommentsController {
  constructor(private readonly postCommentsService: PostCommentsService) {}

  /**
   * POST /posts/:id/comments
   * Create a comment on a post
   */
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: { userId: string },
  ) {
    const comment = await this.postCommentsService.createComment(
      postId,
      user.userId,
      createCommentDto,
    );
    return {
      data: comment,
      message: 'Comment created successfully',
    };
  }

  /**
   * GET /posts/:id/comments
   * Get all comments for a post
   */
  @Get(':id/comments')
  @Public()
  async getPostComments(@Param('id', ParseUUIDPipe) postId: string) {
    const comments = await this.postCommentsService.getPostComments(postId);
    return {
      data: {
        comments,
        count: comments.length,
      },
    };
  }

  /**
   * DELETE /posts/:postId/comments/:commentId
   * Delete a comment
   */
  @Delete(':postId/comments/:commentId')
  async deleteComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.postCommentsService.deleteComment(commentId, user.userId);
    return {
      message: 'Comment deleted successfully',
    };
  }
}
