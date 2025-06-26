# Prompt Inspection Feature Guide

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

# 提示词查看功能使用指南

## 功能概述

Git Work Summary 扩展提供了强大的提示词查看功能，让您可以实时查看发送给 AI 的真实提示词内容，帮助您理解和优化 AI 分析效果。

## 🔍 查看当前提示词

### 使用方法
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Git Work Summary: Show Current Prompts`
3. 选择命令执行

### 功能特点
- 📝 **显示真实内容**：展示实际发送给 AI 的完整提示词
- 🔧 **配置状态检查**：显示当前 AI 服务和项目配置状态
- 📋 **模拟数据演示**：使用模拟数据展示提示词效果
- 💡 **配置建议**：提供针对性的配置优化建议

## 📊 查看内容详解

### 1. AI 服务配置
显示当前的 AI 服务配置状态：
- AI 提供商（DeepSeek、OpenAI 等）
- AI 模型名称
- API 地址和超时设置
- API Key 配置状态
- 提示词日志开关状态

### 2. 项目配置
显示多项目功能的配置状态：
- 多项目模式是否启用
- 配置的项目数量和列表
- 项目名称映射关系

### 3. 自定义提示词配置
以 JSON 格式显示当前的自定义提示词配置：
```json
{
  "dailySystemPrompt": "你是专业的日报分析师...",
  "weeklySystemPrompt": "你是周报分析师...",
  "dailyUserPromptTemplate": "请生成{date}的工作日报..."
}
```

### 4. 实际系统提示词
显示真实的系统提示词内容：
- **日报系统提示词**：定义 AI 在分析日报时的角色和行为
- **周报系统提示词**：定义 AI 在分析周报时的角色和行为

### 5. 实际用户提示词示例
使用模拟数据展示完整的用户提示词：
- **日报用户提示词示例**：包含模拟的提交数据和项目统计
- **周报用户提示词示例**：展示周报格式的提示词结构

### 6. 未提交变更分析提示词
显示分析未提交变更时使用的系统提示词

### 7. 占位符说明
详细说明用户提示词模板中支持的占位符：
- `{commits}`: 提交信息详情
- `{projectStats}`: 项目统计信息
- `{commitsCount}`: 总提交数量
- `{projectCount}`: 涉及项目数量
- `{date}`: 报告日期（日报）
- `{startDate}` / `{endDate}`: 日期范围（周报）

### 8. 配置建议
根据当前配置提供个性化建议：
- ⚠️ API Key 未配置提醒
- 💡 建议启用提示词日志
- ⚠️ 多项目配置问题提醒
- 💡 自定义提示词配置建议

## 🛠️ 实时提示词日志

### 启用方法
1. 在配置中启用 `"enablePromptLogging": true`
2. 打开 VS Code 输出面板：`Ctrl+Shift+U`
3. 选择 "Git Work Summary" 频道

### 日志内容
启用后，每次 AI 调用都会在控制台输出：
```
=== AI提示词日志 ===
系统提示词:
你是工作日报分析师，任务是：...

