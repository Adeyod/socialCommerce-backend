import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../../common/infrastructure/cloudinary/cloudinary.module';
import { BusinessShippingRateModule } from '../business-shipping-rate/business-shipping-rate.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StaffAccessControlModule } from '../staff-access-control/staff-access-control.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './repositories/product.repository';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    CloudinaryModule,
    BusinessesModule,
    StaffAccessControlModule,
    BusinessShippingRateModule,
    forwardRef(() => InventoryModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsRepository],
})
export class ProductsModule {}
