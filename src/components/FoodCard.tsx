import { Star, ShoppingCart, Plus } from 'lucide-react';
import { MenuItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { addToCart } from '@/utils/cart';
import { toast } from 'sonner';
import { useState } from 'react';
import { LazyImage } from '@/components/LazyImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ReviewList } from '@/components/reviews/ReviewList';

interface FoodCardProps {
  item: MenuItem;
  restaurantId?: string;
  restaurantName?: string;
  isClosed?: boolean;
}

const FoodCard = ({ item, restaurantId = 'main', restaurantName = 'D&G Restaurent', isClosed = false }: FoodCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showPortionDialog, setShowPortionDialog] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedPortion, setSelectedPortion] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<number>(item.price);

  const hasPortions = item.portionSizes && item.portionSizes.length > 0;

  const handleAddToCart = (portionName?: string, portionPrice?: number) => {
    if (isClosed) {
      toast.warning('Restaurant is closed now. Please come back tomorrow.');
      return;
    }
    if (item.isAvailable === false) {
      toast.warning('This item is not available right now.');
      return;
    }

    setIsAdding(true);
    const cartItem: any = {
      ...item,
      quantity: 1,
      restaurantId,
      restaurantName,
      price: portionPrice || item.price,
      selectedPortion: portionName || undefined,
    };

    addToCart(cartItem);
    toast.success(`${item.name}${portionName ? ` (${portionName})` : ''} added to cart!`);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('cartUpdated'));
    setTimeout(() => setIsAdding(false), 500);
    setShowPortionDialog(false);
  };

  const handleAddClick = () => {
    // Check if restaurant is closed before opening dialog or adding
    if (isClosed) {
      toast.warning('Restaurant is closed now. Please come back when we\'re open!', {
        description: 'We can\'t accept orders right now.',
      });
      return;
    }

    if (item.isAvailable === false) {
      toast.warning('This item is not available right now.');
      return;
    }

    if (hasPortions) {
      setShowPortionDialog(true);
    } else {
      handleAddToCart();
    }
  };

  const handlePortionSelect = (portionName: string, portionPrice: number) => {
    setSelectedPortion(portionName);
    setSelectedPrice(portionPrice);
    handleAddToCart(portionName, portionPrice);
  };

  return (
    <>
      <Card className={`overflow-hidden hover:shadow-xl transition-all group ${isClosed || item.isAvailable === false ? 'grayscale' : ''}`}>
        <div className="relative h-44 overflow-hidden">
          <LazyImage
            src={item.image}
            alt={item.name}
            placeholder="/placeholder.svg"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {isClosed && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1.5 text-sm font-bold bg-red-500 text-white rounded-lg shadow-lg">
                🔒 Restaurant Closed
              </span>
            </div>
          )}
          {!isClosed && item.isAvailable === false && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="px-2 py-1 text-xs font-semibold bg-white/90 rounded">Not available now</span>
            </div>
          )}
          <Badge className="absolute top-2 right-2" variant={item.isVeg ? 'default' : 'destructive'}>{item.isVeg ? "Veg" : "Non-veg"}</Badge>
          {hasPortions && (
            <Badge className="absolute top-2 left-2 bg-blue-500 text-white">Multiple Sizes</Badge>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-lg truncate">{item.name}</h3>
            <div
              className="flex items-center text-green-500 cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setShowReviews(true);
              }}
            >
              <Star className="w-4 h-4 mr-1 fill-current" />
              {item.rating ? item.rating.toFixed(1) : 'New'}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2 truncate">{item.description || 'Delicious food item'}</p>
          <div className="flex items-center justify-between mt-2">
            {hasPortions ? (
              <div className="flex flex-col">
                <span className="font-bold text-xl text-foreground">₹{item.price}</span>
                <span className="text-xs text-muted-foreground">Starting from</span>
              </div>
            ) : (
              <span className="font-bold text-xl text-foreground">₹{item.price}</span>
            )}
            <Button
              onClick={handleAddClick}
              disabled={isAdding || item.isAvailable === false || isClosed}
              size="sm"
              className="flex items-center gap-1"
            >
              {isAdding ? <div className="w-3 h-3 border-t-2 border-primary rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reviews for {item.name}</DialogTitle>
          </DialogHeader>
          <ReviewList foodId={item.id} />
        </DialogContent>
      </Dialog>

      {/* Portion Size Selection Dialog */}
      <Dialog open={showPortionDialog} onOpenChange={setShowPortionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Portion Size</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 mb-4">
              <img src={item.image || '/placeholder.svg'} alt={item.name} className="w-16 h-16 rounded object-cover" />
              <div>
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {item.portionSizes?.map((portion, index) => (
                <button
                  key={index}
                  onClick={() => handlePortionSelect(portion.name, portion.price)}
                  className="w-full flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">🍽️</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{portion.name}</div>
                      <div className="text-sm text-muted-foreground">Perfect for your appetite</div>
                    </div>
                  </div>
                  <div className="font-bold text-lg text-primary">₹{portion.price}</div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPortionDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FoodCard;
