import * as vscode from 'vscode';
import { GitWorkSummaryManager } from './gitWorkSummaryManager';
import { ConfigurationManager } from './configurationManager';
import { HistoryViewProvider } from './historyViewProvider';
import { GitAnalyzer } from './gitAnalyzer';
import { AISummaryService } from './aiSummaryService';
import { ReportService } from './reportService';
import { WorkSummaryStorage } from './workSummaryStorage';
import { MultiProjectManager } from './multiProjectManager';
import { log, initializeLogger, showLogs } from './logger';

let gitWorkSummaryManager: GitWorkSummaryManager;

export function activate(context: vscode.ExtensionContext) {
    // 初始化日志系统
    initializeLogger();
    
    log('Git Work Summary 扩展已激活');

    // 初始化管理器
    const configManager = new ConfigurationManager();
    const gitAnalyzer = new GitAnalyzer();
    const aiService = new AISummaryService(configManager);
    const reportService = new ReportService(configManager);
    const storage = new WorkSummaryStorage(context);
    
    gitWorkSummaryManager = new GitWorkSummaryManager(
        gitAnalyzer,
        aiService,
        reportService,
        configManager,
        storage
    );
    
    const historyProvider = new HistoryViewProvider(context);
    const multiProjectManager = new MultiProjectManager(gitAnalyzer, aiService, configManager);

    // 注册命令
    const generateDailyReportCommand = vscode.commands.registerCommand(
        'gitWorkSummary.generateDailyReport',
        () => gitWorkSummaryManager.generateTodayReport()
    );

    const generateDailyReportForDateCommand = vscode.commands.registerCommand(
        'gitWorkSummary.generateDailyReportForDate',
        async () => {
            // 显示日期选择器
            const dateInput = await vscode.window.showInputBox({
                prompt: '请输入日期（格式：YYYY-MM-DD），留空则选择今天',
                placeHolder: '2024-01-15',
                validateInput: (value) => {
                    if (!value.trim()) return null; // 允许空值
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        return '日期格式错误，请使用 YYYY-MM-DD 格式';
                    }
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        return '无效的日期';
                    }
                    return null;
                }
            });

            if (dateInput === undefined) return; // 用户取消
            
            const targetDate = dateInput.trim() ? new Date(dateInput) : new Date();
            await gitWorkSummaryManager.generateDailyReport(targetDate);
        }
    );

    const showUncommittedSummaryCommand = vscode.commands.registerCommand(
        'gitWorkSummary.showUncommittedSummary',
        async () => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('未找到工作区');
                    return;
                }
                
                log('\n📝 检查未提交的变更...');
                const uncommittedChanges = await gitAnalyzer.getUncommittedChanges(workspaceFolder.uri.fsPath);
                const hasChanges = uncommittedChanges.staged.length > 0 || uncommittedChanges.modified.length > 0;
                
                if (!hasChanges) {
                    vscode.window.showInformationMessage('当前没有未提交的变更');
                    return;
                }

                log(`发现 ${uncommittedChanges.staged.length} 个已暂存文件, ${uncommittedChanges.modified.length} 个已修改文件`);
                
                const summary = await aiService.generateUncommittedSummary(uncommittedChanges);
                if (summary) {
                    const action = await vscode.window.showInformationMessage(
                        `未提交变更摘要: ${summary}`,
                        { modal: true },
                        '查看详细变更'
                    );
                    
                    if (action === '查看详细变更') {
                        // 显示详细的变更信息
                        let details = '## 未提交的变更详情\n\n';
                        
                        if (uncommittedChanges.staged.length > 0) {
                            details += '### 已暂存的文件:\n';
                            uncommittedChanges.staged.forEach(change => {
                                details += `- ${change.file} (${change.status})\n`;
                            });
                            details += '\n';
                        }
                        
                        if (uncommittedChanges.modified.length > 0) {
                            details += '### 已修改未暂存的文件:\n';
                            uncommittedChanges.modified.forEach(change => {
                                details += `- ${change.file} (${change.status})\n`;
                            });
                        }
                        
                        // 创建一个新的文档显示详情
                        const doc = await vscode.workspace.openTextDocument({
                            content: details,
                            language: 'markdown'
                        });
                        await vscode.window.showTextDocument(doc);
                    }
                } else {
                    vscode.window.showInformationMessage(
                        `发现未提交变更: ${uncommittedChanges.staged.length} 个已暂存, ${uncommittedChanges.modified.length} 个已修改`
                    );
                }
            } catch (error) {
                log(`获取未提交变更摘要失败: ${error}`);
                vscode.window.showErrorMessage(`获取未提交变更摘要失败: ${error}`);
            }
        }
    );

    const configureCommand = vscode.commands.registerCommand(
        'gitWorkSummary.configure',
        () => configManager.showConfiguration()
    );

    const viewHistoryCommand = vscode.commands.registerCommand(
        'gitWorkSummary.viewHistory',
        () => historyProvider.showHistory()
    );

    const generateWeeklyReportCommand = vscode.commands.registerCommand(
        'gitWorkSummary.generateWeeklyReport',
        () => gitWorkSummaryManager.generateWeeklyReport()
    );

    const generateWeeklyReportForDateCommand = vscode.commands.registerCommand(
        'gitWorkSummary.generateWeeklyReportForDate',
        () => gitWorkSummaryManager.generateWeeklyReportForDate()
    );

    const resetProcessedCommitsCommand = vscode.commands.registerCommand(
        'gitWorkSummary.resetProcessedCommits',
        async () => {
            try {
                log('\n🔄 执行重置已处理提交记录...');
                
                gitAnalyzer.resetLastProcessedCommit();
                
                log('✅ 重置完成，下次分析将处理所有提交');
                vscode.window.showInformationMessage('已重置处理记录，下次分析将处理所有提交');
            } catch (error) {
                log(`重置失败: ${error}`);
                vscode.window.showErrorMessage(`重置失败: ${error}`);
            }
        }
    );

    const debugGitStatusCommand = vscode.commands.registerCommand(
        'gitWorkSummary.debugGitStatus',
        async () => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('未找到工作区');
                    return;
                }

                const config = configManager.getConfiguration();
                
                log('\n🔍 Git状态调试信息:');
                log('====================================');
                
                // 基本信息
                log(`📁 工作区: ${workspaceFolder.uri.fsPath}`);
                log(`⚙️ 当前配置:`);
                log(`  ├─ 只分析我的提交: ${config.onlyMyCommits}`);
                log(`  ├─ 扫描所有分支: ${config.scanAllBranches}`);
                log(`  └─ 最大提交数: ${config.maxCommits}`);

                // 获取分支信息
                try {
                    const branchInfo = await gitAnalyzer.getBranchInfo(workspaceFolder.uri.fsPath);
                    log(`\n🌿 分支信息:`);
                    log(`  ├─ 当前分支: ${branchInfo.current}`);
                    log(`  └─ 本地分支: ${branchInfo.all.join(', ')}`);
                } catch (error) {
                    log(`❌ 获取分支信息失败: ${error}`);
                }

                // 获取最近的提交
                try {
                    const today = new Date();
                    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
                    const commits = await gitAnalyzer.getCommitsByDateRange(
                        workspaceFolder.uri.fsPath,
                        dayStart,
                        today,
                        false,
                        true
                    );
                    log(`\n📝 最近提交:`);
                    commits.slice(0, 5).forEach((commit, index) => {
                        log(`  ${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.message} (${commit.author})`);
                    });
                } catch (error) {
                    log(`❌ 获取提交信息失败: ${error}`);
                }

                // 获取未提交的变更
                try {
                    const uncommittedChanges = await gitAnalyzer.getUncommittedChanges(workspaceFolder.uri.fsPath);
                    log(`\n📋 未提交变更:`);
                    log(`  ├─ 已暂存: ${uncommittedChanges.staged.length} 个文件`);
                    log(`  └─ 已修改: ${uncommittedChanges.modified.length} 个文件`);
                    
                    if (uncommittedChanges.staged.length > 0) {
                        log(`\n  已暂存的文件:`);
                        uncommittedChanges.staged.forEach(change => {
                            log(`    - ${change.file} (${change.status})`);
                        });
                    }
                    
                    if (uncommittedChanges.modified.length > 0) {
                        log(`\n  已修改的文件:`);
                        uncommittedChanges.modified.forEach(change => {
                            log(`    - ${change.file} (${change.status})`);
                        });
                    }
                } catch (error) {
                    log(`❌ 获取未提交变更失败: ${error}`);
                }

                // 检查是否是Git仓库
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const gitPath = path.join(workspaceFolder.uri.fsPath, '.git');
                    const isGitRepo = fs.existsSync(gitPath);
                    log(`\n📦 Git仓库状态: ${isGitRepo ? '✅ 是Git仓库' : '❌ 不是Git仓库'}`);
                } catch (error) {
                    log(`❌ 检查Git仓库状态失败: ${error}`);
                }

                log('\n====================================');
                log('🔍 调试信息收集完成');
                
                // 显示输出通道
                showLogs();
                
            } catch (error) {
                log(`调试失败: ${error}`);
                vscode.window.showErrorMessage(`调试失败: ${error}`);
            }
        }
    );

    // 注册查看日志命令
    const showLogsCommand = vscode.commands.registerCommand(
        'gitWorkSummary.showLogs',
        () => {
            showLogs();
        }
    );

    const testAICommand = vscode.commands.registerCommand(
        'gitWorkSummary.testAI',
        async () => {
            try {
                log('\n🧪 测试AI连接...');
                
                const success = await aiService.testConnection();
                if (success) {
                    log('✅ AI连接测试成功');
                    vscode.window.showInformationMessage('AI连接测试成功');
                } else {
                    log('❌ AI连接测试失败');
                    vscode.window.showErrorMessage('AI连接测试失败，请检查配置');
                }
            } catch (error) {
                log(`AI连接测试失败: ${error}`);
                vscode.window.showErrorMessage(`AI连接测试失败: ${error}`);
            }
        }
    );

    const printPromptsCommand = vscode.commands.registerCommand(
        'gitWorkSummary.printPrompts',
        () => {
            try {
                log('\n📝 当前AI提示词示例:');
                log('====================================');
                const examples = aiService.getPromptExamples();
                log(examples);
                log('====================================');
                vscode.window.showInformationMessage('AI提示词示例已输出到控制台');
            } catch (error) {
                log(`获取提示词示例失败: ${error}`);
                vscode.window.showErrorMessage(`获取提示词示例失败: ${error}`);
            }
        }
    );

    const showCurrentPromptsCommand = vscode.commands.registerCommand(
        'gitWorkSummary.showCurrentPrompts',
        async () => {
            try {
                const config = configManager.getConfiguration();
                
                // 构建当前配置的提示词信息
                let content = '# 当前AI提示词配置\n\n';
                
                // 显示自定义提示词配置
                if (Object.keys(config.customPrompts).length > 0) {
                    content += '## 自定义提示词配置\n\n';
                    content += '```json\n';
                    content += JSON.stringify(config.customPrompts, null, 2);
                    content += '\n```\n\n';
                } else {
                    content += '## 自定义提示词配置\n\n';
                    content += '当前使用默认提示词（未配置自定义提示词）\n\n';
                }
                
                // 显示完整的提示词示例
                content += '## 完整提示词示例\n\n';
                const examples = aiService.getPromptExamples();
                content += examples;
                
                // 创建新文档显示
                const doc = await vscode.workspace.openTextDocument({
                    content: content,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);
                
            } catch (error) {
                log(`显示当前提示词失败: ${error}`);
                vscode.window.showErrorMessage(`显示当前提示词失败: ${error}`);
            }
        }
    );

    const debugMultiProjectCommand = vscode.commands.registerCommand(
        'gitWorkSummary.debugMultiProject',
        async () => {
            try {
                const config = configManager.getConfiguration();
                
                log('\n🔍 多项目配置调试信息:');
                log('====================================');
                log(`✅ 多项目功能启用: ${config.enableMultiProject}`);
                log(`📁 配置的项目路径数量: ${config.projectPaths.length}`);
                
                if (config.projectPaths.length > 0) {
                    log('📂 项目路径列表:');
                    config.projectPaths.forEach((path, index) => {
                        const projectName = config.projectNames[path] || `项目${index + 1}`;
                        log(`  ${index + 1}. ${projectName}: ${path}`);
                    });
                } else {
                    log('⚠️ 未配置任何项目路径');
                }
                
                log('\n🎯 测试多项目功能可用性:');
                if (!config.enableMultiProject) {
                    log('❌ 多项目功能未启用');
                    vscode.window.showWarningMessage('多项目功能未启用，请在配置中启用多项目功能');
                } else if (config.projectPaths.length === 0) {
                    log('❌ 未配置项目路径');
                    vscode.window.showWarningMessage('请在配置中添加项目路径');
                } else {
                    log('✅ 多项目功能配置正常');
                    
                    // 测试各项目的Git状态
                    log('\n📊 各项目Git状态:');
                    for (const projectPath of config.projectPaths) {
                        const projectName = config.projectNames[projectPath] || projectPath;
                        try {
                            // 检查路径是否存在
                            const fs = require('fs');
                            if (!fs.existsSync(projectPath)) {
                                log(`❌ ${projectName}: 路径不存在 (${projectPath})`);
                                continue;
                            }
                            
                            // 检查是否是Git仓库
                            const gitPath = require('path').join(projectPath, '.git');
                            if (!fs.existsSync(gitPath)) {
                                log(`❌ ${projectName}: 不是Git仓库 (${projectPath})`);
                                continue;
                            }
                            
                            // 获取最近提交
                            const recentCommits = await gitAnalyzer.getRecentCommits(
                                projectPath,
                                5,
                                config.onlyMyCommits,
                                config.scanAllBranches
                            );
                            
                            log(`✅ ${projectName}: ${recentCommits.length} 个最近提交 (${projectPath})`);
                            
                        } catch (error) {
                            log(`❌ ${projectName}: Git分析失败 - ${error} (${projectPath})`);
                        }
                    }
                    
                    vscode.window.showInformationMessage(`多项目功能已启用，配置了 ${config.projectPaths.length} 个项目`);
                }
                
                log('====================================');
            } catch (error) {
                log(`多项目配置调试失败: ${error}`);
                vscode.window.showErrorMessage(`多项目配置调试失败: ${error}`);
            }
        }
    );

    const quickSetupMultiProjectCommand = vscode.commands.registerCommand(
        'gitWorkSummary.quickSetupMultiProject',
        async () => {
            try {
                const config = configManager.getConfiguration();
                
                // 如果已经启用，显示当前配置
                if (config.enableMultiProject && config.projectPaths.length > 0) {
                    const action = await vscode.window.showInformationMessage(
                        `多项目功能已启用，当前配置了 ${config.projectPaths.length} 个项目。`,
                        '查看配置',
                        '重新配置'
                    );
                    
                    if (action === '查看配置') {
                        vscode.commands.executeCommand('gitWorkSummary.debugMultiProject');
                        return;
                    } else if (action !== '重新配置') {
                        return;
                    }
                }
                
                // 引导用户配置
                const enableChoice = await vscode.window.showInformationMessage(
                    '多项目功能可以将多个项目的日报和周报合并生成。是否要启用多项目功能？',
                    '启用',
                    '取消'
                );
                
                if (enableChoice !== '启用') {
                    return;
                }
                
                // 启用多项目功能
                await configManager.updateConfiguration('enableMultiProject', true);
                
                // 添加项目路径
                const projectPaths: string[] = [];
                
                while (true) {
                    const addMore = projectPaths.length === 0 ? '添加第一个项目' : '添加更多项目';
                    const action = await vscode.window.showInformationMessage(
                        `当前已添加 ${projectPaths.length} 个项目。`,
                        addMore,
                        '完成配置'
                    );
                    
                    if (action === '完成配置') {
                        break;
                    }
                    
                    // 选择项目文件夹
                    const folderUri = await vscode.window.showOpenDialog({
                        canSelectFolders: true,
                        canSelectFiles: false,
                        canSelectMany: false,
                        openLabel: '选择项目文件夹'
                    });
                    
                    if (!folderUri || folderUri.length === 0) {
                        continue;
                    }
                    
                    const projectPath = folderUri[0].fsPath;
                    
                    // 检查是否是Git仓库
                    const fs = require('fs');
                    const path = require('path');
                    const gitPath = path.join(projectPath, '.git');
                    
                    if (!fs.existsSync(gitPath)) {
                        vscode.window.showWarningMessage('选择的文件夹不是Git仓库，请选择包含.git文件夹的项目根目录。');
                        continue;
                    }
                    
                    // 检查是否已添加
                    if (projectPaths.includes(projectPath)) {
                        vscode.window.showWarningMessage('该项目已添加，请选择其他项目。');
                        continue;
                    }
                    
                    // 获取项目名称
                    const defaultName = path.basename(projectPath);
                    const projectName = await vscode.window.showInputBox({
                        prompt: '请输入项目的友好名称（用于在报告中显示）',
                        value: defaultName,
                        validateInput: (value) => {
                            if (!value.trim()) {
                                return '项目名称不能为空';
                            }
                            return null;
                        }
                    });
                    
                    if (!projectName) {
                        continue;
                    }
                    
                    projectPaths.push(projectPath);
                    
                    // 更新项目名称映射
                    const currentProjectNames = config.projectNames;
                    currentProjectNames[projectPath] = projectName.trim();
                    await configManager.updateConfiguration('projectNames', currentProjectNames);
                    
                    log(`项目 "${projectName}" 已添加`);
                }
                
                if (projectPaths.length === 0) {
                    log('未添加任何项目，多项目功能将无法使用。');
                    return;
                }
                
                // 保存项目路径
                await configManager.updateConfiguration('projectPaths', projectPaths);
                
                // 显示完成信息
                log(
                    `多项目功能配置完成！已添加 ${projectPaths.length} 个项目。现在可以使用"Generate Multi-Project Daily Report"和"Generate Multi-Project Weekly Report"命令生成合并报告。`
                );
                
                // 询问是否立即生成报告
                const generateNow = await vscode.window.showInformationMessage(
                    '是否立即生成今日的多项目日报？',
                    '生成日报',
                    '稍后生成'
                );
                
                if (generateNow === '生成日报') {
                    vscode.commands.executeCommand('gitWorkSummary.generateDailyReport');
                }
                
            } catch (error) {
                log(`快速配置多项目失败: ${error}`);
                vscode.window.showErrorMessage(`快速配置多项目失败: ${error}`);
            }
        }
    );

    // 注册配置变更监听
    const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('gitWorkSummary')) {
            gitWorkSummaryManager.updateConfiguration();
        }
    });

    // 启动定时任务
    gitWorkSummaryManager.start().catch(error => {
        log(`启动 Git Work Summary 失败: ${error}`);
        vscode.window.showErrorMessage(`启动 Git Work Summary 失败: ${error}`);
    });

    // 注册到上下文
    context.subscriptions.push(
        generateDailyReportCommand,
        generateDailyReportForDateCommand,
        showUncommittedSummaryCommand,
        configureCommand,
        viewHistoryCommand,
        generateWeeklyReportCommand,
        generateWeeklyReportForDateCommand,
        resetProcessedCommitsCommand,
        debugGitStatusCommand,
        testAICommand,
        printPromptsCommand,
        showCurrentPromptsCommand,
        debugMultiProjectCommand,
        quickSetupMultiProjectCommand,
        configChangeListener,
        gitWorkSummaryManager,
        showLogsCommand
    );

    // 显示启动消息
    vscode.window.showInformationMessage('Git Work Summary 扩展已启动，开始定时监控今日代码变更并生成日报');
}

export function deactivate() {
    log('Git Work Summary 扩展已停用');
    if (gitWorkSummaryManager) {
        gitWorkSummaryManager.dispose();
    }
} 