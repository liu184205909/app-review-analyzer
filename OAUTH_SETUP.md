# OAuth 登录配置指南

本应用支持 Google 和 Apple 第三方登录。以下是配置步骤：

## Google OAuth 配置

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API

### 2. 创建 OAuth 凭据

1. 导航到 **APIs & Services** > **Credentials**
2. 点击 **Create Credentials** > **OAuth client ID**
3. 选择应用类型：**Web application**
4. 配置授权重定向 URI：
   - 开发环境：`http://localhost:3000/api/auth/google/callback`
   - 生产环境：`https://your-domain.com/api/auth/google/callback`
5. 复制 **Client ID** 和 **Client Secret**

### 3. 配置环境变量

在 `.env` 文件中添加：

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Apple Sign In 配置

### 1. 注册 App ID

1. 访问 [Apple Developer Portal](https://developer.apple.com/account/)
2. 导航到 **Certificates, Identifiers & Profiles**
3. 创建新的 **App ID**
4. 启用 **Sign In with Apple** 功能

### 2. 创建 Service ID

1. 创建新的 **Services ID**
2. 启用 **Sign In with Apple**
3. 配置 Web Authentication：
   - 域名：`your-domain.com`
   - 重定向 URL：`https://your-domain.com/api/auth/apple/callback`

### 3. 创建私钥

1. 在 **Keys** 部分创建新密钥
2. 启用 **Sign In with Apple**
3. 下载私钥文件（.p8）
4. 记录 **Key ID** 和 **Team ID**

### 4. 生成 Client Secret

Apple Sign In 需要使用 JWT 作为 client secret。你需要使用私钥生成 JWT。

参考代码（Node.js）：

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('AuthKey_XXXXXX.p8');

const token = jwt.sign(
  {
    iss: 'YOUR_TEAM_ID',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 months
    aud: 'https://appleid.apple.com',
    sub: 'YOUR_SERVICE_ID',
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      kid: 'YOUR_KEY_ID',
      alg: 'ES256',
    },
  }
);

console.log(token);
```

### 5. 配置环境变量

在 `.env` 文件中添加：

```env
APPLE_CLIENT_ID="com.yourapp.service"
APPLE_CLIENT_SECRET="your-generated-jwt-token"
```

## 完整环境变量配置

`.env` 文件示例：

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/app_review_analyzer"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
JWT_SECRET="your-super-secret-jwt-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple OAuth
APPLE_CLIENT_ID="com.yourapp.service"
APPLE_CLIENT_SECRET="your-generated-jwt-token"
```

## Vercel 部署配置

1. 在 Vercel Dashboard 中打开项目
2. 导航到 **Settings** > **Environment Variables**
3. 添加所有必需的环境变量
4. 重新部署应用

## 测试 OAuth 登录

1. 访问登录页面
2. 点击 **Google** 或 **Apple** 按钮
3. 完成授权流程
4. 应该会自动重定向到 Dashboard

## 故障排除

### Google OAuth 错误

- **redirect_uri_mismatch**: 检查 Google Console 中配置的重定向 URI 是否与应用中的一致
- **invalid_client**: 验证 Client ID 和 Client Secret 是否正确

### Apple Sign In 错误

- **invalid_client**: 检查 Service ID 和生成的 JWT token
- **invalid_redirect**: 确认 Apple Developer Portal 中配置的重定向 URL 与应用一致

### 通用错误

- 确保所有环境变量都已正确设置
- 检查 Vercel 日志查看详细错误信息
- 确认数据库中 `User` 表有 `googleId` 和 `appleId` 字段

## 安全建议

1. **保护 Client Secrets**: 永远不要将 secrets 提交到版本控制
2. **使用 HTTPS**: OAuth 仅在 HTTPS 上安全工作
3. **定期更新 Secrets**: 定期轮换 OAuth secrets
4. **限制重定向 URI**: 只允许你的域名作为重定向目标
5. **监控异常登录**: 实施日志和监控系统

## 参考链接

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/documentation/sign_in_with_apple)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

