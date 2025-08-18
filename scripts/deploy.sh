#!/bin/bash

# Docker 生产环境部署脚本

set -e

echo "🚀 开始 Docker 生产环境部署..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: docker-compose 未安装"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo "❌ 错误: 缺少 .env.production 文件"
    echo "请创建 .env.production 文件并设置生产环境变量"
    exit 1
fi

echo "✅ 环境检查完成"

# 创建日志目录
mkdir -p logs

echo "🐳 开始 Docker 部署..."

# 停止并删除旧容器
echo "🔄 清理旧容器..."
docker-compose down --remove-orphans 2>/dev/null || true

# 构建并启动服务
echo "📦 构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🏥 检查健康状态..."
if docker-compose exec -T app curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ 应用健康检查通过"
else
    echo "⚠️  应用健康检查失败，但容器正在运行"
fi

echo ""
echo "🎉 Docker 部署完成！"
echo ""
echo "📊 服务信息:"
echo "   - 应用地址: http://localhost:3000"
echo "   - 健康检查: http://localhost:3000/health"
echo "   - 数据库: localhost:5432"
echo ""
echo "🔧 常用命令:"
echo "   - 查看日志: docker-compose logs -f app"
echo "   - 停止服务: docker-compose down"
echo "   - 重启服务: docker-compose restart"
echo "   - 更新部署: docker-compose up -d --build" 