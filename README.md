# BurnCloud AIGC 内容生成与标识系统

符合国家《生成式人工智能服务管理暂行办法》及《网络安全标准实践指南——生成式人工智能服务内容标识方法》（TC260-PG-20241A）的 AIGC 综合生成与隐式/显式数字水印标识平台。

---

## 🚀 Docker Compose 快速安装与运行

本系统已预置生产级多阶段 Dockerfile 与 Docker Compose 配置文件，几秒内即可在本地或云服务器启动。

### 1. 确保服务器已安装 Docker 与 Docker Compose
- [Docker 官方安装指南](https://docs.docker.com/get-docker/)
- 验证指令：
  ```bash
  docker --version
  docker compose version
  ```

### 2. 一键构建并启动服务
在项目根目录下执行：
```bash
docker compose up -d --build
```
> 参数说明：
> - `-d`：后台静默运行
> - `--build`：拉取依赖并自动完成 Vite 生产打包

### 3. 访问系统
启动成功后，在浏览器直接打开：
```
http://localhost:3003
```
*(如部署在云服务器，请使用 `http://<服务器公网IP>:3003` 并确保安全组放行 3003 端口)*

> **网络提示**：本配置默认接入 `burncloud-proxy` 共享反向代理网络。如果该网络尚未创建，可先运行：
> ```bash
> docker network create burncloud-proxy
> ```

---

## ⚙️ 常用运维指令

| 操作 | 指令 |
| :--- | :--- |
| **查看运行状态** | `docker compose ps` |
| **查看实时日志** | `docker compose logs -f` |
| **停止服务** | `docker compose stop` |
| **重启服务** | `docker compose restart` |
| **停止并销毁容器** | `docker compose down` |
| **更新代码后重构** | `git pull && docker compose up -d --build` |

---

## 🔧 自定义端口配置

默认使用 `3003` 端口映射。如需更换主机端口（如改为 `80` 或 `8080`）：

### 方式一：临时指定环境变量启动
```bash
PORT=8080 docker compose up -d
```

### 方式二：直接修改 `docker-compose.yml`
```yaml
ports:
  - "8080:80"  # 将 8080 改为您期望的主机端口
```

---

## 📦 架构说明
- **前端框架**：React 19 + TypeScript + Vite + Tailwind CSS
- **容器镜像**：采用 Node 20 编译 + Nginx Alpine 托管（多阶段构建，镜像体积仅 ~25MB）
- **性能优化**：Nginx 已开启 Gzip 压缩与静态资源 1 年长效缓存，集成 SPA 路由重定向
- **接口支持**：开箱即用免密直连、硅基流动 (SiliconFlow)、智谱 AI (BigModel)、Pollinations AI 等
