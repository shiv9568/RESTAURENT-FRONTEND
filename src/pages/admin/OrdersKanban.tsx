import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminOrder } from '@/types';
import { adminOrdersService } from '@/utils/adminService';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Clock, DollarSign, User, MapPin } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const ORDER_STATUSES = [
    { id: 'pending', label: 'Pending', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 border-blue-300' },
    { id: 'preparing', label: 'Preparing', color: 'bg-purple-100 border-purple-300' },
    { id: 'out-for-delivery', label: 'Out for Delivery', color: 'bg-orange-100 border-orange-300' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-100 border-green-300' },
];

export default function OrdersKanban() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrders();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
        try {
            const data = await adminOrdersService.getAll();
            setOrders(data);
        } catch (error: any) {
            console.error('Error loading orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // Dropped in the same position
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;
        const orderId = draggableId;

        try {
            // Optimistically update UI
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: newStatus as any } : order
                )
            );

            // Update on server
            await adminOrdersService.updateStatus(orderId, newStatus);
            toast.success(`Order moved to ${ORDER_STATUSES.find(s => s.id === newStatus)?.label}`);
        } catch (error) {
            toast.error('Failed to update order status');
            // Revert on error
            loadOrders();
        }
    };

    const getOrdersByStatus = (status: string) => {
        return orders.filter(order => order.status === status);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getTimeSinceOrder = (dateString: string) => {
        const now = new Date();
        const orderTime = new Date(dateString);
        const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / 60000);

        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours}h ago`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders Board</h1>
                    <p className="text-gray-600">Drag and drop orders to update their status</p>
                </div>
                <Button onClick={loadOrders} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {ORDER_STATUSES.map((status) => {
                        const statusOrders = getOrdersByStatus(status.id);

                        return (
                            <div key={status.id} className="flex flex-col">
                                <Card className={`${status.color} border-2`}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                            <span>{status.label}</span>
                                            <Badge variant="secondary" className="ml-2">
                                                {statusOrders.length}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                </Card>

                                <Droppable droppableId={status.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 mt-2 p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-transparent'
                                                }`}
                                            style={{ minHeight: '500px' }}
                                        >
                                            {statusOrders.map((order, index) => (
                                                <Draggable
                                                    key={order.id}
                                                    draggableId={order.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`mb-3 cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                                                                }`}
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="space-y-2">
                                                                    {/* Order Number */}
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-bold text-sm">
                                                                            {order.orderNumber || `#${order.id.slice(-6)}`}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {getTimeSinceOrder(order.orderedAt || order.createdAt)}
                                                                        </span>
                                                                    </div>

                                                                    {/* Customer */}
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                                        <span className="truncate">{order.customerName || 'Guest'}</span>
                                                                    </div>

                                                                    {/* Address/Table */}
                                                                    {order.orderType === 'dine-in' ? (
                                                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                                                            <span>🍽️</span>
                                                                            <span>Table {order.tableNumber}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            <MapPin className="w-3 h-3" />
                                                                            <span className="truncate">{order.deliveryAddress?.substring(0, 30)}...</span>
                                                                        </div>
                                                                    )}

                                                                    {/* Items */}
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {order.items?.length || 0} items
                                                                    </div>

                                                                    {/* Total & Payment */}
                                                                    <div className="flex items-center justify-between pt-2 border-t">
                                                                        <div className="flex items-center gap-1">
                                                                            <DollarSign className="w-4 h-4" />
                                                                            <span className="font-bold">₹{order.total}</span>
                                                                        </div>
                                                                        <Badge variant={order.paymentMethod === 'cash' ? 'secondary' : 'default'} className="text-xs">
                                                                            {order.paymentMethod === 'cash' ? '💵' : '💳'}
                                                                        </Badge>
                                                                    </div>

                                                                    {/* Time */}
                                                                    <div className="text-xs text-muted-foreground text-center">
                                                                        {formatTime(order.orderedAt || order.createdAt)}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {statusOrders.length === 0 && (
                                                <div className="text-center text-muted-foreground text-sm py-8">
                                                    No orders
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
