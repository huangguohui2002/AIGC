# AIGC 生图网站 详细设计文档

**文档版本**: 1.0  
**创建日期**: 2026-03-13  
**项目名称**: AIGC 在线生图平台  
**技术栈**: Vue3 + Tailwind CSS + Node.js + Express + MySQL

---

## 1. 项目概述

### 1.1 项目背景
本项目旨在开发一个基于 nanobanana API 的 AIGC 在线生图平台，为用户提供便捷的 AI 图片和视频生成服务。系统采用积分制计费模式，支持充值、消费、邀请返利等完整的商业闭环。

### 1.2 核心目标
- **快速上线 MVP**：采用单体应用架构，同步生成模式，优先保证功能完整性
- **用户体验**：简洁直观的界面，流畅的生成流程
- **商业闭环**：完整的充值、消费、邀请返利体系
- **可扩展性**：预留后期升级为异步队列架构的空间

### 1.3 用户角色
- **普通用户**：注册、充值、生图、查看记录、邀请返利
- **管理员**：用户管理、订单管理、公告管理、系统配置

### 1.4 技术选型
- **前端**: Vue 3.4+ + Vue Router 4 + Pinia 2 + Tailwind CSS 3 + Axios
- **后端**: Node.js 18+ + Express 4 + MySQL2 + JWT + bcrypt
- **数据库**: MySQL 8.0+
- **文件存储**: 本地文件系统（可扩展至 OSS）
- **第三方服务**: nanobanana API、短信服务、易支付

---

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户端 (Vue3)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 生图页面 │  │ 积分管理 │  │ 邀请返利 │  │ 个人中心│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST API (JWT)
┌────────────────────────▼────────────────────────────────┐
│                  后端服务 (Express)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │            认证中间件 (JWT Verify)               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │                   路由层                         │   │
│  │  /api/auth  /api/points  /api/generate          │   │
│  │  /api/pay   /api/invite  /api/admin             │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              业务逻辑层 (Services)               │   │
│  │  AuthService  PointsService  GenerateService    │   │
│  │  PayService   InviteService  AdminService       │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │            数据访问层 (Models/DAO)               │   │
│  └─────────────────────────────────────────────────┘   │
└────────────┬──────────────┬──────────────┬─────────────┘
             │              │              │
      ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────────┐
      │   MySQL     │ │ 文件存储  │ │  第三方服务    │
      │   数据库    │ │(uploads/) │ │ - nanobanana  │
      └─────────────┘ └──────────┘ │ - 短信服务     │
                                    │ - 易支付       │
                                    └────────────────┘
```

### 2.2 技术架构分层

**表现层 (Presentation Layer)**
- Vue 3 组件化开发
- Tailwind CSS 原子化样式
- Pinia 状态管理
- Vue Router 路由管理

**应用层 (Application Layer)**
- Express 路由控制
- JWT 认证中间件
- 请求参数验证
- 错误处理中间件

**业务逻辑层 (Business Logic Layer)**
- 用户认证与授权
- 积分计算与扣费
- 生成任务处理
- 支付回调处理
- 邀请奖励发放

**数据访问层 (Data Access Layer)**
- MySQL 数据库操作
- 事务管理
- 数据模型定义

**基础设施层 (Infrastructure Layer)**
- 文件存储服务
- 第三方 API 调用
- 日志记录
- 定时任务

---

## 3. 数据库设计

### 3.1 数据库 ER 图概述

```
users (用户) ──┬── 1:N ── orders (订单)
               ├── 1:N ── transactions (流水)
               ├── 1:N ── generations (生成记录)
               ├── 1:N ── invites (邀请关系-邀请人)
               └── 1:1 ── invites (邀请关系-被邀请人)

