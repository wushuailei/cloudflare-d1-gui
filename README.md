# Cloudflare D1 数据库管理工具

一个功能强大的 Cloudflare D1 数据库可视化管理工具，支持本地开发和远程管理两种模式。

![D1 GUI](https://img.shields.io/badge/Cloudflare-D1-orange) ![React](https://img.shields.io/badge/React-19-blue) ![Ant Design](https://img.shields.io/badge/Ant%20Design-5-blue)

## ✨ 特性

### 🔄 双模式支持

- **本地开发模式**：零配置，直接使用 Worker D1 绑定
- **远程管理模式**：通过 Cloudflare API 管理任意线上数据库

### 🔐 安全配置管理

- 配置保存在本地（localStorage）
- API Token 加密存储
- 支持多数据库配置
- 配置导入/导出功能

### 📊 强大的数据库管理功能

- 📋 查看所有数据表
- 🔍 查看表结构（字段、类型、约束）
- ⚡ SQL 查询编辑器（语法高亮）
- 📄 表数据浏览（分页、排序）
- ✏️ 数据增删改查
- 📊 查询结果统计

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 pnpm
- Cloudflare 账户（用于远程模式）

### 安装

```bash
# 克隆项目
git clone <your-repo-url>
cd cloudflare-d1-gui

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 即可使用。

### 部署

```bash
# 构建并部署到 Cloudflare Workers
npm run deploy
```

## 📖 使用指南

### 本地开发模式

1. 启动开发服务器：`npm run dev`
2. 打开应用，默认已配置本地开发连接
3. 点击"数据库连接"按钮，选择"本地开发数据库"
4. 开始使用！

### 远程管理模式

1. 获取 Cloudflare 凭证：

   - **Account ID**：在 Cloudflare Dashboard 右侧查看
   - **API Token**：Dashboard → My Profile → API Tokens → Create Token
     - 权限：Account.D1 (Edit)
   - **Database ID**：运行 `wrangler d1 list` 查看

2. 在应用中配置连接：

   - 点击"数据库连接"按钮
   - 点击"新建连接"
   - 选择"远程管理"模式
   - 填写凭证信息
   - 点击"测试连接"验证
   - 保存配置

3. 切换到新建的连接即可使用

详细配置说明请查看 [CONFIGURATION.md](./CONFIGURATION.md)

## 🎯 功能说明

### SQL 编辑器

- 支持 SQL 语法高亮
- 快捷键执行（Ctrl+Enter）
- 查询结果表格展示
- 执行时间统计

### 表数据浏览

- 查看表结构信息
- 分页浏览表数据
- 支持大数据量表
- 数据类型识别

### 数据库连接管理

- 多连接配置
- 连接快速切换
- 配置导入/导出
- 连接测试功能

## 📁 项目结构

```
cloudflare-d1-gui/
├── src/
│   ├── components/          # React 组件
│   │   ├── DatabaseConfig.tsx
│   │   ├── TableList.tsx
│   │   ├── SqlEditor.tsx
│   │   └── TableView.tsx
│   ├── services/           # 服务层
│   │   ├── api.ts
│   │   └── config.ts
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── worker/
│   └── index.ts            # Cloudflare Worker API
├── wrangler.jsonc          # Wrangler 配置
├── sample-data.sql         # 示例数据脚本
└── CONFIGURATION.md        # 配置指南
```

## 🛠️ 技术栈

- **前端框架**：React 19
- **UI 组件库**：Ant Design 5
- **代码编辑器**：Monaco Editor
- **构建工具**：Vite
- **运行时**：Cloudflare Workers
- **数据库**：Cloudflare D1

## 📝 示例数据

项目包含一个示例数据脚本 `sample-data.sql`，可以在 SQL 编辑器中执行来创建示例表和数据：

```sql
-- 创建用户、文章、评论表
-- 插入示例数据
-- 查看 sample-data.sql 文件了解详情
```

## 🔒 安全说明

- API Token 使用简单加密存储在 localStorage
- 配置文件不会提交到 Git（已添加到 .gitignore）
- 建议使用最小权限的 API Token
- 定期轮换 API Token

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Ant Design](https://ant.design/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
