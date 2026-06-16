import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Analytics, AnalyticsDocument } from '../schemas/analytics.schema';
import {
  VendorCustomer,
  VendorCustomerDocument,
} from '../schemas/vendor-customer.schema';

@Injectable()
export class AnalyticsRepository {
  constructor(
    @InjectModel(Analytics.name)
    private readonly analyticsModel: Model<AnalyticsDocument>,

    @InjectModel(VendorCustomer.name)
    private readonly vendorCustomerModel: Model<VendorCustomerDocument>,
  ) {}

  // async recordOrderPayment(data: RecordOrderPaymentDto) {
  //   const { businessId, revenue, productsSold, customerId } = data;
  //   const business = new Types.ObjectId(businessId);
  //   const response = await this.analyticsModel.updateOne(
  //     { businessId: business },
  //     {
  //       $inc: {
  //         totalRevenue: revenue,
  //         totalOrders: 1,
  //         totalProductsSold: productsSold,
  //       },
  //       $set: {
  //         lastUpdated: new Date(),
  //       },
  //       $addToSet: {
  //         customers: customerId,
  //       },
  //     },
  //     { upsert: true },
  //   );

  //   return response;
  // }

  // async recordOrderPayment(order: OrderDocument) {
  //   const analyticsOps = [];
  //   const customerOps = [];

  //   for (const vendorOrder of order.vendorOrders) {
  //     const businessId = vendorOrder.businessId;
  //     const customerId = order.customerId;

  //     let revenue = 0;
  //     let productsSold = 0;

  //     for (const item of vendorOrder.items) {
  //       revenue += item.price * item.quantity;
  //       productsSold += item.quantity;
  //     }

  //     // 🧾 Prepare customer upsert
  //     customerOps.push({
  //       updateOne: {
  //         filter: { businessId, customerId },
  //         update: {
  //           $setOnInsert: { businessId, customerId },
  //         },
  //         upsert: true,
  //       },
  //     });

  //     // 📊 Prepare analytics update (base)
  //     analyticsOps.push({
  //       businessId,
  //       revenue,
  //       productsSold,
  //     });
  //   }

  //   // 🔥 Bulk write customers
  //   const customerResults =
  //     await this.vendorCustomerModel.bulkWrite(customerOps);

  //   // ⚠️ Map which ones were inserted
  //   const upsertedMap = new Set(
  //     Object.values(customerResults.upsertedIds || {}).map((id: any) =>
  //       id.toString(),
  //     ),
  //   );

  //   const finalAnalyticsOps = analyticsOps.map((entry, index) => {
  //     // const isNewCustomer = !!customerResults.upsertedIds?.[index];

  //     const isNewCustomer =
  //       customerResults.upsertedCount && customerResults.upsertedCount > 0;

  //     const update: any = {
  //       $inc: {
  //         totalRevenue: entry.revenue,
  //         totalOrders: 1,
  //         totalProductsSold: entry.productsSold,
  //       },
  //       $set: {
  //         lastUpdated: new Date(),
  //       },
  //     };

  //     if (isNewCustomer) {
  //       update.$inc.totalCustomers = 1;
  //     }

  //     return {
  //       updateOne: {
  //         filter: { businessId: entry.businessId },
  //         update,
  //         upsert: true,
  //       },
  //     };
  //   });

  //   // 🚀 Bulk update analytics
  //   await this.analyticsModel.bulkWrite(finalAnalyticsOps);
  // }

  //   async recordOrderPayment(order: OrderDocument) {
  //     const analyticsOps: AnyBulkWriteOperation<any>[] = [];
  // const customerOps: AnyBulkWriteOperation<any>[] = [];

  //     const businessCustomerMap = new Map<string, boolean>();

  //     // =========================
  //     // 1. PREPARE DATA
  //     // =========================
  //     for (const vendorOrder of order.vendorOrders) {
  //       const businessId = vendorOrder.businessId.toString();
  //       const customerId = order.customerId.toString();

  //       let revenue = 0;
  //       let productsSold = 0;

  //       for (const item of vendorOrder.items) {
  //         revenue += item.price * item.quantity;
  //         productsSold += item.quantity;
  //       }

