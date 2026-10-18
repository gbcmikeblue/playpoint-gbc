# API 接口契约

Base：`https://{env}-api.playpoint.xx/api/v1`
鉴权：`Authorization: Bearer <token>`（除标注 `public` 的接口）
分页：游标式 `?cursor=<opaque>&limit=20`，返回 `{ list, nextCursor, hasMore }`

## 1. 通用响应

```json
{ "code": 0, "message": "ok", "data": {}, "traceId": "a1b2c3" }
```

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 1001 | 参数错误（`data.errors` 给出字段级信息） |
| 1002 | 资源不存在 |
| 1003 | 频率超限 |
| 2001 | 未登录 / token 失效 |
| 2002 | 无权限 |
| 3001 | 活动已满 |
| 3002 | 重复报名 |
| 3003 | 活动已结束 |
| 4001 | 打卡超出范围 |
| 4002 | 今日已打卡 |
| 4003 | 未报名该挑战 |
| 5001 | 昵称违规 |
| 6001 | 会话不存在或无权访问 |
| 7001 | 订单不存在 / 已支付（重复支付按成功处理） |
| 7002 | 订单已过期或已取消 |
| 7003 | 订单金额与业务不匹配 |

## 2. 认证与基础（public 优先）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | body `{code, scene?}` → `{token, refreshToken, isNew, user}` |
| POST | `/auth/refresh` | body `{refreshToken}` → 新 token |
| POST | `/auth/logout` | 失效当前 token |
| GET | `/app/config` | `public` → `{version, agreementVersion, categories[], cities[], signupSchema}` |
| GET | `/app/cities` | `public` → 热门/全部城市 |
| POST | `/app/privacy-consent` | `{docVersion, action}` → 记录同意 |
| GET | `/app/agreement` | `?type=user\|privacy` → 富文本 HTML |
| POST | `/track` | 埋点批量上报 `{events[]}` |

## 3. 首页

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/home/feed` | `public`。`?city=&categoryId=&sort=&cursor=&limit=` → `{banners[], categories[], ad, list[]}`（**一次聚合，首屏只打一个接口**） |
| GET | `/home/banners` | `?slot=` 单独取运营位 |
| GET | `/search` | `?keyword=&tab=club\|activity&cursor=` → `{clubs[], activities[]}`；活动项含 `joinText`（"31人已上车"）、`statusText`（"报名中"/"仅剩9人"）、`kmText`（"20.7km 深圳万象天地"）、`tags[]`，均由后端拼好；俱乐部项内嵌 `latestActivity` |
| GET | `/search/suggest` | 热搜词 + 默认推荐（搜索历史由前端 `storage` 维护，不上接口） |
| GET | `/search/hot-words` | 热门搜索词 |

`home/feed` 的 `list[]` 项：

```json
{
  "id": "1001", "type": "activity",
  "coverUrl": "...", "title": "10.18周日匹克球热身畅打4h｜全天",
  "startAt": "2026-10-18T18:00:00+08:00",
  "weekText": "周日", "timeText": "18:00", "isToday": true,
  "poiName": "匹克球体育中心(匹克球)", "district": "浦东新区",
  "priceCent": 0, "joinedCount": 12, "capacity": 20,
  "tags": ["匹克球"]
}
```

## 4. 活动与报名

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/activities/:id` | 详情：`{title,cover,tags,sessions[],poiName,distanceText,address,lat,lng,joinedCount,capacity,refundPolicy,highlights[],host,joinSchema,recommend[]}`；`sessions` 供详情页日历选择，`highlights` 为「本场怎么玩」富文本段 |
| GET | `/activities/:id/signup-status` | `{joined, signupId, ticketId}` |
| POST | `/activities/:id/signups` | body `{nickname, gender, avatarUrl, extra}` → `{signupId, needPay}`；`needPay=true` 时另返 `{orderId, amountCent, expireAt}`，前端跳收银台 |
| POST | `/signups/:id/cancel` | 取消报名（过期不退） |
| GET | `/tickets` | `?type=1\|2\|3\|4&status=&cursor=` 票夹 |
| GET | `/tickets/:id` | 票详情（含 `qrToken`） |
| POST | `/tickets/:id/verify` | 主理人核销 `{qrToken}` |

报名错误：`3001` 满员、`3002` 重复（前端按已报名处理）、`3003` 已结束。

## 5. 打卡挑战

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/campaigns` | `?city=&cursor=` → 卡片列表（seal/title/dateRange/images/joinedCount/medalHint/joined） |
| GET | `/campaigns/:id` | 详情（banner/region/description/rewards/checkpoints 摘要/myProgress） |
| GET | `/campaigns/:id/checkpoints` | 打卡点列表 `[{id,seq,name,coverUrl,intro,distanceText,checked}]`；`distanceText` 服务端计算（"距你 1.03km"），前端不换算 |
| GET | `/campaigns/:id/rank` | 通关用时榜 `?period=total\|day&cursor=` → `{top3:[{rank,avatar,nickname,durationSec,likes}], list:[{rank,avatar,nickname,durationSec,likes,liked,isMe}]}`；昵称脱敏（`g*y`）在后端完成 |
| POST | `/campaigns/:id/signups` | `{nickname, gender, avatarUrl}` → `{signupId, needPay, ticketId?}`；0 元直接出票，付费返回 `{orderId, amountCent, expireAt}` |
| GET | `/campaigns/:id/progress` | `{joined, finished, checkins:[{checkpointId, at, images}], total, done}` |
| POST | `/campaigns/:id/checkins` | `{checkpointId, images[], content, lat, lng}` → `{progress, newMedals[]}` |
| GET | `/checkins` | 我的打卡记录 `?campaignId=&cursor=` |

`newMedals[]`：`{medalId, name, iconUrl, description}`，前端据此播放奖牌动画。

## 6. 用户与个人资料

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/users/me` | 完整档案（含 mbti、ladders、tags、stats） |
| PATCH | `/users/me` | 可改 `nickname/avatarUrl/gender/birthday/about/signature/mbti/tags` |
| POST | `/users/me/avatar` | 换头像（传 fileId） |
| GET | `/users/:id` | 他人主页 |
| POST | `/users/:id/follow` / `DELETE` | 关注/取关 |
| GET | `/users/me/signup-info` | 常用报名信息 `{nickname, gender, avatarUrl, persons[]}` |
| PUT | `/users/me/signup-info` | 保存 |
| POST | `/users/me/deactivate` | 注销申请 |
| POST | `/users/me/mbti` | `{mbti}` → 同时置 `mbtiSeen=true` |

