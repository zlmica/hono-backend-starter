import process from 'node:process'
import argon2 from 'argon2'
import { db } from '../src/db'
import { users } from '../src/db/schema'
import { hashPassword } from '../src/utils/crypto'

async function seed() {
  try {
    console.log('🌱 开始数据库种子初始化...')

    // 检查是否已存在管理员用户
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, 'admin'),
    })

    if (existingAdmin) {
      console.log('✅ 管理员用户已存在，跳过创建')
      return
    }

    // 创建管理员用户
    const feHashPassword = await hashPassword('admin123')
    const hashedPassword = await argon2.hash(feHashPassword)

    const adminUser = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      phone: '13800000000',
      role: 'admin',
      status: 'active',
    }).returning()

    console.log('✅ 管理员用户创建成功:', {
      id: adminUser[0].id,
      username: adminUser[0].username,
      name: adminUser[0].name,
      role: adminUser[0].role,
    })

    // 创建测试用户
    const feTestPassword = await hashPassword('123456')
    const testPassword = await argon2.hash(feTestPassword)

    const testUser = await db.insert(users).values({
      username: 'test',
      password: testPassword,
      name: '测试用户',
      phone: '13800138000',
      role: 'user',
      status: 'active',
    }).returning()

    console.log('✅ 测试用户创建成功:', {
      id: testUser[0].id,
      username: testUser[0].username,
      name: testUser[0].name,
      role: testUser[0].role,
    })

    console.log('🎉 数据库种子初始化完成！')
    console.log('\n📋 默认用户信息:')
    console.log('管理员 - 用户名: admin, 密码: admin123')
    console.log('测试用户 - 用户名: test, 密码: 123456')
  }
  catch (error) {
    console.error('❌ 数据库种子初始化失败:', error)
    process.exit(1)
  }
}

seed()
