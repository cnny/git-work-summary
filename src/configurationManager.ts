import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger';

export interface CustomPrompts {
    dailySystemPrompt?: string;
    weeklySystemPrompt?: string;
    summarySystemPrompt?: string;
    dailyUserPromptTemplate?: string;
    weeklyUserPromptTemplate?: string;
    summaryUserPromptTemplate?: string;
}

export interface Configuration {
    enabled: boolean;
    interval: number;
    reportUrl: string;
    reportHeaders: Record<string, string>;
    includeUncommittedChanges: boolean;
    aiProvider: 'openai' | 'deepseek' | 'qwen' | 'custom';
    aiApiKey: string;
    aiBaseUrl: string;
    aiModel: string;
    aiTimeout: number;
    customPrompts: Record<string, any>;
    enablePromptLogging: boolean;
    maxCommits: number;
    onlyMyCommits: boolean;
    scanAllBranches: boolean;
    enableWeeklyReport: boolean;
    dailyReportTime: string;
    weeklyReportDay: number;
    weekStartDay: number;
    enableMultiProject: boolean;
    projectPaths: string[];
    projectNames: Record<string, string>;
    maxFilesPerCommit: number;
    AIOutputlanguage: string;
}

export class ConfigurationManager {
    private static readonly CONFIG_SECTION = 'gitWorkSummary';
    private aiService?: any;
    private reportService?: any;

    getConfiguration(): Configuration {
        const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
        
        return {
            enabled: config.get<boolean>('enabled', true),
            interval: config.get<number>('interval', 60),
            reportUrl: config.get<string>('reportUrl', ''),
            reportHeaders: config.get<Record<string, string>>('reportHeaders', {}),
            includeUncommittedChanges: config.get<boolean>('includeUncommittedChanges', false),
            aiProvider: config.get<'openai' | 'deepseek' | 'qwen' | 'custom'>('aiProvider', 'deepseek'),
            aiApiKey: config.get<string>('aiApiKey', ''),
            aiBaseUrl: config.get<string>('aiBaseUrl', ''),
            aiModel: config.get<string>('aiModel', ''),
            aiTimeout: config.get<number>('aiTimeout', 60),
            customPrompts: config.get<Record<string, any>>('customPrompts', {}),
            enablePromptLogging: config.get<boolean>('enablePromptLogging', true),
            maxCommits: config.get<number>('maxCommits', 50),
            onlyMyCommits: config.get<boolean>('onlyMyCommits', true),
            scanAllBranches: config.get<boolean>('scanAllBranches', true),
            enableWeeklyReport: config.get<boolean>('enableWeeklyReport', true),
            dailyReportTime: config.get<string>('dailyReportTime', '18:00'),
            weeklyReportDay: config.get<number>('weeklyReportDay', 5),
            weekStartDay: config.get<number>('weekStartDay', 1),
            enableMultiProject: config.get<boolean>('enableMultiProject', false),
            projectPaths: config.get<string[]>('projectPaths', []),
            projectNames: config.get<Record<string, string>>('projectNames', {}),
            maxFilesPerCommit: config.get<number>('maxFilesPerCommit', 3),
            AIOutputlanguage: config.get<string>('AIOutputlanguage', '中文')
        };
    }

