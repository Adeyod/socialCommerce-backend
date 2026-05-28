import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { Permission } from '../../common/enums/permissions.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { PermissionsGuard } from '../staff-access-control/guards/permissions.guard';
import { Role } from '../users/schemas/user.schema';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('create-product/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.create_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Product',
    description:
      'This is the endpoint that a vendor will use to create product that he want to sell.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        name: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        category: { type: 'string' },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        deliveryRules: {
          type: 'string',
          description: 'JSON stringified array of delivery rules',
          example:
            '[{"state":"Lagos","price":2000},{"state":"Abuja","price":2500}]',
        },
        // deliveryRules: {
        //   type: 'array',
        //   items: {
        //     type: 'object',
        //     properties: {
        //       state: { type: 'string', example: 'Lagos' },
        //       price: { type: 'number', example: 2000 },
        //     },
        //   },
        // },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to create product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('image/')) {
          return cb(new Error('Only image files allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  // async createProduct(
  //   @Param('businessId') businessId: string,
  //   @UploadedFiles() files: Express.Multer.File[],
  //   @Body() createProductDto: CreateProductDto,
  //   @GetCurrentUser() user: JwtUser,
  // ) {
  //   console.log('createProductDto:', createProductDto);
  //   console.log('files:', files);
  //   console.log('RAW BODY:', createProductDto);
  //   console.log('RAW deliveryRules:', createProductDto.deliveryRules);
  //   console.log('TYPE:', typeof createProductDto.deliveryRules);
  //   const response = await this.productsService.createProduct(
  //     businessId,
  //     user,
  //     createProductDto,
  //     files,
  //   );

  //   return response;
  // }
  async createProduct(
    @Param('businessId') businessId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    const rawRules = createProductDto.deliveryRules;

    console.log('rawRules directly from request:', rawRules);

    let parsedRules: any[] = [];

    if (rawRules) {
      // Case A: Swagger split the JSON array by its commas into an array of broken fragments
      if (Array.isArray(rawRules) && typeof rawRules[0] === 'string') {
        try {
          // Re-join the components back with commas to reconstruct a whole JSON string
          const reconstructedString = rawRules.join(',');

          // It might now look like: '{\r\n  "state": "Osun","price": 4000\r\n},{\r\n  "state": "Lagos","price": 10000\r\n}'
          // If it doesn't have outer array brackets [ ], wrap it up so it's a valid JSON array
          let validJsonString = reconstructedString.trim();
          if (!validJsonString.startsWith('[')) {
            validJsonString = `[${validJsonString}]`;
          }

          parsedRules = JSON.parse(validJsonString);
        } catch (e) {
          // Fallback: Try parsing individual chunks if Swagger sent multiple independent complete JSON objects
          parsedRules = rawRules
            .map((item) => {
              try {
                return JSON.parse(item);
              } catch {
                return null;
              }
            })
            .filter((v) => v !== null);
        }
      }
      // Case B: Already an object structure
      else if (Array.isArray(rawRules) && typeof rawRules[0] === 'object') {
        parsedRules = rawRules;
      }
      // Case C: Single string payload
      else if (typeof rawRules === 'string') {
        try {
          parsedRules = JSON.parse(rawRules);
        } catch {
          parsedRules = [];
        }
      }
    }

    // Assign the successfully reconstructed array back to the DTO
    createProductDto.deliveryRules = Array.isArray(parsedRules)
      ? parsedRules
      : [];

    // Ensure type numbers match up
    createProductDto.deliveryRules = createProductDto.deliveryRules.map(
      (rule: any) => ({
        state: String(rule.state || ''),
        price: Number(rule.price || 0),
      }),
    );

    console.log(
      'FINAL RECONSTRUCTED DELIVERY RULES:',
      createProductDto.deliveryRules,
    );

    const response = await this.productsService.createProduct(
      businessId,
      user,
      createProductDto,
      files,
    );

    return response;
  }

  @Get('get-product-by-productId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.user, Role.admin)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch product endpoint.',
    description: 'This is the endpoint for fetching a product on the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProductByProductId(@Param('productId') productId: string) {
    const response =
      await this.productsService.getProductByProductId(productId);

    return response;
  }

  @Get('get-products-by-businessId/:businessId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user, Role.admin)
  @Permissions(Permission.view_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Products fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch products endpoint.',
    description:
      'This is the endpoint for fetching products of a business on the platform. Only those that are part of the business can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch products.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProductsByBusinessId(
    @Param('businessId') businessId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const response = await this.productsService.getProductsByBusinessId(
      businessId,
      queryWithPaginationDto,
    );

    console.log('response:', response);
    return response;
  }
  @Get('get-product-by-businessId/:businessId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.view_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch product endpoint.',
    description:
      'This is the endpoint for fetching a product of a business on the platform. Only those that are part of the business can use this endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to fetch product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAProductByBusinessId(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
  ) {
    const response = await this.productsService.getAProductByBusinessId(
      businessId,
      productId,
    );

    console.log('response:', response);
    return response;
  }

  @Patch('update-product-by-productId/:businessId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.update_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product updated successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update product endpoint.',
    description: 'This is the endpoint for updating a product on the platform.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        name: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        category: { type: 'string' },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to update product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('image/')) {
          return cb(new Error('Only image files allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  async updateProductByProductId(
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetCurrentUser() user: JwtUser,
    @Param('businessId') businessId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const response = await this.productsService.updateProduct(
      productId,
      updateProductDto,
      user,
      businessId,
      files,
    );

    console.log('response:', response);
    return response;
  }

  @Delete('delete-product-by-productId/:businessId/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.user)
  @Permissions(Permission.delete_product)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Product deleted successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete product endpoint.',
    description: 'This is the endpoint for deleting a product on the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Unable to delete product.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteProductById(
    @Param('productId') productId: string,
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    const response = await this.productsService.deleteProductById(
      productId,
      user,
      businessId,
    );

    console.log('response:', response);
    return response;
  }
}
