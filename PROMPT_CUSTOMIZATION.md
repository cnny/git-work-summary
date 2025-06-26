# Git Work Summary - Prompt Customization Guide

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

# Git Work Summary - 提示词自定义配置指南

## 概述

Git Work Summary 扩展现在支持完全自定义的 AI 提示词配置，让您可以根据自己的需求调整 AI 分析的行为和输出格式。本指南包含了各种场景下的配置示例和最佳实践。

## 功能特性

### 1. 提示词日志输出
- 在控制台实时显示发送给 AI 的完整提示词
- 方便调试和优化提示词效果
- 可通过配置开关控制

### 2. 自定义提示词类型
- **系统提示词**: 定义 AI 的角色和行为准则
- **用户提示词模板**: 包含具体数据的提示词模板，支持占位符替换

### 3. 支持的提示词配置
- `dailySystemPrompt`: 日报系统提示词
- `weeklySystemPrompt`: 周报系统提示词  
- `summarySystemPrompt`: 工作总结系统提示词
- `multiProjectSystemPrompt`: 多项目专用系统提示词（优先级最高）
- `dailyUserPromptTemplate`: 日报用户提示词模板
- `weeklyUserPromptTemplate`: 周报用户提示词模板
- `summaryUserPromptTemplate`: 工作总结用户提示词模板

## 配置方法

### 方法1: 通过配置界面
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Git Work Summary: Configure Settings`
3. 在配置页面找到"自定义提示词配置"部分
4. 输入 JSON 格式的自定义提示词
5. 勾选"启用提示词日志输出"来查看实际运行的提示词

### 方法2: 直接编辑 VS Code 设置
1. 按 `Ctrl+,` 打开设置
2. 搜索 `gitWorkSummary.customPrompts`
3. 点击"在 settings.json 中编辑"
4. 添加自定义提示词配置

## 占位符说明

### 工作总结用户提示词模板
- `{commits}`: 提交信息详情
- `{history}`: 历史总结记录
- `{timeRange}`: 时间范围信息
- `{commitsCount}`: 提交数量
- `{historyCount}`: 历史记录数量

### 日报用户提示词模板
- `{date}`: 报告日期
- `{commits}`: 当日提交信息
- `{summaries}`: 历史总结记录
- `{commitsCount}`: 提交数量
- `{summariesCount}`: 历史记录数量

### 周报用户提示词模板
- `{startDate}`: 开始日期
- `{endDate}`: 结束日期
- `{commits}`: 本周提交信息
- `{summaries}`: 历史总结记录
- `{commitsCount}`: 提交数量
- `{summariesCount}`: 历史记录数量

### 多项目提示词模板
- `{projectStats}`: 项目统计信息
- `{projectCount}`: 涉及项目数量

## 基础配置示例

### 1. 简洁风格配置
适合喜欢简洁明了汇报风格的用户：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是简洁高效的工作总结助手。请用最简洁的语言总结工作成果，突出关键完成项。",
    "dailySystemPrompt": "你是日报助手，请简洁明了地总结今日工作，重点突出完成的功能和解决的问题。",
    "dailyUserPromptTemplate": "今日工作总结 - {date}\n\n代码提交：\n{commits}\n\n请生成简洁的日报，重点说明完成了什么。"
  },
  "gitWorkSummary.enablePromptLogging": true
}
```

