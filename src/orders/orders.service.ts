import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { WalletService } from '../wallet/wallet.service';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { SystemVariablesService } from '../system-variables/system-variables.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private walletService: WalletService,
    private cartService: CartService,
    private productsService: ProductsService,
    private systemVariablesService: SystemVariablesService,
  ) {}

  async createOrder(
    userId: string,
    items: any[],
    totalAmount: number,
    paymentMethod: string,
  ) {
    const order = this.orderRepository.create({
      userId,
      items,
      totalAmount,
      paymentMethod,
      status: 'pending',
    });
    return await this.orderRepository.save(order);
  }

  async getOrders(userId: string) {
    return await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSoldOrders(sellerId: string) {
    // Find all orders where seller's products were sold
    const allOrders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Filter orders that contain seller's products
    const soldOrders = allOrders
      .map((order) => {
        const orderItems = Array.isArray(order.items) ? order.items : [];
        const sellerItems = orderItems.filter(
          (item: any) => item.sellerId === sellerId,
        );

        if (sellerItems.length === 0) return null;

        // Calculate seller's earnings from this order
        const sellerEarnings = sellerItems.reduce(
          (sum: number, item: any) => sum + (item.subtotal || 0),
          0,
        );

        return {
          ...order,
          sellerItems, // Only items sold by this seller
          sellerEarnings, // Total earnings from this order
        };
      })
      .filter((order) => order !== null);

    return soldOrders;
  }

  async getReadyForWithdrawal(sellerId: string) {
    // Find all orders that are ready for withdrawal
    const allOrders = await this.orderRepository.find({
      where: { status: 'ready_for_withdrawal', canWithdraw: true },
      order: { createdAt: 'DESC' },
    });

    // Filter orders that contain seller's products
    const withdrawableOrders = allOrders
      .map((order) => {
        const orderItems = Array.isArray(order.items) ? order.items : [];
        const sellerItems = orderItems.filter(
          (item: any) => item.sellerId === sellerId,
        );

        if (sellerItems.length === 0) return null;

        // Calculate seller's earnings from this order
        const sellerEarnings = sellerItems.reduce(
          (sum: number, item: any) => sum + (item.subtotal || 0),
          0,
        );

        return {
          ...order,
          sellerItems, // Only items sold by this seller
          sellerEarnings, // Total earnings from this order
        };
      })
      .filter((order) => order !== null);

    return withdrawableOrders;
  }

  async getOrder(orderId: string, userId: string) {
    return await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
  }

  async getOrderById(orderId: string) {
    return await this.orderRepository.findOne({
      where: { id: orderId },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    transactionId?: string,
  ) {
    await this.orderRepository.update(orderId, { status, transactionId });
  }

  async getOrdersByIds(orderIds: string[]) {
    return await this.orderRepository.find({
      where: { id: In(orderIds) },
    });
  }

  async updateOrdersStatus(orderIds: string[], status: string) {
    await this.orderRepository.update({ id: In(orderIds) }, { status });
  }

  async checkoutCart(userId: string, checkoutDto?: { productIds?: string[] }) {
    // If productIds provided, only checkout those products
    const cartItems = await this.cartService.getCartItems(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let checkedOutItems;
    if (checkoutDto?.productIds && checkoutDto.productIds.length > 0) {
      // Only checkout products in productIds
      checkedOutItems = cartItems.filter((item) =>
        checkoutDto.productIds.includes(item.productId),
      );
      if (checkedOutItems.length === 0) {
        throw new BadRequestException(
          'No valid products found in cart for checkout',
        );
      }
    } else {
      // Checkout all products in cart
      checkedOutItems = cartItems;
    }

    // Validate products
    for (const item of checkedOutItems) {
      const product = await this.productsService.findOne(item.productId);
      if (!product || product.status === 'blocked') {
        throw new ForbiddenException(
          `Product ${item.product.title} is not available for purchase`,
        );
      }
      const userOrders = await this.orderRepository.find({
        where: { userId: userId },
      });

      for (const order of userOrders) {
        const items = order.items || [];
        if (
          items &&
          items.length > 0 &&
          items.find((item) => item.productId === product.id)
        ) {
          throw new ForbiddenException(
            `You have already purchased the product: ${product.name}`,
          );
        }
      }
    }

    // Calculate total amount
    const totalAmount = checkedOutItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    // Check wallet balance
    const balance = await this.walletService.getBalance(userId);
    if (balance < totalAmount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${totalAmount}, Available: ${balance}`,
      );
    }

    // Prepare order items with seller info
    const orderItems = await Promise.all(
      checkedOutItems.map(async (item) => {
        // Get full product to find seller (not used, but can be used for future logic)
        await this.productsService.findOneWithDownloadLinks(item.productId);
        return {
          productId: item.productId,
          productTitle: item.product?.title || 'Unknown Product',
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.price) * item.quantity,
          sellerId: item.product?.userId, // Get sellerId from cart product
        };
      }),
    );

    // Calculate withdrawable date (3 days from now)
    const withdrawableAt = new Date();
    withdrawableAt.setDate(withdrawableAt.getDate() + 3);

    // Create order
    const order = this.orderRepository.create({
      userId,
      items: orderItems,
      totalAmount,
      paymentMethod: 'wallet',
      status: 'pending',
      withdrawableAt,
      canWithdraw: false,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Deduct from wallet
    await this.walletService.deductBalance(
      userId,
      totalAmount,
      `Payment for order #${savedOrder.id}`,
    );

    // Update order status to completed
    await this.orderRepository.update(savedOrder.id, {
      status: 'completed',
      transactionId: `WALLET-${Date.now()}`,
    });

    // Remove checked out products from cart
    if (checkoutDto?.productIds && checkoutDto.productIds.length > 0) {
      // Remove only checked out items
      for (const item of checkedOutItems) {
        await this.cartService.removeItem(userId, item.id);
      }
    } else {
      // Clear entire cart
      await this.cartService.clearCart(userId);
    }

    // Return order with updated status
    return await this.orderRepository.findOne({
      where: { id: savedOrder.id },
    });
  }

  async getOrderProducts(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new BadRequestException('Order not found or access denied');
    }

    // Get product details with download links for each item
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const products = await Promise.all(
      orderItems.map(async (item: any) => {
        try {
          const product = await this.productsService.findOneWithDownloadLinks(
            item.productId,
          );
          return {
            ...item,
            productDetails: product,
          };
        } catch {
          return {
            ...item,
            productDetails: null,
            error: 'Product not available',
          };
        }
      }),
    );

    return {
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      products,
    };
  }
}
