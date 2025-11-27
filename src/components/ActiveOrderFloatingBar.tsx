
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, ChevronRight, X, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { orderAPI } from '@/utils/api';
import { encodeTableId } from '@/utils/tableId';

interface OrderSummary {
    _id: string;
    id?: string; // fallback
    status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
    total: number;
    items: any[];
    orderNumber?: string;
    createdAt?: string;
}

const getBackendUserId = (): string | null => {
    try {
        const raw = window.localStorage.getItem('user');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?._id || parsed?.id || null;
    } catch {
        return null;
    }
};

export const ActiveOrderFloatingBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeOrder, setActiveOrder] = useState<OrderSummary | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Don't show on the order tracking page itself to avoid redundancy
    const isTrackingPage = location.pathname.includes('/order-tracking');

    useEffect(() => {
        const checkActiveOrders = async () => {
            try {
                const tableNumber = localStorage.getItem('tableNumber');
                const activeStatuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery'];

                // 1. Check Local Storage (Guest & Recent Local Orders)
                let localCandidate: OrderSummary | null = null;
                const ordersKey = tableNumber ? `foodie_orders_${tableNumber}` : 'foodie_orders';
                const localOrdersRaw = localStorage.getItem(ordersKey);

                if (localOrdersRaw) {
                    const localOrders = JSON.parse(localOrdersRaw);
                    if (Array.isArray(localOrders) && localOrders.length > 0) {
                        const reversedOrders = [...localOrders].reverse();
                        localCandidate = reversedOrders.find((o: any) =>
                            activeStatuses.includes(o.status)
                        ) || null;
                    }
                }

                // 2. Check Server (Logged-in User)
                let serverCandidate: OrderSummary | null = null;
                const userId = getBackendUserId();
                if (userId) {
                    try {
                        const res = await orderAPI.getAll();
                        if (res.data && Array.isArray(res.data)) {
                            // Filter for user's active orders
                            const userOrders = res.data.filter((o: any) => o.userId === userId && activeStatuses.includes(o.status));
                            // Sort by date descending
                            userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            if (userOrders.length > 0) {
                                serverCandidate = userOrders[0];
                            }
                        }
                    } catch (err) {
                        // Ignore server error, fallback to local
                    }
                }

                // 3. Determine Best Candidate
                let finalOrder = serverCandidate || localCandidate;

                // If we have a local candidate, we should verify its status from API if possible
                if (!serverCandidate && localCandidate) {
                    const orderId = localCandidate._id || localCandidate.id;
                    if (orderId) {
                        try {
                            const res = await orderAPI.getById(orderId);
                            const serverOrder = res.data;
                            if (activeStatuses.includes(serverOrder.status)) {
                                finalOrder = serverOrder;
                            } else {
                                finalOrder = null; // It's actually delivered/cancelled
                            }
                        } catch {
                            // Keep local candidate if API fails
                            finalOrder = localCandidate;
                        }
                    }
                }

                setActiveOrder(finalOrder);

            } catch (error) {
                console.error("Error checking active orders:", error);
            }
        };

        // Check immediately
        checkActiveOrders();

        // Poll every 10 seconds
        const interval = setInterval(checkActiveOrders, 10000);

        return () => clearInterval(interval);
    }, [location.pathname]);

    if (!activeOrder || isTrackingPage) return null;

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Order Placed', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' };
            case 'confirmed': return { label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100' };
            case 'preparing': return { label: 'Preparing', icon: Package, color: 'text-purple-500', bg: 'bg-purple-100' };
            case 'out-for-delivery': return { label: 'Out for Delivery', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-100' };
            default: return { label: 'Processing', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
        }
    };

    const statusInfo = getStatusInfo(activeOrder.status);
    const StatusIcon = statusInfo.icon;
    const tableNumber = localStorage.getItem('tableNumber');

    const handleViewOrder = () => {
        const orderId = activeOrder._id || activeOrder.id;
        navigate(`/order-tracking/${orderId}${tableNumber ? `?table=${encodeTableId(tableNumber)}` : ''}`);
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[100]">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground animate-in zoom-in duration-300 relative"
                    onClick={() => setIsMinimized(false)}
                >
                    <StatusIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                    <span className="sr-only">View Active Order</span>
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100]">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewOrder}>
                {/* Progress Bar Background (Optional, maybe for later) */}

                <div className={`p-3 rounded-full ${statusInfo.bg} flex-shrink-0`}>
                    <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 truncate">
                        {statusInfo.label}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                        {activeOrder.items?.map((i: any) => i.name).join(', ')}
                    </p>
                    <p className="text-xs font-medium text-primary mt-0.5">
                        Total: ₹{activeOrder.total}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        className="rounded-full px-4 h-8 text-xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder();
                        }}
                    >
                        Track
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
