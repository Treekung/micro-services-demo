import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
  ) {}

  @Post()
  async createOrder(@Body() orderData: any): Promise<any> {
    return firstValueFrom(
      this.orderClient.send({ cmd: 'create_order' }, orderData),
    );
  }

  @Get()
  async getOrders(@Query('userId') userId?: string): Promise<any> {
    return firstValueFrom(
      this.orderClient.send({ cmd: 'get_orders' }, { userId }),
    );
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<any> {
    return firstValueFrom(this.orderClient.send({ cmd: 'get_order' }, { id }));
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() data: { status: string },
  ): Promise<any> {
    return firstValueFrom(
      this.orderClient.send(
        { cmd: 'update_order_status' },
        { id, status: data.status },
      ),
    );
  }
}