校验：昵称 1-20 字、签名 ≤50 字、标签 ≤5 个、MBTI 必须命中 16 型枚举。

## 7. 兴趣天梯

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/ladder/sports` | 运动清单（7 项 + 建议项）+ 插画 + 副标题 + 是否已完成 |
| GET | `/ladder/sports/:sport/questions` | 题目 `[{key,title,desc,type:single\|multi,options:[{key,label,level,desc}]}]` |
| POST | `/ladder/sports/:sport/submit` | `{answers:[{questionKey,optionKey}]}` → `{level, levelText, goodAt[]}` |
| GET | `/ladder/me` | 我的天梯 `[{sport, level, levelText, goodAt}]` |
| POST | `/ladder/suggest` | 兴趣建议 `{content}` |

## 8. 消息

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/conversations` | 会话列表（含 `unreadCount`、`lastDigest`、`lastAt`） |
| GET | `/conversations/:id/messages` | `?before=<msgId>&limit=20` 倒序历史 |
| POST | `/conversations/:id/messages` | `{type:1\|2\|3, content, extra}` → 消息体 |
| POST | `/conversations/:id/read` | 清未读 `{lastMessageId}` |
| GET | `/messages/unread` | `{total, byConversation:{}}` → tabBar 角标 |
| GET | `/notices` | 通知消息流 `?cursor=` → `[{id,eventType,bizTitle,thumbUrl,title,content,createdAt,read}]`；`bizTitle` 是卡片上段灰色业务名，`title` 是加粗事件标题 |
| POST | `/notices/read` | `{ids[]}` 或 `{all:true}` |

## 8A 订单与模拟支付

> **不接微信支付**：无商户号、无预支付签名、无回调验签、无对账。`mock-pay` 直接改库并返回成功。
> 0 元订单不落库，报名接口直接出票。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/orders` | 通用下单 `{bizType:1\|2, bizId}` → `{orderId, orderNo, amountCent, expireAt}`；已存在待支付单则复用 |
| GET | `/orders/:id` | 收银台数据：`{orderNo, title, coverUrl, amountCent, status, expireAt, payChannel}` |
| POST | `/orders/:id/mock-pay` | 模拟支付。成功 → `{status:1, paidAt, ticketId}`；已支付重复调用也返回成功（幂等）；过期返回 `7002` |
| POST | `/orders/:id/cancel` | 用户主动取消 → `{status:2}`，释放名额 |
| GET | `/orders` | 我的订单 `?status=&cursor=`（待支付单在票夹/我的页可见） |

状态机：`0 待支付 → 1 已支付 | 2 已取消 | 3 已过期`，终态不可逆。
`mock-pay` 事务内完成：订单置 1 → 报名置 1 → `joined_count+1` → 生成票 → 触发消息。

## 9. 上传

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/upload/sts` | 返回 COS 临时密钥 `{credentials, bucket, region, keyPrefix, expireAt}` |
| POST | `/upload/callback` | 上传完成后登记 `{key, size, mime}` → `{fileId, url}` |

约束：仅 `image/jpeg|png|webp`，单文件 ≤10MB，头像必须 1:1 且 ≥200×200。

## 10. 后台管理（`/admin/v1`，RBAC）

| 模块 | 接口 |
| --- | --- |
| Banner | `GET/POST/PUT/DELETE /admin/v1/banners`，支持排序与上下架 |
| 分类 | `GET/POST/PUT /admin/v1/categories` |
| 活动 | `GET /admin/v1/activities`（筛选/审核）、`PUT /:id/status`、`GET /:id/signups`、`POST /:id/checkin-verify` |
| 挑战赛 | `CRUD /admin/v1/campaigns`、`CRUD /:id/checkpoints`、`GET /:id/checkins`（审核） |
| 奖牌 | `CRUD /admin/v1/medals`、`POST /:id/grant`（手动补发） |
| 协议 | `POST /admin/v1/agreements`（发版） |
| 用户 | `GET /admin/v1/users`、`PUT /:id/status` |
| 数据 | `GET /admin/v1/stats/overview?range=` |

## 11. 契约约定

1. 时间一律 ISO8601 带时区；前端格式化交给 `utils/date.ts`。
2. 列表统一 `{list, nextCursor, hasMore}`，空列表 `nextCursor=null`。
3. 写接口支持 `Idempotency-Key`（报名/打卡/发消息必须传）。
4. 所有枚举在 DTO 层做白名单校验，未知值返回 `1001`。
5. Swagger 路径 `/docs`（仅 dev/test 开放）。
6. 变更管理：新增字段必须向后兼容；删除字段先标记 `@deprecated` 保留两个版本。
