# Git Work Summary - 提示词自定义配置指南

## 概述

Git Work Summary 扩展现在支持完全自定义的 AI 提示词配置，让您可以根据自己的需求调整 AI 分析的行为和输出格式。

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

## 配置示例

### 基础配置示例
```json
{
  "gitWorkSummary.customPrompts": {
    "summarySystemPrompt": "你是一个专业的软件开发工作总结助手，专注于分析代码变更的业务价值。",
    "dailySystemPrompt": "你是专业的日报分析师，善于将技术工作转化为业务成果描述。"
  },
  "gitWorkSummary.enablePromptLogging": true
}
```

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

## 高级用法

### 多语言支持
```json
{
  "summarySystemPrompt": "You are a professional software development work summary assistant. Please output in English and focus on business value.",
  "dailyUserPromptTemplate": "Please generate a daily report for {date}:\n\nCommits: {commits}\n\nContext: {summaries}\n\nPlease provide detailed analysis."
}
```

### 特定团队风格
```json
{
  "dailySystemPrompt": "你是我们团队的技术总结专家，熟悉我们的业务领域和技术栈。请用简洁专业的语言，重点突出对用户价值的贡献。",
  "summaryUserPromptTemplate": "团队工作总结 - {timeRange}\n\n代码变更记录：\n{commits}\n\n项目背景：\n{history}\n\n请按照我们团队的汇报标准生成总结。"
}
```

## 最佳实践

1. **保持简洁**: 避免过于复杂的提示词，影响 AI 理解
2. **测试验证**: 每次修改后都要测试效果
3. **版本管理**: 将好用的提示词配置保存备份
4. **团队统一**: 团队可以共享统一的提示词配置
5. **持续优化**: 根据实际使用效果不断调整优化

通过这些配置，您可以让 Git Work Summary 完全适应您的工作流程和汇报需求！ 