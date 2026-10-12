# 防爬服务

网页和小程序通过 https://chobcalendar-wechat.chobjaii.workers.dev/feed 加载公开日历。网页构建必须配置 VITE_PUBLIC_FEED_URL；本地开发也需设置该值，否则会提示服务未配置，不回退直连。服务器位于 miniprogram/worker，保持既有微信登录服务及 secrets，新增 FEED_LIMITER 每 IP 每分钟 10 次。Cloudflare 按节点计数，并非精确全局配额。

旧 Supabase 主 feed 和 legacy feed 已撤销 PUBLIC/anon/authenticated 调用权限，活动和事项公开读表规则设为 false；艺人和 CP 直接读取仅开放后台编辑者。普通浏览使用网关，后台编辑依赖既有 editor/admin policies。

微信正式版需重新上传并发布；旧客户端直连会被拒绝。当前网关一次仍返回完整公开 feed，能限制频率，不能阻止低频复制全量数据。后续按时间范围、字段和数量限制需同时调整网页和小程序。

迁移和回滚见本目录 SQL。回滚会恢复原公开抓取入口。不要重跑旧迁移覆盖这些权限。
