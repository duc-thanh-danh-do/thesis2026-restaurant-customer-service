# API Contract v0.1 - Minimal MVP

Text-Based Restaurant Customer Service System

Version: 0.1  
Date: 2026-05-22  
Status: Draft for MVP implementation

## 1. Scope

This contract defines the first backend API version for a restaurant-customer text-based communication system.

API Contract v0.1 is intentionally limited to the current minimal database:

- `restaurants`
- `restaurant_tables`
- `customer_sessions`
- `staff_users`
- `chat_messages`
- `customer_requests`

The v0.1 goal is to support the core dine-in communication flow:

1. A customer scans a QR code at a restaurant table.
2. The system creates an anonymous customer session.
3. The customer sends chat messages.
4. The AI assistant or staff replies through the chat.
5. Concrete service needs are saved as customer requests.
6. Staff monitor active sessions and resolve requests.

## 2. Out Of Scope For v0.1

The following user stories exist in the product vision but are not fully supported by the current database:

- Menu browsing by categories
- Dish images
- Dish prices
- Allergen warnings
- Shared cart management
- Order placement
- Real-time order status
- Kitchen display system
- Restaurant reviews and ratings
- Payment
- Analytics event export
- AI response logs
- Restaurant knowledge base or RAG content

These features should be marked as planned for API Contract v0.2 or later.

Important MVP decision:

In v0.1, `order_request` means "the customer mentioned an order-related need in chat". It does not create a real order because there are no `orders` or `order_items` tables yet.

## 3. General API Rules

### Base URL

```http
/api
```

Example:

```http
GET /api/restaurants/1
```

### JSON Response Format

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

List response with pagination metadata, when needed:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### Common HTTP Status Codes

| Status | Meaning |
| --- | --- |
| `200 OK` | Request successful |
| `201 Created` | New resource created |
| `400 Bad Request` | Invalid request input |
| `401 Unauthorized` | Login or session token required |
| `403 Forbidden` | Authenticated user does not have permission |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Request conflicts with current resource state |
| `500 Internal Server Error` | Unexpected server error |

### Date Format

All timestamps must use ISO 8601 format in UTC.

Example:

```json
"2026-05-22T10:00:00Z"
```

### Naming Convention

The API uses `snake_case` in JSON request and response bodies because the current database fields are also written in `snake_case`.

## 4. Authentication And Session Model

### Customer Session

Customers do not create accounts.

The customer scans a table QR code. The QR code contains a `qr_code_token`. The backend validates the token and creates a temporary `customer_session`.

For customer-protected endpoints, the frontend should send the customer session token using one of these implementation choices:

- Preferred for production: secure HTTP-only cookie
- Acceptable for MVP: `Authorization: Bearer <session_token>`

The API examples below use the bearer-token style because it is easy to document and test.

### Staff Authentication

Staff users log in using email and password. Staff-protected endpoints require a staff authentication token or session cookie.

The `staff_user_id` should normally come from the authenticated staff session, not from the request body. This avoids staff impersonation from the frontend.

## 5. Shared Enums

### `customer_sessions.status`

```text
active
closed
expired
```

### `chat_messages.sender_type`

```text
customer
ai
staff
system
```

### `chat_messages.message_type`

```text
normal
service_request
order_request
handover_notice
```

### `customer_requests.request_type`

```text
service
bill
water
order_related
staff_help
other
```

### `customer_requests.status`

```text
new
in_progress
resolved
cancelled
```

### `customer_requests.priority`

```text
low
normal
high
```

### `staff_users.role`

```text
staff
manager
```

## 6. Public And Customer APIs

### 6.1 Get Restaurant Information

```http
GET /api/restaurants/:restaurantId
```

Purpose: Show basic restaurant information.

Path params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `restaurantId` | number | Yes | Restaurant ID |

