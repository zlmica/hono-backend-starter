import { createRouter } from '../lib/create-app'

const router = createRouter()

router.get('/', (c) => {
  return c.json({
    message: 'Hello Hono!',
  })
})

export default router
