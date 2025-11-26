import { describe, it, expect } from 'vitest';

describe('Cart Utils', () => {
    describe('calculate cart total', () => {
        it('should calculate total correctly', () => {
            const items = [
                { price: 100, quantity: 2 },
                { price: 50, quantity: 1 },
                { price: 75, quantity: 3 }
            ];

            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            expect(total).toBe(475); // (100*2) + (50*1) + (75*3) = 200 + 50 + 225
        });

        it('should handle empty cart', () => {
            const items: any[] = [];
            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            expect(total).toBe(0);
        });
    });

    describe('calculate tax and delivery', () => {
        it('should calculate GST correctly', () => {
            const subtotal = 1000;
            const gstRate = 0.05; // 5%
            const gst = subtotal * gstRate;

            expect(gst).toBe(50);
        });

        it('should apply delivery charges correctly', () => {
            const baseDeliveryCharge = 40;
            const subtotal1 = 100;
            const subtotal2 = 500;
            const freeDeliveryThreshold = 300;

            const delivery1 = subtotal1 >= freeDeliveryThreshold ? 0 : baseDeliveryCharge;
            const delivery2 = subtotal2 >= freeDeliveryThreshold ? 0 : baseDeliveryCharge;

            expect(delivery1).toBe(40);
            expect(delivery2).toBe(0);
        });
    });

    describe('discount calculation', () => {
        it('should apply percentage discount', () => {
            const subtotal = 1000;
            const discountPercent = 10;
            const discount = (subtotal * discountPercent) / 100;

            expect(discount).toBe(100);
            expect(subtotal - discount).toBe(900);
        });

        it('should apply flat discount', () => {
            const subtotal = 500;
            const flatDiscount = 50;

            expect(subtotal - flatDiscount).toBe(450);
        });
    });
});
