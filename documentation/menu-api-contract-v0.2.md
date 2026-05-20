# Menu API Contract v0.2

Text-Based Restaurant Customer Service System

Version: 0.2  
Date: 2026-05-22  
Status: Planned contract for menu support

## 1. Scope

This contract defines the planned Menu API for the restaurant-customer text-based communication system.

Menu API v0.2 supports these user stories:

- Customers can browse menu categories.
- Customers can see dish names, descriptions, images, prices, and availability.
- Customers can see allergen warnings.
- Customers can ask the AI assistant menu-related questions.
- Managers can add, edit, hide, and update menu items.
- Managers can prevent ghost orders by marking items unavailable or hidden.

This contract should be implemented only after the database is expanded beyond the minimal v0.1 schema.

## 2. Relationship To API Contract v0.1

API Contract v0.1 supports:

- QR table access
- Anonymous customer sessions
- Chat messages
- Staff service requests

Menu API v0.2 adds structured menu data. This makes AI dish Q&A much safer and more useful because the AI can answer from actual restaurant data instead of guessing.

Important rule:

```text
The AI may recommend or explain menu items, but it should only use menu data returned from the database. If menu data is missing, the AI should say that menu information is not available.
```

## 3. Required Database Tables

The current minimal DBML does not support this contract yet.

Add at least these tables:

```text
menu_categories
menu_items
allergens
menu_item_allergens
```

Recommended fields:

```dbml
Table menu_categories {
  id int [pk, increment]
  restaurant_id int [not null]
  name varchar(255) [not null]
  description text
  display_order int [default: 0]
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table menu_items {
  id int [pk, increment]
  restaurant_id int [not null]
  category_id int [not null]
  name varchar(255) [not null]
  description text
  price_cents int [not null]
  currency varchar(10) [not null] // EUR
  image_url varchar(500)
  is_available boolean [default: true]
  is_visible boolean [default: true]
  spicy_level int // 0-5, optional
  created_at timestamp
  updated_at timestamp
}

Table allergens {
  id int [pk, increment]
  code varchar(50) [unique, not null]
  name varchar(255) [not null]
  description text
}

Table menu_item_allergens {
  menu_item_id int [not null]
  allergen_id int [not null]
}

Ref: menu_categories.restaurant_id > restaurants.id
Ref: menu_items.restaurant_id > restaurants.id
Ref: menu_items.category_id > menu_categories.id
Ref: menu_item_allergens.menu_item_id > menu_items.id
Ref: menu_item_allergens.allergen_id > allergens.id
```

Money rule:

Use `price_cents` plus `currency` in API responses to avoid floating point problems. Example: `1290` means `12.90 EUR`.

## 4. General API Rules

Base URL:

