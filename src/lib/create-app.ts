import type { AppBindings } from './types'
import { Cron } from 'croner'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { etag } from 'hono/etag'
import { requestId } from 'hono/request-id'
import { notFound, serveEmojiFavicon } from 'stoker/middlewares'
import env from '../env'
import { limiter } from '../middlewares/limiter'
import { customLogger } from '../middlewares/pino-logger'
import { responseWrapper } from '../middlewares/response'
import { errorHandler } from '../utils/errorHandler'

export function createRouter(limit: number = env.RATE_LIMIT_MAX) {
  return new Hono<AppBindings>().basePath(env.API_PREFIX).use(limiter(limit))
}

// 用于子路由的纯净路由器（无 basePath）
export function createRouteHandler() {
  return new Hono<AppBindings>()
}

export function createCron() {
  // 每五分钟执行一次
  return new Cron('0 */5 * * * *', () => {

  })
}

export default function createApp() {
  const app = createRouter()
  app.use(requestId())
    .use(serveEmojiFavicon('🔥'))
    .use(customLogger())
    .use(etag())
    .use(cors())
    .use(responseWrapper)

  app.notFound(notFound)
  app.onError(errorHandler)

  createCron()

  return app
}
