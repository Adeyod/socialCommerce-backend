import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { NigeriaState } from '../collection/schemas/collection-fee.schema';
import { RiderProfileRepository } from '../rider/repositories/rider.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly riderProfileRepository: RiderProfileRepository,
  ) {}

  async notifyPickupCenter(
    pickupCenterId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata: any,
  ) {
    const response = await this.notificationRepository.createNotification({
      pickupCenterId: pickupCenterId,
      type,
      title,
      message,
      orderId: metadata.orderId,
    });

    return response;
  }
  async notifyBusiness(
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

  async notifyRidersNearby(
    title: string,
    message: string,
    type: NotificationType,
    pickupCenterState: NigeriaState,
    nearestBusStop: string,
    metadata: any,
  ) {
    // find riders that resides in the pickup center state and also has picked the buyer location as part of where he want to service

    const riders =
      await this.riderProfileRepository.findRidersInPickupStatePlyingNearestBusStop(
        pickupCenterState,
        nearestBusStop,
      );

    for (const rider of riders) {
      const notification = await this.notificationRepository.createNotification(
        {
          userId: rider._id.toString(),
          businessId: undefined,
          title,
          message,
          type,
        },
      );
    }
  }

  async notifyBusinessOrderReceivedByPickupCenter(
    businessId: Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType,
    metadata: any,
  ) {
    // Find business of the vendor and create in-app notification for the business.
  }
  async notifyBuyer(
    title: string,
    message: string,
    type: NotificationType,
    buyerId: Types.ObjectId,
    metadata: any,
  ) {
    // Find buyer here using buyerId and create in-app notification for the buyer.
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
