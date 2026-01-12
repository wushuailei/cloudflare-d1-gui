# 数据库配置说明

本文档说明如何配置和管理 Cloudflare D1 数据库连接。

## 连接模式

### 模式 1：本地开发模式（推荐用于开发测试）

**特点：**

- 使用 Worker D1 绑定
- 自动连接本地 D1 数据库
- 无需配置 API Token
- 适合开发和测试环境

**配置步骤：**

1. 确保 `wrangler.jsonc` 中已配置 D1 绑定（默认已配置）：

   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "local-dev-db",
       "database_id": "preview_local-dev-db"
     }
   ]
   ```

2. 启动开发服务器：

   ```bash
   npm run dev
   ```

3. 在前端界面选择"本地模式"即可使用

**优势：**

- ✅ 零配置，开箱即用
- ✅ 无需 API Token
- ✅ 适合快速开发和测试

---

### 模式 2：远程管理模式（用于管理线上数据库）

**特点：**

- 使用 Cloudflare REST API
- 可管理任意线上 D1 数据库
- 需要提供 Account ID 和 API Token
- 支持多数据库切换

**配置步骤：**

1. **获取 Account ID**

   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 在右侧可以看到您的 Account ID

2. **创建 API Token**

   - 进入 Dashboard → My Profile → API Tokens
   - 点击 "Create Token"
   - 选择 "Create Custom Token"
   - 配置权限：
     - Account → D1 → Edit
   - 创建并保存 Token（只显示一次，请妥善保管）

3. **获取 Database ID**

   - 运行命令查看所有数据库：
     ```bash
     wrangler d1 list
     ```
   - 或在前端界面中，输入 Account ID 和 API Token 后自动加载

4. **在前端界面配置**
   - 选择"远程模式"
   - 输入 Account ID
   - 输入 API Token
   - 选择要管理的数据库
   - 点击"保存配置"

**优势：**

- ✅ 可管理任意线上数据库
- ✅ 无需重新部署即可切换数据库
- ✅ 支持多数据库管理

---

## 配置文件管理

### 配置文件位置

配置保存在项目根目录的 `.d1-gui-config.json` 文件中。

**注意：** 此文件已添加到 `.gitignore`，不会被提交到 Git 仓库，确保您的 API Token 安全。

### 配置文件结构

```json
{
  "version": "1.0",
  "connections": [
    {
      "id": "local-dev",
      "name": "本地开发数据库",
      "mode": "local",
      "description": "使用 Worker 绑定的本地数据库"
    },
    {
      "id": "production",
      "name": "生产环境数据库",
      "mode": "remote",
      "accountId": "your-account-id",
      "apiToken": "encrypted-token",
      "databaseId": "your-database-id",
      "description": "线上生产数据库"
    }
  ],
  "activeConnectionId": "local-dev",
  "settings": {
    "theme": "light",
    "autoSave": true,
    "queryHistory": true,
    "maxHistoryItems": 50
  }
}
```

### 多配置管理

您可以在配置文件中保存多个数据库连接：

1. 在前端界面点击"新建配置"
2. 输入配置信息
3. 保存后可在配置列表中切换

### 配置导入/导出

**导出配置：**

- 点击"导出配置"按钮
- 选择要导出的配置
- 下载 JSON 文件

**导入配置：**

- 点击"导入配置"按钮
- 选择之前导出的 JSON 文件
- 确认导入

**注意：** 导出的配置文件包含加密的 API Token，请妥善保管。

---

## 安全建议

### API Token 安全

1. **最小权限原则**

   - 只授予必要的权限（D1 Edit）
   - 不要使用 Global API Key

2. **定期轮换**

   - 定期更新 API Token
   - 删除不再使用的 Token

3. **本地存储**
   - API Token 加密存储在本地配置文件
   - 配置文件已添加到 .gitignore
   - 不要将配置文件提交到版本控制

### 生产环境建议

1. **使用专用 Token**

   - 为生产环境创建专用的 API Token
   - 与开发环境分离

2. **访问控制**

   - 限制能够访问配置文件的人员
   - 使用操作系统级别的文件权限保护

3. **审计日志**
   - 定期检查 Cloudflare 的审计日志
   - 监控异常的 API 调用

---

## 常见问题

### Q: 如何在团队中共享配置？

A: 建议每个团队成员使用自己的 API Token，不要共享配置文件。可以共享配置文件示例（`.d1-gui-config.example.json`），但不包含实际的 API Token。

### Q: 忘记 API Token 怎么办？

A: API Token 只在创建时显示一次。如果忘记，需要在 Cloudflare Dashboard 中重新创建一个新的 Token。

### Q: 可以同时使用本地和远程模式吗？

A: 可以！您可以在配置中同时保存本地和远程连接，随时切换使用。

### Q: 配置文件丢失了怎么办？

A: 配置文件丢失后，您需要重新配置连接信息。建议定期导出配置文件作为备份。

---

## 示例配置

项目中包含一个示例配置文件 `.d1-gui-config.example.json`，您可以参考该文件创建自己的配置。

复制示例文件并修改：

```bash
cp .d1-gui-config.example.json .d1-gui-config.json
```

然后编辑 `.d1-gui-config.json`，填入您的实际配置信息。
