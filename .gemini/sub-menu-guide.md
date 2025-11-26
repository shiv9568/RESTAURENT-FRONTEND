# Sub-Menu Feature - Complete Guide

## Overview
This feature allows you to create hierarchical menu structures where a main item (like "Burger") can have multiple sub-items (like "Veg Burger", "Chicken Burger", etc.).

## Backend Setup ✅ COMPLETE
- Added `parentId` field to link sub-items to parent items
- Added `isParent` field to mark items that have children
- Database model updated and ready

## How It Works

### Structure:
```
Burger (Parent Item - isParent: true)
├── Veg Burger (Sub-item - parentId: burger_id)
├── Chicken Burger (Sub-item - parentId: burger_id)
└── Cheese Burger (Sub-item - parentId: burger_id)
```

## How to Use (Admin Panel)

### Step 1: Create a Parent Item
1. Go to **Food Management**
2. Click **"Add Food Item"**
3. Fill in details:
   - Name: "Burger"
   - Description: "Choose from our variety of burgers"
   - Price: 0 (or base price)
   - Category: "Starters"
   - Image: Upload burger image
   - **Check "This is a parent item"** (we need to add this checkbox)
4. Save

### Step 2: Create Sub-Items
1. Click **"Add Food Item"** again
2. Fill in details:
   - Name: "Veg Burger"
   - Description: "Delicious vegetarian burger"
   - Price: 120
   - Category: "Starters"
   - **Select Parent Item: "Burger"** (we need to add this dropdown)
3. Save
4. Repeat for other variants (Chicken Burger, Cheese Burger, etc.)

## Customer Experience

### On Homepage:
- Customer sees "Burger" card
- Badge shows "Has Variants" or "Multiple Options"
- Price shows "Starting from ₹XX"

### When Clicked:
- Dialog opens showing all burger variants
- Each variant shows:
  - Name (Veg Burger, Chicken Burger)
  - Description
  - Price
  - Add to Cart button

## Next Steps to Complete

I need to add to the admin panel:
1. ✅ Backend model (DONE)
2. ⏳ Checkbox: "This is a parent item"
3. ⏳ Dropdown: "Select Parent Item" (shows only parent items)
4. ⏳ Update customer UI to show sub-items dialog

Would you like me to complete the admin UI now?
