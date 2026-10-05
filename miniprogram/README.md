# Chob Calendar 微信客户端

原生微信小程序，项目 AppID：`wxf1f32e829893b9f8`。Supabase 继续是唯一主数据库；Admin 继续使用现有 Vue 后台。

## 启动游客版本

在微信开发者工具中导入 **`C:\software\chobvue\miniprogram`**（不要只导入 client 子目录）。无需 npm 构建。

`client/config.js` 已从当前 Web 的 `.env` / `.env.local` 同步公开 Supabase URL 和 publishable key。变更 Web 业务函数后在此目录运行 `node scripts/sync.cjs`；生成的是 CommonJS 模块，保留 Web 原模块。

游客可浏览 China / Thailand / Overseas，切换月/周/日、日期、搜索、多选公司/艺人类型/活动分类/艺人、详情和海报。筛选 picker 重复选择可取消；“全部”清空该类筛选。详情“分享”直接进入对应活动。购票只显示渠道，不开放外链。

`app.json` 默认开启合法域名校验。需要在公众平台添加 config 中 Supabase HTTPS 域名为 request 合法域名。未配置时，可以仅在开发者工具本地调试临时勾选“不校验合法域名”；这不代表真机或正式版本通过。

## 登录、收藏和审核

1. Supabase SQL Editor 执行 `database/032_wechat_client.sql`（Admin 中有相同文件 `supabase/032_wechat_client.sql`，任选一份执行）。需现有迁移 001–031 和当前 RPC。不要执行初始化脚本覆盖已有数据库。
2. 在 Cloudflare 账户创建/部署 `worker` 中的 Worker。首次可先部署到 workers.dev 测试；正式微信请求需要配置公众平台可接受的 HTTPS 自定义域名。当前 Worker 已部署，workerUrl 与合法域名已由用户配置；本次更新保留这些配置。
3. 在 worker 目录执行下面命令。每条 secret 命令会提示输入，**不要把值写进源码或聊天**：

```powershell
npx wrangler login
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put IDENTITY_HMAC_SECRET
npx wrangler deploy
```

WECHAT_APP_ID 填上述 AppID；IDENTITY_HMAC_SECRET 使用至少32字节随机值，首次部署后保持稳定。其余值来自微信公众平台、当前 Supabase 项目。rate-limit namespace `1001` 如已被其他 Worker 使用，请改为账户中未占用的正整数字符串。[限流绑定文档](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。

4. 将部署好的 HTTPS 域名填进 `client/config.js` 的 workerUrl（不带尾部 `/`），公众平台添加该 request 合法域名。Supabase Email Auth 需启用，Worker 使用服务器端 [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) 和 [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp) 换取标准会话，不发送邮件，不要求手机号。
5. 发布更新后的现有 Admin。入口：**消息与核实 → 小程序投稿**。可预览完整内容、在活动管理中修改草稿、通过或拒绝并回复。纠错继续使用原“纠错”入口。

微信 OpenID 只存 Supabase 私有 schema，按 AppID 唯一绑定 Auth UUID。用于兼容现有 schema 的内部 email 是 HMAC 派生的不可收信地址，不要求用户提供邮箱，UI 不展示该地址。身份验证仍由微信完成。跨设备使用同一微信和同一 AppID 会进入同一 UUID，收藏使用原 `chob_personal.favorites`，原子追加/删除，避免覆盖其他个人资料。已有 Web 账号应先在 Web 个人中心“生成微信账号绑定码”，5分钟内粘贴到小程序“绑定已有账号并登录”。只有验证过的原 Web 会话可签发一次性码，Worker 同时验证微信 code；绑定复用原 UUID，不修改角色或复制收藏/投稿。已经绑定不同 UUID 的微信会被拒绝，不会自动合并。

投稿先创建现有 events/tasks **草稿**，并附审核记录；一个事务完成，公开 feed 不会看到待审核内容。审核通过后同事务公开活动和关联事项，拒绝保留草稿和原因。033 通过已登记的微信 session_id 限制直接发布和后台写入，同一 UUID 的 Web 会话保持原权限。刷新保留会话分类；退出仅撤销当前微信会话，分类记录保留以阻止旧 JWT 绕过审核。`chob_submission_reviews` 仅是审核记录，并非独立活动或收藏数据库。

## 海报与真机验收

2026-10-05 已只读访问真实 feed（291 条记录、913 位艺人）及一张 `pbs.twimg.com` 海报，当前电脑返回 HTTP 200。尚未完成微信模拟器和手机网络验收，因此没有建立图片搬运或 CDN。

实际图片域名：`pbs.twimg.com`、`assets.kktix.io`、`atkmedia.allticket.com`、`scontent-nrt1-2.xx.fbcdn.net`、`ticket.ibon.com.tw`、`tm-prod-event-files-v3.ticketmelon.com`、`wx3.sinaimg.cn`、`x.com`。开发者工具及真机需分别检查加载、预览与域名限制；其中 x.com 页面型 URL 不保证是可显示的图片。失败时详情显示提示，控制台保留微信图片错误。

真机测试：游客获取最新数据 → 三地区/三视图/筛选/跨天 → 海报加载与预览 → 分享给另一账号打开详情 → 微信登录 → 两台设备收藏同步 → 投稿显示待审核且游客不可见 → Admin 通过/拒绝 → 用户状态及回复 → 活动纠错与 Admin 原流程。

## 已验证及限制

本次测试通过：Web 29项、Admin 34项、客户端10项、Worker7项，共80项。覆盖原功能、迁移重复执行、首次绑定和原 UUID 复用、一次性码失效/冲突、会话刷新与退出竞态、微信/Web 权限隔离、旧 JWT 防绕过、收藏、投稿审核、纠错 ID 和详情分享。Web/Admin 构建通过，微信官方编译预览通过（72.0 KB）。真实微信登录和跨设备行为仍需真机验收。

更新：用户已授权并开启服务端口。微信官方编译和预览成功，模拟器已显示真实活动数据；已修复按钮过度换行和七列月历溢出。project.private.config.json 仅为本地调试关闭域名校验，正式 project.config.json 仍保持校验。用户已确认详情、海报、Worker、合法域名和 secrets 正常。新增 033 尚待在线执行，新 Worker 尚待部署；账号绑定、会话刷新、收藏及投稿审核仍需真机验收。

主日历、详情操作、投稿/纠错表单及审核状态支持中/英/泰；原始活动内容、来源数据库的分类名称和服务器校验消息保留原语言。无支付、评论、社区、独立腾讯云数据库或独立 Admin。


## 本次会话隔离更新的上线顺序

1. 在 Supabase SQL Editor 执行 database/033_wechat_sessions.sql（Admin 有相同副本）；032 必须已执行。迁移可重复运行，不重建已有数据库。
2. 在 worker 目录执行 npx wrangler deploy，保留全部现有 secrets，尤其 IDENTITY_HMAC_SECRET。
3. 发布 Web 以提供绑定码入口，重新编译小程序。原 Admin 审核入口无需新增界面。
4. 原 Web 用户先生成绑定码再登录小程序；新用户直接微信登录。已绑定不同账号的微信禁止自动合并。
5. 真机确认登录后回到原详情并完成一次收藏；投稿/纠错登录后保留表单但由用户再次提交。检验同账号 Web 与微信权限隔离、跨设备收藏、刷新与退出、审核状态、分享直接进详情。

不要在迁移前部署新 Worker：会话登记失败会拒绝返回登录凭证。绑定码仅展示/复制，不存客户端持久缓存。测试仅用合成 Auth 会话和微信响应，不能替代真实微信登录验收。
