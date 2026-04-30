# 后端接口汇总

本文档按权限分组列出项目中所有后端接口（包含 app/controllers 中实现的方法）。说明包括：路径、HTTP 方法、是否需要鉴权、请求字段、简要说明与调用示例。

---

## 说明
- 基础路径：服务以 `/` 启动，API 路径以 `/api` 前缀挂载（见路由初始化）。
- 公共路由：无需 JWT；私有路由：需要 JWT 鉴权；管理员路由：需要 JWT 且具有 admin 角色。

---

## 公共接口（/api）

- GET /api/status
  - 描述：系统健康检查
  - 鉴权：否
  - 请求参数：无
  - 返回示例：{ operational: true, message: 'API is fully functional!' }

- POST /api/auth/send-sms
  - 描述：发送短信验证码
  - 鉴权：否
  - Body: { phone: string, type: 'register'|'reset_password' }

- POST /api/auth/register
  - 描述：用户注册
  - 鉴权：否
  - Body: { phone, code, password, invite_code? }

- POST /api/auth/login
  - 描述：用户登录，返回 token
  - 鉴权：否
  - Body: { phone, password }

- POST /api/auth/reset-password
  - 描述：重置密码
  - 鉴权：否
  - Body: { phone, code, new_password }

- POST /api/pay/callback
  - 描述：支付回调（第三方调用），接口内部验签
  - 鉴权：否
  - 参数：第三方支付回调参数（例如 out_trade_no, trade_no, trade_status）

- GET /api/announcements
  - 描述：获取已发布公告列表
  - 鉴权：否
  - Query: page?, limit?

- GET /api/points/packages
  - 描述：获取上架的积分套餐列表
  - 鉴权：否

- GET /api/configs
  - 描述：获取系统配置键值（前台多用，无需登录）
  - 鉴权：否
  - 说明：返回所有配置键值对对象；更新配置仍需管理员权限（见 PUT /api/admin/configs）

- GET /api/ai-models
  - 描述：获取前台可用的 AI 大模型列表（仅展示字段，不含敏感信息）
  - 鉴权：否
  - Query: type? （可选，`image` 或 `video`，不传则返回全部）
  - 返回字段：`id`, `name`, `subtitle`, `type`, `model_name`, `sort_order`

- POST /api/admin/login
  - 描述：管理员登录（注意该路由挂载在 /api 来避免被 /api/admin 中间件拦截）
  - 鉴权：否
  - Body: { username, password }

示例（登录获得 token）：
```
curl -X POST https://HOST/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000","password":"secret"}'
```

---

## 私有接口（需 JWT，挂载于 /api）

- GET /api/user/profile
  - 描述：获取当前用户信息
  - 鉴权：是（Header: Authorization: Bearer <token>）

- PUT /api/user/profile
  - 描述：更新个人资料
  - 鉴权：是
  - Body: { nickname? }

- POST /api/auth/change-password
  - 描述：修改密码
  - 鉴权：是
  - Body: { old_password, new_password }

- GET /api/points/balance
  - 描述：查询积分余额和统计
  - 鉴权：是

- GET /api/points/transactions
  - 描述：积分流水列表
  - 鉴权：是
  - Query: page?, limit?

- POST /api/pay/create-order
  - 描述：创建充值订单
  - 鉴权：是
  - Body: { package_id }

- GET /api/pay/orders
  - 描述：查询用户充值订单
  - 鉴权：是
  - Query: page?, limit?, status?

- POST /api/generate/image
  - 描述：生成图片（消费积分）
  - 鉴权：是
  - Body: { prompt, model?, orientation?, count?, reference_image? }

- POST /api/generate/video
  - 描述：生成视频（消费积分）
  - 鉴权：是
  - Body: { prompt, reference_image? }

- GET /api/generate/records
  - 描述：查询当前用户的生成记录
  - 鉴权：是
  - Query: page?, limit?

- GET /api/invite/info
  - 描述：获取邀请信息（邀请码、邀请链接、统计）
  - 鉴权：是

- GET /api/invite/records
  - 描述：邀请记录列表
  - 鉴权：是
  - Query: page?, limit?

