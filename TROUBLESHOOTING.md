# Git Work Summary Troubleshooting Guide

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

# Git Work Summary 故障排除指南

## 🚨 常见问题及解决方案

### 1. 命令找不到 (command 'gitWorkSummary.configure' not found)

**症状**：
- 安装扩展后，在命令面板中找不到 Git Work Summary 命令
- 执行命令时提示 "command not found"

**可能原因**：
1. 扩展没有正确激活
2. VS Code/Cursor 需要重启
3. 扩展安装不完整

**解决方案**：

#### 步骤 1：重启编辑器
```
关闭 VS Code/Cursor → 重新打开 → 重新加载窗口
```

#### 步骤 2：检查扩展状态
1. 打开扩展面板 (`Ctrl+Shift+X`)
2. 搜索 "Git Work Summary"
3. 确认扩展已启用（没有"启用"按钮）

#### 步骤 3：手动激活扩展
```
Ctrl+Shift+P → 输入 "Developer: Reload Window"
```

#### 步骤 4：检查扩展日志
1. 打开开发者工具：`Help` → `Toggle Developer Tools`
2. 切换到 `Console` 标签
3. 查找 Git Work Summary 相关的错误信息

#### 步骤 5：重新安装扩展
```bash
# 卸载当前扩展
code --uninstall-extension git-work-summary

# 重新安装
code --install-extension git-work-summary-1.0.0.vsix
```

### 2. AI 调用失败

**症状**：
- 提示 "AI 连接失败"
- 生成报告时出错

**解决方案**：

#### 检查 API Key 配置
1. `Ctrl+Shift+P` → `Preferences: Open Settings (JSON)`
2. 确认配置正确：
```json
{
  "gitWorkSummary.aiProvider": "deepseek",
  "gitWorkSummary.aiApiKey": "your-api-key-here"
}
```

#### 测试 AI 连接
1. `Ctrl+Shift+P` → `Git Work Summary: Test AI Configuration`
2. 查看测试结果

#### 检查网络连接
- 确保能正常访问 AI 服务商的 API
- 检查防火墙和代理设置

### 3. 多项目功能异常

**症状**：
- 多项目日报生成失败
- 项目路径配置无效

**解决方案**：

#### 检查多项目配置
1. `Ctrl+Shift+P` → `Git Work Summary: Debug Multi-Project Configuration`
2. 查看配置状态和项目路径

#### 验证项目路径
- 确保路径存在且为 Git 仓库
- 检查路径权限

#### 重新配置多项目
1. `Ctrl+Shift+P` → `Git Work Summary: Quick Setup Multi-Project`
2. 重新添加项目路径

### 4. 定时任务不工作

**症状**：
- 没有自动生成日报
- 定时检查不触发

**解决方案**：

#### 检查基础配置
```json
{
  "gitWorkSummary.enabled": true,
  "gitWorkSummary.interval": 60
}
```

#### 检查 Git 状态
1. `Ctrl+Shift+P` → `Git Work Summary: Debug Git Status`
2. 确认项目是 Git 仓库且有提交记录

#### 查看控制台日志
- 打开开发者控制台查看定时任务日志
- 查找错误信息

### 5. 扩展无法加载

**症状**：
- 扩展列表中显示错误
- 无法启用扩展

**解决方案**：

#### 检查 VS Code 版本
- 确保 VS Code 版本 >= 1.74.0
- 更新到最新版本

#### 检查依赖项
```bash
# 在扩展目录中
npm install
npm run compile
```

#### 清理缓存
```bash
# 清理 VS Code 扩展缓存
rm -rf ~/.vscode/extensions/git-work-summary-*
```

### 6. 生成的报告内容异常

**症状**：
- 报告内容为空
- AI 分析结果不准确

**解决方案**：

#### 检查提交记录
1. `Ctrl+Shift+P` → `Git Work Summary: Debug Git Status`
2. 确认有可分析的提交记录

#### 调整 AI 提示词
- 在设置中自定义 `customPrompts`
- 使用 `Show Current Prompts` 查看当前提示词

#### 检查日期范围
- 确认分析的日期范围内有提交
- 尝试生成其他日期的报告

## 🔧 调试工具

### 内置调试命令
- `Debug Git Status` - 检查 Git 状态
- `Debug Multi-Project Configuration` - 检查多项目配置
- `Test AI Configuration` - 测试 AI 连接
- `Show Current Prompts` - 查看当前提示词

### 日志查看
1. **VS Code 输出面板**：
   - `View` → `Output` → 选择 "Git Work Summary"

2. **开发者控制台**：
   - `Help` → `Toggle Developer Tools` → `Console`

3. **扩展日志**：
   - 查看控制台中以 `[Git Work Summary]` 开头的日志

## 📞 获取帮助

### 收集诊断信息
运行以下命令收集诊断信息：
1. `Git Work Summary: Debug Git Status`
2. `Git Work Summary: Test AI Configuration`
3. `Git Work Summary: Debug Multi-Project Configuration`

### 报告问题
如果问题仍未解决，请提供以下信息：
- VS Code/Cursor 版本
- 扩展版本
- 操作系统
- 错误信息截图
- 控制台日志
- 配置信息（隐藏敏感数据）

