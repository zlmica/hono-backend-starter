#!/bin/bash

# 服务器部署脚本

set -e

# 配置变量 (请根据实际情况修改)
SERVER_HOST="your-server-ip"
SERVER_USER="root"
SERVER_PATH="/var/www/hono-backend-starter"
SSH_KEY="~/.ssh/id_rsa"

echo "🚀 开始服务器部署..."

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 <服务器IP> [用户名] [部署路径]"
    echo "示例: $0 192.168.1.100 root /var/www/hono-backend-starter"
    exit 1
fi

SERVER_HOST=$1
SERVER_USER=${2:-root}
SERVER_PATH=${3:-/var/www/hono-backend-starter}

echo "📋 部署配置:"
echo "   服务器: $SERVER_USER@$SERVER_HOST"
echo "   路径: $SERVER_PATH"
echo ""

# 检查 SSH 连接
echo "🔌 检查 SSH 连接..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo "❌ 无法连接到服务器，请检查:"
    echo "   - SSH 密钥是否正确配置"
    echo "   - 服务器 IP 是否正确"
    echo "   - 用户名是否正确"
    exit 1
fi

echo "✅ SSH 连接正常"

# 创建部署包
echo "📦 创建部署包..."
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p $DEPLOY_DIR

# 复制必要文件
cp -r src/ $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp bun.lock $DEPLOY_DIR/
cp docker-compose.yml $DEPLOY_DIR/
cp Dockerfile $DEPLOY_DIR/
cp .dockerignore $DEPLOY_DIR/
cp scripts/deploy.sh $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/

# 创建生产环境配置
if [ -f ".env.production" ]; then
    cp .env.production $DEPLOY_DIR/
else
    echo "⚠️  警告: 未找到 .env.production 文件，将使用默认配置"
    cat > $DEPLOY_DIR/.env.production << EOF
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:password@postgres:5432/hono_db
JWT_SECRET=your-super-secret-production-jwt-key-change-this
RATE_LIMIT_MAX=100
EOF
fi

# 创建服务器安装脚本
cat > $DEPLOY_DIR/install.sh << 'EOF'
#!/bin/bash

set -e

echo "🔧 开始服务器安装..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker 安装完成，请重新登录或运行: newgrp docker"
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 创建日志目录
mkdir -p logs

# 设置权限
chmod +x deploy.sh

echo "✅ 服务器环境准备完成"
EOF

chmod +x $DEPLOY_DIR/install.sh

# 压缩部署包
echo "🗜️  压缩部署包..."
tar -czf $DEPLOY_DIR.tar.gz $DEPLOY_DIR/

# 上传到服务器
echo "📤 上传到服务器..."
scp $DEPLOY_DIR.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# 在服务器上执行部署
echo "🔧 在服务器上执行部署..."
ssh $SERVER_USER@$SERVER_HOST << EOF
set -e

echo "📦 解压部署包..."
cd /tmp
tar -xzf $DEPLOY_DIR.tar.gz

echo "📁 移动到部署目录..."
sudo mkdir -p $SERVER_PATH
sudo rm -rf $SERVER_PATH/*
sudo mv $DEPLOY_DIR/* $SERVER_PATH/
sudo chown -R $USER:$USER $SERVER_PATH

echo "🔧 运行安装脚本..."
cd $SERVER_PATH
./install.sh

echo "🐳 启动应用..."
./deploy.sh

echo "🧹 清理临时文件..."
rm -rf /tmp/$DEPLOY_DIR*
EOF

# 清理本地文件
rm -rf $DEPLOY_DIR $DEPLOY_DIR.tar.gz

echo ""
echo "🎉 服务器部署完成！"
echo ""
echo "📊 部署信息:"
echo "   服务器: $SERVER_USER@$SERVER_HOST"
echo "   应用地址: http://$SERVER_HOST:3000"
echo "   健康检查: http://$SERVER_HOST:3000/health"
echo ""
echo "🔧 服务器管理命令:"
echo "   SSH 连接: ssh $SERVER_USER@$SERVER_HOST"
echo "   查看日志: ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose logs -f app'"
echo "   重启服务: ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose restart'"
echo "   停止服务: ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose down'" 