# 2026-03-19 图片生成“提交任务 + 轮询结果”前端改造设计（HomeView）

## 背景
当前图片生成流程在 [`handleGenerate()`](src/views/HomeView.vue:381) 中调用 [`generateImage()`](src/api/generate.js:3) 后，假设接口会同步返回最终生成结果（`result_url` 列表）。

后端改为异步任务：
- `POST /api/generate/image` 立即返回任务回执（包含 `generation_id` / `work_id` / `cost_points`），任务状态为 `pending`。
- 前端需使用 `generation_id` 轮询 `POST /api/generate/result` 获取进度和最终 `result_url`。

## 目标（第一性原理）
- **让用户尽快得到“任务已开始”的反馈**：提交成功后立即进入结果页并显示生成中。
- **在不阻塞请求的前提下获得最终结果**：通过轮询获取状态/进度/结果。
- **保证积分与任务一致性**：积分在“提交成功”时即被消耗，前端余额需及时同步，避免体验与记录不一致。
- **最小化变更范围**：不新增依赖、不新增文件、不改路由/全局状态结构，尽量复用现有 UI 与状态变量。

## 非目标（不做什么）
- 不改造为 WebSocket/SSE 推送。
- 不抽离新的 composable（避免新增文件）。
- 不重构结果展示 UI（继续复用当前 results 网格、失败 badge、加载骨架）。
- 不实现“多张轮询结果聚合”（当前确认：成功时可能只返回单个 `result_url`，则仅展示 1 张）。

## 现状梳理（关键现有状态）
- `generating` / `genProgress`：用于顶部进度条与按钮 loading 文案。
- `results: []`：结果网格数据源，模板读取 `item.result_url` 与 `item.status`。
- `startProgress()`：本地模拟进度，最高到 90%。
- `resultImageStates`：用于图片 onload 后从 skeleton 切换显示。

相关位置：
- [`startProgress()`](src/views/HomeView.vue:371)
- [`handleGenerate()`](src/views/HomeView.vue:381)
- 结果渲染使用 `item.result_url`：[`<img :src="item.result_url" ...>`](src/views/HomeView.vue:208)

## 接口契约（前端视角）
### 1) 提交任务
- 调用：`POST /api/generate/image`
- 前端函数：[`generateImage()`](src/api/generate.js:3)
- 期望返回（示例）：
```json
{
  "success": true,
  "message": "任务已提交",
  "data": {
    "generation_id": 24,
    "work_id": "...",
    "cost_points": 100
  }
}
```

### 2) 轮询结果
- 调用：`POST /api/generate/result`
- 前端函数：[`getGenerationResult()`](src/api/generate.js:9)
- 请求体：
```json
{ "id": 24 }
```
- 返回：
  - pending：`{ status: "pending", progress: number }`
  - success：`{ status: "success", result_url: string, progress: 100 }`
  - failed：`{ status: "failed", message?: string }`（或 `success:false` + message）

> 注：为适配未知后端细节，前端实现需对 `success` 字段、`status` 字段、`message` 字段做容错。

## 方案对比
1) **（推荐）组件内 while + sleep 轮询**
- 优点：线性流程、易读、易做超时与中断、清理成本低。
- 缺点：需要注意避免并发与竞态写入。

2) setInterval 轮询
- 优点：传统方式。
- 缺点：清理/并发控制更复杂；容易出现重入/多次触发导致并发请求。

3) 抽成 composable
- 优点：更复用、更单测友好。
- 缺点：会新增文件，违背“最小变更范围”。

结论：采用方案 1。

## 详细设计
### 核心状态（最小新增）
在 [`<script setup>`](src/views/HomeView.vue:264) 内仅新增极少量局部变量：
- `let activeGenerationId: number | null = null`：用于避免旧轮询回写新任务。
- `const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))`：本地工具函数。

不新增 store 字段，不改变现有 props/API。

