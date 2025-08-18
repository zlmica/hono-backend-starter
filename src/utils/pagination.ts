import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { Context } from 'hono'
import type * as schema from '../db/schema'
import type { AppBindings } from '../lib/types'
import { z } from 'zod'
import { db } from '../db'
import { ValidationError } from './errors'

// 基础分页查询参数验证schema
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => {
    const page = Number.parseInt(val || '1', 10)
    return Math.max(1, page) // 页码最小为1
  }),
  limit: z.string().optional().transform((val) => {
    const limit = Number.parseInt(val || '10', 10)
    return Math.min(Math.max(1, limit), 100) // 限制在1-100之间
  }),
}).catchall(z.any()) // 允许额外的参数通过

// 分页参数类型
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

// 分页结果类型
export interface PaginationResult<T> {
  content: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  next_url: string | null
  prev_url: string | null
}

// 验证分页查询参数
export function validatePaginationQuery(query: Record<string, string | undefined>): PaginationQuery {
  const result = paginationQuerySchema.safeParse(query)
  if (!result.success) {
    throw new ValidationError(result.error.message)
  }
  return result.data as PaginationQuery
}

// 计算分页信息
export function calculatePagination(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    totalPages,
  }
}

// 构建分页响应
export function buildPaginationResponse<T>(
  c: Context<AppBindings>,
  content: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  // 从请求URL中提取基础URL（不包含查询参数）
  const baseUrl = (c.req.url || '').split('?')[0]
  const queryParams = c.req.query() || {}
  const pagination = calculatePagination(total, page, limit)

  // 构建查询参数
  const buildQueryString = (params: Record<string, any>) => {
    const searchParams = new URLSearchParams()

    // 添加现有的查询参数
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    // 添加分页参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  // 生成URL
  const next_url = page < pagination.totalPages
    ? `${baseUrl}${buildQueryString({ page: page + 1, limit })}`
    : null

  const prev_url = page > 1
    ? `${baseUrl}${buildQueryString({ page: page - 1, limit })}`
    : null

  return {
    content,
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: pagination.totalPages,
    next_url,
    prev_url,
  }
}

// 简单分页查询函数 - 只负责事务包装和分页响应
export async function paginatedQuery<T>(
  c: Context<AppBindings>,
  queryFn: (tx: PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>) => Promise<T[]>,
  countFn: (tx: PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>) => Promise<number>,
  page: number,
  limit: number,
  beforeFn?: (tx: PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>) => Promise<void>, // 前置事件，可选
) {
  // 使用事务确保数据一致性
  const result = await db.transaction(async (tx) => {
    // 执行前置事件（如果提供）
    if (beforeFn) {
      await beforeFn(tx)
    }

    // 在同一个事务中查询数据和总数
    const [data, total] = await Promise.all([
      queryFn(tx),
      countFn(tx),
    ])

    return { data, total }
  })

  // 构建分页响应
  const response = buildPaginationResponse(c, result.data, result.total, page, limit)

  return response
}
