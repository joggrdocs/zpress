---
title: Pull Requests
description: How to submit and review pull requests.
---

# Pull Requests

## Creating a PR

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes with clear, atomic commits
3. Push and open a pull request against `main`

## PR title format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat(packages/ui): add tooltip component
fix(apps/api): handle null user in auth middleware
docs: update deployment guide
```

## Description template

Every PR should include:

- **Summary** — what changed and why
- **Changes** — bulleted list of modifications
- **Testing** — how you verified the changes
- **Related issues** — links to relevant issues

## Review process

1. At least one approval required before merging
2. CI must pass (lint, typecheck, tests)
3. Squash and merge — one commit per PR on `main`

## After merge

Your branch is automatically deleted after merge. The deployment pipeline picks up the change from `main`.
