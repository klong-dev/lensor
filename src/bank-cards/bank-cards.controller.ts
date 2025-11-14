import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BankCardsService } from './bank-cards.service';
import { CreateBankCardDto } from './dto/create-bank-card.dto';
import { UpdateBankCardDto } from './dto/update-bank-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bank-cards')
@UseGuards(JwtAuthGuard)
export class BankCardsController {
  constructor(private readonly bankCardsService: BankCardsService) {}

  @Post()
  async createCard(
    @Body() createBankCardDto: CreateBankCardDto,
    @CurrentUser() user: { userId: string },
  ) {
    const card = await this.bankCardsService.createCard(
      user.userId,
      createBankCardDto,
    );
    return { data: card, message: 'Bank card added successfully' };
  }

  @Get()
  async getMyCards(@CurrentUser() user: { userId: string }) {
    const cards = await this.bankCardsService.getMyCards(user.userId);
    return { data: cards };
  }

  @Get(':id')
  async getCard(
    @Param('id') cardId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const card = await this.bankCardsService.getCardById(cardId, user.userId);
    return { data: card };
  }

  @Put(':id')
  async updateCard(
    @Param('id') cardId: string,
    @Body() updateBankCardDto: UpdateBankCardDto,
    @CurrentUser() user: { userId: string },
  ) {
    const card = await this.bankCardsService.updateCard(
      cardId,
      user.userId,
      updateBankCardDto,
    );
    return { data: card, message: 'Bank card updated successfully' };
  }

  @Delete(':id')
  async deleteCard(
    @Param('id') cardId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const result = await this.bankCardsService.deleteCard(cardId, user.userId);
    return result;
  }

  @Post(':id/set-default')
  async setDefaultCard(
    @Param('id') cardId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const card = await this.bankCardsService.setDefaultCard(
      cardId,
      user.userId,
    );
    return { data: card, message: 'Default card updated successfully' };
  }
}
