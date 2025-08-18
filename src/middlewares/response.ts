import type { Context, Next } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

// 使用中间件，把所有接口返回格式统一一下

export interface ResponseWrapper {
  code: number
  msg: string
  data: any
}

interface ResponseBody {
  message?: string
  msg?: string
  code?: number
  [key: string]: any
}

export async function responseWrapper(c: Context, next: Next) {
  await next()

  const response = c.res.clone()
  const status = response.status
  const contentType = response.headers.get('Content-Type')

  // 跳过 HTML 响应和已经包装的响应
  if (contentType?.includes('text/html') || contentType?.includes('application/json')) {
    const body = contentType?.includes('application/json')
      ? await response.json()
      : await response.text()

    // 如果已经是包装格式，直接返回
    if (typeof body === 'object' && 'code' in body && 'msg' in body) {
      // 存储响应数据供日志使用
      c.set('responseData', body)
      return
    }

    // 如果是 HTML，直接返回
    if (contentType?.includes('text/html')) {
      return
    }

    const {
      message = '',
      msg = message,
      code = status,
      ...rest
    } = (typeof body === 'object' ? body : {}) as ResponseBody

    const wrappedResponse: ResponseWrapper = {
      code,
      msg,
      // 使用 Object.keys 判断剩余属性是否为空
      data: Object.keys(rest).length ? rest : null,
    }

    // 存储响应数据供日志使用
    c.set('responseData', wrappedResponse)

    c.res = c.json(wrappedResponse, response.status as number as ContentfulStatusCode)
  }
}
