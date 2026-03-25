export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'executive' | 'admin';
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  otp?: string | null;
  otp_expiry?: string | null;
  otp_delivery_status?: string | null;
  cart_count?: number;
  cart_total?: number;
  token?: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  name: string;
  street_address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
}

export interface PickupLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  pincode: string;
  is_active: boolean;
}

export interface PickupSlot {
  id: number;
  location_id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  total: number;
  status: string;
  created_at: string;
  address_id?: number | null;
  address?: string | null;
  user_phone?: string;
  slot_info?: string;
  discount_amount: number;
  order_type: 'delivery' | 'pickup';
  delivery_fee: number;
  pickup_location_id?: number | null;
  pickup_slot_id?: number | null;
  order_items?: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  is_checked: boolean;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  image_url?: string;
  parent_id?: number | null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  cost_price?: number;
  mrp?: number;
  discount?: number;
  description?: string;
  unit: string;
  image: string;
  category_id: number;
  subcategory_id?: number | null;
  stock: number;
  highlights?: string;
  brand?: string;
  catch?: string;
  product_id?: string;
  mfg_date?: string;
  country_of_origin?: string;
  out_of_stock?: boolean;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}
