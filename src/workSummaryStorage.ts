import * as vscode from 'vscode';
import { WorkSummary } from './gitWorkSummaryManager';
import * as fs from 'fs/promises';
import * as path from 'path';

export class WorkSummaryStorage {
    private storagePath: string;

    constructor(private context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'workSummaries.json');
    }

    /**
     * 保存工作总结
     */
    async saveSummary(summary: WorkSummary): Promise<void> {
        try {
            const summaries = await this.loadAllSummaries();
            
            // 检查是否已存在
            const existingIndex = summaries.findIndex(s => s.id === summary.id);
            if (existingIndex >= 0) {
                summaries[existingIndex] = summary;
            } else {
                summaries.unshift(summary); // 添加到开头
            }

            // 限制存储数量，只保留最近 100 条
            if (summaries.length > 100) {
                summaries.splice(100);
            }

            await this.saveSummaries(summaries);
        } catch (error) {
            throw new Error(`保存工作总结失败: ${error}`);
        }
    }

    /**
     * 更新工作总结
     */
    async updateSummary(summary: WorkSummary): Promise<void> {
        await this.saveSummary(summary);
    }

    /**
     * 获取最近的工作总结
     */
    async getRecentSummaries(days: number = 7): Promise<WorkSummary[]> {
        try {
            const summaries = await this.loadAllSummaries();
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
            
            return summaries.filter(summary => summary.timestamp >= cutoffTime);
        } catch (error) {
            console.error('获取最近工作总结失败:', error);
            return [];
        }
    }

    /**
     * 根据 ID 获取工作总结
     */
    async getSummaryById(id: string): Promise<WorkSummary | null> {
        try {
            const summaries = await this.loadAllSummaries();
            return summaries.find(s => s.id === id) || null;
        } catch (error) {
            console.error('获取工作总结失败:', error);
            return null;
        }
    }

    /**
     * 删除工作总结
     */
    async deleteSummary(id: string): Promise<boolean> {
        try {
            const summaries = await this.loadAllSummaries();
            const filteredSummaries = summaries.filter(s => s.id !== id);
            
            if (filteredSummaries.length === summaries.length) {
                return false; // 未找到要删除的项
            }

            await this.saveSummaries(filteredSummaries);
            return true;
        } catch (error) {
            throw new Error(`删除工作总结失败: ${error}`);
        }
    }

    /**
     * 获取所有工作总结
     */
    async getAllSummaries(): Promise<WorkSummary[]> {
        return await this.loadAllSummaries();
    }

    /**
     * 获取工作总结统计信息
     */
    async getStatistics(): Promise<{
        total: number;
        thisWeek: number;
        thisMonth: number;
        successfulReports: number;
        failedReports: number;
        lastSummaryTime?: number;
    }> {
        try {
            const summaries = await this.loadAllSummaries();
            const now = Date.now();
            const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
            const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

            const thisWeek = summaries.filter(s => s.timestamp >= weekAgo).length;
            const thisMonth = summaries.filter(s => s.timestamp >= monthAgo).length;
            const successfulReports = summaries.filter(s => s.reportStatus === 'success').length;
            const failedReports = summaries.filter(s => s.reportStatus === 'failed').length;
            const lastSummaryTime = summaries.length > 0 ? summaries[0].timestamp : undefined;

            return {
                total: summaries.length,
                thisWeek,
                thisMonth,
                successfulReports,
                failedReports,
                lastSummaryTime
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return {
                total: 0,
                thisWeek: 0,
                thisMonth: 0,
                successfulReports: 0,
                failedReports: 0
            };
        }
    }

    /**
     * 清理过期的工作总结
     */
    async cleanupOldSummaries(keepDays: number = 90): Promise<number> {
        try {
            const summaries = await this.loadAllSummaries();
            const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
            
            const filteredSummaries = summaries.filter(summary => summary.timestamp >= cutoffTime);
            const removedCount = summaries.length - filteredSummaries.length;

            if (removedCount > 0) {
                await this.saveSummaries(filteredSummaries);
            }

            return removedCount;
        } catch (error) {
            throw new Error(`清理过期总结失败: ${error}`);
        }
    }

    /**
     * 导出工作总结数据
     */
    async exportSummaries(filePath: string): Promise<void> {
        try {
            const summaries = await this.loadAllSummaries();
            const exportData = {
                exportTime: new Date().toISOString(),
                version: '1.0.0',
                summaries: summaries
            };

            await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
        } catch (error) {
            throw new Error(`导出工作总结失败: ${error}`);
        }
    }

    /**
     * 导入工作总结数据
     */
    async importSummaries(filePath: string, merge: boolean = true): Promise<number> {
        try {
            const importData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            
            if (!importData.summaries || !Array.isArray(importData.summaries)) {
                throw new Error('导入文件格式不正确');
            }

            let existingSummaries: WorkSummary[] = [];
            if (merge) {
                existingSummaries = await this.loadAllSummaries();
            }

            // 合并并去重
            const allSummaries = [...existingSummaries];
            let importedCount = 0;

            for (const importSummary of importData.summaries) {
                if (!allSummaries.find(s => s.id === importSummary.id)) {
                    allSummaries.push(importSummary);
                    importedCount++;
                }
            }

            // 按时间排序
            allSummaries.sort((a, b) => b.timestamp - a.timestamp);

            await this.saveSummaries(allSummaries);
            return importedCount;
        } catch (error) {
            throw new Error(`导入工作总结失败: ${error}`);
        }
    }

    /**
     * 加载所有工作总结
     */
    private async loadAllSummaries(): Promise<WorkSummary[]> {
        try {
            await this.ensureStorageDirectory();
            
            const data = await fs.readFile(this.storagePath, 'utf-8');
            const summaries = JSON.parse(data);
            
            // 验证数据格式并转换日期，确保数据完整性
            return summaries.map((summary: any) => ({
                ...summary,
                // 确保 summary 字段不为空
                summary: summary.summary || '无总结内容',
                // 确保 mainTasks 字段不为空
                mainTasks: Array.isArray(summary.mainTasks) ? summary.mainTasks : [],
                commits: Array.isArray(summary.commits) ? summary.commits.map((commit: any) => ({
                    ...commit,
                    date: new Date(commit.date)
                })) : []
            }));
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return []; // 文件不存在，返回空数组
            }
            throw error;
        }
    }

    /**
     * 保存所有工作总结
     */
    private async saveSummaries(summaries: WorkSummary[]): Promise<void> {
        await this.ensureStorageDirectory();
        await fs.writeFile(this.storagePath, JSON.stringify(summaries, null, 2), 'utf-8');
    }

    /**
     * 确保存储目录存在
     */
    private async ensureStorageDirectory(): Promise<void> {
        const dir = path.dirname(this.storagePath);
        try {
            await fs.access(dir);
        } catch (error) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    /**
     * 根据日期范围获取工作总结
     */
    async getSummariesByDateRange(startDate: Date, endDate: Date): Promise<WorkSummary[]> {
        try {
            const summaries = await this.loadAllSummaries();
            const startTime = startDate.getTime();
            const endTime = endDate.getTime();
            
            return summaries.filter(summary => 
                summary.timestamp >= startTime && summary.timestamp <= endTime
            );
        } catch (error) {
            console.error('根据日期范围获取工作总结失败:', error);
            return [];
        }
    }

    /**
     * 保存报告（包括日报和周报）
     */
    async saveReport(report: any): Promise<void> {
        try {
            // 将报告当作普通的工作总结来保存
            await this.saveSummary(report);
        } catch (error) {
            throw new Error(`保存报告失败: ${error}`);
        }
    }
} 