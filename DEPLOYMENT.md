# 部署指南

## 快速部署

### 1. 本地部署 (开发/测试)

```bash
# 一键部署到本地 Docker
bun run deploy
```

### 2. 服务器部署 (生产环境)

#### 准备工作

1. **准备服务器**
   - 确保服务器有公网 IP
   - 确保 SSH 密钥已配置
   - 确保服务器可以访问外网

2. **准备环境变量** (可选)
   ```bash
   # 创建生产环境配置
   cp .env.production.example .env.production
   # 编辑 .env.production 文件，设置生产环境变量
   ```

#### 一键部署到服务器

```bash
# 部署到服务器 (使用默认配置)
bun run deploy:server <服务器IP>

# 示例
bun run deploy:server 192.168.1.100

# 指定用户名和路径
bun run deploy:server 192.168.1.100 root /var/www/live-management-be
```

#### 部署过程

脚本会自动执行以下步骤：

1. ✅ **检查连接**: 验证 SSH 连接
2. 📦 **打包代码**: 创建部署包
3. 📤 **上传文件**: 上传到服务器
4. 🔧 **安装环境**: 自动安装 Docker 和 docker-compose
5. 🐳 **启动服务**: 启动应用和数据库
6. 🏥 **健康检查**: 验证服务状态

## 部署配置

### 环境变量配置

创建 `.env.production` 文件：

```bash
# 环境配置
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# 数据库配置
DATABASE_URL=postgresql://postgres:password@postgres:5432/hono_db

# JWT 配置 (生产环境请使用强密钥)
JWT_SECRET=your-super-secret-production-jwt-key

# 限流配置
RATE_LIMIT_MAX=100
```

### 服务器要求

- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+)
- **内存**: 最少 2GB RAM
- **存储**: 最少 10GB 可用空间
- **网络**: 公网访问权限

## 服务管理

### 查看服务状态

```bash
# SSH 到服务器
ssh root@<服务器IP>

# 查看服务状态
cd /var/www/live-management-be
docker-compose ps
```

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f postgres
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart app
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 更新部署

```bash
# 重新部署 (会重新构建镜像)
docker-compose up -d --build
```

## 监控和维护

### 健康检查

应用提供健康检查端点：

```bash
# 检查应用健康状态
curl http://<服务器IP>:3000/health

# 详细健康检查
curl http://<服务器IP>:3000/health/detailed
```

### 资源监控

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h
```

### 备份数据库

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres hono_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres hono_db < backup.sql
```

## 故障排除

### 常见问题

1. **端口被占用**

   ```bash
   # 检查端口占用
   netstat -tlnp | grep :3000

   # 修改端口 (编辑 docker-compose.yml)
   ports:
     - "8080:3000"  # 改为 8080 端口
   ```

2. **内存不足**

   ```bash
   # 查看内存使用
   free -h

   # 调整资源限制 (编辑 docker-compose.yml)
   deploy:
     resources:
       limits:
         memory: 512M  # 减少内存限制
   ```

3. **数据库连接失败**

   ```bash
   # 检查数据库状态
   docker-compose logs postgres

   # 重启数据库
   docker-compose restart postgres
   ```

### 日志分析

```bash
# 查看应用错误日志
docker-compose logs app | grep ERROR

# 查看最近的日志
docker-compose logs --tail=100 app
```

## 安全建议

1. **修改默认密码**: 修改数据库密码和 JWT 密钥
2. **防火墙配置**: 只开放必要端口 (3000, 5432)
3. **SSL 证书**: 配置 HTTPS (推荐使用 Nginx 反向代理)
4. **定期备份**: 设置数据库自动备份
5. **监控告警**: 配置服务监控和告警

## 扩展部署

### 负载均衡

可以使用 Nginx 或 HAProxy 进行负载均衡：

```nginx
upstream app_servers {
    server 192.168.1.100:3000;
    server 192.168.1.101:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 集群部署

可以使用 Docker Swarm 或 Kubernetes 进行集群部署。
