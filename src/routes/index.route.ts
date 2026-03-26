import { createRouteHandler } from '../lib/create-app'

const router = createRouteHandler()

router.get('/', (c) => {
  return c.json({
    message: 'Hello Hono!',
  })
})

export default router
