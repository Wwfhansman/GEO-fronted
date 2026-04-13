# GEO 测试功能技术设计文档

## 1. 文档目的

本文档定义 GEO 官网中“免费测试”功能的技术设计方案，覆盖端到端流程、指标口径、模型调用方式、审查逻辑、数据存储、接口设计、异常处理和转化增强要求。

本设计文档仅覆盖测试功能本身，不展开整站技术架构、部署细节、CMS 管理能力或后台运营系统设计。

## 2. 功能定义

测试功能的目标是让用户输入公司名、产品关键词、行业和目标大模型平台后，系统基于行业模板向所选平台发起一次测试查询，获得回答后判断该回答中是否提及用户输入的公司名，并统计出现次数，最后将单次结果累计为用户级总指标，并返回给前端展示。

该功能用于制造 GEO 风险感知、推动注册留资与后续转化，不追求研究级精度，也不提供严格审计结论。

## 3. 设计原则

- 首期只做一次查询，不做多轮提示词采样
- 首期只检测用户输入的公司名是否在回答中出现
- 产品关键词仅用于构造测试问题，不作为命中对象
- 结果统计采用规则主导，保证稳定性和可解释性
- 模型辅助能力仅用于增强评价表达，不直接改写核心计数
- 同时保存单次测试记录与用户聚合指标，保证可回溯
- 测试页和结果页都要展示用户累计总体数据
- 测试转化链路优先于工程复杂度

## 4. 功能范围

### 4.1 本期包含

- 用户填写测试表单
- 未注册用户先填写，点击测试时再触发注册校验
- 注册成功后恢复并回填已填写表单内容
- 根据行业模板生成一次测试 prompt
- 调用目标平台一次，获取主模型回答
- 对回答进行公司名命中判断与曝光次数统计
- 生成单次测试结果
- 聚合用户累计测试指标
- 在测试页和结果页展示总体数据
- 在结果页展示本次测试明细

### 4.2 本期不包含

- 多轮 prompt 采样
- 多平台并发对比
- 批量测试
- 品牌别名、简称、英文名识别
- 产品关键词命中判断
- 引用来源、citation、来源链接提取
- 重分析型历史报表
- 后台运营管理功能

## 5. 核心业务口径

### 5.1 单次测试输入

每次测试由以下输入组成：

- 公司名
- 产品关键词
- 行业
- 目标大模型平台

说明：

- 公司名用于后续结果审查
- 产品关键词用于生成 prompt
- 行业用于选择内置 prompt 模板
- 平台用于选择调用的目标模型服务

### 5.2 单次测试输出

每次测试完成后，系统产出以下核心结果：

- 本次是否提及公司名
- 本次被提及次数
- 本次曝光次数
- 本次评价文案
- 原始回答文本

说明：不输出"曝光率"，3 次样本下百分比缺乏说服力

### 5.3 用户累计指标

用户维度需维护以下累计指标：

- 总查询次数
- 被提及次数
- 曝光次数
- 剩余免费测试次数
- 整体评价文案

### 5.4 整体评价文案生成规则

`overall_evaluation_text` 基于累计指标按规则映射生成，不使用 LLM：

- 全部未提及（total_mentioned_count = 0）→ "您的品牌当前几乎不会被 AI 主动推荐"
- 提及率低于 50%（total_mentioned_count / total_query_count < 0.5）→ "您的品牌在 AI 场景中的可见性较弱"
- 提及率 50% 及以上 → "您的品牌具有一定 AI 可见性，但仍有优化空间"

说明：

- MVP 阶段采用硬编码分档，不做动态文案生成
- 每次测试完成后根据最新累计指标重新计算
- 后续可升级为基于更多维度的评价算法

## 6. 指标定义

### 6.1 总查询次数

表示一个用户累计成功完成了多少次测试。

示例：

- 用户成功完成 1 次测试，总查询次数为 1
- 用户用完 3 次免费测试机会后，总查询次数为 3

说明：

