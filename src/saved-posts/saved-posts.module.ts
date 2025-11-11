import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { SavedPost } from './entities/saved-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedPost])],
  providers: [SavedPostsService],
  controllers: [SavedPostsController],
  exports: [SavedPostsService],
})
export class SavedPostsModule {}
