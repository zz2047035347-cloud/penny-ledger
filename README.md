# 打工人小账本（Penny Ledger）

一个**移动端优先的单页记账工作台**：数据不落在浏览器里，每张账本对应云端两张真实的数据表，记一笔 / 改一笔 / 删一笔即时写回；换手机、换浏览器打开同一地址（或输入账本编号）即可接着用。支持**月薪制**与**实习日薪制**两套真实时薪模型。

## 功能

| 模块 | 说明 |
|---|---|
| 真实时薪计算器 | 两种模式一键切换：**月薪制**（到手月薪 × 发薪月数）/ **实习日薪制**（日薪 × 每周出勤天数），综合在岗时长、加班、往返通勤、每日工作成本，逐行展开计算公式；日薪制附实习期总收益预估 |
| 今天你赚了多少 | 日薪制专属实时卡：按打卡时间逐秒进账（每秒 ¥x.xxxx），下班显示「今日已落袋」，休息日有休息日提示 |
| 10 秒记账 | 金额 + 类型（支出/收入）+ 分类 + 备注，保存瞬间换算「这笔 = 工作 X 分钟」 |
| 首页最近 4 笔 | 每笔带时间成本角标，支持就地改/删，即时同步云端 |
| 月度总结 | 当月收入、固定支出（居住/交通类）、弹性支出、结余，并折算本月支出 = 多少小时的劳动 |
| 自由基金 | 目标总额、进度条、月均支出、N 个月安全垫达标判定、达成所需月数与自由时间推算 |
| 存款曲线 | 手写**原生 SVG** 逐月累计结余折线（网格、k 刻度、数据点、渐变面积） |
| 情景模拟 | 通勤 ± 分钟、加班 ± 小时、涨薪 % 三滑杆实时对比；**转正 Offer 对比**：把实习日薪与意向转正月薪放到同一把「真实时薪」尺子上 |

## 运行与访问

- 本地预览：`node serve.js`（零依赖），打开 `http://127.0.0.1:8731`；任一静态服务器均可替代。
- 公网部署（手机/微信访问需要 https 公网地址）：把 `index.html` 发到 **GitHub Pages / Cloudflare Pages / Vercel** 等任意静态托管即可，无后端进程。

## iOS / 微信

- **iPhone**：Safari 打开 → 分享 → 「添加到主屏幕」，全屏 App 体验（已配 web app meta）。
- **微信**：链接发到聊天里点开即用。
- **做成原生微信小程序的两条路**（当前是 H5，不是小程序本体）：
  1. 小程序内 `web-view` 嵌本页面：要求域名 ICP 备案 + 小程序后台配置「业务域名」。
  2. 把存储层换成微信云开发数据库（`records`/`settings` 两个集合）：页面逻辑基本全保留，只需替换 `cloudRead / cloudWrite / rawWrite+rawRead` 三个函数（见下）。

## 数据架构（在线双表）

存储层为 kvdb.io 键值库（免账号、CORS 直连），每个账本两张在线数据表：

```
https://kvdb.io/{BUCKET}/{LEDGER}-records    →  流水表（JSON 数组）
https://kvdb.io/{BUCKET}/{LEDGER}-settings   →  设置表（JSON 对象）
```

- 默认进入 `main` 公共演示账本（表名 `records`/`settings`）。
- 「创建我的独立账本」→ 生成 7 位编号（如 `K7M2XQ9`），自动建出专属两张表并带入当前数据；此后读写只碰专属表。
- 换设备：打开同一链接（含 `?ledger=编号`）→ 或在「设置」输入编号 →「打开」。

流水表元素：

```json
{ "id": "r…", "ts": 1788486402039, "type": "expense|income",
  "cat": "food|transit|rent|fun|shop|med|other|salary|parttime|otherin", "amount": 25, "note": "午餐" }
```

设置表：

```json
{ "payMode": "daily|monthly", "dailyPay": 200, "attendDaysPerWeek": 5, "internMonths": 3,
  "workStartHour": "09:00", "restDay": 6,
  "netPay": 12000, "payMonths": 12, "workdaysPerWeek": 5,
  "dailyHours": 8, "overtimePerDay": 0.5, "commuteOneWayMin": 35, "workCostPerDay": 22,
  "freeFundTarget": 100000, "safetyMonths": 6 }
```

## 可靠性设计（不白屏、不静默丢数据）

- 加载顺序：本地缓存**先渲染界面** → 后台并行拉两张云端表 → 到达后整体刷新；首屏不等网络。
- 读失败：顶部红色横幅写明原因（HTTP 码/网络），当前显示最近一次缓存；「重试」可手动重拉，**永不白屏**。
- 写失败：先落本地缓存并进待同步队列（pending），横幅提示「已暂存本地，可重试补写」；重试/下次加载自动补推并按记录 id 合并，**不丢记录**。
- 每次云端读取都带随机 cache-buster（kvdb 响应带 30 天 expires 缓存头，必须穿透）。

## 换成自己的长期后端（约 10 分钟）

`index.html` 顶部 `CONFIG` 是存储层唯一入口。推荐 Supabase（免费、真 Postgres 表、自带 CORS）：

```js
// 1) 建表：records(id text, data jsonb) / settings(id text, data jsonb)，id 用 "{ledger}-{表名}"
// 2) 替换三个函数即可，其余逻辑零改动：
async function cloudRead(table){ /* GET supabase rest: select data where id = key(table) */ }
async function cloudWrite(table, value){ /* upsert 同一行 */ }
async function genLedgerCode(){ /* 可选：改 UUID */ }
```

## 风险与边界（诚实声明）

- kvdb 免费桶：约 **3 个月未访问 key 过期**（每次打开页面都会触碰全部两张表续期；「设置」页显示剩余天数提醒）；单桶 10MB / 10,000 次写。长期使用请尽快换 Supabase。
- kvdb 现已不允许免验证邮箱新建桶，故「独立账本」用同桶内**编号分表**实现；数据互相隔离，但**账本编号即钥匙**——泄露=他人可读写，丢失且无备份=不可恢复。请定期「导出 JSON 备份」。
- `main` 是公共演示账本，数据公开可读——正式使用请第一时间创建独立账本。

## 文件

- `index.html` —— 全部应用（单文件、无构建、无依赖）
- `serve.js` —— 本地预览静态服务器（Node）
- `README.md` —— 本文件
