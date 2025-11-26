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
    onSelect: (tableNumber: string, userName: string) => void;
}

export function TableSelectionDialog({ isOpen, onClose, onSelect, initialUserName = '', preselectedTable }: TableSelectionDialogProps & { initialUserName?: string, preselectedTable?: string | null }) {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualTable, setManualTable] = useState('');
    const [userName, setUserName] = useState(initialUserName);
    const [error, setError] = useState<string | null>(null);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'https://restaurent-server-cgxr.onrender.com/api';

    useEffect(() => {
        if (isOpen) {
            setUserName(initialUserName);
            if (preselectedTable) {
                setSelectedTable(preselectedTable);
                setManualTable('');
            } else {
                fetchTables();
                setSelectedTable(null);
                setManualTable('');
            }
        }
    }, [isOpen, initialUserName, preselectedTable]);

    const fetchTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/tables`);
            if (response.ok) {
                const data = await response.json();
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

    const handleConfirm = () => {
        const table = preselectedTable || selectedTable || manualTable.trim();

        if (!table) {
            toast.error('Please select or enter a table number');
            return;
        }

        if (!userName.trim()) {
            toast.error('Please enter your name');
            return;
        }

        onSelect(table, userName.trim());
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                // If trying to close (open=false) and we have a preselected table but no name, prevent closing
                if (!open && preselectedTable && !userName.trim()) {
                    return;
                }
                onClose();
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {preselectedTable ? `Welcome to Table ${preselectedTable}` : 'Dine-in Details'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Name Input */}
                    <div className="space-y-2">
                        <label htmlFor="userName" className="text-sm font-medium">
                            Your Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="userName"
                            placeholder="Enter your full name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {!preselectedTable && (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Select Table</span>
                                </div>
                            </div>

                            {/* Registered Tables List */}
                            <div>
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
                                                variant={selectedTable === table.tableNumber ? "default" : "outline"}
                                                className={`h-auto py-3 flex flex-col gap-1 ${selectedTable === table.tableNumber ? 'ring-2 ring-primary ring-offset-2' : ''
                                                    } ${table.status === 'occupied' && selectedTable !== table.tableNumber ? 'border-red-200 bg-red-50 hover:bg-red-100' :
                                                        table.status === 'reserved' && selectedTable !== table.tableNumber ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' :
                                                            ''
                                                    }`}
                                                onClick={() => {
                                                    setSelectedTable(table.tableNumber);
                                                    setManualTable('');
                                                }}
                                            >
                                                <span className="font-bold text-lg">{table.tableNumber}</span>
                                                <span className="text-[10px] uppercase opacity-70">{table.status}</span>
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
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter table number"
                                    value={manualTable}
                                    onChange={(e) => {
                                        setManualTable(e.target.value);
                                        if (e.target.value) setSelectedTable(null);
                                    }}
                                />
                            </div>
                        </>
                    )}

                    <Button onClick={handleConfirm} className="w-full" size="lg">
                        {preselectedTable ? 'Confirm & Start Ordering' : 'Start Ordering'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