Success response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sushi Demo Restaurant",
    "description": "Small local restaurant",
    "address": "Oulu, Finland",
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
    "code": "RESTAURANT_NOT_FOUND",
    "message": "Restaurant not found."
  }
}
```

### 6.2 Start Customer Session From QR Code

```http
POST /api/customer-sessions/start
```

Purpose: Create an anonymous customer session after a customer scans a table QR code.

Request body:

```json
{
  "qr_code_token": "table5-demo-token"
}
```

Backend logic:

1. Find `restaurant_tables` by `qr_code_token`.
2. Check that the table exists and `is_active = true`.
3. Create a new `customer_sessions` row with `status = active`.
4. Return the session token and table context.

Success response:

```json
{
  "success": true,
  "data": {
    "session_id": 101,
    "session_token": "session-token-xyz",
    "restaurant_id": 1,
    "table_id": 5,
    "table_number": "5",
    "status": "active",
    "started_at": "2026-05-22T10:00:00Z"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_QR_CODE",
    "message": "Invalid QR code."
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "TABLE_INACTIVE",
    "message": "This table is currently inactive."
  }
}
```

### 6.3 Get Current Customer Session

```http
GET /api/customer-sessions/me
Authorization: Bearer <session_token>
```

Purpose: Restore an active customer session after page refresh.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 101,
    "restaurant_id": 1,
    "table_id": 5,
    "table_number": "5",
    "status": "active",
    "started_at": "2026-05-22T10:00:00Z",
    "ended_at": null
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Customer session not found."
  }
}
```

### 6.4 Close Current Customer Session

```http
PATCH /api/customer-sessions/me/close
Authorization: Bearer <session_token>
```

Purpose: Close a customer session when the customer leaves, the session expires, or staff closes the session.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 101,
    "status": "closed",
    "ended_at": "2026-05-22T11:30:00Z"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_ALREADY_CLOSED",
    "message": "Customer session is already closed."
  }
}
```

### 6.5 Get Chat Messages For Current Session

```http
GET /api/customer-sessions/me/messages
Authorization: Bearer <session_token>
```

Purpose: Load the customer's chat history.

Query params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | number | No | Default `50` |
| `before` | string | No | ISO timestamp for loading older messages |

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "session_id": 101,
      "sender_type": "customer",
      "message_text": "Can I get water?",
      "message_type": "service_request",
      "created_at": "2026-05-22T10:05:00Z"
    },
    {
      "id": 2,
      "session_id": 101,
      "sender_type": "ai",
      "message_text": "I will notify the staff to bring water to your table.",
      "message_type": "service_request",
      "created_at": "2026-05-22T10:05:03Z"
    }
  ]
}
```

### 6.6 Send Customer Chat Message

```http
POST /api/chat
Authorization: Bearer <session_token>
```

Purpose: Send a customer message to the AI-assisted chat.

This is the main endpoint for the customer chat UI in v0.1. The backend saves the customer message, optionally creates a `customer_requests` row, and saves the AI response if AI is enabled.

Request body:

```json
{
  "message_text": "Can I get water?"
}
```

Backend logic:

1. Validate the customer session token.
2. Check that the session status is `active`.
3. Save the customer message in `chat_messages`.
4. Detect whether the message is a concrete service request.
5. If needed, create a `customer_requests` row.
6. Generate an AI response or a system handover notice.
7. Save the AI or system message in `chat_messages`.
8. Return the saved message data.

Non-streaming MVP response:

```json
{
  "success": true,
  "data": {
    "customer_message": {
      "id": 15,
      "session_id": 101,
      "sender_type": "customer",
      "message_text": "Can I get water?",
      "message_type": "service_request",
      "created_at": "2026-05-22T10:10:00Z"
    },
    "ai_message": {
      "id": 16,
      "session_id": 101,
      "sender_type": "ai",
      "message_text": "I will notify the staff to bring water to your table.",
      "message_type": "service_request",
      "created_at": "2026-05-22T10:10:05Z"
    },
    "created_request": {
      "id": 5,
      "request_type": "water",
      "status": "new",
      "priority": "normal"
    }
  }
}
```

Implementation note:

If the team uses Vercel AI SDK streaming, this endpoint can stream the AI response. The contract should still guarantee that the final customer and AI messages are persisted in `chat_messages`.

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_CLOSED",
    "message": "This customer session is no longer active."
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "MESSAGE_TOO_LONG",
    "message": "Message text is too long."
  }
}
```

### 6.7 Create Customer Request

```http
POST /api/customer-requests
Authorization: Bearer <session_token>
```

Purpose: Create a concrete request for staff. This can be called by a button in the UI, by deterministic backend intent detection, or after AI classification.

Request body:

```json
{
  "request_type": "water",
  "request_text": "Can I get water?",
  "priority": "normal"
}
```

Backend logic:

1. Validate the customer session token.
2. Get `restaurant_id` and `table_id` from the session.
3. Create `customer_requests` with `status = new`.
4. Optionally create a `system` chat message to show the request was sent.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "session_id": 101,
    "restaurant_id": 1,
    "table_id": 5,
    "table_number": "5",
    "request_type": "water",
    "request_text": "Can I get water?",
    "status": "new",
    "priority": "normal",
    "created_at": "2026-05-22T10:15:00Z",
    "updated_at": "2026-05-22T10:15:00Z"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST_TYPE",
    "message": "Invalid request type."
  }
}
```

