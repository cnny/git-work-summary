# Git Work Summary - 快速开始指南

本指南帮助您快速配置和使用 Git Work Summary 扩展。

## 🚀 5分钟快速配置

### 1. 获取 AI API Key

**推荐：DeepSeek（默认）**
1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册账号并申请 API Key
3. 复制 API Key 备用

**可选：OpenAI**
1. 访问 [OpenAI 官网](https://openai.com/)
2. 注册账号并申请 API Key
3. 复制 API Key 备用

### 2. 配置扩展

1. **打开配置界面**
   - 按 `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`)
   - 输入 `Git Work Summary: Configure`
   - 回车打开配置界面

2. **填写必需配置**
   ```
   ✅ AI API Key: [粘贴您的API Key]
   ✅ 上报接口URL: https://your-api.com/work-summary
   ```

3. **可选配置调整**
   ```
   📊 启用周报: 默认开启
   ⏰ 定时间隔: 60分钟（推荐）
   🔍 只分析我的提交: 开启（推荐）
   📄 包含未提交变更: 根据需要选择
   ```

4. **点击"保存配置"**

### 3. 开始使用

配置完成后，扩展会自动开始工作：
- ✅ 每小时检查今日新提交
- ✅ 自动更新今日日报
- ✅ 每周五18:00生成周报
- ✅ 自动上报到您的接口

## 📋 核心功能说明

### 📅 智能日报
- **自动更新**: 检测到新提交时自动更新今日日报
- **一日一报**: 每天只生成一条日报，避免重复
- **智能合并**: 相关提交合并为完整工作项
- **手动生成**: 可指定任意日期手动生成日报

### 📊 智能周报  
- **定时生成**: 每周五18:00自动生成（可配置）
- **手动触发**: 随时生成本周工作总结
- **项目整合**: 按功能模块整合工作内容
- **趋势分析**: 分析工作效率和成长轨迹

### 🤖 AI 智能分析
- **深度理解**: 分析开发意图，识别业务逻辑
- **工作评估**: 基于代码量评估工作时长
- **价值突出**: 突出技术亮点和关键问题
- **上下文感知**: 结合历史工作进行连续性分析

## 🎯 常用命令

| 命令 | 用途 | 快捷方式 |
|------|------|----------|
| Generate Daily Report | 生成今日日报 | `Ctrl+Shift+P` → 输入 daily |
| Generate Weekly Report | 生成本周周报 | `Ctrl+Shift+P` → 输入 weekly |
| Configure | 打开配置界面 | `Ctrl+Shift+P` → 输入 configure |
| View History | 查看历史记录 | `Ctrl+Shift+P` → 输入 history |

## ⚙️ 配置项详解

### 基础配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `enabled` | `true` | 启用定时工作总结 |
| `interval` | `60` | 定时间隔（分钟） |
| `aiApiKey` | - | AI API Key（必需） |
| `reportUrl` | - | 上报接口 URL（必需） |

### 高级配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `onlyMyCommits` | `true` | 只分析当前用户的提交 |
| `scanAllBranches` | `true` | 扫描所有本地分支 |
| `includeUncommittedChanges` | `false` | 在日报中包含未提交变更 |
| `enableWeeklyReport` | `true` | 启用每周工作报告 |
| `weeklyReportDay` | `5` | 每周报告生成日期（周五） |
| `aiTimeout` | `60` | AI 服务超时时间（秒） |

### 提示词配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `customPrompts` | `{}` | 自定义 AI 提示词配置 |
| `enablePromptLogging` | `true` | 启用提示词日志输出 |

## 🛠️ 测试和调试

### 测试 AI 连接
```
Ctrl+Shift+P → Git Work Summary: Test AI
```

### 查看提示词
```
Ctrl+Shift+P → Git Work Summary: Show AI Prompts
```

### 查看执行日志
1. 打开 VS Code 输出面板：`Ctrl+Shift+U`
2. 选择 "Git Work Summary" 频道
3. 查看详细的执行日志

## 📤 上报接口示例

您的接口将接收到以下格式的数据：

```json
{
  "id": "summary-1234567890-abc",
  "timestamp": 1234567890000,
  "type": "daily",
  "date": "2024-01-15",
  "summary": {
    "content": "今日完成了用户认证模块的开发...",
    "mainTasks": [
      {
        "title": "用户认证系统",
        "description": "实现注册、登录和权限验证",
        "subTasks": ["注册接口", "JWT验证", "权限中间件"],
        "duration": "6小时",
        "progress": "completed"
      }
    ]
  },
  "commits": {
    "total": 5,
    "details": [...]
  },
  "reportStatus": "success"
}
```

## 🔍 故障排除

### 常见问题

**Q: AI 服务调用失败**
- 检查 API Key 是否正确
- 确认网络连接正常
- 查看控制台错误信息

**Q: 上报接口失败**
- 检查接口 URL 是否正确
- 确认请求头配置
- 查看接口返回的错误信息

**Q: 没有检测到提交**
- 确保工作区是 Git 仓库
- 检查是否有新的提交
- 确认 `onlyMyCommits` 配置

### 调试方法
1. 使用 `Test AI` 命令测试 AI 连接
2. 查看输出控制台的详细日志
3. 使用 `Debug Git Status` 命令检查 Git 状态

## 🎨 自定义提示词

如需自定义 AI 分析行为，可配置提示词：

```json
{
  "dailySystemPrompt": "你是专业的日报分析师...",
  "dailyUserPromptTemplate": "请分析{date}的工作：\n{commits}"
}
```

支持的占位符：
- `{commits}`: 提交信息
- `{history}`: 历史总结  
- `{date}`: 日期
- `{startDate}`, `{endDate}`: 时间范围

## 📚 进阶使用

### 多分支开发
- 启用 `scanAllBranches` 扫描所有本地分支
- 启用 `onlyMyCommits` 只分析个人提交
- 自动去重，确保提交不重复统计

### 团队协作
- 配置统一的上报接口
- 自定义提示词以符合团队规范
- 设置合适的定时间隔避免频繁请求

### 数据备份
- 使用 `View History` 查看历史记录
- 支持导出历史数据
- 本地存储最近100条记录

---

🎉 **恭喜！** 您已完成 Git Work Summary 的配置。扩展现在会自动分析您的代码变更并生成智能工作总结。

如有问题，请查看完整的 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 或在[Github](https://github.com/cnny/git-work-summary)提交 Issue。 
