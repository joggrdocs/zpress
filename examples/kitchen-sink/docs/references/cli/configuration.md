---
title: Configuration
---

# Configuration

The CLI reads configuration from `acme.config.ts` in the project root.

```ts
export default {
  org: 'acme',
  project: 'web',
  region: 'us-east-1',
  deploy: {
    strategy: 'rolling',
    timeout: 300,
  },
}
```

## Environment Variables

| Variable         | Description                                      | Default     |
| ---------------- | ------------------------------------------------ | ----------- |
| `ACME_TOKEN`     | API authentication token                         | —           |
| `ACME_ORG`       | Organization slug                                | from config |
| `ACME_LOG_LEVEL` | Log verbosity (`debug`, `info`, `warn`, `error`) | `info`      |
