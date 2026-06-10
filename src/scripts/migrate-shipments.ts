// import { NestFactory } from '@nestjs/core';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { AppModule } from '../app.module';
// import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';

// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);

//   const orderModel = app.get<Model<OrderDocument>>(getModelToken(Order.name));

//   // RAW MONGO QUERY (IMPORTANT FIX)
//   const orders = await orderModel.collection.find({}).toArray();

//   console.log('orders fetched:', orders.length);

//   for (const order of orders) {
//     console.log('checking order:', order._id);

//     const legacyShipments = order.shipments;

//     if (legacyShipments && legacyShipments.length > 0) {
//       const update = await orderModel.collection.updateOne(
//         { _id: order._id },
//         {
//           $set: {
//             shipment: legacyShipments[0],
//           },
//           $unset: {
//             shipments: '',
//           },
//         },
//       );

//       console.log('UPDATED:', update.modifiedCount);
//     }
//   }

//   console.log('Migration completed');

//   await app.close();
// }

// bootstrap();
