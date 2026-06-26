import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Queue } from 'bull';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptor/global-response.interceptor';
import { FormDataNormalizePipe } from './common/pipes/formdata-normalize.pipe';
import { OrderRepository } from './modules/orders/repositories/order.repository';
import { WalletOwnerType } from './modules/wallet/schemas/wallet.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ?? 3000;
  app.setGlobalPrefix('/api/v1');

  const mailQueue = app.get<Queue>(getQueueToken('mail'));

  // Bull Board Express adapter
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  // const addressData = {
  //   street: 'No 45 Gbagi market',
  //   state: 'Oyo',
  //   country: 'Nigeria',
  //   code: 'Gbagi',
  //   centerLat: 4.3203,
  //   centerLng: 1.3364,
  //   radiusKm: 10,
  // };

  // const businessId = '6a2727a602164e3e56316342';
  // const productId = '6a27fcbf5e60b18bce2137d6';
  // const quantity = 12;

  // const dto = {
  //   businessId: '6a2727a602164e3e56316342',
  //   originState: NigeriaState.OYO,
  //   destinationState: NigeriaState.EKITI,
  //   weightRanges: [
  //     {
  //       min: 0,
  //       max: 5,
  //       price: 2200,
  //     },
  //     {
  //       min: 6,
  //       max: 10,
  //       price: 2350,
  //     },
  //     {
  //       min: 11,
  //       max: 20,
  //       price: 2500,
  //     },
  //     {
  //       min: 21,
  //       max: 50,
  //       price: 3000,
  //     },
  //     {
  //       min: 51,
  //       max: 100,
  //       price: 3500,
  //     },
  //     {
  //       min: 101,
  //       price: 6000,
  //     },
  //   ],
  // };

  const businessObj = [
    '69fcb9ec749def01837b39e4',
    '6a072f6fb400c151391f195b',
    '6a2727a602164e3e56316342',
    '6a27ea488cdda362e629ffdb',
    '6a2855a348cc887a34ff6b32',
  ];

  const owner = {
    ownerType: WalletOwnerType.business,
    businessId: businessObj[4],
  } as const;

  const repo = app.get(OrderRepository);
  // await repo.backfillMediaField();
  // await repo.createWallet(owner);
  // await repo.createBusinessShippingRate(dto);
  // await repo.addBusinessAddress(businessId, addressData);
  // await repo.createInventory(businessId, productId, quantity);

  // Create Bull Board
  const { addQueue, removeQueue, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(mailQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // Configure pipes
  app.useGlobalPipes(
    new FormDataNormalizePipe(),
    new ValidationPipe({
      whitelist: true, // This removes any property not defined in dtos
      forbidNonWhitelisted: false,
      transform: true, // transform plain obj to dto classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || []).map(
    (origin) => origin.trim(),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  app.useGlobalInterceptors(new GlobalResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new MongoExceptionFilter());

  const serverUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://socialcommerce-backend.onrender.com'
      : `http://localhost:${port}`;

  // Enable Swagger Docs
  const config = new DocumentBuilder()
    .setTitle('Social Commerce API Documentation')
    .setDescription('API documentation for social commerce application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication related endpoints.')
    .addTag('users', 'User management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter refresh JWT token',
        in: 'header',
      },
      'JWT-refresh',
    )
    .addServer(serverUrl)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Documentation',
    customfavIcon: 'httpd://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar {display: none},
      .swagger-ui .info {margin: 50px, 0, }
      .swagger-ui .info .title {color: #fc0606}
      `,
  });

  app.getHttpAdapter().get('api/docs-json', (req, res) => {
    res.json(document);
  });

  await app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
    console.log(
      `Bull Board available at http://localhost:${port}/admin/queues`,
    );
  });
}
bootstrap().catch((error) => {
  Logger.error('Error starting server:', error);
  process.exit(1);
});