  //       customerOps.push({
  //         updateOne: {
  //           filter: {
  //             businessId: new Types.ObjectId(businessId),
  //             customerId: new Types.ObjectId(customerId),
  //           },
  //           update: {
  //             $setOnInsert: {
  //               businessId: new Types.ObjectId(businessId),
  //               customerId: new Types.ObjectId(customerId),
  //             },
  //           },
  //           upsert: true,
  //         },
  //       });

  //       analyticsOps.push({
  //         businessId: new Types.ObjectId(businessId),
  //         revenue,
  //         productsSold,
  //         customerId: new Types.ObjectId(customerId),
  //       });
  //     }

  //     // =========================
  //     // 2. INSERT CUSTOMERS FIRST
  //     // =========================
  //     const customerResults = await this.vendorCustomerModel.bulkWrite(
  //       customerOps,
  //       { ordered: false },
  //     );

  //     // =========================
  //     // 3. BUILD SET OF NEW CUSTOMERS
  //     // =========================
  //     // IMPORTANT FIX:
  //     // bulkWrite does NOT reliably map per operation index
  //     // so we recompute using "insertedIds"

  //     const insertedIndexes = new Set<number>(
  //       Object.keys(customerResults.upsertedIds || {}).map((i) => Number(i)),
  //     );

  //     // =========================
  //     // 4. BUILD ANALYTICS OPS (WITH CORRECT NEW CUSTOMER LOGIC)
  //     // =========================
  //     const finalAnalyticsOps = analyticsOps.map((entry, index) => {
  //       const isNewCustomer = insertedIndexes.has(index);

  //       const update: any = {
  //         $inc: {
  //           totalRevenue: entry.revenue,
  //           totalOrders: 1,
  //           totalProductsSold: entry.productsSold,
  //         },
  //         $set: {
  //           lastUpdated: new Date(),
  //         },
  //       };

  //       if (isNewCustomer) {
  //         update.$inc.totalCustomers = 1;
  //       }

  //       return {
  //         updateOne: {
  //           filter: { businessId: entry.businessId },
  //           update,
  //           upsert: true,
  //         },
  //       };
  //     });

  //     // =========================
  //     // 5. EXECUTE ANALYTICS UPDATE
  //     // =========================
  //     await this.analyticsModel.bulkWrite(finalAnalyticsOps, {
  //       ordered: false,
  //     });
  //   }

  // async recordOrderPayment(order: OrderDocument) {
  //   // =========================
  //   // 1. LOOP SHIPMENTS
  //   // =========================

  //   const shipment = order.shipment;

  //   for (const vendorOrder of shipment.vendors) {
  //     const businessId = vendorOrder.businessId;
  //     const customerId = order.customerId;

  //     let revenue = 0;
  //     let productsSold = 0;

  //     for (const item of vendorOrder.items) {
  //       revenue += item.price * item.quantity;
  //       productsSold += item.quantity;
  //     }

  //     // =========================
  //     // 2. UPSERT CUSTOMER RELATION
  //     // =========================
  //     const customerResult = await this.vendorCustomerModel.updateOne(
  //       {
  //         businessId,
  //         customerId,
  //       },
  //       {
  //         $setOnInsert: {
  //           businessId,
  //           customerId,
  //         },
  //       },
  //       { upsert: true },
  //     );

  //     const isNewCustomer = customerResult.upsertedCount > 0;

  //     // =========================
  //     // 3. BUILD ANALYTICS UPDATE
  //     // =========================
  //     const update: any = {
  //       $inc: {
  //         totalRevenue: revenue,
  //         totalOrders: 1,
  //         totalProductsSold: productsSold,
  //       },
  //       $set: {
  //         lastUpdated: new Date(),
  //       },
  //     };

  //     // ONLY increment for first-time customer
  //     if (isNewCustomer) {
  //       update.$inc.totalCustomers = 1;
  //     }

  //     // =========================
  //     // 4. APPLY ANALYTICS UPDATE
  //     // =========================
  //     await this.analyticsModel.updateOne({ businessId }, update, {
  //       upsert: true,
  //     });
  //   }
  // }
  async getBusinessAnalytics(businessId: string) {
    const id = new Types.ObjectId(businessId);
    const response = await this.analyticsModel.findOne({
      businessId: id,
    });

    return response;
  }
}
