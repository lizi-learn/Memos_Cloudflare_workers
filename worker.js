/**
 * Telegram ↔ Memos 转发机器人
 * Cloudflare Workers 版本（支持环境变量）
 * 
 * 环境变量需在 Cloudflare Dashboard 设置：
 *  - TG_BOT_TOKEN     Telegram Bot Token
 *  - TG_WEBHOOK_PATH  Webhook 路径，如 /endpoint
 *  - TG_WEBHOOK_SECRET Webhook 密钥
 *  - MEMOS_API        Memos API 地址，如 https://memos.bismih.cn/api/v1/memos
 *  - MEMOS_TOKEN      Memos Bearer Token（不带 Bearer 前缀也可以）
 */

export default {
  async fetch(request, env, ctx) {
    const TOKEN = env.TG_BOT_TOKEN;
    const WEBHOOK = env.TG_WEBHOOK_PATH || '/endpoint';
    const SECRET = env.TG_WEBHOOK_SECRET;
    const MEMOS_API = env.MEMOS_API;
    const MEMOS_TOKEN = env.MEMOS_TOKEN.startsWith('Bearer ')
      ? env.MEMOS_TOKEN
      : `Bearer ${env.MEMOS_TOKEN}`;

    const { pathname, searchParams, origin } = new URL(request.url);

    // ========== 注册 Webhook ==========
    if (pathname === '/registerWebhook') {
      const url = `https://api.telegram.org/bot${TOKEN}/setWebhook`;
      const workerUrl = `${origin}${WEBHOOK}?secret=${SECRET}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: workerUrl }),
      });
      return new Response(await res.text(), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
    }

    // ========== Telegram Webhook 回调 ==========
    if (pathname === WEBHOOK) {
      if (searchParams.get('secret') !== SECRET) {
        return new Response('Unauthorized', { status: 403 });
      }

      const update = await request.json();
      return await handleUpdate(update, TOKEN, MEMOS_API, MEMOS_TOKEN);
    }

    return new Response('✅ Worker 正常运行', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

/**
 * 处理 Telegram 消息
 */
async function handleUpdate(update, TOKEN, MEMOS_API, MEMOS_TOKEN) {
  if (!update.message || !update.message.text) {
    return new Response('No message');
  }

  const chatId = update.message.chat.id;
  const text = update.message.text.trim();

  if (text === '/start') {
    await sendMessage(TOKEN, chatId, '👋 欢迎使用 Telegram → Memos 转发助手！发送任意消息即可保存到你的 Memos。');
    return new Response('ok');
  }

  if (text === '/list') {
    try {
      const res = await fetch(MEMOS_API, { headers: { Authorization: MEMOS_TOKEN } });
      const json = await res.json();
      const memos = json.data || [];
      const latest = memos.slice(0, 5).map(m => `📝 ${m.content}`).join('\n\n') || '暂无笔记';
      await sendMessage(TOKEN, chatId, `最近 5 条笔记：\n\n${latest}`);
    } catch (e) {
      await sendMessage(TOKEN, chatId, `⚠️ 获取 Memos 列表失败：${e.message}`);
    }
    return new Response('ok');
  }

  // === 默认：保存到 Memos ===
  const res = await fetch(MEMOS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MEMOS_TOKEN,
    },
    body: JSON.stringify({ content: text }),
  });

  if (res.ok) {
    await sendMessage(TOKEN, chatId, '✅ 已保存到 Memos！');
  } else {
    const err = await res.text();
    await sendMessage(TOKEN, chatId, `❌ 保存失败：${err}`);
  }

  return new Response('ok');
}

/**
 * 向 Telegram 发送消息
 */
async function sendMessage(TOKEN, chatId, text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
