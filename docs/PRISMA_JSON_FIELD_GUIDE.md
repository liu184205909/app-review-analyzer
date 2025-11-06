# Prisma JSON 字段类型处理指南

## 问题根源

### 为什么 TypeScript 类型错误会重复出现？

1. **Prisma JSON 字段的特殊性**
   - Prisma 的 JSON 字段类型系统非常严格
   - JSON 字段不能直接使用 `null` 进行过滤
   - 必须使用 `Prisma.JsonNull` 来表示 JSON null 值

2. **代码分散在不同文件**
   - 不同时间创建的 API 路由文件
   - 每个开发者可能使用不同的写法
   - 没有统一的代码规范

3. **TypeScript 渐进式检查**
   - 本地开发时可能使用 `any` 类型避过检查
   - Vercel 构建时使用更严格的类型检查
   - 错误只在部署时暴露

## 常见的错误模式

### ❌ 错误写法 1：直接使用 `null`
```typescript
const where = {
  result: { not: null }, // ❌ 类型错误！
};
```

### ❌ 错误写法 2：使用 `as any` 绕过类型检查
```typescript
const where: any = {
  result: { not: null }, // ✅ 运行时正常，但类型不安全
};
```

### ✅ 正确写法：使用 `Prisma.JsonNull`
```typescript
import { Prisma } from '@prisma/client';

const where: any = {
  result: { not: Prisma.JsonNull }, // ✅ 类型安全，运行时正确
};
```

## 统一解决方案

### 方案 1：使用 Prisma.JsonNull（推荐）

在 **所有** API 路由中，统一使用 `Prisma.JsonNull`：

```typescript
import { Prisma } from '@prisma/client';

const where: any = {
  status: 'completed',
  isLatest: true,
  appSlug: { not: null },           // ✅ 普通字段可以用 null
  result: { not: Prisma.JsonNull }, // ✅ JSON 字段必须用 Prisma.JsonNull
};
```

### 方案 2：创建辅助函数（可选）

如果需要在整个项目中统一处理，可以创建一个辅助函数：

```typescript
// src/lib/prisma-helpers.ts
import { Prisma } from '@prisma/client';

export function buildWhereClause(base: any) {
  return {
    ...base,
    result: base.result || { not: Prisma.JsonNull },
  };
}
```

## 已修复的文件

- ✅ `src/app/api/browse/route.ts` - 已修复
- ✅ `src/app/api/popular/route.ts` - 已修复
- ✅ `src/app/api/analyze/route.ts` - 使用 `as any`（可以改进）
- ✅ `src/app/api/recent/route.ts` - 没有使用 `result` 过滤

## 检查清单

创建新的 API 路由时，请检查：

- [ ] 是否导入了 `Prisma` 类型？
- [ ] JSON 字段过滤是否使用 `Prisma.JsonNull`？
- [ ] 普通字段过滤是否使用 `null`？
- [ ] 是否避免了不必要的 `as any`？

## 示例模板

```typescript
// API Route: GET /api/example
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // ✅ 必须导入

export async function GET(request: NextRequest) {
  try {
    const where: any = {
      status: 'completed',
      isLatest: true,
      appSlug: { not: null },           // ✅ 普通字段
      result: { not: Prisma.JsonNull }, // ✅ JSON 字段
    };

    const analyses = await prisma.analysisTask.findMany({
      where,
      // ...
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

## 为什么之前没有发现？

1. **本地开发环境**
   - TypeScript 配置可能较宽松
   - 使用 `any` 类型避过检查
   - 没有严格的 lint 规则

2. **Vercel 构建环境**
   - 使用更严格的 TypeScript 配置
   - 所有类型检查都会执行
   - 错误会在构建时暴露

3. **渐进式开发**
   - 不同时间创建的文件
   - 没有统一的代码审查
   - 错误只在部署时发现

## 预防措施

1. **统一代码规范**
   - 所有 JSON 字段过滤使用 `Prisma.JsonNull`
   - 避免使用 `as any` 绕过类型检查

2. **代码审查**
   - 创建新 API 路由时检查类型
   - 使用 TypeScript 严格模式

3. **自动化检查**
   - 配置 ESLint 规则
   - 使用 Prettier 格式化
   - CI/CD 时进行类型检查

## 总结

**核心问题**：Prisma JSON 字段需要使用特殊类型 `Prisma.JsonNull`，而不是普通的 `null`。

**解决方案**：在所有 API 路由中统一使用 `Prisma.JsonNull` 进行 JSON 字段过滤。

**预防措施**：建立代码规范，使用统一的模板和辅助函数。

