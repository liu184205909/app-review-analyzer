# 访客免费试用功能 - 设置指南

## 📋 功能概述

允许未登录用户免费试用应用分析功能，无需注册即可体验完整的 AI 分析结果。

### 用户权限对比

| 用户类型 | 分析次数 | 查看完整结果 | 保存历史 | 导出报告 |
|---------|---------|------------|---------|---------|
| **访客** | 1 次 (24小时后重置) | ✅ | ❌ | ❌ |
| **Free 用户** | 每月 3 次 | ✅ | ✅ | ✅ |
| **Pro 用户** | 无限 | ✅ | ✅ | ✅ |

---

## 🗄️ 数据库迁移

### 步骤 1: 更新 Prisma Schema

已完成！新增了 `GuestAnalysis` 表：

```prisma
model GuestAnalysis {
  id            String    @id @default(uuid())
  ipAddress     String
  fingerprint   String?
  taskId        String?
  platform      Platform?
  appUrl        String?
  userAgent     String?
  createdAt     DateTime  @default(now())
  expiresAt     DateTime
  
  @@index([ipAddress, createdAt])
  @@index([fingerprint, createdAt])
  @@index([expiresAt])
}
```

### 步骤 2: 生成并应用迁移

在本地运行：

```bash
# 生成迁移
npx prisma migrate dev --name add_guest_analysis

# 格式化 schema
npx prisma format

# 生成 Prisma Client
npx prisma generate
```

在 Vercel/生产环境：

```bash
# 在 Vercel 项目设置中添加构建命令
npm run build && npx prisma migrate deploy
```

---

## 🔧 技术实现

### 1. 访客识别

使用双重标识：
- **IP 地址**：从请求头提取 (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
- **浏览器指纹**：基于 User-Agent、Accept-Language、Accept-Encoding 生成简单哈希

### 2. 限制策略

```typescript
// src/lib/guest.ts
export async function canGuestAnalyze(ipAddress: string, fingerprint: string) {
  // 检查过去 24 小时内是否有分析记录
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentAnalysis = await prisma.guestAnalysis.findFirst({
    where: {
      OR: [
        { ipAddress, createdAt: { gte: oneDayAgo } },
        { fingerprint, createdAt: { gte: oneDayAgo } },
      ],
    },
  });

  return !recentAnalysis;
}
```

### 3. API 修改

**`/api/analyze`** 现在支持两种模式：

```typescript
// 注册用户
if (token) {
  const payload = verifyToken(token);
  const analysisCheck = await canUserAnalyze(payload.userId);
  // ...
}
// 访客用户
else {
  const ipAddress = getClientIp(request);
  const fingerprint = getBrowserFingerprint(request);
  const guestCheck = await canGuestAnalyze(ipAddress, fingerprint);
  // ...
}
```

### 4. 前端用户体验

#### 首页 (`src/app/page.tsx`)
- 访客可以直接点击"开始分析"
- 如果达到限制，显示友好提示并引导注册

#### 分析结果页 (`src/app/analysis/[taskId]/page.tsx`)
- 访客可以查看完整分析结果
- 3 秒后自动弹出 `SignupPromoModal` 提示注册
- 使用 `sessionStorage` 防止重复弹窗

---

## 🎨 用户流程

### 访客流程

```
1. 访问首页
   ↓
2. 输入 App URL，点击"开始分析"
   ↓
3. 查看完整的分析结果
   ↓
4. [3秒后] 弹出注册提示弹窗
   "喜欢这个工具吗？注册以保存历史、导出结果，并获得每月 3 次免费分析！"
   ↓
5. 用户选择：
   - 点击"立即免费注册" → 打开 AuthModal
   - 点击"稍后再说" → 关闭弹窗，继续浏览
   ↓
6. 24小时后，用户可以再次使用免费试用
```

### 达到限制时的流程

```
1. 访客再次点击"开始分析"
   ↓
2. 显示错误提示（429 Too Many Requests）
   "您已使用过免费试用。注册以获得每月 3 次分析！"
   ↓
3. 显示倒计时："X 小时 Y 分钟后可再次试用"
   ↓
4. 用户点击确认 → 打开 AuthModal (注册标签)
```

---

## 📊 数据清理

为了保持数据库整洁，应定期清理过期的访客记录：

```typescript
// 可以添加到定时任务中 (Vercel Cron Job)
import { cleanupExpiredGuestAnalyses } from '@/lib/guest';

export async function cleanupGuestRecords() {
  const deleted = await cleanupExpiredGuestAnalyses();
  console.log(`Cleaned up ${deleted} expired guest analysis records`);
}
```

### Vercel Cron Job 配置

创建 `vercel.json`：

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-guests",
    "schedule": "0 0 * * *"
  }]
}
```

创建 `/api/cron/cleanup-guests/route.ts`：

```typescript
import { cleanupExpiredGuestAnalyses } from '@/lib/guest';

