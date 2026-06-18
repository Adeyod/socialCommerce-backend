import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'This is the ID of the user that the notification belong to.',
    example: '102o3r84u39283uw8384u2weu3',
  })
  @IsNotEmpty()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'This is the notification type.',
    example: NotificationType.order_paid,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    description: 'This is the title of the notification.',
    example: 'Your product has been paid for',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'This is the details of the notification.',
  })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'This is the order ID of the purchased product.',
    example: '102o3948u5hj438e3h4u5',
  })
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({
    description:
      'This is the pickup center ID of the business that is processing the purchased product.',
    example: '102o3948u5hj438e3h4u5',
  })
  @IsOptional()
  pickupCenterId?: string;

  @ApiPropertyOptional({
    description:
      'This is the business ID of the business that is selling the purchased product.',
    example: '102o3948u5hj438e3h4u5',
  })
  @IsOptional()
  businessId?: string;

  @ApiPropertyOptional({
    description: 'This is the Delivery ID for the product to be delivered.',
    example: '102o3948u5hj438e3h4u5',
  })
  @IsOptional()
  deliveryId?: string;
}
