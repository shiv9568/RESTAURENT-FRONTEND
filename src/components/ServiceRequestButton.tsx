import { useState, useEffect } from 'react';
import { Bell, GlassWater, FileText, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { socket } from '@/utils/socket';
import { toast } from 'sonner';

export function ServiceRequestButton() {
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState(0);

    useEffect(() => {
        // Check for table number in localStorage
        const checkTable = () => {
            const table = localStorage.getItem('tableNumber');
            setTableNumber(table);
        };

        checkTable();
        window.addEventListener('storage', checkTable);
        // Also listen for custom event if we have one, or just rely on storage
        return () => window.removeEventListener('storage', checkTable);
    }, []);

    const handleRequest = (requestType: string, label: string) => {
        if (!tableNumber) return;

        // Rate limiting: prevent spamming (e.g., once every 30 seconds)
        const now = Date.now();
        if (now - lastRequestTime < 30000) {
            toast.error('Please wait a moment before sending another request.');
            return;
        }

        socket.emit('service_request', {
            tableNumber,
            requestType,
        });

        setLastRequestTime(now);
        setIsOpen(false);
        toast.success(`${label} request sent to staff!`);
    };

    if (!tableNumber) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground animate-in zoom-in duration-300"
                    >
                        <Bell className="h-6 w-6" />
                        <span className="sr-only">Call Waiter</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end" side="top">
                    <div className="grid gap-1">
                        <div className="font-medium text-center text-sm text-muted-foreground mb-2">
                            Table {tableNumber} Service
                        </div>
                        <Button
                            variant="ghost"
                            className="justify-start gap-2 h-10"
                            onClick={() => handleRequest('Call Waiter', 'Waiter')}
                        >
                            <User className="h-4 w-4" />
                            Call Waiter
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start gap-2 h-10"
                            onClick={() => handleRequest('Water', 'Water')}
                        >
                            <GlassWater className="h-4 w-4" />
                            Request Water
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start gap-2 h-10"
                            onClick={() => handleRequest('Bill', 'Bill')}
                        >
                            <FileText className="h-4 w-4" />
                            Request Bill
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start gap-2 h-10"
                            onClick={() => handleRequest('Clean Table', 'Cleaning')}
                        >
                            <Sparkles className="h-4 w-4" />
                            Clean Table
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
