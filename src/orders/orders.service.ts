import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { WalletService } from '../wallet/wallet.service';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private walletService: WalletService,
    private cartService: CartService,
    private productsService: ProductsService,
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

  async checkoutCart(userId: string) {
    // Get cart items
    const cartItems = await this.cartService.getCartItems(userId);

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce(
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
      cartItems.map(async (item) => {
        // Get full product to find seller
        const fullProduct = await this.productsService.findOneWithDownloadLinks(
          item.productId,
        );
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

    // Clear cart
    await this.cartService.clearCart(userId);

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

    if (order.status !== 'completed') {
      throw new BadRequestException(
        'Products are only available for completed orders',
      );
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
