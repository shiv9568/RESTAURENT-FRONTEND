import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Tag, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  getCartTotal,
} from '@/utils/cart';
import { CartItem, Address } from '@/types';
import { toast } from 'sonner';
import { userAPI } from '@/utils/api';
import { EmptyCart } from '@/components/EmptyCart';

// Coupon interface
interface Coupon {
  code: string;
  description: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
}

// Available coupons
const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'WELCOME50',
    description: 'Get ₹50 off on orders above ₹200',
    type: 'flat',
    value: 50,
    minOrder: 200,
  },
  {
    code: 'SAVE20',
    description: '20% off on orders above ₹300 (Max ₹100)',
    type: 'percentage',
    value: 20,
    minOrder: 300,
    maxDiscount: 100,
  },
  {
    code: 'FIRSTORDER',
    description: 'Get 25% off on your first order (Max ₹150)',
    type: 'percentage',
    value: 25,
    minOrder: 100,
    maxDiscount: 150,
  },
  {
    code: 'FLAT100',
    description: 'Flat ₹100 off on orders above ₹500',
    type: 'flat',
    value: 100,
    minOrder: 500,
  },
  {
    code: 'MEGA30',
    description: '30% off on orders above ₹800 (Max ₹250)',
    type: 'percentage',
    value: 30,
    minOrder: 800,
    maxDiscount: 250,
  },
];

const getBackendUserId = (): string | null => {
  try {
    const raw = window.localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || parsed?._id || null;
  } catch {
    return null;
  }
};

const getUserKey = (): string => getBackendUserId() || 'guest';

