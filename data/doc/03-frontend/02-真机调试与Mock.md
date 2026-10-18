# 真机调试与 Mock

> 目标：手机扫码就能看到可点的调试版小程序，不依赖本机后端、不依赖局域网 IP。
> 落地位置：`miniprogram/services/mock/`（`data.ts` 数据 + `index.ts` 路由）。

## 1. 为什么默认走 Mock

手机预览时 `localhost:3000` 指向手机自己，必然连不上；改局域网 IP 又会被微信校验域名/证书。
所以 develop 环境（含真机预览）默认开 Mock：`services/request.ts` 在发请求前先问 `mockEnabled()`，命中路由直接返回本地数据，页面代码与真实后端完全一致。

## 2. 三层开关（优先级从高到低）

| 层 | 位置 | 说明 |
| --- | --- | --- |
| 运行期 | storage `pp_mock` = `on` / `off` | 「我的 → Mock 接口数据」开关，切换后立即生效，杀进程仍保留 |
| 环境 | `config/env.ts` 的 `MAP[env].mock` | develop = true；trial / release = false，避免体验版连到假数据 |
| 兜底 | 无 | 两者都没有时按 `env.mock` 走 |

体验版要连真实后端时：把 `trial.mock` 改 false 并部署域名，或在「我的」里关掉开关（仅 develop 显示该入口）。

## 3. 手机查看步骤

1. 微信开发者工具打开 `miniprogram/` 目录（AppID 已配 `wx932d1c38462f907c`）。
2. 右上角 **预览** → 生成二维码 → 手机微信扫码。
3. 详情 → 本地设置 → 勾选「不校验合法域名…」（Mock 只影响接口，封面图走 `picsum.photos`，仍需要这一步）。
4. 真机冷启动即可看到首页列表 → 点卡片进详情 → 报名 → （付费活动）收银台 → 模拟支付 → 电子票。

> 没有开发者工具账号权限时，可用 `miniprogram-ci` 上传体验版，但这需要在小程序后台下载上传私钥，目前仓库未配置。

## 4. Mock 覆盖的接口（与契约同构）

| 接口 | 说明 |
| --- | --- |
| `GET /app/config`、`/app/cities`、`/app/agreement`、`POST /app/privacy-consent` | 配置、城市分组、协议、隐私同意 |
| `POST /auth/login`、`/auth/refresh` | 直接返回固定 token（`mock-token`），登录态可持久化 |
| `GET /home/feed` | 城市/分类/排序/游标分页，7 条活动数据 |
| `GET /activities/:id`、`POST /activities/:id/signups` | 详情（含场次、亮点、同城推荐）、报名；0 元直接出票，付费生成待支付订单 |
| `POST /orders`、`GET /orders/:id`、`POST /orders/:id/mock-pay` | 下单/订单详情（含 15 分钟倒计时）/模拟支付出票 |
| `GET /tickets`、`GET /tickets/:id` | 票夹、电子票（二维码为 token 生成的占位点阵，不做真实扫码） |
| `GET /campaigns`、`/campaigns/:id`、`/campaigns/:id/checkpoints` | 挑战赛列表/详情/打卡点 |

状态（报名、订单、票）写 storage `pp_mock_state`，重启小程序仍在；想回到初始数据清缓存即可。

## 5. 与真实后端的差异

- 出票/支付只改本地状态，没有任何风控与幂等校验；
- 二维码是按 token 画出来的占位图形，不是可扫的真实码；
- 挑战赛的 `joined` / 进度恒为未参加（打卡闭环在 M3）。

切到真实后端（本机联调）时：关掉「我的 → Mock 接口数据」，后端跑在 `localhost:3000`，开发者工具勾选「不校验合法域名」即可。
