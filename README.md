# 🤖 Telegram → Memos 转发机器人 (Cloudflare Workers)

一个轻量、无服务器的 **Telegram Bot**，运行在 **Cloudflare Workers** 上，用于将 Telegram 消息自动保存到 **Memos**。

> ✨ 无需服务器、无需数据库、无需 Docker  
> 全程运行在 Cloudflare 全球边缘节点中，安全、稳定、低延迟。

---

## 🧩 功能特性

- ✅ 将 Telegram 消息自动保存到 Memos  
- ✅ `/start` 命令：显示帮助说明  
- ✅ `/list` 命令：查看最近 5 条笔记  
- ✅ 安全的 Secret 校验机制  
- ✅ 所有敏感配置通过 Cloudflare 环境变量管理  
- ✅ 无需服务器即可部署  

---

## ⚙️ 环境变量配置

在 Cloudflare Workers 控制台中进入：

> **Settings → Variables → Environment Variables**

添加以下键值对：

| 变量名 | 示例值 | 说明 |
|--------|---------|------|
| `TG_BOT_TOKEN` | `1234567890:ABCDEF...` | Telegram BotFather 提供的 Token |
| `TG_WEBHOOK_PATH` | `/endpoint` | Webhook 接口路径（自定义） |
| `TG_WEBHOOK_SECRET` | `MySecretKey123` | Telegram Webhook 校验密钥 |
| `MEMOS_API` | `https://your-memos-instance/api/v1/memos` | Memos API 地址 |
| `MEMOS_TOKEN` | `eyJhbGciOiJI...` | Memos API Token（不含 “Bearer ” 前缀） |

---

## 🚀 部署步骤

### 1️⃣ 创建 Worker

在 Cloudflare Dashboard → **Workers & Pages → Create Application → Create Worker**

将 [`worker.js`](./worker.js) 的内容粘贴进去。

---

### 2️⃣ 设置环境变量

在 “Settings → Variables → Environment Variables” 添加上述 5 个变量。

---

### 3️⃣ 部署并注册 Webhook

部署成功后访问以下地址注册 webhook：

