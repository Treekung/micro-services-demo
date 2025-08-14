import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private rabbitMQService: RabbitMQService,
  ) {
    this.setupMessageConsumers();
  }

  private setupMessageConsumers() {
    // รับ message จาก order service เพื่ออัพเดท stock
    this.rabbitMQService.consume('stock_update_queue', async (message) => {
      const { productId, quantity } = message;
      await this.updateStock(productId, -quantity); // ลด stock
    });
  }

  async createProduct(productData: any): Promise<Product> {
    const result = await this.productRepository.insert(productData);
    const id = result.identifiers[0].id;
    return await this.getProduct(id);
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async getProducts(category?: string): Promise<Product[]> {
    if (category) {
      return this.productRepository.find({ where: { category, isActive: true } });
    }
    return this.productRepository.find({ where: { isActive: true } });
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.getProduct(id);
    product.stock += quantity;
    
    if (product.stock < 0) {
      throw new BadRequestException('Insufficient stock');
    }
    
    return this.productRepository.save(product);
  }

  async checkStock(id: string, quantity: number): Promise<boolean> {
    const product = await this.getProduct(id);
    return product.stock >= quantity;
  }
}
