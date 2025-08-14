import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create_order' })
  async createOrder(@Payload() data: any) {
    return this.orderService.createOrder(data);
  }

  @MessagePattern({ cmd: 'get_order' })
  async getOrder(@Payload() data: { id: string }) {
    return this.orderService.getOrder(data.id);
  }

  @MessagePattern({ cmd: 'get_orders' })
  async getOrders(@Payload() data: { userId?: string }) {
    return this.orderService.getOrders(data.userId);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  async updateOrderStatus(@Payload() data: { id: string; status: string }) {
    return this.orderService.updateOrderStatus(data.id, data.status);
  }
}
