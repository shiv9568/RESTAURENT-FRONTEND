# Bug Fixes Implementation Plan

## Issues to Fix:

### 1. **Portion Handling in Cart** ✅
**Problem**: Different portions (half/full) count as one item
**Solution**: Update cart.ts to include `selectedPortion` in the unique item check
**File**: `src/utils/cart.ts`

### 2. **Restaurant Closure - User Can Still Order** ✅  
**Problem**: Users can add items when restaurant is closed
**Solution**: Already implemented in FoodCard.tsx (line 36-39), but needs socket sync
**Files**: 
- `src/components/FoodCard.tsx` (Already has check)
- `src/pages/UserHome.tsx` (Add real-time closure sync)

### 3. **Admin Panel Sync Issues** ✅
**Problem**: Changes require refresh to show
**Solution**: Implement socket.io events for real-time updates
**Files**:
- `server/src/routes/*.ts` (Emit events on changes)
- `src/pages/UserHome.tsx` (Listen for updates)

### 4. **Cancelled Order Amounts** ✅
**Problem**: Dashboard stats don't update when orders cancelled
**Solution**: Exclude cancelled orders from revenue calculation
**File**: `server/src/routes/admin.ts`

### 5. **Admin Order Management - Portion Details** ✅
**Problem**: Cannot see portion information in orders
**Solution**: Display `selectedPortion` in order items
**File**: `src/pages/admin/OrdersManagement.tsx`

### 6. **Password Change - Confirm Password** ✅
**Problem**: No confirm password field
**Solution**: Add confirm password validation
**File**: `src/pages/Profile.tsx` or password change component

## Implementation Order:
1. Fix portion handling (cart.ts)
2. Fix cancelled order amounts (admin.ts)
3. Add portion display in admin orders
4. Add confirm password field
5. Improve socket sync for real-time updates
