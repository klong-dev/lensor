import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankCardsService } from './bank-cards.service';
import { BankCardsController } from './bank-cards.controller';
import { BankCard } from './entities/bank-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankCard])],
  providers: [BankCardsService],
  controllers: [BankCardsController],
  exports: [BankCardsService],
})
export class BankCardsModule {}
