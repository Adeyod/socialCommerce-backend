import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsModule } from '../carts/carts.module';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './providers/paystack/paystack.service';
import { PaymentsRepository } from './repositories/payment.repository';
import { Payment, PaymentSchema } from './schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    UsersModule,
    CartsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, PaystackService],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
