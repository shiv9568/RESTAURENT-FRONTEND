import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Leaf, Drumstick, Menu, ChevronRight } from 'lucide-react';
import { categoriesAPI, foodItemsAPI } from '@/utils/apiService';
import FoodCard from '@/components/FoodCard';
import RecommendationSection from '@/components/RecommendationSection';
import { MenuItem } from '@/types';
import { restaurantBrandAPI } from '@/utils/api';
import {
  getPopularItems,
  getChefsSpecial,
  getTrendingThisWeek
} from '@/utils/recommendations';
import { FoodGridSkeleton, CategorySkeleton } from '@/components/skeletons/FoodSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

const UserHome: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState({ category: 'all', vegOnly: false, search: '' });
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState<MenuItem[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [chefsSpecial, setChefsSpecial] = useState<MenuItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<MenuItem[]>([]);
  const { t } = useTranslation();

  // Debounced search
  const debouncedSearch = useDebounce(filter.search, 300);

  useEffect(() => {
    fetchData();
    (async () => {
      try {
        const res = await restaurantBrandAPI.get();
        setBrand(res.data || null);
      } catch { }
    })();

    // Listen for live brand updates (e.g., isClosed toggled in admin)
    const onBrandUpdated = (e: any) => {
      const detail = e?.detail || {};
      setBrand((prev: any) => ({ ...(prev || {}), ...detail }));
    };
    window.addEventListener('brandUpdated', onBrandUpdated as any);

    // Generic admin changes: refetch categories/featured items quickly
    const onAdminChange = () => {
      fetchData();
    };
    window.addEventListener('adminDataChanged', onAdminChange as any);

    // Cross-tab sync via localStorage 'storage' event
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'brand_isClosed') {
        const value = e.newValue ? JSON.parse(e.newValue) : false;
        setBrand((prev: any) => ({ ...(prev || {}), isClosed: value }));
      } else if (e.key === 'admin_change') {
        fetchData();
      }
    };
    window.addEventListener('storage', onStorage);

    // Also pick up current value if it exists
    try {
      const existing = localStorage.getItem('brand_isClosed');
      if (existing != null) {
        const value = JSON.parse(existing);
        setBrand((prev: any) => ({ ...(prev || {}), isClosed: value }));
      }
    } catch { }

    return () => {
      window.removeEventListener('brandUpdated', onBrandUpdated as any);
      window.removeEventListener('adminDataChanged', onAdminChange as any);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    let items = [...allItems];
    if (filter.vegOnly) items = items.filter(x => x.isVeg);
    if (filter.category !== 'all') items = items.filter(x => x.category === filter.category);

    // Use debounced search term for filtering
    if (debouncedSearch) {
      items = items.filter(x =>
        x.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    setVisibleItems(items);
  }, [allItems, filter.category, filter.vegOnly, debouncedSearch]);

  const fetchData = async () => {
    setLoading(true);
    // Simulate a small delay to show skeletons (optional, remove in production if not needed)
    // await new Promise(resolve => setTimeout(resolve, 1000)); 

    const [catRes, foodRes] = await Promise.all([
      categoriesAPI.getAll({ displayOnHomepage: true }),
      foodItemsAPI.getAll({ displayOnHomepage: true })
    ]);
    const items = foodRes.data || [];
    setCategories(catRes.data || []);
    setAllItems(items);

    // Calculate recommendations
    const orders = JSON.parse(localStorage.getItem('foodie_orders') || '[]');
    setPopularItems(getPopularItems(items));
    setChefsSpecial(getChefsSpecial(items));
    setTrendingItems(getTrendingThisWeek(items, orders));

    setLoading(false);
  };

  const scrollToItem = (itemId: string) => {
    const element = document.getElementById(`item-${itemId}`);
    if (element) {
      // Offset for sticky header (approx 120px)
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Filters row (inside page, not a navbar) */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="hidden md:flex items-center gap-3">
            {brand?.logo && <img src={brand.logo} alt="logo" className="w-8 h-8 rounded" />}
            {brand?.name && <div className="font-bold text-xl text-foreground">{brand.name}</div>}
            {brand?.openTime && brand?.closeTime && (
              <div className="text-sm text-muted-foreground">Open {brand.openTime} - {brand.closeTime}</div>
            )}
          </div>
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('home.search_placeholder')}
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={filter.vegOnly ? 'default' : 'outline'} onClick={() => setFilter(f => ({ ...f, vegOnly: !f.vegOnly }))}>
              <Leaf className={filter.vegOnly ? 'text-green-600' : 'text-muted-foreground'} /> {t('home.veg_only')}
            </Button>
          </div>
        </div>
      </div>

      {/* CategoryBar */}
      {loading ? (
        <CategorySkeleton />
      ) : (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mt-0 w-full">
          <div className="flex items-center px-4 py-3 gap-3">
            {/* Quick Menu Button (Mobile/Tablet only) */}
            <div className="lg:hidden flex-shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Menu Items</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {visibleItems.map(item => (
                      <SheetClose key={item.id} asChild>
                        <div
                          onClick={() => scrollToItem(item.id)}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer border border-transparent hover:border-border transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                            )}
                            <span className="truncate text-sm font-medium">{item.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </SheetClose>
                    ))}
                    {visibleItems.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">No items found</p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Scrollable Categories */}
            <div
              className="flex gap-3 overflow-x-auto w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <Button
                variant={filter.category === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter(f => ({ ...f, category: 'all' }))}
                className="whitespace-nowrap flex-shrink-0 rounded-full h-9"
              >
                {t('home.all')}
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={filter.category === cat.name ? 'default' : 'outline'}
                  onClick={() => setFilter(f => ({ ...f, category: cat.name }))}
                  className="whitespace-nowrap flex-shrink-0 rounded-full h-9"
                >
                  {cat.icon || <Drumstick className="w-4 h-4 mr-2" />} {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Food Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <FoodGridSkeleton />
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground font-bold text-xl">{t('home.no_items')}</div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${brand?.isClosed ? 'grayscale' : ''}`}>
            {visibleItems.map(item => (
              <div key={item.id} id={`item-${item.id}`} className="scroll-mt-32">
                <FoodCard item={item} isClosed={!!brand?.isClosed} />
              </div>
            ))}
          </div>
        )}

        {/* Recommendation Sections - Show only when no filters active */}
        {!loading && filter.category === 'all' && !filter.vegOnly && !filter.search && (
          <div className="mt-12">
            <RecommendationSection
              title={t('home.trending')}
              subtitle="Most ordered items in the last 7 days"
              items={trendingItems}
              icon="trending"
            />

            <RecommendationSection
              title={t('home.popular')}
              subtitle="Customer favorites"
              items={popularItems}
              icon="users"
            />

            <RecommendationSection
              title={t('home.chefs_special')}
              subtitle="Handpicked by our chef"
              items={chefsSpecial}
              icon="chef"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHome;
