import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderSchedulerService } from './order-scheduler.service';
import { Order } from './entities/order.entity';
import { WalletModule } from '../wallet/wallet.module';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    WalletModule,
    CartModule,
    ProductsModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSchedulerService],
  exports: [OrdersService],
})
export class OrdersModule {}
