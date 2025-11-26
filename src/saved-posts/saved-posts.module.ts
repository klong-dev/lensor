import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { SavedPost } from './entities/saved-post.entity';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([SavedPost]), PostsModule],
  providers: [SavedPostsService],
  controllers: [SavedPostsController],
  exports: [SavedPostsService],
})
export class SavedPostsModule {}
