import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
}

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = 16
}: StarRatingProps) {
    return (
        <div className="flex items-center space-x-1">
            {Array.from({ length: maxRating }).map((_, i) => (
                <Star
                    key={i}
                    size={size}
                    className={`cursor-pointer transition-colors ${i < rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                        } ${readonly ? 'cursor-default' : 'hover:scale-110'}`}
                    onClick={() => !readonly && onRatingChange?.(i + 1)}
                />
            ))}
        </div>
    );
}