### 2. 详细分析配置
适合需要详细技术分析的团队：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是资深技术专家，具备深度代码分析能力。请详细分析代码变更的技术细节、业务价值和潜在影响。",
    "weeklySystemPrompt": "你是技术团队负责人，需要从技术架构、代码质量、业务价值等多维度分析本周工作成果。",
    "weeklyUserPromptTemplate": "本周工作深度分析 ({startDate} - {endDate})\n\n=== 代码变更详情 ===\n{commits}\n\n=== 历史工作记录 ===\n{summaries}\n\n请从以下维度进行分析：\n1. 技术实现亮点\n2. 业务价值贡献\n3. 代码质量评估\n4. 架构影响分析\n5. 下周工作建议"
  },
  "gitWorkSummary.enablePromptLogging": true
}
```

### 3. 敏捷开发团队配置
适合使用 Scrum/敏捷开发的团队：

```json
{
  "gitWorkSummary.customPrompts": {
    "dailySystemPrompt": "你是敏捷开发团队的 Scrum Master，熟悉敏捷开发流程。请按照 Sprint 目标来组织日报内容。",
    "dailyUserPromptTemplate": "Daily Standup Report - {date}\n\n今日提交记录：\n{commits}\n\n昨日工作回顾：\n{summaries}\n\n请按以下格式生成日报：\n- What I did today (今日完成)\n- What I will do tomorrow (明日计划)\n- Blockers/Issues (遇到的问题)\n- Sprint Progress (Sprint 进展)",
    "weeklySystemPrompt": "你是敏捷团队的产品负责人，需要从 Sprint 目标达成度、用户价值交付、团队效率等角度分析工作成果。"
  }
}
```

### 4. 英文汇报配置
适合国际化团队或英文汇报需求：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "You are a professional software development work summary assistant. Please generate concise and professional work summaries in English, focusing on business value and technical achievements.",
    "dailySystemPrompt": "You are a daily standup facilitator. Please generate clear and actionable daily reports in English that highlight accomplishments and next steps.",
    "dailyUserPromptTemplate": "Daily Work Report - {date}\n\n📊 Today's Commits ({commitsCount} total):\n{commits}\n\n📋 Recent Work Context:\n{summaries}\n\nPlease generate a professional daily report including:\n- Key Accomplishments\n- Technical Highlights\n- Business Impact\n- Tomorrow's Focus Areas"
  }
}
```

## 多项目配置指南

### 基础多项目配置
```json
{
  "gitWorkSummary.customPrompts": {
    "dailySystemPrompt": "你是多项目协作日报分析师，擅长识别跨项目的功能协作和依赖关系。",
    "dailyUserPromptTemplate": "多项目日报 - {date}\n\n📊 项目统计:\n{projectStats}\n\n💻 提交详情:\n{commits}\n\n请分析跨项目协作情况，合并相同功能，避免重复描述。"
  },
  "gitWorkSummary.enableMultiProject": true
}
```

### 企业级多项目配置
```json
{
  "gitWorkSummary.customPrompts": {
    "multiProjectSystemPrompt": "你是企业级多项目管理专家，具备以下能力：\n1. 识别跨项目的功能依赖和协作关系\n2. 合并相同业务功能，避免重复汇报\n3. 分析项目间的技术架构影响\n4. 评估多项目协作的效率和风险",
    "dailyUserPromptTemplate": "企业多项目日报 ({date})\n\n=== 项目概览 ===\n涉及项目数: {projectCount}\n总提交数: {commitsCount}\n\n=== 项目统计 ===\n{projectStats}\n\n=== 详细变更 ===\n{commits}\n\n请按以下维度分析:\n【跨项目功能协作】\n【各项目独立进展】\n【技术依赖关系】\n【协作效率评估】"
  }
}
```

### 微服务架构团队配置
```json
{
  "gitWorkSummary.customPrompts": {
    "multiProjectSystemPrompt": "你是微服务架构专家，专注于服务间的依赖关系、API 变更影响和系统整体健康度分析。",
    "dailyUserPromptTemplate": "微服务日报 - {date}\n\n🏗️ 服务变更统计:\n{projectStats}\n\n🔧 具体变更:\n{commits}\n\n请重点分析:\n【服务接口变更】- API 兼容性影响\n【数据模型变更】- 下游服务影响\n【配置变更】- 环境一致性\n【依赖更新】- 版本兼容性\n【部署协调】- 发布顺序建议"
  }
}
```

## 特殊场景配置

### Bug 修复专项配置
```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是专业的软件质量工程师，擅长分析 Bug 修复工作。请重点关注问题根因、修复方案和预防措施。",
    "summaryUserPromptTemplate": "Bug 修复工作总结\n\n🔧 修复记录：\n{commits}\n\n📊 工作统计：提交次数 {commitsCount}，时间跨度 {timeRange}\n\n请按以下维度分析：\n\n【问题识别与分析】\n【修复方案实施】\n【质量保证措施】\n【预防改进建议】"
  }
}
```

