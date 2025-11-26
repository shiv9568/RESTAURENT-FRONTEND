import { MenuItem } from '@/types';
import FoodCard from './FoodCard';
import { ChevronLeft, ChevronRight, TrendingUp, Star, Users, ChefHat } from 'lucide-react';
import { useState, useRef } from 'react';

interface RecommendationSectionProps {
    title: string;
    items: MenuItem[];
    icon?: 'trending' | 'star' | 'users' | 'chef';
    subtitle?: string;
}

const RecommendationSection = ({ title, items, icon, subtitle }: RecommendationSectionProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const getIcon = () => {
        switch (icon) {
            case 'trending':
                return <TrendingUp className="w-5 h-5" />;
            case 'star':
                return <Star className="w-5 h-5 fill-current" />;
            case 'users':
                return <Users className="w-5 h-5" />;
            case 'chef':
                return <ChefHat className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });

            setTimeout(checkScroll, 300);
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-primary">{getIcon()}</span>}
                        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                    </div>
                    {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`p-2 rounded-full border transition-all ${canScrollLeft
                                ? 'border-primary text-primary hover:bg-primary/10'
                                : 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={`p-2 rounded-full border transition-all ${canScrollRight
                                ? 'border-primary text-primary hover:bg-primary/10'
                                : 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-72">
                        <FoodCard item={item} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationSection;
