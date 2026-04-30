# OpenAI Provider 设计方案

日期：2026-04-29
范围：后端图片与视频生成架构重构
状态：设计已确认，可进入实现计划阶段

## 1. 目标

将当前以模型和上游平台实现细节为中心的生成架构，重构为可复用的 `Provider + Model + Adapter` 三层结构。

新设计必须满足以下目标：

- 同时支持图片生成和视频生成
- 仅支持 `OpenAI compatible` 上游 provider
- 同一个 provider 配置可以被多个模型复用
- 去掉当前对 `nanobanana` 及其他特定上游分支逻辑的硬依赖
- 保持现有用户侧生成流程稳定：提交任务、轮询状态、查看记录、扣减积分

本设计覆盖后端数据模型、后台接口、运行时请求流、迁移策略和测试范围。

## 2. 当前现状

当前生成主流程如下：

`GenerateController -> AiModel -> AigcService -> 上游 API`

当前主要问题：

- `AiModel` 同时承载业务配置和连接配置，直接存储 `api_key`、`api_endpoint`
- `AigcService` 通过 `model_name` 分支硬编码不同上游行为
- 模型能力定义写死在代码中的 `MODEL_CAPABILITIES` 常量里，新增模型必须发版
- 图片和视频的上游处理没有抽象为统一的内部契约
- 旧的 `nanobanana.service.js` 仍然存在，但实际主链路已经围绕 `GenerateController` 和 `aigc.service.js` 运转

## 3. 设计决策

采用三层后端架构：

- `AIProvider`：存储可复用的上游连接配置
- `AiModel`：存储面向产品展示和业务计费的模型定义，以及模型能力配置
- `Adapter`：负责把内部生成请求映射为 provider 对应的 OpenAI compatible API 请求，并将结果标准化

选择该方案的原因：

- 清晰分离业务配置与连接配置
- 清晰分离生成流程与上游协议细节
- 后台模型管理不再直接耦合到底层传输实现

## 4. 架构设计

目标流程：

`GenerateController -> GenerationGateway -> AIProvider + AiModel -> OpenAICompatibleAdapter`

各层职责如下：

- `GenerateController`
  - 校验请求参数
  - 检查用户积分
  - 创建和更新生成记录
  - 暴露 `generate/image`、`generate/video`、`generate/result`、`generate/records`

- `GenerationGateway`
  - 加载模型和 provider 配置
  - 根据 provider 协议选择 adapter
  - 执行统一的提交与轮询操作

- `OpenAICompatibleAdapter`
  - 构造图片和视频的上游请求
  - 统一标准化上游的成功、处理中、失败结果
  - 对 controller 和数据库层隐藏上游协议细节

- `GeneratedMediaService`
  - 将生成得到的图片和视频落地到本地存储，或未来可替换为对象存储
  - 返回稳定的内部 URL，用于写入 `Generation.result_url`

## 5. 数据模型设计

### 5.1 AIProvider

新增 `AIProvider` 模型和数据表。

建议字段：

- `id`
- `name`
- `code`
- `protocol`
- `base_url`
- `api_key`
- `enabled`
- `timeout_ms`
- `extra_config`
- `createdAt`
- `updatedAt`

字段约束：

- `protocol` 第一阶段只允许 `openai_compatible`
- `code` 必须唯一
- `base_url` 运行时需要去掉尾部多余的 `/`
- `extra_config` 为 JSON，用于预留可选 headers 或未来传输参数

### 5.2 AiModel

重构 `AiModel`，让它只保留产品和业务相关配置。

保留字段：

- `id`
- `name`
- `subtitle`
- `type`
- `model_name`
- `sort_order`
- `is_active`
- `points_cost`

新增字段：

- `provider_id`
- `capabilities`
- `default_params`

删除字段：

- `api_key`
- `api_endpoint`

字段约束：

- `type` 仍为 `image`、`video`、`both`
- `capabilities` 为 JSON，用于描述前端可见能力选项
- `default_params` 为 JSON，用于定义运行时默认参数
- `provider_id` 外键关联 `AIProvider.id`

### 5.3 Generation

现有 `Generation` 表继续作为用户任务历史的主数据源。

建议新增：

- `ai_model_id`
- `provider_id`

保留已有 `model` 字段，作为字符串快照，用于兼容历史数据和报表统计。

