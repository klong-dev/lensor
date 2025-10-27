import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserFollowsService } from './user-follows.service';
import { CreateUserFollowDto } from './dto/create-user-follow.dto';
import { UpdateUserFollowDto } from './dto/update-user-follow.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user-follows')
export class UserFollowsController {
  constructor(private readonly userFollowsService: UserFollowsService) {}

  @Post(':followingId')
  follow(
    @CurrentUser('userId') followerId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
    @Body() createUserFollowDto?: CreateUserFollowDto,
  ) {
    return this.userFollowsService.follow(followerId, followingId, {
      notifyOnPost: createUserFollowDto?.notifyOnPost ?? true,
      notifyOnComment: createUserFollowDto?.notifyOnComment ?? true,
      notifyOnVote: createUserFollowDto?.notifyOnVote ?? false,
    });
  }

  @Delete(':followingId')
  unfollow(
    @CurrentUser('userId') followerId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
  ) {
    return this.userFollowsService.unfollow(followerId, followingId);
  }

  @Patch(':followingId')
  updateSettings(
    @CurrentUser('userId') followerId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
    @Body() updateUserFollowDto: UpdateUserFollowDto,
  ) {
    return this.userFollowsService.updateSettings(
      followerId,
      followingId,
      updateUserFollowDto,
    );
  }

  @Get('followers')
  getFollowers(@CurrentUser('userId') userId: string) {
    return this.userFollowsService.getFollowers(userId);
  }

  @Get('following')
  getFollowing(@CurrentUser('userId') userId: string) {
    return this.userFollowsService.getFollowing(userId);
  }

  @Get(':userId/followers')
  getFollowersByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userFollowsService.getFollowers(userId);
  }

  @Get(':userId/following')
  getFollowingByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userFollowsService.getFollowing(userId);
  }
}
