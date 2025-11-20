import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
    private supabaseService: SupabaseService,
  ) {}

  async getCart(userId: string) {
    const items = await this.cartItemRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });

    // Get unique user IDs from products
    const userIds = [...new Set(items.map((item) => item.product.userId))];

    // Fetch user data from Supabase
    const userMap = new Map<string, { id: string; name: string }>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const user = await this.supabaseService.getUserById(uid);
          if (user) {
            userMap.set(uid, {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0],
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user ${uid}:`, error);
        }
      }),
    );

    // Map owner data to items
    const itemsWithOwner = items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        owner: userMap.get(item.product.userId) || null,
      },
    }));

    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    return {
      items: itemsWithOwner,
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
    if (product.status === 'blocked') {
      throw new ForbiddenException(
        `Product ${product.name} is not available for purchase`,
      );
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

    if (item.product.status === 'blocked') {
      throw new ForbiddenException(
        `Product ${item.product.title} is not available for purchase`,
      );
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

  async getCartTotal(userId: string): Promise<number> {
    const items = await this.cartItemRepository.find({
      where: { userId },
    });

    return items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
  }

  async getCartItems(userId: string) {
    const items = await this.cartItemRepository.find({
      where: { userId },
      relations: ['product'],
    });

    // Get unique user IDs from products
    const userIds = [...new Set(items.map((item) => item.product.userId))];

    // Fetch user data from Supabase
    const userMap = new Map<string, { id: string; name: string }>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const user = await this.supabaseService.getUserById(uid);
          if (user) {
            userMap.set(uid, {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0],
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user ${uid}:`, error);
        }
      }),
    );

    // Map owner data to items
    return items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        owner: userMap.get(item.product.userId) || null,
      },
    }));
  }
}
