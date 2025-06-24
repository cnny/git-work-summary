import * as vscode from 'vscode';
import * as path from 'path';
import { GitAnalyzer, CommitInfo } from './gitAnalyzer';
import { AISummaryService } from './aiSummaryService';
import { ConfigurationManager } from './configurationManager';
import { WorkSummary, MainTask } from './gitWorkSummaryManager';
import { log } from './logger';

export interface ProjectCommitInfo extends CommitInfo {
    projectPath: string;
    projectName: string;
}

export interface MultiProjectSummary extends Omit<WorkSummary, 'commits'> {
    commits: ProjectCommitInfo[];
    projectStats: ProjectStats[];
}

export interface ProjectStats {
    projectPath: string;
    projectName: string;
    commitCount: number;
    additions: number;
    deletions: number;
    fileCount: number;
    mainTasks: MainTask[];
}

export class MultiProjectManager {
    constructor(
        private gitAnalyzer: GitAnalyzer,
        private aiService: AISummaryService,
        private configManager: ConfigurationManager
    ) {}

    /**
     * 生成多项目合并日报
     */
    async generateMultiProjectDailyReport(date: Date, projectPaths?: string[]): Promise<MultiProjectSummary | null> {
        const config = this.configManager.getConfiguration();
        
        // 使用传入的项目路径，或从配置中获取
        const effectiveProjectPaths = projectPaths || config.projectPaths || [];
        
        if (effectiveProjectPaths.length === 0) {
            throw new Error('未配置项目路径');
        }

        log(`\n🏢 开始生成多项目日报 (${date.toLocaleDateString('zh-CN')})...`);
        log(`📁 项目数量: ${effectiveProjectPaths.length}`);

        const allCommits: ProjectCommitInfo[] = [];
        const projectStats: ProjectStats[] = [];

        // 获取每个项目的提交
        for (const projectPath of effectiveProjectPaths) {
            try {
                const projectName = this.getProjectName(projectPath, config.projectNames);
                log(`\n📂 分析项目: ${projectName} (${projectPath})`);

                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                const commits = await this.gitAnalyzer.getCommitsByDateRange(
                    projectPath,
                    dayStart,
                    dayEnd,
                    config.onlyMyCommits,
                    config.scanAllBranches
                );

                log(`  📝 找到 ${commits.length} 个提交`);

                // 只有当项目有提交时才添加统计
                if (commits.length > 0) {
                    // 为提交添加项目信息
                    const projectCommits: ProjectCommitInfo[] = commits.map(commit => ({
                        ...commit,
                        projectPath,
                        projectName
                    }));

                    allCommits.push(...projectCommits);

                    // 计算项目统计
                    const stats: ProjectStats = {
                        projectPath,
                        projectName,
                        commitCount: commits.length,
                        additions: commits.reduce((sum, c) => sum + c.additions, 0),
                        deletions: commits.reduce((sum, c) => sum + c.deletions, 0),
                        fileCount: new Set(commits.flatMap(c => c.files)).size,
                        mainTasks: [] // 稍后由AI分析填充
                    };

                    projectStats.push(stats);
                } else {
                    log(`  ⏭️ 项目无提交，跳过统计`);
                }

            } catch (error) {
                log(`⚠️ 分析项目 ${projectPath} 失败: ${error}`);
                // 不添加空的项目统计，只记录错误
            }
        }

        if (allCommits.length === 0) {
            log(`📭 所有项目均无提交记录`);
            return null;
        }

        log(`\n🔄 开始AI分析合并报告...`);
        log(`📊 总计: ${allCommits.length} 个提交，涉及 ${projectStats.length} 个项目`);

        // 生成AI分析
        const summary = await this.aiService.generateReport(
            allCommits,
            projectStats,
            'daily',
            { start: date, end: date }
        );

        // 更新项目统计中的主要任务
        this.updateProjectMainTasks(projectStats, summary.mainTasks, allCommits);

        const multiProjectSummary: MultiProjectSummary = {
            id: this.generateId(),
            timestamp: Date.now(),
            type: 'daily',
            date: this.formatDateKey(date),
            commits: allCommits,
            uncommittedChanges: undefined, // 多项目暂不支持未提交变更
            summary: summary.content,
            mainTasks: summary.mainTasks,
            reportStatus: 'pending',
            projectStats
        };

        log(`✅ 多项目日报生成完成`);
        return multiProjectSummary;
    }

