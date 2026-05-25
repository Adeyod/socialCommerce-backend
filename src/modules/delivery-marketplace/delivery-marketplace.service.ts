import { Injectable } from '@nestjs/common';
import { DeliveryRepository } from '../delivery/repositories/delivery.repository';
import { DeliveryMarketplaceRepository } from './repositories/delivery-marketplace.repository';

@Injectable()
export class DeliveryMarketplaceService {
  constructor(
    private readonly deliveryMarketplaceRepository: DeliveryMarketplaceRepository,
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async claimDelivery(deliveryId: string, riderId: string) {
    // const deliveryExist = await this.deliveryMarketplaceRepository.findByDeliveryId(deliveryId)
    // if(!deliveryExist || deliveryExist.status !== MarketplaceStatus.open) {
    //   throw new BadRequestException({
    //     message: 'Delivery not available.',
    //     success: false,
    //     status: 400
    //   })
    // }
    // deliveryExist.status = MarketplaceStatus.claimed
    // deliveryExist.selectedRider = new Types.ObjectId(riderId)
    // await deliveryExist.save()
    // await this.deliveryRepository.assignRider(deliveryId, riderId)
    // return deliveryExist
  }
}
