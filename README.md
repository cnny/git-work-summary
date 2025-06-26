# Git Work Summary - Quick Start Guide

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

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
2. 使用 `Show Logs` 命令查看详细日志
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

## 📋 查看运行日志

如果需要查看扩展的详细运行日志，可以通过以下方式：

### 方法1：使用命令
1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
2. 输入 `Git Work Summary: Show Logs`
3. 选择该命令，会直接打开日志输出面板

### 方法2：手动打开
1. 打开VS Code输出面板：`Ctrl+Shift+U` (或 `Cmd+Shift+U`)
2. 在下拉选择框中选择 "Git Work Summary" 通道
3. 查看详细的执行日志

### 日志内容包括：
- ✅ 扩展启动和配置信息
- ⏰ 定时任务执行情况
- 🔍 Git仓库分析过程
- 🤖 AI分析结果和耗时
- ❌ 错误和警告信息
- 📊 项目统计和提交数据

## 📖 完整文档目录

以下是完整的文档列表，帮助您深入了解和使用 Git Work Summary：

### 📘 基础文档
- **[📦 安装指南](https://github.com/cnny/git-work-summary/blob/master/INSTALLATION.md)** - 详细的安装步骤和方法
- **[🔧 故障排除](https://github.com/cnny/git-work-summary/blob/master/TROUBLESHOOTING.md)** - 常见问题解决方案

### 🎯 提示词配置
- **[⚙️ 提示词自定义配置](https://github.com/cnny/git-work-summary/blob/master/PROMPT_CUSTOMIZATION.md)** - 完整的提示词配置指南，包含各种场景示例和多项目配置
- **[🔍 提示词查看功能](https://github.com/cnny/git-work-summary/blob/master/PROMPT_INSPECTION_GUIDE.md)** - 查看和调试提示词

### 📊 周报配置
- **[📅 周报指定周期功能](https://github.com/cnny/git-work-summary/blob/master/WEEKLY_PERIOD_SELECTION_EXAMPLE.md)** - 生成指定周期的周报
- **[⏰ 周报时间范围配置](https://github.com/cnny/git-work-summary/blob/master/WEEKLY_RANGE_CONFIG_EXAMPLE.md)** - 自定义周报时间范围

### 📋 版本信息
- **[📄 更新日志](https://github.com/cnny/git-work-summary/blob/master/CHANGELOG.md)** - 版本更新历史和新功能

---

🎉 **恭喜！** 您已完成 Git Work Summary 的配置。扩展现在会自动分析您的代码变更并生成智能工作总结。

如有问题，请查看完整的 [故障排除指南](https://github.com/cnny/git-work-summary/blob/master/TROUBLESHOOTING.md) 或在 [GitHub](https://github.com/cnny/git-work-summary) 提交 Issue。

---

<div align="center">

**[⬆️ Back to Top](#git-work-summary---quick-start-guide)**

</div>

## English Version

# Git Work Summary - Quick Start Guide

This guide helps you quickly configure and use the Git Work Summary extension.

## 🚀 5-Minute Quick Setup

### 1. Get AI API Key

**Recommended: DeepSeek (Default)**
1. Visit [DeepSeek Official Website](https://www.deepseek.com/)
2. Register an account and apply for API Key
3. Copy the API Key for later use

**Optional: OpenAI**
1. Visit [OpenAI Official Website](https://openai.com/)
2. Register an account and apply for API Key
3. Copy the API Key for later use

### 2. Configure Extension

1. **Open Configuration Interface**
   - Press `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`)
   - Type `Git Work Summary: Configure`
   - Press Enter to open configuration interface

2. **Fill Required Configuration**
   ```
   ✅ AI API Key: [Paste your API Key]
   ✅ Report URL: https://your-api.com/work-summary
   ```

3. **Optional Configuration Adjustments**
   ```
   📊 Enable Weekly Report: Enabled by default
   ⏰ Timer Interval: 60 minutes (Recommended)
   🔍 Only My Commits: Enabled (Recommended)
   📄 Include Uncommitted Changes: Choose as needed
   ```

4. **Click "Save Configuration"**

### 3. Start Using

After configuration, the extension will automatically start working:
- ✅ Check for new commits every hour
- ✅ Automatically update daily reports
- ✅ Generate weekly reports every Friday at 6:00 PM
- ✅ Automatically report to your API

## 📋 Core Features

### 📅 Smart Daily Reports
- **Auto Update**: Automatically update daily reports when new commits are detected
- **One Report Per Day**: Generate only one report per day to avoid duplicates
- **Smart Merge**: Merge related commits into complete work items
- **Manual Generation**: Manually generate reports for any specified date

### 📊 Smart Weekly Reports  
- **Scheduled Generation**: Automatically generate every Friday at 6:00 PM (configurable)
- **Manual Trigger**: Generate weekly summary anytime
- **Project Integration**: Organize work content by functional modules
- **Trend Analysis**: Analyze work efficiency and growth trajectory

### 🤖 AI Smart Analysis
- **Deep Understanding**: Analyze development intentions and identify business logic
- **Work Assessment**: Evaluate work duration based on code volume
- **Value Highlighting**: Highlight technical highlights and key issues
- **Context Awareness**: Continuous analysis combined with historical work

## 🎯 Common Commands

| Command | Purpose | Shortcut |
|---------|---------|----------|
| Generate Daily Report | Generate today's daily report | `Ctrl+Shift+P` → Type daily |
| Generate Weekly Report | Generate this week's report | `Ctrl+Shift+P` → Type weekly |
| Configure | Open configuration interface | `Ctrl+Shift+P` → Type configure |
| View History | View historical records | `Ctrl+Shift+P` → Type history |

## ⚙️ Configuration Details

### Basic Configuration
| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `true` | Enable scheduled work summary |
| `interval` | `60` | Timer interval (minutes) |
| `aiApiKey` | - | AI API Key (required) |
| `reportUrl` | - | Report API URL (required) |

### Advanced Configuration
| Setting | Default | Description |
|---------|---------|-------------|
| `onlyMyCommits` | `true` | Only analyze current user's commits |
| `scanAllBranches` | `true` | Scan all local branches |
| `includeUncommittedChanges` | `false` | Include uncommitted changes in daily report |
| `enableWeeklyReport` | `true` | Enable weekly work reports |
| `weeklyReportDay` | `5` | Weekly report generation day (Friday) |
| `aiTimeout` | `60` | AI service timeout (seconds) |

### Prompt Configuration
| Setting | Default | Description |
|---------|---------|-------------|
| `customPrompts` | `{}` | Custom AI prompt configuration |
| `enablePromptLogging` | `true` | Enable prompt logging output |

## 🛠️ Testing and Debugging

### Test AI Connection
```
Ctrl+Shift+P → Git Work Summary: Test AI
```

### View Prompts
```
Ctrl+Shift+P → Git Work Summary: Show AI Prompts
```

### View Execution Logs
1. Open VS Code output panel: `Ctrl+Shift+U`
2. Select "Git Work Summary" channel
3. View detailed execution logs

## 📤 API Report Example

Your API will receive data in the following format:

```json
{
  "id": "summary-1234567890-abc",
  "timestamp": 1234567890000,
  "type": "daily",
  "date": "2024-01-15",
  "summary": {
    "content": "Completed user authentication module development today...",
    "mainTasks": [
      {
        "title": "User Authentication System",
        "description": "Implement registration, login and permission verification",
        "subTasks": ["Registration API", "JWT Verification", "Permission Middleware"],
        "duration": "6 hours",
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

## 🔍 Troubleshooting

### Common Issues

**Q: AI Service Call Failed**
- Check if API Key is correct
- Confirm network connection is normal
- Check console error messages

**Q: Report API Failed**
- Check if API URL is correct
- Confirm request header configuration
- Check error messages returned by the API

**Q: No Commits Detected**
- Ensure workspace is a Git repository
- Check if there are new commits
- Confirm `onlyMyCommits` configuration

### Debugging Methods
1. Use `Test AI` command to test AI connection
2. Use `Show Logs` command to view detailed logs
3. Use `Debug Git Status` command to check Git status

## 🎨 Custom Prompts

To customize AI analysis behavior, configure prompts:

```json
{
  "dailySystemPrompt": "You are a professional daily report analyst...",
  "dailyUserPromptTemplate": "Please analyze work for {date}:\n{commits}"
}
```

Supported placeholders:
- `{commits}`: Commit information
- `{history}`: Historical summary  
- `{date}`: Date
- `{startDate}`, `{endDate}`: Time range

## 📚 Advanced Usage

### Multi-branch Development
- Enable `scanAllBranches` to scan all local branches
- Enable `onlyMyCommits` to analyze only personal commits
- Automatic deduplication ensures commits are not double-counted

### Team Collaboration
- Configure unified reporting API
- Customize prompts to match team standards
- Set appropriate timer intervals to avoid frequent requests

### Data Backup
- Use `View History` to view historical records
- Support exporting historical data
- Local storage of recent 100 records

## 📋 View Runtime Logs

If you need to view detailed runtime logs of the extension, you can do so through the following methods:

### Method 1: Use Command
1. Open command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type `Git Work Summary: Show Logs`
3. Select the command, it will directly open the log output panel

### Method 2: Manual Opening
1. Open VS Code output panel: `Ctrl+Shift+U` (or `Cmd+Shift+U`)
2. Select "Git Work Summary" channel in the dropdown
3. View detailed execution logs

### Log Content Includes:
- ✅ Extension startup and configuration information
- ⏰ Scheduled task execution status
- 🔍 Git repository analysis process
- 🤖 AI analysis results and timing
- ❌ Error and warning messages
- 📊 Project statistics and commit data

## 📖 Complete Documentation Index

Here is the complete documentation list to help you deeply understand and use Git Work Summary:

### 📘 Basic Documentation
- **[📦 Installation Guide](https://github.com/cnny/git-work-summary/blob/master/INSTALLATION.md)** - Detailed installation steps and methods
- **[🔧 Troubleshooting](https://github.com/cnny/git-work-summary/blob/master/TROUBLESHOOTING.md)** - Common problem solutions

### 🎯 Prompt Configuration
- **[⚙️ Prompt Customization Guide](https://github.com/cnny/git-work-summary/blob/master/PROMPT_CUSTOMIZATION.md)** - Complete prompt configuration guide including various scenario examples and multi-project configurations
- **[🔍 Prompt Inspection Feature](https://github.com/cnny/git-work-summary/blob/master/PROMPT_INSPECTION_GUIDE.md)** - View and debug prompts

### 📊 Weekly Report Configuration
- **[📅 Weekly Period Selection Feature](https://github.com/cnny/git-work-summary/blob/master/WEEKLY_PERIOD_SELECTION_EXAMPLE.md)** - Generate reports for specified periods
- **[⏰ Weekly Time Range Configuration](https://github.com/cnny/git-work-summary/blob/master/WEEKLY_RANGE_CONFIG_EXAMPLE.md)** - Customize weekly report time ranges

### 📋 Version Information
- **[📄 Changelog](https://github.com/cnny/git-work-summary/blob/master/CHANGELOG.md)** - Version update history and new features

---

🎉 **Congratulations!** You have completed the Git Work Summary configuration. The extension will now automatically analyze your code changes and generate intelligent work summaries.

If you have any questions, please check the complete [Troubleshooting Guide](https://github.com/cnny/git-work-summary/blob/master/TROUBLESHOOTING.md) or submit an Issue on [GitHub](https://github.com/cnny/git-work-summary).

---

<div align="center">

**[⬆️ Back to Top](#git-work-summary---quick-start-guide)**

</div>
