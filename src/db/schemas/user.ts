import { sql } from 'drizzle-orm'
import { bigint, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

// 定义角色枚举
export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  role: userRoleEnum('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull().default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull().default(sql`EXTRACT(EPOCH FROM NOW()) * 1000`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const userSelectSchema = createSelectSchema(users)
export const userInsertSchema = createInsertSchema(users)

export const userUpdateSchema = createInsertSchema(users)

export const userUpdateSelfSchema = createInsertSchema(users)
  .pick({
    name: true,
    password: true,
    phone: true,
  })
  .partial()
