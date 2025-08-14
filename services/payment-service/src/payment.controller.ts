import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern({ cmd: 'process_payment' })
  async processPayment(@Payload() data: any) {
    return this.paymentService.processPayment(data);
  }

  @MessagePattern({ cmd: 'get_payment' })
  async getPayment(@Payload() data: { id: string }) {
    return this.paymentService.getPayment(data.id);
  }

  @MessagePattern({ cmd: 'get_payments' })
  async getPayments(@Payload() data: { userId?: string }) {
    return this.paymentService.getPayments(data.userId);
  }

  @MessagePattern({ cmd: 'refund_payment' })
  async refundPayment(@Payload() data: { id: string }) {
    return this.paymentService.refundPayment(data.id);
  }
}
