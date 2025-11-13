# 🚀 Vercel 部署指南

本文档将指导你如何将 App Review Analyzer 部署到 Vercel。

## 📋 前提条件

1. **Vercel 账号** - 注册 [vercel.com](https://vercel.com)
2. **PostgreSQL 数据库** - 推荐使用：
   - [Supabase](https://supabase.com) (免费)
   - [Neon](https://neon.tech) (免费)
   - [Railway](https://railway.app) (免费试用)
   - Vercel Postgres (付费)

## 🔧 步骤 1: 准备数据库

### 选项 A: 使用 Supabase (推荐)

1. 访问 [supabase.com](https://supabase.com) 并创建账号
2. 创建新项目
3. 等待数据库初始化完成
4. 进入 `Settings` → `Database`
5. 找到 `Connection String` → `URI`
6. 复制连接字符串（格式类似）：
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

### 选项 B: 使用 Neon

1. 访问 [neon.tech](https://neon.tech) 并创建账号
2. 创建新项目
3. 复制 `Connection String`

## 🚀 步骤 2: 部署到 Vercel

### 方法 1: 通过 Vercel Dashboard (推荐)

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 `Add New...` → `Project`
   - 选择你的 GitHub 仓库
   - 点击 `Import`

3. **配置环境变量**
   
   在 `Environment Variables` 部分添加以下变量：

   **必需变量** ⚠️
   ```bash
   # 数据库连接 (从步骤1获取)
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   
   # JWT 密钥 (生成一个随机字符串)
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
   
   # 应用 URL
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```

   **可选变量** (推荐配置)
   ```bash
   # OpenRouter API (AI 分析)
   OPENROUTER_API_KEY=sk-or-v1-your-api-key
   
   # Stripe 支付 (如需付费功能)
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_public_key
   
   # 邮件服务 (通知功能)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **部署**
   - 点击 `Deploy`
   - 等待构建完成（约 2-5 分钟）

### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 按提示配置项目
# 选择: Link to existing project? No
# 输入项目名称
# 选择目录: ./
# 覆盖设置? No
```

## 🗄️ 步骤 3: 初始化数据库

部署成功后，需要初始化数据库：

### 方法 1: 使用 Vercel CLI (推荐)

```bash
# 连接到 Vercel 项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 推送数据库架构
npx prisma db push

# (可选) 查看数据库
npx prisma studio
```

### 方法 2: 通过 Vercel Dashboard

1. 进入项目 → `Settings` → `General`
2. 找到 `Build & Development Settings`
3. 添加 Build Command:
   ```bash
   prisma generate && prisma db push --accept-data-loss && next build
   ```
   ⚠️ **注意**: 只在首次部署时使用，之后改回 `npm run vercel-build`

4. 重新部署：
   - 进入 `Deployments`
   - 点击最新部署的 `...` → `Redeploy`

## ✅ 步骤 4: 验证部署

1. **检查应用是否运行**
   ```bash
   # 访问你的应用 URL
   https://your-app-name.vercel.app
   ```

2. **测试数据库连接**
   - 尝试注册一个账号
   - 尝试分析一个应用

3. **检查 API 健康状态**
   ```bash
   curl https://your-app-name.vercel.app/api/health
   ```

## 🐛 常见问题排查

### 问题 1: "Failed to collect page data"

**原因**: 构建时数据库未配置或连接失败

**解决方案**: 
- ✅ 已修复：我们已在 API 路由中添加了错误处理
- 确保 `DATABASE_URL` 环境变量已正确配置
- 在 Vercel Dashboard 中检查构建日志

### 问题 2: "Prisma Client initialization error"

**原因**: Prisma 未生成客户端

**解决方案**:
```bash
# 在 vercel.json 中添加
{
  "buildCommand": "prisma generate && next build"
}
```

### 问题 3: 数据库连接超时

**原因**: 
- 数据库 URL 错误
- 数据库防火墙阻止 Vercel IP

**解决方案**:
- 检查数据库 URL 格式
- 在数据库服务商处允许所有 IP (0.0.0.0/0)
- Supabase: 默认允许所有连接
- Neon: 在 `Settings` 中启用 `Allow all IPs`

### 问题 4: "Module not found: Can't resolve '@prisma/client'"

**原因**: Prisma Client 未安装

**解决方案**:
- 确保 `package.json` 中包含 `@prisma/client`
- 在 Vercel 中触发重新部署

### 问题 5: 环境变量未生效

**原因**: 环境变量配置后需要重新部署

**解决方案**:
1. 修改环境变量后
2. 进入 `Deployments` → 点击 `...` → `Redeploy`
3. ✅ 勾选 `Use existing Build Cache` 可加快速度

## 🔒 安全建议

1. **使用强密码**
   ```bash
   # 生成 JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **启用 HTTPS**
   - Vercel 默认启用，无需配置

3. **配置域名**
   - 在 Vercel Dashboard → `Settings` → `Domains`
   - 添加自定义域名

4. **环境变量分离**
   - Production: 使用生产环境的 API 密钥
   - Preview: 使用测试环境的 API 密钥

## 📊 监控和日志

### 查看日志

1. **实时日志**
   ```bash
   vercel logs your-app-name --follow
   ```

2. **Dashboard 日志**
   - 进入 `Deployments`
   - 点击部署 → `Building` 或 `Runtime Logs`

### 性能监控

1. 在 Vercel Dashboard 查看：
   - `Analytics` - 页面访问量
   - `Speed Insights` - 性能指标
   - `Web Vitals` - 用户体验指标

## 🔄 更新部署

### 自动部署

- 推送到 `main` 分支会自动触发部署
- 推送到其他分支会创建预览部署

### 手动部署

```bash
# 部署到生产环境
vercel --prod

# 创建预览部署
vercel
```

## 📦 推荐的 Vercel 配置

创建 `vercel.json`:

```json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🎯 下一步

部署成功后：

1. ✅ 测试应用功能
2. ✅ 配置自定义域名
3. ✅ 设置 Stripe Webhook (如需支付功能)
4. ✅ 配置邮件服务
5. ✅ 启用分析和监控

## 🆘 需要帮助？

- 📖 [Next.js 文档](https://nextjs.org/docs)
- 📖 [Vercel 文档](https://vercel.com/docs)
- 📖 [Prisma 文档](https://www.prisma.io/docs)

---

**祝部署顺利！🎉**

