---
title: Endpoints
description: API endpoint reference.
---

# Endpoints

## Auth

| Method | Path            | Description       | Auth     |
| ------ | --------------- | ----------------- | -------- |
| POST   | `/auth/login`   | Authenticate user | Public   |
| POST   | `/auth/signup`  | Create account    | Public   |
| POST   | `/auth/refresh` | Refresh JWT token | Required |

## Users

| Method | Path         | Description    | Auth     |
| ------ | ------------ | -------------- | -------- |
| GET    | `/users/me`  | Current user   | Required |
| PATCH  | `/users/me`  | Update profile | Required |
| GET    | `/users`     | List all users | Admin    |
| GET    | `/users/:id` | Get user by ID | Admin    |

## Products

| Method | Path            | Description    | Auth   |
| ------ | --------------- | -------------- | ------ |
| GET    | `/products`     | List products  | Public |
| GET    | `/products/:id` | Get product    | Public |
| POST   | `/products`     | Create product | Admin  |
| PATCH  | `/products/:id` | Update product | Admin  |
| DELETE | `/products/:id` | Delete product | Admin  |

## Error responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found"
  }
}
```

| Status | Code           | Description              |
| ------ | -------------- | ------------------------ |
| 400    | `BAD_REQUEST`  | Invalid request body     |
| 401    | `UNAUTHORIZED` | Missing or invalid token |
| 403    | `FORBIDDEN`    | Insufficient permissions |
| 404    | `NOT_FOUND`    | Resource does not exist  |
| 500    | `INTERNAL`     | Unexpected server error  |
