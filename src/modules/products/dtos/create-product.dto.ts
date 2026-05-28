// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { Transform, Type } from 'class-transformer';
// import {
//   IsArray,
//   IsNumber,
//   IsOptional,
//   IsString,
//   Min,
//   ValidateNested,
// } from 'class-validator';

// export class DeliveryRuleDto {
//   @ApiProperty({
//     example: 'Lagos',
//     description: 'State name for delivery pricing',
//   })
//   @IsString()
//   state!: string;

//   @ApiProperty({
//     example: 2000,
//     description: 'Delivery price for this state',
//   })
//   @Type(() => Number)
//   @IsNumber()
//   @Min(0)
//   price!: number;
// }

// export class CreateProductDto {
//   @ApiProperty({
//     description: 'Product name',
//     example: 'Sneakers',
//   })
//   @IsString()
//   name!: string;

//   @ApiProperty({
//     description: 'Delivery pricing rules per state',
//     type: [DeliveryRuleDto],
//     example: [
//       { state: 'Lagos', price: 2000 },
//       { state: 'Abuja', price: 2500 },
//     ],
//   })
//   @Transform(({ value, obj }) => {
//     // 1. Check if the value is already a stringified JSON (Best practice for form-data arrays)
//     if (typeof value === 'string') {
//       try {
//         const parsed = JSON.parse(value);
//         return Array.isArray(parsed) ? parsed : [parsed];
//       } catch {
//         return [];
//       }
//     }

//     // 2. If Swagger flattened the object keys directly onto the parent body (e.g., obj['deliveryRules[0][state]'])
//     if (!value || (Array.isArray(value) && value.length === 0)) {
//       const parsedRules: any[] = [];

//       // Look directly into the raw request object for Swagger's multipart notation
//       Object.keys(obj).forEach((key) => {
//         const match = key.match(/^deliveryRules\[(\d+)\]\[(\w+)\]$/);
//         if (match) {
//           const index = parseInt(match[1], 10);
//           const property = match[2];

//           if (!parsedRules[index]) {
//             parsedRules[index] = {};
//           }

//           // Assign the value (and cast prices to numbers)
//           let val = obj[key];
//           if (property === 'price') val = Number(val);

//           parsedRules[index][property] = val;
//         }
//       });

//       if (parsedRules.length > 0) {
//         return parsedRules.filter((item) => item !== undefined);
//       }
//     }

//     // 3. If it's already a clean array of objects
//     if (Array.isArray(value)) {
//       return value
//         .map((v) => {
//           if (typeof v === 'string') {
//             try {
//               return JSON.parse(v);
//             } catch {
//               return null;
//             }
//           }
//           return v;
//         })
//         .filter((v) => v !== null);
//     }

//     return value;
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => DeliveryRuleDto)
//   deliveryRules!: DeliveryRuleDto[];

//   // @ApiProperty({
//   //   description: 'Delivery pricing rules per state',
//   //   type: [DeliveryRuleDto],
//   //   example: [
//   //     { state: 'Lagos', price: 2000 },
//   //     { state: 'Abuja', price: 2500 },
//   //   ],
//   // })
//   // @Transform(({ value }) => {
//   //   if (!value) return [];

//   //   // 1. If it's already a single string, try to parse it (handles raw JSON strings)
//   //   if (typeof value === 'string') {
//   //     try {
//   //       const parsed = JSON.parse(value);
//   //       return Array.isArray(parsed) ? parsed : [parsed];
//   //     } catch {
//   //       return [];
//   //     }
//   //   }

//   //   // 2. If it's an array sent via multipart form data
//   //   if (Array.isArray(value)) {
//   //     return value
//   //       .map((v) => {
//   //         // If it's already a parsed object, keep it
//   //         if (typeof v === 'object' && v !== null) return v;

//   //         // If it's a string representation of an object, try to parse it
//   //         if (typeof v === 'string') {
//   //           // Ignore broken Swagger metadata string artifacts
//   //           if (v === '[object Object]') return null;
//   //           try {
//   //             return JSON.parse(v);
//   //           } catch {
//   //             return null; // drop unparseable garbage strings safely
//   //           }
//   //         }
//   //         return null;
//   //       })
//   //       .filter((v) => v !== null); // Strip out invalid entries
//   //   }

//   //   return value;
//   // })
//   // @IsArray()
//   // @ValidateNested({ each: true })
//   // @Type(() => DeliveryRuleDto)
//   // deliveryRules!: DeliveryRuleDto[];

//   @ApiPropertyOptional({
//     description: 'This is more information about the product.',
//     example: 'This is a nike product.',
//   })
//   @IsOptional()
//   @IsString({ message: 'Description is a string' })
//   description?: string;

//   @ApiProperty({
//     description: 'Price of the product.',
//     example: 35000,
//   })
//   @Type(() => Number)
//   @IsNumber({}, { message: 'Price is a number' })
//   @Min(0, { message: 'Price can not be negative' })
//   price!: number;

//   @ApiProperty({
//     description: 'This is number of the product in stock.',
//     example: 'This is a nike product.',
//   })
//   @Type(() => Number)
//   @IsNumber({}, { message: 'Stock is a number.' })
//   @Min(1, { message: 'Stock can not be negative' })
//   stock!: number;

//   @ApiPropertyOptional({
//     description: 'This is the category the product belong to.',
//     example: 'Electronics.',
//   })
//   @IsOptional()
//   @IsString({ message: 'Category is a string' })
//   category?: string;

//   @ApiPropertyOptional({
//     description: 'This is tags of the product.',
//     example: ['shoe'],
//   })
//   @IsOptional()
//   @IsArray()
//   @Transform(({ value }) => {
//     if (Array.isArray(value)) return value;
//     if (typeof value === 'string') return [value];
//   })
//   tags?: string[];
// }

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DeliveryRuleDto {
  @IsString()
  state!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Delivery pricing rules per state (JSON string or array)',
    type: String,
    example: '[{"state": "Lagos", "price": 2000}]',
  })
  @IsOptional() // We will parse and validate this manually in the controller below
  deliveryRules!: any;

  // @ApiProperty({
  //   description: 'Delivery pricing rules per state (JSON stringified array)',
  //   type: String,
  //   example: '[{"state": "Lagos", "price": 2000}]',
  // })
  // @Transform(({ value }) => {
  //   if (!value) return [];

  //   let stringToParse = '';

  //   // Case 1: It's a single string (1 file uploaded or direct API call)
  //   if (typeof value === 'string') {
  //     stringToParse = value;
  //   }

  //   // Case 2: It's an array of strings (Multiple files uploaded via Swagger multipart)
  //   if (Array.isArray(value) && typeof value[0] === 'string') {
  //     // Grab just the first instance, as Swagger duplicates it for each file
  //     stringToParse = value[0];
  //   }

  //   // Parse the string gathered from above
  //   if (stringToParse) {
  //     try {
  //       const parsed = JSON.parse(stringToParse);
  //       return Array.isArray(parsed) ? parsed : [parsed];
  //     } catch (error) {
  //       return [];
  //     }
  //   }

  //   // Case 3: If it's somehow already a clean array of objects
  //   if (Array.isArray(value)) {
  //     return value;
  //   }

  //   return value;
  // })
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => DeliveryRuleDto)
  // deliveryRules!: DeliveryRuleDto[];

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  stock!: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
  })
  tags?: string[];
}