---

**大多数问题可以通过重启编辑器或重新安装扩展解决** 🔄

---

## English Version

# Git Work Summary Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Command Not Found (command 'gitWorkSummary.configure' not found)

**Symptoms**:
- Cannot find Git Work Summary commands in command palette after installation
- "command not found" error when executing commands

**Possible Causes**:
1. Extension not properly activated
2. VS Code/Cursor needs restart
3. Incomplete extension installation

**Solutions**:

#### Step 1: Restart Editor
```
Close VS Code/Cursor → Reopen → Reload Window
```

#### Step 2: Check Extension Status
1. Open Extensions panel (`Ctrl+Shift+X`)
2. Search for "Git Work Summary"
3. Confirm extension is enabled (no "Enable" button)

#### Step 3: Manually Activate Extension
```
Ctrl+Shift+P → Type "Developer: Reload Window"
```

#### Step 4: Check Extension Logs
1. Open Developer Tools: `Help` → `Toggle Developer Tools`
2. Switch to `Console` tab
3. Look for Git Work Summary related error messages

#### Step 5: Reinstall Extension
```bash
# Uninstall current extension
code --uninstall-extension git-work-summary

# Reinstall
code --install-extension git-work-summary-1.0.0.vsix
```

### 2. AI Call Failed

**Symptoms**:
- "AI connection failed" error
- Errors when generating reports

**Solutions**:

#### Check API Key Configuration
1. `Ctrl+Shift+P` → `Preferences: Open Settings (JSON)`
2. Confirm configuration is correct:
```json
{
  "gitWorkSummary.aiProvider": "deepseek",
  "gitWorkSummary.aiApiKey": "your-api-key-here"
}
```

#### Test AI Connection
1. `Ctrl+Shift+P` → `Git Work Summary: Test AI Configuration`
2. Check test results

#### Check Network Connection
- Ensure you can access the AI service provider's API
- Check firewall and proxy settings

### 3. Multi-Project Feature Issues

**Symptoms**:
- Multi-project daily report generation fails
- Project path configuration invalid

**Solutions**:

#### Check Multi-Project Configuration
1. `Ctrl+Shift+P` → `Git Work Summary: Debug Multi-Project Configuration`
2. Check configuration status and project paths

#### Verify Project Paths
- Ensure paths exist and are Git repositories
- Check path permissions

#### Reconfigure Multi-Project
1. `Ctrl+Shift+P` → `Git Work Summary: Quick Setup Multi-Project`
2. Re-add project paths

### 4. Scheduled Tasks Not Working

**Symptoms**:
- No automatic daily report generation
- Scheduled checks not triggering

**Solutions**:

#### Check Basic Configuration
```json
{
  "gitWorkSummary.enabled": true,
  "gitWorkSummary.interval": 60
}
```

#### Check Git Status
1. `Ctrl+Shift+P` → `Git Work Summary: Debug Git Status`
2. Confirm project is a Git repository with commit records

#### View Console Logs
- Open developer console to view scheduled task logs
- Look for error messages

### 5. Extension Failed to Load

**Symptoms**:
- Extension shows error in extension list
- Cannot enable extension

**Solutions**:

#### Check VS Code Version
- Ensure VS Code version >= 1.74.0
- Update to latest version

#### Check Dependencies
```bash
# In extension directory
npm install
npm run compile
```

#### Clear Cache
```bash
# Clear VS Code extension cache
rm -rf ~/.vscode/extensions/git-work-summary-*
```

### 6. Abnormal Report Content

**Symptoms**:
- Empty report content
- Inaccurate AI analysis results

**Solutions**:

#### Check Commit Records
1. `Ctrl+Shift+P` → `Git Work Summary: Debug Git Status`
2. Confirm there are analyzable commit records

#### Adjust AI Prompts
- Customize `customPrompts` in settings
- Use `Show Current Prompts` to view current prompts

#### Check Date Range
- Confirm there are commits within the analyzed date range
- Try generating reports for other dates

## 🔧 Debug Tools

### Built-in Debug Commands
- `Debug Git Status` - Check Git status
- `Debug Multi-Project Configuration` - Check multi-project configuration
- `Test AI Configuration` - Test AI connection
- `Show Current Prompts` - View current prompts

### Log Viewing
1. **VS Code Output Panel**:
   - `View` → `Output` → Select "Git Work Summary"

2. **Developer Console**:
   - `Help` → `Toggle Developer Tools` → `Console`

3. **Extension Logs**:
   - View logs starting with `[Git Work Summary]` in console

## 📞 Getting Help

### Collect Diagnostic Information
Run the following commands to collect diagnostic information:
1. `Git Work Summary: Debug Git Status`
2. `Git Work Summary: Test AI Configuration`
3. `Git Work Summary: Debug Multi-Project Configuration`

### Report Issues
If the problem persists, please provide the following information:
- VS Code/Cursor version
- Extension version
- Operating system
- Error message screenshots
- Console logs
- Configuration information (hide sensitive data)

---

**Most issues can be resolved by restarting the editor or reinstalling the extension** 🔄

---

<div align="center">

**[⬆️ Back to Top](#git-work-summary-troubleshooting-guide)**

</div> 