```http
/api
```

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message."
  }
}
```

All JSON fields use `snake_case`.

## 5. Authentication Model

### Customer Menu Browsing

Customers can browse the public menu without a staff login.

Recommended options:

- Public menu by restaurant ID: no auth required.
- Session-aware menu by customer session: optional if the team wants table-specific menu behavior later.

For v0.2, the simple approach is:

```http
GET /api/restaurants/:restaurantId/menu
```

### Staff Menu Management

Staff menu management endpoints require staff authentication.

Managers should be allowed to create, edit, hide, and delete menu data. Normal staff may be read-only unless the team decides otherwise.

## 6. Shared Enums And Field Rules

### `menu_items.is_visible`

Controls whether customers can see the item.

```text
true  = item can appear in customer menu
false = item is hidden from customer menu
```

### `menu_items.is_available`

Controls whether customers can order or request the item.

```text
true  = item is currently available
false = item is visible but unavailable / sold out
```

Recommended UI behavior:

- `is_visible = false`: do not show the item to customers.
- `is_visible = true` and `is_available = false`: show the item as unavailable or sold out.

This helps prevent ghost orders.

### `spicy_level`

Optional numeric value.

```text
0 = not spicy
1 = mild
2 = medium
3 = spicy
4 = very spicy
5 = extremely spicy
```

## 7. Customer Menu APIs

### 7.1 Get Restaurant Menu

```http
GET /api/restaurants/:restaurantId/menu
```

Purpose: Show the public customer menu grouped by category.

Path params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `restaurantId` | number | Yes | Restaurant ID |

Query params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `include_unavailable` | boolean | No | Default `true`; shows sold-out items as unavailable |
| `category_id` | number | No | Filter by one category |
| `search` | string | No | Search by item name or description |
| `allergen_free` | string | No | Comma-separated allergen codes to exclude, for example `gluten,nuts` |

Backend logic:

1. Find restaurant.
2. Load active categories.
3. Load visible menu items.
4. Include allergen data for each item.
5. If `include_unavailable = false`, exclude unavailable items.
6. Return categories with nested items.

Success response:

```json
{
  "success": true,
  "data": {
    "restaurant": {
      "id": 1,
      "name": "Sushi Demo Restaurant"
    },
    "categories": [
      {
        "id": 1,
        "name": "Main Dishes",
        "description": "Warm dishes and rice bowls",
        "display_order": 1,
        "items": [
          {
            "id": 10,
            "category_id": 1,
            "name": "Spicy Salmon Bowl",
            "description": "Rice bowl with salmon, chili mayo, cucumber, and sesame.",
            "price_cents": 1290,
            "currency": "EUR",
            "image_url": "https://example.com/images/spicy-salmon-bowl.jpg",
            "is_available": true,
            "is_visible": true,
            "spicy_level": 3,
            "allergens": [
              {
                "id": 2,
                "code": "fish",
                "name": "Fish"
              },
              {
                "id": 5,
                "code": "sesame",
                "name": "Sesame"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "RESTAURANT_NOT_FOUND",
    "message": "Restaurant not found."
  }
}
```

### 7.2 Get Menu Item Details

```http
GET /api/menu-items/:itemId
```

Purpose: Show detailed information for one public menu item.

Path params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `itemId` | number | Yes | Menu item ID |

Success response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "restaurant_id": 1,
    "category": {
      "id": 1,
      "name": "Main Dishes"
    },
    "name": "Spicy Salmon Bowl",
    "description": "Rice bowl with salmon, chili mayo, cucumber, and sesame.",
    "price_cents": 1290,
    "currency": "EUR",
    "image_url": "https://example.com/images/spicy-salmon-bowl.jpg",
    "is_available": true,
    "is_visible": true,
    "spicy_level": 3,
    "allergens": [
      {
        "id": 2,
        "code": "fish",
        "name": "Fish",
        "description": "Contains fish or fish products."
      }
    ],
    "created_at": "2026-05-22T10:00:00Z",
    "updated_at": "2026-05-22T10:00:00Z"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "MENU_ITEM_NOT_FOUND",
    "message": "Menu item not found."
  }
}
```

## 8. Staff Menu Category APIs

All endpoints in this section require staff authentication.

### 8.1 Get Menu Categories For Staff

```http
GET /api/staff/menu-categories?restaurant_id=1
Authorization: Bearer <staff_token>
```

Purpose: Show all menu categories, including inactive categories, for staff management.

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "restaurant_id": 1,
      "name": "Main Dishes",
      "description": "Warm dishes and rice bowls",
      "display_order": 1,
      "is_active": true,
      "created_at": "2026-05-22T10:00:00Z",
      "updated_at": "2026-05-22T10:00:00Z"
    }
  ]
}
```

### 8.2 Create Menu Category

```http
POST /api/staff/menu-categories
Authorization: Bearer <staff_token>
```

Purpose: Create a new menu category.

Request body:

```json
{
  "restaurant_id": 1,
  "name": "Desserts",
  "description": "Sweet dishes",
  "display_order": 3,
  "is_active": true
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 3,
    "restaurant_id": 1,
    "name": "Desserts",
    "description": "Sweet dishes",
    "display_order": 3,
    "is_active": true,
    "created_at": "2026-05-22T10:30:00Z",
    "updated_at": "2026-05-22T10:30:00Z"
  }
}
```

### 8.3 Update Menu Category

```http
PATCH /api/staff/menu-categories/:categoryId
Authorization: Bearer <staff_token>
```

Purpose: Update category name, description, order, or active status.

Request body:

```json
{
  "name": "Desserts",
  "description": "Sweet dishes and ice cream",
  "display_order": 4,
  "is_active": true
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Desserts",
    "description": "Sweet dishes and ice cream",
    "display_order": 4,
    "is_active": true,
    "updated_at": "2026-05-22T10:45:00Z"
  }
}
```

## 9. Staff Menu Item APIs

All endpoints in this section require staff authentication.

### 9.1 Get Menu Items For Staff

```http
GET /api/staff/menu-items?restaurant_id=1&category_id=1
Authorization: Bearer <staff_token>
```

Purpose: Show all menu items for staff management, including hidden and unavailable items.

Query params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `restaurant_id` | number | No | Optional for manager, inferred from staff user for normal staff |
| `category_id` | number | No | Filter by category |
| `is_visible` | boolean | No | Filter by visibility |
| `is_available` | boolean | No | Filter by availability |
| `search` | string | No | Search by item name or description |

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "restaurant_id": 1,
      "category_id": 1,
      "category_name": "Main Dishes",
      "name": "Spicy Salmon Bowl",
      "description": "Rice bowl with salmon, chili mayo, cucumber, and sesame.",
      "price_cents": 1290,
      "currency": "EUR",
      "image_url": "https://example.com/images/spicy-salmon-bowl.jpg",
      "is_available": true,
      "is_visible": true,
      "spicy_level": 3,
      "allergens": [
        {
          "id": 2,
          "code": "fish",
          "name": "Fish"
        }
      ],
      "created_at": "2026-05-22T10:00:00Z",
      "updated_at": "2026-05-22T10:00:00Z"
    }
  ]
}
```

### 9.2 Create Menu Item

```http
POST /api/staff/menu-items
Authorization: Bearer <staff_token>
```

Purpose: Create a new menu item.

Request body:

```json
{
  "restaurant_id": 1,
  "category_id": 1,
  "name": "Spicy Salmon Bowl",
  "description": "Rice bowl with salmon, chili mayo, cucumber, and sesame.",
  "price_cents": 1290,
  "currency": "EUR",
  "image_url": "https://example.com/images/spicy-salmon-bowl.jpg",
  "is_available": true,
  "is_visible": true,
  "spicy_level": 3,
  "allergen_ids": [2, 5]
}
```

Validation rules:

- `name` is required.
- `category_id` must belong to the same restaurant.
- `price_cents` must be greater than or equal to `0`.
- `currency` should default to `EUR` for this thesis prototype.
- `spicy_level` must be between `0` and `5` if provided.
- `allergen_ids` must reference existing allergens.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "restaurant_id": 1,
    "category_id": 1,
    "name": "Spicy Salmon Bowl",
    "description": "Rice bowl with salmon, chili mayo, cucumber, and sesame.",
    "price_cents": 1290,
    "currency": "EUR",
    "image_url": "https://example.com/images/spicy-salmon-bowl.jpg",
    "is_available": true,
    "is_visible": true,
    "spicy_level": 3,
    "allergens": [
      {
        "id": 2,
        "code": "fish",
        "name": "Fish"
      },
      {
        "id": 5,
        "code": "sesame",
        "name": "Sesame"
      }
    ],
    "created_at": "2026-05-22T10:00:00Z",
    "updated_at": "2026-05-22T10:00:00Z"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Menu category not found."
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRICE",
    "message": "Price must be greater than or equal to 0."
  }
}
```

### 9.3 Update Menu Item

```http
PATCH /api/staff/menu-items/:itemId
Authorization: Bearer <staff_token>
```

Purpose: Update menu item details.

Request body:

```json
{
  "category_id": 1,
  "name": "Extra Spicy Salmon Bowl",
  "description": "Rice bowl with salmon, extra chili mayo, cucumber, and sesame.",
  "price_cents": 1390,
  "currency": "EUR",
  "image_url": "https://example.com/images/extra-spicy-salmon-bowl.jpg",
  "is_available": true,
  "is_visible": true,
  "spicy_level": 4,
  "allergen_ids": [2, 5]
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Extra Spicy Salmon Bowl",
    "price_cents": 1390,
    "is_available": true,
    "is_visible": true,
    "spicy_level": 4,
    "updated_at": "2026-05-22T11:00:00Z"
  }
}
```

### 9.4 Update Menu Item Availability

```http
PATCH /api/staff/menu-items/:itemId/availability
Authorization: Bearer <staff_token>
```

Purpose: Mark an item as available or unavailable without editing the full item.

Request body:

```json
{
  "is_available": false
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "is_available": false,
    "updated_at": "2026-05-22T11:10:00Z"
  }
}
```

### 9.5 Update Menu Item Visibility

```http
PATCH /api/staff/menu-items/:itemId/visibility
Authorization: Bearer <staff_token>
```

Purpose: Hide or show an item in the customer-facing menu.

Request body:

```json
{
  "is_visible": false
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "is_visible": false,
    "updated_at": "2026-05-22T11:15:00Z"
  }
}
```

### 9.6 Delete Menu Item

```http
DELETE /api/staff/menu-items/:itemId
Authorization: Bearer <staff_token>
```

Purpose: Delete a menu item if it has not been used in orders.

Recommended implementation:

- Before real ordering exists, hard delete is acceptable for prototype data.
- After `orders` and `order_items` exist, prefer soft delete or `is_visible = false` to preserve historical order data.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "deleted": true
  }
}
```