- 总查询次数是用户级指标
- 不表示单次请求内部的调用次数
- 仅在测试成功完成后增加

### 6.2 被提及次数

表示一个用户累计有多少次测试中，其输入的公司名至少出现过一次。

单次口径：

- 一次测试中若未出现公司名，则本次记 0
- 一次测试中若出现公司名 1 次或多次，则本次统一记 1

累计口径：

- 被提及次数为所有单次测试 `mentioned_count_for_query` 的求和

### 6.3 曝光次数

表示一个用户累计在所有测试结果中，公司名一共被提及了多少次。

单次口径：

- 一次测试中公司名出现几次，本次曝光次数就记几次

累计口径：

- 曝光次数为所有单次测试 `exposure_count_for_query` 的求和

### 6.4 单次测试级指标

每次测试至少要产出以下字段：

- `is_mentioned`
- `mentioned_count_for_query`
- `exposure_count_for_query`
- `evaluation_text`
- `raw_response_text`

定义：

- `is_mentioned`：本次是否命中公司名
- `mentioned_count_for_query`：本次是否计入一次被提及，取值只能是 0 或 1
- `exposure_count_for_query`：本次回答中公司名的实际出现次数

### 6.5 用户级聚合指标

用户累计结果至少包括：

- `total_query_count`
- `total_mentioned_count`
- `total_exposure_count`
- `free_test_quota_remaining`

## 7. 页面交互与转化链路

### 7.1 总体流程

测试功能的主流程如下：

1. 用户从官网进入测试页面
2. 测试页顶部先展示用户当前累计指标或示例数据
3. 用户填写测试表单
4. 用户点击 `查看AI曝光情况`
5. 系统此时判断是否已注册
6. 若未注册，则拉起注册流程
7. 注册成功后恢复并回填之前填写的测试内容
8. 系统执行测试
9. 返回单次结果与用户累计结果
10. 结果页展示总体数据、本次测试明细和后续转化动作

### 7.2 注册触发时机

注册校验发生在用户点击 `查看AI曝光情况` 时，而不是进入测试页时。

设计目的：

- 允许用户先完成表单填写，形成沉没成本
- 降低过早拦截带来的流失
- 提高注册转化率

### 7.3 测试页结构

测试页由以下模块组成：

1. 顶部总体数据模块  
展示用户累计指标：
- 总查询次数
- 被提及次数
- 曝光次数
- 剩余免费测试次数
- 当前整体评价

2. 测试表单模块  
字段：
- 公司名
- 产品关键词
- 行业
- 模型平台

按钮文案固定为：

`查看AI曝光情况`

3. 单次测试明细模块  
展示最近一次测试结果或空状态说明

### 7.4 结果页结构

结果页由以下模块组成：

1. 顶部总体数据模块  
展示用户累计指标与整体评价

2. 本次测试结果模块  
展示：
- 本次平台
- 本次行业
- 本次是否提及
- 本次曝光次数
- 本次评价文案
- 原始回答文本或摘要

3. 页尾承接模块  
按钮或 CTA：

`联系您的专属AI营销团队`

### 7.5 转化增强要求

测试功能需包含以下转化增强设计：

- 用户进入测试页后即可看到总体数据
- 测试表单内容前端暂存，注册返回后自动回填
- 注册弹窗文案需明确提示：
  - 完成注册后即可查看测试结果
  - 注册成功后赠送 3 次免费测试机会
- 测试执行过程中展示过程动画和期待文案
- 结果页第一屏先给出整体累计结果与总体结论

## 8. 技术架构

### 8.1 架构原则

首期采用同步调用架构。用户提交一次测试请求后，后端在一次请求生命周期内完成 prompt 生成、模型调用、结果审查、累计指标更新，并将结果返回给前端。

### 8.1.1 超时保护策略

由于外部大模型 API 响应时间不可控（可能 5-30 秒甚至更长），需设置以下超时保护：

