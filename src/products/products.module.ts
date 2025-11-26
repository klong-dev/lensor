import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { ImageProcessingService } from './image-processing.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AdminProductsController } from './admin-products.controller';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductReview, Order]),
    SupabaseModule,
    NotificationsModule,
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, ImageProcessingService],
  exports: [ProductsService],
})
export class ProductsModule {}
