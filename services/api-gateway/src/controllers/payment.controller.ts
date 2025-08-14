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

@Controller('payments')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  @Post()
  async processPayment(@Body() paymentData: any): Promise<any> {
    return firstValueFrom(
      this.paymentClient.send({ cmd: 'process_payment' }, paymentData),
    );
  }

  @Get()
  async getPayments(@Query('userId') userId?: string): Promise<any> {
    return firstValueFrom(
      this.paymentClient.send({ cmd: 'get_payments' }, { userId }),
    );
  }

  @Get(':id')
  async getPayment(@Param('id') id: string): Promise<any> {
    return firstValueFrom(
      this.paymentClient.send({ cmd: 'get_payment' }, { id }),
    );
  }

  @Put(':id/refund')
  async refundPayment(@Param('id') id: string): Promise<any> {
    return firstValueFrom(
      this.paymentClient.send({ cmd: 'refund_payment' }, { id }),
    );
  }
}
