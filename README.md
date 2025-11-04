# 📱 App Review Analyzer

> AI驱动的应用评论分析工具，支持 iOS App Store 和 Android Google Play

**快速分析应用评论，挖掘用户真实需求，洞察竞品优劣势**

---

## ✨ 核心功能

- 🤖 **AI 智能分析** - 使用 Claude/GPT-4 深度分析用户评论
- 📊 **双平台支持** - iOS App Store + Android Google Play
- 🔍 **深度洞察** - 高频需求、关键问题、情感分析、SWOT对比
- 🌍 **多语言支持** - 自动识别并分析任何语言的评论
- 📈 **可视化展示** - 清晰的数据可视化和报告生成
- ⚡ **智能缓存** - 24小时内自动复用分析结果

---

## 🚀 5分钟快速上手

### 1️⃣ 环境要求

- **Node.js** 18+ 
- **PostgreSQL** 数据库（推荐 Supabase）
- **OpenRouter** API Key（支持多种 AI 模型）

### 2️⃣ 快速安装

```bash
# 克隆项目
git clone <your-repo-url>
cd app-review-analyzer

# 安装依赖（使用国内镜像）
npm config set registry https://registry.npmmirror.com
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入：
# - DATABASE_URL（Supabase 连接串）
# - OPENROUTER_API_KEY（AI 模型密钥）

# 初始化数据库
npx prisma db push
npx prisma generate

# 启动开发服务器
npm run dev
```

### 3️⃣ 打开浏览器

访问 **http://localhost:3000**

---

## 📖 完整文档

### 新手必读 ⭐
1. **[开发指南.md](./开发指南.md)** - 完整的安装、配置、测试、问题解决
   - 详细安装步骤
   - 环境配置说明
   - 常见问题解决
   - 测试指南

### 进阶阅读
2. **[技术说明.md](./技术说明.md)** - 技术架构和设计细节
   - URL 策略（SEO 优化）
   - AI 模型配置
   - 数据库设计
   - API 接口说明

3. **[功能规划.md](./功能规划.md)** - 完整功能路线图 ⭐ 新增
   - 已实现功能清单
   - 待开发功能详解
   - 开发时间表
   - 优先级矩阵

4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 项目结构说明

---

## 🎯 当前状态

### ✅ 已实现功能（MVP）

- ✅ iOS App Store 评论抓取（RSS Feed）
- ✅ Android Google Play 评论抓取（google-play-scraper）
- ✅ AI 智能分析（OpenRouter）
- ✅ 情感分析（正面/中性/负面）
- ✅ 关键问题提取
- ✅ 功能需求识别
- ✅ 优先级建议
- ✅ 评论筛选和分页
- ✅ SEO 友好的 URL（`/analysis/instagram-ios`）
- ✅ 智能缓存（24小时复用）

### 🚧 开发中功能

- 🚧 竞品对比分析
- 🚧 用户系统（登录/注册）
- 🚧 数据导出（PDF/Excel）
- 🚧 订阅付费（Stripe）

---

## 🧪 快速测试

### 测试 iOS（推荐）

```
1. 打开 http://localhost:3000
2. 输入：https://apps.apple.com/us/app/instagram/id389801252
3. 点击 "Start Analysis"
4. 等待分析完成（30-60秒）
5. 查看结果：/analysis/instagram-ios
```

### 测试 Android

**⚠️ 注意：** 如果在中国大陆，Android 测试可能失败（Google Play 被封锁）

**解决方案：**
1. 使用 VPN/代理
2. 或部署到 Vercel（推荐）
3. 或使用 SerpApi

详见 **[开发指南.md - Google Play 访问问题](./开发指南.md#google-play-访问问题)**

---

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide Icons** - 图标库

### 后端
- **Next.js API Routes** - 服务端接口
- **Prisma** - ORM
- **PostgreSQL** - 数据库

### AI & 数据
- **OpenRouter** - AI 模型聚合平台
- **google-play-scraper** - Google Play 数据抓取
- **RSS Parser** - App Store 评论抓取

### 部署
- **Vercel** - 前端托管（推荐）
- **Supabase** - 数据库托管

---

## 💰 成本估算

### 开发阶段（测试）
- **数据库**: Supabase 免费版（500MB）
- **AI 分析**: OpenRouter ~$5/月（测试用）
- **托管**: Vercel 免费版
- **总计**: ~$5/月

### 生产环境（100用户/天）
- **数据库**: Supabase $25/月
- **AI 分析**: OpenRouter ~$150/月
- **托管**: Vercel 免费版
- **总计**: ~$175/月

---

## 🐛 遇到问题？

### 常见问题

1. **数据库连接失败**
   - 检查 `.env.local` 中的 `DATABASE_URL`
   - 确保使用 Supabase Session Pooler
   - 详见 [开发指南.md](./开发指南.md#数据库配置)

2. **Google Play 抓取失败**
   - 在中国大陆需要 VPN 或使用 SerpApi
   - 详见 [开发指南.md](./开发指南.md#google-play-访问问题)

3. **AI 分析失败**
   - 检查 `OPENROUTER_API_KEY` 是否正确
   - 确认账户余额充足

### 完整问题解决指南

查看 **[开发指南.md - 常见问题](./开发指南.md#常见问题)**

---

## 📞 支持与反馈

- **问题反馈**: [提交 Issue](https://github.com/your-repo/issues)
- **功能建议**: [讨论区](https://github.com/your-repo/discussions)
- **技术方案**: 查看 `d:\Project code\AppStore评论分析工具-技术方案.md`

---

## 📄 许可证

MIT License

---

## 🎯 下一步

### 作为新手，你现在应该：

1. ✅ **阅读本 README** - 了解项目概况（你已经看完了！）
2. 📖 **打开 [开发指南.md](./开发指南.md)** - 按步骤完成配置
3. 🧪 **测试 Instagram iOS** - 验证功能正常
4. 📚 **查看 [技术说明.md](./技术说明.md)** - 了解技术细节（可选）

### 立即行动

```bash
# 确保服务器正在运行
npm run dev

# 然后打开浏览器测试
# http://localhost:3000
```

**祝你使用愉快！** 🎉