### 性能优化专项配置
```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是性能优化专家，具备深度的系统性能分析能力。请从性能指标、优化策略、效果评估等角度分析工作成果。",
    "summaryUserPromptTemplate": "性能优化工作报告\n\n⚡ 优化工作记录：\n{commits}\n\n📈 历史优化成果：\n{history}\n\n请生成专业的性能优化报告包含性能问题识别、优化策略实施、性能提升效果和后续优化计划。"
  }
}
```

## 完整配置示例

### 完整配置示例
```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是一个专业的软件开发工作总结助手。请严格按照JSON格式输出，重点关注业务价值和技术实现。",
    "dailySystemPrompt": "你是专业的日报分析师，具备深度分析Git提交记录的能力，能够识别工作模式和业务逻辑。",
    "weeklySystemPrompt": "你是专业的周工作报告分析师，从整周角度分析工作成果和项目进展。",
    "summaryUserPromptTemplate": "请分析以下工作记录：\n\n## 提交信息\n{commits}\n\n## 历史上下文\n{history}\n\n## 时间范围\n{timeRange}\n\n请生成专业的工作总结。",
    "dailyUserPromptTemplate": "请生成{date}的工作日报：\n\n## 今日提交\n{commits}\n\n## 历史上下文\n{summaries}\n\n请智能分析并生成日报。",
    "weeklyUserPromptTemplate": "请生成本周({startDate}至{endDate})工作报告：\n\n## 本周提交\n{commits}\n\n## 工作记录\n{summaries}\n\n请进行深度分析。"
  },
  "gitWorkSummary.enablePromptLogging": true,
  "gitWorkSummary.aiTimeout": 120
}
```

## 使用技巧

### 1. 查看当前配置
- 使用命令 `Git Work Summary: Show Current Prompts` 查看当前的提示词配置
- 查看可用的占位符和配置示例

### 2. 调试提示词
- 启用 `enablePromptLogging` 选项
- 在 VS Code 输出控制台中查看 "Git Work Summary" 频道
- 观察实际发送给 AI 的提示词内容

### 3. 渐进式配置
- 先从修改系统提示词开始
- 逐步添加用户提示词模板
- 测试效果后再进行调整

### 4. 性能优化
- 推理模型（如 deepseek-reasoner）建议设置更长的超时时间
- 复杂的提示词可能需要更多处理时间
- 可以通过 `aiTimeout` 配置调整超时时间

## 常见问题

### Q: 如何恢复默认提示词？
A: 在配置中删除对应的自定义提示词字段，或者设置为空对象 `{}`。

### Q: 提示词不生效怎么办？
A: 
1. 检查 JSON 格式是否正确
2. 确认字段名称拼写是否正确
3. 查看控制台是否有错误信息
4. 使用 `Show Current Prompts` 命令确认配置

### Q: 如何查看实际运行的提示词？
A: 启用 `enablePromptLogging` 选项，然后在 VS Code 输出控制台的 "Git Work Summary" 频道中查看。

### Q: 占位符没有被替换怎么办？
A: 
1. 确认占位符名称正确（区分大小写）
2. 检查是否在正确的提示词类型中使用
3. 查看控制台输出确认数据是否正确传递

## 最佳实践

1. **保持简洁**: 避免过于复杂的提示词，影响 AI 理解
2. **测试验证**: 每次修改后都要测试效果
3. **版本管理**: 将好用的提示词配置保存备份
4. **团队统一**: 团队可以共享统一的提示词配置
5. **持续优化**: 根据实际使用效果不断调整优化

通过这些配置，您可以让 Git Work Summary 完全适应您的工作流程和汇报需求！

---

## English Version

# Git Work Summary - Prompt Customization Guide

## Overview

The Git Work Summary extension now supports fully customizable AI prompt configurations, allowing you to adjust AI analysis behavior and output formats according to your specific needs. This guide includes configuration examples and best practices for various scenarios.

## Features

### 1. Prompt Logging Output
- Real-time display of complete prompts sent to AI in console
- Convenient for debugging and optimizing prompt effectiveness
- Controllable via configuration switch

### 2. Custom Prompt Types
- **System Prompts**: Define AI's role and behavioral guidelines
- **User Prompt Templates**: Prompt templates containing specific data, supporting placeholder substitution

