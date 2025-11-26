import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Settings, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { userAPI, orderAPI } from '@/utils/api';
import { Address } from '@/types';
import { addToCart } from '@/utils/cart';

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

const getUserKey = (): string => {
  return getBackendUserId() || 'guest';
};

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

const writeAddresses = (userKey: string, addresses: Address[]) => {
  window.localStorage.setItem(`addresses_${userKey}`, JSON.stringify(addresses));
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    label: '', street: '', city: '', state: '', pincode: '', isDefault: false,
  });
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const userKey = getUserKey();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/auth');
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Load addresses
  useEffect(() => {
    const list = readAddresses(userKey);
    setAddresses(list);
  }, [userKey]);

  // Load orders
  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      const uid = getBackendUserId();
      if (!uid) return;

      try {
        setOrdersLoading(true);
        const res = await orderAPI.getAll();
        const list = Array.isArray(res.data) ? res.data.filter(o => o.userId === uid) : [];
        setOrders(list);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      await userAPI.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });

      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...profile }));

      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEditAddress = (e: React.FormEvent) => {
    e.preventDefault();

    let next = [...addresses];

    if (isEditingAddress && addressForm.id) {
      // Edit existing
      const idx = next.findIndex(a => a.id === addressForm.id);
      if (idx !== -1) {
        const updated = { ...next[idx], ...addressForm } as Address;
        if (updated.isDefault) next = next.map(a => ({ ...a, isDefault: a.id === updated.id }));
        next[idx] = updated;
      }
      toast.success('Address updated');
    } else {
      // Add new
      const id = Date.now().toString();
      const newAddr: Address = {
        id,
        label: addressForm.label || 'Home',
        street: addressForm.street || '',
        city: addressForm.city || '',
        state: addressForm.state || '',
        pincode: addressForm.pincode || '',
        isDefault: !!addressForm.isDefault,
      };
      if (newAddr.isDefault) next = next.map(a => ({ ...a, isDefault: false }));
      next.push(newAddr);
      toast.success('Address added');
    }

    setAddresses(next);
    writeAddresses(userKey, next);
    window.dispatchEvent(new Event('storage'));
    setIsEditingAddress(null);
    setAddressForm({ label: '', street: '', city: '', state: '', pincode: '', isDefault: false });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id: string) => {
    const next = addresses.filter(a => a.id !== id);
    setAddresses(next);
    writeAddresses(userKey, next);
    window.dispatchEvent(new Event('storage'));
    toast.success('Address deleted');
  };

  const handleReorder = (order: any) => {
    try {
      (order.items || []).forEach((item: any) => {
        addToCart({
          id: item.itemId || item.id || Math.random().toString(),
          name: item.name,
          description: '',
          price: item.price,
          image: item.image || '',
          category: 'Reorder',
          isVeg: true,
          quantity: item.quantity || 1,
          restaurantId: order.restaurantId || 'main-restaurant',
          restaurantName: order.restaurantName || 'D&G Restaurant',
        } as any);
      });
      window.dispatchEvent(new Event('storage'));
      toast.success('Items added to cart');
      navigate('/cart');
    } catch {
      toast.error('Failed to reorder');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <Card className="lg:col-span-1 p-6 h-fit">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h2 className="font-semibold text-lg">{profile.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>

            <nav className="space-y-2">
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('orders')}
              >
                <Package className="w-4 h-4 mr-2" />
                Orders
              </Button>
              <Button
                variant={activeTab === 'addresses' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Addresses
              </Button>
            </nav>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="orders">My Orders</TabsTrigger>
                <TabsTrigger value="addresses">Saved Addresses</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block font-medium mb-1">Full Name</label>
                      <Input
                        name="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!editing || loading}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Email</label>
                      <Input
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!editing || loading}
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Mobile Number</label>
                      <Input
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setProfile({ ...profile, phone: val });
                        }}
                        disabled={!editing || loading}
                        placeholder="1234567890"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    {editing ? (
                      <>
                        <Button onClick={handleProfileSave} disabled={loading}>Save</Button>
                        <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>Cancel</Button>
                      </>
                    ) : (
                      <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                {ordersLoading ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                    <Button onClick={() => navigate('/')}>Browse Menu</Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id || order._id} className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                          <div>
                            <div className="font-semibold text-lg">
                              Order #{order.orderNumber || (order.id || order._id).toString().slice(-6)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.restaurantName} • ₹{order.total}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/order-tracking/${order.id || order._id}`)}>
                              Track Order
                            </Button>
                            <Button size="sm" onClick={() => handleReorder(order)}>
                              Reorder
                            </Button>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="border-t pt-4">
                            <div className="text-sm font-medium mb-2">Items:</div>
                            <div className="space-y-1">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                                  <span>{item.name} x {item.quantity}</span>
                                  <span>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses" className="space-y-4">
                {addresses.length === 0 && !showAddressForm ? (
                  <Card className="p-8 text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
                    <p className="text-muted-foreground mb-4">Add a delivery address to get started</p>
                    <Button onClick={() => setShowAddressForm(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Address
                    </Button>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-4">
                      {addresses.map(addr => (
                        <Card key={addr.id} className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{addr.label}</h3>
                                {addr.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>}
                              </div>
                              <div className="text-sm text-muted-foreground">{addr.street}</div>
                              <div className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.pincode}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEditingAddress(addr.id);
                                  setAddressForm(addr);
                                  setShowAddressForm(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDeleteAddress(addr.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    {!showAddressForm && (
                      <Button className="w-full" onClick={() => setShowAddressForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add New Address
                      </Button>
                    )}
                  </>
                )}

                {showAddressForm && (
                  <Card className="p-6 mt-4">
                    <h3 className="font-semibold text-lg mb-4">{isEditingAddress ? 'Edit Address' : 'Add Address'}</h3>
                    <form onSubmit={handleAddEditAddress} className="space-y-4">
                      <div>
                        <label className="block font-medium mb-1">Label</label>
                        <Input
                          value={addressForm.label || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                          required
                          placeholder="e.g., Home, Office"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Street Address</label>
                        <Input
                          value={addressForm.street || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          required
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-medium mb-1">City</label>
                          <Input
                            value={addressForm.city || ''}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">State</label>
                          <Input
                            value={addressForm.state || ''}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Pincode</label>
                        <Input
                          value={addressForm.pincode || ''}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          required
                          maxLength={8}
                        />
                      </div>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={!!addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        />
                        <label htmlFor="isDefault" className="ml-2 text-sm">Set as default address</label>
                      </div>
                      <div className="flex gap-2 justify-end mt-4">
                        <Button type="submit">{isEditingAddress ? 'Save Changes' : 'Add Address'}</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddressForm(false);
                            setIsEditingAddress(null);
                            setAddressForm({ label: '', street: '', city: '', state: '', pincode: '', isDefault: false });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