points_packages (套餐) ── 1:N ── orders (订单)
```

### 3.2 数据表详细设计

#### 3.2.1 users（用户表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | PK, AUTO_INCREMENT | 用户ID |
| phone | VARCHAR | 11 | UNIQUE, NOT NULL | 手机号 |
| password_hash | VARCHAR | 255 | NOT NULL | 密码哈希 |
| nickname | VARCHAR | 50 | NULL | 昵称 |
| avatar | VARCHAR | 255 | NULL | 头像URL |
| points | INT | - | DEFAULT 0 | 当前积分余额 |
| total_recharged | INT | - | DEFAULT 0 | 累计充值积分 |
| total_consumed | INT | - | DEFAULT 0 | 累计消费积分 |
| invite_code | VARCHAR | 20 | UNIQUE, NOT NULL | 邀请码 |
| inviter_id | BIGINT | - | NULL, FK | 邀请人ID |
| status | ENUM | - | DEFAULT 'normal' | 状态: normal/banned |
| role | ENUM | - | DEFAULT 'user' | 角色: user/admin |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (phone)
- UNIQUE KEY (invite_code)
- INDEX (inviter_id)
- INDEX (status)

#### 3.2.2 sms_codes（短信验证码表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | PK, AUTO_INCREMENT | 主键 |
| phone | VARCHAR | 11 | NOT NULL | 手机号 |
| code | VARCHAR | 6 | NOT NULL | 验证码 |
| type | ENUM | - | NOT NULL | 类型: register/reset_password |
| used | TINYINT | - | DEFAULT 0 | 是否已使用: 0/1 |
| expires_at | DATETIME | - | NOT NULL | 过期时间 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (phone, type, used, expires_at)

#### 3.2.3 points_packages（积分套餐表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | INT | - | PK, AUTO_INCREMENT | 套餐ID |
| name | VARCHAR | 50 | NOT NULL | 套餐名称 |
| points | INT | - | NOT NULL | 基础积分 |
| bonus_points | INT | - | DEFAULT 0 | 赠送积分 |
| price | DECIMAL | 10,2 | NOT NULL | 价格（元）|
| bonus_rate | INT | - | DEFAULT 0 | 赠送比例（%）|
| sort_order | INT | - | DEFAULT 0 | 排序 |
| is_active | TINYINT | - | DEFAULT 1 | 是否启用 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
**索引**:
- PRIMARY KEY (id)
- INDEX (is_active, sort_order)

#### 3.2.4 orders（充值订单表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | PK, AUTO_INCREMENT | 订单ID |
| order_no | VARCHAR | 32 | UNIQUE, NOT NULL | 订单号 |
| user_id | BIGINT | - | NOT NULL, FK | 用户ID |
| package_id | INT | - | NOT NULL, FK | 套餐ID |
| amount | DECIMAL | 10,2 | NOT NULL | 支付金额 |
| points | INT | - | NOT NULL | 获得积分（基础+赠送）|
| provider | VARCHAR | 20 | NOT NULL | 支付渠道: alipay |
| provider_order_id | VARCHAR | 64 | NULL | 第三方订单号 |
| status | ENUM | - | DEFAULT 'pending' | 状态: pending/paid/cancelled/expired |
| paid_at | DATETIME | - | NULL | 支付时间 |
| expired_at | DATETIME | - | NOT NULL | 过期时间 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (order_no)
- INDEX (user_id, status)
- INDEX (provider_order_id)
- INDEX (status, expired_at)

#### 3.2.5 transactions（积分流水表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | PK, AUTO_INCREMENT | 流水ID |
| user_id | BIGINT | - | NOT NULL, FK | 用户ID |
| type | ENUM | - | NOT NULL | 类型: recharge/consume/invite_reward/refund/admin_adjust |
| amount | INT | - | NOT NULL | 变动积分（正负）|
| balance_after | INT | - | NOT NULL | 变动后余额 |
| related_id | BIGINT | - | NULL | 关联ID |
| related_type | VARCHAR | 20 | NULL | 关联类型: order/generation/invite |
| description | VARCHAR | 255 | NOT NULL | 描述 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id, created_at)
- INDEX (type)
- INDEX (related_type, related_id)

#### 3.2.6 generations（生成记录表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | PK, AUTO_INCREMENT | 记录ID |
| user_id | BIGINT | - | NOT NULL, FK | 用户ID |
| type | ENUM | - | NOT NULL | 类型: image/video |
| model | VARCHAR | 50 | NOT NULL | 模型名称 |
| prompt | TEXT | - | NOT NULL | 提示词 |
| reference_image | VARCHAR | 255 | NULL | 参考图URL |
| params | JSON | - | NULL | 生成参数 |
| status | ENUM | - | DEFAULT 'pending' | 状态: pending/success/failed |
| result_url | VARCHAR | 255 | NULL | 结果URL |
| cost_points | INT | - | NOT NULL | 消耗积分 |
| error_message | TEXT | - | NULL | 错误信息 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (user_id, created_at)
- INDEX (type, status)

#### 3.2.7 invites（邀请关系表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | PK, AUTO_INCREMENT | 主键 |
| inviter_id | BIGINT | - | NOT NULL, FK | 邀请人ID |
| invitee_id | BIGINT | - | NOT NULL, FK | 被邀请人ID |
| reward_points | INT | - | NOT NULL | 奖励积分 |
| status | ENUM | - | DEFAULT 'pending' | 状态: pending/completed |
| completed_at | DATETIME | - | NULL | 完成时间 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (invitee_id)
- INDEX (inviter_id, status)

#### 3.2.8 announcements（公告表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | INT | - | PK, AUTO_INCREMENT | 公告ID |
| title | VARCHAR | 100 | NOT NULL | 标题 |
| content | TEXT | - | NOT NULL | 内容 |
| level | ENUM | - | DEFAULT 'normal' | 级别: normal/important |
| status | ENUM | - | DEFAULT 'draft' | 状态: draft/published/archived |
| published_at | DATETIME | - | NULL | 发布时间 |
| created_at | DATETIME | - | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX (status, published_at)

#### 3.2.9 configs（系统配置表）

| 字段名 | 类型 | 长度 | 约束 | 说明 |
|--------|------|------|------|------|
| id | INT | - | PK, AUTO_INCREMENT | 配置ID |
| key | VARCHAR | 50 | UNIQUE, NOT NULL | 配置键 |
| value | JSON | - | NOT NULL | 配置值 |
| description | VARCHAR | 255 | NULL | 描述 |
| updated_at | DATETIME | - | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (key)

**预置配置项**:
```json
{
  "generation.image.cost": 100,
  "generation.video.cost": 500,
  "invite.reward_points": 1000,
  "order.expire_minutes": 30,
  "sms.send_interval_seconds": 60,
  "sms.code_expire_minutes": 10
}
```

---

## 4. API 接口设计

### 4.1 接口规范

**基础URL**: `http://api.example.com`

