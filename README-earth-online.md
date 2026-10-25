# 地球online｜多人 3D 方塊沙盒

本專案目標是把 Minecraft Online 方塊沙盒改版為「地球online」，使用 Cloudflare Workers + Durable Objects 提供即時多人連線，並使用 Supabase PostgreSQL 備份多人房間世界資料。

## 保留功能
- 多人房間、方塊破壞與放置、手機搖桿、背包與合成、聊天、怪物與動物。
- 房間邀請連結、管理員公告、玩家清單與移出玩家。
- Durable Objects 保存即時方塊修改；設定 Supabase 後同步世界種子與方塊修改。

## Supabase
在 Supabase SQL Editor 執行 `supabase/migrations/202610250001_earth_online_worlds.sql`。
Worker 需設定 secrets：
```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
SUPABASE_URL 為專案 URL；SUPABASE_SERVICE_ROLE_KEY 僅放在 Worker Secret，絕不可提交到 Git 或前端。

## 部署
```bash
npm install
npx wrangler login
npx wrangler deploy
```
