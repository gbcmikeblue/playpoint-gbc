-- CreateTable
CREATE TABLE "user" (
    "id" VARCHAR(32) NOT NULL,
    "openid" VARCHAR(64) NOT NULL,
    "unionid" VARCHAR(64),
    "nickname" VARCHAR(32) NOT NULL DEFAULT '微信用户',
    "avatar_url" VARCHAR(512),
    "gender" SMALLINT NOT NULL DEFAULT 0,
    "birthday" DATE,
    "about" VARCHAR(200),
    "signature" VARCHAR(100),
    "mbti" CHAR(4),
    "mbti_seen" BOOLEAN NOT NULL DEFAULT false,
    "phone_enc" VARCHAR(128),
    "role" SMALLINT NOT NULL DEFAULT 0,
    "follow_count" INTEGER NOT NULL DEFAULT 0,
    "fans_count" INTEGER NOT NULL DEFAULT 0,
    "played_count" INTEGER NOT NULL DEFAULT 0,
    "together_count" INTEGER NOT NULL DEFAULT 0,
    "org_count" INTEGER NOT NULL DEFAULT 0,
    "privacy_agreed_at" TIMESTAMPTZ,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" VARCHAR(32) NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "province" VARCHAR(32),
    "initial" CHAR(1) NOT NULL,
    "is_hot" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(24) NOT NULL,
    "icon" VARCHAR(64),
    "emoji" VARCHAR(8),
    "is_hot" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity" (
    "id" VARCHAR(32) NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "cover_url" VARCHAR(512) NOT NULL,
    "city_id" VARCHAR(32) NOT NULL,
    "poi_name" VARCHAR(120),
    "address" VARCHAR(200),
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ,
    "sessions" JSONB NOT NULL DEFAULT '[]',
    "price_cent" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "joined_count" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "refund_policy" VARCHAR(200),
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "category_ids" JSONB NOT NULL DEFAULT '[]',
    "host_id" VARCHAR(32),
    "club_id" VARCHAR(32),
    "signup_schema" JSONB NOT NULL DEFAULT '{}',
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_signup" (
    "id" VARCHAR(32) NOT NULL,
    "activity_id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "session_at" TIMESTAMPTZ,
    "nickname" VARCHAR(32) NOT NULL,
    "gender" SMALLINT NOT NULL DEFAULT 0,
    "avatar_url" VARCHAR(512),
    "extra" JSONB NOT NULL DEFAULT '{}',
    "order_id" VARCHAR(32),
    "status" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_signup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_order" (
    "id" VARCHAR(32) NOT NULL,
    "order_no" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "biz_type" SMALLINT NOT NULL,
    "biz_id" VARCHAR(32) NOT NULL,
    "signup_id" VARCHAR(32),
    "title" VARCHAR(80) NOT NULL,
    "cover_url" VARCHAR(512),
    "amount_cent" INTEGER NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "pay_channel" VARCHAR(16) NOT NULL DEFAULT 'mock',
    "paid_at" TIMESTAMPTZ,
    "expire_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pay_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "type" SMALLINT NOT NULL,
    "ref_id" VARCHAR(32) NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "cover_url" VARCHAR(512),
    "session_at" TIMESTAMPTZ,
    "valid_from" TIMESTAMPTZ,
    "valid_to" TIMESTAMPTZ,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "qr_token" VARCHAR(64) NOT NULL,
    "seal_text" VARCHAR(16),
    "notice" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" VARCHAR(32) NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "subtitle" VARCHAR(120),
    "seal_url" VARCHAR(512),
    "banner_url" VARCHAR(512) NOT NULL,
    "region_name" VARCHAR(40),
    "city_id" VARCHAR(32),
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "price_cent" INTEGER NOT NULL DEFAULT 0,
    "joined_count" INTEGER NOT NULL DEFAULT 0,
    "medal_hint" VARCHAR(60),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_checkpoint" (
    "id" VARCHAR(32) NOT NULL,
    "campaign_id" VARCHAR(32) NOT NULL,
    "seq" INTEGER NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "poi_name" VARCHAR(120),
    "address" VARCHAR(200),
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "radius_m" INTEGER NOT NULL DEFAULT 300,
    "cover_url" VARCHAR(512),
    "intro" TEXT,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "campaign_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "key" VARCHAR(48) NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_openid_key" ON "user"("openid");

-- CreateIndex
CREATE INDEX "user_role_status_idx" ON "user"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "city_code_key" ON "city"("code");

-- CreateIndex
CREATE INDEX "city_is_hot_sort_idx" ON "city"("is_hot", "sort");

-- CreateIndex
CREATE INDEX "activity_city_id_status_start_at_idx" ON "activity"("city_id", "status", "start_at");

-- CreateIndex
CREATE INDEX "activity_signup_user_id_status_idx" ON "activity_signup"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pay_order_order_no_key" ON "pay_order"("order_no");

-- CreateIndex
CREATE INDEX "pay_order_user_id_status_created_at_idx" ON "pay_order"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pay_order_expire_at_idx" ON "pay_order"("expire_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_qr_token_key" ON "ticket"("qr_token");

-- CreateIndex
CREATE INDEX "ticket_user_id_type_status_idx" ON "ticket"("user_id", "type", "status");

-- CreateIndex
CREATE INDEX "campaign_city_id_status_start_at_idx" ON "campaign"("city_id", "status", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_checkpoint_campaign_id_seq_key" ON "campaign_checkpoint"("campaign_id", "seq");

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_signup" ADD CONSTRAINT "activity_signup_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_signup" ADD CONSTRAINT "activity_signup_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_checkpoint" ADD CONSTRAINT "campaign_checkpoint_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
