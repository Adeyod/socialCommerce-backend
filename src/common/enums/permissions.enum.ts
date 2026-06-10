export enum Permission {
  create_product = 'create_product',
  update_product = 'update_product',
  delete_product = 'delete_product',
  view_product = 'view_product',

  create_role = 'create_role',
  view_role = 'view_role',
  update_role = 'update_role',

  create_campaign = 'create_campaign',
  view_campaign = 'view_campaign',
  update_campaign = 'update_campaign',

  create_business_shipping_rate = 'create_business_shipping_rate',
  view_business_shipping_rate = 'view_business_shipping_rate',
  update_business_shipping_rate = 'update_business_shipping_rate',

  add_business_address = 'add_business_address',

  add_stock = 'add_stock',
  adjust_stock = 'adjust_stock',

  view_order = 'view_order',
  update_order = 'update_order',
}
