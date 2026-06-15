import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderEvents } from '../../../common/events/order.events';
import { MailService } from '../../../mail/mail.service';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { Shipment } from '../../orders/types/order.types';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class NotificationListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly businessesRepository: BusinessesRepository,
    private readonly mailService: MailService,
  ) {}

  @OnEvent(OrderEvents.order_paid)
  async handleOrderPaid(payload: { orderId: string; shipment: Shipment }) {
    const { orderId, shipment } = payload;

    if (!shipment || !shipment.vendors?.length) return;

    for (const vendor of shipment.vendors) {
      const businessId = vendor.businessId.toString();

      const title = 'New Paid Order';
      const message = `You have received a new paid order #${orderId}. Please prepare items for pickup.`;
      const type = NotificationType.order_paid;
      const metadata = {
        orderId,
        items: vendor.items,
      };

      const businessOwner =
        await this.businessesRepository.findBusinessOwnerByBusinessId(
          vendor.businessId,
        );

      if (!businessOwner) {
        throw new NotFoundException({
          message: 'Business owner not found.',
          success: false,
          status: 404,
        });
      }

      // 1. IN-APP NOTIFICATION (Vendor Inbox)
      await this.notificationsService.notifyBusinessOrderPaid(
        businessId,
        title,
        message,
        type,
        metadata,
      );

      const email = 'businessOwner.ownerId.email';

      // 2. EMAIL NOTIFICATION (Vendor Email)
      await this.mailService.sendVendorOrderPaid(
        email,
        title,
        orderId,
        businessOwner.businessName,
        vendor.items,
      );
    }
  }

  // @OnEvent(ShipmentEvents.item_sent_to_pickup_center)
  // async handleItemSentToPickupCenter(payload: {
  //   orderId: string,
  //   pickupCenterId: string,
  //   vendorBusinessId: string,
  //   triggeredBy: string,

  // }) {
  //   if(!payload.orderId || !payload.pickupCenterId || !payload.vendorBusinessId || !payload.triggeredBy) {
  //     return
  //   }

  //   const id = new Types.ObjectId(payload.vendorBusinessId)

  //   const vendorBiz = await this.businessesRepository.findBusinessByBusinessId(
  //     id
  //   )

  //   if(!vendorBiz) {
  //     throw new NotFoundException({
  //         message: 'Vendor business not found.',
  //         success: false,
  //         status: 404,
  //       });
  //   }

  //    const title = 'New Order on its way';
  //     const message = `${vendorBiz.businessName} has sent .`;
  //     const type = NotificationType.order_paid;
  //     const metadata = {
  //       orderId,
  //       items: vendor.items,
  //     };

  //   const pickupCenter = await this.
  // }
}
