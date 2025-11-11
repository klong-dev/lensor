import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { Post } from '../posts/entities/post.entity';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), SupabaseModule],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
