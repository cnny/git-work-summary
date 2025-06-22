"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitWorkSummaryManager = void 0;
const vscode = __importStar(require("vscode"));
const multiProjectManager_1 = require("./multiProjectManager");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class GitWorkSummaryManager {
    constructor(gitAnalyzer, aiService, reportService, configManager, storage) {
        this.gitAnalyzer = gitAnalyzer;
        this.aiService = aiService;
        this.reportService = reportService;
        this.configManager = configManager;
        this.storage = storage;
        this.isProcessing = false;
        this.hasLoggedNoChanges = false;
        // 多项目的最后处理提交哈希映射（项目路径 -> 最后提交哈希）
        this.lastProcessedMultiProjectCommits = new Map();
        this.multiProjectManager = new multiProjectManager_1.MultiProjectManager(gitAnalyzer, aiService, configManager);
        // 创建全局锁文件路径和实例ID
        this.lockFilePath = path.join(os.tmpdir(), 'git-work-summary.lock');
        this.instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 获取全局锁，防止多个实例同时处理定时任务
     */
    async acquireGlobalLock() {
        try {
            // 检查锁文件是否存在
            if (fs.existsSync(this.lockFilePath)) {
                const lockContent = fs.readFileSync(this.lockFilePath, 'utf-8');
                const lockData = JSON.parse(lockContent);
                // 检查锁是否过期（超过10分钟认为过期）
                const lockAge = Date.now() - lockData.timestamp;
                if (lockAge < 10 * 60 * 1000) {
                    // 锁未过期，检查是否是当前实例
                    if (lockData.instanceId === this.instanceId) {
                        return true; // 当前实例持有锁
                    }
                    console.log(`🔒 定时任务被其他实例锁定 (${lockData.instanceId})`);
                    return false; // 其他实例持有锁
                }
                else {
                    console.log(`🔓 清理过期锁文件`);
                    fs.unlinkSync(this.lockFilePath);
                }
            }
            // 创建新锁
            const lockData = {
                instanceId: this.instanceId,
                timestamp: Date.now(),
                pid: process.pid
            };
            fs.writeFileSync(this.lockFilePath, JSON.stringify(lockData), 'utf-8');
            console.log(`🔒 获取全局锁成功 (${this.instanceId})`);
            return true;
        }
        catch (error) {
            console.warn(`⚠️ 获取全局锁失败: ${error}`);
            return false;
        }
    }
    /**
     * 释放全局锁
     */
    releaseGlobalLock() {
        try {
            if (fs.existsSync(this.lockFilePath)) {
                const lockContent = fs.readFileSync(this.lockFilePath, 'utf-8');
                const lockData = JSON.parse(lockContent);
                // 只有当前实例才能释放锁
                if (lockData.instanceId === this.instanceId) {
                    fs.unlinkSync(this.lockFilePath);
                    console.log(`🔓 释放全局锁 (${this.instanceId})`);
                }
            }
        }
        catch (error) {
            console.warn(`⚠️ 释放全局锁失败: ${error}`);
        }
    }
    async start() {
        const config = this.configManager.getConfiguration();
        if (!config.enabled) {
            console.log('📴 Git Work Summary 已禁用');
            return;
        }
        // 初始化最后处理的提交哈希
        await this.initializeLastProcessedCommit();
        // 启动定时扫描今日提交
        this.scheduleNextDailyCheck();
        // 启动周报定时任务
        if (config.enableWeeklyReport) {
            this.scheduleWeeklyReport();
        }
        console.log(`🚀 Git Work Summary 已启动`);
        console.log(`⏰ 定时扫描间隔: ${config.interval} 分钟`);
        console.log(`📊 周报功能: ${config.enableWeeklyReport ? '已启用' : '已禁用'}`);
        console.log(`📝 包含未提交变更: ${config.includeUncommittedChanges ? '已启用' : '已禁用'}`);
    }
    stop() {
        if (this.dailyTimer) {
            clearTimeout(this.dailyTimer);
            this.dailyTimer = undefined;
        }
        if (this.weeklyTimer) {
            clearTimeout(this.weeklyTimer);
            this.weeklyTimer = undefined;
        }
        // 释放全局锁
        this.releaseGlobalLock();
        console.log('⏹️ Git Work Summary 已停止');
    }
    dispose() {
        this.stop();
    }
    updateConfiguration() {
        console.log('🔄 配置已更新，重新启动服务...');
        this.stop();
        this.start().catch(error => {
            console.error('重新启动服务失败:', error);
        });
    }
    /**
     * 初始化最后处理的提交哈希
     */
    async initializeLastProcessedCommit() {
        try {
            const config = this.configManager.getConfiguration();
            const today = new Date();
            const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            if (config.enableMultiProject && config.projectPaths.length > 0) {
                // 多项目模式：初始化所有项目的最后处理提交哈希
                console.log(`🔧 初始化多项目最后处理提交...`);
                for (const projectPath of config.projectPaths) {
                    try {
                        const commits = await this.gitAnalyzer.getCommitsByDateRange(projectPath, dayStart, dayEnd, config.onlyMyCommits, config.scanAllBranches);
                        const latestHash = commits.length > 0 ? commits[0].hash : '';
                        this.lastProcessedMultiProjectCommits.set(projectPath, latestHash);
                        const projectName = this.multiProjectManager.getProjectName(projectPath, config.projectNames);
                        console.log(`  📁 ${projectName}: ${latestHash.substring(0, 8) || '无提交'}`);
                    }
                    catch (error) {
                        console.warn(`⚠️ 初始化项目 ${projectPath} 失败:`, error);
                        this.lastProcessedMultiProjectCommits.set(projectPath, '');
                    }
                }
            }
            else {
                // 单项目模式：初始化当前工作区的最后处理提交哈希
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    return;
                }
                const commits = await this.gitAnalyzer.getCommitsByDateRange(workspaceFolder.uri.fsPath, dayStart, dayEnd, config.onlyMyCommits, config.scanAllBranches);
                // 设置最后处理的提交哈希为今日最新提交
                this.lastProcessedCommitHash = commits.length > 0 ? commits[0].hash : undefined;
                if (this.lastProcessedCommitHash) {
                    console.log(`📌 初始化单项目最后处理提交: ${this.lastProcessedCommitHash.substring(0, 8)}`);
                }
                else {
                    console.log(`📌 今日暂无提交记录`);
                }
            }
        }
        catch (error) {
            console.warn('⚠️ 初始化最后处理提交失败:', error);
        }
    }
    /**
     * 手动生成今日日报
     */
    async generateTodayReport() {
        const today = new Date();
        await this.generateDailyReport(today);
    }
    /**
     * 手动生成指定日期的日报
     */
    async generateDailyReport(date) {
        if (this.isProcessing) {
            vscode.window.showWarningMessage('正在生成日报，请稍候...');
            return;
        }
        try {
            this.isProcessing = true;
            const config = this.configManager.getConfiguration();
            // 统一使用多项目逻辑
            const projectPaths = this.getEffectiveProjectPaths(config);
            if (projectPaths.length === 0) {
                throw new Error('未找到工作区或项目路径');
            }
            console.log(`\n📊 开始生成日报 (${projectPaths.length} 个项目)...`);
            // 显示进度提示
            const isToday = this.isSameDay(date, new Date());
            const dateStr = isToday ? '今日' : date.toLocaleDateString('zh-CN');
            const projectType = projectPaths.length === 1 ? '' : '多项目';
            vscode.window.showInformationMessage(`🔄 正在生成${dateStr}${projectType}日报，请稍候...`);
            // 实现一日一报机制
            await this.processUnifiedDailyReport(date, projectPaths);
        }
        catch (error) {
            console.error('❌ 生成日报失败:', error);
            vscode.window.showErrorMessage(`❌ 生成日报失败: ${error}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * 手动生成本周周报
     */
    async generateWeeklyReport() {
        // 生成本周周报
        await this.generateWeeklyReportForPeriod(0);
    }
    async generateWeeklyReportForDate() {
        // 让用户选择周期
        const options = [
            { label: '本周', description: '当前周的工作报告', value: 0 },
            { label: '上周', description: '上一周的工作报告', value: -1 },
            { label: '上上周', description: '两周前的工作报告', value: -2 },
            { label: '三周前', description: '三周前的工作报告', value: -3 },
            { label: '四周前', description: '四周前的工作报告', value: -4 },
            { label: '自定义', description: '选择具体的周期', value: 'custom' }
        ];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: '选择要生成周报的时间周期',
            title: '生成指定周期的周报'
        });
        if (!selected) {
            return;
        }
        if (selected.value === 'custom') {
            // 自定义日期选择
            const dateInput = await vscode.window.showInputBox({
                prompt: '请输入日期 (格式: YYYY-MM-DD)，将生成包含该日期的周报',
                placeHolder: '例如: 2024-01-15',
                validateInput: (value) => {
                    if (!value)
                        return '请输入日期';
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        return '请输入有效的日期格式 (YYYY-MM-DD)';
                    }
                    return null;
                }
            });
            if (!dateInput) {
                return;
            }
            const customDate = new Date(dateInput);
            await this.generateWeeklyReportForCustomDate(customDate);
        }
        else {
            await this.generateWeeklyReportForPeriod(selected.value);
        }
    }
    async generateWeeklyReportForPeriod(weeksOffset) {
        if (this.isProcessing) {
            vscode.window.showWarningMessage('正在生成周报，请稍候...');
            return;
        }
        try {
            this.isProcessing = true;
            const config = this.configManager.getConfiguration();
            // 计算目标周的时间范围
            const now = new Date();
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + (weeksOffset * 7));
            const startOfWeek = this.getStartOfWeek(targetDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            const periodName = this.getPeriodName(weeksOffset);
            // 统一使用多项目逻辑
            const projectPaths = this.getEffectiveProjectPaths(config);
            if (projectPaths.length === 0) {
                throw new Error('未找到工作区或项目路径');
            }
            console.log(`\n📊 开始生成${periodName}周报 (${projectPaths.length} 个项目)...`);
            console.log(`📅 时间范围: ${startOfWeek.toLocaleDateString('zh-CN')} - ${endOfWeek.toLocaleDateString('zh-CN')}`);
            // 显示进度提示
            const projectType = projectPaths.length === 1 ? '' : '多项目';
            vscode.window.showInformationMessage(`🔄 正在生成${periodName}${projectType}周报，请稍候...`);
            const result = await this.multiProjectManager.generateMultiProjectWeeklyReport(startOfWeek, endOfWeek, projectPaths);
            if (result) {
                // 保存周报到存储
                await this.storage.saveSummary(result);
                // 尝试上报
                await this.tryReportSummary(result, `${periodName}周报`);
                if (projectPaths.length === 1) {
                    vscode.window.showInformationMessage(`✅ ${periodName}周报生成完成`);
                }
                else {
                    vscode.window.showInformationMessage(`✅ ${periodName}多项目周报生成完成，涉及 ${result.projectStats.length} 个项目`);
                }
            }
            else {
                vscode.window.showInformationMessage(`ℹ️ ${periodName}所有项目均无提交记录`);
            }
        }
        catch (error) {
            const periodName = this.getPeriodName(weeksOffset);
            console.error(`❌ 生成${periodName}周报失败:`, error);
            vscode.window.showErrorMessage(`❌ 生成${periodName}周报失败: ${error}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async generateWeeklyReportForCustomDate(date) {
        if (this.isProcessing) {
            vscode.window.showWarningMessage('正在生成周报，请稍候...');
            return;
        }
        try {
            this.isProcessing = true;
            const config = this.configManager.getConfiguration();
            // 计算包含指定日期的周范围
            const startOfWeek = this.getStartOfWeek(date);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            const dateStr = date.toLocaleDateString('zh-CN');
            // 统一使用多项目逻辑
            const projectPaths = this.getEffectiveProjectPaths(config);
            if (projectPaths.length === 0) {
                throw new Error('未找到工作区或项目路径');
            }
            console.log(`\n📊 开始生成包含 ${dateStr} 的周报 (${projectPaths.length} 个项目)...`);
            console.log(`📅 时间范围: ${startOfWeek.toLocaleDateString('zh-CN')} - ${endOfWeek.toLocaleDateString('zh-CN')}`);
            // 显示进度提示
            const projectType = projectPaths.length === 1 ? '' : '多项目';
            vscode.window.showInformationMessage(`🔄 正在生成包含 ${dateStr} 的${projectType}周报，请稍候...`);
            const result = await this.multiProjectManager.generateMultiProjectWeeklyReport(startOfWeek, endOfWeek, projectPaths);
            if (result) {
                // 保存周报到存储
                await this.storage.saveSummary(result);
                // 尝试上报
                await this.tryReportSummary(result, `指定周期周报`);
                if (projectPaths.length === 1) {
                    vscode.window.showInformationMessage(`✅ 包含 ${dateStr} 的周报生成完成`);
                }
                else {
                    vscode.window.showInformationMessage(`✅ 包含 ${dateStr} 的多项目周报生成完成，涉及 ${result.projectStats.length} 个项目`);
                }
            }
            else {
                vscode.window.showInformationMessage(`ℹ️ 包含 ${dateStr} 的周期内所有项目均无提交记录`);
            }
        }
        catch (error) {
            const dateStr = date.toLocaleDateString('zh-CN');
            console.error(`❌ 生成包含 ${dateStr} 的周报失败:`, error);
            vscode.window.showErrorMessage(`❌ 生成包含 ${dateStr} 的周报失败: ${error}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    getPeriodName(weeksOffset) {
        switch (weeksOffset) {
            case 0: return '本周';
            case -1: return '上周';
            case -2: return '上上周';
            case -3: return '三周前';
            case -4: return '四周前';
            default: return weeksOffset < 0 ? `${Math.abs(weeksOffset)}周前` : `${weeksOffset}周后`;
        }
    }
    /**
     * 定时检查今日是否有新提交，如果有则更新日报
     */
    async checkAndGenerateTodayReport() {
        if (this.isProcessing) {
            return;
        }
        // 获取全局锁，防止多个实例重复处理
        if (!(await this.acquireGlobalLock())) {
            return;
        }
        try {
            const config = this.configManager.getConfiguration();
            const today = new Date();
            const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            // 统一使用多项目逻辑
            const projectPaths = this.getEffectiveProjectPaths(config);
            if (projectPaths.length > 0) {
                await this.checkAndGenerateUnifiedReport(today, dayStart, dayEnd, config, projectPaths);
            }
        }
        catch (error) {
            console.error('⚠️ 定时检查失败:', error);
        }
    }
    /**
     * 处理统一日报生成（一日一报机制）
     */
    async processUnifiedDailyReport(date, projectPaths) {
        const dateStr = date.toLocaleDateString('zh-CN');
        const dateKey = this.formatDateKey(date);
        // 检查是否已存在当日日报
        const allSummaries = await this.storage.getAllSummaries();
        const existingReport = allSummaries.find(s => s.type === 'daily' && s.date === dateKey);
        // 生成新的日报数据
        const result = await this.multiProjectManager.generateMultiProjectDailyReport(date, projectPaths);
        if (!result) {
            vscode.window.showInformationMessage(`ℹ️ ${dateStr} 所有项目均无提交记录`);
            return;
        }
        let dailyReport;
        if (existingReport) {
            // 更新现有日报
            dailyReport = {
                ...existingReport,
                commits: result.commits,
                uncommittedChanges: result.uncommittedChanges,
                summary: result.summary,
                mainTasks: result.mainTasks,
                projectStats: result.projectStats,
                reportStatus: 'pending',
                reportError: undefined,
                timestamp: Date.now() // 更新时间戳
            };
            console.log(`🔄 更新现有日报: ${existingReport.id}`);
        }
        else {
            // 创建新日报
            dailyReport = result;
            console.log(`📝 创建新日报: ${dailyReport.id}`);
        }
        // 保存日报
        await this.storage.saveSummary(dailyReport);
        // 尝试上报
        await this.tryReportSummary(dailyReport, '日报');
        // 显示成功消息
        if (projectPaths.length === 1) {
            if (existingReport) {
                vscode.window.showInformationMessage(`✅ ${dateStr} 日报已更新`);
            }
            else {
                vscode.window.showInformationMessage(`✅ ${dateStr} 日报生成完成`);
            }
        }
        else {
            if (existingReport) {
                vscode.window.showInformationMessage(`✅ ${dateStr} 多项目日报已更新，涉及 ${result.projectStats.length} 个项目`);
            }
            else {
                vscode.window.showInformationMessage(`✅ ${dateStr} 多项目日报生成完成，涉及 ${result.projectStats.length} 个项目`);
            }
        }
        console.log(`🎉 ${dateStr} 日报处理完成`);
    }
    /**
     * 统一检查并生成日报（支持单项目和多项目）
     */
    async checkAndGenerateUnifiedReport(today, dayStart, dayEnd, config, projectPaths) {
        const isMultiProject = projectPaths.length > 1;
        console.log(`🏢 检查${isMultiProject ? '多项目' : '单项目'}新变更...`);
        let hasAnyNewCommits = false;
        const projectsWithNewCommits = [];
        // 检查每个项目是否有新提交
        for (const projectPath of projectPaths) {
            try {
                const commits = await this.gitAnalyzer.getCommitsByDateRange(projectPath, dayStart, dayEnd, config.onlyMyCommits, config.scanAllBranches);
                const latestCommitHash = commits.length > 0 ? commits[0].hash : undefined;
                const lastProcessedHash = this.lastProcessedMultiProjectCommits.get(projectPath);
                const hasNewCommits = latestCommitHash && latestCommitHash !== lastProcessedHash;
                if (hasNewCommits) {
                    hasAnyNewCommits = true;
                    const projectName = this.multiProjectManager.getProjectName(projectPath, config.projectNames);
                    projectsWithNewCommits.push(projectName);
                    console.log(`📝 项目 ${projectName} 有新提交: ${latestCommitHash?.substring(0, 8)}`);
                }
                // 更新最后处理的提交哈希
                this.lastProcessedMultiProjectCommits.set(projectPath, latestCommitHash || '');
            }
            catch (error) {
                console.warn(`⚠️ 检查项目 ${projectPath} 失败:`, error);
            }
        }
        // 只有在至少一个项目有新提交时才生成日报
        if (hasAnyNewCommits) {
            console.log(`🔄 检测到${isMultiProject ? '多项目' : '单项目'}新变更，更新日报...`);
            console.log(`📁 涉及项目: ${projectsWithNewCommits.join(', ')}`);
            await this.generateTodayReport();
            this.hasLoggedNoChanges = false; // 重置无变更日志标记
        }
        else {
            // 没有新变更时，只记录一次日志（避免频繁输出）
            if (!this.hasLoggedNoChanges) {
                const projectType = isMultiProject ? '所有项目' : '项目';
                console.log(`✅ ${projectType}今日暂无新变更，跳过日报生成`);
                this.hasLoggedNoChanges = true;
            }
        }
    }
    /**
     * 处理周报生成
     */
    async processWeeklyReport(startDate, endDate, commits) {
        const weekStr = `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`;
        console.log(`🤖 开始AI分析生成周报...`);
        // 获取历史上下文（用于识别跨周任务）
        const historySummaries = await this.storage.getRecentSummaries(14);
        console.log(`📚 获取 ${historySummaries.length} 个历史总结作为周报上下文`);
        // 生成AI总结
        const summary = await this.aiService.generateReport(commits, historySummaries, 'weekly', { start: startDate, end: endDate });
        console.log(`✅ AI分析完成`);
        // 创建周报
        const weeklyReport = {
            id: this.generateId(),
            timestamp: Date.now(),
            type: 'weekly',
            date: this.formatDateKey(startDate) + '_' + this.formatDateKey(endDate),
            commits,
            summary: summary.content,
            mainTasks: summary.mainTasks,
            reportStatus: 'pending'
        };
        console.log(`📊 创建周报: ${weeklyReport.id}`);
        // 保存周报
        await this.storage.saveSummary(weeklyReport);
        // 尝试上报
        await this.tryReportSummary(weeklyReport, '周报');
        console.log(`🎉 ${weekStr} 周报处理完成`);
    }
    /**
     * 尝试上报总结
     */
    async tryReportSummary(summary, type) {
        console.log(`📤 开始上报${type}...`);
        try {
            await this.reportService.reportSummary(summary);
            summary.reportStatus = 'success';
            console.log(`✅ ${type}上报成功`);
        }
        catch (error) {
            summary.reportStatus = 'failed';
            summary.reportError = String(error);
            console.log(`❌ ${type}上报失败: ${error}`);
        }
        // 更新状态
        await this.storage.updateSummary(summary);
    }
    /**
     * 安排下一次日报检查
     */
    scheduleNextDailyCheck() {
        const config = this.configManager.getConfiguration();
        const intervalMs = config.interval * 60 * 1000;
        this.dailyTimer = setTimeout(async () => {
            try {
                await this.checkAndGenerateTodayReport();
            }
            catch (error) {
                console.error('⚠️ 定时日报检查失败:', error);
            }
            // 安排下一次执行
            this.scheduleNextDailyCheck();
        }, intervalMs);
    }
    /**
     * 安排周报定时任务
     */
    scheduleWeeklyReport() {
        const config = this.configManager.getConfiguration();
        const now = new Date();
        const currentDay = now.getDay();
        let daysUntilReport = config.weeklyReportDay - currentDay;
        if (daysUntilReport <= 0) {
            daysUntilReport += 7; // 下周
        }
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + daysUntilReport);
        scheduledDate.setHours(18, 0, 0, 0); // 18:00生成周报
        const delay = scheduledDate.getTime() - now.getTime();
        this.weeklyTimer = setTimeout(async () => {
            try {
                // 获取全局锁，防止多个实例重复处理
                if (await this.acquireGlobalLock()) {
                    await this.generateWeeklyReport();
                }
                else {
                    console.log('🔒 周报生成被其他实例锁定，跳过本次执行');
                }
            }
            catch (error) {
                console.error('⚠️ 定时周报生成失败:', error);
            }
            // 安排下一次
            this.scheduleWeeklyReport();
        }, delay);
        console.log(`📊 周报已安排，将在 ${scheduledDate.toLocaleString()} 生成`);
    }
    /**
     * 获取一周的开始日期（可配置）
     */
    getStartOfWeek(date) {
        const config = this.configManager.getConfiguration();
        const weekStartDay = config.weekStartDay; // 0=周日, 1=周一, ..., 6=周六
        const d = new Date(date);
        const currentDay = d.getDay(); // 0=周日, 1=周一, ..., 6=周六
        // 计算需要往前推多少天到达周起始日
        let daysToSubtract = currentDay - weekStartDay;
        if (daysToSubtract < 0) {
            daysToSubtract += 7; // 如果是负数，需要加7天
        }
        d.setDate(d.getDate() - daysToSubtract);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    /**
     * 判断两个日期是否为同一天
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
    /**
     * 格式化日期为键值（YYYY-MM-DD）
     */
    formatDateKey(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }
    /**
     * 生成唯一ID
     */
    generateId() {
        return `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 获取有效的项目路径列表
     * 如果未启用多项目或没有配置项目路径，则返回当前工作区路径
     */
    getEffectiveProjectPaths(config) {
        if (config.enableMultiProject && config.projectPaths.length > 0) {
            return config.projectPaths;
        }
        // 回退到当前工作区
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            return [workspaceFolder.uri.fsPath];
        }
        return [];
    }
}
exports.GitWorkSummaryManager = GitWorkSummaryManager;
//# sourceMappingURL=gitWorkSummaryManager.js.map