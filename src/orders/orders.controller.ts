import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders(@CurrentUser() user: { userId: string }) {
    const orders = await this.ordersService.getOrders(user.userId);
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
}
