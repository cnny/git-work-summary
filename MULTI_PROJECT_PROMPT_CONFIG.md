# 多项目自定义提示词配置指南

## 概述

Git Work Summary 扩展现在完全支持多项目场景下的自定义提示词配置，让您可以根据团队的具体需求调整 AI 分析的行为和输出格式。

## 支持的自定义提示词类型

### 系统提示词
- `dailySystemPrompt`: 日报系统提示词
- `weeklySystemPrompt`: 周报系统提示词  
- `multiProjectSystemPrompt`: 多项目专用系统提示词（优先级最高）

### 用户提示词模板
- `dailyUserPromptTemplate`: 日报用户提示词模板
- `weeklyUserPromptTemplate`: 周报用户提示词模板

## 占位符说明

### 多项目提示词模板支持的占位符
- `{commits}`: 所有项目的提交信息详情
- `{projectStats}`: 项目统计信息
- `{commitsCount}`: 总提交数量
- `{projectCount}`: 涉及项目数量
- `{date}`: 报告日期（日报）
- `{startDate}`: 开始日期（周报）
- `{endDate}`: 结束日期（周报）

## 配置示例

### 1. 基础多项目配置
```json
{
  "gitWorkSummary.customPrompts": {
    "dailySystemPrompt": "你是多项目协作日报分析师，擅长识别跨项目的功能协作和依赖关系。",
    "dailyUserPromptTemplate": "多项目日报 - {date}\n\n📊 项目统计:\n{projectStats}\n\n💻 提交详情:\n{commits}\n\n请分析跨项目协作情况，合并相同功能，避免重复描述。"
  },
  "gitWorkSummary.enableMultiProject": true
}
```

### 2. 详细多项目分析配置
```json
{
  "gitWorkSummary.customPrompts": {
    "multiProjectSystemPrompt": "你是企业级多项目管理专家，具备以下能力：\n1. 识别跨项目的功能依赖和协作关系\n2. 合并相同业务功能，避免重复汇报\n3. 分析项目间的技术架构影响\n4. 评估多项目协作的效率和风险",
    "dailyUserPromptTemplate": "企业多项目日报 ({date})\n\n=== 项目概览 ===\n涉及项目数: {projectCount}\n总提交数: {commitsCount}\n\n=== 项目统计 ===\n{projectStats}\n\n=== 详细变更 ===\n{commits}\n\n请按以下维度分析:\n【跨项目功能协作】\n【各项目独立进展】\n【技术依赖关系】\n【协作效率评估】",
    "weeklyUserPromptTemplate": "企业多项目周报 ({startDate} - {endDate})\n\n=== 本周概览 ===\n{projectStats}\n\n=== 开发活动 ===\n{commits}\n\n请进行深度分析:\n【项目群整体进展】\n【跨项目功能交付】\n【技术架构演进】\n【团队协作效果】\n【下周重点规划】"
  }
}
```

### 3. 敏捷多项目团队配置
```json
{
  "gitWorkSummary.customPrompts": {
    "dailySystemPrompt": "你是敏捷多项目 Scrum Master，熟悉跨项目 Sprint 协调和依赖管理。",
    "dailyUserPromptTemplate": "Multi-Project Daily Standup ({date})\n\n🎯 Sprint Status:\n{projectStats}\n\n📝 Today's Work:\n{commits}\n\n请按 Scrum 格式生成:\n- Cross-Project Dependencies\n- Individual Project Progress  \n- Blockers & Impediments\n- Tomorrow's Focus Areas",
    "weeklyUserPromptTemplate": "Multi-Project Sprint Review ({startDate} - {endDate})\n\n📈 Sprint Metrics:\n{projectStats}\n\n🔄 Development Activity:\n{commits}\n\n请分析:\n- Sprint Goal Achievement\n- Cross-Project Collaboration\n- Velocity & Capacity\n- Retrospective Items"
  }
}
```

### 4. 微服务架构团队配置
```json
{
  "gitWorkSummary.customPrompts": {
    "multiProjectSystemPrompt": "你是微服务架构专家，专注于服务间的依赖关系、API 变更影响和系统整体健康度分析。",
    "dailyUserPromptTemplate": "微服务日报 - {date}\n\n🏗️ 服务变更统计:\n{projectStats}\n\n🔧 具体变更:\n{commits}\n\n请重点分析:\n【服务接口变更】- API 兼容性影响\n【数据模型变更】- 下游服务影响\n【配置变更】- 环境一致性\n【依赖更新】- 版本兼容性\n【部署协调】- 发布顺序建议",
    "weeklyUserPromptTemplate": "微服务架构周报 ({startDate} - {endDate})\n\n⚙️ 服务生态概览:\n{projectStats}\n\n📊 变更详情:\n{commits}\n\n请提供架构视角分析:\n【服务边界优化】\n【接口标准化进展】\n【技术债务识别】\n【性能优化成果】\n【监控告警完善】\n【下周架构重点】"
  }
}
```

## 高级功能

### 1. 项目优先级配置
通过在提示词中指定项目重要性，让 AI 重点关注核心项目：

```json
{
  "dailyUserPromptTemplate": "核心项目日报 - {date}\n\n重要性排序: 核心业务系统 > 用户端应用 > 管理后台 > 工具脚本\n\n{commits}\n\n请按项目重要性排序汇报，重点突出核心业务系统的进展。"
}
```

### 2. 技术栈特化配置
针对特定技术栈优化分析：

```json
{
  "multiProjectSystemPrompt": "你是全栈开发专家，熟悉前端React、后端Node.js、数据库MongoDB的技术栈。请从技术架构一致性角度分析多项目协作。",
  "dailyUserPromptTemplate": "全栈项目日报\n\n前端项目: {前端提交}\n后端项目: {后端提交}\n\n请分析前后端协作情况和API对接进展。"
}
```

### 3. 业务领域特化配置
针对特定业务领域优化：

```json
{
  "weeklySystemPrompt": "你是电商平台技术专家，理解用户端、商家端、运营端的业务逻辑和技术架构。",
  "weeklyUserPromptTemplate": "电商平台周报\n\n用户端: {用户端变更}\n商家端: {商家端变更}\n运营端: {运营端变更}\n\n请从业务闭环角度分析功能完整性。"
}
```

## 最佳实践

### 1. 渐进式配置
1. 先启用多项目功能
2. 使用默认提示词观察效果
3. 逐步添加自定义系统提示词
4. 最后完善用户提示词模板

### 2. 团队协作
- 将配置文件加入版本控制
- 团队成员共享统一配置
- 定期review和优化提示词效果

### 3. 效果监控
- 启用 `enablePromptLogging` 查看实际提示词
- 对比不同配置的输出效果
- 根据团队反馈持续优化

### 4. 性能优化
- 复杂提示词可能需要更长处理时间
- 建议设置 `aiTimeout` 为 120 秒以上
- 推理模型建议使用更长超时时间

## 故障排除

### Q: 自定义提示词不生效？
A: 检查 JSON 格式、字段名称、配置优先级

### Q: 多项目功能如何验证？
A: 使用 `Git Work Summary: Debug Multi-Project` 命令检查配置

### Q: 如何查看实际运行的提示词？
A: 启用 `enablePromptLogging`，在输出控制台查看

通过这些配置，您可以让 Git Work Summary 完美适应多项目协作场景！ 