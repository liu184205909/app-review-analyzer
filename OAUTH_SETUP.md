# OAuth 第三方登录配置教程

本教程将指导你配置 Google 和 Apple 第三方登录功能（支持 Vercel 部署）。

## 前提条件

- ✅ 已有 Google 账号
- ✅ 项目已部署到 Vercel
- ✅ Vercel 域名：`https://app-review-analyzer.vercel.app`

---

## 第一部分：Google Cloud Console 配置

### 步骤 1：创建 Google Cloud 项目

1. **访问 Google Cloud Console**
   - 打开：https://console.cloud.google.com/
   - 使用你的 Google 账号登录

2. **创建新项目**
   - 点击顶部的项目选择器
   - 点击 **"NEW PROJECT"**（新建项目）
   - 项目名称：`App Review Analyzer`（或任何你喜欢的名称）
   - 点击 **"CREATE"**（创建）
   - 等待项目创建完成（约 10-30 秒）

3. **选择刚创建的项目**
   - 在顶部项目选择器中选择你刚创建的项目

### 步骤 2：启用 Google+ API

1. **打开 API 库**
   - 在左侧菜单中，导航到：**APIs & Services** > **Library**
   - 或直接访问：https://console.cloud.google.com/apis/library

2. **搜索并启用 API**
   - 在搜索框中输入：`Google+ API`
   - 点击搜索结果中的 **"Google+ API"**
   - 点击 **"ENABLE"**（启用）按钮
   - 等待启用完成

### 步骤 3：配置 OAuth 同意屏幕

1. **打开 OAuth 同意屏幕配置**
   - 在左侧菜单中，导航到：**APIs & Services** > **OAuth consent screen**
   - 或直接访问：https://console.cloud.google.com/apis/credentials/consent

2. **选择用户类型**
   - 选择 **"External"**（外部）
   - 点击 **"CREATE"**（创建）

3. **填写应用信息**（第 1 步：OAuth 同意屏幕）
   
   **必填字段：**
   - **App name**（应用名称）：`ReviewInsight`
   - **User support email**（用户支持电子邮件）：选择你的 Google 邮箱
   - **Application home page**（应用首页）：`https://app-review-analyzer.vercel.app`
   - **Application Privacy Policy link**（隐私政策）：`https://app-review-analyzer.vercel.app/privacy`
   - **Application Terms of Service link**（服务条款）：`https://app-review-analyzer.vercel.app/terms`
   - **Authorized domains**（授权域名）：
     - 点击 **"ADD DOMAIN"**
     - 输入：`vercel.app`
     - 点击添加
   - **Developer contact information**（开发者联系信息）：输入你的邮箱

   点击 **"SAVE AND CONTINUE"**（保存并继续）

4. **配置范围**（第 2 步：Scopes）
   - 点击 **"ADD OR REMOVE SCOPES"**
   - 勾选以下范围：
     - ✅ `.../auth/userinfo.email`
     - ✅ `.../auth/userinfo.profile`
     - ✅ `openid`
   - 点击 **"UPDATE"**
   - 点击 **"SAVE AND CONTINUE"**

5. **测试用户**（第 3 步：Test users - 可选）
   - 如果应用处于测试模式，需要添加测试用户
   - 点击 **"ADD USERS"**
   - 输入你要允许登录的 Google 邮箱地址
   - 点击 **"ADD"**
   - 点击 **"SAVE AND CONTINUE"**

6. **完成**（第 4 步：Summary）
   - 检查配置信息
   - 点击 **"BACK TO DASHBOARD"**（返回控制台）

### 步骤 4：创建 OAuth 客户端 ID

1. **打开凭据页面**
   - 在左侧菜单中，导航到：**APIs & Services** > **Credentials**
   - 或直接访问：https://console.cloud.google.com/apis/credentials

2. **创建 OAuth 客户端 ID**
   - 点击顶部的 **"+ CREATE CREDENTIALS"**
   - 选择 **"OAuth client ID"**

3. **配置 OAuth 客户端**
   
   **应用类型：**
   - 选择：**Web application**（Web 应用）

   **名称：**
   - 输入：`ReviewInsight Web Client`

   **授权的 JavaScript 来源（Authorized JavaScript origins）：**
   - 点击 **"+ ADD URI"**
   - 输入：`https://app-review-analyzer.vercel.app`

   **授权的重定向 URI（Authorized redirect URIs）：**
   - 点击 **"+ ADD URI"**
   - 输入：`https://app-review-analyzer.vercel.app/api/auth/google/callback`
   
   > ⚠️ **重要提示：** 
   > - URL 必须使用 HTTPS（Vercel 自动提供）
   > - 不要在末尾添加 `/`
   > - 确保与你的 Vercel 域名完全一致

