import { useState, useEffect } from 'react';
import { Table as TableType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, Plus, QrCode, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

const TableManagement = () => {
    const [tables, setTables] = useState<TableType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState('2');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<TableType | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await fetch(`${API_URL}/tables`);
            if (response.ok) {
                const data = await response.json();
                setTables(data);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            toast.error('Failed to fetch tables');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTable = async () => {
        if (!newTableNumber) {
            toast.error('Please enter a table number');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tables`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tableNumber: newTableNumber,
                    capacity: parseInt(newTableCapacity),
                }),
            });

            if (response.ok) {
                toast.success('Table added successfully');
                setNewTableNumber('');
                setNewTableCapacity('2');
                setIsAddDialogOpen(false);
                fetchTables();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to add table');
            }
        } catch (error) {
            console.error('Error adding table:', error);
            toast.error('Failed to add table');
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm('Are you sure you want to delete this table?')) return;

        try {
            const response = await fetch(`${API_URL}/tables/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Table deleted successfully');
                fetchTables();
            } else {
                toast.error('Failed to delete table');
            }
        } catch (error) {
            console.error('Error deleting table:', error);
            toast.error('Failed to delete table');
        }
    };

    const printQRCode = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && selectedTable) {
            const qrUrl = `http://192.168.1.110:8080/?table=${selectedTable.tableNumber}`;
            printWindow.document.write(`
        <html>
          <head>
            <title>Table ${selectedTable.tableNumber} QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #000;
                border-radius: 10px;
              }
              h1 { margin-bottom: 20px; }
              p { margin-top: 10px; font-size: 1.2rem; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>Table ${selectedTable.tableNumber}</h1>
              <div id="qr-code"></div>
              <p>Scan to Order</p>
            </div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <script>
              new QRCode(document.getElementById("qr-code"), {
                text: "${qrUrl}",
                width: 256,
                height: 256
              });
              setTimeout(() => window.print(), 500);
            </script>
          </body>
        </html>
      `);
            printWindow.document.close();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Table
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Table</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label htmlFor="tableNumber" className="text-sm font-medium">
                                    Table Number/Name
                                </label>
                                <Input
                                    id="tableNumber"
                                    placeholder="e.g. 1, A1, Patio 1"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="capacity" className="text-sm font-medium">
                                    Capacity
                                </label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    value={newTableCapacity}
                                    onChange={(e) => setNewTableCapacity(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddTable} className="w-full">
                                Add Table
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tables</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Table Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>QR Code</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tables.map((table) => (
                                    <TableRow key={table._id}>
                                        <TableCell className="font-medium">{table.tableNumber}</TableCell>
                                        <TableCell>{table.capacity}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${table.status === 'available' ? 'bg-green-100 text-green-800' :
                                                table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {table.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedTable(table)}>
                                                        <QrCode className="h-4 w-4 mr-2" /> View QR
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Table {table.tableNumber} QR Code</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                                                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                                                            <QRCode
                                                                value={`http://192.168.1.110:8080/?table=${table.tableNumber}`}
                                                                size={200}
                                                            />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground text-center">
                                                            Scan to order from Table {table.tableNumber}
                                                        </p>
                                                        <Button onClick={printQRCode} className="w-full">
                                                            <Printer className="mr-2 h-4 w-4" /> Print QR Code
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteTable(table._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {tables.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No tables found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TableManagement;
