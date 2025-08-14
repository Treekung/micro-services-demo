import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern({ cmd: 'create_product' })
  async createProduct(@Payload() data: any) {
    return this.productService.createProduct(data);
  }

  @MessagePattern({ cmd: 'get_product' })
  async getProduct(@Payload() data: { id: string }) {
    return this.productService.getProduct(data.id);
  }

  @MessagePattern({ cmd: 'get_products' })
  async getProducts(@Payload() data: { category?: string }) {
    return this.productService.getProducts(data.category);
  }

  @MessagePattern({ cmd: 'update_stock' })
  async updateStock(@Payload() data: { id: string; quantity: number }) {
    return this.productService.updateStock(data.id, data.quantity);
  }

  @MessagePattern({ cmd: 'check_stock' })
  async checkStock(@Payload() data: { id: string; quantity: number }) {
    return this.productService.checkStock(data.id, data.quantity);
  }
}
