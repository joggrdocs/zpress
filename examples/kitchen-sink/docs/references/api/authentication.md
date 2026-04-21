---
title: Authentication
---

# Authentication

All API requests require a Bearer token in the `Authorization` header.

## Obtaining a Token

Send a `POST` request to `/auth/token` with your client credentials:

```bash
curl -X POST https://api.acme.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id": "...", "client_secret": "..."}'
```

## Token Refresh

Tokens expire after 1 hour. Use the refresh token to obtain a new access token without re-authenticating.
