import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserFollowsService } from './user-follows.service';
import { CreateUserFollowDto } from './dto/create-user-follow.dto';
import { UpdateUserFollowDto } from './dto/update-user-follow.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('user-follows')
@UseGuards(JwtAuthGuard)
export class UserFollowsController {
  constructor(private readonly userFollowsService: UserFollowsService) {}

  // Follow a user
  @Post(':followingId')
  async follow(
    @CurrentUser('userId') followerId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
    @Body() createUserFollowDto?: CreateUserFollowDto,
  ) {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const follow = await this.userFollowsService.follow(
      followerId,
      followingId,
      {
        notifyOnPost: createUserFollowDto?.notifyOnPost ?? true,
        notifyOnComment: createUserFollowDto?.notifyOnComment ?? true,
        notifyOnVote: createUserFollowDto?.notifyOnVote ?? false,
      },
    );

    return {
      success: true,
      message: 'Successfully followed user',
      data: follow,
    };
  }

  // Unfollow a user
  @Delete(':followingId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @CurrentUser('userId') followerId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
  ) {
    await this.userFollowsService.unfollow(followerId, followingId);

    return {
      success: true,
      message: 'Successfully unfollowed user',
    };
  }

  // Update notification settings for a follow
  @Patch(':followingId/settings')
  async updateSettings(
    @CurrentUser('userId') followerId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
    @Body() updateUserFollowDto: UpdateUserFollowDto,
  ) {
    const updated = await this.userFollowsService.updateSettings(
      followerId,
      followingId,
      updateUserFollowDto,
    );

    return {
      success: true,
      message: 'Notification settings updated',
      data: updated,
    };
  }

  // Check if current user is following another user
  @Get('check/:userId')
  async checkFollowing(
    @CurrentUser('userId') followerId: string,
    @Param('userId', ParseUUIDPipe) followingId: string,
  ) {
    const isFollowing = await this.userFollowsService.isFollowing(
      followerId,
      followingId,
    );

    return {
      success: true,
      data: { isFollowing },
    };
  }

  // Get current user's followers
  @Get('followers')
  async getMyFollowers(@CurrentUser('userId') userId: string) {
    const result = await this.userFollowsService.getFollowers(userId);

    return {
      success: true,
      data: result,
    };
  }

  // Get users that current user is following
  @Get('following')
  async getMyFollowing(@CurrentUser('userId') userId: string) {
    const result = await this.userFollowsService.getFollowing(userId);

    return {
      success: true,
      data: result,
    };
  }

  // Get followers of a specific user
  @Get(':userId/followers')
  async getFollowersByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    const result = await this.userFollowsService.getFollowers(userId);

    return {
      success: true,
      data: result,
    };
  }

  // Get users that a specific user is following
  @Get(':userId/following')
  async getFollowingByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    const result = await this.userFollowsService.getFollowing(userId);

    return {
      success: true,
      data: result,
    };
  }

  // Get follow stats for a user
  @Get(':userId/stats')
  async getFollowStats(@Param('userId', ParseUUIDPipe) userId: string) {
    const followers = await this.userFollowsService.getFollowers(userId);
    const following = await this.userFollowsService.getFollowing(userId);

    return {
      success: true,
      data: {
        followersCount: followers.total,
        followingCount: following.total,
      },
    };
  }
}
