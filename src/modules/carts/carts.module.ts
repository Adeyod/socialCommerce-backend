import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesModule } from '../businesses/businesses.module';
import { ProductsModule } from '../products/products.module';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { CartRepository } from './repositories/cart.repository';
import { Cart, CartSchema } from './schemas/cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    ProductsModule,
    BusinessesModule,
  ],
  controllers: [CartsController],
  providers: [CartsService, CartRepository],
  exports: [CartsService, CartRepository],
})
export class CartsModule {}
