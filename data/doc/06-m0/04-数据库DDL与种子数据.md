# 数据库 DDL 与种子数据（M0）

> 目标：空库执行一次 `prisma migrate dev` 即得到可联调的 10 张表 + 种子数据。
> 完整表设计（26 张）见 [04-backend/02-数据模型设计.md](../04-backend/02-数据模型设计.md)，本文只落 M0 需要的子集，并给出**可直接执行的 SQL**。

## 1. 建库与环境

```powershell
# 用 Podman（本机无 Docker），镜像走 daocloud 源
podman machine start
podman run -d --name playpoint-pg --restart unless-stopped -p 5432:5432 `
  -e POSTGRES_USER=playpoint -e POSTGRES_PASSWORD=playpoint -e POSTGRES_DB=playpoint `
  docker.m.daocloud.io/library/postgres:15-alpine

# 等待 5s 初始化后装扩展
podman exec playpoint-pg psql -U playpoint -d playpoint -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

`.env`（backend）：

```
DATABASE_URL="postgresql://playpoint:playpoint@localhost:5432/playpoint?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-only-change-me"
WX_APPID="wx0000000000000000"
WX_SECRET="dev-secret"
```

## 2. 约定

- 主键统一 `varchar(32)`（雪花 ID，服务层生成，DB 不依赖序列）。
- 时间 `timestamptz`；金额 `int`（分）；布尔默认 `false`。
- 状态用 `smallint` + `CHECK` 约束（M0 不上 PG ENUM，避免迁移麻烦）。
- 软删统一 `deleted_at timestamptz NULL`，查询带 `deleted_at IS NULL`。
- 所有表加 `created_at timestamptz NOT NULL DEFAULT now()`、`updated_at`（Prisma 维护）。

## 3. 10 张表 DDL

```sql
-- 1. 用户
CREATE TABLE "user" (
  id              varchar(32) PRIMARY KEY,
  openid          varchar(64) NOT NULL UNIQUE,
  unionid         varchar(64),
  nickname        varchar(32) NOT NULL DEFAULT '微信用户',
  avatar_url      varchar(512),
  gender          smallint NOT NULL DEFAULT 0 CHECK (gender IN (0,1,2)),
  birthday        date,
  about           varchar(200),
  signature       varchar(100),
  mbti            char(4),
  mbti_seen       boolean NOT NULL DEFAULT false,
  phone_enc       varchar(128),
  role            smallint NOT NULL DEFAULT 0,
  follow_count    int NOT NULL DEFAULT 0,
  fans_count      int NOT NULL DEFAULT 0,
  played_count    int NOT NULL DEFAULT 0,
  together_count  int NOT NULL DEFAULT 0,
  org_count       int NOT NULL DEFAULT 0,
  privacy_agreed_at timestamptz,
  status          smallint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE INDEX idx_user_role_status ON "user"(role, status);

-- 2. 城市
CREATE TABLE city (
  id       varchar(32) PRIMARY KEY,
  code     varchar(16) NOT NULL UNIQUE,
  name     varchar(32) NOT NULL,
  province varchar(32),
  initial  char(1) NOT NULL,              -- 字母索引 A-Z
  is_hot   boolean NOT NULL DEFAULT false,
  sort     int NOT NULL DEFAULT 0,
  status   smallint NOT NULL DEFAULT 1
);
CREATE INDEX idx_city_hot ON city(is_hot, sort);

-- 3. 分类（首页胶囊）
CREATE TABLE category (
  id    varchar(32) PRIMARY KEY,
  name  varchar(24) NOT NULL,
  icon  varchar(64),
  emoji varchar(8),
  is_hot boolean NOT NULL DEFAULT false,
  sort  int NOT NULL DEFAULT 0,
  status smallint NOT NULL DEFAULT 1
);

-- 4. 活动
CREATE TABLE activity (
  id            varchar(32) PRIMARY KEY,
  title         varchar(80) NOT NULL,
  cover_url     varchar(512) NOT NULL,
  city_id       varchar(32) NOT NULL REFERENCES city(id),
  poi_name      varchar(120),
  address       varchar(200),
  lat           numeric(10,7),
  lng           numeric(10,7),
  start_at      timestamptz NOT NULL,
  end_at        timestamptz,
  sessions      jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_cent    int NOT NULL DEFAULT 0 CHECK (price_cent >= 0),
  capacity      int NOT NULL DEFAULT 0,
  joined_count  int NOT NULL DEFAULT 0,
  tags          jsonb NOT NULL DEFAULT '[]'::jsonb,
  refund_policy varchar(200),
  highlights    jsonb NOT NULL DEFAULT '[]'::jsonb,
  category_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
  host_id       varchar(32),
  club_id       varchar(32),
  signup_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        smallint NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX idx_activity_feed ON activity(city_id, status, start_at);
CREATE INDEX idx_activity_title_trgm ON activity USING gin (title gin_trgm_ops);

-- 5. 报名
CREATE TABLE activity_signup (
  id           varchar(32) PRIMARY KEY,
  activity_id  varchar(32) NOT NULL REFERENCES activity(id),
  user_id      varchar(32) NOT NULL REFERENCES "user"(id),
  session_at   timestamptz,
  nickname     varchar(32) NOT NULL,
  gender       smallint NOT NULL DEFAULT 0,
  avatar_url   varchar(512),
  extra        jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_id     varchar(32),
  status       smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3)),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_signup_active ON activity_signup(activity_id, user_id)
  WHERE status IN (0,1);

-- 6. 订单（模拟支付）
CREATE TABLE pay_order (
  id          varchar(32) PRIMARY KEY,
  order_no    varchar(32) NOT NULL UNIQUE,
  user_id     varchar(32) NOT NULL,
  biz_type    smallint NOT NULL CHECK (biz_type IN (1,2)),
  biz_id      varchar(32) NOT NULL,
  signup_id   varchar(32),
  title       varchar(80) NOT NULL,
  cover_url   varchar(512),
  amount_cent int NOT NULL CHECK (amount_cent > 0),
  status      smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3)),
  pay_channel varchar(16) NOT NULL DEFAULT 'mock',
  paid_at     timestamptz,
  expire_at   timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_user ON pay_order(user_id, status, created_at DESC);
