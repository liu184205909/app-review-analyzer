# 📊 App Review Analyzer

> AI驱动的应用评论分析平台，帮助开发者深入了解用户需求，优化产品体验

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Free Data Sources](https://img.shields.io/badge/Data%20Sources-100%25%20Free-brightgreen)](docs/免费数据源.md)
[![Review Count](https://img.shields.io/badge/Reviews-2000%2B-orange)](docs/免费数据源.md)

## 🎯 项目简介

App Review Analyzer 是一个企业级的应用评论分析平台，利用AI技术从iOS App Store和Google Play商店提取用户评论，提供深度洞察和竞争分析。

### ✨ 核心功能

- 🤖 **AI智能分析** - 自动分析用户评论，识别关键问题和需求
- 📱 **多平台支持** - 支持iOS App Store和Google Play Store
- 👥 **用户系统** - 完整的注册、登录、订阅管理
- 💰 **付费体系** - 三层订阅模式，功能差异化
- 🏆 **竞品对比** - 多应用同时对比分析
- 📊 **数据导出** - PDF/CSV/JSON格式导出
- 📧 **邮件通知** - 分析完成实时通知
- ⚡ **性能优化** - 企业级性能监控和优化
- 🆓 **免费数据源** - **2000+评论**，零成本获取

### 🚀 **最新突破：免费数据源集成**

- 🎯 **评论数量提升**: 从500条提升到**2000+条评论**
- 🎯 **数据质量提升**: 官方API数据源，质量评分0.8+
- 🎯 **完全免费**: 零数据获取成本
- 🎯 **智能选择**: 自动选择最佳数据源
- 🎯 **透明度**: 显示数据来源和质量评分

### 🚀 快速开始

#### 环境要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

#### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd app-review-analyzer
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env.local
# 编辑 .env.local 文件，配置必要的环境变量
```

4. **数据库设置**
```bash
npm run db:push
npm run db:studio  # 可选：打开数据库管理界面
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **验证免费数据源** (可选)
```bash
# 查看数据源状态
curl http://localhost:3000/api/data-sources
```

访问 http://localhost:3000 开始使用！

## 📊 **数据源优势对比**

| 特性 | 竞品 (App Annie/Sensor Tower) | **我们的平台** |
|------|------------------------------|---------------|
| **评论数量** | 500-1000条 | **2000+条** ⭐ |
| **数据成本** | 高昂API费用 | **完全免费** ⭐ |
| **数据质量** | 商业API | **官方API** ⭐ |
| **更新频率** | 每日 | **实时** ⭐ |
| **透明度** | 黑盒 | **完全透明** ⭐ |

## 📖 完整文档

### 📚 核心文档
- **[📖 开发指南](docs/开发指南.md)** ⭐⭐⭐ - 完整的开发和部署文档
- **[🗺️ 功能路线图](docs/功能路线图.md)** ⭐⭐ - 产品功能规划和发展路线
- **[🆓 免费数据源](docs/免费数据源.md)** ⭐⭐⭐ - 免费数据源技术详情

### 🔧 技术文档
- **[Prisma数据库字段指南](docs/Prisma数据库字段指南.md)** - 数据库JSON字段使用指南
- **[第三方服务集成指南](docs/第三方服务集成指南.md)** - 第三方服务集成方案

## 💰 定价方案

| 功能 | Free | Professional | Team |
|------|------|-------------|------|
| **价格** | $0 | $29/月 | $99/月 |
| 分析次数 | 3次/月 | ✅ 无限 | ✅ 无限 |
| **评论数量** | **2000+条/次** | **2000+条/次** | **2000+条/次** |
| **数据质量** | 官方API (0.8+) | 官方API (0.8+) | 官方API (0.8+) |
| **数据来源** | 完全免费 | 完全免费 | 完全免费 |
| 数据导出 | ✅ PDF/CSV | ✅ 全格式 | ✅ 全格式 |
| 竞品对比 | ❌ | ✅ 3个应用 | ✅ 5个应用 |
| 分析历史 | ❌ | ✅ 完整 | ✅ 完整 |
| 邮件通知 | ❌ | ✅ 实时 | ✅ 实时 |
| API访问 | ❌ | ❌ | ✅ 100次/月 |

## 🆓 **免费数据源详情**

### 已集成的免费数据源

| 数据源 | 平台 | 质量 | 费用 | 特点 |
|--------|------|------|------|------|
| **App Store RSS** | iOS | 0.8 | 免费 | 官方数据，实时更新 |
| **Google Play Scraper** | Android | 0.7 | 免费 | 开源库，数据量大 |
| **Google Play Developer API** | Android | 0.95 | 免费 (需配置) | 最高质量，详细信息 |
| **AppFollowing API** | 全平台 | 0.9 | 免费 (1000次/月) | 多平台，统一接口 |
| **Kaggle数据集** | 全平台 | 0.6 | 免费 | 历史数据丰富 |

### 数据源API查询

```bash
# 查询可用数据源状态
curl http://localhost:3000/api/data-sources
```

### 环境配置增强 (可选)

```env
# 免费数据源增强 (可选，但强烈推荐)
GOOGLE_PLAY_API_KEY="your-google-play-developer-api-key"    # 质量提升至0.95
APPFOLLOWING_API_KEY="your-appfollowing-api-key"           # 额外1000次/月
APPLE_STORE_API_KEY_ID="your-app-store-api-key-id"        # iOS数据质量提升
```

## 🎯 已完成功能 (v1.0)

### ✅ 核心功能
- **🤖 AI评论分析** - 完整的AI分析引擎，支持情感分析、关键问题提取
- **📱 多平台支持** - iOS App Store + Google Play Store
- **🔍 深度洞察** - 高频需求、优先级建议、SWOT分析
- **🌍 多语言支持** - 自动识别任何语言的评论
- **🆓 统一免费数据源** - 2000+评论，智能数据源选择

### ✅ 用户系统
- **👤 完整认证** - 邮箱注册登录、JWT token管理
- **🏠 用户仪表板** - 个人中心、分析历史、使用统计
- **⚙️ 用户设置** - 邮件通知偏好管理
- **📧 邮件系统** - 分析完成、失败、订阅激活通知

### ✅ 付费系统
- **💳 三层订阅** - Free/Professional/Team，功能差异化
- **💰 Stripe集成** - 完整支付流程，Webhook处理
- **🎫 订阅管理** - 升级、降级、取消订阅
- **📊 付费墙** - 使用量限制和权限控制

### ✅ 高级功能
- **🏆 竞品对比** - 最多5个应用同时对比，智能排名算法
- **📈 分析历史** - 个人分析记录管理，搜索和筛选
- **📄 数据导出** - PDF/CSV/JSON格式，支持批量导出
- **⚡ 性能优化** - 代码分割、缓存、监控系统

### ✅ 技术特性
- **🚀 高性能** - Next.js 14, TypeScript, Prisma ORM
- **🔒 安全性** - JWT认证、数据加密、输入验证
- **📱 响应式** - 适配所有设备
- **🔧 工具完善** - 性能监控、Bundle分析、自动化部署

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **UI组件**: 自定义组件系统

### 后端技术栈
- **API**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + bcryptjs
- **支付**: Stripe
- **邮件**: Nodemailer

### 部署与运维
- **部署**: Vercel
- **监控**: 自定义性能监控系统
- **CI/CD**: Vercel自动部署

## 🔧 环境配置

### 必需环境变量
```env
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/app_review_analyzer"

# 认证
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe支付
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 邮件服务
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 可选环境变量
```env
# AI服务
OPENROUTER_API_KEY="sk-or-v1-..."
OPENAI_API_KEY="sk-..."

# 第三方数据源
APPFOLLOWING_API_KEY="your-appfollowing-key"
DATA_AI_API_KEY="your-dataai-key"
```

## 🧪 快速测试

### 测试应用分析
```
1. 访问 http://localhost:3000
2. 注册/登录账号
3. 输入应用URL (iOS或Android)
4. 点击分析，等待完成
5. 查看详细的分析报告
```

### 测试竞品对比
```
1. 在价格页面升级到Professional或Team
2. 进入竞品对比页面
3. 添加2-5个应用URL
4. 启动对比分析
5. 查看对比结果和排名
```

## 🚀 开发工具

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器

# 数据库
npm run db:push       # 推送数据库更改
npm run db:studio     # 打开数据库管理界面

# 分析工具
npm run analyze:bundle   # 分析包大小
npm run analyze:perf    # 完整性能分析
npm run lint           # 代码检查
```

## 📊 数据源支持

### 官方数据源 (免费)
- **Google Play Store** - 直接官方API
- **iOS App Store** - App Store公共数据

### 第三方数据源 (可选)
- **AppFollowing** - 全球应用市场数据 ($299/月)
- **Data.ai** - 深度用户行为分析 ($999/月)
- **42matters** - 应用市场情报 ($199/月)

### 免费数据源
- **SimilarWeb** - 流量数据 (5,000次/月)
- **公共数据集** - 开源的移动应用数据
- **RSS Feeds** - App Store排行榜数据

## 🔐 安全特性

- **JWT认证** - 安全的用户认证
- **数据加密** - 敏感数据加密存储
- **API限流** - 防止API滥用
- **输入验证** - 严格的数据验证
- **HTTPS强制** - 生产环境强制HTTPS

## 📈 性能指标

### Web Vitals目标
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### API性能
- **认证API**: < 200ms
- **分析任务创建**: < 500ms
- **分析结果查询**: < 300ms
- **数据导出**: < 2s

## 🛣️ 部署指南

### Vercel部署 (推荐)
```bash
# 1. 连接GitHub仓库到Vercel
# 2. 配置环境变量
# 3. 自动部署
npm run build
```

### 自定义服务器
```bash
# 1. 构建项目
npm run build

# 2. 启动服务器
npm run start
```

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 代码审查

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 组件使用PascalCase命名
- API路由使用kebab-case命名

## 📞 支持与反馈

### 问题报告
- 使用GitHub Issues报告bug
- 提供详细的重现步骤
- 包含环境信息

### 功能请求
- 描述新功能的价值
- 提供使用场景
- 考虑实现复杂度

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 🎯 文档导航

### 📚 核心文档
| 文档 | 用途 | 优先级 |
|------|------|--------|
| **README.md** | 项目介绍 + 快速开始 | ⭐⭐⭐ 必读 |
| **[开发指南](docs/development-guide.md)** | 完整技术文档 | ⭐⭐⭐ 必读 |
| **[功能路线图](docs/feature-roadmap.md)** | 产品规划路线 | ⭐⭐ 推荐 |

### 🔧 专项文档
| 文档 | 用途 | 适用人群 |
|------|------|----------|
| **[第三方集成](docs/third-party-integration.md)** | 付费数据源 | 开发者 |
| **[免费数据源](docs/free-data-sources.md)** | 免费数据源 | 开发者 |

### 🚀 立即开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
```

**🎉 开始使用 App Review Analyzer，深入了解您的用户，优化产品体验！**
