// Admin Service with API and localStorage fallback
import axios from 'axios';
import { FoodItem, Offer, DeliveryZone, DashboardStats, AdminOrder } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurent-server-cgxr.onrender.com/api';
const STORAGE_KEY_PREFIX = 'foodie_admin_';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to check if API is available
const isApiAvailable = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

// localStorage helpers
const localStorageHelpers = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// Broadcast helpers: notify same-tab and cross-tab listeners about admin changes
type AdminChangeType = 'food-items' | 'categories' | 'offers' | 'delivery-zones' | 'restaurant-brand' | 'orders';
function broadcastAdminChange(type: AdminChangeType, payload?: any) {
  try {
    window.dispatchEvent(new CustomEvent('adminDataChanged', { detail: { type, payload, at: Date.now() } }));
  } catch { }
  try {
    localStorage.setItem('admin_change', JSON.stringify({ type, at: Date.now() }));
  } catch { }
}

// Food Items Service
export const adminFoodService = {
  getAll: async (): Promise<FoodItem[]> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.get('/food-items');
        const items = response.data.map((item: any) => ({
          ...item,
          id: item.id || item._id,
        }));
        localStorageHelpers.set('foodItems', items);
        return items;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }
    return localStorageHelpers.get<FoodItem[]>('foodItems') || [];
  },

  getById: async (id: string): Promise<FoodItem | null> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.get(`/food-items/${id}`);
        return { ...response.data, id: response.data.id || response.data._id };
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }
    const items = localStorageHelpers.get<FoodItem[]>('foodItems') || [];
    return items.find(item => item.id === id) || null;
  },

  create: async (data: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
    const newItem: FoodItem = {
      ...data,
      id: Date.now().toString(),
    };

    try {
      if (await isApiAvailable()) {
        const response = await api.post('/food-items', newItem);
        const item = { ...response.data, id: response.data.id || response.data._id };
        const items = localStorageHelpers.get<FoodItem[]>('foodItems') || [];
        localStorageHelpers.set('foodItems', [...items, item]);
        broadcastAdminChange('food-items', { action: 'create', id: item.id });
        return item;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const items = localStorageHelpers.get<FoodItem[]>('foodItems') || [];
    localStorageHelpers.set('foodItems', [...items, newItem]);
    broadcastAdminChange('food-items', { action: 'create', id: newItem.id });
    return newItem;
  },

  update: async (id: string, data: Partial<FoodItem>): Promise<FoodItem> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.put(`/food-items/${id}`, data);
        const updated = { ...response.data, id: response.data.id || response.data._id };
        const items = localStorageHelpers.get<FoodItem[]>('foodItems') || [];
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
          items[index] = updated;
          localStorageHelpers.set('foodItems', items);
        }
        broadcastAdminChange('food-items', { action: 'update', id });
        return updated;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const items = localStorageHelpers.get<FoodItem[]>('foodItems') || [];
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      localStorageHelpers.set('foodItems', items);
      const updated = items[index];
      broadcastAdminChange('food-items', { action: 'update', id });
      return updated;
    }
    throw new Error('Item not found');
  },

  delete: async (id: string): Promise<void> => {
    try {
      if (await isApiAvailable()) {
        await api.delete(`/food-items/${id}`);
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const items = localStorageHelpers.get<FoodItem[]>('foodItems') || [];
    localStorageHelpers.set('foodItems', items.filter(item => item.id !== id));
    broadcastAdminChange('food-items', { action: 'delete', id });
  },
};

// Categories Service
export const adminCategoryService = {
  getAll: async () => {
    try {
      if (await isApiAvailable()) {
        const response = await api.get('/categories');
        const categories = response.data.map((cat: any) => ({
          ...cat,
          id: cat.id || cat._id,
        }));
        localStorageHelpers.set('categories', categories);
        return categories;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }
    return localStorageHelpers.get<any[]>('categories') || [];
  },

  create: async (data: any) => {
    const newCategory = {
      ...data,
      id: Date.now().toString(),
    };

    try {
      if (await isApiAvailable()) {
        const response = await api.post('/categories', newCategory);
        const cat = { ...response.data, id: response.data.id || response.data._id };
        const categories = localStorageHelpers.get<any[]>('categories') || [];
        localStorageHelpers.set('categories', [...categories, cat]);
        broadcastAdminChange('categories', { action: 'create', id: cat.id });
        return cat;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const categories = localStorageHelpers.get<any[]>('categories') || [];
    localStorageHelpers.set('categories', [...categories, newCategory]);
    broadcastAdminChange('categories', { action: 'create', id: newCategory.id });
    return newCategory;
  },

  update: async (id: string, data: any) => {
    try {
      if (await isApiAvailable()) {
        const response = await api.put(`/categories/${id}`, data);
        const updated = { ...response.data, id: response.data.id || response.data._id };
        const categories = localStorageHelpers.get<any[]>('categories') || [];
        const index = categories.findIndex((cat: any) => cat.id === id);
        if (index !== -1) {
          categories[index] = updated;
          localStorageHelpers.set('categories', categories);
        }
        broadcastAdminChange('categories', { action: 'update', id });
        return updated;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const categories = localStorageHelpers.get<any[]>('categories') || [];
    const index = categories.findIndex((cat: any) => cat.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...data };
      localStorageHelpers.set('categories', categories);
      const updated = categories[index];
      broadcastAdminChange('categories', { action: 'update', id });
      return updated;
    }
    throw new Error('Category not found');
  },

  delete: async (id: string): Promise<void> => {
    try {
      if (await isApiAvailable()) {
        await api.delete(`/categories/${id}`);
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const categories = localStorageHelpers.get<any[]>('categories') || [];
    localStorageHelpers.set('categories', categories.filter((cat: any) => cat.id !== id));
    broadcastAdminChange('categories', { action: 'delete', id });
  },
};

// Orders Service
export const adminOrdersService = {
  getAll: async (): Promise<AdminOrder[]> => {
    try {
      // 1. Try to fetch from API
      let apiOrders: AdminOrder[] = [];
      try {
        const response = await api.get('/orders');
        console.log('Orders API response:', response.data);
        if (response.data && Array.isArray(response.data)) {
          apiOrders = response.data.map((order: any) => ({
            ...order,
            id: order.id || order._id || order._id?.toString(),
            orderedAt: order.orderedAt || order.createdAt,
          }));
        }
      } catch (apiError) {
        console.warn('Failed to fetch orders from API:', apiError);
      }

      // 2. Get local orders (fallback/offline support)
      const localOrdersRaw = JSON.parse(localStorage.getItem('foodie_orders') || '[]');
      const localOrders: AdminOrder[] = Array.isArray(localOrdersRaw)
        ? localOrdersRaw.map((order: any) => ({
          ...order,
          id: order.id || order.orderNumber,
          orderedAt: order.orderedAt || order.createdAt || new Date().toISOString(),
        }))
        : [];

      // 3. Merge: API orders take precedence. Use a Map keyed by orderNumber (or ID)
      const orderMap = new Map<string, AdminOrder>();

      // Add local orders first
      localOrders.forEach(order => {
        const key = order.orderNumber || order.id;
        if (key) orderMap.set(key, order);
      });

      // Overwrite with API orders (authoritative source)
      apiOrders.forEach(order => {
        const key = order.orderNumber || order.id;
        if (key) orderMap.set(key, order);
      });

      const mergedOrders = Array.from(orderMap.values()).sort((a, b) => {
        const dateA = new Date(a.orderedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.orderedAt || b.createdAt || 0).getTime();
        return dateB - dateA; // Newest first
      });

      console.log(`Merged orders: ${mergedOrders.length} (API: ${apiOrders.length}, Local: ${localOrders.length})`);
      return mergedOrders;
    } catch (error: any) {
      console.error('Critical error in getAll orders:', error);
      return [];
    }
  },

  updateStatus: async (id: string, status: string): Promise<AdminOrder> => {
    try {
      console.log(`Updating order ${id} to status: ${status}`);
      const response = await api.put(`/orders/${id}`, { status });
      const updated = { ...response.data, id: response.data.id || response.data._id };

      // Also update in localStorage (foodie_orders)
      const localOrdersRaw = JSON.parse(localStorage.getItem('foodie_orders') || '[]');
      if (Array.isArray(localOrdersRaw)) {
        const index = localOrdersRaw.findIndex((order: any) =>
          order.id === id || order.orderNumber === id || order._id === id
        );
        if (index !== -1) {
          localOrdersRaw[index] = { ...localOrdersRaw[index], status };
          localStorage.setItem('foodie_orders', JSON.stringify(localOrdersRaw));
        }
      }

      broadcastAdminChange('orders', { action: 'update', id });
      console.log('Order updated successfully');
      return updated;
    } catch (error: any) {
      console.error('API update failed:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Fallback: update in localStorage only
      const localOrdersRaw = JSON.parse(localStorage.getItem('foodie_orders') || '[]');
      if (Array.isArray(localOrdersRaw)) {
        const index = localOrdersRaw.findIndex((order: any) =>
          order.id === id || order.orderNumber === id || order._id === id
        );
        if (index !== -1) {
          localOrdersRaw[index] = { ...localOrdersRaw[index], status: status as any };
          localStorage.setItem('foodie_orders', JSON.stringify(localOrdersRaw));
          console.log('Order updated in localStorage only');
          return localOrdersRaw[index];
        }
      }

      throw new Error('Order not found');
    }
  },

  clearAll: async (): Promise<{ message: string; deletedCount: number }> => {
    try {
      console.log('Clearing all orders...');
      const response = await api.delete('/orders');

      // Also clear localStorage orders
      localStorage.removeItem('foodie_orders');
      localStorageHelpers.set('orders', []);

      broadcastAdminChange('orders', { action: 'clear-all' });
      console.log('All orders cleared successfully');
      return response.data;
    } catch (error: any) {
      console.error('API clear all failed:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Fallback: clear localStorage only
      localStorage.removeItem('foodie_orders');
      localStorageHelpers.set('orders', []);
      broadcastAdminChange('orders', { action: 'clear-all' });
      console.log('Orders cleared from localStorage only');
      return { message: 'Orders cleared locally', deletedCount: 0 };
    }
  },

  updatePaymentStatus: async (id: string, paymentStatus: string): Promise<AdminOrder> => {
    try {
      console.log(`Updating payment status for order ${id} to: ${paymentStatus}`);
      const response = await api.put(`/orders/${id}`, { paymentStatus });
      const updated = { ...response.data, id: response.data.id || response.data._id };

      // Also update in localStorage (foodie_orders)
      const localOrdersRaw = JSON.parse(localStorage.getItem('foodie_orders') || '[]');
      if (Array.isArray(localOrdersRaw)) {
        const index = localOrdersRaw.findIndex((order: any) =>
          order.id === id || order.orderNumber === id || order._id === id
        );
        if (index !== -1) {
          localOrdersRaw[index] = { ...localOrdersRaw[index], paymentStatus };
          localStorage.setItem('foodie_orders', JSON.stringify(localOrdersRaw));
        }
      }

      broadcastAdminChange('orders', { action: 'update', id });
      console.log('Payment status updated successfully');
      return updated;
    } catch (error: any) {
      console.error('API update failed:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Fallback: update in localStorage only
      const localOrdersRaw = JSON.parse(localStorage.getItem('foodie_orders') || '[]');
      if (Array.isArray(localOrdersRaw)) {
        const index = localOrdersRaw.findIndex((order: any) =>
          order.id === id || order.orderNumber === id || order._id === id
        );
        if (index !== -1) {
          localOrdersRaw[index] = { ...localOrdersRaw[index], paymentStatus: paymentStatus as any };
          localStorage.setItem('foodie_orders', JSON.stringify(localOrdersRaw));
          console.log('Payment status updated in localStorage only');
          return localOrdersRaw[index];
        }
      }

      throw new Error('Order not found');
    }
  },
};

// Offers Service
export const adminOffersService = {
  getAll: async (): Promise<Offer[]> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.get('/offers');
        return response.data.map((offer: any) => ({
          ...offer,
          id: offer.id || offer._id,
        }));
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }
    return localStorageHelpers.get<Offer[]>('offers') || [];
  },

  create: async (data: Omit<Offer, 'id'>): Promise<Offer> => {
    // Convert date strings to Date objects
    const offerData = {
      ...data,
      validFrom: typeof data.validFrom === 'string' ? data.validFrom : data.validFrom,
      validUntil: typeof data.validUntil === 'string' ? data.validUntil : data.validUntil,
    };

    const newOffer: Offer = {
      ...offerData,
      id: Date.now().toString(),
    };

    try {
      if (await isApiAvailable()) {
        const response = await api.post('/offers', newOffer);
        const offer = { ...response.data, id: response.data.id || response.data._id };
        const offers = localStorageHelpers.get<Offer[]>('offers') || [];
        localStorageHelpers.set('offers', [...offers, offer]);
        broadcastAdminChange('offers', { action: 'create', id: offer.id });
        return offer;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const offers = localStorageHelpers.get<Offer[]>('offers') || [];
    localStorageHelpers.set('offers', [...offers, newOffer]);
    broadcastAdminChange('offers', { action: 'create', id: newOffer.id });
    return newOffer;
  },

  update: async (id: string, data: Partial<Offer>): Promise<Offer> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.put(`/offers/${id}`, data);
        const updated = { ...response.data, id: response.data.id || response.data._id };
        const offers = localStorageHelpers.get<Offer[]>('offers') || [];
        const index = offers.findIndex(offer => offer.id === id);
        if (index !== -1) {
          offers[index] = updated;
          localStorageHelpers.set('offers', offers);
        }
        broadcastAdminChange('offers', { action: 'update', id });
        return updated;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const offers = localStorageHelpers.get<Offer[]>('offers') || [];
    const index = offers.findIndex(offer => offer.id === id);
    if (index !== -1) {
      offers[index] = { ...offers[index], ...data };
      localStorageHelpers.set('offers', offers);
      const updated = offers[index];
      broadcastAdminChange('offers', { action: 'update', id });
      return updated;
    }
    throw new Error('Offer not found');
  },

  delete: async (id: string): Promise<void> => {
    try {
      if (await isApiAvailable()) {
        await api.delete(`/offers/${id}`);
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const offers = localStorageHelpers.get<Offer[]>('offers') || [];
    localStorageHelpers.set('offers', offers.filter(offer => offer.id !== id));
    broadcastAdminChange('offers', { action: 'delete', id });
  },
};

// Delivery Zones Service
export const adminDeliveryZonesService = {
  getAll: async (): Promise<DeliveryZone[]> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.get('/delivery-zones');
        return response.data.map((zone: any) => ({
          ...zone,
          id: zone.id || zone._id,
        }));
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }
    return localStorageHelpers.get<DeliveryZone[]>('deliveryZones') || [];
  },

  create: async (data: Omit<DeliveryZone, 'id'>): Promise<DeliveryZone> => {
    const newZone: DeliveryZone = {
      ...data,
      id: Date.now().toString(),
    };

    try {
      if (await isApiAvailable()) {
        const response = await api.post('/delivery-zones', newZone);
        const zone = { ...response.data, id: response.data.id || response.data._id };
        const zones = localStorageHelpers.get<DeliveryZone[]>('deliveryZones') || [];
        localStorageHelpers.set('deliveryZones', [...zones, zone]);
        broadcastAdminChange('delivery-zones', { action: 'create', id: zone.id });
        return zone;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const zones = localStorageHelpers.get<DeliveryZone[]>('deliveryZones') || [];
    localStorageHelpers.set('deliveryZones', [...zones, newZone]);
    broadcastAdminChange('delivery-zones', { action: 'create', id: newZone.id });
    return newZone;
  },

  update: async (id: string, data: Partial<DeliveryZone>): Promise<DeliveryZone> => {
    try {
      if (await isApiAvailable()) {
        const response = await api.put(`/delivery-zones/${id}`, data);
        const updated = { ...response.data, id: response.data.id || response.data._id };
        const zones = localStorageHelpers.get<DeliveryZone[]>('deliveryZones') || [];
        const index = zones.findIndex(zone => zone.id === id);
        if (index !== -1) {
          zones[index] = updated;
          localStorageHelpers.set('deliveryZones', zones);
        }
        broadcastAdminChange('delivery-zones', { action: 'update', id });
        return updated;
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const zones = localStorageHelpers.get<DeliveryZone[]>('deliveryZones') || [];
    const index = zones.findIndex(zone => zone.id === id);
    if (index !== -1) {
      zones[index] = { ...zones[index], ...data };
      localStorageHelpers.set('deliveryZones', zones);
      const updated = zones[index];
      broadcastAdminChange('delivery-zones', { action: 'update', id });
      return updated;
    }
    throw new Error('Delivery zone not found');
  },

  delete: async (id: string): Promise<void> => {
    try {
      if (await isApiAvailable()) {
        await api.delete(`/delivery-zones/${id}`);
      }
    } catch (error) {
      console.warn('API unavailable, using localStorage:', error);
    }

    const zones = localStorageHelpers.get<DeliveryZone[]>('deliveryZones') || [];
    localStorageHelpers.set('deliveryZones', zones.filter(zone => zone.id !== id));
    broadcastAdminChange('delivery-zones', { action: 'delete', id });
  },
};

// Dashboard Stats Service
export const adminDashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      // First try to get stats from API
      if (await isApiAvailable()) {
        const response = await api.get('/admin/dashboard/stats');
        return response.data;
      }
    } catch (error) {
      console.warn('API stats unavailable, calculating from orders:', error);
    }

    // Fallback: Calculate from actual orders
    try {
      // Get all orders using the same method as OrdersManagement
      const allOrders = await adminOrdersService.getAll();

      const totalOrders = allOrders.length;
      const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pendingOrders = allOrders.filter(order => order.status === 'pending' || order.status === 'confirmed').length;
      const completedOrders = allOrders.filter(order => order.status === 'delivered').length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top selling items from order data
      const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();

      allOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const itemId = item.itemId || item.id || item.name;
            const existing = itemSales.get(itemId);

            if (existing) {
              existing.quantity += item.quantity || 0;
              existing.revenue += (item.price || 0) * (item.quantity || 0);
            } else {
              itemSales.set(itemId, {
                name: item.name || 'Unknown Item',
                quantity: item.quantity || 0,
                revenue: (item.price || 0) * (item.quantity || 0),
              });
            }
          });
        }
      });

      // Convert to array and sort by quantity sold
      const topSellingItems = Array.from(itemSales.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Get recent orders (last 5)
      const recentOrders = allOrders
        .sort((a, b) => {
          const dateA = new Date(a.orderedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.orderedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      console.log(`Dashboard Stats: ${totalOrders} total orders, ₹${totalRevenue} revenue, ${pendingOrders} pending, ${completedOrders} completed`);

      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        averageOrderValue,
        topSellingItems,
        recentOrders,
        revenueChart: [],
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);

      // Return empty stats if everything fails
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        recentOrders: [],
        revenueChart: [],
      };
    }
  },
};