## 7. Staff Authentication APIs

### 7.1 Staff Login

```http
POST /api/auth/staff/login
```

Purpose: Authenticate a staff user.

Request body:

```json
{
  "email": "staff@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "staff_user": {
      "id": 2,
      "restaurant_id": 1,
      "name": "Staff Member",
      "email": "staff@example.com",
      "role": "staff"
    },
    "token": "staff-jwt-token"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_LOGIN",
    "message": "Invalid email or password."
  }
}
```

### 7.2 Get Current Staff User

```http
GET /api/auth/staff/me
Authorization: Bearer <staff_token>
```

Purpose: Restore the current staff login session.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 2,
    "restaurant_id": 1,
    "name": "Staff Member",
    "email": "staff@example.com",
    "role": "staff"
  }
}
```

### 7.3 Staff Logout

```http
POST /api/auth/staff/logout
Authorization: Bearer <staff_token>
```

Purpose: End the staff login session.

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

## 8. Staff Dashboard APIs

All endpoints in this section require staff authentication.

### 8.1 Get Active Customer Sessions

```http
GET /api/staff/sessions?restaurant_id=1&status=active
Authorization: Bearer <staff_token>
```

Purpose: Show active sessions in the staff dashboard.

Query params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `restaurant_id` | number | No | Optional for manager, inferred from staff user for normal staff |
| `status` | string | No | `active`, `closed`, or `expired` |

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "restaurant_id": 1,
      "table_id": 5,
      "table_number": "5",
      "status": "active",
      "started_at": "2026-05-22T10:00:00Z",
      "ended_at": null,
      "last_message_at": "2026-05-22T10:15:00Z",
      "open_request_count": 1
    }
  ]
}
```

### 8.2 Get Chat Messages For Staff

```http
GET /api/staff/sessions/:sessionId/messages
Authorization: Bearer <staff_token>
```

Purpose: Let staff view the chat history for a customer session.

Path params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `sessionId` | number | Yes | Customer session ID |

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "session_id": 101,
      "sender_type": "customer",
      "message_text": "Can I get water?",
      "message_type": "service_request",
      "created_at": "2026-05-22T10:10:00Z"
    },
    {
      "id": 16,
      "session_id": 101,
      "sender_type": "ai",
      "message_text": "I will notify the staff to bring water to your table.",
      "message_type": "service_request",
      "created_at": "2026-05-22T10:10:05Z"
    }
  ]
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Customer session not found."
  }
}
```

### 8.3 Staff Sends Message To Customer Session

```http
POST /api/staff/sessions/:sessionId/messages
Authorization: Bearer <staff_token>
```

Purpose: Let staff manually reply in a customer chat.

Request body:

```json
{
  "message_text": "Hi, I will bring water to your table soon."
}
```

Backend logic:

1. Validate staff authentication.
2. Check staff belongs to the same restaurant as the customer session.
3. Save message in `chat_messages` with `sender_type = staff`.
4. Return the saved message.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 20,
    "session_id": 101,
    "sender_type": "staff",
    "message_text": "Hi, I will bring water to your table soon.",
    "message_type": "normal",
    "created_at": "2026-05-22T10:18:00Z"
  }
}
```

### 8.4 Get Customer Requests

```http
GET /api/staff/customer-requests?restaurant_id=1&status=new
Authorization: Bearer <staff_token>
```

Purpose: Show new or active customer requests in the staff dashboard.