4. **创建客户端**
   - 点击 **"CREATE"**
   - 弹出窗口将显示你的凭据

5. **复制凭据**
   - 📋 复制 **Client ID**（看起来像：`xxxxx.apps.googleusercontent.com`）
   - 📋 复制 **Client secret**
   - 点击 **"OK"**

   > 💡 **提示：** 你随时可以在凭据页面查看这些信息

---

## 第二部分：Vercel 环境变量配置

### 步骤 1：打开 Vercel 项目设置

1. **登录 Vercel**
   - 访问：https://vercel.com/
   - 登录你的账号

2. **选择项目**
   - 在 Dashboard 中找到 `app-review-analyzer` 项目
   - 点击进入项目

3. **打开设置**
   - 点击顶部的 **"Settings"** 标签

### 步骤 2：配置环境变量

1. **打开环境变量页面**
   - 在左侧菜单中点击 **"Environment Variables"**

2. **添加 Google Client ID**
   - 点击右上角的 **"Add New"**
   - **Key (名称)**: `GOOGLE_CLIENT_ID`
   - **Value (值)**: 粘贴你复制的 Client ID
   - **Environment**: 勾选所有环境（Production, Preview, Development）
   - 点击 **"Save"**

3. **添加 Google Client Secret**
   - 再次点击 **"Add New"**
   - **Key**: `GOOGLE_CLIENT_SECRET`
   - **Value**: 粘贴你复制的 Client Secret
   - **Environment**: 勾选所有环境
   - 点击 **"Save"**

4. **添加 NEXTAUTH_URL（如果还没有）**
   - 点击 **"Add New"**
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://app-review-analyzer.vercel.app`
   - **Environment**: 勾选所有环境
   - 点击 **"Save"**

5. **添加 JWT_SECRET（如果还没有）**
   - 点击 **"Add New"**
   - **Key**: `JWT_SECRET`
   - **Value**: 生成一个随机字符串（可以访问 https://generate-secret.vercel.app/ 生成）
   - **Environment**: 勾选所有环境
   - 点击 **"Save"**

### 步骤 3：重新部署

**配置完环境变量后必须重新部署！**

#### 方法 1：通过 Vercel Dashboard 重新部署

1. 点击顶部的 **"Deployments"** 标签
2. 找到最新的部署
3. 点击右侧的三个点 `...`
4. 选择 **"Redeploy"**
5. 确认重新部署

#### 方法 2：通过 Git 推送触发部署

```bash
# 在本地项目目录
git commit --allow-empty -m "Trigger redeploy for Google OAuth"
git push origin master
```

---

## 第三部分：测试 Google 登录

### 步骤 1：等待部署完成

- 在 Vercel 的 Deployments 页面查看部署状态
- 等待显示 ✅ **"Ready"**

### 步骤 2：测试登录流程

1. **访问登录页面**
   - 打开：`https://app-review-analyzer.vercel.app/login`

2. **点击 Google 登录按钮**
   - 点击 **"Continue with Google"** 按钮

3. **Google 授权页面**
   - 选择你的 Google 账号
   - 查看权限请求（邮箱和基本信息）
   - 点击 **"允许"** 或 **"Continue"**

4. **自动跳转**
   - 应该会自动跳转回你的应用
   - 如果成功，会跳转到 Dashboard 页面
   - 你应该能看到你的 Google 账号信息

---

## 常见问题排查

### 问题 1：点击 Google 按钮后显示 "OAuth is not configured"

**原因：** 环境变量未配置或未生效

**解决方案：**
1. 确认 Vercel 中已添加 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
2. 确保重新部署了应用
3. 等待部署完成后再测试

### 问题 2：显示 "redirect_uri_mismatch" 错误

**原因：** Google Console 中配置的重定向 URI 与实际 URI 不匹配

**解决方案：**
1. 检查 Google Console 中的重定向 URI 是否为：
   ```
   https://app-review-analyzer.vercel.app/api/auth/google/callback
   ```
2. 确保没有多余的空格或 `/`
3. 确保使用 HTTPS
4. 修改后等待几分钟让 Google 更新配置

### 问题 3：显示 "Access blocked: This app's request is invalid"

