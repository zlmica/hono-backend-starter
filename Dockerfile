# 使用官方 Bun 镜像
FROM oven/bun:1-slim

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bun -u 1001

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 bun.lock
COPY package.json bun.lock ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs && chown -R bun:nodejs /app

# 切换到非 root 用户
USER bun

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用 (Bun 可以直接运行 TypeScript)
CMD ["bun", "run", "start"] 