第一阶段可以保留 `work_id` 这个物理列名，但在代码语义上统一视为 `upstream_job_id`。

## 6. 模型能力配置

将模型能力配置从代码中移出，改为数据库 JSON 配置。

示例 `capabilities`：

```json
{
  "aspectRatioOptions": ["auto", "1:1", "16:9", "9:16"],
  "sizeOptions": ["1024x1024", "1536x1024", "1024x1536"],
  "qualityOptions": ["auto", "low", "medium", "high"],
  "durationOptions": [5, 8, 10]
}
```

示例 `default_params`：

```json
{
  "aspectRatio": "auto",
  "size": "1024x1024",
  "quality": "auto",
  "seconds": 8
}
```

这样可以去掉当前写死在 `aigc.service.js` 中的 `MODEL_CAPABILITIES`，后台新增或调整模型时也不再需要改代码。

## 7. 运行时内部契约

在 controller/gateway 与 adapter 之间定义统一标准返回结构。

### 7.1 提交结果

```json
{
  "status": "success|pending|failed",
  "upstream_job_id": "string or null",
  "progress": 0,
  "assets": [],
  "error_message": null
}
```

### 7.2 轮询结果

```json
{
  "status": "pending|success|failed",
  "progress": 0,
  "assets": [
    {
      "type": "image|video",
      "mime_type": "image/png",
      "source": "url|base64|binary",
      "data": "..."
    }
  ],
  "error_message": null
}
```

约束规则：

- controller 不得解析任何上游特定响应结构
- adapter 必须统一将错误归一为 `error_message`
- 生成出的媒体资源必须先落地保存，再将最终 `result_url` 写入数据库

## 8. OpenAI Compatible 映射策略

### 8.1 图片生成

图片生成走 OpenAI compatible 的图片接口，并将结果标准化。

基于当前 OpenAI 官方行为，做如下假设：

- 图片生成有可能直接返回最终结果，而不是异步任务
- 图片结果可能以 base64 返回，而不是永久 URL

设计选择：

- 如果 adapter 收到图片二进制或 base64，后端先保存文件，再立即将该生成任务标记为 `success`
- 如果 provider 返回图片 URL，后端仍建议主动下载并保存，以保证对前端暴露的是稳定的内部资源地址

### 8.2 视频生成

视频生成走 OpenAI compatible 的视频任务流：

- 提交视频任务
- 保存上游任务 ID
- 轮询上游任务状态
- 完成后下载最终视频文件
- 将视频文件保存到本地
- 更新 `Generation.result_url`

设计选择：

- 所有成功完成的视频都通过后端统一托管存储
- 前端不直接依赖可能过期的上游视频地址

## 9. 接口变更

### 9.1 后台 provider 管理接口

新增：

- `GET /api/admin/ai-providers`
- `POST /api/admin/ai-providers`
- `PUT /api/admin/ai-providers/:id`
- `DELETE /api/admin/ai-providers/:id`

后台 provider 字段：

- `name`
- `code`
- `protocol`
- `base_url`
- `api_key`
- `enabled`
- `timeout_ms`
- `extra_config`

### 9.2 后台模型管理接口

重构现有模型管理接口：

- `GET /api/admin/ai-models`
- `POST /api/admin/ai-models`
- `PUT /api/admin/ai-models/:id`
- `DELETE /api/admin/ai-models/:id`

模型字段调整为：

- `name`
- `subtitle`
- `type`
- `provider_id`
- `model_name`
- `sort_order`
- `is_active`
- `points_cost`
- `capabilities`
- `default_params`

从模型接口中移除 `api_key` 和 `api_endpoint`。

### 9.3 前台模型接口

`GET /api/ai-models` 保持不变，仍然返回启用中的模型列表，但 `capabilities` 不再来自代码常量，而是直接来自数据库。

### 9.4 生成接口

面向用户的生成接口保持稳定：

- `POST /api/generate/image`
- `POST /api/generate/video`
- `POST /api/generate/result`
- `GET /api/generate/records`

行为变化：

- 图片生成可能同步完成，提交后可直接返回成功结果
- 视频生成仍然保持异步
- 为兼容现有前端，旧的轮询行为必须继续可用

## 10. 文件级改动范围

### 新增文件

- `app/models/AIProvider.js`
- `app/controllers/api/AiProviderController.js`
- `app/services/providers/openai-compatible.adapter.js`
- `app/services/generation.gateway.js`
- `app/services/generatedMedia.service.js`

