import { zValidator } from '@hono/zod-validator'
import argon2 from 'argon2'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import z from 'zod'
import { db } from '../../db'
import { users } from '../../db/schema'
import env from '../../env'
import { createRouter } from '../../lib/create-app'

const router = createRouter()

// 登录schema
const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

router.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const { username, password } = await c.req.json()
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (!user) {
      return c.json({ message: '用户不存在' }, 400)
    }

    if (user.status === 'inactive') {
      return c.json({ message: '用户已禁用' }, 400)
    }

    const isPasswordValid = await argon2.verify(user.password, password)
    if (!isPasswordValid) {
      return c.json({ message: '密码错误' }, 400)
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
    }
    const token = await sign(payload, env.JWT_SECRET)
    c.var.logger.info('token generated successfully')
    const userWithoutPassword = { ...user, password: undefined }
    return c.json({ user: userWithoutPassword, token })
  },
)

export default router