- 后端对主 LLM 调用（目标平台）设置超时上限 **45 秒**
- 后端对审查 LLM 调用（辅助模型）设置超时上限 **15 秒**
- 审查调用超时时降级为纯规则匹配，不阻塞主流程
- 主调用超时后，测试记录标记 `failed`，不扣减免费次数
- 前端设置 **50 秒**前端超时兜底，超时后展示"平台响应较慢，请稍后重试"
- 后端记录每个 provider 的平均响应时间，持续超时的平台通过 Config API 下发前端隐藏该选项

### 8.2 分层设计

系统建议划分为以下 5 层：

1. 前端交互层  
负责表单填写、前端暂存、注册跳转、结果展示和加载动效

2. 接口接入层  
负责鉴权、参数校验、流程编排、状态返回

3. Prompt 生成层  
负责根据行业模板和产品关键词生成最终 prompt

4. 模型执行与审查层  
负责调用目标模型、获取回答、执行命中判断和评价生成

5. 数据存储与聚合层  
负责保存测试记录、更新用户累计指标、返回历史状态

### 8.3 核心组件建议

- `Test Request Handler`：请求入口与流程编排
- `Prompt Builder`：行业模板 + 关键词 → 最终 prompt
- `LLM Provider Adapter`：统一适配多平台模型调用（主调用）
- `Company Name Preprocessor`：公司名去后缀、提取核心品牌词
- `Rule Matcher`：规则层字符串匹配
- `LLM Review Analyzer`：辅助模型审查调用（第二次 LLM）
- `Result Merger`：合并规则匹配与 LLM 审查结果
- `Metrics Aggregator`：用户累计指标原子更新

## 9. 端到端数据流

一次测试的后端处理流程建议如下：

1. 前端提交测试表单
2. 后端校验用户身份、免费次数、参数完整性
3. 创建一条测试记录，状态为 `processing`
4. 根据行业模板与产品关键词生成最终 prompt
5. 第一次 LLM 调用（主调用）：向目标大模型平台发起 prompt，获取原始回答
6. 对公司名做预处理（去除企业后缀和地名前缀，提取核心品牌词）
7. 执行规则匹配层
8. 分层裁决：
   - 规则命中 → 直接确认命中，仅调用审查 LLM 生成评价文案
   - 规则未命中 → 第二次 LLM 调用（审查调用），做命中判断 + 评价文案
   - 审查 LLM 超时/失败 → 降级为规则结果 + 默认模板文案
9. 归一单次测试结果
10. 原子更新用户累计指标并扣减免费次数
11. 将测试记录状态改为 `completed`
12. 返回单次结果与累计结果给前端

若执行失败：

- 测试记录状态改为 `failed`
- 不更新累计查询次数
- 不扣减免费测试额度

## 10. Prompt 模板设计

### 10.1 输入原则

Prompt 生成仅使用以下信息：

- 行业
- 产品关键词
- 模型平台

公司名不进入主查询 prompt 的推荐对象部分，仅用于结果审查。

### 10.2 模板结构建议

每个行业维护一套主模板，结构尽量统一，至少包括：

- 行业场景背景
- 用户需求描述
- 产品关键词插槽
- 推荐型回答要求

目标是让模型面对的提问更接近真实用户咨询场景，而不是裸关键词提问。

### 10.3 模板管理

模板应具备以下可管理信息：

- `template_id`
- `industry`
- `template_version`
- `template_content`
- `is_active`

## 11. 模型调用层设计

### 11.1 统一适配原则

不同平台的接口差异由统一适配层屏蔽，业务层只消费标准化后的调用结果。

建议使用统一组件：

`LLM Provider Adapter`

### 11.2 支持平台

首期支持以下平台或对应模型能力：

- DeepSeek
- 豆包
- 通义
- ChatGPT

### 11.3 调用策略

- 一次测试仅调用一个平台
- 一次测试仅生成一个 prompt
- 一次测试仅获取一个主回答
- 不做多平台并发比较
- 不做多轮追问

### 11.4 统一返回结构

模型调用层建议至少向上返回以下字段：

