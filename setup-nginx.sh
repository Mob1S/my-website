#!/bin/bash
# MOB1S Nginx 一键配置脚本（兼容宝塔面板）
# 用法: sudo bash setup-nginx.sh [域名] [项目路径]
# 示例: sudo bash setup-nginx.sh 47.98.126.250 /www/wwwroot/mob1s

set -e

DOMAIN=${1:-"_"}
ROOT=${2:-"$(cd "$(dirname "$0")" && pwd)"}

echo "=== MOB1S Nginx 配置 ==="
echo "域名: $DOMAIN"
echo "项目路径: $ROOT"
echo ""

# 自动检测 Nginx 配置目录（兼容宝塔 / Ubuntu / CentOS）
if [ -d "/www/server/panel/vhost/nginx" ]; then
    CONF_DIR="/www/server/panel/vhost/nginx"
elif [ -d "/etc/nginx/sites-available" ]; then
    CONF_DIR="/etc/nginx/sites-available"
elif [ -d "/etc/nginx/conf.d" ]; then
    CONF_DIR="/etc/nginx/conf.d"
else
    echo "错误: 找不到 Nginx 配置目录"
    exit 1
fi

CONF_FILE="$CONF_DIR/mob1s.conf"
echo "Nginx 配置目录: $CONF_DIR"
echo "配置文件: $CONF_FILE"
echo ""

# 写入 Nginx 配置
cat > "$CONF_FILE" << NGINX
upstream mob1s_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/event-stream;
    gzip_min_length 1024;

    root $ROOT;

    location = /api/health {
        proxy_pass http://mob1s_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        access_log off;
    }

    location /api/ {
        proxy_pass http://mob1s_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 120s;
    }

    location / {
        try_files \$uri \$uri/ @backend;
    }

    location @backend {
        proxy_pass http://mob1s_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
NGINX

echo "配置已写入: $CONF_FILE"

# 测试并重载
nginx -t
systemctl reload nginx || nginx -s reload

echo ""
echo "=== Nginx 配置完成 ==="
echo "验证: curl http://localhost/api/health"
echo "应该返回: {\"status\":\"ok\",...}"