**原因：** OAuth 同意屏幕配置不完整

**解决方案：**
1. 返回 Google Console 的 OAuth consent screen
2. 确保填写了所有必填字段
3. 在 Authorized domains 中添加了 `vercel.app`

### 问题 4：显示 "This app is blocked"

**原因：** 应用处于测试模式，且当前用户不在测试用户列表中

**解决方案：**
1. 在 OAuth consent screen 中添加当前用户为测试用户
2. 或者将应用发布到生产环境（需要 Google 审核）

### 问题 5：登录成功但页面显示错误

**检查步骤：**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签中的错误信息
3. 查看 Network 标签中的请求状态
4. 检查 Vercel 的 Functions 日志

---

## 安全提示

1. **保护 Client Secret**
   - ❌ 永远不要将 Client Secret 提交到 Git
   - ✅ 只在 Vercel 环境变量中配置
   - ✅ 定期轮换 Secret

2. **限制授权域名**
   - ✅ 只添加你自己的域名
   - ❌ 不要添加通配符域名

3. **监控登录活动**
   - 定期检查 Google Cloud Console 的使用情况
   - 监控异常登录行为

4. **数据库安全**
   - 确保 Prisma 连接使用 SSL
   - 定期备份用户数据

---

## 本地开发环境配置（可选）

如果你也想在本地测试 Google 登录：

### 步骤 1：在 Google Console 中添加本地重定向 URI

在同一个 OAuth 客户端 ID 中添加：
- **授权的 JavaScript 来源**: `http://localhost:3000`
- **授权的重定向 URI**: `http://localhost:3000/api/auth/google/callback`

### 步骤 2：创建本地 .env 文件

在项目根目录创建 `.env` 文件：

```env
# Database
DATABASE_URL="your-database-url"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 步骤 3：运行开发服务器

```bash
npm install
npm run dev
```

访问 `http://localhost:3000/login` 测试 Google 登录。

---

## 从测试模式切换到生产模式（可选）

当你准备向公众开放时：

1. **完善应用信息**
   - 准备应用图标（512x512px）
   - 准备真实的隐私政策和服务条款页面

2. **提交审核**
   - 在 OAuth consent screen 页面
   - 点击 **"PUBLISH APP"**
   - 提交 Google 审核（通常需要几天到几周）

3. **审核通过前**
   - 应用仍可使用，但会显示警告
   - 只有测试用户可以登录

---

## 后续步骤

✅ **配置完成后，你的应用现在支持：**
- 传统邮箱密码登录
- Google 账号快速登录（单点登录）

✅ **用户体验：**
- 用户可以选择任一方式登录
- Google 登录更快捷，无需记住密码
- 自动同步 Google 头像和用户名

🎉 **恭喜！你已成功配置 Google OAuth 登录！**

---

## 第二部分：Apple Sign In 配置（可选）

### 步骤 1：注册 App ID

1. **访问 Apple Developer Portal**
   - 打开：https://developer.apple.com/account/
   - 使用你的 Apple Developer 账号登录（需要付费开发者账号）

2. **创建 App ID**
   - 导航到 **Certificates, Identifiers & Profiles**
   - 点击 **Identifiers**，然后点击 **+** 按钮
   - 选择 **App IDs**，点击 **Continue**
   - 选择 **App**，点击 **Continue**
   - 填写信息：
     - **Description**: `App Review Analyzer`
     - **Bundle ID**: `com.yourcompany.appreviewanalyzer`
   - 在 **Capabilities** 中启用 **Sign In with Apple**
   - 点击 **Continue**，然后点击 **Register**

### 步骤 2：创建 Service ID

1. **创建新的 Services ID**
   - 在 Identifiers 页面，点击 **+** 按钮
   - 选择 **Services IDs**，点击 **Continue**
   - 填写信息：
     - **Description**: `App Review Analyzer Web Service`
     - **Identifier**: `com.yourcompany.appreviewanalyzer.service`
   - 点击 **Continue**，然后点击 **Register**

2. **配置 Web Authentication**
   - 选择刚创建的 Service ID
   - 勾选 **Sign In with Apple**
   - 点击 **Configure**
   - 填写配置：
     - **Primary App ID**: 选择之前创建的 App ID
     - **Domains and Subdomains**: `app-review-analyzer.vercel.app`
     - **Return URLs**: `https://app-review-analyzer.vercel.app/api/auth/apple/callback`
   - 点击 **Next**，然后点击 **Done**
   - 点击 **Continue**，然后点击 **Save**