    async updateConfiguration(key: keyof Configuration, value: any): Promise<void> {
        const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    // 设置依赖服务（用于测试配置）
    setServices(aiService: any, reportService: any): void {
        this.aiService = aiService;
        this.reportService = reportService;
    }

    async showConfiguration(): Promise<void> {
        const currentConfig = this.getConfiguration();
        
        // 显示配置面板
        const panel = vscode.window.createWebviewPanel(
            'gitWorkSummaryConfig',
            'Git Work Summary Configuration',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getConfigWebviewContent(currentConfig);

        // 处理来自 webview 的消息
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'save':
                        await this.saveConfiguration(message.config);
                        vscode.window.showInformationMessage('Configuration saved successfully | 配置已保存');
                        panel.dispose();
                        break;
                    case 'test':
                        await this.testConfiguration(message.config);
                        break;
                }
            }
        );
    }

    private async saveConfiguration(config: Configuration): Promise<void> {
        const vsConfig = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
        
        await Promise.all([
            vsConfig.update('enabled', config.enabled, vscode.ConfigurationTarget.Global),
            vsConfig.update('interval', config.interval, vscode.ConfigurationTarget.Global),
            vsConfig.update('reportUrl', config.reportUrl, vscode.ConfigurationTarget.Global),
            vsConfig.update('reportHeaders', config.reportHeaders, vscode.ConfigurationTarget.Global),
            vsConfig.update('includeUncommittedChanges', config.includeUncommittedChanges, vscode.ConfigurationTarget.Global),
            vsConfig.update('aiProvider', config.aiProvider, vscode.ConfigurationTarget.Global),
            vsConfig.update('aiApiKey', config.aiApiKey, vscode.ConfigurationTarget.Global),
            vsConfig.update('aiBaseUrl', config.aiBaseUrl, vscode.ConfigurationTarget.Global),
            vsConfig.update('aiModel', config.aiModel, vscode.ConfigurationTarget.Global),
            vsConfig.update('aiTimeout', config.aiTimeout, vscode.ConfigurationTarget.Global),
            vsConfig.update('customPrompts', config.customPrompts, vscode.ConfigurationTarget.Global),
            vsConfig.update('enablePromptLogging', config.enablePromptLogging, vscode.ConfigurationTarget.Global),
            vsConfig.update('maxCommits', config.maxCommits, vscode.ConfigurationTarget.Global),
            vsConfig.update('maxFilesPerCommit', config.maxFilesPerCommit, vscode.ConfigurationTarget.Global),
            vsConfig.update('AIOutputlanguage', config.AIOutputlanguage, vscode.ConfigurationTarget.Global),
            vsConfig.update('onlyMyCommits', config.onlyMyCommits, vscode.ConfigurationTarget.Global),
            vsConfig.update('scanAllBranches', config.scanAllBranches, vscode.ConfigurationTarget.Global),
            vsConfig.update('enableWeeklyReport', config.enableWeeklyReport, vscode.ConfigurationTarget.Global),
            vsConfig.update('dailyReportTime', config.dailyReportTime, vscode.ConfigurationTarget.Global),
            vsConfig.update('weeklyReportDay', config.weeklyReportDay, vscode.ConfigurationTarget.Global),
            vsConfig.update('weekStartDay', config.weekStartDay, vscode.ConfigurationTarget.Global),
            vsConfig.update('enableMultiProject', config.enableMultiProject, vscode.ConfigurationTarget.Global),
            vsConfig.update('projectPaths', config.projectPaths, vscode.ConfigurationTarget.Global),
            vsConfig.update('projectNames', config.projectNames, vscode.ConfigurationTarget.Global)
        ]);
    }

    private async testConfiguration(config: Configuration): Promise<void> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Configuration Test | 配置测试",
            cancellable: false
        }, async (progress, token) => {
            let hasErrors = false;
            const errorMessages: string[] = [];
            const warnings: string[] = [];

            log('\n🧪 Starting configuration test... | 开始配置测试...');

            // 1. 基础配置验证
            progress.report({ increment: 10, message: "Validating basic configuration... | 验证基础配置..." });
            log('📋 Validating basic configuration... | 正在验证基础配置...');
            
            if (config.interval < 1) {
                const error = '❌ Timer interval must be greater than 0 minutes | 定时间隔必须大于 0 分钟';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log(`✅ Timer interval: ${config.interval} minutes | 定时间隔: ${config.interval} 分钟`);
            }

            if (config.maxCommits < 1) {
                const error = '❌ Maximum commits must be greater than 0 | 最大提交数量必须大于 0';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log(`✅ Maximum commits: ${config.maxCommits} | 最大提交数量: ${config.maxCommits}`);
            }

            if (config.maxFilesPerCommit < 1 || config.maxFilesPerCommit > 20) {
                const error = '❌ Maximum files per commit must be between 1-20 | 每个提交显示的最大文件数量必须在 1-20 之间';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log(`✅ Maximum files per commit: ${config.maxFilesPerCommit} | 每个提交最大文件数: ${config.maxFilesPerCommit}`);
            }

            if (config.aiTimeout < 10 || config.aiTimeout > 300) {
                const error = '❌ AI timeout must be between 10-300 seconds | AI 超时时间必须在 10-300 秒之间';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log(`✅ AI timeout: ${config.aiTimeout} seconds | AI 超时时间: ${config.aiTimeout} 秒`);
            }

            if (!config.AIOutputlanguage || config.AIOutputlanguage.trim() === '') {
                const error = '❌ AI output language cannot be empty | AI 输出语言不能为空';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log(`✅ AI output language: ${config.AIOutputlanguage} | AI 输出语言: ${config.AIOutputlanguage}`);
            }

            // 2. AI配置测试
            progress.report({ increment: 30, message: "Testing AI configuration... | 测试AI配置..." });
            log('\n🤖 Testing AI configuration... | 🤖 正在测试AI配置...');
            
            if (!config.aiApiKey.trim()) {
                const error = '❌ AI API Key not configured | AI API Key 未配置';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log('✅ AI API Key configured | AI API Key 已配置');
                
                // 如果AI服务可用，测试连接
                if (this.aiService) {
                    try {
                        // 临时更新AI服务配置用于测试
                        const originalProvider = this.aiService.provider;
                        const originalApiKey = this.aiService.apiKey;
                        const originalBaseUrl = this.aiService.baseUrl;
                        const originalModel = this.aiService.model;
                        
                        this.aiService.provider = config.aiProvider;
                        this.aiService.apiKey = config.aiApiKey;
                        this.aiService.baseUrl = config.aiBaseUrl || this.getDefaultBaseUrl(config.aiProvider);
                        this.aiService.model = config.aiModel || this.getDefaultModel(config.aiProvider);
                        
                        progress.report({ message: "Testing AI connection... | 测试AI连接..." });
                        log('🔄 Testing AI connection... | 🔄 正在测试AI连接...');
                        const aiTestResult = await this.aiService.testConnection();
                        
                        if (aiTestResult) {
                            log('✅ DeepSeek API access test passed | DeepSeek API 访问测试通过');
                        } else {
                            const error = '❌ DeepSeek API access test failed | DeepSeek API 访问测试失败';
                            log(error);
                            errorMessages.push(error);
                            hasErrors = true;
                        }
                        
                        // 恢复原始配置
                        this.aiService.provider = originalProvider;
                        this.aiService.apiKey = originalApiKey;
                        this.aiService.baseUrl = originalBaseUrl;
                        this.aiService.model = originalModel;
                        
                    } catch (error) {
                        const errorMsg = `❌ DeepSeek API access test failed | DeepSeek API 访问测试失败: ${error instanceof Error ? error.message : String(error)}`;
                        log(errorMsg);
                        errorMessages.push(errorMsg);
                        hasErrors = true;
                    }
                } else {
                    const warning = '⚠️ AI service not initialized, skipping connection test | AI服务未初始化，跳过连接测试';
                    log(warning);
                    warnings.push(warning);
                }
            }

            // 3. 上报服务测试
            progress.report({ increment: 30, message: "Testing report service... | 测试上报服务..." });
            log('\n📡 Testing report service... | 📡 正在测试上报服务...');
            
            if (!config.reportUrl.trim()) {
                log('⏭️ Report API URL not configured, skipping report test | 上报接口 URL 未配置，跳过上报测试');
            } else if (!config.reportUrl.startsWith('http')) {
                const error = '❌ Report API URL must start with http or https | 上报接口 URL 必须以 http 或 https 开头';
                log(error);
                errorMessages.push(error);
                hasErrors = true;
            } else {
                log('✅ Report API URL format correct | 上报接口 URL 格式正确');
                
                // 如果报告服务可用，测试连接
                if (this.reportService) {
                    try {
                        // 临时更新报告服务配置用于测试
                        const originalReportUrl = this.reportService.reportUrl;
                        const originalHeaders = this.reportService.headers;
                        
                        this.reportService.reportUrl = config.reportUrl;
                        this.reportService.headers = {
                            'Content-Type': 'application/json',
                            ...config.reportHeaders
                        };
                        
                        progress.report({ message: "Testing report service connection... | 测试上报服务连接..." });
                        log('🔄 Testing report service connection... | 🔄 正在测试上报服务连接...');
                        const reportTestResult = await this.reportService.testConnection();
                        
                        if (reportTestResult.success) {
                            log(`✅ Report service connection successful: ${reportTestResult.message} | 上报服务连接成功: ${reportTestResult.message}`);
                        } else {
                            const error = `❌ Report service connection failed: ${reportTestResult.message} | 上报服务连接失败: ${reportTestResult.message}`;
                            log(error);
                            errorMessages.push(error);
                            hasErrors = true;
                        }
                        
                        // 恢复原始配置
                        this.reportService.reportUrl = originalReportUrl;
                        this.reportService.headers = originalHeaders;
                        
                    } catch (reportError) {
                        const error = `❌ Report service test failed: ${reportError} | 上报服务测试异常: ${reportError}`;
                        log(error);
                        errorMessages.push(error);
                        hasErrors = true;
                    }
                } else {
                    const warning = '⚠️ Report service not initialized, skipping connection test | 上报服务未初始化，跳过连接测试';
                    log(warning);
                    warnings.push(warning);
                }
            }

            // 4. 多项目配置验证
            if (config.enableMultiProject) {
                progress.report({ increment: 20, message: "Validating multi-project configuration... | 验证多项目配置..." });
                log('\n🏢 Validating multi-project configuration... | 🏢 正在验证多项目配置...');
                
                if (config.projectPaths.length === 0) {
                    const error = '❌ Multi-project feature enabled but project paths not configured | 多项目功能已启用但未配置项目路径';
                    log(error);
                    errorMessages.push(error);
                    hasErrors = true;
                } else {
                    log(`✅ Configured ${config.projectPaths.length} project paths | 配置了 ${config.projectPaths.length} 个项目路径`);
                    
                    // 验证项目路径
                    let validProjects = 0;
                    
                    for (const projectPath of config.projectPaths) {
                        if (fs.existsSync(projectPath)) {
                            const gitPath = path.join(projectPath, '.git');
                            if (fs.existsSync(gitPath)) {
                                validProjects++;
                            } else {
                                const warning = `⚠️ Not a Git repository: ${projectPath} | 不是Git仓库: ${projectPath}`;
                                log(warning);
                                warnings.push(warning);
                            }
                        } else {
                            const error = `❌ Path does not exist: ${projectPath} | 路径不存在: ${projectPath}`;
                            log(error);
                            errorMessages.push(error);
                            hasErrors = true;
                        }
                    }
                    
                    log(`✅ ${validProjects}/${config.projectPaths.length} project paths valid | ${validProjects}/${config.projectPaths.length} 个项目路径有效`);
                }
            }

            progress.report({ increment: 10, message: "Test completed | 测试完成" });

            // 显示测试结果汇总
            log('\n📊 Test results summary:');
            log(`├─ 基础配置: ${hasErrors ? '❌ 存在问题' : '✅ 正常'} | ├─ Basic configuration: ${hasErrors ? '❌ Issues' : '✅ Normal'}`);
            log(`├─ AI配置: ${config.aiApiKey ? '✅ 已配置' : '❌ 未配置'} | ├─ AI configuration: ${config.aiApiKey ? '✅ Configured' : '❌ Not configured'}`);
            log(`├─ 上报配置: ${config.reportUrl ? '✅ 已配置' : '⏭️ 未配置'} | ├─ Report configuration: ${config.reportUrl ? '✅ Configured' : '⏭️ Not configured'}`);
            log(`└─ 多项目: ${config.enableMultiProject ? '✅ 已启用' : '⏭️ 未启用'} | └─ Multi-project: ${config.enableMultiProject ? '✅ Enabled' : '⏭️ Disabled'}`);

            // 显示最终结果
            if (hasErrors) {
                log('❌ Configuration test found issues, please check errors and fix configuration | 配置测试发现问题，请检查错误并修复配置');
            } else {
                log('🎉 All configuration tests passed! | 所有配置测试通过！');
            }

            // 生成错误报告
            if (errorMessages.length > 0) {
                progress.report({ increment: 100, message: "Test completed with errors | 测试完成，发现错误" });
                
                let message = `Configuration test found ${errorMessages.length} issues | 配置测试发现 ${errorMessages.length} 个问题`;
                if (warnings.length > 0) {
                    message += ` and ${warnings.length} warnings | 和 ${warnings.length} 个警告`;
                }
                message += ':\n\n' + [...errorMessages, ...warnings].join('\n');
                
                vscode.window.showErrorMessage(message, { modal: true });
            } else {
                progress.report({ increment: 100, message: "All tests passed! | 所有测试通过！" });
                
                let message = '🎉 All configuration tests passed! | 所有配置测试通过！';
                if (warnings.length > 0) {
                    message += `\n\nWarnings (${warnings.length}) | 警告 (${warnings.length}):\n` + warnings.join('\n');
                }
                
                vscode.window.showInformationMessage(message);
            }
        });
    }

    private getDefaultBaseUrl(provider: string): string {
        switch (provider) {
            case 'deepseek':
                return 'https://api.deepseek.com/v1';
            case 'openai':
                return 'https://api.openai.com/v1';
            default:
                return 'https://api.deepseek.com/v1';
        }
    }

    private getDefaultModel(provider: string): string {
        switch (provider) {
            case 'deepseek':
                return 'deepseek-chat';
            case 'openai':
                return 'gpt-4';
            default:
                return 'deepseek-chat';
        }
    }

    private getConfigWebviewContent(config: Configuration): string {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Work Summary Configuration</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, textarea, select {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        button {
            padding: 8px 16px;
            margin-right: 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .checkbox-group {
            display: flex;
            align-items: center;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
        }
        .help-text {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-top: 3px;
        }
    </style>
</head>
<body>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 data-zh="Git Work Summary 配置" data-en="Git Work Summary Configuration">Git Work Summary 配置</h1>
        <button type="button" id="languageToggle" style="padding: 5px 10px; font-size: 12px;">🌐 EN</button>
    </div>
    
    <form id="configForm">
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enabled" ${config.enabled ? 'checked' : ''}>
                <label for="enabled" data-zh="启用定时工作总结" data-en="Enable Scheduled Work Summary">启用定时工作总结</label>
            </div>
        </div>

        <div class="form-group">
            <label for="interval" data-zh="定时间隔（分钟）" data-en="Timer Interval (minutes)">定时间隔（分钟）</label>
            <input type="number" id="interval" value="${config.interval}" min="1">
            <div class="help-text" data-zh="建议设置为 60 分钟" data-en="Recommended setting: 60 minutes">建议设置为 60 分钟</div>
        </div>

        <div class="form-group">
            <label for="maxCommits" data-zh="每次处理的最大提交数量" data-en="Maximum Commits Per Processing">每次处理的最大提交数量</label>
            <input type="number" id="maxCommits" value="${config.maxCommits}" min="1">
            <div class="help-text" data-zh="避免一次处理过多提交导致性能问题" data-en="Avoid performance issues from processing too many commits at once">避免一次处理过多提交导致性能问题</div>
        </div>

        <div class="form-group">
            <label for="maxFilesPerCommit" data-zh="每个提交显示的最大文件数量" data-en="Maximum Files Per Commit Display">每个提交显示的最大文件数量</label>
            <input type="number" id="maxFilesPerCommit" value="${config.maxFilesPerCommit}" min="1" max="20">
            <div class="help-text" data-zh="限制每个提交在报告中显示的文件数量，避免文件列表过长" data-en="Limit the number of files displayed per commit in reports to avoid overly long file lists">限制每个提交在报告中显示的文件数量，避免文件列表过长</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="onlyMyCommits" ${config.onlyMyCommits ? 'checked' : ''}>
                <label for="onlyMyCommits" data-zh="只分析我的提交" data-en="Analyze Only My Commits">只分析我的提交</label>
            </div>
            <div class="help-text" data-zh="仅分析当前 Git 用户的提交记录，忽略团队其他成员的提交" data-en="Only analyze commits from the current Git user, ignore commits from other team members">仅分析当前 Git 用户的提交记录，忽略团队其他成员的提交</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="scanAllBranches" ${config.scanAllBranches ? 'checked' : ''}>
                <label for="scanAllBranches" data-zh="扫描所有本地分支" data-en="Scan All Local Branches">扫描所有本地分支</label>
            </div>
            <div class="help-text" data-zh="扫描所有本地分支的提交记录，适用于多分支开发场景" data-en="Scan commit records from all local branches, suitable for multi-branch development scenarios">扫描所有本地分支的提交记录，适用于多分支开发场景</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="includeUncommittedChanges" ${config.includeUncommittedChanges ? 'checked' : ''}>
                <label for="includeUncommittedChanges" data-zh="包含未提交变更" data-en="Include Uncommitted Changes">包含未提交变更</label>
            </div>
            <div class="help-text" data-zh="在日报中包含未提交的变更内容（避免重复总结）" data-en="Include uncommitted changes in daily reports (avoid duplicate summaries)">在日报中包含未提交的变更内容（避免重复总结）</div>
        </div>

        <div class="form-group">
            <label for="dailyReportTime" data-zh="每日报告生成时间" data-en="Daily Report Generation Time">每日报告生成时间</label>
            <input type="time" id="dailyReportTime" value="${config.dailyReportTime}">
            <div class="help-text" data-zh="设置每天生成工作报告的时间（24小时制）" data-en="Set the time for daily work report generation (24-hour format)">设置每天生成工作报告的时间（24小时制）</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enableWeeklyReport" ${config.enableWeeklyReport ? 'checked' : ''}>
                <label for="enableWeeklyReport" data-zh="启用每周工作报告" data-en="Enable Weekly Work Report">启用每周工作报告</label>
            </div>
            <div class="help-text" data-zh="每周自动生成工作报告" data-en="Automatically generate work reports weekly">每周自动生成工作报告</div>
        </div>

        <div class="form-group">
            <label for="weeklyReportDay" data-zh="每周报告生成日期" data-en="Weekly Report Generation Day">每周报告生成日期</label>
            <select id="weeklyReportDay">
                <option value="0" ${config.weeklyReportDay === 0 ? 'selected' : ''} data-zh="周日" data-en="Sunday">周日</option>
                <option value="1" ${config.weeklyReportDay === 1 ? 'selected' : ''} data-zh="周一" data-en="Monday">周一</option>
                <option value="2" ${config.weeklyReportDay === 2 ? 'selected' : ''} data-zh="周二" data-en="Tuesday">周二</option>
                <option value="3" ${config.weeklyReportDay === 3 ? 'selected' : ''} data-zh="周三" data-en="Wednesday">周三</option>
                <option value="4" ${config.weeklyReportDay === 4 ? 'selected' : ''} data-zh="周四" data-en="Thursday">周四</option>
                <option value="5" ${config.weeklyReportDay === 5 ? 'selected' : ''} data-zh="周五" data-en="Friday">周五</option>
                <option value="6" ${config.weeklyReportDay === 6 ? 'selected' : ''} data-zh="周六" data-en="Saturday">周六</option>
            </select>
            <div class="help-text" data-zh="选择每周生成工作报告的日期" data-en="Select the day for weekly work report generation">选择每周生成工作报告的日期</div>
        </div>

        <div class="form-group">
            <label for="weekStartDay" data-zh="周报起始日期" data-en="Week Start Day">周报起始日期</label>
            <select id="weekStartDay">
                <option value="0" ${config.weekStartDay === 0 ? 'selected' : ''} data-zh="周日" data-en="Sunday">周日</option>
                <option value="1" ${config.weekStartDay === 1 ? 'selected' : ''} data-zh="周一" data-en="Monday">周一</option>
                <option value="2" ${config.weekStartDay === 2 ? 'selected' : ''} data-zh="周二" data-en="Tuesday">周二</option>
                <option value="3" ${config.weekStartDay === 3 ? 'selected' : ''} data-zh="周三" data-en="Wednesday">周三</option>
                <option value="4" ${config.weekStartDay === 4 ? 'selected' : ''} data-zh="周四" data-en="Thursday">周四</option>
                <option value="5" ${config.weekStartDay === 5 ? 'selected' : ''} data-zh="周五" data-en="Friday">周五</option>
                <option value="6" ${config.weekStartDay === 6 ? 'selected' : ''} data-zh="周六" data-en="Saturday">周六</option>
            </select>
            <div class="help-text" data-zh="选择周报的起始日期" data-en="Select the start day for weekly reports">选择周报的起始日期</div>
        </div>

        <div class="form-group">
            <label for="aiProvider" data-zh="AI 服务提供商" data-en="AI Service Provider">AI 服务提供商</label>
            <select id="aiProvider">
                <option value="deepseek" ${config.aiProvider === 'deepseek' ? 'selected' : ''}>DeepSeek</option>
                <option value="openai" ${config.aiProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
            </select>
            <div class="help-text" data-zh="选择要使用的 AI 服务提供商" data-en="Select the AI service provider to use">选择要使用的 AI 服务提供商</div>
        </div>

        <div class="form-group">
            <label for="aiApiKey" data-zh="AI API Key" data-en="AI API Key">AI API Key</label>
            <input type="password" id="aiApiKey" value="${config.aiApiKey}" placeholder="请输入 API Key / Enter API Key">
            <div class="help-text" data-zh="用于调用 AI 服务生成工作总结" data-en="Used to call AI services for generating work summaries">用于调用 AI 服务生成工作总结</div>
        </div>

        <div class="form-group">
            <label for="aiBaseUrl" data-zh="AI API Base URL (可选)" data-en="AI API Base URL (Optional)">AI API Base URL (可选)</label>
            <input type="text" id="aiBaseUrl" value="${config.aiBaseUrl}" placeholder="自定义 API 地址，留空使用默认值 / Custom API URL, leave blank for default">
            <div class="help-text" data-zh="如需使用自定义 API 地址，请填写此项" data-en="Fill this field if you need to use a custom API URL">如需使用自定义 API 地址，请填写此项</div>
        </div>

        <div class="form-group">
            <label for="aiModel" data-zh="AI 模型 (可选)" data-en="AI Model (Optional)">AI 模型 (可选)</label>
            <input type="text" id="aiModel" value="${config.aiModel}" placeholder="自定义模型名称，留空使用默认值 / Custom model name, leave blank for default">
            <div class="help-text" data-zh="如需使用特定模型，请填写此项" data-en="Fill this field if you need to use a specific model">如需使用特定模型，请填写此项</div>
        </div>

        <div class="form-group">
            <label for="aiTimeout" data-zh="AI 服务超时时间（秒）" data-en="AI Service Timeout (seconds)">AI 服务超时时间（秒）</label>
            <input type="number" id="aiTimeout" value="${config.aiTimeout}" min="10" max="300">
            <div class="help-text" data-zh="AI 服务调用的超时时间，推理模型(如deepseek-reasoner)建议设置120秒以上" data-en="Timeout for AI service calls, reasoning models (like deepseek-reasoner) recommend 120+ seconds">AI 服务调用的超时时间，推理模型(如deepseek-reasoner)建议设置120秒以上</div>
        </div>

        <div class="form-group">
            <label for="AIOutputlanguage" data-zh="AI 输出语言" data-en="AI Output Language">AI 输出语言</label>
            <input type="text" id="AIOutputlanguage" value="${config.AIOutputlanguage}" placeholder="中文 / English / 中英双语 / Français...">
            <div class="help-text" data-zh="设置 AI 生成工作总结时使用的语言，可以输入任意语言" data-en="Set the language for AI-generated work summaries, any language can be entered">设置 AI 生成工作总结时使用的语言，可以输入任意语言</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enablePromptLogging" ${config.enablePromptLogging ? 'checked' : ''}>
                <label for="enablePromptLogging" data-zh="启用提示词日志输出" data-en="Enable Prompt Logging">启用提示词日志输出</label>
            </div>
            <div class="help-text" data-zh="在控制台显示实际发送给AI的提示词，便于调试和优化" data-en="Display actual prompts sent to AI in console for debugging and optimization">在控制台显示实际发送给AI的提示词，便于调试和优化</div>
        </div>

        <div class="form-group">
            <label for="customPrompts" data-zh="自定义提示词配置（JSON格式）" data-en="Custom Prompts Configuration (JSON Format)">自定义提示词配置（JSON格式）</label>
            <textarea id="customPrompts" rows="8" placeholder='{"dailySystemPrompt": "你是专业的日报分析师...", "summarySystemPrompt": "你是工作总结助手..."} / {"dailySystemPrompt": "You are a professional daily report analyst...", "summarySystemPrompt": "You are a work summary assistant..."}'>${JSON.stringify(config.customPrompts, null, 2)}</textarea>
            <div class="help-text" data-zh="支持自定义以下提示词：<br>• dailySystemPrompt: 日报系统提示词<br>• weeklySystemPrompt: 周报系统提示词<br>• summarySystemPrompt: 工作总结系统提示词<br>• dailyUserPromptTemplate: 日报用户提示词模板<br>• weeklyUserPromptTemplate: 周报用户提示词模板<br>• summaryUserPromptTemplate: 工作总结用户提示词模板" data-en="Supports customizing the following prompts:<br>• dailySystemPrompt: Daily report system prompt<br>• weeklySystemPrompt: Weekly report system prompt<br>• summarySystemPrompt: Work summary system prompt<br>• dailyUserPromptTemplate: Daily report user prompt template<br>• weeklyUserPromptTemplate: Weekly report user prompt template<br>• summaryUserPromptTemplate: Work summary user prompt template">
                支持自定义以下提示词：<br>
                • dailySystemPrompt: 日报系统提示词<br>
                • weeklySystemPrompt: 周报系统提示词<br>
                • summarySystemPrompt: 工作总结系统提示词<br>
                • dailyUserPromptTemplate: 日报用户提示词模板<br>
                • weeklyUserPromptTemplate: 周报用户提示词模板<br>
                • summaryUserPromptTemplate: 工作总结用户提示词模板
            </div>
        </div>

        <div class="form-group">
            <label for="reportUrl" data-zh="上报接口 URL" data-en="Report API URL">上报接口 URL</label>
            <input type="text" id="reportUrl" value="${config.reportUrl}" placeholder="https://your-api.com/work-summary">
            <div class="help-text" data-zh="工作总结将被上报到此接口" data-en="Work summaries will be reported to this API endpoint">工作总结将被上报到此接口</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enableMultiProject" ${config.enableMultiProject ? 'checked' : ''}>
                <label for="enableMultiProject" data-zh="启用多项目合并功能" data-en="Enable Multi-Project Merge">启用多项目合并功能</label>
            </div>
            <div class="help-text" data-zh="启用后可以合并多个项目的日周报" data-en="Enable merging of daily and weekly reports from multiple projects">启用后可以合并多个项目的日周报</div>
        </div>

        <div class="form-group">
            <label for="projectPaths" data-zh="多项目路径列表（每行一个绝对路径）" data-en="Multi-Project Path List (One absolute path per line)">多项目路径列表（每行一个绝对路径）</label>
            <textarea id="projectPaths" rows="4" placeholder="/path/to/project1&#10;/path/to/project2">${config.projectPaths.join('\n')}</textarea>
            <div class="help-text" data-zh="输入要合并的项目绝对路径，每行一个" data-en="Enter absolute paths of projects to merge, one per line">输入要合并的项目绝对路径，每行一个</div>
        </div>

        <div class="form-group">
            <label for="projectNames" data-zh="项目名称映射（JSON格式）" data-en="Project Name Mapping (JSON Format)">项目名称映射（JSON格式）</label>
            <textarea id="projectNames" rows="4" placeholder='{"/path/to/project1": "前端项目", "/path/to/project2": "后端API"} / {"/path/to/project1": "Frontend Project", "/path/to/project2": "Backend API"}'>${JSON.stringify(config.projectNames, null, 2)}</textarea>
            <div class="help-text" data-zh="为项目路径设置友好的显示名称" data-en="Set friendly display names for project paths">为项目路径设置友好的显示名称</div>
        </div>

        <div class="form-group">
            <label for="reportHeaders" data-zh="上报接口请求头（JSON 格式）" data-en="Report API Request Headers (JSON Format)">上报接口请求头（JSON 格式）</label>
            <textarea id="reportHeaders" rows="4" placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'>${JSON.stringify(config.reportHeaders, null, 2)}</textarea>
            <div class="help-text" data-zh="例如：认证信息、Content-Type 等" data-en="For example: authentication info, Content-Type, etc.">例如：认证信息、Content-Type 等</div>
        </div>

        <div style="margin-top: 20px;">
            <button type="button" onclick="saveConfig()" data-zh="保存配置" data-en="Save Configuration">保存配置</button>
            <button type="button" onclick="testConfig()" data-zh="测试配置" data-en="Test Configuration">测试配置</button>
        </div>
    </form>

    <script>
        const vscode = acquireVsCodeApi();

        // 语言切换功能
        let currentLanguage = 'zh';
        
        function toggleLanguage() {
            currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
            updateLanguageDisplay();
        }
        
        function updateLanguageDisplay() {
            const elements = document.querySelectorAll('[data-zh][data-en]');
            const toggleButton = document.getElementById('languageToggle');
            
            elements.forEach(element => {
                const content = currentLanguage === 'zh' 
                    ? element.getAttribute('data-zh') 
                    : element.getAttribute('data-en');
                
                // 对于包含HTML的元素使用innerHTML，否则使用textContent
                if (content.includes('<br>') || content.includes('<')) {
                    element.innerHTML = content;
                } else {
                    element.textContent = content;
                }
            });
            
            // 处理select的option元素
            const selectOptions = document.querySelectorAll('option[data-zh][data-en]');
            selectOptions.forEach(option => {
                const content = currentLanguage === 'zh' 
                    ? option.getAttribute('data-zh') 
                    : option.getAttribute('data-en');
                option.textContent = content;
            });
            
            toggleButton.textContent = currentLanguage === 'zh' ? '🌐 EN' : '🌐 中文';
        }
        
        // 初始化语言切换按钮
        document.addEventListener('DOMContentLoaded', function() {
            const toggleButton = document.getElementById('languageToggle');
            if (toggleButton) {
                toggleButton.addEventListener('click', toggleLanguage);
            }
        });

        function saveConfig() {
            const config = {
                enabled: document.getElementById('enabled').checked,
                interval: parseInt(document.getElementById('interval').value),
                maxCommits: parseInt(document.getElementById('maxCommits').value),
                maxFilesPerCommit: parseInt(document.getElementById('maxFilesPerCommit').value),
                onlyMyCommits: document.getElementById('onlyMyCommits').checked,
                scanAllBranches: document.getElementById('scanAllBranches').checked,
                includeUncommittedChanges: document.getElementById('includeUncommittedChanges').checked,
                enableWeeklyReport: document.getElementById('enableWeeklyReport').checked,
                dailyReportTime: document.getElementById('dailyReportTime').value,
                weeklyReportDay: parseInt(document.getElementById('weeklyReportDay').value),
                weekStartDay: parseInt(document.getElementById('weekStartDay').value),
                aiProvider: document.getElementById('aiProvider').value,
                aiApiKey: document.getElementById('aiApiKey').value,
                aiBaseUrl: document.getElementById('aiBaseUrl').value,
                aiModel: document.getElementById('aiModel').value,
                aiTimeout: parseInt(document.getElementById('aiTimeout').value),
                AIOutputlanguage: document.getElementById('AIOutputlanguage').value,
                enablePromptLogging: document.getElementById('enablePromptLogging').checked,
                customPrompts: {},
                reportUrl: document.getElementById('reportUrl').value,
                reportHeaders: {},
                enableMultiProject: document.getElementById('enableMultiProject').checked,
                projectPaths: document.getElementById('projectPaths').value.split('\\n').filter(p => p.trim()),
                projectNames: {}
            };

            try {
                const headersText = document.getElementById('reportHeaders').value.trim();
                if (headersText) {
                    config.reportHeaders = JSON.parse(headersText);
                }
            } catch (e) {
                const errorMsg = currentLanguage === 'zh' ? '请求头 JSON 格式错误' : 'Request headers JSON format error';
                alert(errorMsg);
                return;
            }

            try {
                const customPromptsText = document.getElementById('customPrompts').value.trim();
                if (customPromptsText) {
                    config.customPrompts = JSON.parse(customPromptsText);
                }
            } catch (e) {
                const errorMsg = currentLanguage === 'zh' ? '自定义提示词 JSON 格式错误' : 'Custom prompts JSON format error';
                alert(errorMsg);
                return;
            }

            try {
                const projectNamesText = document.getElementById('projectNames').value.trim();
                if (projectNamesText) {
                    config.projectNames = JSON.parse(projectNamesText);
                }
            } catch (e) {
                const errorMsg = currentLanguage === 'zh' ? '项目名称映射 JSON 格式错误' : 'Project name mapping JSON format error';
                alert(errorMsg);
                return;
            }

            vscode.postMessage({
                command: 'save',
                config: config
            });
        }

        function testConfig() {
            const config = {
                enabled: document.getElementById('enabled').checked,
                interval: parseInt(document.getElementById('interval').value),
                maxCommits: parseInt(document.getElementById('maxCommits').value),
                maxFilesPerCommit: parseInt(document.getElementById('maxFilesPerCommit').value),
                onlyMyCommits: document.getElementById('onlyMyCommits').checked,
                scanAllBranches: document.getElementById('scanAllBranches').checked,
                includeUncommittedChanges: document.getElementById('includeUncommittedChanges').checked,
                enableWeeklyReport: document.getElementById('enableWeeklyReport').checked,
                dailyReportTime: document.getElementById('dailyReportTime').value,
                weeklyReportDay: parseInt(document.getElementById('weeklyReportDay').value),
                weekStartDay: parseInt(document.getElementById('weekStartDay').value),
                aiProvider: document.getElementById('aiProvider').value,
                aiApiKey: document.getElementById('aiApiKey').value,
                aiBaseUrl: document.getElementById('aiBaseUrl').value,
                aiModel: document.getElementById('aiModel').value,
                aiTimeout: parseInt(document.getElementById('aiTimeout').value),
                AIOutputlanguage: document.getElementById('AIOutputlanguage').value,
                enablePromptLogging: document.getElementById('enablePromptLogging').checked,
                customPrompts: {},
                reportUrl: document.getElementById('reportUrl').value,
                reportHeaders: {},
                enableMultiProject: document.getElementById('enableMultiProject').checked,
                projectPaths: document.getElementById('projectPaths').value.split('\\n').filter(p => p.trim()),
                projectNames: {}
            };

            try {
                const headersText = document.getElementById('reportHeaders').value.trim();
                if (headersText) {
                    config.reportHeaders = JSON.parse(headersText);
                }
            } catch (e) {
                const errorMsg = currentLanguage === 'zh' ? '请求头 JSON 格式错误' : 'Request headers JSON format error';
                alert(errorMsg);
                return;
            }

            try {
                const customPromptsText = document.getElementById('customPrompts').value.trim();
                if (customPromptsText) {
                    config.customPrompts = JSON.parse(customPromptsText);
                }
            } catch (e) {
                const errorMsg = currentLanguage === 'zh' ? '自定义提示词 JSON 格式错误' : 'Custom prompts JSON format error';
                alert(errorMsg);
                return;
            }

            try {
                const projectNamesText = document.getElementById('projectNames').value.trim();
                if (projectNamesText) {
                    config.projectNames = JSON.parse(projectNamesText);
                }
            } catch (e) {
                const errorMsg = currentLanguage === 'zh' ? '项目名称映射 JSON 格式错误' : 'Project name mapping JSON format error';
                alert(errorMsg);
                return;
            }

            vscode.postMessage({
                command: 'test',
                config: config
            });
        }
    </script>
</body>
</html>`;
    }
} 