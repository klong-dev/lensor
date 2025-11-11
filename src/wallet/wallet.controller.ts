import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() user: { userId: string }) {
    const wallet = await this.walletService.getOrCreateWallet(user.userId);
    return {
      data: {
        balance: Number(wallet.balance),
        currency: wallet.currency,
        isActive: wallet.isActive,
      },
    };
  }

  @Get('balance')
  async getBalance(@CurrentUser() user: { userId: string }) {
    const balance = await this.walletService.getBalance(user.userId);
    return {
      data: {
        balance: Number(balance),
        currency: 'VND',
      },
    };
  }
}
