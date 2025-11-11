import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getCart(userId: string) {
    const items = await this.cartItemRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });

    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    return {
      items,
      total,
      count: items.length,
    };
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    // Get product to get the price
    const product = await this.productsService.findOne(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if item already in cart
    let cartItem = await this.cartItemRepository.findOne({
      where: { userId, productId },
    });

    if (cartItem) {
      // Update quantity
      cartItem.quantity += quantity;
      return await this.cartItemRepository.save(cartItem);
    }

    // Create new cart item with product price
    cartItem = this.cartItemRepository.create({
      userId,
      productId,
      quantity,
      price: product.price,
    });

    return await this.cartItemRepository.save(cartItem);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = quantity;
    return await this.cartItemRepository.save(item);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(item);
  }

  async clearCart(userId: string) {
    await this.cartItemRepository.delete({ userId });
  }
}