### 状态机（简化）
- idle：`generating=false`、`results` 可为空或上次结果。
- submitting：开始生成后进入 generating=true。
- polling：拿到 `generation_id` 后轮询 pending。
- success：轮询成功，填充 results、`genProgress=100`，结束 generating。
- failed/timeout：展示失败 toast，并填充一个 failed item 以复用 UI。

### handleGenerate 新流程（伪代码）
在 [`handleGenerate()`](src/views/HomeView.vue:381) 内按以下步骤：
1. 参数校验（提示词、积分是否足够）——保持不变。
2. UI 立即反馈：`mobileView='result'`、`generating=true`、`startProgress()`、`lastPrompt=form.prompt`。
3. 组装 payload 并调用 `generateImage(payload)`。
4. 若提交成功：
   - 读取 `generation_id` 与 `cost_points`。
   - **立即扣积分**：`userStore.points -= cost_points`（若 cost_points 缺失，则 fallback 使用 `imageCost*count`，但优先 cost_points）。
   - 进入轮询：每 2s 调一次 `getGenerationResult({id:generation_id})`，最多 120s（60 次）。
   - pending：
     - 若返回 `progress`，用 `genProgress = clamp(progress, 0, 99)` 覆盖显示。
     - 否则维持现有模拟进度（不回退 UI）。
   - success：
     - `results = [{ status:'success', result_url }]`
     - 清空 `resultImageStates`
     - `genProgress=100`，toast success。
   - failed：toast error，`results=[{status:'failed', result_url:''}]`
5. 若提交失败：toast error。
6. finally：清理 `progressTimer`、设置 `generating=false`、`genProgress=0`。

### 并发与竞态控制
- 在函数开头加：若 `generating.value===true` 则直接 return，防止重复提交。
- 每次提交成功后设置 `activeGenerationId=generation_id`。
- 轮询循环中每次收到响应都判断 `activeGenerationId===generation_id`，否则立即停止处理（说明用户已经发起新任务）。

### 进度展示策略
- 现有模拟进度最高 90%。
- 若后端返回 progress：用后端进度覆盖，并限制在 0~99（避免成功前显示 100）。
- 成功时强制 100。

### 错误与异常处理
- 提交阶段失败：提示 `res.message || '生成失败，请重试'`。
- 轮询阶段网络异常：提示 `e?.message || '生成失败，请稍后重试'` 并结束。
- 超时（120s）：toast `生成超时，请稍后在记录里查看或重试`，结束 generating。

### 结果数据结构（兼容现有模板）
保持模板只依赖：
- `item.result_url`
- `item.status`（只在 failed badge 使用）

因此：
- success：`{ status:'success', result_url: string }`
- failed：`{ status:'failed', result_url: '' }`

## 影响范围评估
- 仅修改：
  - [`src/views/HomeView.vue`](src/views/HomeView.vue:381)（handleGenerate + 少量局部辅助变量）
  - [`src/api/generate.js`](src/api/generate.js:9)（新增 `getGenerationResult` 导出）
- 不修改路由、全局 store 结构、公共组件。

## 验收标准（成功定义）
- 点击“开始生成”后：
  - 立即切换到结果页并显示进度条。
  - 控制台无未处理 Promise/定时器泄漏。
- 提交成功后：前端积分立即减少 `cost_points`。
- 轮询 pending：进度能随着后端 progress 更新（若有）。
- 轮询 success：能展示返回的 `result_url` 图片。
- 轮询 failed/超时：能看到明确 toast，并在网格中展示失败态卡片（复用现有 UI）。

## 测试计划（最小自测）
- 正常流程：提交 → pending 若干次 → success。
- 积分不足：点击后直接 toast，不触发请求。
- 轮询超时：模拟一直 pending，120s 后提示超时并停止。
- 快速重复点击：不会产生并发多个任务（generating 时直接 return）。

## 建议 commit 信息
- `feat(home): image generate polling via generation_id`
