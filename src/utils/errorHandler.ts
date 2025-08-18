import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HTTPException } from 'hono/http-exception'
import env from '../env'
import { AppError } from './errors'

interface ErrorResponse {
  code: number
  msg: string
  data?: any
}

export function errorHandler(error: Error, c: Context) {
  let response: ErrorResponse = {
    code: 500,
    msg: '服务器内部错误',
  }

  if (error instanceof HTTPException) {
    response = {
      code: error.status,
      msg: error.message,
    }
  }
  else if (error instanceof AppError) {
    response = {
      code: error.statusCode,
      msg: error.message,
    }
  }
  else {
    response.msg = error.message || '服务器内部错误'
  }

  // 在开发环境下显示错误栈信息
  if (env.NODE_ENV === 'development') {
    response.data = {
      stack: error.stack,
      name: error.name,
    }
  }

  return c.json({
    code: response.code,
    msg: response.msg,
    data: response.data,
  }, response.code as number as ContentfulStatusCode)
}
