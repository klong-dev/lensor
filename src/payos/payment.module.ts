import { Module } from '@nestjs/common';
import { PayOSController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { PaymentHistoryModule } from 'src/payment-history/payment-history.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [OrdersModule, ProductsModule, PaymentHistoryModule, WalletModule],
  controllers: [PayOSController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PayOSModule {}