const readAddresses = (userKey: string): Address[] => {
  try {
    const raw = window.localStorage.getItem(`addresses_${userKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [instructions, setInstructions] = useState('');

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsSignedIn(true);
    }
  }, []);

  const userKey = getUserKey();

  const loadCart = () => {
    const items = getCart();
    setCartItems(items);
    setTotal(getCartTotal());
  };

  useEffect(() => {
    loadCart();
    const list = readAddresses(userKey);
    setAddresses(list);
    const def = list.find(a => a.isDefault);
    setSelectedAddressId(def ? def.id : (list[0]?.id || ''));

    // Load user profile to get phone number
    if (isSignedIn) {
      userAPI.getProfile()
        .then(res => setUserProfile(res.data))
        .catch(() => { });
    }
  }, [userKey, isSignedIn]);

  const handleQuantityChange = (itemId: string, newQuantity: number, selectedPortion?: string) => {
    updateCartItemQuantity(itemId, newQuantity, selectedPortion);
    loadCart();
    window.dispatchEvent(new Event('storage'));
  };

  const handleRemove = (itemId: string, itemName: string, selectedPortion?: string) => {
    removeFromCart(itemId, selectedPortion);
    loadCart();
    window.dispatchEvent(new Event('storage'));
    toast.success(`${itemName} removed from cart`);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    const coupon = AVAILABLE_COUPONS.find(
      c => c.code.toUpperCase() === couponCode.toUpperCase()
    );

    if (!coupon) {
      toast.error('Invalid coupon code');
      return;
    }

    if (total < coupon.minOrder) {
      toast.error(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
      return;
    }

    setAppliedCoupon(coupon);
    toast.success(`Coupon "${coupon.code}" applied successfully!`);
    setShowCoupons(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const calculateDiscount = (): number => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.type === 'flat') {
      return appliedCoupon.value;
    } else {
      // Percentage discount
      const discount = Math.round((total * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscount) {
        return Math.min(discount, appliedCoupon.maxDiscount);
      }
      return discount;
    }
  };

  const handleCheckout = async () => {
    const tableNumber = localStorage.getItem('tableNumber');

    if (!isSignedIn && !tableNumber) {
      toast.error('Please login to place order');
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }



    if (!tableNumber && !selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    let selectedAddress = null;
    if (!tableNumber) {
      selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) {
        toast.error('Delivery address invalid');
        return;
      }
    }

    const firstItem = cartItems[0];
    const restaurantId = firstItem.restaurantId || 'main-restaurant';
    const restaurantName = firstItem.restaurantName || 'D&G Restaurent';

    const deliveryFee = tableNumber ? 0 : 40;
    const discount = calculateDiscount();
    const subtotalAfterDiscount = total - discount;
    const gst = 0; // GST removed
    const grandTotal = subtotalAfterDiscount + deliveryFee;

    const addrStr = tableNumber
      ? `Dine-in at Table ${tableNumber}`
      : `${selectedAddress?.label}: ${selectedAddress?.street}, ${selectedAddress?.city}, ${selectedAddress?.state} ${selectedAddress?.pincode}`;

    // Generate a unique, readable order number
    const timestamp = Date.now().toString(36).toUpperCase(); // Convert to base36 for shorter string
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const generatedOrderNumber = `ORD${timestamp}${random}`;

    // Get phone number from: 1) User profile, 2) Selected address, 3) Clerk profile
    const phoneNumber = userProfile?.mobile || userProfile?.phone || selectedAddress?.phone || user?.phoneNumbers?.[0]?.phoneNumber || '';

    // Get dine-in user name if available
    const dineInUserName = localStorage.getItem('dineInUserName');

    const orderData = {
      orderNumber: generatedOrderNumber,
      userId: getBackendUserId() || 'guest',
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      items: cartItems.map(item => ({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        selectedPortion: (item as any).selectedPortion || undefined, // IMPORTANT: Include portion info
      })),
      total: grandTotal,
      subtotal: total,
      discount: discount,
      couponCode: appliedCoupon?.code || null,
      deliveryFee: deliveryFee,
      gst: gst,
      status: 'pending',
      customerName: user?.fullName || user?.firstName || dineInUserName || 'Guest',
      customerEmail: user?.primaryEmailAddress?.emailAddress || '',
      customerPhone: phoneNumber,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      deliveryAddress: addrStr,
      orderType: tableNumber ? 'dine-in' : 'delivery',
      tableNumber: tableNumber || undefined,
      notes: instructions,
    };

    if (paymentMethod === 'cash') {
      try {
        setIsPlacingOrder(true);
        // Import orderAPI dynamically or ensure it's imported at top
        const { orderAPI } = await import('@/utils/api');
        const response = await orderAPI.create(orderData);

        if (response.data) {
          // Clear cart
          localStorage.removeItem('foodie_cart');
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('cartUpdated'));

          toast.success('Order placed successfully!');
          navigate(`/order-tracking/${response.data._id}`);
        }
      } catch (error: any) {
        console.error('Order placement failed:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        toast.error(`Failed to place order: ${errorMessage}`);
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      navigate('/payment', { state: { orderData } });
    }
  };

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  const tableNumber = localStorage.getItem('tableNumber');
  const deliveryFee = tableNumber ? 0 : 40;
  const discount = calculateDiscount();
  const subtotalAfterDiscount = total - discount;
  const gst = 0; // GST removed
  const grandTotal = subtotalAfterDiscount + deliveryFee;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={`${item.id}-${item.selectedPortion || 'default'}`} className="p-4">
              <div className="flex gap-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-4 h - 4 border - 2 flex items - center justify - center ${item.isVeg ? 'border-green-500' : 'border-red-500'
                            } `}
                        >
                          <div
                            className={`w - 2 h - 2 rounded - full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'
                              } `}
                          />
                        </div>
                        <h3 className="font-semibold">{item.name}</h3>
                      </div>
                      {(item as any).selectedPortion && (
                        <span className="inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {(item as any).selectedPortion}
                        </span>
                      )}
                      <p className="text-sm text-gray-500">
                        {item.restaurantName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id, item.name, item.selectedPortion)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-semibold text-lg">₹{item.price}</span>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-1">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, Math.max(1, item.quantity - 1), item.selectedPortion)
                        }
                        className="text-primary hover:text-primary-hover disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1, item.selectedPortion)
                        }
                        className="text-primary hover:text-primary-hover"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-500">
                      Total: ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {/* Special Instructions */}
          <div className="mt-4">
            <label className="block font-medium mb-2">Special Instructions</label>
            <textarea
              className="w-full border rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Add cooking notes or delivery instructions (e.g., 'Less spicy', 'Leave at door')"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* Bill Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Bill Summary</h2>

            {/* Coupon Section */}
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Apply Coupon</span>
              </div>

              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-green-700">{appliedCoupon.code}</div>
                      <div className="text-xs text-green-600">
                        Saved ₹{discount}!
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleApplyCoupon}>
                      Apply
                    </Button>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs p-0 h-auto text-primary"
                    onClick={() => setShowCoupons(!showCoupons)}
                  >
                    {showCoupons ? 'Hide' : 'View'} available coupons
                  </Button>

                  {showCoupons && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {AVAILABLE_COUPONS.map((coupon) => (
                        <div
                          key={coupon.code}
                          className="border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => {
                            if (total < coupon.minOrder) {
                              toast.error(`Minimum order of ₹${coupon.minOrder} required for this coupon`);
                              return;
                            }
                            setAppliedCoupon(coupon);
                            setCouponCode(coupon.code);
                            toast.success(`Coupon "${coupon.code}" applied successfully!`);
                            setShowCoupons(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-xs text-primary">{coupon.code}</div>
                            <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={(e) => e.stopPropagation()}>
                              Apply
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {coupon.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Item Total</span>
                <span>₹{total}</span>
              </div>
              {!tableNumber && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>To Pay</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>
            {/* Address Selection */}
            {tableNumber ? (
              <div className="mb-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-800 font-medium flex items-center">
                  <span className="mr-2">🍽️</span> Dine-in at Table {tableNumber}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Your order will be served at your table.
                </p>
              </div>
            ) : (
              <>
                {isSignedIn && addresses.length > 0 && (
                  <div className="mb-4 mt-4">
                    <label className="block font-medium mb-1">Delivery Address</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={selectedAddressId}
                      onChange={e => setSelectedAddressId(e.target.value)}
                      required
                    >
                      {addresses.map(addr => (
                        <option value={addr.id} key={addr.id}>
                          {addr.label}: {addr.street}, {addr.city} {addr.state} {addr.pincode}
                          {addr.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {isSignedIn && addresses.length === 0 && (
                  <div className="mb-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <p className="text-amber-800 font-medium">No delivery address found</p>
                    <p className="text-amber-600 text-xs mt-1">
                      Please add an address from your{' '}
                      <button
                        className="underline font-medium"
                        onClick={() => navigate('/profile')}
                      >
                        profile page
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Payment Method Selection */}
            <div className="mb-4 mt-4">
              <label className="block font-medium mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p - 4 border - 2 rounded - lg transition - all ${paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                    } `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">💵</span>
                    <span className="font-semibold text-sm">Cash on Delivery</span>
                    <span className="text-xs text-muted-foreground">Pay when you receive</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`p - 4 border - 2 rounded - lg transition - all ${paymentMethod === 'online'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                    } `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">💳</span>
                    <span className="font-semibold text-sm">Online Payment</span>
                    <span className="text-xs text-muted-foreground">UPI / Card / Wallet</span>
                  </div>
                </button>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleCheckout}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
