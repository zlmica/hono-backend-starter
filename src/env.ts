import process from 'node:process'
import { z } from 'zod'

// 根据环境加载对应的 .env 文件
function loadEnvFile() {
  const nodeEnv = process.env.NODE_ENV || 'development'

  // Bun 会自动按优先级加载环境变量文件：
  // 1. .env.local (最高优先级，本地覆盖)
  // 2. .env.{NODE_ENV} (环境特定配置)
  // 3. .env (默认配置)

  console.log(`🌍 加载环境配置: ${nodeEnv}`)
}

// 在解析环境变量之前加载配置
loadEnvFile()

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL 是必需的'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET 至少需要32个字符'),
  RATE_LIMIT_MAX: z.coerce.number().min(1).max(10000).default(100),
  API_PREFIX: z.string().default(''),
})

export type Env = z.infer<typeof EnvSchema>

const { data: envData, error } = EnvSchema.safeParse(process.env)

if (error) {
  console.error('❌ 环境变量配置错误:')
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
  console.error('请检查 .env 文件配置')
  process.exit(1)
}

// 验证生产环境必需配置
if (envData.NODE_ENV === 'production') {
  const requiredForProd = ['JWT_SECRET', 'DATABASE_URL']
  const missing = requiredForProd.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error('❌ 生产环境缺少必需的环境变量:', missing.join(', '))
    process.exit(1)
  }
}

export default envData!
