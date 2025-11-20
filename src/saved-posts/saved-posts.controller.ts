import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('saved-posts')
@UseGuards(JwtAuthGuard)
export class SavedPostsController {
  constructor(private readonly savedPostsService: SavedPostsService) {}

  @Post(':postId')
  save(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.savedPostsService.save(user.userId, postId);
  }

  @Delete(':postId')
  unsave(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.savedPostsService.unsave(user.userId, postId);
  }

  @Post(':postId/toggle')
  toggle(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.savedPostsService.toggle(user.userId, postId);
  }

  @Get()
  findByUser(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.savedPostsService.findByUser(
      user.userId,
      limit ? +limit : 20,
      offset ? +offset : 0,
    );
  }

  @Get(':postId/is-saved')
  isSaved(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    return this.savedPostsService.isSaved(user.userId, postId);
  }
}
