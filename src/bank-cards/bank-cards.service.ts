import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankCard } from './entities/bank-card.entity';
import { CreateBankCardDto } from './dto/create-bank-card.dto';
import { UpdateBankCardDto } from './dto/update-bank-card.dto';

@Injectable()
export class BankCardsService {
  constructor(
    @InjectRepository(BankCard)
    private bankCardRepository: Repository<BankCard>,
  ) {}

  async createCard(userId: string, createBankCardDto: CreateBankCardDto) {
    // If this is set as default, unset all other default cards
    if (createBankCardDto.isDefault) {
      await this.bankCardRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const card = this.bankCardRepository.create({
      userId,
      ...createBankCardDto,
    });

    return await this.bankCardRepository.save(card);
  }

  async getMyCards(userId: string) {
    return await this.bankCardRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getCardById(cardId: string, userId: string) {
    const card = await this.bankCardRepository.findOne({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Bank card not found or access denied');
    }

    return card;
  }

  async updateCard(
    cardId: string,
    userId: string,
    updateBankCardDto: UpdateBankCardDto,
  ) {
    const card = await this.getCardById(cardId, userId);

    // If setting as default, unset all other default cards
    if (updateBankCardDto.isDefault) {
      await this.bankCardRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(card, updateBankCardDto);
    return await this.bankCardRepository.save(card);
  }

  async deleteCard(cardId: string, userId: string) {
    const card = await this.getCardById(cardId, userId);
    await this.bankCardRepository.remove(card);
    return { message: 'Bank card deleted successfully' };
  }

  async setDefaultCard(cardId: string, userId: string) {
    const card = await this.getCardById(cardId, userId);

    // Unset all other default cards
    await this.bankCardRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    card.isDefault = true;
    return await this.bankCardRepository.save(card);
  }

  async getDefaultCard(userId: string) {
    const card = await this.bankCardRepository.findOne({
      where: { userId, isDefault: true },
    });

    if (!card) {
      throw new NotFoundException(
        'No default bank card found. Please add a bank card first.',
      );
    }

    return card;
  }
}
