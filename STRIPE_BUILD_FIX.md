# Stripe 构建错误修复说明

## 问题描述

在 Vercel 部署时遇到以下错误：
```
Error: No API key provided. You need to provide your API key using "Stripe('YOUR_API_KEY_HERE')".
Error: Failed to collect page data for /api/stripe/checkout
```

## 根本原因

在 `src/lib/stripe.ts` 文件中，Stripe 实例在模块顶层被初始化：

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});
```

这会导致在 Next.js 构建阶段执行该代码，但此时 `STRIPE_SECRET_KEY` 环境变量可能未设置，从而导致构建失败。

## 解决方案

采用**延迟初始化**（Lazy Initialization）模式：

### 1. 修改 `src/lib/stripe.ts`

```typescript
// 延迟初始化 Stripe 以避免构建时错误
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
  }
  return stripeInstance;
}
```

### 2. 更新所有使用 stripe 的函数

在每个需要使用 Stripe 的函数中调用 `getStripe()`：

```typescript
export async function createStripeCheckoutSession(...) {
  const stripe = getStripe();
  // ... 使用 stripe
}
```

### 3. 更新 webhook 路由

在 `src/app/api/stripe/webhook/route.ts` 中：

```typescript
import getStripe, { STRIPE_PRICES } from '@/lib/stripe';

// 在需要时调用
const stripe = getStripe();
```

### 4. 更新环境变量示例

在 `env.example` 中添加：

```env
# Stripe Configuration (for subscription features)
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PRICE_PRO_MONTHLY="price_xxx"
STRIPE_PRICE_PRO_YEARLY="price_xxx"
STRIPE_PRICE_TEAM_MONTHLY="price_xxx"
STRIPE_PRICE_TEAM_YEARLY="price_xxx"
NEXTAUTH_URL="http://localhost:3000"
```

## Vercel 部署配置

在 Vercel 项目设置中，您需要配置以下环境变量：

1. **必需的环境变量**：
   - `STRIPE_SECRET_KEY` - 从 Stripe Dashboard 获取
   - `STRIPE_WEBHOOK_SECRET` - 配置 webhook 后获取
   - `NEXTAUTH_URL` - 您的生产环境 URL

2. **可选的环境变量**（如果使用 Stripe）：
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `STRIPE_PRICE_PRO_YEARLY`
   - `STRIPE_PRICE_TEAM_MONTHLY`
   - `STRIPE_PRICE_TEAM_YEARLY`

## 如何在 Vercel 配置环境变量

1. 访问 Vercel Dashboard
2. 选择您的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加上述必需的环境变量
5. 选择应用到的环境（Production / Preview / Development）
6. 保存后重新部署

## 推送更改

本地已提交修复，使用以下命令推送：

```bash
git push
```

如果遇到网络问题，可以：
1. 使用 VPN 或代理
2. 配置 Git 使用 SSH 而非 HTTPS
3. 稍后重试

## 优势

这种延迟初始化的方式有以下优点：

1. ✅ **构建时安全**：在构建阶段不会尝试初始化 Stripe
2. ✅ **运行时检查**：只在实际使用时才检查环境变量
3. ✅ **清晰的错误信息**：如果环境变量缺失，会给出明确的错误
4. ✅ **单例模式**：只创建一个 Stripe 实例，避免重复初始化

## 测试建议

部署后，您可以测试以下功能：

1. 访问定价页面
2. 尝试创建订阅（需配置真实的 Stripe 密钥）
3. 检查 webhook 是否正常工作

如果不需要 Stripe 功能，这些修改也能确保构建成功。

