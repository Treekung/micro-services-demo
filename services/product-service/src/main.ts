import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ProductModule } from './product.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('ProductService');
const PORT = 3002;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: PORT,
      },
    },
  );

  await app.listen();
  logger.log(`Product Microservice running on port ${PORT}`);
}
bootstrap();
