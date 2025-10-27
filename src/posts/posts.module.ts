import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { UserFollowsModule } from '../user-follows/user-follows.module';
import { ImageProcessingService } from '../products/image-processing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    SupabaseModule,
    UserFollowsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, ImageProcessingService],
  exports: [PostsService],
})
export class PostsModule {}
