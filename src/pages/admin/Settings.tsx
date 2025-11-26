import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, MapPin, Locate, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { restaurantBrandAPI } from '@/utils/api';

export default function Settings() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    cuisine: '',
    deliveryTime: '',
    priceForTwo: '',
    description: '',
    lat: '',
    lng: '',
  });
  const [isClosed, setIsClosed] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await restaurantBrandAPI.get();
        if (res?.data) setIsClosed(!!res.data.isClosed);
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    try {
      // Save to localStorage as fallback
      localStorage.setItem('foodie_admin_restaurant_settings', JSON.stringify(formData));
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setFormData({
      restaurantName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      cuisine: '',
      deliveryTime: '',
      priceForTwo: '',
      description: '',
      lat: '',
      lng: '',
    });
    toast.info('Form reset');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    toast.info('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) throw new Error('Failed to get address');
          
          const data = await response.json();
          const addr = data.address;
          
          // Update form with detected location
          setFormData(prev => ({
            ...prev,
            address: `${addr.road || addr.neighbourhood || ''}, ${addr.suburb || ''}`.trim(),
            city: addr.city || addr.town || addr.village || prev.city,
            state: addr.state || prev.state,
            pincode: addr.postcode || prev.pincode,
            lat: latitude.toString(),
            lng: longitude.toString(),
          }));
          
          toast.success('Location detected successfully!');
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Could not get address from location');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        
        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const openInGoogleMaps = () => {
    if (formData.lat && formData.lng) {
      window.open(`https://www.google.com/maps?q=${formData.lat},${formData.lng}`, '_blank');
    } else if (formData.address) {
      const query = encodeURIComponent(`${formData.address}, ${formData.city}, ${formData.state} ${formData.pincode}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
      toast.error('Please enter an address or detect location first');
    }
  };

  const toggleClosed = async () => {
    try {
      const next = !isClosed;
      setIsClosed(next);
      await restaurantBrandAPI.upsert({ isClosed: next });
      // Notify other tabs/components immediately (no full refresh)
      try {
        window.dispatchEvent(new CustomEvent('brandUpdated', { detail: { isClosed: next } }));
        // Also persist to localStorage to trigger cross-tab 'storage' events
        localStorage.setItem('brand_isClosed', JSON.stringify(next));
      } catch {}
      toast.success(next ? 'Restaurant marked as closed' : 'Restaurant marked as open');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your restaurant information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
            <div>
              <div className="font-medium">Store Status</div>
              <div className="text-sm text-muted-foreground">{isClosed ? 'Closed now. Customers will be blocked from ordering.' : 'Open for orders.'}</div>
            </div>
            <Button variant={isClosed ? 'outline' : 'default'} onClick={toggleClosed}>
              {isClosed ? 'Mark Open' : 'Mark Closed'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                value={formData.restaurantName}
                onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
                placeholder="Your Restaurant Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine Type</Label>
              <Input
                id="cuisine"
                value={formData.cuisine}
                onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                placeholder="e.g., Indian, Chinese, Italian"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Restaurant description"
              rows={3}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="restaurant@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 1234567890"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="address">Address</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                >
                  {detectingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Locate className="h-4 w-4 mr-2" />
                  )}
                  {detectingLocation ? 'Detecting...' : 'Detect Location'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openInGoogleMaps}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              </div>
            </div>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street address"
            />
            {formData.lat && formData.lng && (
              <div className="text-xs text-muted-foreground mt-1">
                📍 Coordinates: {formData.lat}, {formData.lng}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                placeholder="123456"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time</Label>
              <Input
                id="deliveryTime"
                value={formData.deliveryTime}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                placeholder="25-35 mins"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceForTwo">Price for Two</Label>
              <Input
                id="priceForTwo"
                type="number"
                value={formData.priceForTwo}
                onChange={(e) => setFormData(prev => ({ ...prev, priceForTwo: e.target.value }))}
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
