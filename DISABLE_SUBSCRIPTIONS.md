# 禁用订阅功能配置指南

## 概述

本项目已配置为可以在**不启用 Stripe 支付系统**的情况下正常运行。您可以选择性地启用或禁用订阅功能。

## 默认配置（不启用订阅）

### 1. 环境变量设置

在您的环境变量文件（`.env` 或 Vercel 环境变量）中：

```env
# Feature Flags - 设置为 false 禁用订阅功能
ENABLE_SUBSCRIPTIONS="false"
NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS="false"

# 其他必需的环境变量
DATABASE_URL="postgresql://..."
OPENROUTER_API_KEY="sk-or-v1-..."
# ... 其他配置
```

**注意**：当订阅功能禁用时，无需配置任何 Stripe 相关的环境变量。

### 2. 在 Vercel 中配置

1. 进入 Vercel Dashboard
2. 选择您的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：
   - `ENABLE_SUBSCRIPTIONS` = `false`
   - `NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS` = `false`
5. 应用到所有环境（Production / Preview / Development）
6. 重新部署项目

## 功能行为

### 订阅功能禁用时

✅ **可用功能**：
- 用户注册和登录
- 免费账户使用（每月 3 次分析）
- 基础的应用评论分析功能
- 所有其他非订阅相关功能

❌ **不可用功能**：
- 付费订阅（Professional / Team 计划）
- Stripe 支付和结账
- 订阅管理
- Dashboard 中的"升级计划"按钮将被隐藏

### 用户体验

1. **定价页面**：
   - 显示黄色警告横幅，提示订阅功能未启用
   - 用户点击付费计划按钮时，会看到友好提示信息
   - 免费注册功能仍然可用

2. **Dashboard**：
   - 免费用户不会看到"升级计划"按钮
   - 其他功能正常显示

3. **API 行为**：
   - `/api/stripe/checkout` - 返回 503 状态，提示功能未启用
   - `/api/stripe/webhook` - 返回 503 状态，提示功能未启用

## 启用订阅功能

如果将来需要启用订阅功能：

### 1. 配置 Stripe

在 [Stripe Dashboard](https://dashboard.stripe.com/) 中：
1. 创建产品和价格
2. 获取 API 密钥
3. 配置 Webhook

### 2. 更新环境变量

```env
# 启用订阅功能
ENABLE_SUBSCRIPTIONS="true"
NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS="true"

# Stripe 配置
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO_MONTHLY="price_xxx"
STRIPE_PRICE_PRO_YEARLY="price_xxx"
STRIPE_PRICE_TEAM_MONTHLY="price_xxx"
STRIPE_PRICE_TEAM_YEARLY="price_xxx"
NEXTAUTH_URL="https://your-domain.com"
```

### 3. 重新部署

在 Vercel 或您的托管平台上重新部署应用。

## 技术实现

### 功能开关

使用 `src/lib/features.ts` 文件管理功能开关：

```typescript
export const FEATURES = {
  SUBSCRIPTIONS_ENABLED: process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS === 'true',
} as const;
```

### 后端保护

在 API 路由中检查功能标志：

```typescript
const SUBSCRIPTIONS_ENABLED = process.env.ENABLE_SUBSCRIPTIONS === 'true';

if (!SUBSCRIPTIONS_ENABLED) {
  return NextResponse.json(
    { error: 'Subscription feature is currently disabled' },
    { status: 503 }
  );
}
```

### 前端条件渲染

在 React 组件中：

```typescript
import { FEATURES } from '@/lib/features';

// 条件渲染
{FEATURES.SUBSCRIPTIONS_ENABLED && (
  <UpgradeButton />
)}

// 条件执行
if (!FEATURES.SUBSCRIPTIONS_ENABLED) {
  alert('订阅功能暂未启用');
  return;
}
```

## 优势

1. ✅ **灵活性**：可以随时启用或禁用订阅功能
2. ✅ **安全性**：未配置 Stripe 时，API 端点被保护
3. ✅ **用户友好**：清晰的提示信息，不会让用户困惑
4. ✅ **开发效率**：可以先开发核心功能，稍后再集成支付
5. ✅ **构建安全**：构建过程不会因为缺少 Stripe 配置而失败

## 常见问题

### Q: 为什么需要两个环境变量（ENABLE_SUBSCRIPTIONS 和 NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS）？

A: 
- `ENABLE_SUBSCRIPTIONS` 用于服务端（API 路由），不会暴露给客户端
- `NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS` 用于客户端（React 组件），可以在浏览器中访问

### Q: 如果不小心设置了 ENABLE_SUBSCRIPTIONS="true" 但没有配置 Stripe 会怎样？

A: 应用仍然可以运行，但当用户尝试创建订阅时，会因为缺少 Stripe 配置而收到错误消息。建议只在完全配置好 Stripe 后才启用此功能。

### Q: 免费用户的限制是如何实施的？

A: 免费用户的限制在后端 API 中强制执行，与订阅功能是否启用无关。订阅功能只影响付费升级的可用性。

## 相关文件

- `src/lib/features.ts` - 功能开关配置
- `src/lib/stripe.ts` - Stripe 集成（延迟初始化）
- `src/app/pricing/page.tsx` - 定价页面（带警告横幅）
- `src/app/dashboard/page.tsx` - Dashboard（条件显示升级按钮）
- `src/app/api/stripe/checkout/route.ts` - Checkout API（功能检查）
- `src/app/api/stripe/webhook/route.ts` - Webhook API（功能检查）
- `env.example` - 环境变量示例

## 总结

现在您的应用可以在不配置 Stripe 的情况下正常运行！所有用户仍然可以：
- 注册免费账户
- 使用基础分析功能
- 查看定价信息（带说明）

当您准备好启用付费功能时，只需配置 Stripe 并更新环境变量即可。

