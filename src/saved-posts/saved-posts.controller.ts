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
  save(@CurrentUser('sub') userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.save(userId, postId);
  }

  @Delete(':postId')
  unsave(@CurrentUser('sub') userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.unsave(userId, postId);
  }

  @Post(':postId/toggle')
  toggle(@CurrentUser('sub') userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.toggle(userId, postId);
  }

  @Get()
  findByUser(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.savedPostsService.findByUser(
      userId,
      limit ? +limit : 20,
      offset ? +offset : 0,
    );
  }

  @Get(':postId/is-saved')
  isSaved(@CurrentUser('sub') userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.isSaved(userId, postId);
  }
}
