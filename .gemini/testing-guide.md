# Testing Guide for Developers

## Quick Start

### Frontend Tests
```bash
# Watch mode (automatically reruns on file changes)
npm test

# Run once (for CI/CD)
npm test -- --run
```

### Backend Tests
```bash
cd server
npm test
```

## Writing New Tests

### Frontend Test Example (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Some Text')).toBeInTheDocument();
  });
});
```

### Backend Test Example (Jest)

```typescript
describe('API Endpoint', () => {
  it('should validate input', () => {
    const validInput = 'test@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test(validInput)).toBe(true);
  });
});
```

## Test File Naming Convention

- Frontend: `*.test.ts` or `*.test.tsx`
- Backend: `*.test.ts`
- Place tests next to the code they test or in dedicated `__tests__` folders

## Available Matchers

### Common Assertions
```typescript
expect(value).toBe(expected)              // Strict equality
expect(value).toEqual(expected)           // Deep equality
expect(value).toBeTruthy()                // Truthy check
expect(value).toBeFalsy()                 // Falsy check
expect(array).toContain(item)             // Array contains
expect(obj).toHaveProperty('key')         // Object has property
expect(str).toMatch(/pattern/)            // String matches regex
```

### DOM Testing (Frontend)
```typescript
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('text')
expect(element).toBeVisible()
expect(element).toHaveClass('className')
```

## Debugging Tests

### Frontend (Vitest)
```bash
# Run specific test file
npm test -- validation.test.ts

# Run tests matching pattern
npm test -- --grep "email"

# See detailed output
npm test -- --reporter=verbose
```

### Backend (Jest)
```bash
# Run specific test file
npm test health.test.ts

# Run tests matching pattern  
npm test -- -t "email validation"

# Watch mode
npm test -- --watch
```

## Best Practices

1. **Test One Thing**: Each test should verify a single behavior
2. **Use Descriptive Names**: Test names should clearly state what's being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Keep Tests Fast**: Avoid slow operations; mock external dependencies
5. **Don't Test Implementation**: Test behavior, not internal code details
6. **Maintain Tests**: Update tests when requirements change

## Common Patterns

### Testing Async Code
```typescript
it('should handle async operations', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Testing Error Cases
```typescript
it('should throw error for invalid input', () => {
  expect(() => validateInput('')).toThrow('Invalid input');
});
```

### Using Mocks (Frontend)
```typescript
import { vi } from 'vitest';

it('should call callback', () => {
  const callback = vi.fn();
  triggerCallback(callback);
  expect(callback).toHaveBeenCalled();
});
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Frontend Tests
  run: npm test -- --run

- name: Run Backend Tests
  run: cd server && npm test
```
