import { describe, it, expect } from 'vitest';

describe('Validation Utils', () => {
    describe('email validation', () => {
        it('should validate correct email formats', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@gmail.com'
            ];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            validEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(true);
            });
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'notanemail',
                '@example.com',
                'user@',
                'user @example.com'
            ];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            invalidEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(false);
            });
        });
    });

    describe('price formatting', () => {
        it('should format prices correctly', () => {
            const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

            expect(formatPrice(100)).toBe('₹100.00');
            expect(formatPrice(99.5)).toBe('₹99.50');
            expect(formatPrice(0)).toBe('₹0.00');
        });
    });

    describe('order status', () => {
        it('should validate order statuses', () => {
            const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

            expect(validStatuses).toContain('pending');
            expect(validStatuses).toContain('confirmed');
            expect(validStatuses).not.toContain('invalid');
        });
    });

    describe('phone number validation', () => {
        it('should validate Indian phone numbers', () => {
            const phoneRegex = /^[6-9]\d{9}$/;

            expect(phoneRegex.test('9876543210')).toBe(true);
            expect(phoneRegex.test('8765432109')).toBe(true);
            expect(phoneRegex.test('12345')).toBe(false);
            expect(phoneRegex.test('1234567890')).toBe(false);
        });
    });
});
