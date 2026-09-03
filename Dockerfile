# -----------------------------------------------
# 阶段 1: 依赖安装与静态资源构建
# -----------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 优先复制依赖定义文件利用 Docker 缓存层
COPY package.json package-lock.json* ./

# 安装完整依赖
RUN npm install

# 复制源码
COPY . .

# 执行 Vite 生产构建
RUN npm run build

# -----------------------------------------------
# 阶段 2: 轻量 Nginx 生产环境服务 (仅 ~25MB)
# -----------------------------------------------
FROM nginx:alpine

# 复制自定义 Nginx 配置 (支持 SPA 路由与 Gzip 加速)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物到 Nginx 静态托管目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露容器内部端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
