import { CartItem } from '@/types';

const CART_KEY = 'foodDeliveryCart';

const getCartKey = () => {
  const tableNumber = localStorage.getItem('tableNumber');
  return tableNumber ? `${CART_KEY}_table_${tableNumber}` : CART_KEY;
};

export const getCart = (): CartItem[] => {
  const cart = localStorage.getItem(getCartKey());
  return cart ? JSON.parse(cart) : [];
};

export const saveCart = (cart: CartItem[]): void => {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
};

export const addToCart = (item: CartItem): void => {
  const cart = getCart();
  // Include selectedPortion in uniqueness check so half/full are different items
  const existingItemIndex = cart.findIndex(
    (i) => i.id === item.id &&
      i.restaurantId === item.restaurantId &&
      (i as any).selectedPortion === (item as any).selectedPortion
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  saveCart(cart);
};

export const updateCartItemQuantity = (itemId: string, quantity: number, selectedPortion?: string): void => {
  const cart = getCart();
  const itemIndex = cart.findIndex((i) => i.id === itemId && i.selectedPortion === selectedPortion);

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }
    saveCart(cart);
  }
};

export const removeFromCart = (itemId: string, selectedPortion?: string): void => {
  const cart = getCart().filter((item) => !(item.id === itemId && item.selectedPortion === selectedPortion));
  saveCart(cart);
};

export const clearCart = (): void => {
  localStorage.removeItem(getCartKey());
};

export const getCartTotal = (): number => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCartItemsCount = (): number => {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
};
