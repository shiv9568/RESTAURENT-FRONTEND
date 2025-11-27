import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Info, Trash2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { socket } from '@/utils/socket';
import { toast } from 'sonner';

interface Log {
    _id: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
    service: string;
    timestamp: string;
    resolved: boolean;
}

export default function SystemHealth() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/logs`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm("Are you sure you want to clear all logs?")) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/logs`, { method: 'DELETE' });
            setLogs([]);
            toast.success("Logs cleared");
        } catch (error) {
            toast.error("Failed to clear logs");
        }
    }

    const simulateFrontendError = () => {
        try {
            throw new Error("This is a simulated FRONTEND error!");
        } catch (error) {
            // We need to manually report it since we caught it, 
            // or we can let it bubble up if we weren't in an event handler.
            // For testing the global handler, we can use a setTimeout to throw outside the handler
            setTimeout(() => {
                throw new Error("This is a simulated FRONTEND error (Async)!");
            }, 100);
        }
    };

    const simulateBackendError = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/logs/test-error`);
            // The backend error will be broadcasted via socket
        } catch (error) {
            console.error("Error triggering backend error", error);
        }
    }

    useEffect(() => {
        fetchLogs();

        const handleSystemError = (log: Log) => {
            setLogs(prev => [log, ...prev]);
            toast.error(`System Error: ${log.message}`);
        };

        socket.on('system_error', handleSystemError);

        return () => {
            socket.off('system_error', handleSystemError);
        };
    }, []);

    const getIcon = (level: string) => {
        switch (level) {
            case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'warn': return <Info className="h-5 w-5 text-yellow-500" />;
            default: return <CheckCircle className="h-5 w-5 text-green-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={simulateFrontendError}>
                        Simulate Frontend Error
                    </Button>
                    <Button variant="outline" onClick={simulateBackendError}>
                        Simulate Backend Error
                    </Button>
                    <Button variant="destructive" onClick={clearLogs}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Logs
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {logs.filter(l => l.level === 'error').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            Operational
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log._id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                                    {getIcon(log.level)}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium leading-none">
                                                {log.message}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Service: {log.service}
                                        </p>
                                        {log.details && (
                                            <pre className="mt-2 w-full overflow-x-auto rounded bg-slate-950 p-2 text-xs text-slate-50">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    No logs found. System is running smoothly.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
