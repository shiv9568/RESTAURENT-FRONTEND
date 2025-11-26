import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI } from '@/utils/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Invoice() {
  const { orderId } = useParams();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!orderId) return;
        setLoading(true);
        const res = await orderAPI.getInvoice(orderId);
        setInvoice(res.data);
      } catch (e: any) {
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    if (!orderId) return;
    try {
      setEmailing(true);
      await orderAPI.emailReceipt(orderId);
      toast.success('Receipt emailed (mock)');
    } catch {
      toast.error('Failed to send receipt');
    } finally {
      setEmailing(false);
    }
  };

  const handleDownload = () => {
    if (!invoice) return;
    const { orderNumber, createdAt, customerName, customerEmail, customerPhone, deliveryAddress, paymentMethod, items, breakdown } = invoice;
    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Invoice ${orderNumber}</title>
      <style>
        body{font-family: Arial, sans-serif; padding:20px; color:#111}
        h1{margin:0 0 8px}
        .muted{color:#666;font-size:12px}
        .row{display:flex;justify-content:space-between;gap:24px}
        .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0}
        table{width:100%;border-collapse:collapse;font-size:14px}
        th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}
        .right{text-align:right}
      </style></head><body>
      <h1>Invoice</h1>
      <div class="row">
        <div>
          <div class="muted">Order Number</div>
          <div><strong>${orderNumber || ''}</strong></div>
          <div class="muted" style="margin-top:6px">Order Date</div>
          <div><strong>${createdAt ? new Date(createdAt).toLocaleString() : '-'}</strong></div>
        </div>
        <div class="right">
          <div class="muted">Billed To</div>
          <div><strong>${customerName || 'Customer'}</strong></div>
          <div>${customerEmail || ''}</div>
          <div>${customerPhone || ''}</div>
        </div>
      </div>
      <div class="card">
        <div class="muted">Delivery Address</div>
        <div>${deliveryAddress || ''}</div>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th class="right">Amount</th></tr>
          </thead>
          <tbody>
            ${(items || []).map((it: any) => `<tr><td>${it.name}</td><td>${it.quantity}</td><td>₹${it.price}</td><td class="right">₹${it.price * it.quantity}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="row">
        <div>
          <div class="muted">Payment Method</div>
          <div><strong>${String(paymentMethod || '').toUpperCase()}</strong></div>
        </div>
        <div class="right">
          <div>Subtotal: <strong>₹${breakdown?.subtotal || 0}</strong></div>
          <div>Delivery Fee: <strong>₹${breakdown?.deliveryFee || 0}</strong></div>
          <div>Platform Fee: <strong>₹${breakdown?.platformFee || 0}</strong></div>
          <div>Taxes: <strong>₹${breakdown?.taxes || 0}</strong></div>
          <div style="border-top:1px solid #eee;margin-top:6px;padding-top:6px">Total: <strong>₹${breakdown?.total || 0}</strong></div>
        </div>
      </div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderNumber || orderId}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="container mx-auto px-4 py-8">Invoice not found.</div>;
  }

  const { orderNumber, createdAt, customerName, customerEmail, customerPhone, deliveryAddress, paymentMethod, items, breakdown } = invoice;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoice</h1>
          <div className="space-x-2 hidden print:hidden">
            <Button variant="outline" onClick={handleEmail} disabled={emailing}>Email Receipt</Button>
            <Button variant="outline" onClick={handleDownload}>Download</Button>
            <Button onClick={handlePrint}>Download PDF</Button>
          </div>
        </div>

        <Card className="p-8 shadow-lg border-0 print:shadow-none print:border">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-8 mb-8">
            <div className="flex items-center gap-4">
              <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h1 className="text-2xl font-bold text-primary">D&G Restaurent</h1>
                <p className="text-sm text-muted-foreground">Delicious & Good</p>
                <p className="text-sm text-muted-foreground">Muzaffarnagar, UP</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest mb-2">Invoice</h2>
              <div className="text-sm text-muted-foreground">#{orderNumber}</div>
              <div className="text-sm font-medium mt-1">{createdAt ? new Date(createdAt).toLocaleDateString() : '-'}</div>
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Billed To</h3>
              <div className="font-semibold text-lg">{customerName || 'Customer'}</div>
              <div className="text-sm text-muted-foreground">{customerEmail}</div>
              <div className="text-sm text-muted-foreground">{customerPhone}</div>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Delivered To</h3>
              <div className="text-sm max-w-[200px] ml-auto">{deliveryAddress}</div>
              <div className="mt-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Method: </span>
                <span className="font-medium uppercase">{String(paymentMethod).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Description</th>
                  <th className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items?.map((it: any) => (
                  <tr key={(it.itemId || '') + it.name}>
                    <td className="py-4">
                      <div className="font-medium">{it.name}</div>
                      {it.selectedPortion && <div className="text-xs text-muted-foreground">Portion: {it.selectedPortion}</div>}
                    </td>
                    <td className="py-4 text-center">{it.quantity}</td>
                    <td className="py-4 text-right">₹{it.price}</td>
                    <td className="py-4 text-right font-medium">₹{it.price * it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end border-t pt-8">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{breakdown.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium">₹{breakdown.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium">₹{breakdown.platformFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes</span>
                <span className="font-medium">₹{breakdown.taxes}</span>
              </div>
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">₹{breakdown.total}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Thank you for your order!</p>
            <p>If you have any questions about this invoice, please contact support.</p>
          </div>
        </Card>

        <div className="print:hidden">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handlePrint} className="sm:w-auto w-full">Download PDF</Button>
            <Button variant="outline" onClick={handleDownload} className="sm:w-auto w-full">Download</Button>
            <Button variant="outline" onClick={handleEmail} disabled={emailing} className="sm:w-auto w-full">Email Receipt</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
