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
const logger_1 = require("./logger");
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
     * 获取任务锁，防止多个实例在同一时间窗口重复执行
     * 与全局锁不同，任务锁会持续到时间窗口结束，不立即释放
     */
    async acquireTaskLock(taskKey) {
        try {
            const taskLockPath = this.lockFilePath + '.' + taskKey;
            // 检查任务锁是否已存在
            if (fs.existsSync(taskLockPath)) {
                try {
                    const lockContent = fs.readFileSync(taskLockPath, 'utf-8');
                    const lockData = JSON.parse(lockContent);
                    // 检查锁是否在有效期内（基于任务的时间窗口）
                    const now = Date.now();
                    const lockAge = now - lockData.timestamp;
                    // 任务锁的有效期为配置间隔的1.5倍，确保时间窗口覆盖
                    const config = this.configManager.getConfiguration();
                    const taskLockDuration = config.interval * 60 * 1000 * 1.5;
                    if (lockAge < taskLockDuration) {
                        // 检查是否是当前实例
                        if (lockData.instanceId === this.instanceId) {
                            (0, logger_1.log)(`🔒 当前实例持有任务锁 (${taskKey})`);
                            return true;
                        }
                        // 检查锁定进程是否还存在
                        if (lockData.pid && this.isProcessRunning(lockData.pid)) {
                            (0, logger_1.log)(`🔒 任务已被其他实例锁定 (${lockData.instanceId}, PID: ${lockData.pid}, 剩余: ${Math.round((taskLockDuration - lockAge) / 60000)}分钟)`);
                            return false;
                        }
                        else {
                            (0, logger_1.log)(`🔓 任务锁定进程已不存在，清理过期任务锁 (PID: ${lockData.pid})`);
                            fs.unlinkSync(taskLockPath);
                        }
                    }
                    else {
                        (0, logger_1.log)(`🔓 清理过期任务锁 (过期 ${Math.round(lockAge / 60000)} 分钟)`);
                        fs.unlinkSync(taskLockPath);
                    }
                }
                catch (parseError) {
                    (0, logger_1.log)(`⚠️ 任务锁文件格式错误，清理: ${parseError}`);
                    fs.unlinkSync(taskLockPath);
                }
            }
            // 创建新的任务锁
            const lockData = {
                taskKey,
                instanceId: this.instanceId,
                timestamp: Date.now(),
                pid: process.pid,
                type: 'task_lock'
            };
            const lockContent = JSON.stringify(lockData, null, 2);
            // 原子写入任务锁
            const tempLockPath = taskLockPath + '.tmp.' + Date.now();
            try {
                fs.writeFileSync(tempLockPath, lockContent, 'utf-8');
                fs.renameSync(tempLockPath, taskLockPath);
                (0, logger_1.log)(`🔒 获取任务锁成功 (${taskKey}, PID: ${process.pid})`);
                return true;
            }
            catch (writeError) {
                if (fs.existsSync(tempLockPath)) {
                    fs.unlinkSync(tempLockPath);
                }
                throw writeError;
            }
        }
        catch (error) {
            (0, logger_1.log)(`⚠️ 获取任务锁失败: ${error}`);
            (0, logger_1.log)(`   任务键: ${taskKey}`);
            (0, logger_1.log)(`   实例ID: ${this.instanceId}`);
            return false;
        }
    }
    /**
     * 获取全局锁，防止多个实例同时处理定时任务
     * 带重试机制的版本
     */
    async acquireGlobalLock(retryCount = 3) {
        try {
            // 检查锁文件是否存在
            if (fs.existsSync(this.lockFilePath)) {
                try {
                    const lockContent = fs.readFileSync(this.lockFilePath, 'utf-8');
                    // 增强的JSON解析错误处理
                    let lockData;
                    try {
                        lockData = JSON.parse(lockContent);
                        // 验证文件完整性（如果存在校验和）
                        if (lockData.checksum) {
                            const contentForCheck = JSON.stringify({
                                ...lockData,
                                checksum: ''
                            }, null, 2);
                            const expectedChecksum = this.calculateChecksum(contentForCheck);
                            if (lockData.checksum !== expectedChecksum) {
                                (0, logger_1.log)(`⚠️ 锁文件校验和不匹配，可能已损坏 (期望: ${expectedChecksum}, 实际: ${lockData.checksum})`);
                                fs.unlinkSync(this.lockFilePath);
                                lockData = null; // 重置为null，继续创建新锁
                            }
                        }
                    }
                    catch (parseError) {
                        (0, logger_1.log)(`⚠️ 锁文件JSON格式错误，清理损坏的锁文件: ${parseError}`);
                        (0, logger_1.log)(`   错误位置: ${parseError.message}`);
                        (0, logger_1.log)(`   文件内容长度: ${lockContent.length} 字符`);
                        (0, logger_1.log)(`   文件内容预览: ${lockContent.substring(0, 100)}${lockContent.length > 100 ? '...' : ''}`);
                        fs.unlinkSync(this.lockFilePath);
                        // 继续创建新锁
                    }
                    if (lockData) {
                        // 验证锁数据结构
                        if (!lockData.instanceId || !lockData.timestamp) {
                            (0, logger_1.log)(`⚠️ 锁文件数据结构异常，清理锁文件`);
                            fs.unlinkSync(this.lockFilePath);
                        }
                        else {
                            // 检查锁是否过期（超过10分钟认为过期）
                            const lockAge = Date.now() - lockData.timestamp;
                            if (lockAge < 10 * 60 * 1000) {
                                // 锁未过期，检查是否是当前实例
                                if (lockData.instanceId === this.instanceId) {
                                    (0, logger_1.log)(`🔒 当前实例持有锁 (${this.instanceId})`);
                                    return true; // 当前实例持有锁
                                }
                                // 检查进程是否还存在（进一步验证锁的有效性）
                                if (lockData.pid && this.isProcessRunning(lockData.pid)) {
                                    (0, logger_1.log)(`🔒 定时任务被其他实例锁定 (${lockData.instanceId}, PID: ${lockData.pid})`);
                                    return false; // 其他实例持有锁且进程存在
                                }
                                else {
                                    (0, logger_1.log)(`🔓 锁定进程已不存在，清理过期锁文件 (PID: ${lockData.pid})`);
                                    fs.unlinkSync(this.lockFilePath);
                                }
                            }
                            else {
                                (0, logger_1.log)(`🔓 清理过期锁文件 (过期 ${Math.round(lockAge / 60000)} 分钟)`);
                                fs.unlinkSync(this.lockFilePath);
                            }
                        }
                    }
                }
                catch (fileError) {
                    (0, logger_1.log)(`⚠️ 读取锁文件失败: ${fileError}`);
                    // 如果无法读取锁文件，尝试删除并继续
                    try {
                        fs.unlinkSync(this.lockFilePath);
                    }
                    catch (unlinkError) {
                        (0, logger_1.log)(`⚠️ 删除损坏锁文件失败: ${unlinkError}`);
                    }
                }
            }
            // 创建新锁 - 使用原子写入机制
            const lockData = {
                instanceId: this.instanceId,
                timestamp: Date.now(),
                pid: process.pid,
                version: '1.1.1',
                checksum: '' // 用于验证文件完整性
            };
            // 计算校验和
            const lockContent = JSON.stringify(lockData, null, 2);
            lockData.checksum = this.calculateChecksum(lockContent);
            const finalLockContent = JSON.stringify(lockData, null, 2);
            // 确保临时目录存在
            const tempDir = require('os').tmpdir();
            if (!fs.existsSync(tempDir)) {
                throw new Error(`临时目录不存在: ${tempDir}`);
            }
            // 原子写入：先写入临时文件，再重命名
            const tempLockPath = this.lockFilePath + '.tmp.' + Date.now();
            try {
                // 写入临时文件
                fs.writeFileSync(tempLockPath, finalLockContent, 'utf-8');
                // 原子性重命名（在大多数文件系统上这是原子操作）
                fs.renameSync(tempLockPath, this.lockFilePath);
                (0, logger_1.log)(`🔒 获取全局锁成功 (${this.instanceId}, PID: ${process.pid})`);
                return true;
            }
            catch (writeError) {
                // 清理临时文件
                try {
                    if (fs.existsSync(tempLockPath)) {
                        fs.unlinkSync(tempLockPath);
                    }
                }
                catch (cleanupError) {
                    (0, logger_1.log)(`⚠️ 清理临时锁文件失败: ${cleanupError}`);
                }
                throw writeError;
            }
        }
        catch (error) {
            (0, logger_1.log)(`⚠️ 获取全局锁失败: ${error}`);
            (0, logger_1.log)(`   锁文件路径: ${this.lockFilePath}`);
            (0, logger_1.log)(`   当前实例ID: ${this.instanceId}`);
            (0, logger_1.log)(`   剩余重试次数: ${retryCount - 1}`);
            // 如果还有重试次数，短暂等待后重试
            if (retryCount > 1) {
                (0, logger_1.log)(`🔄 等待 ${200 * (4 - retryCount)}ms 后重试获取锁...`);
                await new Promise(resolve => setTimeout(resolve, 200 * (4 - retryCount)));
                return this.acquireGlobalLock(retryCount - 1);
            }
            return false;
        }
    }
    /**
     * 检查进程是否还在运行
     */
    isProcessRunning(pid) {
        try {
            // 发送信号0来检查进程是否存在，不会实际杀死进程
            process.kill(pid, 0);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 计算字符串的简单校验和
     */
    calculateChecksum(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16);
    }
    /**
     * 清理遗留的临时锁文件和过期任务锁
     */
    cleanupTempLockFiles() {
        try {
            const tempDir = require('os').tmpdir();
            const lockFileBaseName = require('path').basename(this.lockFilePath);
            // 查找所有相关锁文件
            const files = fs.readdirSync(tempDir);
            const lockFiles = files.filter(file => file.startsWith(lockFileBaseName));
            lockFiles.forEach(file => {
                try {
                    const filePath = require('path').join(tempDir, file);
                    const stats = fs.statSync(filePath);
                    if (file.includes('.tmp.')) {
                        // 清理临时文件：超过5分钟
                        if (Date.now() - stats.mtimeMs > 5 * 60 * 1000) {
                            fs.unlinkSync(filePath);
                            (0, logger_1.log)(`🧹 清理过期临时锁文件: ${file}`);
                        }
                    }
                    else if (file !== lockFileBaseName) {
                        // 清理任务锁文件：检查内容和有效期
                        try {
                            const lockContent = fs.readFileSync(filePath, 'utf-8');
                            const lockData = JSON.parse(lockContent);
                            if (lockData.type === 'task_lock') {
                                const config = this.configManager.getConfiguration();
                                const maxAge = lockData.taskKey?.startsWith('weekly_') ?
                                    7 * 24 * 60 * 60 * 1000 : // 周报锁：7天
                                    config.interval * 60 * 1000 * 2; // 日报锁：2倍间隔
                                if (Date.now() - lockData.timestamp > maxAge) {
                                    fs.unlinkSync(filePath);
                                    (0, logger_1.log)(`🧹 清理过期任务锁: ${file}`);
                                }
                            }
                        }
                        catch (parseError) {
                            // 如果无法解析，且文件较老，则删除
                            if (Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
                                fs.unlinkSync(filePath);
                                (0, logger_1.log)(`🧹 清理损坏的锁文件: ${file}`);
                            }
                        }
                    }
                }
                catch (error) {
                    (0, logger_1.log)(`⚠️ 清理锁文件失败: ${file}, ${error}`);
                }
            });
        }
        catch (error) {
            (0, logger_1.log)(`⚠️ 清理锁文件失败: ${error}`);
        }
    }
    /**
     * 释放全局锁
     */
    releaseGlobalLock() {
        try {
            if (fs.existsSync(this.lockFilePath)) {
                try {
                    const lockContent = fs.readFileSync(this.lockFilePath, 'utf-8');
                    const lockData = JSON.parse(lockContent);
                    // 只有当前实例才能释放锁
                    if (lockData.instanceId === this.instanceId) {
                        fs.unlinkSync(this.lockFilePath);
                        (0, logger_1.log)(`🔓 释放全局锁 (${this.instanceId})`);
                    }
                    else {
                        (0, logger_1.log)(`🔒 锁文件属于其他实例 (${lockData.instanceId})，跳过释放`);
                    }
                }
                catch (parseError) {
                    // 如果无法解析锁文件，但确实存在，直接删除
                    (0, logger_1.log)(`⚠️ 锁文件格式异常，强制清理: ${parseError}`);
                    fs.unlinkSync(this.lockFilePath);
                }
            }
            else {
                (0, logger_1.log)(`🔓 锁文件不存在，无需释放`);
            }
        }
        catch (error) {
            (0, logger_1.log)(`⚠️ 释放全局锁失败: ${error}`);
            (0, logger_1.log)(`   锁文件路径: ${this.lockFilePath}`);
            (0, logger_1.log)(`   当前实例ID: ${this.instanceId}`);
        }
    }
    async start() {
        const config = this.configManager.getConfiguration();
        if (!config.enabled) {
            (0, logger_1.log)('📴 Git Work Summary 已禁用');
            return;
        }
        // 清理遗留的临时锁文件
        this.cleanupTempLockFiles();
        // 初始化最后处理的提交哈希
        await this.initializeLastProcessedCommit();
        // 启动定时扫描今日提交
        this.scheduleNextDailyCheck();
        // 启动周报定时任务
        if (config.enableWeeklyReport) {
            this.scheduleWeeklyReport();
        }
        (0, logger_1.log)(`🚀 Git Work Summary 已启动`);
        (0, logger_1.log)(`⏰ 定时扫描间隔: ${config.interval} 分钟`);
        (0, logger_1.log)(`📊 周报功能: ${config.enableWeeklyReport ? '已启用' : '已禁用'}`);
        (0, logger_1.log)(`📝 包含未提交变更: ${config.includeUncommittedChanges ? '已启用' : '已禁用'}`);
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
        (0, logger_1.log)('⏹️ Git Work Summary 已停止');
    }
    dispose() {
        this.stop();
    }
    updateConfiguration() {
        (0, logger_1.log)('🔄 配置已更新，更新所有服务配置...');
        // 更新所有服务的配置
        this.aiService.updateConfiguration();
        this.reportService.updateConfiguration();
        // 重新启动定时服务
        this.stop();
        this.start().catch(error => {
            (0, logger_1.log)(`重新启动服务失败: ${error}`);
        });
        (0, logger_1.log)('✅ 配置更新完成，所有服务已应用新配置');
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
                (0, logger_1.log)(`🔧 初始化多项目最后处理提交...`);
                for (const projectPath of config.projectPaths) {
                    try {
                        const commits = await this.gitAnalyzer.getCommitsByDateRange(projectPath, dayStart, dayEnd, config.onlyMyCommits, config.scanAllBranches);
                        const latestHash = commits.length > 0 ? commits[0].hash : '';
                        this.lastProcessedMultiProjectCommits.set(projectPath, latestHash);
                        const projectName = this.multiProjectManager.getProjectName(projectPath, config.projectNames);
                        (0, logger_1.log)(`  📁 ${projectName}: ${latestHash.substring(0, 8) || '无提交'}`);
                    }
                    catch (error) {
                        (0, logger_1.log)(`⚠️ 初始化项目 ${projectPath} 失败: ${error}`);
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
                    (0, logger_1.log)(`📌 初始化单项目最后处理提交: ${this.lastProcessedCommitHash.substring(0, 8)}`);
                }
                else {
                    (0, logger_1.log)(`📌 今日暂无提交记录`);
                }
            }
        }
        catch (error) {
            (0, logger_1.log)(`⚠️ 初始化最后处理提交失败: ${error}`);
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
            (0, logger_1.log)(`\n📊 开始生成日报 (${projectPaths.length} 个项目)...`);
            // 显示进度提示
            const isToday = this.isSameDay(date, new Date());
            const dateStr = isToday ? '今日' : date.toLocaleDateString('zh-CN');
            const projectType = projectPaths.length === 1 ? '' : '多项目';
            vscode.window.showInformationMessage(`🔄 正在生成${dateStr}${projectType}日报，请稍候...`);
            // 实现一日一报机制
            await this.processUnifiedDailyReport(date, projectPaths);
        }
        catch (error) {
            (0, logger_1.log)(`❌ 生成日报失败: ${error}`);
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
            (0, logger_1.log)(`\n📊 开始生成${periodName}周报 (${projectPaths.length} 个项目)...`);
            (0, logger_1.log)(`📅 时间范围: ${startOfWeek.toLocaleDateString('zh-CN')} - ${endOfWeek.toLocaleDateString('zh-CN')}`);
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
            (0, logger_1.log)(`❌ 生成${periodName}周报失败: ${error}`);
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
            (0, logger_1.log)(`\n📊 开始生成包含 ${dateStr} 的周报 (${projectPaths.length} 个项目)...`);
            (0, logger_1.log)(`📅 时间范围: ${startOfWeek.toLocaleDateString('zh-CN')} - ${endOfWeek.toLocaleDateString('zh-CN')}`);
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
            (0, logger_1.log)(`❌ 生成包含 ${dateStr} 的周报失败: ${error}`);
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
        (0, logger_1.log)('📋 【步骤1/6】开始检查今日代码变更...');
        if (this.isProcessing) {
            (0, logger_1.log)('⏭️ 【跳过】其他任务正在处理中，本次检查跳过');
            return;
        }
        // 获取全局锁，防止多个实例重复处理
        (0, logger_1.log)('🔒 【步骤2/6】获取全局锁，防止重复处理...');
        if (!(await this.acquireGlobalLock())) {
            (0, logger_1.log)('⏭️ 【跳过】未能获取全局锁，其他实例正在处理');
            return;
        }
        try {
            (0, logger_1.log)('⚙️ 【步骤3/6】加载配置和初始化参数...');
            const config = this.configManager.getConfiguration();
            const today = new Date();
            const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            (0, logger_1.log)(`   📅 目标日期: ${today.toLocaleDateString('zh-CN')}`);
            (0, logger_1.log)(`   ⏰ 时间范围: ${dayStart.toLocaleTimeString()} - ${dayEnd.toLocaleTimeString()}`);
            (0, logger_1.log)(`   👤 只检查我的提交: ${config.onlyMyCommits ? '是' : '否'}`);
            (0, logger_1.log)(`   🌿 扫描所有分支: ${config.scanAllBranches ? '是' : '否'}`);
            (0, logger_1.log)('📁 【步骤4/6】获取项目路径列表...');
            const projectPaths = this.getEffectiveProjectPaths(config);
            if (projectPaths.length === 0) {
                (0, logger_1.log)('❌ 【错误】未找到有效的项目路径');
                return;
            }
            const isMultiProject = projectPaths.length > 1;
            (0, logger_1.log)(`   🏢 项目模式: ${isMultiProject ? '多项目' : '单项目'}`);
            (0, logger_1.log)(`   📊 项目数量: ${projectPaths.length}`);
            if (isMultiProject) {
                projectPaths.forEach((path, index) => {
                    const projectName = this.multiProjectManager.getProjectName(path, config.projectNames);
                    (0, logger_1.log)(`     ${index + 1}. ${projectName} (${path})`);
                });
            }
            else {
                (0, logger_1.log)(`     项目路径: ${projectPaths[0]}`);
            }
            (0, logger_1.log)('🔍 【步骤5/6】分析Git仓库变更...');
            await this.checkAndGenerateUnifiedReport(today, dayStart, dayEnd, config, projectPaths);
            (0, logger_1.log)('✅ 【步骤6/6】今日变更检查完成');
        }
        catch (error) {
            (0, logger_1.log)(`❌ 【错误】定时检查失败: ${error}`);
        }
        finally {
            (0, logger_1.log)('🔓 释放全局锁');
            this.releaseGlobalLock();
        }
    }
    /**
     * 处理统一日报生成（一日一报机制）
     */
    async processUnifiedDailyReport(date, projectPaths) {
        const dateStr = date.toLocaleDateString('zh-CN');
        const dateKey = this.formatDateKey(date);
        (0, logger_1.log)('📄 【日报生成步骤1/6】检查现有日报...');
        (0, logger_1.log)(`   📅 目标日期: ${dateStr} (${dateKey})`);
        // 检查是否已存在当日日报
        const allSummaries = await this.storage.getAllSummaries();
        const existingReport = allSummaries.find(s => s.type === 'daily' && s.date === dateKey);
        if (existingReport) {
            (0, logger_1.log)(`   �� 发现现有日报: ${existingReport.id}`);
            (0, logger_1.log)(`   📝 创建时间: ${new Date(existingReport.timestamp).toLocaleString()}`);
            (0, logger_1.log)(`   📊 包含提交: ${existingReport.commits?.length || 0} 个`);
        }
        else {
            (0, logger_1.log)(`   ✨ 今日首次生成日报`);
        }
        (0, logger_1.log)('🤖 【日报生成步骤2/6】调用AI分析代码变更...');
        (0, logger_1.log)(`   📁 分析项目数: ${projectPaths.length}`);
        // 生成新的日报数据
        const result = await this.multiProjectManager.generateMultiProjectDailyReport(date, projectPaths);
        if (!result) {
            (0, logger_1.log)('ℹ️ 【结束】所有项目均无提交记录，无需生成日报');
            vscode.window.showInformationMessage(`ℹ️ ${dateStr} 所有项目均无提交记录`);
            return;
        }
        (0, logger_1.log)('✅ 【日报生成步骤3/6】AI分析完成，开始组装日报数据...');
        (0, logger_1.log)(`   📝 分析提交数: ${result.commits?.length || 0}`);
        (0, logger_1.log)(`   🎯 主要任务数: ${result.mainTasks?.length || 0}`);
        (0, logger_1.log)(`   📊 项目统计数: ${result.projectStats?.length || 0}`);
        let dailyReport;
        if (existingReport) {
            (0, logger_1.log)('🔄 【日报生成步骤4/6】更新现有日报...');
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
            (0, logger_1.log)(`   🆔 日报ID: ${existingReport.id}`);
            (0, logger_1.log)(`   🔄 状态: 已更新现有日报`);
        }
        else {
            (0, logger_1.log)('📝 【日报生成步骤4/6】创建新日报...');
            // 创建新日报
            dailyReport = result;
            (0, logger_1.log)(`   🆔 日报ID: ${dailyReport.id}`);
            (0, logger_1.log)(`   ✨ 状态: 创建新日报`);
        }
        (0, logger_1.log)('💾 【日报生成步骤5/6】保存日报到本地存储...');
        await this.storage.saveSummary(dailyReport);
        (0, logger_1.log)(`   ✅ 本地保存完成`);
        (0, logger_1.log)('📤 【日报生成步骤6/6】尝试上报服务器...');
        await this.tryReportSummary(dailyReport, '日报');
        // 显示成功消息
        const isMultiProject = projectPaths.length > 1;
        if (isMultiProject) {
            if (existingReport) {
                (0, logger_1.log)(`🎉 多项目日报更新完成，涉及 ${result.projectStats.length} 个项目`);
                vscode.window.showInformationMessage(`✅ ${dateStr} 多项目日报已更新，涉及 ${result.projectStats.length} 个项目`);
            }
            else {
                (0, logger_1.log)(`🎉 多项目日报生成完成，涉及 ${result.projectStats.length} 个项目`);
                vscode.window.showInformationMessage(`✅ ${dateStr} 多项目日报生成完成，涉及 ${result.projectStats.length} 个项目`);
            }
        }
        else {
            if (existingReport) {
                (0, logger_1.log)(`🎉 日报更新完成`);
                vscode.window.showInformationMessage(`✅ ${dateStr} 日报已更新`);
            }
            else {
                (0, logger_1.log)(`🎉 日报生成完成`);
                vscode.window.showInformationMessage(`✅ ${dateStr} 日报生成完成`);
            }
        }
        (0, logger_1.log)(`🏁 ${dateStr} 日报处理完成`);
    }
    /**
     * 统一检查并生成日报（支持单项目和多项目）
     */
    async checkAndGenerateUnifiedReport(today, dayStart, dayEnd, config, projectPaths) {
        const isMultiProject = projectPaths.length > 1;
        (0, logger_1.log)(`🔍 【子步骤5.1】检查${isMultiProject ? '多项目' : '单项目'}新变更...`);
        let hasAnyNewCommits = false;
        const projectsWithNewCommits = [];
        const projectCommitStats = {};
        (0, logger_1.log)('📊 【子步骤5.2】逐个分析项目Git历史...');
        // 检查每个项目是否有新提交
        for (let i = 0; i < projectPaths.length; i++) {
            const projectPath = projectPaths[i];
            const projectName = this.multiProjectManager.getProjectName(projectPath, config.projectNames);
            try {
                (0, logger_1.log)(`   🔍 分析项目 ${i + 1}/${projectPaths.length}: ${projectName}`);
                (0, logger_1.log)(`      📁 路径: ${projectPath}`);
                const commits = await this.gitAnalyzer.getCommitsByDateRange(projectPath, dayStart, dayEnd, config.onlyMyCommits, config.scanAllBranches);
                projectCommitStats[projectName] = commits.length;
                (0, logger_1.log)(`      📝 今日提交数量: ${commits.length}`);
                const latestCommitHash = commits.length > 0 ? commits[0].hash : undefined;
                const lastProcessedHash = this.lastProcessedMultiProjectCommits.get(projectPath);
                const hasNewCommits = latestCommitHash && latestCommitHash !== lastProcessedHash;
                if (latestCommitHash) {
                    (0, logger_1.log)(`      🆔 最新提交: ${latestCommitHash.substring(0, 8)}...`);
                    (0, logger_1.log)(`      🔄 上次处理: ${lastProcessedHash ? lastProcessedHash.substring(0, 8) + '...' : '无'}`);
                }
                if (hasNewCommits) {
                    hasAnyNewCommits = true;
                    projectsWithNewCommits.push(projectName);
                    (0, logger_1.log)(`      ✅ 检测到新提交，需要更新日报`);
                }
                else {
                    (0, logger_1.log)(`      ⏭️ 无新提交，跳过`);
                }
                // 更新最后处理的提交哈希
                this.lastProcessedMultiProjectCommits.set(projectPath, latestCommitHash || '');
            }
            catch (error) {
                (0, logger_1.log)(`      ❌ 分析失败: ${error}`);
                projectCommitStats[projectName] = 0;
            }
        }
        (0, logger_1.log)('📈 【子步骤5.3】提交统计汇总:');
        Object.entries(projectCommitStats).forEach(([name, count]) => {
            (0, logger_1.log)(`      ${name}: ${count} 个提交`);
        });
        // 只有在至少一个项目有新提交时才生成日报
        if (hasAnyNewCommits) {
            (0, logger_1.log)(`🚀 【子步骤5.4】检测到新变更，开始生成日报...`);
            (0, logger_1.log)(`      📁 涉及项目: ${projectsWithNewCommits.join(', ')}`);
            (0, logger_1.log)(`      📊 新变更项目数: ${projectsWithNewCommits.length}/${projectPaths.length}`);
            await this.generateTodayReport();
            this.hasLoggedNoChanges = false; // 重置无变更日志标记
        }
        else {
            // 没有新变更时，只记录一次日志（避免频繁输出）
            if (!this.hasLoggedNoChanges) {
                const projectType = isMultiProject ? '所有项目' : '项目';
                (0, logger_1.log)(`💤 【子步骤5.4】${projectType}今日暂无新变更，跳过日报生成`);
                (0, logger_1.log)(`      ℹ️ 这是正常现象，只有在有新提交时才会生成日报`);
                this.hasLoggedNoChanges = true;
            }
            else {
                (0, logger_1.log)(`💤 【子步骤5.4】重复检查，依然无新变更，继续跳过`);
            }
        }
    }
    /**
     * 处理周报生成
     */
    async processWeeklyReport(startDate, endDate, commits) {
        const weekStr = `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`;
        (0, logger_1.log)(`🤖 开始AI分析生成周报...`);
        // 获取历史上下文（用于识别跨周任务）
        const historySummaries = await this.storage.getRecentSummaries(14);
        (0, logger_1.log)(`📚 获取 ${historySummaries.length} 个历史总结作为周报上下文`);
        // 生成AI总结
        const summary = await this.aiService.generateReport(commits, historySummaries, 'weekly', { start: startDate, end: endDate });
        (0, logger_1.log)(`✅ AI分析完成`);
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
        (0, logger_1.log)(`📊 创建周报: ${weeklyReport.id}`);
        // 保存周报
        await this.storage.saveSummary(weeklyReport);
        // 尝试上报
        await this.tryReportSummary(weeklyReport, '周报');
        (0, logger_1.log)(`🎉 ${weekStr} 周报处理完成`);
    }
    /**
     * 尝试上报总结
     */
    async tryReportSummary(summary, type) {
        const config = this.configManager.getConfiguration();
        (0, logger_1.log)(`📤 【上报步骤1/3】检查上报配置...`);
        (0, logger_1.log)(`   🔧 上报功能: ${config.enableReporting ? '已启用' : '已禁用'}`);
        (0, logger_1.log)(`   🌐 上报URL: ${config.reportUrl || '未配置'}`);
        if (!config.enableReporting) {
            (0, logger_1.log)(`⏭️ 【上报步骤2/3】上报功能已禁用，跳过上报`);
            summary.reportStatus = 'success'; // 禁用时标记为成功
            await this.storage.updateSummary(summary);
            return;
        }
        if (!config.reportUrl) {
            (0, logger_1.log)(`⚠️ 【上报步骤2/3】未配置上报URL，跳过上报`);
            summary.reportStatus = 'failed';
            summary.reportError = '未配置上报URL';
            await this.storage.updateSummary(summary);
            return;
        }
        (0, logger_1.log)(`📡 【上报步骤2/3】开始上报${type}到服务器...`);
        (0, logger_1.log)(`   🆔 报告ID: ${summary.id}`);
        (0, logger_1.log)(`   📊 报告类型: ${summary.type}`);
        (0, logger_1.log)(`   📅 报告日期: ${summary.date}`);
        (0, logger_1.log)(`   📝 提交数量: ${summary.commits?.length || 0}`);
        try {
            await this.reportService.reportSummary(summary);
            summary.reportStatus = 'success';
            (0, logger_1.log)(`✅ 【上报步骤3/3】${type}上报成功`);
            (0, logger_1.log)(`   🎉 服务器接收成功`);
        }
        catch (error) {
            summary.reportStatus = 'failed';
            summary.reportError = String(error);
            (0, logger_1.log)(`❌ 【上报步骤3/3】${type}上报失败`);
            (0, logger_1.log)(`   🔍 错误详情: ${error}`);
            (0, logger_1.log)(`   💡 建议检查网络连接和服务器配置`);
        }
        (0, logger_1.log)(`💾 【上报完成】更新本地状态...`);
        // 更新状态
        await this.storage.updateSummary(summary);
        (0, logger_1.log)(`   ✅ 状态更新完成: ${summary.reportStatus}`);
    }
    /**
     * 安排下一次日报检查
     */
    scheduleNextDailyCheck() {
        const config = this.configManager.getConfiguration();
        const intervalMs = config.interval * 60 * 1000;
        (0, logger_1.log)(`⏰ 安排下一次日报检查，${config.interval}分钟后执行 (${new Date(Date.now() + intervalMs).toLocaleTimeString()})`);
        this.dailyTimer = setTimeout(async () => {
            (0, logger_1.log)('\n================== 📊 日报定时任务触发 ==================');
            (0, logger_1.log)(`🕐 执行时间: ${new Date().toLocaleString()}`);
            (0, logger_1.log)(`📍 实例ID: ${this.instanceId}`);
            (0, logger_1.log)(`🔧 进程PID: ${process.pid}`);
            try {
                // 检查是否已经在当前时间窗口内执行过
                const currentTimeWindow = Math.floor(Date.now() / intervalMs);
                const executionKey = `daily_${this.formatDateKey(new Date())}_${currentTimeWindow}`;
                (0, logger_1.log)(`🔍 检查任务锁状态...`);
                (0, logger_1.log)(`   任务键: ${executionKey}`);
                (0, logger_1.log)(`   时间窗口: ${currentTimeWindow} (${config.interval}分钟间隔)`);
                if (await this.acquireTaskLock(executionKey)) {
                    (0, logger_1.log)(`✅ 任务锁获取成功，开始执行日报生成...`);
                    (0, logger_1.log)(`📝 开始检查今日提交变更...`);
                    await this.checkAndGenerateTodayReport();
                    (0, logger_1.log)(`🎉 日报任务执行完成`);
                    (0, logger_1.log)(`🔒 任务锁将在时间窗口结束时自动过期 (约${Math.round(intervalMs * 1.5 / 60000)}分钟后)`);
                }
                else {
                    (0, logger_1.log)(`⏭️ 日报任务已被其他实例在当前时间窗口内执行，跳过本次执行`);
                    (0, logger_1.log)(`   这是正常行为，防止多个VS Code窗口重复生成日报`);
                }
            }
            catch (error) {
                (0, logger_1.log)(`❌ 定时日报检查失败: ${error}`);
                (0, logger_1.log)(`   实例: ${this.instanceId}`);
                (0, logger_1.log)(`   时间: ${new Date().toLocaleString()}`);
            }
            (0, logger_1.log)(`🔄 准备安排下一次日报检查...`);
            (0, logger_1.log)('================== 📊 日报任务结束 ==================\n');
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
        (0, logger_1.log)(`📅 安排周报定时任务:`);
        (0, logger_1.log)(`   当前时间: ${now.toLocaleString()}`);
        (0, logger_1.log)(`   计划执行: ${scheduledDate.toLocaleString()}`);
        (0, logger_1.log)(`   延迟时间: ${Math.round(delay / (60 * 60 * 1000) * 10) / 10}小时`);
        this.weeklyTimer = setTimeout(async () => {
            (0, logger_1.log)('\n================== 📈 周报定时任务触发 ==================');
            (0, logger_1.log)(`🕐 执行时间: ${new Date().toLocaleString()}`);
            (0, logger_1.log)(`📍 实例ID: ${this.instanceId}`);
            (0, logger_1.log)(`🔧 进程PID: ${process.pid}`);
            try {
                // 使用基于日期的任务锁，确保每个报告周期只执行一次
                const today = new Date();
                const startOfWeek = this.getStartOfWeek(today);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                const weekKey = `weekly_${this.formatDateKey(startOfWeek)}`;
                (0, logger_1.log)(`🔍 检查周报任务锁状态...`);
                (0, logger_1.log)(`   任务键: ${weekKey}`);
                (0, logger_1.log)(`   周期范围: ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`);
                (0, logger_1.log)(`   周起始日: ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][config.weekStartDay]}`);
                if (await this.acquireTaskLock(weekKey)) {
                    (0, logger_1.log)(`✅ 周报任务锁获取成功，开始执行周报生成...`);
                    (0, logger_1.log)(`📊 分析本周代码提交历史...`);
                    await this.generateWeeklyReport();
                    (0, logger_1.log)(`🎉 周报任务执行完成`);
                    (0, logger_1.log)(`🔒 任务锁将自动过期防止重复执行 (有效期7天)`);
                }
                else {
                    (0, logger_1.log)(`⏭️ 周报任务已被其他实例在当前周期内执行，跳过本次执行`);
                    (0, logger_1.log)(`   这是正常行为，防止多个VS Code窗口重复生成周报`);
                }
            }
            catch (error) {
                (0, logger_1.log)(`❌ 定时周报生成失败: ${error}`);
                (0, logger_1.log)(`   实例: ${this.instanceId}`);
                (0, logger_1.log)(`   时间: ${new Date().toLocaleString()}`);
            }
            (0, logger_1.log)(`🔄 准备安排下一次周报任务...`);
            (0, logger_1.log)('================== 📈 周报任务结束 ==================\n');
            // 安排下一次
            this.scheduleWeeklyReport();
        }, delay);
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