**通用响应格式**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

**错误响应格式**:
```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE"
}
```

**认证方式**: JWT Bearer Token
```
Authorization: Bearer <token>
```

### 4.2 用户认证模块

#### 4.2.1 发送短信验证码

**接口**: `POST /api/auth/send-sms`

**请求参数**:
```json
{
  "phone": "13800138000",
  "type": "register"  // register | reset_password
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码已发送"
}
```

**业务逻辑**:
1. 验证手机号格式
2. 检查发送频率限制（60秒）
3. 生成6位随机验证码
4. 调用短信服务发送
5. 保存验证码记录（10分钟有效期）

**错误码**:
- `INVALID_PHONE`: 手机号格式错误
- `SMS_SEND_TOO_FREQUENT`: 发送过于频繁
- `SMS_SEND_FAILED`: 短信发送失败

#### 4.2.2 用户注册

**接口**: `POST /api/auth/register`

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "123456",
  "password": "password123",
  "invite_code": "ABC123"  // 可选
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "points": 0,
      "invite_code": "XYZ789"
    }
  }
}
```

**业务逻辑**:
1. 验证验证码有效性
2. 检查手机号是否已注册
3. 密码加密（bcrypt）
4. 生成唯一邀请码
5. 创建用户记录
6. 处理邀请关系（如有邀请码）
7. 发放邀请奖励积分
8. 生成 JWT 令牌

**错误码**:
- `INVALID_CODE`: 验证码错误或已过期
- `PHONE_EXISTS`: 手机号已注册
- `INVALID_INVITE_CODE`: 邀请码无效

#### 4.2.3 用户登录

**接口**: `POST /api/auth/login`

**请求参数**:
```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatar": "https://...",
      "points": 10000,
      "role": "user"
    }
  }
}
```

**业务逻辑**:
1. 验证手机号是否存在
2. 验证密码是否正确
3. 检查用户状态（是否被封禁）
4. 生成 JWT 令牌（有效期7天）

**错误码**:
- `USER_NOT_FOUND`: 用户不存在
- `INVALID_PASSWORD`: 密码错误
- `USER_BANNED`: 用户已被封禁

#### 4.2.4 重置密码

**接口**: `POST /api/auth/reset-password`

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "123456",
  "new_password": "newpassword123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

#### 4.2.5 修改密码

**接口**: `POST /api/auth/change-password`

**认证**: 需要 JWT

**请求参数**:
```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 4.3 积分管理模块

