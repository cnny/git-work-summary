# Git Work Summary 扩展安装指南

## 📦 安装方法

### 方法一：通过 VSIX 文件安装（推荐）

1. **下载扩展文件**
   - 获取 `git-work-summary-1.0.0.vsix` 文件

2. **在 VS Code 中安装**
   - 打开 VS Code
   - 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) 打开命令面板
   - 输入 `Extensions: Install from VSIX...`
   - 选择下载的 `git-work-summary-1.0.0.vsix` 文件
   - 等待安装完成

3. **验证安装**
   - 重启 VS Code
   - 按 `Ctrl+Shift+P` 打开命令面板
   - 输入 `Git Work Summary` 应该能看到相关命令

### 方法二：通过命令行安装

```bash
code --install-extension git-work-summary-1.0.0.vsix
```

## ⚙️ 首次配置

安装完成后，需要进行基础配置：

### 1. 打开配置
- 按 `Ctrl+Shift+P` 打开命令面板
- 输入 `Git Work Summary: Configure Settings`
- 或者在设置中搜索 `Git Work Summary`

### 2. 必需配置项
```json
{
  "gitWorkSummary.aiProvider": "deepseek",
  "gitWorkSummary.aiApiKey": "your-api-key-here"
}
```

### 3. 获取 API Key

**DeepSeek（推荐）**：
1. 访问 [https://platform.deepseek.com/](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在 API Keys 页面创建新的 API Key
4. 复制 API Key 到配置中

**OpenAI**：
1. 访问 [https://platform.openai.com/](https://platform.openai.com/)
2. 注册账号并登录
3. 在 API Keys 页面创建新的 API Key
4. 在配置中设置：
   ```json
   {
     "gitWorkSummary.aiProvider": "openai",
     "gitWorkSummary.aiApiKey": "your-openai-api-key"
   }
   ```

## 🚀 快速开始

1. **生成第一个日报**
   - 按 `Ctrl+Shift+P`
   - 输入 `Git Work Summary: Generate Today's Daily Report`
   - 等待生成完成

2. **查看报告历史**
   - 按 `Ctrl+Shift+P`
   - 输入 `Git Work Summary: View Report History`

3. **配置多项目（可选）**
   - 按 `Ctrl+Shift+P`
   - 输入 `Git Work Summary: Quick Setup Multi-Project`

## 🔧 常见问题

### Q: 安装后找不到命令？
A: 请重启 VS Code，确保扩展完全加载。

### Q: AI 调用失败？
A: 
1. 检查 API Key 是否正确
2. 确认网络连接正常
3. 使用 `Test AI Configuration` 命令测试

### Q: 没有生成报告？
A: 
1. 确保当前项目是 Git 仓库
2. 检查是否有提交记录
3. 查看 VS Code 开发者控制台的错误信息

## 📞 技术支持

如遇到问题，请：
1. 查看 VS Code 开发者控制台（`Help` → `Toggle Developer Tools` → `Console`）
2. 使用调试命令检查状态：
   - `Git Work Summary: Debug Git Status`
   - `Git Work Summary: Test AI Configuration`
3. 提交 Issue 到项目仓库

---

**安装完成后，开始享受智能化的工作总结体验！** 🎉 