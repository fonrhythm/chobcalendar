# Drama V1 私有开发

基线：834cb6e4abcfdbd0a710204c12dccec84c836358。分支：feature/drama-v1-private。

## 本地预览

npm ci --ignore-scripts
node node_modules/vite/bin/vite.js --config vite.drama.config.js --host 127.0.0.1 --port 4179 --strictPort

打开 http://127.0.0.1:4179/drama-preview.html 。仅绑定本机，不能作为远程私有测试部署。

独立入口不引入原 App、Supabase、Firebase 或线上活动服务。正式构建默认不包含此入口。测试资料保存在浏览器 localStorage，可导出 JSON 备份；当前没有导入恢复界面。

## 当前可体验

独立月历、剧集库、基础录入、固定多选类型、三语剧名至少一项、多个平台排期、平台图标链接、艺人角色与主演选择、原日期划线与新日期记录、相邻集公告、隔离活动的双向跳转。

## 尚需完成

真实后台与艺人目录接入；审查实际 Supabase schema、RLS 和管理员鉴权；独立测试数据库持久化；复用原 Calendar 活动弹窗；平台显示优先级与同日合并；周几排播及单独停播/未定新日期；批量调整预览；完整键盘弹窗行为；导入恢复；浏览器交互及移动视觉验收。

现在的 Calendar 活动页面使用隔离示例，并非已接入原 Calendar。当前录入界面是本地编辑器，不是正式管理员授权后台。

## 发布约束

不推送 main、不触发 workflow_dispatch、不执行 npm run deploy、不连接生产数据库。现有 Pages 工作流 push main 会自动发布，手动触发也可能发布开发分支。未经用户明确批准，不执行上述操作。不得把隐藏入口或 noindex 当作访问控制。

## 验证

93 项 Node 测试通过；独立预览构建与原应用构建通过；本机预览 HTTP 200。内嵌浏览器连接本机预览失败，尚未完成浏览器视觉和交互验收。
