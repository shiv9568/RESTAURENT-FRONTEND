import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuItem from '@/components/MenuItem';
import { addToCart } from '@/utils/cart';
import { MenuItem as MenuItemType, CartItem } from '@/types';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { restaurantsAPI, foodItemsAPI } from '@/utils/apiService';
import { encodeTableId } from '@/utils/tableId';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);

  const tableNumber = localStorage.getItem('tableNumber');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch restaurant details
        // Note: If id is 'main-restaurant', we might need a specific endpoint or just get the first active one
        let restaurantData;
        if (id === 'main-restaurant') {
          const res = await restaurantsAPI.getAll({ isActive: true });
          restaurantData = res.data[0];
        } else {
          const res = await restaurantsAPI.getById(id);
          restaurantData = res.data;
        }

        setRestaurant(restaurantData);

        // Fetch menu items for this restaurant
        // Assuming foodItemsAPI.getAll can filter by restaurantId, or we filter client side if needed
        const itemsRes = await foodItemsAPI.getAll({ restaurantId: restaurantData?._id || restaurantData?.id });
        setMenuItems(itemsRes.data || []);
      } catch (error) {
        console.error('Failed to load restaurant details:', error);
        toast.error('Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
        <Button onClick={() => navigate(tableNumber ? `/?table=${encodeTableId(tableNumber)}` : '/')}>Back to Home</Button>
      </div>
    );
  }

  const handleAddToCart = (item: MenuItemType) => {
    const cartItem: CartItem = {
      ...item,
      quantity: 1,
      restaurantId: restaurant.id || restaurant._id,
      restaurantName: restaurant.name,
    };
    addToCart(cartItem);
    toast.success(`${item.name} added to cart!`);
    // Trigger storage event for navbar to update
    window.dispatchEvent(new Event('storage'));
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Restaurant Header */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={restaurant.image || '/placeholder-restaurant.jpg'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-restaurant.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
            <p className="text-white/90 mb-4">{restaurant.cuisine}</p>
            <div className="flex flex-wrap items-center gap-4 text-white">
              <div className="flex items-center gap-1 bg-success px-3 py-1 rounded">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{restaurant.rating || 'New'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{restaurant.deliveryTime || '30-40 min'}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address || 'Nearby'}</span>
              </div>
              <span>₹{restaurant.priceForTwo || 300} for two</span>
            </div>
            {restaurant.offer && (
              <div className="mt-4 inline-block bg-accent text-accent-foreground px-4 py-2 rounded-lg font-semibold">
                {restaurant.offer}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Menu</h2>

        {menuItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No menu items available at the moment.
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-semibold mb-6 pb-2 border-b">
                {category}
              </h3>
              <div className="space-y-4">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <MenuItem key={item.id || item._id} item={item} onAdd={handleAddToCart} />
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RestaurantDetails;