- `provider`
- `model_name`
- `request_prompt`
- `response_text`
- `raw_provider_response`
- `status`
- `latency_ms`
- `error_code`
- `error_message`

## 12. 结果审查逻辑

### 12.1 审查目标

在目标模型返回主回答后，系统需要判断：

- 回答中是否出现了用户输入的公司名
- 一共出现了多少次
- 本次是否计入一次被提及
- 应输出什么评价文案

### 12.2 审查方案总述

首期采用”规则优先、LLM 补充、分层裁决”的审查方案。

核心原则：

- 规则精确命中时，直接判定命中，不依赖审查 LLM 做命中裁决
- 规则未命中时，才调用审查 LLM 做补充判断
- 最终结果由分层裁决逻辑确定，不简单取并集
- 审查 LLM 超时或失败时，降级为纯规则结果

整体流程涉及两次 LLM 调用：

- 第一次 LLM 调用（主调用）：向目标大模型平台发起行业测试问题，获取推荐回答
- 第二次 LLM 调用（审查调用）：仅在规则未命中时触发，由辅助模型判断是否存在语义级提及

两次调用使用不同模型：

- 主调用使用用户选择的目标平台模型
- 审查调用使用统一的轻量辅助模型（如 DeepSeek 基础模型），不随用户选择变化

### 12.3 标准化处理

在匹配之前，需要对公司名和回答文本做基础标准化处理，包括：

- 去除首尾空格
- 统一大小写
- 统一中英文空格
- 压缩连续空白字符
- 可选的全角半角统一

输出字段：

- `normalized_company_name`
- `normalized_response_text`

### 12.4 规则匹配层

规则匹配层对标准化后的公司名做基础字符串检索。

公司名预处理：

- 去除常见企业后缀（”有限公司””股份””集团””科技””技术””信息””网络”等）
- 去除地名前缀（省/市/区）
- 提取核心品牌词用于匹配

匹配规则：

- 如果标准化后的回答中未出现核心品牌词，则规则层判定为未命中
- 如果出现 1 次或多次，则规则层判定为命中
- 每出现一次，曝光次数加 1

规则匹配结果字段：

- `rule_matched`：布尔值
- `rule_match_count`：命中次数
- `rule_matched_snippets`：命中片段列表

### 12.5 分层裁决逻辑

根据规则匹配结果，分两条路径裁决：

**场景 A：规则精确命中（rule_matched = true）**

- 直接确认 `is_mentioned = true`
- 曝光次数取规则计数 `exposure_count_for_query = rule_match_count`
- 匹配片段取规则匹配片段
- 跳过审查 LLM 的命中判断，仅调用审查 LLM 生成评价文案
- 若评价文案的 LLM 调用超时或失败，使用默认模板文案

**场景 B：规则未命中（rule_matched = false）**

- 调用审查 LLM，同时做命中判断和评价文案生成
- 审查 LLM 返回 `mentioned: true` → 采信 LLM 结果：
  - `is_mentioned = true`
  - 曝光次数和匹配片段取 LLM 返回值
- 审查 LLM 返回 `mentioned: false` → 确认未命中：
  - `is_mentioned = false`
  - 评价文案取 LLM 返回的未命中评价
- 审查 LLM 超时或调用失败 → 降级为未命中：
  - `is_mentioned = false`
  - 使用默认未命中评价文案

裁决结果汇总：

| 规则结果 | LLM 结果 | 最终判定 | 曝光来源 | 评价来源 |
|---------|---------|---------|---------|---------|
| 命中 | — | 命中 | 规则 | LLM（降级为模板） |
| 未命中 | 命中 | 命中 | LLM | LLM |
| 未命中 | 未命中 | 未命中 | — | LLM |
| 未命中 | 超时/失败 | 未命中 | — | 默认模板 |

### 12.6 审查 LLM 调用设计

审查 LLM 在不同场景下的调用方式：

**场景 A 调用（规则已命中，仅生成评价文案）：**

