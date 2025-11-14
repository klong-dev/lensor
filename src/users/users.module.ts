import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { Post } from '../posts/entities/post.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [SupabaseModule, TypeOrmModule.forFeature([Post, Product])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
