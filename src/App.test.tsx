import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the socket module
vi.mock('@/utils/socket', () => ({
    socket: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        connected: false,
    },
    initSocket: vi.fn(),
}));

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Since App has routing and complex providers, we might just check if it renders something basic or doesn't throw
        // For a basic check, we can look for a known element text if possible, or just expect truthy
        expect(true).toBeTruthy();
    });
});
