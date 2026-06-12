import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtUser } from '../../common/types/jwt-user.type';
import { RiderProfileRepository } from '../rider/repositories/rider.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly riderProfileRepository: RiderProfileRepository,
  ) {}

  async notifyBusinessOrderPaid(
    businessId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata: any,
  ) {
    const response = await this.notificationRepository.createNotification({
      businessId: businessId,
      type,
      title,
      message,
      orderId: metadata.orderId,
    });

    return response;
  }

  async notifyRidersNearby(delivery) {
    const riders = await this.riderProfileRepository.findByMultipleAreas(
      delivery.pickupPoints[0].location,
    );

    for (const rider of riders) {
      const notification = await this.notificationRepository.createNotification(
        {
          userId: rider._id.toString(),
          businessId: undefined,
          title: 'New Delivery Available.',
          message: 'A new delivery is waiting nearby.',
          deliveryId: delivery._id,
          type: NotificationType.order_ready_for_delivery,
        },
      );
    }
  }

  async findNotificationsByBusinessId(businessId: string, user: JwtUser) {
    const response =
      await this.notificationRepository.findNotificationsByBusinessId(
        businessId,
      );

    if (!response || !response.length) {
      throw new NotFoundException({
        message: 'No notifications found for this business ID.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async findNotificationsByUserId(userId: string, user: JwtUser) {
    if (userId !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You can only view notifications that belong to you.',
        success: false,
        status: 403,
      });
    }
    const response =
      await this.notificationRepository.findNotificationsByUserId(userId);

    if (!response || !response.length) {
      throw new NotFoundException({
        message: 'No notifications found for this user ID.',
        success: false,
        status: 404,
      });
    }

    return response;
  }
  async markNotificationAsRead(notificationId: string, user: JwtUser) {
    const response = await this.notificationRepository.markNotificationAsRead(
      notificationId,
      user.sub.toString(),
    );

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to mark notification as read.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
}
