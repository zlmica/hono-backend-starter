import { eq } from 'drizzle-orm'
import { bearerAuth } from 'hono/bearer-auth'
import { verify } from 'hono/jwt'
import { db } from '../db'
import { users } from '../db/schema'
import env from '../env'
import { awaitTo } from '../utils/awaitTo'
import { UnauthorizedError } from '../utils/errors'

export const authMiddleware = bearerAuth({
  verifyToken: async (token, c) => {
    const [err, payload] = await awaitTo(verify(token, env.JWT_SECRET))
    if (err) {
      throw new UnauthorizedError('无效的token')
    }
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new UnauthorizedError('token已过期')
    }
    if (payload.id) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, Number(payload.id) as number),
      })
      if (user) {
        // 将 user 对象存储在 context 中
        c.set('user', user)
        return true
      }
    }
    throw new UnauthorizedError()
  },
  noAuthenticationHeaderMessage: () => {
    throw new UnauthorizedError('未提供token')
  },
})
