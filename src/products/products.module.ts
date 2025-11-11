import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { ImageProcessingService } from './image-processing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductReview]), SupabaseModule],
  controllers: [ProductsController],
  providers: [ProductsService, ImageProcessingService],
  exports: [ProductsService],
})
export class ProductsModule {}
