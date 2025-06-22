# Git Work Summary

🚀 一个智能的 VS Code 扩展，自动提取 Git 变更并生成工作总结报告。

## ✨ 主要功能

### 📊 智能报告生成
- **日报生成**：自动分析今日代码变更，生成详细的工作日报
- **周报生成**：支持本周、上周、自定义周期的工作周报
- **多项目支持**：可同时分析多个项目，生成合并报告
- **AI 驱动**：使用 DeepSeek 或 OpenAI 生成高质量的工作总结

### 🔄 自动化功能
- **定时监控**：自动检测代码变更，无需手动触发
- **智能去重**：避免重复生成相同内容的报告
- **后台运行**：静默运行，不干扰正常开发工作

### 🎯 功能导向分析
- **业务价值**：重点分析完成的功能和业务价值
- **任务跟踪**：智能识别和跟踪主要开发任务
- **进度展示**：清晰展示工作进展和完成情况

## 🛠️ 安装方法

### 方法一：从 VSIX 文件安装
1. 下载 `git-work-summary-1.0.0.vsix` 文件
2. 打开 VS Code
3. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
4. 输入 `Extensions: Install from VSIX...`
5. 选择下载的 `.vsix` 文件

### 方法二：从源码安装
```bash
git clone <repository-url>
cd git-work-summary
npm install
npm run compile
code --install-extension git-work-summary-1.0.0.vsix
```

## ⚙️ 配置指南

### 1. AI 服务配置（必需）
```json
{
  "gitWorkSummary.aiProvider": "deepseek",  // 或 "openai"
  "gitWorkSummary.aiApiKey": "your-api-key-here"
}
```

### 2. 基础配置
```json
{
  "gitWorkSummary.enabled": true,           // 启用扩展
  "gitWorkSummary.interval": 60,            // 检查间隔（分钟）
  "gitWorkSummary.onlyMyCommits": true      // 只分析自己的提交
}
```

### 3. 多项目配置（可选）
```json
{
  "gitWorkSummary.enableMultiProject": true,
  "gitWorkSummary.projectPaths": [
    "/path/to/project1",
    "/path/to/project2"
  ],
  "gitWorkSummary.projectNames": {
    "/path/to/project1": "前端项目",
    "/path/to/project2": "后端API"
  }
}
```

## 🎮 使用方法

### 快速开始
1. **配置 AI API**：`Ctrl+Shift+P` → `Git Work Summary: Configure Settings`
2. **生成今日日报**：`Ctrl+Shift+P` → `Git Work Summary: Generate Today's Daily Report`
3. **查看历史报告**：`Ctrl+Shift+P` → `Git Work Summary: View Report History`

### 主要命令
- `Generate Today's Daily Report` - 生成今日日报
- `Generate Daily Report for Specific Date` - 生成指定日期日报
- `Generate Weekly Report` - 生成本周周报
- `Generate Weekly Report for Period` - 生成指定周期周报
- `Quick Setup Multi-Project` - 快速配置多项目功能

### 高级功能
- **多项目合并**：同时分析多个项目的代码变更
- **自定义周期**：灵活配置周报的时间范围
- **智能提示**：生成过程中显示进度提示
- **自动上报**：支持将报告上传到指定接口

## 📝 报告示例

### 日报示例
```
📅 2024年1月15日 工作日报

🎯 主要任务：
1. 用户认证模块开发 (已完成)
   - 实现JWT token验证
   - 添加用户权限检查
   - 完成登录/注册接口

2. 数据库优化 (进行中)
   - 优化查询性能
   - 添加索引配置

📊 代码统计：
- 提交次数：8次
- 新增代码：+234行
- 删除代码：-56行
- 涉及文件：12个
```

## 🔧 故障排除

### 常见问题
1. **AI 调用失败**
   - 检查 API Key 是否正确
   - 确认网络连接正常
   - 使用 `Test AI Configuration` 命令测试

2. **多项目功能异常**
   - 使用 `Debug Multi-Project Configuration` 检查配置
   - 确保项目路径存在且为 Git 仓库

3. **定时任务不工作**
   - 检查 `gitWorkSummary.enabled` 是否为 true
   - 查看 VS Code 开发者控制台的错误信息

### 调试命令
- `Debug Git Status` - 检查 Git 状态
- `Debug Multi-Project Configuration` - 检查多项目配置
- `Test AI Configuration` - 测试 AI 连接

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
```bash
git clone <repository-url>
cd git-work-summary
npm install
npm run compile
```

### 调试
1. 按 `F5` 启动调试模式
2. 在新窗口中测试扩展功能

## 📄 许可证

MIT License

## 🙋‍♂️ 支持

如有问题或建议，请提交 Issue 或联系开发团队。

---

**享受智能化的工作总结体验！** 🎉 