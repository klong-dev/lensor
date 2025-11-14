import { Test, TestingModule } from '@nestjs/testing';
import { BankCardsService } from './bank-cards.service';

describe('BankCardsService', () => {
  let service: BankCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankCardsService],
    }).compile();

    service = module.get<BankCardsService>(BankCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
