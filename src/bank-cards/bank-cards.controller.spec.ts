import { Test, TestingModule } from '@nestjs/testing';
import { BankCardsController } from './bank-cards.controller';

describe('BankCardsController', () => {
  let controller: BankCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankCardsController],
    }).compile();

    controller = module.get<BankCardsController>(BankCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
