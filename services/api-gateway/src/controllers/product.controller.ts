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

@Controller('products')
export class ProductController {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
  ) {}

  @Post()
  async createProduct(@Body() productData: any): Promise<any> {
    return firstValueFrom(
      this.productClient.send({ cmd: 'create_product' }, productData),
    );
  }

  @Get()
  async getProducts(@Query('category') category?: string): Promise<any> {
    return firstValueFrom(
      this.productClient.send({ cmd: 'get_products' }, { category }),
    );
  }

  @Get(':id')
  async getProduct(@Param('id') id: string): Promise<any> {
    return firstValueFrom(
      this.productClient.send({ cmd: 'get_product' }, { id }),
    );
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() data: { quantity: number },
  ): Promise<any> {
    return firstValueFrom(
      this.productClient.send(
        { cmd: 'update_stock' },
        { id, quantity: data.quantity },
      ),
    );
  }
}
