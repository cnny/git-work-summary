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
exports.MultiProjectManager = void 0;
const path = __importStar(require("path"));
const logger_1 = require("./logger");
class MultiProjectManager {
    constructor(gitAnalyzer, aiService, configManager) {
        this.gitAnalyzer = gitAnalyzer;
        this.aiService = aiService;
        this.configManager = configManager;
    }
    /**
     * 生成多项目合并日报
     */
    async generateMultiProjectDailyReport(date, projectPaths) {
        const config = this.configManager.getConfiguration();
        // 使用传入的项目路径，或从配置中获取
        const effectiveProjectPaths = projectPaths || config.projectPaths || [];
        if (effectiveProjectPaths.length === 0) {
            throw new Error('未配置项目路径');
        }
        (0, logger_1.log)(`\n🏢 开始生成多项目日报 (${date.toLocaleDateString('zh-CN')})...`);
        (0, logger_1.log)(`📁 项目数量: ${effectiveProjectPaths.length}`);
        const allCommits = [];
        const projectStats = [];
        // 获取每个项目的提交
        for (const projectPath of effectiveProjectPaths) {
            try {
                const projectName = this.getProjectName(projectPath, config.projectNames);
                (0, logger_1.log)(`\n📂 分析项目: ${projectName} (${projectPath})`);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                const commits = await this.gitAnalyzer.getCommitsByDateRange(projectPath, dayStart, dayEnd, config.onlyMyCommits, config.scanAllBranches);
                (0, logger_1.log)(`  📝 找到 ${commits.length} 个提交`);
                // 只有当项目有提交时才添加统计
                if (commits.length > 0) {
                    // 为提交添加项目信息
                    const projectCommits = commits.map(commit => ({
                        ...commit,
                        projectPath,
                        projectName
                    }));
                    allCommits.push(...projectCommits);
                    // 计算项目统计
                    const stats = {
                        projectPath,
                        projectName,
                        commitCount: commits.length,
                        additions: commits.reduce((sum, c) => sum + c.additions, 0),
                        deletions: commits.reduce((sum, c) => sum + c.deletions, 0),
                        fileCount: new Set(commits.flatMap(c => c.files)).size,
                        mainTasks: [] // 稍后由AI分析填充
                    };
                    projectStats.push(stats);
                }
                else {
                    (0, logger_1.log)(`  ⏭️ 项目无提交，跳过统计`);
                }
            }
            catch (error) {
                (0, logger_1.log)(`⚠️ 分析项目 ${projectPath} 失败: ${error}`);
                // 不添加空的项目统计，只记录错误
            }
        }
        if (allCommits.length === 0) {
            (0, logger_1.log)(`📭 所有项目均无提交记录`);
            return null;
        }
        (0, logger_1.log)(`\n🔄 开始AI分析合并报告...`);
        (0, logger_1.log)(`📊 总计: ${allCommits.length} 个提交，涉及 ${projectStats.length} 个项目`);
        // 生成AI分析
        const summary = await this.aiService.generateReport(allCommits, projectStats, 'daily', { start: date, end: date });
        // 更新项目统计中的主要任务
        this.updateProjectMainTasks(projectStats, summary.mainTasks, allCommits);
        const multiProjectSummary = {
            id: this.generateId(),
            timestamp: Date.now(),
            type: 'daily',
            date: this.formatDateKey(date),
            commits: allCommits,
            uncommittedChanges: undefined,
            summary: summary.content,
            mainTasks: summary.mainTasks,
            reportStatus: 'pending',
            projectStats
        };
        (0, logger_1.log)(`✅ 多项目日报生成完成`);
        return multiProjectSummary;
    }
    /**
     * 生成多项目合并周报
     */
    async generateMultiProjectWeeklyReport(startDate, endDate, projectPaths) {
        const config = this.configManager.getConfiguration();
        // 使用传入的项目路径，或从配置中获取
        const effectiveProjectPaths = projectPaths || config.projectPaths || [];
        if (effectiveProjectPaths.length === 0) {
            throw new Error('未配置项目路径');
        }
        (0, logger_1.log)(`\n🏢 开始生成多项目周报...`);
        (0, logger_1.log)(`📅 时间范围: ${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`);
        (0, logger_1.log)(`📁 项目数量: ${effectiveProjectPaths.length}`);
        const allCommits = [];
        const projectStats = [];
        // 获取每个项目的提交
        for (const projectPath of effectiveProjectPaths) {
            try {
                const projectName = this.getProjectName(projectPath, config.projectNames);
                (0, logger_1.log)(`\n📂 分析项目: ${projectName} (${projectPath})`);
                const commits = await this.gitAnalyzer.getCommitsByDateRange(projectPath, startDate, endDate, config.onlyMyCommits, config.scanAllBranches);
                (0, logger_1.log)(`  📝 找到 ${commits.length} 个提交`);
                // 只有当项目有提交时才添加统计
                if (commits.length > 0) {
                    // 为提交添加项目信息
                    const projectCommits = commits.map(commit => ({
                        ...commit,
                        projectPath,
                        projectName
                    }));
                    allCommits.push(...projectCommits);
                    // 计算项目统计
                    const stats = {
                        projectPath,
                        projectName,
                        commitCount: commits.length,
                        additions: commits.reduce((sum, c) => sum + c.additions, 0),
                        deletions: commits.reduce((sum, c) => sum + c.deletions, 0),
                        fileCount: new Set(commits.flatMap(c => c.files)).size,
                        mainTasks: []
                    };
                    projectStats.push(stats);
                }
                else {
                    (0, logger_1.log)(`  ⏭️ 项目无提交，跳过统计`);
                }
            }
            catch (error) {
                (0, logger_1.log)(`⚠️ 分析项目 ${projectPath} 失败: ${error}`);
                // 不添加空的项目统计，只记录错误
            }
        }
        if (allCommits.length === 0) {
            (0, logger_1.log)(`📭 所有项目均无提交记录`);
            return null;
        }
        (0, logger_1.log)(`\n🔄 开始AI分析合并报告...`);
        (0, logger_1.log)(`📊 总计: ${allCommits.length} 个提交，涉及 ${projectStats.length} 个项目`);
        // 生成AI分析
        const summary = await this.aiService.generateReport(allCommits, projectStats, 'weekly', { start: startDate, end: endDate });
        // 更新项目统计中的主要任务
        this.updateProjectMainTasks(projectStats, summary.mainTasks, allCommits);
        const multiProjectSummary = {
            id: this.generateId(),
            timestamp: Date.now(),
            type: 'weekly',
            date: this.formatDateKey(startDate) + '_' + this.formatDateKey(endDate),
            commits: allCommits,
            summary: summary.content,
            mainTasks: summary.mainTasks,
            reportStatus: 'pending',
            projectStats
        };
        (0, logger_1.log)(`✅ 多项目周报生成完成`);
        return multiProjectSummary;
    }
    /**
     * 获取项目友好名称
     */
    getProjectName(projectPath, projectNames) {
        return projectNames[projectPath] || path.basename(projectPath);
    }
    /**
     * 更新项目统计中的主要任务
     */
    updateProjectMainTasks(projectStats, mainTasks, allCommits) {
        // 为每个项目分配相关的主要任务
        for (const stats of projectStats) {
            const projectCommits = allCommits.filter(c => c.projectPath === stats.projectPath);
            // 根据提交信息匹配相关任务
            stats.mainTasks = mainTasks.filter(task => {
                return projectCommits.some(commit => task.title.toLowerCase().includes(stats.projectName.toLowerCase()) ||
                    task.description.toLowerCase().includes(stats.projectName.toLowerCase()) ||
                    commit.message.toLowerCase().includes(task.title.toLowerCase()));
            });
        }
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
        return `multi-summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.MultiProjectManager = MultiProjectManager;
//# sourceMappingURL=multiProjectManager.js.map