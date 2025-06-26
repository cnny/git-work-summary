# Change Log

<div align="center">

[🇨🇳 中文](#中文版本) | [🇺🇸 English](#english-version)

</div>

---

## 中文版本

# 更新日志

Git Work Summary 扩展的所有重要变更都记录在此文件中。

## [1.2.0] - 2025-01-25

### 🎉 新增
- 🎛️ **新增 `maxFilesPerCommit` 配置项**：控制每个提交在报告中显示的文件数量
  - 默认显示3个文件，可配置范围1-20
  - 超出限制显示"... 等共X个文件"，避免报告内容过长
  - 支持配置界面和VS Code设置调整

- 🌐 **新增 `AIOutputlanguage` 配置项**：设置AI输出语言
  - 支持任意语言输入（中文、English、Français、Español等）

- 🔄 **配置页面双语支持**：添加中英文双语界面切换
  - 右上角语言切换按钮（🌐 EN / 🌐 中文）
  - 所有标签、帮助文本、按钮支持实时语言切换
  - 支持包含HTML标签的帮助文本正确显示

### ✨ 增强
- 🎨 **配置界面全面国际化**：
  - 为所有主要配置项添加中英文双语标签
  - 优化帮助文本，提供更清晰的配置指导
  - 输入框占位符支持双语提示

- 📝 **文档结构优化**：
  - 合并提示词配置文档：从4个精简为2个
  - `PROMPT_CUSTOMIZATION.md` 整合了配置示例和多项目配置指南
  - 删除冗余文档 `EXAMPLE_PROMPTS.md` 和 `MULTI_PROJECT_PROMPT_CONFIG.md`
  - 更新README中的文档索引链接

### 🛠️ 技术改进

- **用户体验优化**：
  - 语言切换功能支持HTML内容正确渲染
  - 配置界面响应式设计改进
  - 实时语言切换无需页面刷新

### 📦 文件变更
- **新增**：完善的双语配置界面支持
- **删除**：`EXAMPLE_PROMPTS.md`、`MULTI_PROJECT_PROMPT_CONFIG.md`
- **修改**：`PROMPT_CUSTOMIZATION.md`（整合内容）、`README.md`（更新文档链接）

### 🎯 用户价值
- **更灵活的文件显示控制**：根据需要调整报告详细程度
- **多语言输出支持**：AI可生成任意语言的工作总结
- **国际化用户体验**：中英文用户都能享受本地化配置界面
- **精简的文档结构**：更易于查找和使用配置指南

## [1.1.6] - 2025-01-24

### ✨ 增强
- 🔍 **大幅增强 Show Current Prompts 功能**：从简单配置显示升级为完整的提示词内容查看器
- 📝 显示真实的 AI 系统提示词和用户提示词内容，支持调试和优化
- 🎯 使用模拟数据演示提示词的实际效果和占位符替换
- 💡 提供个性化配置建议和问题排查指导

### 🎉 新增
- 🔧 新增 `getCurrentPrompts()` 方法，生成详细的提示词配置报告
- 📊 添加配置状态检查：AI 服务、项目配置、自定义提示词状态一目了然
- 📋 支持占位符说明：详细列出所有支持的模板变量及其用途
- 🛠️ 增加实时提示词日志功能说明和使用指导

### 🚀 用户体验
- **完整的提示词查看**：
  - 实际系统提示词内容（日报/周报）
  - 用户提示词示例（含模拟数据演示）
  - 未提交变更分析提示词
  - 自定义提示词配置展示
- **智能配置建议**：
  - API Key 配置状态检查
  - 多项目配置问题提醒
  - 提示词日志开关建议
  - 自定义配置优化提示
- **开发者友好**：
  - Markdown 格式输出，支持语法高亮
  - 结构化内容，易于阅读和理解
  - 生成时间戳，便于跟踪配置变更

### 🛠️ 技术改进
- **复用现有架构**：调用现有私有方法获取真实提示词内容
- **模拟数据演示**：使用真实格式的模拟数据展示提示词效果
- **向后兼容**：增强而非替换原有功能，保持 API 稳定性

### 📝 文档
- 📚 新增 `PROMPT_INSPECTION_GUIDE.md` - 详细的提示词查看功能使用指南
- 🔧 新增 `MULTI_PROJECT_PROMPT_CONFIG.md` - 多项目自定义提示词配置指南

## [1.1.5] - 2025-01-24

### 🔧 修复
- 🐛 修复配置更新后不立即生效，需要重启VS Code的问题
- 🔄 解决AI、报告服务等组件配置更新不同步的问题

### ✨ 增强
- 🎯 优化配置界面测试功能，改为流畅的进度条体验
- 📊 增强配置测试的全面性，包含AI连接和上报服务测试
- 💬 改进配置测试反馈机制，使用日志通道替代重复弹框
- ⚡ 提升配置变更的响应速度，所有组件立即应用新配置

### 🎉 新增  
- 🧪 新增 "Test Configuration & Connections" 命令，一键检测所有配置
- 📈 添加配置变更的实时日志记录，便于调试和验证
- 🔗 增强AI和上报服务的连接测试，提供详细的连接状态反馈
- 📋 为配置管理器添加服务依赖注入，支持实时配置测试

### 🚀 用户体验
- **配置立即生效**：修改配置后无需重启，所有服务组件实时更新
- **智能测试流程**：
  - 使用进度条显示测试进度（10% → 40% → 70% → 100%）
  - 自动测试基础配置、AI连接、上报服务、多项目设置
  - 智能错误分类和结果汇总
- **友好的结果反馈**：
  - 成功时显示简洁的确认消息
  - 失败时提供详细的错误统计和日志引导
  - 警告时给出友好的提示和建议
- **无干扰体验**：
  - 测试过程不再需要多次点击确认
  - 详细信息输出到专门的日志通道
  - 用户可选择查看详细测试报告

### 🛠️ 技术改进
- **配置同步机制**：
  - `configManager.updateConfiguration()` 现在会同步更新所有依赖服务
  - `aiService.updateConfiguration()` 立即应用AI相关配置
  - `reportService.updateConfiguration()` 立即应用上报相关配置
- **测试架构优化**：
  - 使用 `vscode.window.withProgress()` 实现流畅的进度体验
  - 临时配置测试机制，不影响当前运行状态
  - 错误和警告分类收集，统一处理和展示
- **依赖注入系统**：
  - 为 `ConfigurationManager` 添加服务依赖注入
  - 支持配置测试时访问实际的服务实例
  - 确保测试结果的准确性和可靠性

### 📝 新增命令
- `gitWorkSummary.testConfigUpdate` - 测试配置更新和连接状态

## [1.1.4] - 2025-06-23

### 修复
- 🔧 修复 Report History 列表按钮点击失效BUG

## [1.1.3] - 2025-06-23

### 修复
- 🔧 修复全局锁 JSON 解析错误问题（SyntaxError: Unexpected non-whitespace character after JSON）
- 🛡️ 解决多进程并发生成日报定时任务的冲突问题
- 🔒 完善日报定时任务的全局锁保护机制
- 📁 修复锁文件损坏导致的扩展异常问题

### 增强
- ⚡ 实现原子写入机制，防止并发写入导致的文件损坏
- 🔄 添加智能重试机制，最多重试3次，递增等待时间
- 🧹 添加临时锁文件自动清理功能，防止磁盘空间浪费
- 🔍 增强错误诊断信息，提供详细的调试上下文
- ✅ 添加文件完整性校验机制，自动检测和修复损坏文件

### 新增
- 📊 为日报定时任务添加全局锁保护（之前仅周报有保护）
- 🔧 新增进程存活检测，自动清理僵死锁
- 📝 增加详细的锁状态日志，便于问题排查
- 🎯 添加锁文件校验和验证机制

### 技术改进
- **原子文件操作**：先写入临时文件，再原子性重命名，避免并发冲突
- **多层防护机制**：
  - 第1层：全局锁（跨进程/实例保护）
  - 第2层：实例内标志（单实例内保护）  
  - 第3层：智能调度（错开执行时间）
- **增强的错误处理**：
  - JSON 解析错误自动恢复
  - 文件权限异常处理
  - 锁文件损坏自动修复
  - 详细错误上下文输出
- **资源管理优化**：
  - 启动时清理过期临时文件
  - 异常时自动释放锁资源
  - 进程退出时清理全局状态

### 性能
- 🚀 减少锁冲突等待时间，提升并发处理效率
- 💾 优化临时文件管理，减少磁盘I/O开销
- ⏱️ 改进锁获取策略，降低系统资源占用

## [1.1.1] - 2025-06-23

### 修复
- 🔧 修复定时任务不生效的问题
- ⚡ 优化扩展激活事件，从 "*" 改为更精确的激活条件
- 🚀 添加 "onStartupFinished" 激活事件，确保定时任务在启动后正常工作
- 📈 提升 VS Code 启动性能，避免不必要的资源占用

### 变更
- 🎯 改进激活事件配置，仅在需要时激活扩展
- 🔄 保留所有功能完整性的同时优化性能表现

### 技术细节
- 移除了影响性能的 "*" 全局激活事件
- 添加了针对性的激活条件：
  - `onStartupFinished` - 启动完成后激活
  - `onCommand:*` - 命令执行时激活
  - `workspaceContains:.git` - Git 仓库工作区激活

## [1.0.0] - 2025-06-20

### 新增
- 🎉 初始版本发布
- 📊 智能日报生成功能
- 📈 智能周报生成功能
- 🤖 AI 驱动的工作总结分析
- 🏢 多项目支持和合并分析
- ⚙️ 高度可配置的 AI 提示词系统
- 🔄 自动化定时任务
- 📱 进度提示和用户体验优化
- 🔍 丰富的调试和诊断命令
- 📤 工作总结自动上报功能

### 功能特性
- **智能报告生成**
  - 日报：自动分析今日代码变更，生成详细工作日报
  - 周报：支持本周、上周、自定义周期的工作周报
  - 一日一报机制：避免重复生成，智能更新现有报告

- **多项目支持**
  - 同时分析多个项目的代码变更
  - 智能合并生成统一报告
  - 项目统计和对比分析
  - 全局锁机制防止重复处理

- **AI 智能分析**
  - 支持 DeepSeek 和 OpenAI
  - 功能导向和业务导向的分析重点
  - 可自定义提示词系统
  - 智能去重避免重复 AI 调用

- **自动化功能**
  - 定时监控代码变更
  - 智能检测新提交
  - 后台静默运行
  - 可配置的检查间隔

- **用户体验**
  - 生成过程进度提示
  - 详细的配置界面
  - 丰富的调试命令
  - 完善的错误处理

- **周报时间配置**
  - 支持自定义周报起始日期
  - 适配不同公司的开发周期
  - 灵活的周期选择（本周、上周、自定义）

### 支持平台
- VS Code 1.74.0+
- Cursor Editor
- 所有平台 (Windows, macOS, Linux)

### 配置选项
- AI 服务配置（DeepSeek/OpenAI）
- 多项目路径管理
- 定时任务设置
- 周报时间范围配置
- 自定义提示词
- 上报接口配置

---

**感谢使用 Git Work Summary！** 🎉

---

<div align="center">

**[⬆️ Back to Top](#change-log)**

</div>

---

## English Version

# Change Log

All notable changes to the "Git Work Summary" extension are documented in this file.

## [1.2.0] - 2025-01-25

### 🎉 Added
- 🎛️ **Added `maxFilesPerCommit` configuration item**: Control the number of files displayed per commit in reports
  - Default shows 3 files, configurable range 1-20
  - Shows "... and X more files" when limit exceeded to avoid overly long reports
  - Supports configuration interface and VS Code settings adjustment

- 🌐 **Added `AIOutputlanguage` configuration item**: Set AI output language
  - Supports any language input (Chinese, English, Bilingual, Français, Español, etc.)

- 🔄 **Configuration page bilingual support**: Added Chinese-English interface switching
  - Language toggle button in top-right corner (🌐 EN / 🌐 中文)
  - All labels, help text, and buttons support real-time language switching
  - Supports help text containing HTML tags for proper display

### ✨ Enhanced
- 🎨 **Comprehensive configuration interface internationalization**:
  - Added bilingual labels for all major configuration items
  - Optimized help text with clearer configuration guidance
  - Input field placeholders support bilingual hints

- 📝 **Documentation structure optimization**:
  - Merged prompt configuration documents: streamlined from 4 to 2
  - `PROMPT_CUSTOMIZATION.md` integrates configuration examples and multi-project configuration guide
  - Removed redundant documents `EXAMPLE_PROMPTS.md` and `MULTI_PROJECT_PROMPT_CONFIG.md`
  - Updated documentation index links in README

### 🛠️ Technical Improvements
- **Enhanced configuration validation**:
  - `maxFilesPerCommit` range validation (1-20)
  - `AIOutputlanguage` non-empty validation
  - Configuration test added related item checks

- **User experience optimization**:
  - Language switching supports proper HTML content rendering
  - Improved responsive design for configuration interface
  - Real-time language switching without page refresh

### 📦 File Changes
- **Added**: Complete bilingual configuration interface support
- **Deleted**: `EXAMPLE_PROMPTS.md`, `MULTI_PROJECT_PROMPT_CONFIG.md`
- **Modified**: `PROMPT_CUSTOMIZATION.md` (integrated content), `README.md` (updated doc links)

### 🎯 User Value
- **More flexible file display control**: Adjust report detail level as needed
- **Multi-language output support**: AI can generate work summaries in any language
- **Internationalized user experience**: Both Chinese and English users enjoy localized configuration interface
- **Streamlined documentation structure**: Easier to find and use configuration guides

## [1.1.6] - 2025-01-24

### ✨ Enhanced
- 🔍 **Significantly enhanced Show Current Prompts feature**: Upgraded from simple configuration display to a complete prompt content viewer
- 📝 Display real AI system prompts and user prompt content, supporting debugging and optimization
- 🎯 Use mock data to demonstrate actual prompt effects and placeholder replacement
- 💡 Provide personalized configuration suggestions and troubleshooting guidance

### 🎉 Added
- 🔧 Added `getCurrentPrompts()` method to generate detailed prompt configuration reports
- 📊 Added configuration status checks: AI service, project configuration, and custom prompt status at a glance
- 📋 Support placeholder explanations: detailed listing of all supported template variables and their uses
- 🛠️ Added real-time prompt logging feature descriptions and usage guidance

### 🚀 User Experience
- **Complete prompt viewing**:
  - Actual system prompt content (daily/weekly reports)
  - User prompt examples (with mock data demonstration)
  - Uncommitted changes analysis prompts
  - Custom prompt configuration display
- **Smart configuration suggestions**:
  - API Key configuration status check
  - Multi-project configuration issue reminders
  - Prompt logging switch suggestions
  - Custom configuration optimization tips
- **Developer-friendly**:
  - Markdown format output with syntax highlighting
  - Structured content, easy to read and understand
  - Generation timestamps for tracking configuration changes

### 🛠️ Technical Improvements
- **Reuse existing architecture**: Call existing private methods to get real prompt content
- **Mock data demonstration**: Use real format mock data to show prompt effects
- **Backward compatibility**: Enhance rather than replace existing functionality, maintain API stability

### 📝 Documentation
- 📚 Added `PROMPT_INSPECTION_GUIDE.md` - Detailed prompt inspection feature usage guide
- 🔧 Added `MULTI_PROJECT_PROMPT_CONFIG.md` - Multi-project custom prompt configuration guide

## [1.1.5] - 2025-01-24

### 🔧 Fixed
- 🐛 Fixed issue where configuration updates don't take effect immediately, requiring VS Code restart
- 🔄 Resolved configuration update synchronization issues for AI and report services components

### ✨ Enhanced
- 🎯 Optimized configuration interface testing feature with smooth progress bar experience
- 📊 Enhanced comprehensiveness of configuration testing, including AI connection and report service testing
- 💬 Improved configuration test feedback mechanism, using log channels instead of repeated popups
- ⚡ Improved configuration change response speed, all components immediately apply new configuration

### 🎉 Added  
- 🧪 Added "Test Configuration & Connections" command for one-click detection of all configurations
- 📈 Added real-time logging of configuration changes for debugging and verification
- 🔗 Enhanced AI and report service connection testing with detailed connection status feedback
- 📋 Added service dependency injection to configuration manager for real-time configuration testing

### 🚀 User Experience
- **Immediate configuration effect**: No restart needed after configuration changes, all service components update in real-time
- **Smart testing process**:
  - Progress bar showing test progress (10% → 40% → 70% → 100%)
  - Automatic testing of basic configuration, AI connection, report service, multi-project settings
  - Smart error classification and result summary
- **Friendly result feedback**:
  - Simple confirmation message on success
  - Detailed error statistics and log guidance on failure
  - Friendly tips and suggestions on warnings
- **Non-intrusive experience**:
  - Testing process no longer requires multiple confirmation clicks
  - Detailed information output to dedicated log channels
  - Users can choose to view detailed test reports

### 🛠️ Technical Improvements
- **Configuration synchronization mechanism**:
  - `configManager.updateConfiguration()` now synchronously updates all dependent services
  - `aiService.updateConfiguration()` immediately applies AI-related configuration
  - `reportService.updateConfiguration()` immediately applies report-related configuration
- **Test architecture optimization**:
  - Use `vscode.window.withProgress()` for smooth progress experience
  - Temporary configuration testing mechanism without affecting current running state
  - Error and warning classification collection, unified processing and display
- **Dependency injection system**:
  - Added service dependency injection to `ConfigurationManager`
  - Support accessing actual service instances during configuration testing
  - Ensure accuracy and reliability of test results

### 📝 Commands Added
- `gitWorkSummary.testConfigUpdate` - Test configuration updates and connection status

## [1.1.4] - 2025-06-23

### Fixed
- 🔧 Fixed Report History list button click failure bug

## [1.1.3] - 2025-06-23

### Fixed
- 🔧 Fixed global lock JSON parsing error (SyntaxError: Unexpected non-whitespace character after JSON)
- 🛡️ Resolved multi-process concurrent daily report scheduled task conflicts
- 🔒 Improved global lock protection mechanism for daily report scheduled tasks
- 📁 Fixed extension exceptions caused by corrupted lock files

### Enhanced
- ⚡ Implemented atomic write mechanism to prevent file corruption from concurrent writes
- 🔄 Added smart retry mechanism with up to 3 retries and incremental wait times
- 🧹 Added automatic cleanup of temporary lock files to prevent disk space waste
- 🔍 Enhanced error diagnostic information with detailed debugging context
- ✅ Added file integrity verification mechanism to automatically detect and repair corrupted files

### Added
- 📊 Added global lock protection for daily report scheduled tasks (previously only weekly reports had protection)
- 🔧 Added process liveness detection to automatically clean up zombie locks
- 📝 Added detailed lock status logging for easier troubleshooting
- 🎯 Added lock file checksum verification mechanism

### Technical Improvements
- **Atomic file operations**: Write to temporary file first, then atomic rename to avoid concurrent conflicts
- **Multi-layer protection mechanism**:
  - Layer 1: Global lock (cross-process/instance protection)
  - Layer 2: Instance-internal flag (single instance protection)  
  - Layer 3: Smart scheduling (staggered execution times)
- **Enhanced error handling**:
  - Automatic recovery from JSON parsing errors
  - File permission exception handling
  - Automatic repair of corrupted lock files
  - Detailed error context output
- **Resource management optimization**:
  - Clean up expired temporary files on startup
  - Automatically release lock resources on exceptions
  - Clean up global state on process exit

### Performance
- 🚀 Reduced lock conflict wait times, improved concurrent processing efficiency
- 💾 Optimized temporary file management, reduced disk I/O overhead
- ⏱️ Improved lock acquisition strategy, reduced system resource usage

## [1.1.1] - 2025-06-23

### Fixed
- 🔧 Fixed issue where scheduled tasks don't work
- ⚡ Optimized extension activation events, changed from "*" to more precise activation conditions
- 🚀 Added "onStartupFinished" activation event to ensure scheduled tasks work properly after startup
- 📈 Improved VS Code startup performance, avoiding unnecessary resource usage

### Changed
- 🎯 Improved activation event configuration to activate extension only when needed
- 🔄 Maintained complete functionality while optimizing performance

### Technical Details
- Removed performance-impacting "*" global activation event
- Added targeted activation conditions:
  - `onStartupFinished` - Activate after startup completion
  - `onCommand:*` - Activate on command execution
  - `workspaceContains:.git` - Activate in Git repository workspace

## [1.0.0] - 2025-06-20

### Added
- 🎉 Initial version release
- 📊 Smart daily report generation feature
- 📈 Smart weekly report generation feature
- 🤖 AI-driven work summary analysis
- 🏢 Multi-project support and merged analysis
- ⚙️ Highly configurable AI prompt system
- 🔄 Automated scheduled tasks
- 📱 Progress notifications and user experience optimization
- 🔍 Rich debugging and diagnostic commands
- 📤 Automatic work summary reporting feature

### Features
- **Smart Report Generation**
  - Daily reports: Automatically analyze today's code changes and generate detailed daily work reports
  - Weekly reports: Support for current week, last week, and custom period work reports
  - One report per day mechanism: Avoid duplicates, intelligently update existing reports

- **Multi-Project Support**
  - Simultaneously analyze code changes from multiple projects
  - Intelligently merge and generate unified reports
  - Project statistics and comparative analysis
  - Global lock mechanism to prevent duplicate processing

- **AI Smart Analysis**
  - Support for DeepSeek and OpenAI
  - Function-oriented and business-oriented analysis focus
  - Customizable prompt system
  - Smart deduplication to avoid duplicate AI calls

- **Automation Features**
  - Scheduled monitoring of code changes
  - Smart detection of new commits
  - Silent background operation
  - Configurable check intervals

- **User Experience**
  - Progress notifications during generation
  - Detailed configuration interface
  - Rich debugging commands
  - Comprehensive error handling

- **Weekly Time Configuration**
  - Support for custom weekly report start dates
  - Adapt to different company development cycles
  - Flexible period selection (current week, last week, custom)

### Supported Platforms
- VS Code 1.74.0+
- Cursor Editor
- All platforms (Windows, macOS, Linux)

### Configuration Options
- AI service configuration (DeepSeek/OpenAI)
- Multi-project path management
- Scheduled task settings
- Weekly report time range configuration
- Custom prompts
- Report API configuration

---

**Thank you for using Git Work Summary!** 🎉

---

<div align="center">

**[⬆️ Back to Top](#change-log)**

</div> 