Prompt 传入回答文本、公司名和规则命中结果，要求生成评价文案：

```json
{
  “evaluation_text”: “本次评价文案”
}
```

**场景 B 调用（规则未命中，需判断 + 评价）：**

Prompt 传入回答文本和公司名，要求判断是否存在语义级提及：

```json
{
  “mentioned”: true,
  “match_count”: 2,
  “snippets”: [“匹配片段1”, “匹配片段2”],
  “evaluation_text”: “本次评价文案”
}
```

审查 LLM 能覆盖规则层无法处理的情况：

- 品牌简称（如”字节”对应”字节跳动”）
- 英文名（如”HUAWEI”对应”华为”）
- 关联品牌或产品名（如”抖音”对应”字节跳动”）
- 上下文语义提及

调用约束：

- 使用轻量低成本模型
- 超时上限 15 秒
- 超时或失败时降级为规则结果 + 默认模板文案，不阻塞主流程

### 12.7 单次结果归一规则

经分层裁决后，最终结果按以下规则归一：

如果最终判定为未命中：

- `is_mentioned = false`
- `mentioned_count_for_query = 0`
- `exposure_count_for_query = 0`

如果最终判定为命中：

- `is_mentioned = true`
- `mentioned_count_for_query = 1`
- `exposure_count_for_query` = 来源层（规则或 LLM）返回的实际出现次数

### 12.8 审查输出结构

审查层至少输出以下字段：

- `normalized_company_name`
- `rule_matched`（规则层是否命中）
- `llm_review_triggered`（是否触发了审查 LLM 的命中判断）
- `llm_review_result`（审查 LLM 返回结果，可能为空）
- `final_match_source`（最终命中来源：`rule` / `llm` / `none`）
- `is_mentioned`
- `mentioned_count_for_query`
- `exposure_count_for_query`
- `matched_snippets`
- `evaluation_text`
- `evaluation_source`（评价文案来源：`llm` / `default_template`）

## 13. 数据存储设计

### 13.1 数据对象

首期逻辑上至少包含以下 5 类数据对象：

- 用户数据
- 测试记录数据
- 用户聚合指标数据
- Prompt 模板数据
- 联系线索数据

### 13.2 用户表 `users`

建议核心字段：

- `id`
- `supabase_auth_id`（关联 Supabase Auth 用户）
- `email`
- `phone`
- `company_name`
- `email_verified`（邮箱是否已验证，默认 false）
- `created_at`
- `updated_at`

### 13.3 测试记录表 `test_runs`

每发起一次测试，对应一条测试记录。

建议字段分组如下：

归属信息：

- `id`
- `user_id`

输入信息：

- `input_company_name`
- `input_product_keyword`
- `input_industry`
- `input_provider`

Prompt 信息：

- `template_id`
- `template_version`
- `final_prompt`

模型返回信息：

- `provider_model_name`
- `raw_response_text`
- `raw_provider_response`
- `response_latency_ms`

审查结果：

- `normalized_company_name`
- `rule_matched`
- `llm_review_triggered`
- `final_match_source`
- `is_mentioned`
- `mentioned_count_for_query`
- `exposure_count_for_query`
- `matched_snippets`
- `evaluation_text`
- `evaluation_source`

状态信息：

- `status`
- `error_code`
- `error_message`
- `created_at`
- `completed_at`

### 13.4 用户聚合指标表 `user_test_metrics`

建议字段：

- `user_id`
- `total_query_count`
- `total_mentioned_count`
- `total_exposure_count`
- `free_test_quota_total`
- `free_test_quota_remaining`
- `last_test_at`
- `updated_at`

说明：

- 用户累计指标是派生数据
- 其唯一可信来源应为单次测试记录

### 13.5 模板表 `prompt_templates`

建议字段：

- `id`
- `industry`
- `template_version`
- `template_content`
- `is_active`
- `created_at`
- `updated_at`

### 13.6 联系线索表 `contact_leads`

建议字段：

