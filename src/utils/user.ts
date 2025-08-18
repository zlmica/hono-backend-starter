import type { Context } from 'hono'
import type { AppBindings } from '../lib/types'

/**
 * 安全地获取当前用户信息
 * @param c Hono context
 * @returns 用户信息或null
 */
export function getCurrentUser(c: Context<AppBindings>) {
  return c.var.user || null
}

/**
 * 检查用户是否已认证
 * @param c Hono context
 * @returns 是否已认证
 */
export function isAuthenticated(c: Context<AppBindings>) {
  return !!c.var.user
}

/**
 * 获取当前用户ID
 * @param c Hono context
 * @returns 用户ID或null
 */
export function getCurrentUserId(c: Context<AppBindings>) {
  return c.var.user?.id || null
}

/**
 * 检查用户是否为管理员
 * @param c Hono context
 * @returns 是否为管理员
 */
export function isAdmin(c: Context<AppBindings>) {
  return c.var.user?.role === 'admin'
}