#### 4.3.1 查询积分余额

**接口**: `GET /api/points/balance`

**认证**: 需要 JWT

**响应**:
```json
{
  "success": true,
  "data": {
    "points": 10000,
    "total_recharged": 50000,
    "total_consumed": 40000,
    "transaction_count": 125
  }
}
```

#### 4.3.2 获取积分套餐列表

**接口**: `GET /api/points/packages`

**响应**:
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": 1,
        "name": "无赠送",
        "points": 100000,
        "bonus_points": 0,
        "price": 10.00,
        "bonus_rate": 0
      }
    ]
  }
}
```

### 4.4 支付模块

#### 4.4.1 创建充值订单

**接口**: `POST /api/pay/create-order`

**认证**: 需要 JWT

**请求参数**:
```json
{
  "package_id": 1
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "order_no": "ORDER20260313123456789",
    "pay_url": "https://pay.example.com/...",
    "amount": 10.00,
    "expired_at": "2026-03-13 13:24:56"
  }
}
```

#### 4.4.2 易支付回调

**接口**: `POST /api/pay/callback`

**请求参数**: 易支付回调参数（包含签名）

**响应**: `success`

**业务逻辑**: 验签 → 幂等性检查 → 更新订单 → 发放积分 → 记录流水

#### 4.4.3 查询充值订单

**接口**: `GET /api/pay/orders`

**认证**: 需要 JWT

**请求参数**: `?page=1&limit=20&status=paid`

**响应**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "ORDER20260313123456789",
        "amount": 10.00,
        "points": 100000,
        "status": "paid",
        "paid_at": "2026-03-13 12:55:00",
        "created_at": "2026-03-13 12:54:00"
      }
    ],
    "total": 10
  }
}
```

### 4.5 生成模块

#### 4.5.1 生成图片

**接口**: `POST /api/generate/image`

**认证**: 需要 JWT

**请求参数**:
```json
{
  "prompt": "a beautiful sunset over the ocean",
  "model": "Veo 3.1 Fast",
  "orientation": "landscape",
  "count": 1,
  "reference_image": "https://..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "generation_id": 123,
    "result_url": "https://cdn.example.com/result.jpg",
    "cost_points": 100
  }
}
```

**业务逻辑**: 检查余额 → 预扣积分 → 调用API → 保存结果 → 确认扣费

**错误码**: `INSUFFICIENT_POINTS`, `GENERATION_TIMEOUT`, `GENERATION_FAILED`

#### 4.5.2 生成视频

**接口**: `POST /api/generate/video`

**认证**: 需要 JWT

**请求参数**:
```json
{
  "prompt": "a cat playing with a ball",
  "reference_image": "https://..."
}
```

**响应**: 同图片生成

#### 4.5.3 查询生成记录

**接口**: `GET /api/generate/records`

**认证**: 需要 JWT

**请求参数**: `?page=1&limit=20`

**响应**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 123,
        "type": "image",
        "model": "Veo 3.1 Fast",
        "prompt": "a beautiful sunset...",
        "status": "success",
        "result_url": "https://...",
        "cost_points": 100,
        "created_at": "2026-03-13 12:50:00"
      }
    ],
    "total": 50
  }
}
```

### 4.6 邀请模块

#### 4.6.1 获取邀请信息

**接口**: `GET /api/invite/info`

**认证**: 需要 JWT

**响应**:
```json
{
  "success": true,
  "data": {
    "invite_code": "ABC123",
    "invite_url": "https://example.com/register?code=ABC123",
    "invite_count": 10,
    "completed_count": 8,
    "total_reward": 8000
  }
}
```

#### 4.6.2 查询邀请记录

**接口**: `GET /api/invite/records`

**认证**: 需要 JWT

**请求参数**: `?page=1&limit=20`

**响应**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "invitee_phone": "138****8000",
        "reward_points": 1000,
        "status": "completed",
        "created_at": "2026-03-13 10:00:00"
      }
    ],
    "total": 10
  }
}
```

