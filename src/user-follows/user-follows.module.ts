import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFollow } from './entities/user-follow.entity';
import { UserFollowsService } from './user-follows.service';
import { UserFollowsController } from './user-follows.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserFollow]), NotificationsModule],
  controllers: [UserFollowsController],
  providers: [UserFollowsService],
  exports: [UserFollowsService],
})
export class UserFollowsModule {}
