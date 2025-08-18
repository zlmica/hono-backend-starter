import createApp from './lib/create-app'
import { authMiddleware } from './middlewares/auth'
import health from './routes/health.route'
import index from './routes/index.route'
import auth from './routes/users/auth.index'
import users from './routes/users/user.index'

const app = createApp()

// 挂载到不同的路径前缀，避免中间件冲突
app.route('/', index) // 根路由
app.route('/auth', auth) // 认证相关接口（不需要 token）
app.route('/health', health) // 健康检查（不需要 token）

// 认证中间件
app.use(authMiddleware)

// 需要认证的接口
app.route('/users', users)

export default app
