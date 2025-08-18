export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = this.constructor.name
    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

export class AppConfigError extends AppError {
  constructor(message: string = '应用配置错误', details?: Record<string, any>) {
    super(message, 500, 'CONFIG_ERROR', details)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '参数验证失败', details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁', details?: Record<string, any>) {
    super(message, 429, 'RATE_LIMIT_ERROR', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问', details?: Record<string, any>) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问', details?: Record<string, any>) {
    super(message, 403, 'FORBIDDEN', details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在', details?: Record<string, any>) {
    super(message, 404, 'NOT_FOUND', details)
  }
}

export class BusinessError extends AppError {
  constructor(message: string = '业务错误', details?: Record<string, any>) {
    super(message, 410, 'BUSINESS_ERROR', details)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = '数据库操作失败', details?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', details)
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = '外部服务调用失败', details?: Record<string, any>) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details)
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = '请求超时', details?: Record<string, any>) {
    super(message, 408, 'TIMEOUT_ERROR', details)
  }
}
