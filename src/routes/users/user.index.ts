import type { NewUser, User } from '../../db/schemas/user'
import { zValidator } from '@hono/zod-validator'
import argon2 from 'argon2'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '../../db'
import { userInsertSchema, users, userUpdateSchema, userUpdateSelfSchema } from '../../db/schemas/user'
import { createRouter } from '../../lib/create-app'

import { paginatedQuery, validatePaginationQuery } from '../../utils/pagination'
import { getCurrentUserId, isAdmin } from '../../utils/user'

const router = createRouter()

// 用户列表查询
router.get('/', async (c) => {
  const query = c.req.query()
  const { page, limit, name } = validatePaginationQuery(query)

  const offset = (page - 1) * limit

  // 使用简单分页查询函数，业务逻辑由业务代码处理
  const response = await paginatedQuery(
    c,
    // 查询函数 - 业务代码负责具体的查询逻辑
    async (tx) => {
      const users = await tx.query.users.findMany({
        limit,
        offset,
        where: name ? (fields, { like }) => like(fields.name, `%${name}%`) : undefined,
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      })
      // 过滤掉密码字段
      return users.map(({ password: _password, ...user }: User) => user)
    },
    // 计数函数 - 业务代码负责具体的计数逻辑
    async (tx) => {
      return await tx.query.users.findMany({
        where: name ? (fields, { like }) => like(fields.name, `%${name}%`) : undefined,
      }).then((users: User[]) => users.length)
    },
    page,
    limit,
    // 前置事件 - 可选，在查询前执行一些预处理逻辑
    // async (_tx) => {
    //   // 例如：记录查询日志、更新统计信息、权限检查等
    //   console.log('执行前置事件：用户列表查询')
    //   // await tx.query.logs.insert({ action: 'user_list_query', userId: getCurrentUserId(c) })
    // },
  )

  return c.json(response)
})

// 管理员创建用户
router.post('/', zValidator('json', userInsertSchema), async (c) => {
  if (!isAdmin(c)) {
    return c.json({ message: '无权限' }, 403)
  }

  const { username, password, name, phone } = await c.req.json()

  const hasUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  })

  if (hasUser) {
    return c.json({ message: '用户已存在' }, 400)
  }

  const hasPhone = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  })
  if (hasPhone) {
    return c.json({ message: '手机号已存在' }, 400)
  }

  const hashedPassword = await argon2.hash(password)

  const userData: any = {
    username,
    password: hashedPassword,
    name,
    phone,
  }

  const [user] = await db.insert(users).values(userData).returning()
  const userWithoutPassword = { ...user, password: undefined }
  return c.json(userWithoutPassword, 201)
})

// 管理员修改用户
router.patch('/:id', zValidator('json', userUpdateSchema), async (c) => {
  if (!isAdmin(c)) {
    return c.json({ message: '无权限' }, 403)
  }

  const { id } = c.req.param()
  if (!id)
    return c.json({ message: '用户ID不能为空' }, 400)

  // 查询用户是否存在
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(id)),
  })

  if (!user)
    return c.json({ message: '用户不存在' }, 404)

  const { username, password, name, phone, status } = await c.req.json()

  // 构建更新对象，只包含传入的字段
  const updateData: Partial<NewUser> = {}

  if (username !== undefined) {
    // 检查用户名是否已被其他用户使用（排除当前用户）
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.username, username),
        ne(users.id, Number(id)),
      ),
    })
    if (existingUser) {
      return c.json({ message: '用户名已存在' }, 400)
    }
    updateData.username = username
  }

  if (password !== undefined) {
    // 如果传入了密码，需要加密
    updateData.password = await argon2.hash(password)
  }

  if (name !== undefined) {
    updateData.name = name
  }

  if (phone !== undefined) {
    // 检查手机号是否已被其他用户使用（排除当前用户）
    const existingPhone = await db.query.users.findFirst({
      where: and(
        eq(users.phone, phone),
        ne(users.id, Number(id)),
      ),
    })
    if (existingPhone) {
      return c.json({ message: '手机号已存在' }, 400)
    }
    updateData.phone = phone
  }

  if (status !== undefined) {
    // 验证状态值是否有效
    const validStatuses = ['active', 'inactive']
    if (!validStatuses.includes(status)) {
      return c.json({ message: '无效的状态值，只能是: active, inactive' }, 400)
    }
    updateData.status = status
  }

  // 如果没有要更新的字段，直接返回当前用户信息
  if (Object.keys(updateData).length === 0) {
    const userWithoutPassword = { ...user, password: undefined }
    return c.json(userWithoutPassword)
  }

  // 执行更新
  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, Number(id)))
    .returning()

  // 返回更新后的用户信息（不包含密码）
  const userWithoutPassword = { ...updatedUser, password: undefined }
  return c.json(userWithoutPassword)
})

// 用户修改自己的信息
router.patch('/', zValidator('json', userUpdateSelfSchema), async (c) => {
  const userId = getCurrentUserId(c)
  if (!userId)
    return c.json({ message: '用户未登录' }, 401)

  const { name, password, phone } = await c.req.json()

  if (!name && !password && !phone)
    return c.json({ message: '没有需要更新的字段' }, 400)

  const updateData: Partial<NewUser> = {}
  if (name !== undefined) {
    updateData.name = name
  }
  if (password !== undefined) {
    updateData.password = await argon2.hash(password)
  }
  if (phone !== undefined) {
    updateData.phone = phone
  }

  const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning()
  const userWithoutPassword = { ...updatedUser, password: undefined }
  return c.json(userWithoutPassword)
})

export default router
