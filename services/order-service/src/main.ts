import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { OrderModule } from './order.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('OrderService');
const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: PORT,
      },
    },
  );
  
  await app.listen();
  logger.log(`Order Microservice running on port ${PORT}`);
}
bootstrap();
