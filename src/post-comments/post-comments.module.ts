import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostCommentsController } from './post-comments.controller';
import { PostCommentsService } from './post-comments.service';
import { PostComment } from './entities/post-comment.entity';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostComment]), SupabaseModule],
  controllers: [PostCommentsController],
  providers: [PostCommentsService],
  exports: [PostCommentsService],
})
export class PostCommentsModule {}
