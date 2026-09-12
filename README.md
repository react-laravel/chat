# DogeOW Chat

面向单社区、自部署场景的实时聊天产品，后端为独立仓库 `chat-api`。支持独立访问和已授权网站嵌入。

已接入真实 API 的功能包括公开/私有房间、邀请、历史搜索、引用回复、消息编辑与删除、表情回应、附件、未读同步、成员管理和举报处理。桌面采用房间与对话两栏，手机和浮窗按需打开房间、成员与管理界面。

## 本地运行

```bash
cp .env.example .env.local
npm ci
npm run dev
```

使用 Node.js 24。默认端口为 `3013`，API 通过 Next.js rewrite 转发到 `CHAT_API_ORIGIN`。统一身份和 Reverb 参数见 `.env.example`；前端只配置公开的 Reverb app key，不配置 app secret。

## 嵌入

宿主的精确 Origin 需同时注册到 `chat-api` 的 `chat_integrations.allowed_origins`，并加入前端 `CHAT_EMBED_ORIGINS`（逗号分隔；修改后重新构建）。将示例域名和 client 替换为实际配置：

```html
<div id="dogeow-chat"></div>
<script
  src="https://chat.dogeow.com/embed.js"
  data-client="rpg"
  data-target="#dogeow-chat"
  data-height="680px"
  data-theme="system"
  data-accent="#ff9d18"
></script>
```

`data-mode="floating"` 改为右下角可关闭、重新打开的悬浮窗口，并显示未读数量。`data-title` 配置标题，`data-label` 配置入口文字，`data-width` / `data-height` 配置尺寸，`data-room` 配置初始房间（仍受房间权限约束）；未指定房间时采用后端接入配置的 `default_room_id`。主题可选 `light`、`dark`、`system`，强调色为六位十六进制色值。

iframe 根据真实 `document.referrer` 校验宿主 Origin。统一登录沿用短期一次性票据；部署时需验证实际域名下的 Cookie、回调地址和浏览器隐私策略，推荐同站点子域部署。宿主不能通过消息事件注入身份或提升权限。

嵌入脚本校验消息来源窗口、Origin 和 client。内部事件包括 `dogeow-chat-ready`、`dogeow-chat-unread`（`count`）和 `dogeow-chat-close`；脚本发送 `dogeow-chat-visibility`，仅在窗口展开、页面可见且 iframe 大部分位于视口内时允许同步已读。自行实现宿主时需保留相同校验和可见性协商。

## 验证

```bash
npm run type-check
npm run lint
npm test
npm run build
```

数据库迁移、私有附件目录、队列与广播进程必须随配套 `chat-api` 版本发布，详见后端 `docs/message-api.md`。本地自动化检查和隔离环境联调不代表生产部署或容量承诺。