### 修改文件

- `app/models/AiModel.js`
- `app/models/Generation.js`
- `app/models/index.js`
- `migrator/models.js`
- `app/controllers/api/AiModelController.js`
- `app/controllers/api/GenerateController.js`
- `app/routes/api/adminRoutes.js`
- `app/services/aigc.service.js`，或将其职责迁移到 `generation.gateway.js`
- `docs/APIs.md`
- `.env.example`

### 迁移稳定后可移除

- `app/services/nanobanana.service.js`
- `aigc.service.js` 中写死的 `MODEL_CAPABILITIES`
- 所有基于 `model_name` 的旧上游分支假设

## 11. 迁移策略

当前项目依赖的是 Sequelize `sync` 风格迁移，这种方式本身不足以安全完成现有 `AiModel` 数据结构升级。

建议采用分阶段迁移：

### Phase 1

- 新增 `AIProvider`
- 给 `AiModel` 增加 `provider_id`、`capabilities`、`default_params`
- 可选地给 `Generation` 增加 `ai_model_id`、`provider_id`
- 暂时保留旧字段 `api_key`、`api_endpoint`

### Phase 2

编写一次性回填脚本：

- 按 `api_endpoint + api_key` 对旧模型分组
- 每个唯一上游配置生成一个 provider
- 将对应模型绑定到生成的 provider
- 将当前代码里的能力配置回填到 `AiModel.capabilities`
- 将默认参数初始化到 `default_params`

### Phase 3

- 将运行时代码切换到 provider 驱动流程
- 验证生成、轮询、记录查询逻辑
- 移除遗留字段和废弃代码

如果当前环境可以重置且无需保留历史数据，可在开发环境采用更快的重建方案；否则应执行回填迁移。

## 12. 错误处理

校验规则：

- provider 协议必须是 `openai_compatible`
- `provider_id` 必须指向存在且启用中的 provider
- 图片模型不能处理视频请求
- 视频模型不能处理图片请求

运行时处理：

- 上游鉴权失败统一映射为标准生成错误
- 上游限流要作为 provider 错误返回，避免重复退款
- 提交失败必须触发积分回滚
- 轮询失败不得重复退款，也不得重复记积分流水
- 视频在上游完成后若下载失败，不可误标记为成功，应视为失败或可重试状态

可观测性要求：

- 如可获取，应记录上游 request id
- 记录 provider id、model id、generation id、upstream job id
- 严禁记录原始 API key 或敏感请求内容

## 13. 测试范围

### 单元测试

- gateway 的 provider 选择逻辑
- adapter 的图片和视频请求映射
- adapter 的结果标准化
- 能力配置与默认参数的回退逻辑

### 集成测试

- 图片提交成功并立即完成
- 视频提交成功并通过轮询完成
- 提交失败时积分正确退款
- 轮询失败时任务正确失败
- 长时间 pending 的清理逻辑

### 后台接口测试

- 创建 provider
- 创建绑定 provider 的模型
- 拒绝非法 protocol
- 拒绝绑定不存在 provider 的模型

### 迁移测试

- 旧模型数据能正确回填为 provider 结构
- 切换后历史记录仍能正确查询任务结果

## 14. 非目标

本设计暂不包含：

- 支持非 OpenAI compatible provider
- 后台前端页面重设计
- 超出本地存储抽象范围的对象存储集成
- webhook 优先的任务完成模式

以上能力都可以在后续阶段基于当前 `Provider + Model + Adapter` 架构继续扩展。

## 15. 实施建议顺序

建议按以下顺序推进实现：

1. 新增 provider 模型与关联关系
2. 新增 provider 后台管理接口
3. 将模型能力配置迁移到数据库字段
4. 实现 generation gateway 和 OpenAI compatible adapter
5. 迁移图片生成逻辑
6. 迁移视频生成逻辑
7. 删除遗留 nanobanana 与硬编码分支

这样可以分阶段重构，同时尽量保持现有用户侧接口和行为稳定。

## 16. 已确认决策

本 spec 已确认的产品与技术决策如下：

- 使用 `Provider + Model + Adapter` 三层结构
- 同时支持图片和视频
- 只支持 `OpenAI compatible` providers
- provider 配置一次，可被多个模型复用
- 后台接口和后台数据结构一起升级为新的 `provider + model` 体系
