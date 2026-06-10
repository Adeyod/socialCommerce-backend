import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async findByIds(ids: string[]) {
    const products = await this.productModel.find({
      _id: { $in: ids },
    });

    return products;
  }
  async reserveStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ) {
    console.log('productId:', productId);
    console.log('quantity:', quantity);

    const result = await this.productModel.updateOne(
      {
        _id: new Types.ObjectId(productId),

        $expr: {
          $gte: [
            {
              $subtract: ['$stock', { $ifNull: ['$reservedQuantity', 0] }],
            },
            quantity,
          ],
        },
      },
      {
        $inc: {
          reservedQuantity: quantity,
        },
      },
      { session },
    );

    console.log('result:', result);
    console.log('result.modifiedCount:', result.modifiedCount);
    if (result.modifiedCount === 0) {
      throw new BadRequestException({
        message: `Insufficient stock for product ${productId}`,
        success: false,
        status: 400,
      });
    }

    return result;
  }
  async createProduct(
    data: {
      name: string;
      description?: string;
      sku: string;
      category?: string;
      tags?: string[];
      price: number;
      stock: number;
      weight: number;
      media: {
        url: string;
        publicUrl: string;
      }[];
      businessId: string;
      inStock: boolean;
    },
    session?: ClientSession,
  ) {
    const newProduct = await new this.productModel({
      name: data.name.toLowerCase(),
      businessId: new Types.ObjectId(data.businessId),
      description: data.description?.toLowerCase(),
      price: data.price,
      media: data.media,
      stock: data.stock,
      weight: data.weight,
      category: data.category?.toLowerCase(),
      tags: data.tags,
      sku: data.sku.toLowerCase(),
    }).save({ session });

    return newProduct;
  }

  async countByBusiness(businessId: string) {
    const productCount = await this.productModel.countDocuments({
      businessId: new Types.ObjectId(businessId),
    });

    console.log('productCount:', productCount);

    return productCount;
  }

  async findById(id: string): Promise<ProductDocument | null> {
    const productId = new Types.ObjectId(id);

    const product = await this.productModel
      .findOne({
        _id: productId,
        isDeleted: false,
        isActive: true,
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessAddress.state businessAddress.town',
      });

    return product;
  }

  async findAProductByBusinessId(businessId: string, productId: string) {
    const id = new Types.ObjectId(businessId);
    const prodId = new Types.ObjectId(productId);
    const product = await this.productModel.findOne({
      _id: prodId,
      businessId: id,
      isDeleted: false,
      isActive: true,
    });

    return product;
  }
  async findProductsByBusinessId(
    businessId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    products: ProductDocument[];
    totalCount: number;
    totalPages: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    const id = new Types.ObjectId(businessId);

    let query = this.productModel.find({
      businessId: id,
      isDeleted: false,
      isActive: true,
    });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { name: { $regex: regex } },
          { description: { $regex: regex } },
          { category: { $regex: regex } },
        ],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }
    const products = await query.sort({ createdAt: -1 });

    if (products.length === 0) {
      throw new NotFoundException({
        message: 'Products not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      products,
      totalCount: count,
      totalPages: pages,
    };

    return response;
  }

  async updateProduct(productId: string, data: Partial<Product>) {
    const id = new Types.ObjectId(productId);

    const updatedProduct = await this.productModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return updatedProduct;
  }

  async productUpdateForInventory(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ) {
    const response = await this.productModel.updateOne(
      { _id: new Types.ObjectId(productId) },
      {
        $inc: { stock: quantity },
        $set: { inStock: true },
      },
      { session },
    );

    return response;
  }

  async deleteProduct(productId: string) {
    const id = new Types.ObjectId(productId);
    const product = await this.productModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
    });

    return product;
  }

  async getRandomProducts(limit = 5) {
    const response = await this.productModel.aggregate([
      { $sample: { size: limit } },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          media: { $slice: ['$media', 1] },
        },
      },
    ]);

    console.log('response:', response);
    return response;
  }

  // async getBuyerProducts(params: any) {
  //   const {
  //     searchParams,
  //     category,
  //     minPrice,
  //     maxPrice,
  //     feed,
  //     sort,
  //     page,
  //     limit,
  //   } = params;

  //   const match: any = {};

  //   // Search
  //   if (searchParams) {
  //     const regex = new RegExp(searchParams, 'i');

  //     match.title = { $regex: regex };
  //     match.category = { $regex: regex };
  //   }

  //   // Category
  //   if (category) {
  //     match.category = category;
  //   }

  //   // Price filter
  //   if (minPrice || maxPrice) {
  //     match.price = {};
  //     if (minPrice) match.price.$gte = Number(minPrice);
  //     if (maxPrice) match.price.$lte = Number(maxPrice);
  //   }

  //   const pipeline: any[] = [
  //     { $match: match },

  //     // Join vendor
  //     {
  //       $lookup: {
  //         from: 'vendors',
  //         localField: 'vendorId',
  //         foreignField: '_id',
  //         as: 'vendor',
  //       },
  //     },
  //     { $unwind: '$vendor' },

  //     // Random factor for fairness
  //     {
  //       $addFields: {
  //         randomFactor: { $rand: {} },
  //       },
  //     },

  //     // Score calculation
  //     {
  //       $addFields: {
  //         score: {
  //           $add: [
  //             { $multiply: ['$vendor.rating', 30] },
  //             { $multiply: ['$sales', 0.2] },
  //             { $multiply: ['$views', 0.01] },
  //             { $multiply: ['$discount', 2] },
  //             { $cond: ['$sponsored', 40, 0] },
  //             { $multiply: ['$price', -0.0001] },
  //             { $multiply: ['$deliveryDays', -5] },
  //             { $cond: [{ $eq: ['$stock', 0] }, -100, 0] },

  //             // Fairness additions
  //             { $multiply: ['$randomFactor', 10] },
  //             { $cond: [{ $lt: ['$views', 50] }, 20, 0] },
  //           ],
  //         },
  //       },
  //     },
  //   ];

  //   // Feed logic
  //   let sortStage: any = {};

  //   switch (feed) {
  //     case 'new':
  //       sortStage = { createdAt: -1 };
  //       break;

  //     case 'sponsored':
  //       pipeline.push({ $match: { sponsored: true } });
  //       sortStage = { createdAt: -1 };
  //       break;

  //     case 'low_exposure':
  //       pipeline.push({ $match: { views: { $lt: 100 } } });
  //       sortStage = { views: 1 };
  //       break;

  //     case 'recommended':
  //     default:
  //       sortStage = { score: -1 };
  //       break;
  //   }

  //   // Manual sort override
  //   if (sort) {
  //     switch (sort) {
  //       case 'price':
  //         sortStage = { price: 1 };
  //         break;
  //       case 'newest':
  //         sortStage = { createdAt: -1 };
  //         break;
  //       case 'rating':
  //         sortStage = { 'vendor.rating': -1 };
  //         break;
  //     }
  //   }

  //   pipeline.push({ $sort: sortStage });

  //   // Pagination
  //   const skip = (page - 1) * limit;

  //   pipeline.push({ $skip: skip });
  //   pipeline.push({ $limit: limit });

  //   // Shape response
  //   pipeline.push({
  //     $project: {
  //       id: '$_id',
  //       title: 1,
  //       description: 1,
  //       category: 1,
  //       image: { $arrayElemAt: ['$images', 0] },

  //       price: 1,
  //       stock: 1,
  //       discount: 1,
  //       views: 1,
  //       sales: 1,
  //       deliveryDays: 1,
  //       sponsored: 1,
  //       createdAt: 1,

  //       vendor: {
  //         id: '$vendor._id',
  //         name: '$vendor.name',
  //         rating: '$vendor.rating',
  //       },
  //     },
  //   });

  //   const data = await this.productModel.aggregate(pipeline);

  //   const total = await this.productModel.countDocuments(match);

  //   return {
  //     data,
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  // async getBuyerProducts(params: any) {
  //   const {
  //     searchParams,
  //     category,
  //     minPrice,
  //     maxPrice,
  //     feed,
  //     sort,
  //     page = 1,
  //     limit = 10,
  //   } = params;

  //   const match: any = {};

  //   // Search (title OR category)
  //   if (searchParams) {
  //     const regex = new RegExp(searchParams, 'i');

  //     match.$or = [
  //       { name: { $regex: regex } },
  //       { category: { $regex: regex } },
  //     ];
  //   }

  //   // Category filter
  //   if (category) {
  //     match.category = category;
  //   }

  //   // Price filter
  //   if (minPrice || maxPrice) {
  //     match.price = {};
  //     if (minPrice) match.price.$gte = Number(minPrice);
  //     if (maxPrice) match.price.$lte = Number(maxPrice);
  //   }

  //   // Base pipeline (shared logic)
  //   const basePipeline: any[] = [
  //     { $match: match },

  //     // Join vendor
  //     {
  //       $lookup: {
  //         from: 'vendors',
  //         localField: 'vendorId',
  //         foreignField: '_id',
  //         as: 'vendor',
  //       },
  //     },
  //     { $unwind: '$vendor' },

  //     // fairness randomness
  //     {
  //       $addFields: {
  //         randomFactor: { $rand: {} },
  //       },
  //     },

  //     // marketplace score
  //     {
  //       $addFields: {
  //         score: {
  //           $add: [
  //             { $multiply: ['$vendor.rating', 30] },
  //             { $multiply: ['$sales', 0.2] },
  //             { $multiply: ['$views', 0.01] },
  //             { $multiply: ['$discount', 2] },
  //             { $cond: ['$sponsored', 40, 0] },
  //             { $multiply: ['$price', -0.0001] },
  //             { $multiply: ['$deliveryDays', -5] },
  //             { $cond: [{ $eq: ['$stock', 0] }, -100, 0] },

  //             // fairness boosts
  //             { $multiply: ['$randomFactor', 10] },
  //             { $cond: [{ $lt: ['$views', 50] }, 20, 0] },
  //           ],
  //         },
  //       },
  //     },
  //   ];

  //   // Feed logic (adds extra filters)
  //   if (feed === 'sponsored') {
  //     basePipeline.push({ $match: { sponsored: true } });
  //   }

  //   if (feed === 'low_exposure') {
  //     basePipeline.push({ $match: { views: { $lt: 100 } } });
  //   }

  //   if (feed === 'new') {
  //     basePipeline.push({ $addFields: { isNew: true } });
  //   }

  //   // Sorting logic
  //   let sortStage: any = { score: -1 };

  //   switch (feed) {
  //     case 'new':
  //       sortStage = { createdAt: -1 };
  //       break;
  //     case 'low_exposure':
  //       sortStage = { views: 1 };
  //       break;
  //     case 'recommended':
  //     default:
  //       sortStage = { score: -1 };
  //       break;
  //   }

  //   // override manual sort
  //   if (sort) {
  //     switch (sort) {
  //       case 'price':
  //         sortStage = { price: 1 };
  //         break;
  //       case 'newest':
  //         sortStage = { createdAt: -1 };
  //         break;
  //       case 'rating':
  //         sortStage = { 'vendor.rating': -1 };
  //         break;
  //     }
  //   }

  //   const skip = (Number(page) - 1) * Number(limit);

  //   //  FINAL PIPELINE WITH FACET (IMPORTANT FIX)
  //   const result = await this.productModel.aggregate([
  //     ...basePipeline,

  //     {
  //       $facet: {
  //         data: [
  //           { $sort: sortStage },
  //           { $skip: skip },
  //           { $limit: Number(limit) },

  //           {
  //             $project: {
  //               id: '$_id',
  //               title: 1,
  //               description: 1,
  //               category: 1,
  //               image: { $arrayElemAt: ['$images', 0] },

  //               price: 1,
  //               stock: 1,
  //               discount: 1,
  //               views: 1,
  //               sales: 1,
  //               deliveryDays: 1,
  //               sponsored: 1,
  //               createdAt: 1,

  //               vendor: {
  //                 id: '$vendor._id',
  //                 name: '$vendor.name',
  //                 rating: '$vendor.rating',
  //               },
  //             },
  //           },
  //         ],

  //         meta: [{ $count: 'total' }],
  //       },
  //     },
  //   ]);

  //   const data = result[0]?.data || [];
  //   const total = result[0]?.meta?.[0]?.total || 0;

  //   return {
  //     data,
  //     meta: {
  //       total,
  //       page: Number(page),
  //       limit: Number(limit),
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }

  async getBuyerProducts(params: any) {
    const {
      searchParams,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort,
    } = params;

    const match: any = {
      isActive: true,
      isDeleted: false,
    };

    // Search (name + category)
    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      match.$or = [
        { name: { $regex: regex } },
        { category: { $regex: regex } },
        { tags: { $in: [regex] } },
      ];
    }

    // Category filter
    if (category) {
      match.category = category;
    }

    // Price filter
    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice) match.price.$gte = Number(minPrice);
      if (maxPrice) match.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    // BASE PIPELINE
    const basePipeline: any[] = [
      { $match: match },

      // Join Business (vendor equivalent)
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessId',
          foreignField: '_id',
          as: 'business',
        },
      },
      { $unwind: '$business' },
      {
        $lookup: {
          from: 'businessshippingrates',
          let: { businessId: '$businessId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$businessId', '$$businessId'],
                },
              },
            },
          ],
          as: 'shippingRates',
        },
      },

      // fairness factor
      {
        $addFields: {
          randomFactor: { $rand: {} },
        },
      },

      // CLEAN SCORE (based only on your schema)
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$averageRating', 40] },
              { $multiply: ['$reviewCount', 0.5] },
              { $cond: ['$inStock', 20, -100] },
              { $multiply: ['$randomFactor', 10] },
            ],
          },
        },
      },
    ];

    // SORT LOGIC
    let sortStage: any = { score: -1 };

    switch (sort) {
      case 'price':
        sortStage = { price: 1 };
        break;

      case 'newest':
        sortStage = { createdAt: -1 };
        break;

      case 'rating':
        sortStage = { averageRating: -1 };
        break;

      default:
        sortStage = { score: -1 };
        break;
    }

    // FINAL PIPELINE WITH FACET (FIXES YOUR TOTAL ISSUE)
    const result = await this.productModel.aggregate([
      ...basePipeline,

      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: Number(limit) },

            {
              $project: {
                id: '$_id',
                name: 1,
                description: 1,
                category: 1,
                price: 1,
                stock: 1,
                inStock: 1,
                averageRating: 1,
                reviewCount: 1,
                media: 1,
                weight: 1,
                createdAt: 1,

                business: {
                  id: '$business._id',
                  name: '$business.name',
                },
                shippingRates: {
                  $map: {
                    input: '$shippingRates',
                    as: 'rate',
                    in: {
                      originState: '$$rate.originState',
                      destinationState: '$$rate.destinationState',

                      weightRanges: {
                        $map: {
                          input: '$$rate.weightRanges',
                          as: 'wr',
                          in: {
                            min: '$$wr.min',
                            max: '$$wr.max',
                            price: '$$wr.price',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],

          meta: [{ $count: 'total' }],
        },
      },
    ]);

    const data = result[0]?.data || [];
    const total = result[0]?.meta?.[0]?.total || 0;

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // async getBuyerProducts(params: any) {
  //   const {
  //     searchParams,
  //     buyerState,
  //     category,
  //     minPrice,
  //     maxPrice,
  //     page = 1,
  //     limit = 10,
  //     sort,
  //   } = params;

  //   const match: any = {
  //     isActive: true,
  //     isDeleted: false,
  //   };

  //   // Search (name + category)
  //   if (searchParams) {
  //     const regex = new RegExp(searchParams, 'i');

  //     match.$or = [
  //       { name: { $regex: regex } },
  //       { category: { $regex: regex } },
  //       { tags: { $in: [regex] } },
  //     ];
  //   }

  //   // Category filter
  //   if (category) {
  //     match.category = category;
  //   }

  //   // Price filter
  //   if (minPrice || maxPrice) {
  //     match.price = {};
  //     if (minPrice) match.price.$gte = Number(minPrice);
  //     if (maxPrice) match.price.$lte = Number(maxPrice);
  //   }

  //   const skip = (Number(page) - 1) * Number(limit);

  //   // BASE PIPELINE
  //   const basePipeline: any[] = [
  //     { $match: match },

  //     // Join Business (vendor equivalent)
  //     {
  //       $lookup: {
  //         from: 'businesses',
  //         localField: 'businessId',
  //         foreignField: '_id',
  //         as: 'business',
  //       },
  //     },
  //     { $unwind: '$business' },
  //     {
  //       $lookup: {
  //         from: 'businessshippingrates',
  //         let: { businessId: '$businessId' },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ['$businessId', '$$businessId'] },
  //                   { $eq: ['$destinationState', buyerState] },
  //                 ],
  //               },
  //             },
  //           },
  //           { $limit: 1 },
  //         ],
  //         as: 'shippingRates',
  //       },
  //     },

  //     {
  //       $match: {
  //         shippingRates: { $ne: [] },
  //       },
  //     },

  //     // fairness factor
  //     {
  //       $addFields: {
  //         randomFactor: { $rand: {} },
  //       },
  //     },

  //     // CLEAN SCORE (based only on your schema)
  //     {
  //       $addFields: {
  //         score: {
  //           $add: [
  //             { $multiply: ['$averageRating', 40] },
  //             { $multiply: ['$reviewCount', 0.5] },
  //             { $cond: ['$inStock', 20, -100] },
  //             { $multiply: ['$randomFactor', 10] },
  //           ],
  //         },
  //       },
  //     },
  //   ];

  //   // SORT LOGIC
  //   let sortStage: any = { score: -1 };

  //   switch (sort) {
  //     case 'price':
  //       sortStage = { price: 1 };
  //       break;

  //     case 'newest':
  //       sortStage = { createdAt: -1 };
  //       break;

  //     case 'rating':
  //       sortStage = { averageRating: -1 };
  //       break;

  //     default:
  //       sortStage = { score: -1 };
  //       break;
  //   }

  //   // FINAL PIPELINE WITH FACET (FIXES YOUR TOTAL ISSUE)
  //   const result = await this.productModel.aggregate([
  //     ...basePipeline,

  //     {
  //       $facet: {
  //         data: [
  //           { $sort: sortStage },
  //           { $skip: skip },
  //           { $limit: Number(limit) },

  //           {
  //             $project: {
  //               id: '$_id',
  //               name: 1,
  //               description: 1,
  //               category: 1,
  //               price: 1,
  //               stock: 1,
  //               inStock: 1,
  //               averageRating: 1,
  //               reviewCount: 1,
  //               media: 1,
  //               weight: 1,
  //               createdAt: 1,

  //               business: {
  //                 id: '$business._id',
  //                 name: '$business.name',
  //               },
  //               shippingRates: {
  //                 $map: {
  //                   input: '$shippingRates',
  //                   as: 'rate',
  //                   in: {
  //                     originState: '$$rate.originState',
  //                     destinationState: '$$rate.destinationState',

  //                     weightRanges: {
  //                       $map: {
  //                         input: '$$rate.weightRanges',
  //                         as: 'wr',
  //                         in: {
  //                           min: '$$wr.min',
  //                           max: '$$wr.max',
  //                           price: '$$wr.price',
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         ],

  //         meta: [{ $count: 'total' }],
  //       },
  //     },
  //   ]);

  //   const data = result[0]?.data || [];
  //   const total = result[0]?.meta?.[0]?.total || 0;

  //   return {
  //     data,
  //     meta: {
  //       total,
  //       page: Number(page),
  //       limit: Number(limit),
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }
}
