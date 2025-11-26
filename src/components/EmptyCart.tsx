import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function EmptyCart() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-full">
                    <ShoppingCart className="w-24 h-24 text-primary" strokeWidth={1.5} />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
                Looks like you haven't added anything to your cart yet.
                Start exploring our delicious menu!
            </p>

            <Button
                size="lg"
                onClick={() => navigate('/')}
                className="gap-2"
            >
                <ShoppingCart className="w-5 h-5" />
                Start Shopping
            </Button>
        </div>
    );
}
