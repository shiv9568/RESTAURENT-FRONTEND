# Portion Size Feature - User Guide

## Overview
You can now add multiple portion sizes (like Half Plate, Full Plate) for each food item with different prices.

## How to Use in Admin Panel

### Adding Portion Sizes to a Food Item

1. **Go to Food Management** in the admin panel
2. **Click "Add Food Item"** or **Edit an existing item**
3. **Scroll to "Portion Sizes (Optional)"** section
4. **Click "Add Portion Size"** button
5. **Enter the portion details:**
   - Portion name (e.g., "Half Plate", "Full Plate", "Regular", "Large")
   - Price for that portion
6. **Add more portions** by clicking "Add Portion Size" again
7. **Remove a portion** by clicking the trash icon next to it
8. **Save the item**

### Example Setup

**Burger Item:**
- Base Price: ₹100 (this is the default/regular price)
- Portion Sizes:
  - Half Plate: ₹80
  - Full Plate: ₹150
  - Jumbo: ₹200

**Rolls Item:**
- Base Price: ₹60
- Portion Sizes:
  - Half: ₹40
  - Full: ₹60
  - Double: ₹100

## How It Works for Customers

When customers view items with portion sizes:
1. They will see the base price initially
2. When adding to cart, they can select their preferred portion size
3. The price will update based on the selected portion
4. In the cart, the selected portion will be shown with the item

## Technical Details

- **Base Price**: The main price field is still required and serves as the default price
- **Portion Sizes**: Optional array of {name, price} objects
- **Validation**: Only portion sizes with both name and price > 0 are saved
- **Storage**: Portion sizes are stored in the database with each food item

## Next Steps

The admin panel is now ready to manage portion sizes. The next phase would be to update the customer-facing UI (FoodCard component) to allow customers to select portion sizes when adding items to cart.
