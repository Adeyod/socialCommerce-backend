import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import {
  OrderEvents,
  RiderInviteEvents,
  ShipmentEvents,
} from '../../../common/events/order.events';
import { MailService } from '../../../mail/mail.service';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { OrdersService } from '../../orders/orders.service';
import { DeliveryMode } from '../../orders/schemas/order.schema';
import { Shipment } from '../../orders/types/order.types';
import { PickupCenterService } from '../../pickup-center/pickup-center.service';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Injectable()
export class NotificationListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pickupCenterService: PickupCenterService,
    private readonly businessesRepository: BusinessesRepository,
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
  ) {}
  private app_name = 'Go Shopping App';

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

  @OnEvent(ShipmentEvents.item_sent_to_pickup_center)
  async handleItemSentToPickupCenter(payload: {
    orderId: string;
    pickupCenterId: string;
    vendorBusinessId: string;
    itemVendorOrderId: string;
    vendorOrderId: string;
    triggeredBy: string;
  }) {
    if (
      !payload.orderId ||
      !payload.pickupCenterId ||
      !payload.vendorBusinessId ||
      !payload.triggeredBy
    ) {
      return;
    }

    const id = new Types.ObjectId(payload.vendorBusinessId);

    const vendorBiz =
      await this.businessesRepository.findBusinessByBusinessId(id);

    if (!vendorBiz) {
      throw new NotFoundException({
        message: 'Vendor business not found.',
        success: false,
        status: 404,
      });
    }

    const itemExist = await this.ordersService.findItemVendorOrderByItemId(
      payload.itemVendorOrderId,
    );

    const title = 'New Order on its way';
    const message = `${vendorBiz.businessName} has sent ${itemExist?.quantity} ${itemExist?.name}.`;
    const type = NotificationType.order_sent_to_pickup_center_by_vendor;
    const metadata = {
      orderId: payload.orderId,
      vendorOrderId: payload.vendorOrderId,
      itemVendorOrderId: payload.itemVendorOrderId,
      pickupCenterId: payload.pickupCenterId,
    };

    await this.notificationsService.notifyPickupCenter(
      payload.pickupCenterId,
      title,
      message,
      type,
      metadata,
    );
  }

  @OnEvent(ShipmentEvents.order_sent_to_pickup_center)
  async handleOrderSentToPickupCenter(payload: {
    orderId: string;
    pickupCenterId: string;
  }) {
    // Notify pickup center that all items inside the order has been marked as being sent to the pickup center
  }

  @OnEvent(ShipmentEvents.vendor_order_received_at_pickup_center)
  async handleVendorOrderReceivedAtPickupCenter(payload: {
    vendorOrderId: string;
    orderId: string;
    businessId: string;
  }) {
    const { vendorOrderId, orderId, businessId } = payload;

    const title = 'Order received by pickup center.';
    const message = `All your product(s) paid for in order with orderID #${orderId} has been received by the pickup center.`;
    const type =
      NotificationType.all_vendor_package_in_an_order_received_by_pickup_center;
    const metadata = {
      vendorOrderId,
      orderId,
      businessId,
    };

    const id = new Types.ObjectId(businessId);
    // Notify vendor that pickup center has received all his items inside a particular order
    const businessOwner =
      await this.businessesRepository.findBusinessOwnerByBusinessId(id);

    if (!businessOwner) {
      throw new NotFoundException({
        message: 'Business owner not found.',
        success: false,
        status: 404,
      });
    }

    await this.notificationsService.notifyBusinessOrderReceivedByPickupCenter(
      id,
      title,
      message,
      type,
      metadata,
    );
  }

  @OnEvent(ShipmentEvents.shipment_entity_created_for_logistic)
  async handleShipmentEntityCreatedForLogistic(payload: {
    _id: Types.ObjectId;
    orderId: Types.ObjectId;
    destinationPickupCenter: Types.ObjectId;
    customerId: Types.ObjectId;
    deliveryMode: DeliveryMode;
  }) {
    // Notify rider of new order in marketplace if deliveryMode is homeDelivery and notify buyer if deliveryMode is pickupCenter
    const { _id, orderId, destinationPickupCenter, customerId, deliveryMode } =
      payload;

    const center = await this.pickupCenterService.getPickupCenterById(
      destinationPickupCenter.toString(),
    );

    const order = await this.ordersService.findOrderByOrderIdWithoutSession(
      orderId.toString(),
    );

    const riderTitle = 'New shipment alert.';
    const buyerTitle = 'Your order is ready for pickup.';

    const riderMessage = `A new shipment order is ready to be claimed on the rider marketplace. You can visit the page to claim the order for delivery before others claim it.`;
    const buyerMessage = `Your order is ready for pickup at our office at ${center.name}, located at ${center.address}, ${center.town}, ${center.state}. You can also reach out on this number: ${center.phone}.`;

    const buyerType = NotificationType.order_ready_for_pickup;
    const riderType = NotificationType.new_shipment_alert;
    const metadata = {
      shipmentId: _id,
      orderId,
      pickupCenterId: destinationPickupCenter,
      buyerId: customerId,
      deliveryMode,
    };

    await this.notificationsService.notifyRidersNearby(
      riderTitle,
      riderMessage,
      riderType,
      center.state,
      order.nearestBusStop,
      metadata,
    );

    await this.notificationsService.notifyBuyer(
      buyerTitle,
      buyerMessage,
      buyerType,
      customerId,
      metadata,
    );
  }

  @OnEvent(RiderInviteEvents.rider_invite_created)
  async handleRiderInviteCreated(payload: {
    userId: string;
    businessName: string;
    title: string;
    email: string;
  }) {
    const notify = `You have been invited by a business with ${payload.businessName} to come and be a rider on the ${this.app_name}. Kindly accept or reject the offer.`;

    const inputPayload = {
      userId: payload.userId,
      title: payload.title,
      message: notify,
      type: NotificationType.rider_invitation_created,
      metadata: {
        businessName: payload.businessName,
      },
    };
    await this.notificationsService.notifyUserOfRiderInvite(inputPayload);

    await this.mailService.sendRiderInviteMail(
      payload.email,
      payload.title,
      payload.businessName,
    );
  }
}
