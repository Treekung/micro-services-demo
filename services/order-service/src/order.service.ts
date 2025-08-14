import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private rabbitMQService: RabbitMQService,
  ) {
    this.setupMessageConsumers();
  }

  private setupMessageConsumers() {
    // รับ message จาก payment service เพื่ออัพเดทสถานะคำสั่งซื้อ
    this.rabbitMQService.consume('order_status_queue', async (message) => {
      const { orderId, status } = message;
      
      // เพิ่ม delay 3 วินาที เพื่อให้เห็นคิวชัดเจน
      console.log(`Updating order ${orderId} status to ${status}, waiting 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await this.updateOrderStatus(orderId, status);
    });
  }

  async createOrder(orderData: any): Promise<Order> {
    const order = this.orderRepository.create({
      userId: orderData.userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // ส่ง event ไปยัง payment service
    await this.rabbitMQService.publish('payment_queue', {
      orderId: savedOrder.id,
      amount: savedOrder.totalAmount,
      userId: savedOrder.userId,
    });

    return savedOrder;
  }

  async getOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    if (userId) {
      return this.orderRepository.find({ where: { userId } });
    }
    return this.orderRepository.find();
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const order = await this.getOrder(id);
    order.status = status as OrderStatus;
    
    if (status === OrderStatus.PAID) {
      order.paymentId = `payment_${Date.now()}`;
    }

    return this.orderRepository.save(order);
  }
}