- `id`
- `user_id`
- `user_email`
- `user_phone`
- `user_company_name`
- `test_summary`（JSON，包含累计指标和最近一次测试信息）
- `email_sent`（是否已发送邮件通知）
- `created_at`

## 14. 聚合逻辑

当一条测试记录成功完成后，按以下方式更新用户累计指标：

- `total_query_count = total_query_count + 1`
- `total_mentioned_count = total_mentioned_count + mentioned_count_for_query`
- `total_exposure_count = total_exposure_count + exposure_count_for_query`
- `free_test_quota_remaining = free_test_quota_remaining - 1`

说明：

- 用户注册后默认获得 3 次免费测试机会
- 仅 `completed` 状态的测试会更新上述累计指标

### 14.1 原子扣减要求

免费次数的校验与扣减必须在同一数据库事务中完成，防止并发穿透：

```sql
UPDATE user_test_metrics
SET free_test_quota_remaining = free_test_quota_remaining - 1
WHERE user_id = ? AND free_test_quota_remaining > 0
```

若 `affected_rows = 0`，说明无剩余次数，直接拒绝请求。

不允许先查询剩余次数再扣减的两步操作，避免竞态条件下超额扣减。

## 15. 接口设计

### 15.1 设计原则

首期采用少接口、同步返回的方案，不引入复杂任务轮询能力。

### 15.2 注册接口

作用：

- 提交邮箱、密码、手机号和公司名
- 通过 Supabase Auth 创建认证用户
- 在业务库创建用户资料
- 建立注册态

输入：

- `email`（必填，作为登录账号）
- `password`（必填）
- `phone`（必填，用于销售跟进）
- `company_name`（必填）

输出建议：

- `user_id`
- `is_registered`
- `free_test_quota_total`
- `free_test_quota_remaining`

说明：

- 注册流程先调用 Supabase Auth 创建认证用户，再在业务库写入用户资料
- 邮箱已注册时返回明确提示，引导用户登录
- 邮箱验证异步进行，不阻塞注册和测试流程

### 15.2.1 登录接口

作用：

- 已注册用户通过邮箱 + 密码登录

输入：

- `email`
- `password`

输出建议：

- `user_id`
- `access_token`
- `free_test_quota_remaining`

### 15.3 用户状态接口

作用：

- 获取用户注册态
- 获取累计指标与剩余次数
- 为测试页顶部总体数据模块提供内容

输出建议：

- `is_registered`
- `user_id`
- `company_name`
- `free_test_quota_total`
- `free_test_quota_used`
- `free_test_quota_remaining`
- `total_query_count`
- `total_mentioned_count`
- `total_exposure_count`
- `overall_evaluation_text`

### 15.4 发起测试接口

作用：

- 接收测试表单输入
- 完成整条同步测试链路
- 返回单次结果与用户累计结果

输入：

- `company_name`
- `product_keyword`
- `industry`
- `provider`

输出建议：

单次结果：

- `test_run_id`
- `status`
- `provider`
- `input_company_name`
- `input_product_keyword`
- `input_industry`
- `is_mentioned`
- `mentioned_count_for_query`
- `exposure_count_for_query`
- `evaluation_text`
- `raw_response_text`

累计结果：

- `total_query_count`
- `total_mentioned_count`
- `total_exposure_count`
- `free_test_quota_remaining`
- `overall_evaluation_text`

### 15.5 测试详情接口

作用：

- 根据 `test_run_id` 获取单次测试结果详情
- 支持结果页刷新或回看

输出建议：

- `test_run_id`
- `status`
- `created_at`
- `provider`
- `final_prompt`
- `raw_response_text`
- `is_mentioned`
- `mentioned_count_for_query`
- `exposure_count_for_query`
- `matched_snippets`
- `evaluation_text`

### 15.6 联系销售接口

作用：

- 用户点击"联系专属AI营销团队"时调用
- 记录线索并触发邮件通知

输入：

- `user_id`

处理逻辑：

