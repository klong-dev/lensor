import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentHistoryController } from './payment-history.controller';
import { PaymentHistoryService } from './payment-history.service';
import { PaymentHistory } from './entities/payment-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentHistory])],
  controllers: [PaymentHistoryController],
  providers: [PaymentHistoryService],
  exports: [PaymentHistoryService],
})
export class PaymentHistoryModule {}
