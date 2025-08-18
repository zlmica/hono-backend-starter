import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import env from '../env'
import * as schema from './schema'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(pool, { schema })

// 运行迁移
export async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('数据库迁移完成')
  }
  catch (error) {
    console.error('数据库迁移失败:', error)
  }
}
