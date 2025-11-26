import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLikesService } from './post-likes.service';
import { PostLikesController } from './post-likes.controller';
import { PostLike } from './entities/post-like.entity';
import { Post } from 'src/posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostLike, Post])],
  controllers: [PostLikesController],
  providers: [PostLikesService],
  exports: [PostLikesService],
})
export class PostLikesModule {}
