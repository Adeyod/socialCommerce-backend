import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MediaType } from '../enums/product.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  businessId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ min: 0, default: 1 })
  weight!: number;

  // Product images (Cloudinary / S3 URLs)
  @Prop({
    type: [
      {
        type: { type: String, enum: Object.values(MediaType) },
        url: String,
        publicUrl: String,
      },
    ],
    default: [],
  })
  media!: {
    type: MediaType;
    url: string;
    publicUrl: string;
  }[];

  @Prop({ default: 0 })
  averageRating!: number; // update it whenever user create a review on the product

  @Prop({ default: 0 })
  reviewCount!: number; // update it whenever user create a review on the product

  // Inventory
  @Prop({ default: 0, min: 0 })
  stock!: number;

  @Prop({ default: 0, min: 0 })
  reservedQuantity!: number;

  @Prop({ default: true })
  inStock!: boolean;

  // Categorization
  @Prop({ trim: true })
  category?: string;

  @Prop({ type: [String], trim: true, default: [] })
  tags!: string[];

  // SKU (for tracking products)
  @Prop({ unique: true, sparse: true })
  sku?: string;

  // Variants (e.g., size, color)
  @Prop({
    type: [
      {
        name: String, // e.g. "Size"
        options: [String], // e.g. ["S", "M", "L"]
      },
    ],
    default: [],
  })
  variants!: {
    name: string;
    options: string[];
  }[];

  // Product visibility(If this is true is when we show product to buyers.)
  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