示例（私有接口调用）：
```
curl -X GET https://HOST/api/user/profile \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## 管理员接口（需 admin 权限，挂载于 /api/admin）

- GET /api/admin/stats
  - 描述：仪表盘统计
  - 鉴权：是（admin）

- GET /api/admin/users
  - 描述：用户列表（仅普通用户）
  - 鉴权：是（admin）
  - Query: page?, limit?, phone?, status?

- POST /api/admin/users
  - 描述：管理员手动创建普通用户
  - 鉴权：是（admin）
  - Body: { phone, password, nickname?, initial_points? }

- GET /api/admin/users/:id
  - 描述：查询用户详情
  - 鉴权：是（admin）
  - Path: id

- PUT /api/admin/users/:id
  - 描述：管理员编辑用户基础信息（仅允许编辑普通用户的昵称与密码，手机号不可修改）
  - 鉴权：是（admin）
  - Path: id
  - Body: { nickname?: string | null, password?: string }
    - `nickname`：string | null，传空串或 null 可清空昵称（会做 trim）。
    - `password`：string，至少 6 位；若不传则保持原密码；将被 `bcrypt` 加密后保存到 `password_hash` 字段。
  - 说明：
    - 不可通过此接口修改 `phone`、`role`、`status` 或 `points`（这些在其他接口管理）。
    - 若请求未包含任何可编辑字段（`nickname` 与 `password` 均未提供），接口将返回错误提示。
    - 为安全起见，本接口拒绝修改 `role !== 'user'` 的用户（即不能用于修改管理员账号）。
  - 返回示例：{ "code":0, "msg":"用户信息更新成功", "data": { "id":1, "phone":"138xxxx", "nickname":"新昵称" } }

- PUT /api/admin/users/:id/points
  - 描述：管理员调整用户积分（事务保障）
  - 鉴权：是（admin）
  - Body: { amount, description }

- PUT /api/admin/users/:id/status
  - 描述：封禁/解禁用户
  - 鉴权：是（admin）
  - Body: { status: 'normal'|'banned' }

- GET /api/admin/orders
  - 描述：订单列表（管理员视角）
  - 鉴权：是（admin）
  - Query: page?, limit?, status?, user_id?

- GET /api/admin/generations
  - 描述：生成记录列表（管理员）
  - 鉴权：是（admin）
  - Query: page?, limit?, type?, status?, user_id?

- GET /api/admin/announcements
  - 描述：公告列表（含草稿）
  - 鉴权：是（admin）
  - Query: page?, limit?, status?

- POST /api/admin/announcements
  - 描述：创建公告
  - 鉴权：是（admin）
  - Body: { title, content, level? }

- PUT /api/admin/announcements/:id
  - 描述：更新公告（可发布）
  - 鉴权：是（admin）
  - Body: { title?, content?, level?, status? }

- DELETE /api/admin/announcements/:id
  - 描述：删除公告
  - 鉴权：是（admin）

- GET /api/admin/points-packages
  - 描述：套餐列表（含下架）
  - 鉴权：是（admin）

- POST /api/admin/points-packages
  - 描述：创建积分套餐
  - 鉴权：是（admin）
  - Body: { name, points, bonus_points?, price, bonus_rate?, sort_order? }

- PUT /api/admin/points-packages/:id
  - 描述：更新套餐属性
  - 鉴权：是（admin）
  - Body: { name?, points?, bonus_points?, price?, bonus_rate?, sort_order?, is_active? }

- DELETE /api/admin/points-packages/:id
  - 描述：下架套餐（设为不可用）
  - 鉴权：是（admin）

- GET /api/admin/configs
  - 描述：获取系统配置键值（前台无鉴权版见 GET /api/configs）
  - 鉴权：是（admin）

- PUT /api/admin/configs
  - 描述：批量更新系统配置
  - 鉴权：是（admin）
  - Body: { configs: { key1: value1, key2: value2, ... } }

- GET /api/admin/ai-models
  - 描述：管理员获取全量 AI 模型列表（含敏感字段 api_key、api_endpoint）
  - 鉴权：是（admin）

- POST /api/admin/ai-models
  - 描述：管理员新建 AI 模型
  - 鉴权：是（admin）
  - Body:
    - `name`（必填）：前台展示名称，如 "Veo 3.1 Fast"
    - `subtitle`（可选）：副标题，如 "速度优先"
    - `type`（必填）：`image` / `video` / `both`
    - `api_key`（可选）：该模型的 API Key
    - `api_endpoint`（可选）：调用地址
    - `model_name`（必填）：传给 API 的模型标识符，如 "veo-3.1"
    - `sort_order`（可选，默认 0）：升序排列权重
    - `is_active`（可选，默认 1）：是否在前台展示

- PUT /api/admin/ai-models/:id
  - 描述：管理员更新 AI 模型信息
  - 鉴权：是（admin）
  - Path: id
  - Body: { name?, subtitle?, type?, api_key?, api_endpoint?, model_name?, sort_order?, is_active? }

- DELETE /api/admin/ai-models/:id
  - 描述：管理员删除 AI 模型（物理删除）
  - 鉴权：是（admin）
  - Path: id
  - 说明：若不希望彺常展示可改用 is_active=0，删除操作不可逆

示例（管理员查询用户列表）：
```
curl -X GET https://HOST/api/admin/users \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'
```

---

## Web 页面路由

- GET /
  - 描述：渲染首页（由 `HomePageController.getHomePage` 处理）
  - 鉴权：否（访问渲染视图）

---

## 未挂载/未暴露但存在的控制器方法

- `app/controllers/api/UsersController.js` 中实现了一套 `register/login/validate/refresh/logout/getFullName` 等方法，但**未在当前路由映射中引用**（没有对应的 `app/routes` 条目）。如果需要暴露这些接口，请在路由配置中添加对应映射或确认是否为历史遗留文件。

---

## 调用与鉴权说明
- 私有与管理员接口需在请求头中携带：`Authorization: Bearer <access_token>`。
- 管理员接口还需保证 token 对应用户的 `role` 为 `admin`（路由中有 adminRole 中间件检查）。
- 支付回调为第三方调用，请确保回调地址在支付方配置中正确，并使用 `POST /api/pay/callback` 接收。