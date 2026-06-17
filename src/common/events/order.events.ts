export const OrderEvents = {
  order_paid: 'order_paid',
  order_cancelled: 'order_cancelled',
  order_shipped: 'order_shipped',
} as const;

export const ShipmentEvents = {
  item_sent_to_pickup_center: 'item_sent_to_pickup_center',
  vendor_order_received_at_pickup_center:
    'vendor_order_received_at_pickup_center',
  item_received_at_pickup_center: 'item_received_at_pickup_center',
  all_items_received_at_pickup_center: 'all_items_received_at_pickup_center',

  order_listed_on_rider_marketplace: 'order_listed_on_rider_marketplace',

  order_assigned_to_rider: 'order_assigned_to_rider',
  order_delivered_by_rider: 'order_delivered_by_rider',

  order_ready_for_pickup: 'order_ready_for_pickup',
  order_collected_at_pickup_center: 'order_collected_at_pickup_center',
} as const;
