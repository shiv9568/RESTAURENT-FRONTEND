import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table } from '@/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TableSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tableNumber: string) => void;
}

export function TableSelectionDialog({ isOpen, onClose, onSelect }: TableSelectionDialogProps) {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualTable, setManualTable] = useState('');
    const [error, setError] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'https://restaurent-server-cgxr.onrender.com/api';

    useEffect(() => {
        if (isOpen) {
            fetchTables();
        }
    }, [isOpen]);

    const fetchTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/tables`);
            if (response.ok) {
                const data = await response.json();
                // Filter only available tables if needed, but user might want to select an occupied one if they are sitting there?
                // Usually users select their table when they sit down.
                // Let's show all tables but maybe mark status.
                setTables(data);
            } else {
                setError('Failed to load tables');
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
            setError('Failed to load tables');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualTable.trim()) {
            onSelect(manualTable.trim());
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Your Table</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Registered Tables List */}
                    <div>
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Select from available tables:</h3>
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-500 text-sm py-2">{error}</div>
                        ) : tables.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-2">No tables registered</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                                {tables.map((table) => (
                                    <Button
                                        key={table._id}
                                        variant="outline"
                                        className={`h-auto py-3 flex flex-col gap-1 ${table.status === 'occupied' ? 'border-red-200 bg-red-50 hover:bg-red-100' :
                                                table.status === 'reserved' ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' :
                                                    'hover:border-primary hover:bg-primary/5'
                                            }`}
                                        onClick={() => {
                                            onSelect(table.tableNumber);
                                            onClose();
                                        }}
                                    >
                                        <span className="font-bold text-lg">{table.tableNumber}</span>
                                        <span className="text-[10px] uppercase text-muted-foreground">{table.status}</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or type manually</span>
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <Input
                            placeholder="Enter table number"
                            value={manualTable}
                            onChange={(e) => setManualTable(e.target.value)}
                        />
                        <Button type="submit" disabled={!manualTable.trim()}>
                            Confirm
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
