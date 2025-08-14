import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private rabbitMQService: RabbitMQService,
  ) {
    this.setupMessageConsumers();
  }

  private setupMessageConsumers() {
    // รับ message จาก order service เพื่อประมวลผลการชำระเงิน
    this.rabbitMQService.consume('payment_queue', async (message) => {
      const { orderId, amount, userId } = message;
      await this.processPayment({
        orderId,
        userId,
        amount,
        paymentMethod: PaymentMethod.CREDIT_CARD, // default method
      });
    });
  }

  async processPayment(paymentData: any): Promise<Payment> {
    const payment = this.paymentRepository.create({
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      status: PaymentStatus.PROCESSING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // จำลองการประมวลผลการชำระเงิน
    setTimeout(async () => {
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        savedPayment.status = PaymentStatus.COMPLETED;
        savedPayment.transactionId = `txn_${Date.now()}`;
        
        // ส่ง event ไปยัง order service เพื่ออัพเดทสถานะ
        await this.rabbitMQService.publish('order_status_queue', {
          orderId: savedPayment.orderId,
          status: 'paid',
        });
      } else {
        savedPayment.status = PaymentStatus.FAILED;
        savedPayment.failureReason = 'Payment gateway error';
      }
      
      await this.paymentRepository.save(savedPayment);
    }, 2000);

    return savedPayment;
  }

  async getPayment(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPayments(userId?: string): Promise<Payment[]> {
    if (userId) {
      return this.paymentRepository.find({ where: { userId } });
    }
    return this.paymentRepository.find();
  }

  async refundPayment(id: string): Promise<Payment> {
    const payment = await this.getPayment(id);
    payment.status = PaymentStatus.REFUNDED;
    
    // ส่ง event ไปยัง order service
    await this.rabbitMQService.publish('order_status_queue', {
      orderId: payment.orderId,
      status: 'refunded',
    });
    
    return this.paymentRepository.save(payment);
  }
}