### 3. Supported Prompt Configurations
- `dailySystemPrompt`: Daily report system prompt
- `weeklySystemPrompt`: Weekly report system prompt  
- `summarySystemPrompt`: Work summary system prompt
- `multiProjectSystemPrompt`: Multi-project specific system prompt (highest priority)
- `dailyUserPromptTemplate`: Daily report user prompt template
- `weeklyUserPromptTemplate`: Weekly report user prompt template
- `summaryUserPromptTemplate`: Work summary user prompt template

## Configuration Methods

### Method 1: Through Configuration Interface
1. Press `Ctrl+Shift+P` to open command palette
2. Type `Git Work Summary: Configure Settings`
3. Find the "Custom Prompt Configuration" section on the configuration page
4. Enter custom prompts in JSON format
5. Check "Enable Prompt Logging Output" to view actual running prompts

### Method 2: Direct VS Code Settings Edit
1. Press `Ctrl+,` to open settings
2. Search for `gitWorkSummary.customPrompts`
3. Click "Edit in settings.json"
4. Add custom prompt configuration

## Placeholder Descriptions

### Work Summary User Prompt Template
- `{commits}`: Commit information details
- `{history}`: Historical summary records
- `{timeRange}`: Time range information
- `{commitsCount}`: Number of commits
- `{historyCount}`: Number of historical records

### Daily Report User Prompt Template
- `{date}`: Report date
- `{commits}`: Daily commit information
- `{summaries}`: Historical summary records
- `{commitsCount}`: Number of commits
- `{summariesCount}`: Number of historical records

### Weekly Report User Prompt Template
- `{startDate}`: Start date
- `{endDate}`: End date
- `{commits}`: Weekly commit information
- `{summaries}`: Historical summary records
- `{commitsCount}`: Number of commits
- `{summariesCount}`: Number of historical records

### Multi-Project Prompt Template
- `{projectStats}`: Project statistics information
- `{projectCount}`: Number of projects involved

## Basic Configuration Examples

### 1. Concise Style Configuration
Suitable for users who prefer concise reporting style:

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "You are a concise and efficient work summary assistant. Please summarize work achievements in the most concise language, highlighting key completed items.",
    "dailySystemPrompt": "You are a daily report assistant. Please summarize today's work concisely and clearly, focusing on completed features and resolved issues.",
    "dailyUserPromptTemplate": "Daily Work Summary - {date}\n\nCode Commits:\n{commits}\n\nPlease generate a concise daily report, focusing on what was accomplished."
  },
  "gitWorkSummary.enablePromptLogging": true
}
```

### 2. Detailed Analysis Configuration
Suitable for teams requiring detailed technical analysis:

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "You are a senior technical expert with deep code analysis capabilities. Please analyze the technical details, business value, and potential impact of code changes in detail.",
    "weeklySystemPrompt": "You are a technical team leader who needs to analyze this week's work achievements from multiple dimensions including technical architecture, code quality, and business value.",
    "weeklyUserPromptTemplate": "Weekly Work Deep Analysis ({startDate} - {endDate})\n\n=== Code Change Details ===\n{commits}\n\n=== Historical Work Records ===\n{summaries}\n\nPlease analyze from the following dimensions:\n1. Technical Implementation Highlights\n2. Business Value Contribution\n3. Code Quality Assessment\n4. Architecture Impact Analysis\n5. Next Week's Work Suggestions"
  },
  "gitWorkSummary.enablePromptLogging": true
}
```

### 3. Agile Development Team Configuration
Suitable for teams using Scrum/Agile development:

```json
{
  "gitWorkSummary.customPrompts": {
    "dailySystemPrompt": "You are a Scrum Master of an agile development team, familiar with agile development processes. Please organize daily report content according to Sprint goals.",
    "dailyUserPromptTemplate": "Daily Standup Report - {date}\n\nToday's Commit Records:\n{commits}\n\nYesterday's Work Review:\n{summaries}\n\nPlease generate daily report in the following format:\n- What I did today\n- What I will do tomorrow\n- Blockers/Issues\n- Sprint Progress",
    "weeklySystemPrompt": "You are a product owner of an agile team who needs to analyze work achievements from the perspectives of Sprint goal achievement, user value delivery, and team efficiency."
  }
}
```

