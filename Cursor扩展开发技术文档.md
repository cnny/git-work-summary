# Cursor 扩展开发技术文档

基于 `git-work-summary` 项目的完整开发指南

## 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [项目结构](#项目结构)
4. [核心技术栈](#核心技术栈)
5. [扩展生命周期](#扩展生命周期)
6. [配置管理系统](#配置管理系统)
7. [命令系统](#命令系统)
8. [WebView 集成](#webview-集成)
9. [定时任务管理](#定时任务管理)
10. [存储管理](#存储管理)
11. [外部服务集成](#外部服务集成)
12. [多项目支持](#多项目支持)
13. [错误处理与日志](#错误处理与日志)
14. [性能优化](#性能优化)
15. [打包与发布](#打包与发布)
16. [最佳实践](#最佳实践)

## 项目概述

`git-work-summary` 是一个 VS Code 扩展，通过分析 Git 提交记录，结合 AI 技术自动生成工作总结报告。项目展示了 Cursor 扩展开发的完整技术栈和最佳实践。

### 核心功能
- **自动化工作总结**: 定时分析 Git 提交生成日报/周报
- **AI 集成**: 支持多种 AI 服务（DeepSeek、OpenAI）
- **多项目管理**: 支持同时管理多个 Git 项目
- **可视化配置**: 提供 WebView 配置界面
- **历史记录**: 完整的报告历史管理
- **外部集成**: 支持将报告推送到外部系统

## 技术架构

### 整体架构图
```
┌─────────────────────────┐
│    VS Code Extension    │
│       Host Process      │
├─────────────────────────┤
│    Extension Entry      │
│     (extension.ts)      │
├─────────────────────────┤
│   Core Business Logic   │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ GitWorkSummaryMgr   │ │  ←── 主业务逻辑
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ConfigurationMgr    │ │  ←── 配置管理
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ GitAnalyzer         │ │  ←── Git 分析
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ AISummaryService    │ │  ←── AI 服务
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ReportService       │ │  ←── 报告服务
│ └─────────────────────┘ │
├─────────────────────────┤
│    External Services    │
│  ┌─────┐  ┌─────┐       │
│  │ AI  │  │HTTP │       │
│  │ API │  │ API │       │
│  └─────┘  └─────┘       │
└─────────────────────────┘
```

### 设计模式
- **单例模式**: 确保扩展管理器的唯一性
- **观察者模式**: 配置变更监听
- **策略模式**: 多 AI 服务支持
- **工厂模式**: 服务实例创建
- **装饰者模式**: 功能增强

## 项目结构

```
git-work-summary/
├── src/                          // 源代码目录
│   ├── extension.ts              // 扩展入口文件
│   ├── gitWorkSummaryManager.ts  // 主业务逻辑管理器
│   ├── configurationManager.ts   // 配置管理器
│   ├── gitAnalyzer.ts           // Git 分析器
│   ├── aiSummaryService.ts      // AI 总结服务
│   ├── reportService.ts         // 报告服务
│   ├── workSummaryStorage.ts    // 存储管理
│   ├── historyViewProvider.ts   // 历史视图提供者
│   ├── multiProjectManager.ts   // 多项目管理器
│   └── logger.ts                // 日志系统
├── package.json                 // 扩展配置和依赖
├── tsconfig.json                // TypeScript 配置
├── README.md                    // 项目说明
├── CHANGELOG.md                 // 版本更新日志
└── out/                         // 编译输出目录
    └── extension.js             // 编译后的入口文件
```

## 核心技术栈

### 开发语言和框架
```typescript
// TypeScript 配置示例
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020", "dom"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  }
}
```

### 主要依赖
```json
{
  "engines": {
    "vscode": "^1.74.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@types/vscode": "^1.74.0",
    "typescript": "^4.9.0"
  }
}
```

### 技术选型说明
- **TypeScript**: 提供类型安全和更好的开发体验
- **VS Code API**: 扩展核心 API
- **Node.js**: 文件系统和进程管理
- **WebView**: 复杂 UI 界面

## 扩展生命周期

### 激活机制
```typescript
// package.json 中的激活事件
"activationEvents": [
  "onStartupFinished",              // VS Code 启动完成时
  "onCommand:gitWorkSummary.*",     // 命令触发时
  "workspaceContains:.git"          // 工作区包含 .git 时
]
```

### 扩展入口 (extension.ts)
```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 1. 初始化日志系统
    initializeLogger();
    
    // 2. 创建服务实例
    const configManager = new ConfigurationManager();
    const gitAnalyzer = new GitAnalyzer();
    const aiService = new AISummaryService(configManager);
    const reportService = new ReportService(configManager);
    const storage = new WorkSummaryStorage(context);
    
    // 3. 创建主管理器
    const manager = new GitWorkSummaryManager(
        gitAnalyzer, aiService, reportService, 
        configManager, storage
    );
    
    // 4. 注册命令
    registerCommands(context, manager);
    
    // 5. 启动定时任务
    manager.start();
}

export function deactivate() {
    // 清理资源
    gitWorkSummaryManager?.dispose();
}
```

### 生命周期钩子
```typescript
export class GitWorkSummaryManager implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    
    constructor() {
        // 监听配置变更
        const configWatcher = vscode.workspace.onDidChangeConfiguration(
            (e) => {
                if (e.affectsConfiguration('gitWorkSummary')) {
                    this.updateConfiguration();
                }
            }
        );
        this.disposables.push(configWatcher);
    }
    
    dispose(): void {
        // 清理所有注册的监听器
        this.disposables.forEach(d => d.dispose());
        this.stop();
    }
}
```

## 配置管理系统

### 配置定义 (package.json)
```json
"configuration": {
  "title": "Git Work Summary",
  "properties": {
    "gitWorkSummary.enabled": {
      "type": "boolean",
      "default": true,
      "description": "启用定时工作总结"
    },
    "gitWorkSummary.aiProvider": {
      "type": "string",
      "enum": ["deepseek", "openai"],
      "default": "deepseek",
      "description": "AI 服务提供商"
    },
    "gitWorkSummary.aiApiKey": {
      "type": "string",
      "default": "",
      "description": "AI API Key"
    }
  }
}
```

### 配置管理器实现
```typescript
export class ConfigurationManager {
    private static readonly CONFIG_SECTION = 'gitWorkSummary';
    
    getConfiguration(): Configuration {
        const config = vscode.workspace.getConfiguration(
            ConfigurationManager.CONFIG_SECTION
        );
        
        return {
            enabled: config.get<boolean>('enabled', true),
            aiProvider: config.get<string>('aiProvider', 'deepseek'),
            aiApiKey: config.get<string>('aiApiKey', ''),
            interval: config.get<number>('interval', 60),
            // ... 其他配置项
        };
    }
    
    async updateConfiguration(key: string, value: any): Promise<void> {
        const config = vscode.workspace.getConfiguration(
            ConfigurationManager.CONFIG_SECTION
        );
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
}
```

### 配置验证
```typescript
private async validateConfiguration(config: Configuration): Promise<string[]> {
    const errors: string[] = [];
    
    // 基础验证
    if (config.interval < 1) {
        errors.push('定时间隔必须大于 0 分钟');
    }
    
    // API Key 验证
    if (!config.aiApiKey) {
        errors.push('AI API Key 不能为空');
    }
    
    // 实际连接测试
    try {
        await this.aiService.testConnection();
    } catch (error) {
        errors.push(`AI 服务连接失败: ${error.message}`);
    }
    
    return errors;
}
```

## 命令系统

### 命令注册 (package.json)
```json
"commands": [
  {
    "command": "gitWorkSummary.generateDailyReport",
    "title": "Generate Today's Daily Report",
    "category": "Git Work Summary"
  },
  {
    "command": "gitWorkSummary.configure",
    "title": "Configure Settings",
    "category": "Git Work Summary"
  }
]
```

### 命令实现
```typescript
function registerCommands(
    context: vscode.ExtensionContext, 
    manager: GitWorkSummaryManager
) {
    // 生成日报命令
    const generateDailyReport = vscode.commands.registerCommand(
        'gitWorkSummary.generateDailyReport',
        () => manager.generateTodayReport()
    );
    
    // 带参数的命令
    const generateDailyReportForDate = vscode.commands.registerCommand(
        'gitWorkSummary.generateDailyReportForDate',
        async () => {
            const dateInput = await vscode.window.showInputBox({
                prompt: '请输入日期（格式：YYYY-MM-DD）',
                validateInput: (value) => {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        return '日期格式错误';
                    }
                    return null;
                }
            });
            
            if (dateInput) {
                const date = new Date(dateInput);
                await manager.generateDailyReport(date);
            }
        }
    );
    
    context.subscriptions.push(generateDailyReport, generateDailyReportForDate);
}
```

### 命令分类组织
```typescript
// 按功能分组的命令
const COMMAND_GROUPS = {
    REPORT: {
        generateDaily: 'gitWorkSummary.generateDailyReport',
        generateWeekly: 'gitWorkSummary.generateWeeklyReport',
        viewHistory: 'gitWorkSummary.viewHistory'
    },
    CONFIG: {
        configure: 'gitWorkSummary.configure',
        testAI: 'gitWorkSummary.testAI'
    },
    DEBUG: {
        showLogs: 'gitWorkSummary.showLogs',
        debugGit: 'gitWorkSummary.debugGitStatus'
    }
};
```

## WebView 集成

### WebView 创建
```typescript
async showConfiguration(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'gitWorkSummaryConfig',
        'Git Work Summary Configuration',
        vscode.ViewColumn.One,
        {
            enableScripts: true,              // 启用 JavaScript
            retainContextWhenHidden: true,    // 保持状态
            localResourceRoots: []            // 本地资源根目录
        }
    );
    
    // 设置 HTML 内容
    panel.webview.html = this.getConfigWebviewContent();
    
    // 处理消息
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'save':
                await this.saveConfiguration(message.config);
                break;
            case 'test':
                await this.testConfiguration(message.config);
                break;
        }
    });
}
```

### WebView HTML 模板
```typescript
private getConfigWebviewContent(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Git Work Summary Configuration</title>
        <style>
            body { 
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .config-section {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 16px;
                margin: 16px 0;
            }
        </style>
    </head>
    <body>
        <div id="config-container">
            <!-- 配置表单内容 -->
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            
            function saveConfig() {
                const config = {
                    // 收集表单数据
                };
                vscode.postMessage({
                    command: 'save',
                    config: config
                });
            }
        </script>
    </body>
    </html>`;
}
```

## 定时任务管理

### 定时器实现
```typescript
export class GitWorkSummaryManager {
    private dailyTimer?: NodeJS.Timeout;
    private weeklyTimer?: NodeJS.Timeout;
    
    async start(): Promise<void> {
        const config = this.configManager.getConfiguration();
        
        if (config.enabled) {
            // 启动日报定时检查
            this.scheduleNextDailyCheck();
            
            // 启动周报定时任务
            if (config.enableWeeklyReport) {
                this.scheduleWeeklyReport();
            }
        }
    }
    
    private scheduleNextDailyCheck(): void {
        const config = this.configManager.getConfiguration();
        const interval = config.interval * 60 * 1000; // 转换为毫秒
        
        this.dailyTimer = setTimeout(async () => {
            try {
                await this.checkAndGenerateTodayReport();
            } catch (error) {
                log(`定时任务执行失败: ${error}`);
            } finally {
                // 递归调度下次执行
                this.scheduleNextDailyCheck();
            }
        }, interval);
    }
}
```

### 任务锁机制
```typescript
private async acquireTaskLock(taskKey: string): Promise<boolean> {
    const lockFilePath = path.join(os.tmpdir(), `git-work-summary-${taskKey}.lock`);
    
    try {
        // 检查锁文件是否存在
        if (fs.existsSync(lockFilePath)) {
            const lockContent = fs.readFileSync(lockFilePath, 'utf-8');
            const lockData = JSON.parse(lockContent);
            
            // 检查锁是否过期
            const lockAge = Date.now() - lockData.timestamp;
            if (lockAge < 10 * 60 * 1000) { // 10分钟
                return false; // 锁未过期
            }
        }
        
        // 创建新锁
        const lockData = {
            instanceId: this.instanceId,
            timestamp: Date.now(),
            pid: process.pid
        };
        
        fs.writeFileSync(lockFilePath, JSON.stringify(lockData));
        return true;
    } catch (error) {
        log(`获取任务锁失败: ${error}`);
        return false;
    }
}
```

## 存储管理

### 数据存储接口
```typescript
export interface WorkSummary {
    id: string;
    timestamp: number;
    type: 'daily' | 'weekly';
    date: string;
    commits: CommitInfo[];
    summary: string;
    mainTasks: MainTask[];
    reportStatus: 'pending' | 'success' | 'failed';
}

export class WorkSummaryStorage {
    constructor(private context: vscode.ExtensionContext) {}
    
    async saveSummary(summary: WorkSummary): Promise<void> {
        const summaries = await this.getAllSummaries();
        const index = summaries.findIndex(s => s.id === summary.id);
        
        if (index >= 0) {
            summaries[index] = summary;
        } else {
            summaries.push(summary);
        }
        
        // 保持最近 100 条记录
        if (summaries.length > 100) {
            summaries.splice(0, summaries.length - 100);
        }
        
        await this.context.globalState.update('workSummaries', summaries);
    }
    
    async getAllSummaries(): Promise<WorkSummary[]> {
        return this.context.globalState.get<WorkSummary[]>('workSummaries', []);
    }
}
```

## 外部服务集成

### AI 服务集成
```typescript
export class AISummaryService {
    private client: any;
    
    constructor(private configManager: ConfigurationManager) {
        this.initializeClient();
    }
    
    async generateSummary(commits: CommitInfo[]): Promise<string> {
        const config = this.configManager.getConfiguration();
        const prompt = this.buildPrompt(commits);
        
        try {
            const response = await this.client.chat.completions.create({
                model: config.aiModel || this.getDefaultModel(config.aiProvider),
                messages: [
                    { role: 'system', content: this.getSystemPrompt() },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                timeout: config.aiTimeout * 1000
            });
            
            return response.choices[0].message.content;
        } catch (error) {
            log(`AI 服务调用失败: ${error}`);
            throw error;
        }
    }
}
```

### HTTP 接口集成
```typescript
export class ReportService {
    async submitReport(summary: WorkSummary): Promise<boolean> {
        const config = this.configManager.getConfiguration();
        
        try {
            const response = await fetch(config.reportUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...config.reportHeaders
                },
                body: JSON.stringify({
                    id: summary.id,
                    timestamp: summary.timestamp,
                    type: summary.type,
                    summary: summary.summary
                }),
                timeout: 30000
            });
            
            return response.ok;
        } catch (error) {
            log(`报告上报失败: ${error}`);
            return false;
        }
    }
}
```

## 错误处理与日志

### 日志系统
```typescript
// logger.ts
import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel;

export function initializeLogger(): void {
    outputChannel = vscode.window.createOutputChannel('Git Work Summary');
}

export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    outputChannel.appendLine(logMessage);
    
    // 严重错误同时显示通知
    if (level === 'error') {
        vscode.window.showErrorMessage(message);
    }
}
```

### 错误处理装饰器
```typescript
function errorHandler(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
        try {
            return await method.apply(this, args);
        } catch (error) {
            log(`方法 ${propertyName} 执行失败: ${error}`, 'error');
            
            if (error instanceof NetworkError) {
                vscode.window.showWarningMessage('网络连接失败，请检查网络设置');
            } else {
                vscode.window.showErrorMessage(`操作失败: ${error.message}`);
            }
            
            throw error;
        }
    };
}
```

## 打包与发布

### 构建配置
```json
// package.json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "main": "./out/extension.js"
}
```

### 发布流程
```bash
# 1. 安装 VSCE 工具
npm install -g vsce

# 2. 编译项目
npm run compile

# 3. 打包扩展
vsce package

# 4. 发布到市场
vsce publish
```

## 最佳实践

### 1. 代码组织
- **单一职责**: 每个类只负责一个特定功能
- **依赖注入**: 通过构造函数注入依赖，便于测试
- **接口设计**: 定义清晰的接口，支持多种实现

### 2. 性能优化
- **懒加载**: 按需加载重型依赖
- **缓存策略**: 合理使用缓存减少重复计算
- **异步处理**: 避免阻塞主线程

### 3. 用户体验
- **渐进式加载**: 分步骤显示结果
- **错误友好**: 提供清晰的错误信息和解决建议
- **配置简化**: 提供合理的默认值

### 4. 安全性
- **敏感信息**: API Key 等敏感信息安全存储
- **输入验证**: 对所有用户输入进行验证
- **权限控制**: 最小化文件系统权限

这个技术文档基于 `git-work-summary` 项目的实际实现，展示了如何构建一个功能完整、架构清晰的 Cursor 扩展。通过模块化设计、合理的错误处理、完善的配置管理和良好的用户体验，为开发高质量扩展提供了实用的参考。

---

## 总结

本文档通过分析 `git-work-summary` 项目，全面介绍了 Cursor 扩展开发的核心技术和最佳实践。主要内容包括：

1. **完整的架构设计** - 展示了如何构建模块化、可维护的扩展架构
2. **实用的开发技巧** - 涵盖配置管理、命令系统、WebView 集成等关键技术
3. **性能优化策略** - 提供了定时任务、缓存、异步处理等优化方案
4. **错误处理机制** - 建立了完善的日志系统和错误处理流程
5. **部署发布流程** - 包含了从开发到发布的完整工作流

这些实践经验和技术方案为开发者提供了构建专业级 Cursor 扩展的完整指南。