    /**
     * 生成多项目合并周报
     */
    async generateMultiProjectWeeklyReport(startDate: Date, endDate: Date, projectPaths?: string[]): Promise<MultiProjectSummary | null> {
        const config = this.configManager.getConfiguration();
        
        // 使用传入的项目路径，或从配置中获取
        const effectiveProjectPaths = projectPaths || config.projectPaths || [];
        
        if (effectiveProjectPaths.length === 0) {
            throw new Error('未配置项目路径');
        }

        log(`\n🏢 开始生成多项目周报...`);
        log(`📅 时间范围: ${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`);
        log(`📁 项目数量: ${effectiveProjectPaths.length}`);

        const allCommits: ProjectCommitInfo[] = [];
        const projectStats: ProjectStats[] = [];

        // 获取每个项目的提交
        for (const projectPath of effectiveProjectPaths) {
            try {
                const projectName = this.getProjectName(projectPath, config.projectNames);
                log(`\n📂 分析项目: ${projectName} (${projectPath})`);

                const commits = await this.gitAnalyzer.getCommitsByDateRange(
                    projectPath,
                    startDate,
                    endDate,
                    config.onlyMyCommits,
                    config.scanAllBranches
                );

                log(`  📝 找到 ${commits.length} 个提交`);

                // 只有当项目有提交时才添加统计
                if (commits.length > 0) {
                    // 为提交添加项目信息
                    const projectCommits: ProjectCommitInfo[] = commits.map(commit => ({
                        ...commit,
                        projectPath,
                        projectName
                    }));

                    allCommits.push(...projectCommits);

                    // 计算项目统计
                    const stats: ProjectStats = {
                        projectPath,
                        projectName,
                        commitCount: commits.length,
                        additions: commits.reduce((sum, c) => sum + c.additions, 0),
                        deletions: commits.reduce((sum, c) => sum + c.deletions, 0),
                        fileCount: new Set(commits.flatMap(c => c.files)).size,
                        mainTasks: []
                    };

                    projectStats.push(stats);
                } else {
                    log(`  ⏭️ 项目无提交，跳过统计`);
                }

            } catch (error) {
                log(`⚠️ 分析项目 ${projectPath} 失败: ${error}`);
                // 不添加空的项目统计，只记录错误
            }
        }

        if (allCommits.length === 0) {
            log(`📭 所有项目均无提交记录`);
            return null;
        }

        log(`\n🔄 开始AI分析合并报告...`);
        log(`📊 总计: ${allCommits.length} 个提交，涉及 ${projectStats.length} 个项目`);

        // 生成AI分析
        const summary = await this.aiService.generateReport(
            allCommits,
            projectStats,
            'weekly',
            { start: startDate, end: endDate }
        );

        // 更新项目统计中的主要任务
        this.updateProjectMainTasks(projectStats, summary.mainTasks, allCommits);

        const multiProjectSummary: MultiProjectSummary = {
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

        log(`✅ 多项目周报生成完成`);
        return multiProjectSummary;
    }

    /**
     * 获取项目友好名称
     */
    getProjectName(projectPath: string, projectNames: Record<string, string>): string {
        return projectNames[projectPath] || path.basename(projectPath);
    }

    /**
     * 更新项目统计中的主要任务
     */
    private updateProjectMainTasks(
        projectStats: ProjectStats[], 
        mainTasks: MainTask[], 
        allCommits: ProjectCommitInfo[]
    ): void {
        // 为每个项目分配相关的主要任务
        for (const stats of projectStats) {
            const projectCommits = allCommits.filter(c => c.projectPath === stats.projectPath);
            
            // 根据提交信息匹配相关任务
            stats.mainTasks = mainTasks.filter(task => {
                return projectCommits.some(commit => 
                    task.title.toLowerCase().includes(stats.projectName.toLowerCase()) ||
                    task.description.toLowerCase().includes(stats.projectName.toLowerCase()) ||
                    commit.message.toLowerCase().includes(task.title.toLowerCase())
                );
            });
        }
    }

    /**
     * 格式化日期为键值（YYYY-MM-DD）
     */
    private formatDateKey(date: Date): string {
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `multi-summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
} 