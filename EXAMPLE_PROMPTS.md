# Git Work Summary - 提示词配置示例

本文档提供了各种场景下的提示词配置示例，帮助您快速上手和优化 AI 分析效果。

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

## 团队场景配置

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

### 4. 开源项目配置
适合开源项目的贡献总结：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是开源项目维护者，需要生成对社区友好的贡献总结。重点突出对项目的价值和影响。",
    "summaryUserPromptTemplate": "Open Source Contribution Summary\n\n📝 Commits Overview:\n{commits}\n\n🔄 Recent Activity:\n{history}\n\n⏰ Time Range: {timeRange}\n\nPlease generate a community-friendly summary including:\n- 🎯 Key Features/Improvements\n- 🐛 Bug Fixes\n- 📚 Documentation Updates\n- 🚀 Performance Enhancements\n- 💡 Future Roadmap Items",
    "weeklySystemPrompt": "你是开源项目的核心贡献者，需要生成项目周报，展示项目进展和社区贡献。"
  }
}
```

## 语言和风格配置

### 5. 英文汇报配置
适合国际化团队或英文汇报需求：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "You are a professional software development work summary assistant. Please generate concise and professional work summaries in English, focusing on business value and technical achievements.",
    "dailySystemPrompt": "You are a daily standup facilitator. Please generate clear and actionable daily reports in English that highlight accomplishments and next steps.",
    "dailyUserPromptTemplate": "Daily Work Report - {date}\n\n📊 Today's Commits ({commitsCount} total):\n{commits}\n\n📋 Recent Work Context:\n{summaries}\n\nPlease generate a professional daily report including:\n- Key Accomplishments\n- Technical Highlights\n- Business Impact\n- Tomorrow's Focus Areas",
    "weeklyUserPromptTemplate": "Weekly Progress Report ({startDate} to {endDate})\n\n💻 Development Activity:\n{commits}\n\n📈 Work History:\n{summaries}\n\nPlease provide a comprehensive weekly analysis covering:\n- Major Milestones Achieved\n- Technical Innovations\n- Business Value Delivered\n- Team Collaboration Highlights\n- Next Week's Priorities"
  }
}
```

### 6. 正式商务风格配置
适合需要正式商务汇报的企业环境：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "您是企业级项目管理专家，具备丰富的项目汇报经验。请使用正式的商务语言，从项目管理角度生成专业的工作总结。",
    "weeklySystemPrompt": "您是高级项目经理，需要向管理层汇报项目进展。请从项目目标达成、资源利用、风险控制等角度进行分析。",
    "weeklyUserPromptTemplate": "项目周报 ({startDate} 至 {endDate})\n\n一、项目开发活动概览\n{commits}\n\n二、本周工作回顾\n{summaries}\n\n请按以下结构生成正式的项目周报：\n\n【项目进展概述】\n- 本周主要里程碑\n- 关键功能交付情况\n\n【技术实施成果】\n- 核心技术突破\n- 系统架构优化\n\n【业务价值实现】\n- 用户需求满足度\n- 商业目标推进\n\n【风险与挑战】\n- 技术风险识别\n- 解决方案制定\n\n【下周工作计划】\n- 重点任务安排\n- 资源需求评估"
  }
}
```

## 特殊场景配置

### 7. Bug 修复专项配置
专门针对 Bug 修复工作的配置：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是专业的软件质量工程师，擅长分析 Bug 修复工作。请重点关注问题根因、修复方案和预防措施。",
    "summaryUserPromptTemplate": "Bug 修复工作总结\n\n🔧 修复记录：\n{commits}\n\n📊 工作统计：提交次数 {commitsCount}，时间跨度 {timeRange}\n\n请按以下维度分析：\n\n【问题识别与分析】\n- 发现的主要问题类型\n- 问题影响范围评估\n\n【修复方案实施】\n- 采用的技术方案\n- 代码变更范围\n\n【质量保证措施】\n- 测试验证情况\n- 回归测试覆盖\n\n【预防改进建议】\n- 根因分析结果\n- 流程优化建议"
  }
}
```

### 8. 性能优化专项配置
专门针对性能优化工作的配置：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是性能优化专家，具备深度的系统性能分析能力。请从性能指标、优化策略、效果评估等角度分析工作成果。",
    "summaryUserPromptTemplate": "性能优化工作报告\n\n⚡ 优化工作记录：\n{commits}\n\n📈 历史优化成果：\n{history}\n\n请生成专业的性能优化报告：\n\n【性能问题识别】\n- 发现的性能瓶颈\n- 问题影响评估\n\n【优化策略实施】\n- 采用的优化技术\n- 代码层面改进\n- 架构层面调整\n\n【性能提升效果】\n- 关键指标改善\n- 用户体验提升\n\n【后续优化计划】\n- 待优化项识别\n- 优化优先级排序"
  }
}
```

## 调试和测试配置

### 9. 调试友好配置
用于调试提示词效果的配置：

```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是调试助手。请在分析过程中详细说明你的思路和判断依据，帮助用户理解 AI 的分析逻辑。",
    "summaryUserPromptTemplate": "【调试模式】工作总结分析\n\n原始数据：\n- 提交数量：{commitsCount}\n- 历史记录：{historyCount}\n- 时间范围：{timeRange}\n\n提交详情：\n{commits}\n\n历史上下文：\n{history}\n\n请详细说明分析过程：\n1. 数据解读思路\n2. 关键信息提取\n3. 逻辑推理过程\n4. 总结生成依据\n\n最终总结："
  },
  "gitWorkSummary.enablePromptLogging": true
}
```

## 使用建议

### 配置优化技巧

1. **渐进式配置**：先从系统提示词开始，再逐步添加用户模板
2. **A/B 测试**：对比不同配置的效果，选择最适合的版本
3. **团队统一**：团队内部可以共享和统一提示词配置
4. **版本管理**：将好用的配置保存为文件，便于备份和分享

### 调试方法

1. **启用日志**：设置 `"enablePromptLogging": true`
2. **查看输出**：在 VS Code 输出控制台查看实际提示词
3. **逐步调试**：先测试系统提示词，再测试用户模板
4. **占位符验证**：确认占位符是否正确替换

### 性能优化

1. **控制长度**：避免过长的提示词影响处理速度
2. **调整超时**：复杂提示词可能需要更长的处理时间
3. **模型选择**：不同模型对提示词的理解能力不同

通过这些示例配置，您可以快速找到适合自己团队和工作流程的提示词设置！ 