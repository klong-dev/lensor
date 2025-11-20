import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { Withdrawal } from './entities/withdrawal.entity';
import { OrdersModule } from '../orders/orders.module';
import { BankCardsModule } from '../bank-cards/bank-cards.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentHistoryModule } from '../payment-history/payment-history.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdrawal]),
    OrdersModule,
    BankCardsModule,
    WalletModule,
    NotificationsModule,
    PaymentHistoryModule,
    UploadModule,
  ],
  providers: [WithdrawalsService],
  controllers: [WithdrawalsController, AdminWithdrawalsController],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
