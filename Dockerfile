# syntax=docker/dockerfile:1

# ══════════════════════════════════════════════════════════════
# notblog-ui 前端镜像（Vue3 + Vue CLI）
# 构建命令（在解决方案根目录 f:\NotBlog 下执行）：
#   docker build -f notblog-ui/Dockerfile -t notblog/notblog-ui .
# ══════════════════════════════════════════════════════════════

# ── 构建阶段：Node 环境执行 npm run build ──
FROM node:22-alpine AS build
WORKDIR /app

# 1) 依赖清单先 COPY（利用 Docker 层缓存，源码变更不重复 npm ci）
COPY notblog-ui/package.json notblog-ui/package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) 复制源码（node_modules 已在根 .dockerignore 中排除）
COPY notblog-ui/ ./

# 3) 构建（vue-cli-service build → dist/，ts-loader 已配置 transpileOnly）
RUN npm run build

# ── 运行时阶段：nginx 托管静态资源 + 反向代理到网关 ──
FROM nginx:1.27-alpine AS final

# 前端静态资源（Vue CLI 构建产物）
COPY --from=build /app/dist /usr/share/nginx/html

# nginx 站点配置（模板：GATEWAY_UPSTREAM 由 nginx 官方 entrypoint 用 envsubst 渲染）
COPY notblog-ui/nginx.conf.template /etc/nginx/templates/default.conf.template

# 网关上游地址：docker compose 网络内为 notblog-yarp-gateway:8085（nginx 启动即解析该主机名，
# 因此独立 docker run 时必须覆盖为本机可达地址，例如：
#   docker run -p 8088:80 -e GATEWAY_UPSTREAM=host.docker.internal:5000 notblog/notblog-ui
ENV GATEWAY_UPSTREAM=notblog-yarp-gateway:8085

EXPOSE 80