export async function GET() {
  const deleted = await cleanupExpiredGuestAnalyses();
  return Response.json({ 
    success: true, 
    deleted 
  });
}
```

---

## 🚀 部署清单

- [x] 更新 Prisma Schema
- [ ] 运行数据库迁移
- [ ] 测试访客分析功能
- [ ] 测试限制机制（IP + 指纹）
- [ ] 测试注册提示弹窗
- [ ] 设置访客记录清理任务（可选）
- [ ] 监控访客转化率

---

## 🔒 安全考虑

### 防止滥用

1. **IP + 指纹双重验证**：难以绕过
2. **24小时窗口期**：防止短时间内重复请求
3. **数据库索引**：快速查询访客记录
4. **自动过期**：记录自动标记过期时间

### 隐私保护

- IP 地址仅用于限制，不与其他数据关联
- 浏览器指纹是简单哈希，不存储原始数据
- 24小时后数据可清理

---

## 📈 监控指标

### 关键指标

1. **访客转化率** = (注册用户 / 完成分析的访客) × 100%
2. **试用使用率** = 使用试用的访客数 / 总访客数
3. **重复访问率** = 24小时后再次访问的访客 / 总访客数

### 优化建议

- 如果转化率 < 10%：优化注册弹窗文案或时机
- 如果重复访问率 > 30%：考虑缩短限制时间（12小时）
- 如果滥用严重：加强指纹识别或增加 CAPTCHA

---

## 🎯 A/B 测试建议

可以测试的变量：
1. **弹窗时机**：3秒 vs 5秒 vs 查看结果后
2. **弹窗文案**：强调功能 vs 强调次数
3. **限制时间**：24小时 vs 12小时 vs 永久限制
4. **免费次数**：Free tier 3次 vs 5次 vs 10次

---

## ✅ 测试验证

### 本地测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 清除浏览器 localStorage 和 sessionStorage

# 3. 访问首页，输入 App URL 进行分析

# 4. 验证可以看到完整结果

# 5. 验证 3 秒后弹出注册提示

# 6. 刷新页面，再次尝试分析
#    应该看到 "您已使用过免费试用" 的提示

# 7. 使用无痕模式或不同浏览器，验证可以再次试用

# 8. 注册账号，验证可以每月分析 3 次
```

### 生产测试

```bash
# 1. 部署到 Vercel

# 2. 验证访客可以分析

# 3. 检查 Vercel 日志，确认没有错误

# 4. 监控数据库，确认 GuestAnalysis 表正确记录

# 5. 24小时后验证记录是否过期
```

---

## 📝 下一步优化

1. **增强指纹识别**：使用 Canvas fingerprint、WebGL 等
2. **CAPTCHA 集成**：防止自动化滥用
3. **地理位置限制**：不同地区不同限制
4. **推荐奖励**：分享链接获得额外试用次数
5. **Email 验证**：要求 Email 解锁更多试用

---

## 🐛 常见问题

### Q: 用户换 IP 能绕过限制吗？
A: 可以，但浏览器指纹仍会追踪。对于普通用户，24小时窗口足够。

### Q: 访客分析会占用付费用户的配额吗？
A: 不会。访客和注册用户使用不同的限制机制。

### Q: 如何处理 VPN 用户？
A: 浏览器指纹可以识别部分 VPN 用户。严重滥用可考虑增加 CAPTCHA。

### Q: 访客数据会保留多久？
A: 数据标记 24 小时后过期，可通过定时任务清理。

---

**部署完成后，记得测试并监控转化率！** 🎉

