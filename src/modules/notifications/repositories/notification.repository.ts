import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateNotificationDto } from '../dtos/notification.dto';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    const notification = await new this.notificationModel({
      ...dto,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
      businessId: dto.businessId
        ? new Types.ObjectId(dto.businessId)
        : undefined,
      pickupCenterId: dto.pickupCenterId
        ? new Types.ObjectId(dto.pickupCenterId)
        : undefined,
      deliveryId: dto.deliveryId
        ? new Types.ObjectId(dto.deliveryId)
        : undefined,
    }).save();

    return notification;
  }

  async findNotificationsByBusinessId(
    businessId: string,
  ): Promise<NotificationDocument[]> {
    const id = new Types.ObjectId(businessId);
    const notification = await this.notificationModel
      .find({ businessId: id })
      .sort({ createdAt: -1 });

    return notification;
  }
  async findNotificationsByUserId(
    userId: string,
  ): Promise<NotificationDocument[]> {
    const id = new Types.ObjectId(userId);
    const notification = await this.notificationModel
      .find({ userId: id })
      .sort({ createdAt: -1 });

    return notification;
  }

  async markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    const id = new Types.ObjectId(notificationId);
    const user = new Types.ObjectId(userId);

    const notification = await this.notificationModel.findByIdAndUpdate(id, {
      $addToSet: {
        readBy: new Types.ObjectId(user),
      },
    });

    return notification;
  }
}
