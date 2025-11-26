import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminOrder } from '@/types';
import { adminOrdersService } from '@/utils/adminService';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Trash2, Search, Phone, Eye, CheckCircle } from 'lucide-react';

export default function OrdersManagement() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showItemsDialog, setShowItemsDialog] = useState(false);

  useEffect(() => {
    loadOrders();

    const handleAdminChange = (e: any) => {
      if (e.detail?.type === 'orders') {
        console.log('Real-time update received, reloading orders...');
        loadOrders();
      }
    };

    window.addEventListener('adminDataChanged', handleAdminChange);
    return () => window.removeEventListener('adminDataChanged', handleAdminChange);
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await adminOrdersService.getAll();
      setOrders(data);
      if (data.length === 0) {
        toast.info('No orders found. Orders will appear here once customers place them.');
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const [cancellationDialog, setCancellationDialog] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null,
  });
  const [cancellationReason, setCancellationReason] = useState('');

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === 'cancelled') {
      setCancellationDialog({ isOpen: true, orderId });
      return;
    }

    try {
      await adminOrdersService.updateStatus(orderId, newStatus);
      toast.success('Order status updated');
      await loadOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancellationDialog.orderId) return;

    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      await adminOrdersService.updateStatus(cancellationDialog.orderId, 'cancelled', cancellationReason);
      toast.success('Order cancelled successfully');
      setCancellationDialog({ isOpen: false, orderId: null });
      setCancellationReason('');
      await loadOrders();
    } catch (error: any) {
      toast.error('Failed to cancel order: ' + (error.message || 'Unknown error'));
    }
  };

  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      const result = await adminOrdersService.clearAll();
      toast.success(`All orders cleared successfully! (${result.deletedCount} orders deleted)`);
      await loadOrders();
    } catch (error: any) {
      toast.error('Failed to clear orders: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirm = async (orderId: string, orderNumber: string) => {
    try {
      await adminOrdersService.updatePaymentStatus(orderId, 'completed');
      toast.success(`Cash received confirmed for ${orderNumber}`);
      await loadOrders();
    } catch (error: any) {
      toast.error('Failed to update payment status: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'out-for-delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const showItemsModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowItemsDialog(true);
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOrders}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isLoading || orders.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all {orders.length} orders
                        from the database and local storage.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Clear All Orders
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order ID, name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No orders found.{' '}
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Orders will appear here once customers place them.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <div className="p-4 md:p-6">
                    {/* Order Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">#{order.orderNumber || order.id?.slice(-6)}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.orderedAt ? new Date(order.orderedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ₹{order.total}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">{order.customerName || 'N/A'}</p>
                        {order.customerPhone && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">{order.customerPhone}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => window.location.href = `tel:${order.customerPhone}`}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivery Address</p>
                        <p className="text-sm font-medium">{order.deliveryAddress || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-800 mb-1">📝 Special Instructions</p>
                        <p className="text-sm text-yellow-700">{order.notes}</p>
                      </div>
                    )}

                    {/* Items  */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Items</p>
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-1">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                <strong>{item.name || 'Item'}</strong>
                                {(item as any).selectedPortion && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    {(item as any).selectedPortion}
                                  </span>
                                )}
                                {' '}× {item.quantity}
                              </span>
                              <span className="text-gray-600">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No items</span>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      <Badge variant={order.paymentMethod === 'cash' ? 'secondary' : 'default'}>
                        {order.paymentMethod === 'cash' ? '💵 COD' : (order.paymentMethod === 'online' ? '💳 Online' : '💳 Card/UPI')}
                      </Badge>
                      {order.paymentStatus === 'completed' ? (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <>
                          {order.paymentMethod === 'cash' && order.status === 'delivered' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handlePaymentConfirm(order.id, order.orderNumber || order.id)}
                            >
                              Confirm Cash Received
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {order.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleStatusChange(order.id, 'confirmed')}>
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Reason Dialog */}
      <Dialog
        open={cancellationDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancellationDialog({ isOpen: false, orderId: null });
            setCancellationReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for cancelling this order. This will be visible to the customer.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cancellation Reason</label>
              <Input
                placeholder="e.g., Item out of stock, Kitchen closed, etc."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCancellationDialog({ isOpen: false, orderId: null });
                  setCancellationReason('');
                }}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancellation}
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