Query params:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `restaurant_id` | number | No | Optional for manager, inferred from staff user for normal staff |
| `status` | string | No | `new`, `in_progress`, `resolved`, or `cancelled` |
| `priority` | string | No | `low`, `normal`, or `high` |

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "session_id": 101,
      "restaurant_id": 1,
      "table_id": 5,
      "table_number": "5",
      "request_type": "water",
      "request_text": "Can I get water?",
      "status": "new",
      "priority": "normal",
      "created_at": "2026-05-22T10:15:00Z",
      "updated_at": "2026-05-22T10:15:00Z"
    }
  ]
}
```

### 8.5 Update Customer Request Status

```http
PATCH /api/staff/customer-requests/:requestId
Authorization: Bearer <staff_token>
```

Purpose: Let staff mark a request as `in_progress`, `resolved`, or `cancelled`.

Request body:

```json
{
  "status": "resolved"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "resolved",
    "updated_at": "2026-05-22T10:20:00Z"
  }
}
```

Possible errors:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST_STATUS",
    "message": "Invalid request status."
  }
}
```

## 9. Real-Time Events For v0.1

The API above can work with normal HTTP polling in a simple MVP. If the team adds Supabase Realtime or WebSocket support, the following event names are recommended.

### Customer Session Channel

Channel:

```text
table:{table_id}:chat
```

Events:

```text
message.created
request.created
request.updated
session.closed
```

### Staff Notification Channel

Channel:

```text
staff:restaurant:{restaurant_id}
```

Events:

```text
session.created
message.created
request.created
request.updated
```

## 10. Planned API v0.2

The following endpoints should not be required for v0.1 implementation unless the database is expanded.

### 10.1 Menu API - Planned

Needed database tables:

```text
menu_categories
menu_items
allergens
menu_item_allergens
```

Possible future endpoints:

```http
GET /api/restaurants/:restaurantId/menu
GET /api/menu-items/:itemId
POST /api/staff/menu-items
PATCH /api/staff/menu-items/:itemId
PATCH /api/staff/menu-items/:itemId/visibility
```

Detailed contract: [Menu API Contract v0.2](./menu-api-contract-v0.2.md)

### 10.2 Cart API - Planned

Needed database tables:

```text
carts
cart_items
```

Possible future endpoints:

```http
GET /api/customer-sessions/me/cart
POST /api/customer-sessions/me/cart/items
PATCH /api/customer-sessions/me/cart/items/:cartItemId
DELETE /api/customer-sessions/me/cart/items/:cartItemId
```

### 10.3 Order API - Planned

Needed database tables:

```text
orders
order_items
```

Possible future endpoints:

```http
POST /api/customer-sessions/me/orders
GET /api/customer-sessions/me/orders
GET /api/staff/orders?restaurant_id=1&status=new
PATCH /api/staff/orders/:orderId/status
PATCH /api/staff/orders/:orderId/items/:orderItemId
```

### 10.4 Review API - Planned

Needed database table:

```text
restaurant_reviews
```

Possible future endpoints:

```http
GET /api/restaurants/:restaurantId/reviews
POST /api/restaurants/:restaurantId/reviews
POST /api/staff/reviews/:reviewId/reply
DELETE /api/staff/reviews/:reviewId
```

### 10.5 AI Knowledge And Logs - Planned

Needed database tables:

```text
restaurant_knowledge_base
ai_response_logs
analytics_events
```

Possible future endpoints:

```http
GET /api/staff/knowledge-base
POST /api/staff/knowledge-base
PATCH /api/staff/knowledge-base/:entryId
GET /api/staff/analytics/events
```

## 11. Team Decision Summary

For the current thesis MVP, the team should implement only the APIs supported by the minimal database. Menu, cart, order, review, AI logs, and analytics should be documented as planned features until the database schema is expanded.

Recommended team statement:

```text
Because our current database is still minimal, API Contract v0.1 only includes endpoints supported by the current schema. Menu, cart, order, review, and analytics endpoints are planned for v0.2. This keeps the MVP realistic and avoids confusion during implementation.
```

## 12. Current Mismatch To Resolve Later

Current user stories include:

- Menu browsing
- Dish images
- Allergens
- Cart
- Order placement
- Order status
- Reviews
- Kitchen display system
- Analytics and research metrics

Current minimal DBML supports only:

- Restaurant information
- Restaurant tables and QR tokens
- Anonymous customer sessions
- Staff users
- Chat messages
- Customer requests

If the MVP must answer menu or allergen questions seriously, the team should add at least:

```text
menu_categories
menu_items
allergens
menu_item_allergens
```

If the MVP must place actual orders, the team should add at least:

```text
orders
order_items
```

If the thesis needs AI evaluation metrics, the team should add at least:

```text
ai_response_logs
analytics_events
```
