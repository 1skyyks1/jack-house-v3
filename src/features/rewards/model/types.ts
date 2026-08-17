export type RewardItemType = "virtual" | "physical"
export type RewardItemStatus = "draft" | "active" | "inactive"
export type FulfillmentStatus = "pending" | "processing" | "completed" | "cancelled"

export type RewardItem = {
  id: number
  name: string
  name_zh?: string | null
  name_en?: string | null
  description: string | null
  description_zh?: string | null
  description_en?: string | null
  image_url: string | null
  type: RewardItemType
  point_cost: number
  stock: number
  limit_per_user: number | null
  status: RewardItemStatus
  starts_at: string | null
  ends_at: string | null
  sort_order: number
  id_label: string | null
  id_label_zh?: string | null
  id_label_en?: string | null
  id_placeholder: string | null
  id_placeholder_zh?: string | null
  id_placeholder_en?: string | null
  created_time: string
  updated_time: string
}

export type PointTransaction = {
  id: number
  user_id: number
  amount: number
  balance_after: number
  type: string
  reason: string
  order_id: number | null
  operator_id: number | null
  created_time: string
  user?: { user_id: number; user_name: string; avatar: string | null }
}

export type RedemptionOrderItem = {
  id: number
  order_id: number
  reward_item_id: number
  item_name: string
  item_name_zh?: string | null
  item_name_en?: string | null
  item_type: RewardItemType
  image_url: string | null
  unit_points: number
  quantity: number
  subtotal_points: number
  virtual_id: string | null
  remark: string | null
  fulfillment_status: FulfillmentStatus
  fulfillment_detail: string | null
}

export type RedemptionOrder = {
  id: number
  order_no: string
  user_id: number
  total_points: number
  status: FulfillmentStatus
  recipient: string | null
  contact: string | null
  address: string | null
  shipping_remark: string | null
  created_time: string
  updated_time: string
  items: RedemptionOrderItem[]
  user?: { user_id: number; user_name: string; avatar: string | null }
}

export type CartLine = {
  item: RewardItem
  quantity: number
  virtualId: string
  remark: string
}

export type ShippingInfo = {
  recipient: string
  contact: string
  address: string
  remark: string
}
