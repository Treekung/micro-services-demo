import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { PaymentModule } from './payment.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('PaymentService');
const PORT = 3003;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: PORT,
      },
    },
  );
  
  await app.listen();
  logger.log(`Payment Microservice running on port ${PORT}`);
}
bootstrap();