用户提示词:
请生成 2024-01-15 的工作日报：...
==================
```

## 📝 使用场景

### 1. 调试自定义提示词
- 查看自定义配置是否生效
- 对比默认提示词和自定义提示词的差异
- 验证占位符替换是否正确

### 2. 优化 AI 分析效果
- 分析当前提示词是否符合预期
- 根据实际输出调整提示词内容
- 测试不同提示词配置的效果

### 3. 团队配置共享
- 导出当前配置供团队参考
- 验证团队成员的配置一致性
- 制定团队标准化提示词

### 4. 问题排查
- 检查配置是否正确
- 验证多项目功能是否正常
- 排查 AI 分析结果异常的原因

## 🎯 最佳实践

### 1. 定期检查配置
- 在修改自定义提示词后查看实际效果
- 定期验证配置状态是否正常
- 关注配置建议并及时优化

### 2. 使用日志功能
- 在调试期间启用提示词日志
- 对比不同配置下的实际提示词
- 生产环境可关闭日志以提高性能

### 3. 团队协作
- 将查看到的配置文档化
- 团队内部分享最佳配置实践
- 建立配置变更的 review 流程

### 4. 持续优化
- 根据 AI 输出效果调整提示词
- 收集团队反馈优化配置
- 跟进新功能更新配置

## 🔧 故障排除

### Q: 查看提示词时出现错误？
A: 检查是否有语法错误的自定义提示词配置，确保 JSON 格式正确

### Q: 显示的提示词与预期不符？
A: 检查自定义提示词的优先级，确认配置是否被正确应用

### Q: 模拟数据不够真实？
A: 模拟数据仅用于演示格式，实际使用时会使用真实的 Git 数据

### Q: 如何验证配置是否生效？
A: 启用提示词日志，在实际使用中查看控制台输出的真实提示词

通过这个功能，您可以完全掌控 AI 分析的提示词内容，实现更精准的工作总结效果！

---

## English Version

# Prompt Inspection Feature Guide

## Feature Overview

The Git Work Summary extension provides a powerful prompt inspection feature that allows you to view the actual prompt content sent to AI in real-time, helping you understand and optimize AI analysis effectiveness.

## 🔍 View Current Prompts

### Usage
1. Press `Ctrl+Shift+P` to open command palette
2. Type `Git Work Summary: Show Current Prompts`
3. Select and execute the command

### Features
- 📝 **Display Real Content**: Show complete prompts actually sent to AI
- 🔧 **Configuration Status Check**: Display current AI service and project configuration status
- 📋 **Mock Data Demo**: Use mock data to demonstrate prompt effects
- 💡 **Configuration Suggestions**: Provide targeted configuration optimization suggestions

## 📊 Content Details

### 1. AI Service Configuration
Display current AI service configuration status:
- AI provider (DeepSeek, OpenAI, etc.)
- AI model name
- API address and timeout settings
- API Key configuration status
- Prompt logging switch status

### 2. Project Configuration
Display multi-project feature configuration status:
- Whether multi-project mode is enabled
- Number and list of configured projects
- Project name mapping relationships

### 3. Custom Prompt Configuration
Display current custom prompt configuration in JSON format:
```json
{
  "dailySystemPrompt": "You are a professional daily report analyst...",
  "weeklySystemPrompt": "You are a weekly report analyst...",
  "dailyUserPromptTemplate": "Please generate a daily report for {date}..."
}
```

### 4. Actual System Prompts
Display real system prompt content:
- **Daily System Prompt**: Define AI's role and behavior when analyzing daily reports
- **Weekly System Prompt**: Define AI's role and behavior when analyzing weekly reports

### 5. Actual User Prompt Examples
Use mock data to show complete user prompts:
- **Daily User Prompt Example**: Contains simulated commit data and project statistics
- **Weekly User Prompt Example**: Shows weekly report format prompt structure

### 6. Uncommitted Changes Analysis Prompt
Display system prompt used when analyzing uncommitted changes

### 7. Placeholder Descriptions
Detailed explanation of placeholders supported in user prompt templates:
- `{commits}`: Commit information details
- `{projectStats}`: Project statistics information
- `{commitsCount}`: Total number of commits
- `{projectCount}`: Number of projects involved
- `{date}`: Report date (daily report)
- `{startDate}` / `{endDate}`: Date range (weekly report)

### 8. Configuration Suggestions
Provide personalized suggestions based on current configuration:
- ⚠️ API Key not configured reminder
- 💡 Suggest enabling prompt logging
- ⚠️ Multi-project configuration issue reminder
- 💡 Custom prompt configuration suggestions

## 🛠️ Real-time Prompt Logging

### Enable Method
1. Enable `"enablePromptLogging": true` in configuration
2. Open VS Code output panel: `Ctrl+Shift+U`
3. Select "Git Work Summary" channel

### Log Content
After enabling, each AI call will output to console:
```
=== AI Prompt Log ===
System Prompt:
You are a daily work report analyst, your task is to...

User Prompt:
Please generate a daily work report for 2024-01-15:...
==================
```

## 📝 Usage Scenarios

### 1. Debug Custom Prompts
- Check if custom configuration is effective
- Compare differences between default and custom prompts
- Verify if placeholder substitution is correct

### 2. Optimize AI Analysis Effects
- Analyze if current prompts meet expectations
- Adjust prompt content based on actual output
- Test effects of different prompt configurations

### 3. Team Configuration Sharing
- Export current configuration for team reference
- Verify consistency of team member configurations
- Establish standardized team prompts

### 4. Troubleshooting
- Check if configuration is correct
- Verify if multi-project functionality is working
- Troubleshoot abnormal AI analysis results

## 🎯 Best Practices

### 1. Regular Configuration Checks
- View actual effects after modifying custom prompts
- Regularly verify if configuration status is normal
- Pay attention to configuration suggestions and optimize promptly

### 2. Use Logging Feature
- Enable prompt logging during debugging
- Compare actual prompts under different configurations
- Disable logging in production to improve performance

### 3. Team Collaboration
- Document viewed configurations
- Share best configuration practices within team
- Establish configuration change review process

### 4. Continuous Optimization
- Adjust prompts based on AI output effects
- Collect team feedback to optimize configuration
- Keep up with new features and update configuration

## 🔧 Troubleshooting

### Q: Error when viewing prompts?
A: Check for syntax errors in custom prompt configuration, ensure JSON format is correct

### Q: Displayed prompts don't match expectations?
A: Check custom prompt priority, confirm if configuration is correctly applied

### Q: Mock data not realistic enough?
A: Mock data is only for demonstrating format, actual usage will use real Git data

### Q: How to verify if configuration is effective?
A: Enable prompt logging and check real prompts output in console during actual usage

Through this feature, you can fully control the prompt content for AI analysis and achieve more precise work summary effects!

---

<div align="center">

**[⬆️ Back to Top](#prompt-inspection-feature-guide)**

</div> 