## Multi-Project Configuration Guide

### Basic Multi-Project Configuration
```json
{
  "gitWorkSummary.customPrompts": {
    "dailySystemPrompt": "You are a multi-project collaboration daily report analyst, skilled at identifying cross-project functional collaboration and dependency relationships.",
    "dailyUserPromptTemplate": "Multi-Project Daily Report - {date}\n\n📊 Project Statistics:\n{projectStats}\n\n💻 Commit Details:\n{commits}\n\nPlease analyze cross-project collaboration, merge similar functions, and avoid duplicate descriptions."
  },
  "gitWorkSummary.enableMultiProject": true
}
```

### Enterprise Multi-Project Configuration
```json
{
  "gitWorkSummary.customPrompts": {
    "multiProjectSystemPrompt": "You are an enterprise-level multi-project management expert with the following capabilities:\n1. Identify cross-project functional dependencies and collaboration relationships\n2. Merge similar business functions to avoid duplicate reporting\n3. Analyze technical architecture impacts between projects\n4. Evaluate efficiency and risks of multi-project collaboration",
    "dailyUserPromptTemplate": "Enterprise Multi-Project Daily Report ({date})\n\n=== Project Overview ===\nProjects Involved: {projectCount}\nTotal Commits: {commitsCount}\n\n=== Project Statistics ===\n{projectStats}\n\n=== Detailed Changes ===\n{commits}\n\nPlease analyze from the following dimensions:\n【Cross-Project Functional Collaboration】\n【Individual Project Progress】\n【Technical Dependency Relationships】\n【Collaboration Efficiency Assessment】"
  }
}
```

## Complete Configuration Example

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "You are a professional software development work summary assistant. Please output strictly in JSON format, focusing on business value and technical implementation.",
    "dailySystemPrompt": "You are a professional daily report analyst with deep Git commit record analysis capabilities, able to identify work patterns and business logic.",
    "weeklySystemPrompt": "You are a professional weekly work report analyst, analyzing work achievements and project progress from a whole-week perspective.",
    "summaryUserPromptTemplate": "Please analyze the following work records:\n\n## Commit Information\n{commits}\n\n## Historical Context\n{history}\n\n## Time Range\n{timeRange}\n\nPlease generate a professional work summary.",
    "dailyUserPromptTemplate": "Please generate a daily work report for {date}:\n\n## Today's Commits\n{commits}\n\n## Historical Context\n{summaries}\n\nPlease intelligently analyze and generate daily report.",
    "weeklyUserPromptTemplate": "Please generate this week's ({startDate} to {endDate}) work report:\n\n## This Week's Commits\n{commits}\n\n## Work Records\n{summaries}\n\nPlease conduct in-depth analysis."
  },
  "gitWorkSummary.enablePromptLogging": true,
  "gitWorkSummary.aiTimeout": 120
}
```

## Usage Tips

### 1. View Current Configuration
- Use command `Git Work Summary: Show Current Prompts` to view current prompt configuration
- View available placeholders and configuration examples

### 2. Debug Prompts
- Enable `enablePromptLogging` option
- View "Git Work Summary" channel in VS Code output console
- Observe actual prompt content sent to AI

### 3. Gradual Configuration
- Start with modifying system prompts
- Gradually add user prompt templates
- Test effectiveness before making adjustments

### 4. Performance Optimization
- Reasoning models (like deepseek-reasoner) are recommended to set longer timeout periods
- Complex prompts may require more processing time
- You can adjust timeout through `aiTimeout` configuration

## Best Practices

1. **Keep Simple**: Avoid overly complex prompts that affect AI understanding
2. **Test and Verify**: Test effectiveness after each modification
3. **Version Management**: Save useful prompt configurations as backups
4. **Team Consistency**: Teams can share unified prompt configurations
5. **Continuous Optimization**: Continuously adjust and optimize based on actual usage effectiveness

Through these configurations, you can make Git Work Summary fully adapt to your workflow and reporting needs!

---

<div align="center">

**[⬆️ Back to Top](#git-work-summary---prompt-customization-guide)**

</div> 