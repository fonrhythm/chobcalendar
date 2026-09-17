# CHOB Calendar · Vue 展示端

基于 chobvue 原仓库（main / ff3a4bb）重构，使用 Vue 3 单文件组件、Composition API、Pinia 和 Vite。月度、周度和事项视图参考提供的三张设计图，地区配色保留原有数值。

## 先看这里

- 已实现：月历、周日程、事项列表、地区切换、公司与艺人类型筛选、搜索、三语界面、日详情、活动详情、多图切换、外部链接、本机收藏、官方描边星标、跨天事项、同步状态和缓存。
- 已配置你提供的 Apps Script /exec 地址。但当前执行环境连接该地址超时，**尚未验证现有接口的返回字段和真实数据**。配置地址不代表已经完成线上联调。
- 没有修改线上网站、Google Sheets 或 Apps Script 部署，也没有向 GitHub 推送。
- 本期是展示网站。录入网站、用户/管理员/公司登录、编辑删除权限、Excel/Sheets 批量导入界面留到下一阶段；“新增活动”在未配置录入站地址时显示筹备说明。
- 演示数据必须手动点击“查看演示”开启，并持续显示提示，不是实际艺人行程。演示购票链接为 example.com，海报为本地演示图。

## 本地运行

建议 Node.js 24.15 或更高的兼容版本（项目 engines 已声明要求）。

```sh
npm ci
npm run dev
```

打开终端显示的本地网址。首次请求真实接口超时约 20 秒；若失败可点“查看演示”检查三种视图。

包内已有 .env；若你的解压工具遗漏隐藏文件，复制 .env.example 为 .env。
不要双击 index.html 或 dist/index.html：ES 模块需要通过开发服务器或静态网站服务器访问。

```sh
npm test
npm run build
npm run preview
```

构建输出在 dist。包内附有本次构建产物，源码修改或 .env 改动后需要重新 build。
源码包不含 node_modules。

## 配置

```dotenv
VITE_APPS_SCRIPT_URL=你的公开只读接口地址
VITE_ENTRY_URL=
VITE_BASE_PATH=./
```

- 接口返回整个公开日程列表，浏览器按地区、日期和筛选条件处理。
- VITE_ENTRY_URL 是后续独立录入网站的网址；设置后“新增活动”跳转过去。
- VITE_BASE_PATH 默认为 ./，可部署在网站根目录或 GitHub Pages 子目录。
- VITE_ 配置会进入浏览器代码，不可放密码或写入密钥。
- .env 在 .gitignore 中。用 Git 自动构建时请在托管平台设置同名环境变量。

## 数据接入

详细字段和配套脚本见 docs/数据接口与接入.md、apps-script/Code.gs。
如果现有 Apps Script 的格式不同，需要调整 src/utils/records.js 或现有脚本的输出。不要直接覆盖你正在使用的线上脚本；可先建立独立测试部署。

接口成功后保存一份本地缓存；后续请求失败保留缓存并显示“离线缓存”。页面处于可见状态时每 5 分钟重试，重新切回页面也会同步。配套 Apps Script 的缓存为 60 秒。无需审核不等于实时推送：新增内容在下次成功刷新后出现。

## 行为约定

- 月历每格最多 3 条艺人标签，“还有 N 项”和日期按钮打开完整当天日程。
- 月度统计使用筛选后的当月活动，每项跨天活动只统计一次。
- 周视图日期行从周日开始；事项日期行从当前选中日期开始，左右箭头移动 7 天。
- 事项在开始到结束的每一天显示，**包含起止日**。没有结束日时只显示开始日。
- 日期保持来源提供的当地日期；时间不做跨时区自动换算。建议录入站同时展示所在地时区。
- 粉丝：分类实心底色；官方：透明底、1.5px 分类色描边和 ★。周视图的官方卡片也加分类描边和 ★。
- 收藏仅保存在当前浏览器，不宣称已经登录或跨设备同步。
- 页面界面支持中文、英文、泰文；艺人名、活动名等原始内容保留数据源文本，不自动翻译。

## 源码定位

- src/App.vue：页面框架、导航、弹窗入口。
- src/components/CalendarView.vue / WeekView.vue / TaskView.vue：三种视图。
- src/components/EventChip.vue / EventCard.vue / EventDetail.vue：活动呈现。
- src/components/BaseModal.vue：键盘焦点管理与 Esc 关闭。
- src/stores/view.js：地区、日期、筛选、视图。
- src/stores/events.js：数据、同步、缓存、收藏。
- src/stores/language.js：界面翻译。
- src/utils/config.js：三地区分类配色。
- src/utils/records.js：接口字段整理和链接过滤。
- src/styles/global.css：整体样式及手机适配。
- apps-script/Code.gs：可选的公开只读数据接口模板。
- tests/：日期、数据校验和 Apps Script 输出规则测试。
- src/stores/user.js、theme.js 与 src/utils/firebase.js：原仓库保留的后续功能基础，**本次展示端没有启用**。

Vue 候选版已调整为 3.5.43，并锁定实际安装依赖版本，避免重新安装时漂移。运行 npm ci 使用 package-lock.json。
