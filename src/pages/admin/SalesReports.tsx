import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    CheckCircle,
    XCircle,
    Loader2,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

interface DailySale {
    date: string;
    totalOrders: number;
    totalRevenue: number;
    deliveredOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    averageOrderValue: number;
}

interface TodayStats {
    totalOrders: number;
    totalRevenue: number;
    deliveredOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
}

export default function SalesReports() {
    const [dailySales, setDailySales] = useState<DailySale[]>([]);
    const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Set default dates - last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);

        loadReports();
        loadTodayStats();
    }, []);

    const loadReports = async (customStart?: string, customEnd?: string) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (customStart || startDate) params.append('startDate', customStart || startDate);
            if (customEnd || endDate) params.append('endDate', customEnd || endDate);

            const response = await api.get(`/reports/daily-sales?${params.toString()}`);
            setDailySales(response.data);
        } catch (error: any) {
            toast.error('Failed to load sales reports');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTodayStats = async () => {
        try {
            const response = await api.get('/reports/today');
            setTodayStats(response.data);
        } catch (error) {
            console.error('Failed to load today stats:', error);
        }
    };

    const handleDateChange = () => {
        if (startDate && endDate) {
            loadReports(startDate, endDate);
        }
    };

    const exportToCSV = () => {
        if (dailySales.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Date', 'Total Orders', 'Revenue', 'Delivered', 'Cancelled', 'Pending', 'Avg Order Value'];
        const rows = dailySales.map(sale => [
            sale.date,
            sale.totalOrders,
            sale.totalRevenue,
            sale.deliveredOrders,
            sale.cancelledOrders,
            sale.pendingOrders,
            sale.averageOrderValue.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${startDate}-to-${endDate}.csv`;
        a.click();
        toast.success('Report exported successfully!');
    };

    const calculateTotals = () => {
        return dailySales.reduce((acc, sale) => ({
            totalOrders: acc.totalOrders + sale.totalOrders,
            totalRevenue: acc.totalRevenue + sale.totalRevenue,
            deliveredOrders: acc.deliveredOrders + sale.deliveredOrders,
            cancelledOrders: acc.cancelledOrders + sale.cancelledOrders,
        }), { totalOrders: 0, totalRevenue: 0, deliveredOrders: 0, cancelledOrders: 0 });
    };

    const totals = calculateTotals();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
                <p className="text-gray-600">Track your daily sales and revenue</p>
            </div>

            {/* Today's Stats */}
            {todayStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{todayStats.totalOrders}</div>
                            <p className="text-xs text-muted-foreground">Total orders today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{todayStats.totalRevenue}</div>
                            <p className="text-xs text-muted-foreground">From delivered orders</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{todayStats.deliveredOrders}</div>
                            <p className="text-xs text-muted-foreground">Completed today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <TrendingUp className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{todayStats.pendingOrders}</div>
                            <p className="text-xs text-muted-foreground">In progress</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{todayStats.cancelledOrders}</div>
                            <p className="text-xs text-muted-foreground">Today</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Date Range Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Filter by Date Range
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleDateChange} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Apply Filter
                        </Button>
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Period Totals */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{totals.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{totals.deliveredOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{totals.cancelledOrders}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : dailySales.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No sales data found for the selected period
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-semibold">Date</th>
                                        <th className="text-right p-3 font-semibold">Orders</th>
                                        <th className="text-right p-3 font-semibold">Revenue</th>
                                        <th className="text-right p-3 font-semibold">Delivered</th>
                                        <th className="text-right p-3 font-semibold">Cancelled</th>
                                        <th className="text-right p-3 font-semibold">Pending</th>
                                        <th className="text-right p-3 font-semibold">Avg Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailySales.map((sale) => (
                                        <tr key={sale.date} className="border-b hover:bg-muted/50">
                                            <td className="p-3 font-medium">
                                                {new Date(sale.date).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="text-right p-3">{sale.totalOrders}</td>
                                            <td className="text-right p-3 font-semibold text-green-600">
                                                ₹{sale.totalRevenue.toLocaleString()}
                                            </td>
                                            <td className="text-right p-3 text-green-600">{sale.deliveredOrders}</td>
                                            <td className="text-right p-3 text-red-600">{sale.cancelledOrders}</td>
                                            <td className="text-right p-3 text-yellow-600">{sale.pendingOrders}</td>
                                            <td className="text-right p-3">₹{sale.averageOrderValue.toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
