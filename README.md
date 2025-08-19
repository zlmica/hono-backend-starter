# Hono Backend

一个基于 Hono + TypeScript + PostgreSQL 的系统后端。

## 技术栈

- **框架**: Hono
- **语言**: TypeScript
- **数据库**: PostgreSQL + Drizzle ORM
- **包管理器**: Bun
- **代码检查**: ESLint (@antfu/eslint-config)

## 开发环境设置

1. 克隆项目

```bash
git clone https://github.com/zlmica/hono-backend-starter.git
cd hono-backend-starter
```

2. 安装依赖

```bash
bun install
```

3. 配置环境变量

```bash
cp env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

4. 启动 PostgreSQL 数据库

```bash
# 使用 Docker Compose 启动 PostgreSQL
docker-compose up postgres -d
```

5. 初始化数据库

```bash
# 执行数据库迁移，创建表结构
bun run db:migrate

# 可选：填充测试数据
bun run db:seed
```

6. 启动开发服务器

```bash
bun run dev
```

## Git 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交类型

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD相关
- `build`: 构建系统或外部依赖的变动
- `revert`: 回滚之前的提交

### 使用方式

#### 1. 使用 commitizen（推荐）

```bash
bun run commit
```

这会启动交互式提交界面，引导你填写符合规范的提交信息。

#### 2. 手动提交

```bash
git commit -m "feat: 添加新功能"
```

### 代码检查

项目配置了自动代码检查：

- **pre-commit**: 提交前自动运行 ESLint 检查
- **commit-msg**: 验证提交消息格式

手动运行代码检查：

```bash
# 检查代码
bun run lint

# 自动修复可修复的问题
bun run lint:fix
```

## 数据库操作

```bash
# 生成迁移文件
bun run db:generate

# 执行迁移
bun run db:migrate

# 打开数据库管理界面
bun run db:studio
```

## 部署

```bash
# 本地部署
bun run deploy

# 服务器部署
bun run deploy:server
```

## 项目结构

```
src/
├── app.ts              # 应用主文件
├── index.ts            # 入口文件
├── env.ts              # 环境变量配置
├── db/                 # 数据库相关
│   ├── index.ts        # 数据库连接
│   ├── schema.ts       # 数据库模式
│   └── schemas/        # 表结构定义
├── lib/                # 工具库
├── middlewares/        # 中间件
├── routes/             # 路由
└── utils/              # 工具函数
```

## 详细文档

- [部署指南](./DEPLOYMENT.md)
