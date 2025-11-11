import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: { userId: string }) {
    const cart = await this.cartService.getCart(user.userId);
    return { data: cart };
  }

  @Post('add')
  async addToCart(
    @Body() body: { productId: string; quantity: number; price: number },
    @CurrentUser() user: { userId: string },
  ) {
    const item = await this.cartService.addToCart(
      user.userId,
      body.productId,
      body.quantity,
      body.price,
    );
    return { data: item, message: 'Added to cart' };
  }

  @Patch('update/:itemId')
  async updateQuantity(
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
    @CurrentUser() user: { userId: string },
  ) {
    const item = await this.cartService.updateQuantity(
      user.userId,
      itemId,
      body.quantity,
    );
    return { data: item, message: 'Cart updated' };
  }

  @Delete('remove/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.cartService.removeItem(user.userId, itemId);
    return { message: 'Item removed from cart' };
  }

  @Delete('clear')
  async clearCart(@CurrentUser() user: { userId: string }) {
    await this.cartService.clearCart(user.userId);
    return { message: 'Cart cleared' };
  }
}
