import { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import api from '@/utils/api';

interface Review {
    _id: string;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

interface ReviewListProps {
    foodId: string;
}

export function ReviewList({ foodId }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchReviews();
    }, [foodId]);

    const fetchReviews = async () => {
        try {
            const response = await api.get(`/reviews/${foodId}`);
            setReviews(response.data);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0) {
            toast.error('Please select a rating');
            return;
        }
        if (!newComment.trim()) {
            toast.error('Please write a comment');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/reviews', {
                foodItem: foodId,
                rating: newRating,
                comment: newComment
            });

            setReviews([response.data, ...reviews]);
            setNewRating(0);
            setNewComment('');
            toast.success('Review submitted successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading reviews...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>

            {user ? (
                <form onSubmit={handleSubmit} className="space-y-4 bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm">Write a review</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <StarRating rating={newRating} onRatingChange={setNewRating} size={20} />
                    </div>
                    <Textarea
                        placeholder="Share your experience..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <Button type="submit" disabled={submitting || newRating === 0 || !newComment.trim()}>
                        {submitting ? 'Submitting...' : 'Post Review'}
                    </Button>
                </form>
            ) : (
                <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground">
                    Please login to write a review.
                </div>
            )}

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="border-b pb-4 last:border-0">
                            <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={review.user.avatar} />
                                    <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{review.user.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <StarRating rating={review.rating} readonly size={12} />
                                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
