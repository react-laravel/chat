# DogeOW Chat

独立的 DogeOW 实时聊天前端，可直接访问，也可安全嵌入已注册的 `*.dogeow.com` 子站。

## 本地运行

```bash
cp .env.example .env.local
npm ci
npm run dev
```

默认端口为 `3013`，API 通过 Next.js rewrite 转发到 `chat-api`。

## 嵌入

宿主 Origin 先在 `chat-api` 的 `chat_integrations` 表注册，然后加入：

```html
<div id="dogeow-chat"></div>
<script
  src="https://chat.dogeow.com/embed.js"
  data-client="rpg"
  data-target="#dogeow-chat"
  data-height="680px"
></script>
```

`data-mode="floating"` 可改为悬浮窗口。iframe 会根据真实 `document.referrer` 校验宿主 Origin；统一登录通过短期一次性票据完成。

## 验证

```bash
npm run type-check
npm test
npm run build
```