- 在 `contact_leads` 表中写入一条记录（user_id、时间戳、当前累计测试摘要）
- 向指定运营负责人邮箱发送线索通知邮件，包含：
  - 用户邮箱、手机号、公司名称
  - 累计测试结果摘要
  - 最近一次测试的平台与行业
- 防重复：同一用户 24 小时内仅发送一次邮件通知

输出建议：

- `success`
- `message`（如"我们已收到您的需求"）

## 16. 异常处理与失败策略

### 16.1 状态定义

测试记录至少支持以下状态：

- `processing`
- `completed`
- `failed`

说明：

- 若未来需要服务端草稿能力，可扩展 `draft`
- 首期若只做前端本地暂存，可不落库 `draft`

### 16.2 失败场景分类

业务前置失败：

- 用户未注册
- 免费次数已用完
- 入参不完整
- 平台不支持

执行中失败：

- 模型接口超时
- 平台调用异常
- 审查逻辑执行失败
- 数据持久化失败

### 16.3 免费次数扣减规则

首期采用如下规则：

`只有测试成功完成并返回结果时，才扣减一次免费测试次数。`

具体约束：

- `completed` 扣减免费次数
- `failed` 不扣减免费次数
- 业务前置失败不扣减免费次数

### 16.4 聚合更新规则

仅当测试状态为 `completed` 时：

- 增加总查询次数
- 增加被提及次数
- 增加曝光次数
- 扣减剩余免费次数

### 16.5 重试策略

首期不做复杂自动重试。

建议策略：

- 服务端仅可在极少数瞬时网络错误场景下做一次轻量内部重试
- 面向用户提供明确的 `重新测试` 操作入口
- 失败重试前不扣减免费次数

### 16.6 前端错误提示

前端应区分以下错误并给出对应提示：

- 未注册
- 免费次数已用完
- 平台暂时不可用
- 系统处理失败，可重新发起

## 17. 加载态与体验增强

测试执行过程中需要展示过程动画和分阶段文案，以增强期待感和结果感知。

建议文案：

- `正在生成行业测试问题...`
- `正在向所选AI平台发起查询...`
- `正在分析您的品牌曝光情况...`

说明：

- 加载态文案属于体验增强
- 不要求后台必须逐阶段流式返回执行状态

## 18. 安全与约束

### 18.1 首期约束

- 公司名匹配基于字符串规则，不做复杂实体识别
- 结果适用于风险测试，不适合作为严格诊断或审计报告
- 单次测试结果受目标模型返回波动影响

### 18.2 数据保留要求

系统应保留以下原始信息，以支持回溯和排查：

- 用户原始输入公司名
- 用户原始输入产品关键词
- 最终发出的 prompt
- 原始回答文本
- 审查结果
- 最终评价文案

## 19. MVP 验收标准

当以下条件满足时，可认为测试功能技术设计满足首期要求：

- 用户可在未注册状态下先填写测试表单
- 点击 `查看AI曝光情况` 时才触发注册校验
- 注册完成后，测试表单内容可自动恢复
- 测试页顶部可展示累计总体数据
- 结果页顶部可展示累计总体数据
- 单次测试完成后，可正确计算是否提及与曝光次数
- 用户累计总查询次数、被提及次数和曝光次数可正确更新
- 测试成功后才扣减免费次数
- 失败测试不扣减免费次数
- 前端能拿到足够字段直接渲染测试页和结果页

## 20. 后续扩展建议

后续如需增强，可在当前架构上扩展：

- 公司别名、简称、英文名识别
- 引用来源和 citation 提取
- 多平台对比测试
- 历史测试列表
- 多轮提示词采样
- 更强的整体评价算法
- 后台模板管理

## 21. 结论

首期 GEO 测试功能应采用“先填写表单、后触发注册、同步执行测试、规则主导审查、用户级聚合展示”的技术方案。

该方案能够在较低实现复杂度下支撑官网核心转化路径，同时保证指标口径清晰、结果可回溯、用户体验连贯，并为后续能力扩展保留足够空间。
