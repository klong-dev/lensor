import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        currency: 'VND',
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  /**
   * Get wallet by user ID
   */
  async getWalletByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  /**
   * Add money to wallet
   */
  async addBalance(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId);

    wallet.balance = Number(wallet.balance) + Number(amount);
    return await this.walletRepository.save(wallet);
  }

  /**
   * Deduct money from wallet
   */
  async deductBalance(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<Wallet> {
    const wallet = await this.getWalletByUserId(userId);

    if (Number(wallet.balance) < Number(amount)) {
      throw new Error('Insufficient balance');
    }

    wallet.balance = Number(wallet.balance) - Number(amount);
    return await this.walletRepository.save(wallet);
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return Number(wallet.balance);
  }
}
