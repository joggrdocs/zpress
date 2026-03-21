---
description: Database table definitions and relationships.
title: Schema
---

# Schema

All tables are defined using Drizzle's schema builder in `src/schema/`.

## Users

```ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

## Products

```ts
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(), // cents
  createdAt: timestamp('created_at').defaultNow(),
})
```

## Orders

```ts
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  status: text('status', { enum: ['pending', 'paid', 'shipped', 'delivered'] }),
  total: integer('total').notNull(), // cents
  createdAt: timestamp('created_at').defaultNow(),
})
```

## Relations

```ts
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}))
```
