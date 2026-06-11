import { Injectable } from '@nestjs/common';
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
}
