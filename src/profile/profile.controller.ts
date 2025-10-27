import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Public()
  @Get(':userId/stats')
  getStats(@Param('userId') userId: string) {
    return this.profileService.getStats(userId);
  }

  @Get('stats')
  getMyStats(@CurrentUser('sub') userId: string) {
    return this.profileService.getStats(userId);
  }

  @Public()
  @Get(':userId/followers')
  getFollowers(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.profileService.getFollowers(
      userId,
      limit ? +limit : 20,
      offset ? +offset : 0,
    );
  }

  @Public()
  @Get(':userId/following')
  getFollowing(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.profileService.getFollowing(
      userId,
      limit ? +limit : 20,
      offset ? +offset : 0,
    );
  }

  @Post('follow/:userId')
  follow(
    @CurrentUser('sub') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.profileService.follow(followerId, followingId);
  }

  @Delete('unfollow/:userId')
  unfollow(
    @CurrentUser('sub') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.profileService.unfollow(followerId, followingId);
  }

  @Get('is-following/:userId')
  isFollowing(
    @CurrentUser('sub') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.profileService.isFollowing(followerId, followingId);
  }
}