### 4.7 公告模块

#### 4.7.1 获取公告列表

**接口**: `GET /api/announcements`

**请求参数**: `?page=1&limit=20`

**响应**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "veo修复，成功率大大提高",
        "content": "...",
        "level": "important",
        "published_at": "2026-03-08 21:44:00"
      }
    ],
    "total": 6
  }
}
```

### 4.8 用户信息模块

#### 4.8.1 获取用户信息

**接口**: `GET /api/user/profile`

**认证**: 需要 JWT

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "138****8000",
    "nickname": "用户昵称",
    "avatar": "https://...",
    "points": 10000,
    "status": "normal"
  }
}
```

### 4.9 管理员模块

#### 4.9.1 管理员登录

**接口**: `POST /api/admin/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

#### 4.9.2 用户列表

**接口**: `GET /api/admin/users`

**认证**: 需要管理员 JWT

**请求参数**: `?page=1&limit=20&phone=&status=`

**响应**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "phone": "13800138000",
        "points": 10000,
        "total_recharged": 50000,
        "total_consumed": 40000,
        "status": "normal",
        "created_at": "2026-03-01 10:00:00"
      }
    ],
    "total": 100
  }
}
```

#### 4.9.3 调整用户积分

**接口**: `PUT /api/admin/users/:id/points`

**认证**: 需要管理员 JWT

**请求参数**:
```json
{
  "amount": 1000,
  "description": "管理员调整"
}
```

**响应**:
```json
{
  "success": true,
  "message": "积分调整成功"
}
```

#### 4.9.4 封禁/解禁用户

**接口**: `PUT /api/admin/users/:id/status`

**认证**: 需要管理员 JWT

**请求参数**:
```json
{
  "status": "banned"
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户状态更新成功"
}
```

#### 4.9.5 订单管理

**接口**: `GET /api/admin/orders`

**认证**: 需要管理员 JWT

**请求参数**: `?page=1&limit=20&status=&user_id=`

