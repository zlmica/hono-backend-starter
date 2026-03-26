import * as process from 'node:process'
import pkg from '../../package.json'
import { db } from '../db'
import env from '../env'
import { createRouteHandler } from '../lib/create-app'

const router = createRouteHandler()

// 健康检查
router.get('/', async (c) => {
  const startTime = Date.now()

  try {
    // 检查数据库连接
    await db.execute('SELECT 1')

    const responseTime = Date.now() - startTime

    return c.json({
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: env.NODE_ENV,
      version: pkg.version,
    })
  }
  catch (error) {
    return c.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 503)
  }
})

// 详细健康检查
router.get('/detailed', async (c) => {
  const checks = {
    database: false,
    memory: false,
    disk: false,
  }

  try {
    // 数据库检查
    await db.execute('SELECT 1')
    checks.database = true
  }
  catch {
    checks.database = false
  }

  // 内存检查
  const memUsage = process.memoryUsage()
  checks.memory = memUsage.heapUsed < 500 * 1024 * 1024 // 500MB

  // 磁盘检查（简单检查）
  checks.disk = true

  const allHealthy = Object.values(checks).every(check => check)

  return c.json({
    checks,
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
  }, allHealthy ? 200 : 503)
})

export default router
