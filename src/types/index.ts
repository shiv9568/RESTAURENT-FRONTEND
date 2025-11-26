export interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
  offer?: string;
  distance?: string;
}

export interface PortionSize {
  name: string; // e.g., "Half Plate", "Full Plate", "Regular", "Large"
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // Default/base price
  image: string;
  category: string;
  isVeg: boolean;
  rating?: number;
  isAvailable?: boolean;
  portionSizes?: PortionSize[]; // Optional portion sizes
  parentId?: string; // If this is a sub-item, reference to parent item
  subItems?: MenuItem[]; // Child items (e.g., Burger -> Veg Burger, Chicken Burger)
  isParent?: boolean; // True if this item has sub-items
}

// Extended item used by admin and homepage visibility toggles
export interface FoodItem extends MenuItem {
  isAvailable: boolean;
  displayOnHomepage?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  selectedPortion?: string; // Selected portion size name
}

export interface Order {
  id: string;
  orderNumber?: string;
  restaurantName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  orderedAt: string;
  estimatedTime?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  isDefault: boolean;
}

// Admin Dashboard Types
export interface RestaurantOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantId: string;
  restaurantName: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableOn: 'all' | 'specific_items';
  itemIds?: string[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedTime: string;
  isActive: boolean;
  coordinates: {
    lat: number;
    lng: number;
  }[];
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  topSellingItems: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentOrders: Order[];
  revenueChart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface AdminOrder extends Order {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'online';
  paymentStatus: 'pending' | 'completed' | 'failed';
  notes?: string;
}

export interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  qrCodeUrl?: string;
  restaurantId?: string;
}