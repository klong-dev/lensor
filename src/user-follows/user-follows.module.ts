import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFollowsService } from './user-follows.service';
import { UserFollowsController } from './user-follows.controller';
import { UserFollow } from './entities/user-follow.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserFollow]), NotificationsModule],
  providers: [UserFollowsService],
  controllers: [UserFollowsController],
  exports: [UserFollowsService],
})
export class UserFollowsModule {}
