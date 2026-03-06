---
description: Reference for all UI components.
title: Components
---

# Components

## Button

Interactive button with multiple variants.

```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">More options</Button>
<Button variant="danger">Delete</Button>
```

| Prop       | Type                                              | Default     |
| ---------- | ------------------------------------------------- | ----------- |
| `variant`  | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` |
| `size`     | `'sm' \| 'md' \| 'lg'`                            | `'md'`      |
| `disabled` | `boolean`                                         | `false`     |
| `loading`  | `boolean`                                         | `false`     |

## Card

Container with rounded corners and subtle border.

```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content here</Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

## Input

Form input with label and validation support.

```tsx
<Input label="Email" type="email" error="Please enter a valid email" />
```

| Prop    | Type     | Default  |
| ------- | -------- | -------- |
| `label` | `string` | —        |
| `error` | `string` | —        |
| `type`  | `string` | `'text'` |

## Badge

Small status indicator.

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

## Avatar

User avatar with fallback initials.

```tsx
<Avatar src="/avatars/alice.jpg" alt="Alice" />
<Avatar fallback="AB" />
```
