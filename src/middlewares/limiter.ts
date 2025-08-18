import { rateLimiter } from 'hono-rate-limiter'
import { RateLimitError } from '../utils/errors'

export function limiter(limit: number) {
  return rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minutes
    limit, // Limit each IP to specified requests per window
    standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => {
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
      const route = c.req.path
      return `${ip}:${route}` // 组合IP和路由作为唯一键
    },
    // store: ... , // Redis, MemoryStore, etc. See below.
    handler: () => {
      throw new RateLimitError('请求过于频繁')
    },
  })
}