## 10. Allergen APIs

### 10.1 Get Allergens

```http
GET /api/allergens
```

Purpose: Return the allergen list used by customer menu views and staff menu forms.

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "gluten",
      "name": "Gluten",
      "description": "Contains gluten or gluten-containing grains."
    },
    {
      "id": 2,
      "code": "fish",
      "name": "Fish",
      "description": "Contains fish or fish products."
    }
  ]
}
```

### 10.2 Create Allergen

```http
POST /api/staff/allergens
Authorization: Bearer <staff_token>
```

Purpose: Add a new allergen option.

Request body:

```json
{
  "code": "sesame",
  "name": "Sesame",
  "description": "Contains sesame seeds or sesame products."
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "code": "sesame",
    "name": "Sesame",
    "description": "Contains sesame seeds or sesame products."
  }
}
```

### 10.3 Update Allergen

```http
PATCH /api/staff/allergens/:allergenId
Authorization: Bearer <staff_token>
```

Purpose: Update allergen display information.

Request body:

```json
{
  "name": "Sesame",
  "description": "Contains sesame seeds, oil, or sesame products."
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "code": "sesame",
    "name": "Sesame",
    "description": "Contains sesame seeds, oil, or sesame products."
  }
}
```

## 11. AI Menu Q&A Integration

The AI assistant should use structured menu data for dish recommendations.

Recommended backend flow:

1. Customer sends message to `POST /api/chat`.
2. Backend detects a menu-related intent.
3. Backend fetches visible menu items and allergens for the restaurant.
4. AI receives only the relevant structured menu context.
5. AI answers with item names, prices, availability, and allergen warnings when relevant.
6. AI must not invent dishes, prices, or allergen information.

Example customer message:

```text
What is the best spicy dish?
```

Example AI answer:

```text
The Spicy Salmon Bowl is a good spicy option. It costs 12.90 EUR and has spicy level 3/5. It contains fish and sesame.
```

If no menu data exists:

```text
I do not have menu information available yet. I can ask staff to help you.
```

## 12. Real-Time Events

If staff updates menu data while customers are browsing, the frontend can refresh using polling or real-time events.

Recommended event channel:

```text
restaurant:{restaurant_id}:menu
```

Recommended events:

```text
menu.category.created
menu.category.updated
menu.item.created
menu.item.updated
menu.item.availability_updated
menu.item.visibility_updated
menu.item.deleted
allergen.updated
```

## 13. Endpoint Summary

Customer/public endpoints:

```http
GET /api/restaurants/:restaurantId/menu
GET /api/menu-items/:itemId
GET /api/allergens
```

Staff endpoints:

```http
GET /api/staff/menu-categories
POST /api/staff/menu-categories
PATCH /api/staff/menu-categories/:categoryId

GET /api/staff/menu-items
POST /api/staff/menu-items
PATCH /api/staff/menu-items/:itemId
PATCH /api/staff/menu-items/:itemId/availability
PATCH /api/staff/menu-items/:itemId/visibility
DELETE /api/staff/menu-items/:itemId

POST /api/staff/allergens
PATCH /api/staff/allergens/:allergenId
```

## 14. Implementation Priority

Recommended build order:

1. Add database tables for categories, menu items, allergens, and item-allergen relationships.
2. Implement public menu browsing endpoint.
3. Implement allergen list endpoint.
4. Implement staff category CRUD.
5. Implement staff menu item CRUD.
6. Add availability and visibility endpoints.
7. Connect AI chat to structured menu data.

This gives the team useful customer-facing menu browsing before building cart or real ordering.
