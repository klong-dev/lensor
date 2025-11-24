import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckOutOrderDto } from './dto/checkout.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders(@CurrentUser() user: { userId: string }) {
    const orders = await this.ordersService.getOrders(user.userId);
    return { data: orders };
  }

  @Get('sold')
  async getSoldOrders(@CurrentUser() user: { userId: string }) {
    const orders = await this.ordersService.getSoldOrders(user.userId);
    return { data: orders };
  }

  @Get('ready-for-withdrawal')
  async getReadyForWithdrawal(@CurrentUser() user: { userId: string }) {
    const orders = await this.ordersService.getReadyForWithdrawal(user.userId);
    return { data: orders };
  }

  @Get(':id')
  async getOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const order = await this.ordersService.getOrder(orderId, user.userId);
    return { data: order };
  }

  @Post('checkout')
  async checkout(
    @CurrentUser() user: { userId: string },
    @Body() checkoutDto: CheckOutOrderDto,
  ) {
    const order = await this.ordersService.checkoutCart(
      user.userId,
      checkoutDto,
    );
    return {
      data: order,
      message: 'Order placed successfully',
    };
  }

  @Get(':id/products')
  async getOrderProducts(
    @Param('id') orderId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const products = await this.ordersService.getOrderProducts(
      orderId,
      user.userId,
    );
    return { data: products };
  }
}
