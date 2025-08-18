import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import pino from 'pino'
import env from '../env'
import { awaitTo } from '../utils/awaitTo'

// 安全地解析JWT token并获取用户信息
async function extractUserFromToken(c: Context) {
  try {
    // 获取Authorization header
    const authHeader = c.req.header('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null, userName: '未登录用户', role: null }
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀

    // 验证JWT token
    const [err, payload] = await awaitTo(verify(token, env.JWT_SECRET))
    if (err) {
      return { userId: null, userName: '无效token用户', role: null }
    }

    // 检查token是否过期
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { userId: null, userName: '过期token用户', role: null }
    }

    // 从payload中获取用户ID
    if (payload.id) {
      return {
        userId: payload.id,
        userName: payload.username,
        role: payload.role,
      }
    }

    return { userId: null, userName: '无效用户', role: null }
  }
  catch {
    // 任何错误都返回未登录用户
    return { userId: null, userName: '解析token失败用户', role: null }
  }
}

// 自定义日志中间件，记录更详细的请求和响应信息
export function customLogger() {
  const pinoInstance = pino({
    level: env.LOG_LEVEL || 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
      level: label => ({ level: label }),
    },
    messageKey: 'message',
  })

  return async (c: Context, next: Next) => {
    // 将 logger 设置到 context 中
    c.set('logger', pinoInstance)
    const startTime = Date.now()
    const requestId = c.get('requestId') || 'unknown'

    // 提取用户信息
    const userInfo = await extractUserFromToken(c)

    // 安全地获取请求头
    const requestHeaders: Record<string, string> = {}
    try {
      if (c.req.raw.headers) {
        c.req.raw.headers.forEach((value, key) => {
          requestHeaders[key] = value
        })
      }
    }
    catch {
      // 如果无法获取完整头部，至少记录一些关键头部
      requestHeaders['user-agent'] = c.req.header('user-agent') || ''
      requestHeaders['content-type'] = c.req.header('content-type') || ''
      requestHeaders.accept = c.req.header('accept') || ''
    }

    // 安全地获取查询参数
    const queryParams: Record<string, string> = {}
    try {
      const query = c.req.query()
      if (query && typeof query === 'object') {
        Object.assign(queryParams, query)
      }
    }
    catch {
      // 忽略查询参数错误
    }

    // 安全地获取请求体
    let requestBody: any = null
    try {
      if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
        const contentType = c.req.header('content-type')
        if (contentType && contentType.includes('application/json')) {
          // 尝试获取请求体内容
          const rawBody = await c.req.raw.clone().text()
          if (rawBody) {
            try {
              requestBody = JSON.parse(rawBody)
            }
            catch {
              requestBody = rawBody
            }
          }
        }
      }
    }
    catch {
      // 忽略请求体解析错误
    }

    // 跳过 OPTIONS 请求的详细日志
    if (c.req.method === 'OPTIONS') {
      pinoInstance.debug({
        type: 'request',
        requestId,
        method: c.req.method,
        path: c.req.path,
        user: {
          id: userInfo.userId,
          username: userInfo.userName,
          role: userInfo.role,
        },
      }, '📥 CORS预检请求')
    }
    else {
      // 记录请求信息
      pinoInstance.info({
        type: 'request',
        requestId,
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        body: requestBody,
        user: {
          id: userInfo.userId,
          username: userInfo.userName,
          role: userInfo.role,
        },
      }, '📥 收到请求')
    }

    // 执行下一个中间件
    await next()

    const endTime = Date.now()
    const responseTime = endTime - startTime
    const status = c.res.status

    // 获取响应体类型
    let responseBodyType = 'none'

    // 对于 304 状态码，不尝试获取响应体
    if (status !== 304) {
      try {
        const clonedRes = c.res.clone()
        const contentType = clonedRes.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          responseBodyType = 'json'
        }
        else if (contentType && contentType.includes('text/')) {
          responseBodyType = 'text'
        }
        else if (contentType) {
          responseBodyType = 'other'
        }
      }
      catch {
        // 忽略获取响应体的错误
        responseBodyType = 'error'
      }
    }
    else {
      responseBodyType = 'cached'
    }

    // 安全地获取响应头
    const responseHeaders: Record<string, string> = {}
    try {
      if (c.res.headers) {
        c.res.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })
      }
    }
    catch {
      // 如果无法获取完整头部，至少记录一些关键头部
      responseHeaders['content-type'] = c.res.headers.get('content-type') || ''
      responseHeaders['content-length'] = c.res.headers.get('content-length') || ''
    }

    // 安全地获取响应体
    let responseBody: any = null
    try {
      if (status !== 304 && responseBodyType === 'json') {
        // 从 context 中获取存储的响应数据
        const responseData = c.get('responseData')
        if (responseData) {
          responseBody = responseData
        }
      }
    }
    catch {
      // 忽略响应体解析错误
    }

    // 跳过 OPTIONS 请求的详细响应日志
    if (c.req.method === 'OPTIONS') {
      pinoInstance.debug({
        type: 'response',
        requestId,
        status,
        responseTime: `${responseTime}ms`,
        method: c.req.method,
        path: c.req.path,
        user: {
          id: userInfo.userId,
          username: userInfo.userName,
          role: userInfo.role,
        },
      }, `📤 CORS预检响应 (${status}) - ${responseTime}ms`)
    }
    else {
      // 记录响应信息
      pinoInstance.info({
        type: 'response',
        requestId,
        status,
        responseTime: `${responseTime}ms`,
        bodyType: responseBodyType,
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
        response: responseBody,
        user: {
          id: userInfo.userId,
          username: userInfo.userName,
          role: userInfo.role,
        },
      }, `📤 响应完成 (${status}) - ${responseTime}ms - ${responseBodyType}`)
    }

    // 如果是错误状态码，记录为错误（跳过 OPTIONS 请求）
    if (status >= 400 && c.req.method !== 'OPTIONS') {
      pinoInstance.error({
        type: 'error_response',
        requestId,
        status,
        responseTime: `${responseTime}ms`,
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
        user: {
          id: userInfo.userId,
          username: userInfo.userName,
          role: userInfo.role,
        },
      }, `❌ 请求失败 (${status})`)
    }
  }
}
