# 地球online｜多人 3D 方塊沙盒

此儲存庫正在由「3D Dig & Flow Sandbox」轉換為「地球online」。Cloudflare Worker 多人後端與 Supabase 世界資料表已提交；前端整合與實際部署尚未完成，請勿將目前主分支視為已可上線版本。

## 已提交的後端元件
- `src/worker.js`：Cloudflare Worker WebSocket、Durable Objects 房間、方塊資料同步、管理員公告/玩家清單/移出玩家，以及 Supabase 世界資料同步。
- `wrangler.toml`：Cloudflare Workers 設定。
- `package.json`：Wrangler 開發、部署與語法檢查指令。
- `supabase/migrations/202610250001_earth_online_worlds.sql`：Supabase 世界保存資料表。
- `README-earth-online.md`：功能與設定說明。

## Supabase 設定
Supabase 專案已恢復，資料表 migration 已套用。Project URL：
`https://xjfphzwhbmegybdofsgj.supabase.co`

部署 Worker 前，請設定以下 Worker Secrets（不要提交到 Git）：
```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
其中 `SUPABASE_URL` 使用上方 URL；`SUPABASE_SERVICE_ROLE_KEY` 必須是該 Supabase 專案的 service-role secret，只能存在伺服器端。

## 部署前尚待完成
1. 將上傳的 Minecraft Online 實際前端放入 `public/index.html`，並將大廳與遊戲內文字統一改為「地球online」。
2. 確認 Worker、前端及 Durable Objects 路由一致。
3. 執行 `npm install`、`npm run check`，再以兩個瀏覽器/裝置測試多人、方塊同步、重連後世界還原與管理員操作。
4. 設定 Cloudflare Worker Secrets 並部署。
