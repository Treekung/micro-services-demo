import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      );
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      console.log('Payment Service connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.channel.on('error', (error) => {
        console.error('RabbitMQ channel error:', error);
      });

      this.channel.on('close', () => {
        console.log('RabbitMQ channel closed');
      });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
      console.log('Payment Service disconnected from RabbitMQ');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.channel) {
      await this.connect();
    }
  }

  async publish(queue: string, message: any): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      await this.channel.assertQueue(queue, { durable: true });
      const success = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
      );

      if (success) {
        console.log(`Message sent to queue: ${queue}`);
      } else {
        throw new Error('Failed to send message to queue');
      }
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  async consume(
    queue: string,
    callback: (message: any) => void,
  ): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      await this.channel.assertQueue(queue, { durable: true });

      this.channel.consume(
        queue,
        (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              callback(content);
              this.channel?.ack(msg);
            } catch (error) {
              console.error('Error processing message:', error);
              // Reject the message if processing fails
              this.channel?.nack(msg, false, false);
            }
          }
        },
        {
          noAck: false, // Enable manual acknowledgment
        },
      );

      console.log(`Started consuming from queue: ${queue}`);
    } catch (error) {
      console.error('Failed to consume message:', error);
      throw error;
    }
  }

  isServiceConnected(): boolean {
    return this.isConnected && this.channel !== null;
  }
}