**响应**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "ORDER20260313123456789",
        "user_id": 1,
        "user_phone": "13800138000",
        "amount": 10.00,
        "points": 100000,
        "status": "paid",
        "created_at": "2026-03-13 12:54:00"
      }
    ],
    "total": 500
  }
}
```

#### 4.9.6 公告管理 - 列表

**接口**: `GET /api/admin/announcements`

**认证**: 需要管理员 JWT

**请求参数**: `?page=1&limit=20&status=`

**响应**: 同用户端公告列表，但包含草稿状态

#### 4.9.7 公告管理 - 创建

**接口**: `POST /api/admin/announcements`

**认证**: 需要管理员 JWT

**请求参数**:
```json
{
  "title": "系统维护通知",
  "content": "系统将于...",
  "level": "important"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

#### 4.9.8 公告管理 - 更新

**接口**: `PUT /api/admin/announcements/:id`

**认证**: 需要管理员 JWT

**请求参数**:
```json
{
  "title": "系统维护通知",
  "content": "系统将于...",
  "level": "important",
  "status": "published"
}
```

**响应**:
```json
{
  "success": true,
  "message": "公告更新成功"
}
```

#### 4.9.9 公告管理 - 删除

**接口**: `DELETE /api/admin/announcements/:id`

**认证**: 需要管理员 JWT

**响应**:
```json
{
  "success": true,
  "message": "公告删除成功"
}
```

#### 4.9.10 系统配置 - 获取

**接口**: `GET /api/admin/configs`

**认证**: 需要管理员 JWT

**响应**:
```json
{
  "success": true,
  "data": {
    "configs": {
      "generation.image.cost": 100,
      "generation.video.cost": 500,
      "invite.reward_points": 1000,
      "order.expire_minutes": 30
    }
  }
}
```

#### 4.9.11 系统配置 - 更新

**接口**: `PUT /api/admin/configs`

**认证**: 需要管理员 JWT

**请求参数**:
```json
{
  "configs": {
    "generation.image.cost": 80,
    "generation.video.cost": 400
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "配置更新成功"
}
```

---

## 5. 前端设计

### 5.1 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **路由**: Vue Router 4
- **状态管理**: Pinia 2
- **样式**: Tailwind CSS 3
- **HTTP**: Axios
- **UI组件**: shadcn/ui（用于表格、通用表单控件、分页与数据展示） + 自定义组件（用于特色页面与交互）

#### 5.1.1 组件库选择（实现策略）

- 使用 `shadcn/ui` 的场景：
  - 列表/表格类页面（用户列表、订单列表、生成记录、公告列表、充值订单等），优先使用 shadcn/ui 的表格、分页、筛选、表单控件和通用布局组件以保证一致性与开发效率。
  - 公共表单控件（输入框、选择器、日期选择、开关）、通用 Modal、Tooltip、Toast、Pagination、Avatar、Icon 等通用 UI 原子组件可直接采用 shadcn/ui 的实现或基于其样式做小幅定制。

- 自定义组件的场景：
  - 生成页（图片/视频生图）、GenerationForm、ResultCard、RecordCard 等核心交互组件需要自定义设计以满足业务流程和视觉风格要求，可复用 shadcn/ui 提供的低阶原子（如按钮、输入框、模态框）但样式与布局按产品设计改造。
  - 首页、营销页、以及需要特殊动画/布局的页面应优先采用自研组件保证差异化体验。

- 设计原则：
  - 优先复用 shadcn/ui 的可访问、成熟的组件以减少重复造轮子；当业务需高度定制时，基于 shadcn/ui 的 primitives 做包裹（封装）以保持一致 API。 
  - 表格与列表的交互（排序、筛选、列配置、导出）在可能情况下使用 shadcn/ui 的基础实现并在业务层追加功能。
  - 保持样式变量与 Tailwind 结合，避免直接修改 shadcn/ui 源代码，使用封装组件以便后续替换与维护。
### 5.2 页面结构

#### 5.2.1 用户端页面

**认证页面**
- `/login` - 登录页面
- `/register` - 注册页面
- `/reset-password` - 找回密码

**主功能页面**
- `/` - 首页/生图页面（图片生成、视频生成）
- `/records` - 生成记录
- `/points` - 积分明细
- `/invite` - 邀请返利
- `/profile` - 个人中心

**管理后台页面**
- `/admin/login` - 管理员登录
- `/admin/users` - 用户管理
- `/admin/orders` - 订单管理
- `/admin/announcements` - 公告管理
- `/admin/configs` - 系统配置

### 5.3 核心组件设计

**Layout 组件**
- 侧边栏导航（图片生成、视频生成、邀请返利、积分明细、积分说明、联系我们、API文档）
- 顶部栏（用户信息、积分余额、通知图标、购买积分按钮）

**PointsPackageModal 组件**
- 展示积分套餐列表
- 显示赠送比例标签
- 选择支付方式
- 跳转支付

**AnnouncementModal 组件**
- 公告列表展示
- 分级显示（一般/重要）
- 已读标记

**GenerationForm 组件**
- 提示词输入
- 参考图上传
- 模型选择
- 方向选择
- 生成数量设置
- 提交生成

**RecordCard 组件**
- 生成结果展示
- 状态显示
- 下载按钮
- 重新生成

**组件实现策略（哪些使用 shadcn/ui，哪些自定义）**

- 推荐直接使用 shadcn/ui 的组件：
  - 表格 / 列表（用户管理、订单管理、生成记录、公告列表、充值订单）
  - 通用表单控件（Input、Select、Checkbox、Radio、Switch、DatePicker）
  - Modal、Dialog、Tooltip、Toast、Pagination、Avatar、Badge、Icon 等通用原子组件
  - 数据展示相关的通用小组件（Skeleton、Empty、Loader）

- 推荐封装并定制的场景：
  - PointsPackageModal：可复用 shadcn/ui 的 Modal、Button、List 等原子组件，但套餐卡片样式与交互按产品设计定制。
  - AnnouncementModal：使用 shadcn/ui 的列表/分页与 Modal，但内容样式按设计调整。

- 必须自定义实现的场景：
  - GenerationForm（生图表单）与生图流程交互（预览流程、进度、错误处理、重试等）需自研以匹配业务逻辑与视觉要求。
  - RecordCard（结果卡片）、首页展示、营销页与复杂的画布/编辑交互等需独立实现并只能复用原子控件。

- 兼容与扩展：
  - 为避免未来替换成本，所有直接使用 shadcn/ui 的地方应提供一层本地封装（例如 `ui/Button`, `ui/Table`），业务代码通过本地封装调用，以便统一主题、增加埋点或切换实现。


### 5.4 状态管理（Pinia）

**userStore**
- 用户信息
- 积分余额
- 登录状态
- 登录/登出方法

**configStore**
- 系统配置
- 积分套餐
- 公告列表

**generationStore**
- 生成记录
- 当前生成任务

---

## 6. 关键业务流程

### 6.1 用户注册流程

```
1. 用户访问注册页面
2. 输入手机号 → 点击发送验证码
3. 后端检查频率限制 → 生成验证码 → 发送短信
4. 用户输入验证码、密码、邀请码（可选）
5. 提交注册 → 后端验证
6. 创建用户 → 生成邀请码
7. 处理邀请关系（如有）→ 发放奖励积分
8. 返回JWT → 前端存储token → 跳转首页
```

### 6.2 充值流程

```
1. 用户点击"购买积分"按钮
2. 弹出积分套餐选择弹窗
3. 选择套餐 → 点击"立即购买"
4. 弹出支付方式选择（支付宝）
5. 后端创建订单 → 调用易支付API
6. 返回支付链接 → 前端跳转支付页面
7. 用户完成支付
8. 易支付异步回调 → 后端验签
9. 更新订单状态 → 发放积分 → 记录流水
10. 前端轮询订单状态或用户手动刷新查看积分
```

### 6.3 生图流程（同步）

```
1. 用户填写提示词、选择模型、上传参考图
2. 点击"生成"按钮
3. 前端显示加载状态
4. 后端检查积分余额
5. 开启数据库事务：
   - 预扣积分
   - 创建生成记录（pending）
6. 同步调用nanobanana API（60-90s超时）
7. 成功：
   - 保存结果文件到本地/OSS
   - 更新记录状态为success
   - 记录积分流水
   - 提交事务
   - 返回结果URL
8. 失败：
   - 回滚积分
   - 更新记录状态为failed
   - 记录错误信息
   - 返回错误提示
9. 前端展示生成结果或错误信息
```

### 6.4 邀请奖励流程

```
1. 用户A查看邀请页面 → 获取邀请码和邀请链接
2. 分享邀请链接给用户B
3. 用户B通过链接访问注册页面（邀请码自动填充）
4. 用户B完成注册
5. 后端验证邀请码 → 创建邀请关系（pending）
6. 注册成功后触发邀请奖励：
   - 查询配置的奖励积分
   - 发放积分给用户A
   - 更新邀请关系为completed
   - 记录积分流水
7. 用户A可在邀请页面查看奖励记录
```

### 6.5 订单超时处理流程

```
1. 定时任务每5分钟执行一次
2. 查询pending状态且创建时间超过30分钟的订单
3. 批量更新订单状态为expired
4. 记录日志
```

---

## 7. 安全设计

### 7.1 认证与授权

**JWT 认证**
- 令牌有效期：7天
- 存储位置：localStorage
- 请求头：`Authorization: Bearer <token>`
- 令牌内容：`{ userId, role, exp }`

**密码安全**
- 加密算法：bcrypt
- Salt rounds：10
- 密码强度：最少6位

**角色权限**
- 普通用户：user
- 管理员：admin
- 中间件验证角色权限

### 7.2 接口防护

**短信验证码**
- 发送频率：60秒/次
- 有效期：10分钟
- 验证后标记为已使用

**接口限流**
- 用户级别：100次/分钟
- IP级别：200次/分钟
- 使用中间件实现

**支付回调安全**
- 签名验证（MD5/SHA256）
- 幂等性处理（订单号去重）
- IP白名单（可选）

### 7.3 数据安全

**SQL注入防护**
- 使用参数化查询
- ORM框架（如TypeORM）

**XSS防护**
- 前端输入过滤
- 后端输出转义

**CSRF防护**
- SameSite Cookie
- CSRF Token（如需要）

---

## 8. 性能优化

### 8.1 数据库优化

**索引设计**
- 主键索引
- 唯一索引：phone, order_no, invite_code
- 普通索引：user_id, status, created_at
- 复合索引：(user_id, created_at), (status, expired_at)

**连接池配置**
- 最小连接数：5
- 最大连接数：20
- 连接超时：10秒

**查询优化**
- 分页查询限制：最大100条/页
- 避免SELECT *
- 使用LIMIT限制结果集

### 8.2 文件存储

**本地存储**
- 目录：`backend/uploads/`
- 文件命名：`{timestamp}_{random}.{ext}`
- 定期清理过期文件

**对象存储（生产环境）**
- 使用阿里云OSS/腾讯云COS
- CDN加速
- 图片压缩

### 8.3 缓存策略

**应用层缓存**
- 积分套餐列表：5分钟
- 系统配置：10分钟
- 使用内存缓存或Redis

**静态资源缓存**
- 前端资源：强缓存（1年）
- API响应：协商缓存

---

## 9. 部署方案

### 9.1 项目结构

```
aigc-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   ├── utils/           # 工具函数
│   │   └── app.js           # 入口文件
│   ├── uploads/             # 文件上传
│   ├── logs/                # 日志
│   ├── package.json
│   └── .env                 # 环境变量
├── frontend/
│   ├── src/
│   │   ├── views/           # 页面
│   │   ├── components/      # 组件
│   │   ├── stores/          # Pinia
│   │   ├── router/          # 路由
│   │   ├── api/             # API封装
│   │   ├── utils/           # 工具
│   │   ├── assets/          # 静态资源
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── docs/                    # 文档
└── sql/                     # 数据库脚本
```

### 9.2 环境配置

**后端环境变量（.env）**
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=aigc_platform
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
SMS_API_KEY=your-sms-api-key
EPAY_API_URL=https://pay.example.com
EPAY_MERCHANT_ID=your-merchant-id
NANOBANANA_API_URL=https://api.nanobanana.com
NANOBANANA_API_KEY=your-nanobanana-key
UPLOAD_DIR=./uploads
```

### 9.3 部署步骤

**1. 数据库初始化**
```bash
mysql -u root -p < sql/init.sql
```

**2. 后端部署**
```bash
cd backend
npm install
pm2 start src/app.js --name aigc-backend
```

**3. 前端部署**
```bash
cd frontend
npm install
npm run build
# 将dist目录部署到Nginx
```

**4. Nginx配置**
```nginx
server {
    listen 80;
    server_name example.com;
    location / {
        root /var/www/aigc-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

---

## 10. 测试与验收

### 10.1 单元测试
- 用户认证逻辑
- 积分计算逻辑
- 支付回调处理

### 10.2 集成测试
- 注册到登录完整流程
- 充值到积分到账流程
- 生图到结果展示流程

---

## 11. 运维监控

### 11.1 日志管理
- 访问日志：记录所有API请求
- 错误日志：记录异常和错误
- 业务日志：记录关键业务操作

### 11.2 定时任务
- 订单超时处理：每5分钟
- 文件清理：每天凌晨3点

---

## 12. 风险与应对

### 12.1 技术风险
- nanobanana API不稳定：设置超时、失败退款
- 数据库性能瓶颈：优化索引、读写分离

### 12.2 业务风险
- 恶意刷单：接口限流、异常检测
- 支付回调丢失：主动查询、手动补单

---

## 13. 附录

### 13.1 错误码表

| 错误码 | 说明 |
|--------|------|
| INVALID_PHONE | 手机号格式错误 |
| INVALID_CODE | 验证码错误或已过期 |
| PHONE_EXISTS | 手机号已注册 |
| USER_NOT_FOUND | 用户不存在 |
| INVALID_PASSWORD | 密码错误 |
| USER_BANNED | 用户已被封禁 |
| INSUFFICIENT_POINTS | 积分不足 |
| GENERATION_FAILED | 生成失败 |

### 13.2 文档变更记录

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| 1.0 | 2026-03-13 | AI | 初始版本，完成详细设计 |

---

**文档结束**

本文档详细描述了 AIGC 生图网站的完整设计方案，包括系统架构、数据库设计、API接口、前端设计、业务流程、安全性能、部署运维等各个方面。后续将基于此文档进行实现计划的制定和开发工作。