CREATE INDEX idx_order_expire ON pay_order(expire_at) WHERE status = 0;

-- 7. 票
CREATE TABLE ticket (
  id         varchar(32) PRIMARY KEY,
  user_id    varchar(32) NOT NULL,
  type       smallint NOT NULL CHECK (type IN (1,2,3,4)),
  ref_id     varchar(32) NOT NULL,
  title      varchar(80) NOT NULL,
  cover_url  varchar(512),
  session_at timestamptz,
  valid_from timestamptz,
  valid_to   timestamptz,
  status     smallint NOT NULL DEFAULT 0 CHECK (status IN (0,1,2,3,4)),
  qr_token   varchar(64) NOT NULL UNIQUE,
  seal_text  varchar(16),
  notice     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_user ON ticket(user_id, type, status);

-- 8. 挑战赛
CREATE TABLE campaign (
  id           varchar(32) PRIMARY KEY,
  title        varchar(80) NOT NULL,
  subtitle     varchar(120),
  seal_url     varchar(512),
  banner_url   varchar(512) NOT NULL,
  region_name  varchar(40),
  city_id      varchar(32) REFERENCES city(id),
  description  text,
  images       jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_at     timestamptz NOT NULL,
  end_at       timestamptz NOT NULL,
  price_cent   int NOT NULL DEFAULT 0,
  joined_count int NOT NULL DEFAULT 0,
  medal_hint   varchar(60),
  status       smallint NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_feed ON campaign(city_id, status, start_at);

-- 9. 打卡点
CREATE TABLE campaign_checkpoint (
  id          varchar(32) PRIMARY KEY,
  campaign_id varchar(32) NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  seq         int NOT NULL,
  name        varchar(60) NOT NULL,
  poi_name    varchar(120),
  address     varchar(200),
  lat         numeric(10,7),
  lng         numeric(10,7),
  radius_m    int NOT NULL DEFAULT 300,
  cover_url   varchar(512),
  intro       text,
  status      smallint NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX uq_checkpoint_seq ON campaign_checkpoint(campaign_id, seq);

-- 10. 应用配置
CREATE TABLE app_config (
  key        varchar(48) PRIMARY KEY,
  value      jsonb NOT NULL,
  version    int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## 4. 种子数据

```sql
-- 城市
INSERT INTO city (id, code, name, province, initial, is_hot, sort) VALUES
 ('c_sz','shenzhen','深圳市','广东省','S',true,1),
 ('c_sh','shanghai','上海市','上海市','S',true,2);

-- 分类（首页胶囊）
INSERT INTO category (id, name, emoji, is_hot, sort) VALUES
 ('cat_hot','热门','🔥',true,1), ('cat_all','全部','',false,2),
 ('cat_run','跑步','🏃',false,3), ('cat_frisbee','飞盘','🥏',false,4),
 ('cat_hide','躲猫猫','🙈',false,5), ('cat_dance','舞蹈','💃',false,6),
 ('cat_tennis','网球','🎾',false,7), ('cat_self','自我探索','🧭',false,8),
 ('cat_chill','吃喝松弛','☕',false,9);

-- 用户（占位，真实登录时按 openid upsert）
INSERT INTO "user" (id, openid, nickname, avatar_url, gender, mbti, about)
VALUES ('u_demo','openid_demo','演示用户','https://cdn.example.com/a.png',1,'INTJ','喜欢徒步和桌游');

-- 活动 1：免费、有多场次
INSERT INTO activity (id,title,cover_url,city_id,poi_name,address,lat,lng,start_at,sessions,
  price_cent,capacity,joined_count,tags,refund_policy,highlights,status)
VALUES ('a_1001','10.18周日匹克球热身畅打4h｜全天',
 'https://cdn.example.com/cover1.jpg','c_sz','匹克球体育中心(匹克球)','浦东新区xx路1号',
 31.2304000,121.4737000,'2026-10-18 18:00+08',
 '[{"date":"2026-10-18","startAt":"2026-10-18T18:00:00+08:00","endAt":"2026-10-18T22:00:00+08:00","capacity":20,"joinedCount":12}]',
 0,20,12,'["匹克球"]','活动开始前可随时全额退款',
 '[{"icon":"🎲","title":"趣味热身","content":"四小时畅打，含基础教学"}]',1);

-- 活动 2：付费
INSERT INTO activity (id,title,cover_url,city_id,poi_name,address,lat,lng,start_at,
  price_cent,capacity,joined_count,tags,status)
VALUES ('a_1002','已有10人-疗愈游戏局：用游戏思维拥抱生活',
 'https://cdn.example.com/cover2.jpg','c_sz','深圳万象天地','南山区深南大道9668号',
 22.5400000,113.9500000,'2026-10-18 19:30+08',
 19900,20,10,'["沙龙","免费游戏疗愈"]',1);

-- 挑战赛 + 3 个打卡点
INSERT INTO campaign (id,title,subtitle,banner_url,region_name,city_id,description,
  images,start_at,end_at,price_cent,joined_count,medal_hint,status)
VALUES ('cp_1','「入戏长安」城市探索打卡挑战赛','入戏长安',
 'https://cdn.example.com/cp1.jpg','西安·新城区','c_sz',
 '从秦腔戏台到城墙烟火，串联五大核心点位。',
 '["https://cdn.example.com/c1.jpg","https://cdn.example.com/c2.jpg","https://cdn.example.com/c3.jpg"]',
 '2026-08-18 00:00+08','2026-12-31 23:59+08',0,714,'714人打卡得限定奖牌',1);

INSERT INTO campaign_checkpoint (id,campaign_id,seq,name,poi_name,lat,lng,radius_m,cover_url,intro)
VALUES
 ('ck_1','cp_1',1,'游客中心','游客中心售票处',34.2650000,108.9540000,300,
  'https://cdn.example.com/ck1.jpg','游客集合地点，由此可乘车前往景区。'),
 ('ck_2','cp_1',2,'永兴坊','永兴坊牌楼',34.2660000,108.9600000,300,
  'https://cdn.example.com/ck2.jpg','非遗美食街区，打卡点位在牌楼下方。'),
 ('ck_3','cp_1',3,'城墙南门','永宁门',34.2540000,108.9470000,500,
  'https://cdn.example.com/ck3.jpg','上城墙后向南 50 米，注意营业时间。');

-- 票（对应演示用户）
INSERT INTO ticket (id,user_id,type,ref_id,title,cover_url,session_at,status,qr_token,seal_text,notice)
VALUES ('t_1','u_demo',1,'a_1002','已有10人-疗愈游戏局：用游戏思维拥抱生活',
 'https://cdn.example.com/cover2.jpg','2026-10-18 19:30+08',1,'qr_demo_token_1','待验票',
 '["请提前到达现场，找到工作人员","出示此二维码，工作人员扫码完成验票"]');

-- 应用配置
INSERT INTO app_config (key,value) VALUES
 ('version','"v1.0.0"'),
 ('agreementVersion','"1"'),
 ('signupSchema','{"fields":["avatar","nickname","gender"]}');
```

## 5. 校验 SQL

```sql
-- 首页 feed 用的查询：某城已发布活动按开始时间
SELECT id,title,cover_url,start_at,poi_name,price_cent,joined_count,capacity,tags
FROM activity
WHERE city_id='c_sz' AND status=1 AND deleted_at IS NULL
ORDER BY start_at ASC LIMIT 20;

-- 挑战赛卡片（含三图与人数）
SELECT id,title,subtitle,seal_url,start_at,end_at,joined_count,medal_hint FROM campaign WHERE status=1;

-- 打卡点
SELECT seq,name,poi_name,radius_m,cover_url,intro FROM campaign_checkpoint
WHERE campaign_id='cp_1' ORDER BY seq;

-- 票夹有票
SELECT t.id,t.title,t.session_at,t.status,t.seal_text FROM ticket t
WHERE t.user_id='u_demo' AND t.type=1;
```

## 6. 迁移与回滚

| 操作 | 命令 |
| --- | --- |
| 首次迁移 | `npx prisma migrate dev --name init_m0` |
| 应用迁移（测试/生产） | `npx prisma migrate deploy` |
| 重置（仅本地） | `npx prisma migrate reset` |
| 灌种子 | `npm run db:seed`（内部 `tsx prisma/seed.ts`，seed 不含装饰器可用 tsx） |
| 回滚 | Prisma 不生成 down 脚本；本地 `reset`，生产用「前向修复迁移」，禁止手工改表 |

- `seed.ts` 用 `upsert` 而非 `insert`，保证可重复执行。
- 生产种子只灌 `city` / `category` / `app_config`，不灌活动与用户。

## 7. M0 之后新增的表（M1-M3 按需）

`campaign_signup`、`checkin`、`medal`、`user_medal`、`notice`、`conversation`、`message`、`user_sport_ladder`、`privacy_consent`、`banner`。
建表顺序与依赖见 `04-backend/02-数据模型设计.md` 第 4-6 节。
