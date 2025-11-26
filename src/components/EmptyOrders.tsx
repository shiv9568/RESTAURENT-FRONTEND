import { Package } from 'lucide-react';

export function EmptyOrders() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-orange-500/20 to-orange-500/5 p-8 rounded-full">
                    <Package className="w-24 h-24 text-orange-500" strokeWidth={1.5} />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
                You haven't placed any orders yet. When you do, they'll appear here.
            </p>
        </div>
    );
}