### 步骤 3：创建私钥

1. **在 Keys 部分创建新密钥**
   - 导航到 **Keys**，点击 **+** 按钮
   - 填写信息：
     - **Key Name**: `App Review Analyzer Sign In Key`
   - 勾选 **Sign In with Apple**
   - 点击 **Configure**，选择你的 Primary App ID
   - 点击 **Save**
   - 点击 **Continue**，然后点击 **Register**

2. **下载私钥**
   - 点击 **Download** 下载私钥文件（.p8 格式）
   - ⚠️ **重要**: 此文件只能下载一次，请妥善保管
   - 记录 **Key ID**（10个字符）
   - 记录 **Team ID**（在页面右上角）

### 步骤 4：生成 Client Secret

Apple Sign In 需要使用 JWT 作为 client secret。创建一个 Node.js 脚本生成：

```javascript
// generate-apple-secret.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

// 配置信息（替换为你的实际值）
const TEAM_ID = 'YOUR_TEAM_ID';              // 10个字符
const SERVICE_ID = 'com.yourcompany.appreviewanalyzer.service';  // Service ID
const KEY_ID = 'YOUR_KEY_ID';                // 10个字符
const PRIVATE_KEY_PATH = './AuthKey_XXXXXX.p8';  // 私钥文件路径

// 读取私钥
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// 生成 JWT token（有效期6个月）
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 180天
    aud: 'https://appleid.apple.com',
    sub: SERVICE_ID,
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      kid: KEY_ID,
      alg: 'ES256',
    },
  }
);

console.log('Generated Apple Client Secret:');
console.log(token);
console.log('\n⚠️ 此 token 有效期为 180 天，到期后需要重新生成');
```

运行脚本：

```bash
npm install jsonwebtoken
node generate-apple-secret.js
```

### 步骤 5：在 Vercel 配置环境变量

在 Vercel Dashboard 中添加 Apple 相关环境变量：

```env
# Apple OAuth
APPLE_CLIENT_ID="com.yourcompany.appreviewanalyzer.service"
APPLE_CLIENT_SECRET="生成的JWT token（很长的字符串）"
```

### 步骤 6：测试 Apple Sign In

1. 访问你的应用登录页面
2. 点击 **"Sign in with Apple"** 按钮
3. 使用 Apple ID 登录
4. 授权应用访问你的信息
5. 应该会重定向回应用并自动登录

### Apple Sign In 故障排除

**错误：invalid_client**
- 检查 Service ID 是否正确
- 确认生成的 JWT token 是否过期
- 验证 Team ID、Key ID 是否正确

**错误：invalid_redirect**
- 确认 Return URL 与 Apple Developer Portal 中配置的完全一致
- 检查域名是否包含 https://

**错误：unauthorized_client**
- 确认 Service ID 已启用 Sign In with Apple
- 检查 Primary App ID 配置是否正确

---

## 完整环境变量配置

在 `.env.local` 或 Vercel 环境变量中配置：

```env
# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Apple OAuth (可选)
APPLE_CLIENT_ID="com.yourcompany.appreviewanalyzer.service"
APPLE_CLIENT_SECRET="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlhYWFhYWCJ9..."

# 应用配置
NEXT_PUBLIC_APP_URL="https://app-review-analyzer.vercel.app"
NEXTAUTH_URL="https://app-review-analyzer.vercel.app"
```

---

## 安全建议

1. **保护密钥安全**
   - 永远不要将 Client Secret 提交到版本控制
   - 使用环境变量存储敏感信息
   - 定期轮换 OAuth secrets

2. **使用 HTTPS**
   - OAuth 仅在 HTTPS 上安全工作
   - Vercel 默认提供 HTTPS

3. **限制重定向 URI**
   - 只允许你的域名作为重定向目标
   - 不要使用通配符

4. **监控和日志**
   - 记录登录尝试
   - 监控异常的登录活动
   - 设置告警机制

---

## 需要帮助？

- 📧 查看 Vercel 日志：https://vercel.com/your-project/logs
- 📚 Google OAuth 文档：https://developers.google.com/identity/protocols/oauth2
- 📚 Apple Sign In 文档：https://developer.apple.com/documentation/sign_in_with_apple
- 🐛 遇到问题？检查浏览器控制台的错误信息

🎉 **完成！你已成功配置 Google 和 Apple 第三方登录！**

