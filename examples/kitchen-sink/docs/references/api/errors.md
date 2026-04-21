---
title: Error Codes
---

# Error Codes

All errors return a JSON body with `code`, `message`, and optional `details`.

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `auth_required` | 401 | Missing or invalid authentication |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource does not exist |
| `validation_error` | 422 | Request body failed validation |
| `rate_limited` | 429 | Too many requests |
| `internal_error` | 500 | Unexpected server error |
