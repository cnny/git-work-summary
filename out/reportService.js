"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
class ReportService {
    constructor(configManager) {
        this.configManager = configManager;
        this.reportUrl = '';
        this.headers = {};
        this.updateConfiguration();
    }
    updateConfiguration() {
        const config = this.configManager.getConfiguration();
        this.reportUrl = config.reportUrl;
        this.headers = {
            'Content-Type': 'application/json',
            ...config.reportHeaders
        };
    }
    /**
     * 上报工作总结
     */
    async reportSummary(workSummary) {
        const config = this.configManager.getConfiguration();
        // 检查是否配置了上报URL
        if (!this.reportUrl) {
            (0, logger_1.log)('上报接口未配置，跳过上报');
            return;
        }
        const reportData = this.formatReportData(workSummary);
        try {
            const response = await axios_1.default.post(this.reportUrl, reportData, {
                headers: this.headers,
                timeout: 30000,
                validateStatus: (status) => status < 500 // 只有 5xx 错误才抛异常
            });
            if (response.status >= 400) {
                throw new Error(`上报失败，状态码: ${response.status}, 响应: ${JSON.stringify(response.data)}`);
            }
            (0, logger_1.log)(`工作总结上报成功: ${workSummary.id}`);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const statusCode = error.response?.status;
                const errorMessage = error.response?.data?.message || error.message;
                throw new Error(`上报失败 (${statusCode}): ${errorMessage}`);
            }
            throw new Error(`上报失败: ${error}`);
        }
    }
    /**
     * 格式化上报数据
     */
    formatReportData(workSummary) {
        return {
            // 基本信息
            id: workSummary.id,
            timestamp: workSummary.timestamp,
            date: new Date(workSummary.timestamp).toISOString(),
            // 工作总结
            summary: {
                content: workSummary.summary,
                mainTasks: workSummary.mainTasks.map(task => ({
                    title: task.title,
                    description: task.description,
                    subTasks: task.subTasks,
                    duration: task.duration,
                    progress: task.progress
                }))
            },
            // 提交统计
            commits: {
                total: workSummary.commits.length,
                details: workSummary.commits.map(commit => ({
                    hash: commit.hash.substring(0, 8),
                    message: commit.message,
                    author: commit.author,
                    date: commit.date.toISOString(),
                    files: commit.files,
                    changes: {
                        additions: commit.additions,
                        deletions: commit.deletions
                    }
                }))
            },
            // 元数据
            metadata: {
                source: 'cursor-git-work-summary',
                version: '1.0.0',
                reportTime: new Date().toISOString()
            }
        };
    }
    /**
     * 测试上报接口连接
     */
    async testConnection() {
        if (!this.reportUrl) {
            return {
                success: false,
                message: '上报接口 URL 未配置'
            };
        }
        const testData = {
            test: true,
            message: 'Connection test from Git Work Summary Extension',
            timestamp: new Date().toISOString()
        };
        try {
            const response = await axios_1.default.post(this.reportUrl, testData, {
                headers: this.headers,
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            if (response.status >= 400) {
                return {
                    success: false,
                    message: `连接失败，状态码: ${response.status}`
                };
            }
            return {
                success: true,
                message: `连接成功，状态码: ${response.status}`
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const statusCode = error.response?.status;
                const errorMessage = error.response?.data?.message || error.message;
                return {
                    success: false,
                    message: `连接失败 (${statusCode}): ${errorMessage}`
                };
            }
            return {
                success: false,
                message: `连接失败: ${error}`
            };
        }
    }
    /**
     * 批量上报多个工作总结
     */
    async batchReport(workSummaries) {
        const successful = [];
        const failed = [];
        for (const summary of workSummaries) {
            try {
                await this.reportSummary(summary);
                successful.push(summary.id);
            }
            catch (error) {
                failed.push({
                    id: summary.id,
                    error: String(error)
                });
            }
        }
        return { successful, failed };
    }
    /**
     * 获取上报统计信息
     */
    async getReportStats() {
        const stats = {
            url: this.reportUrl,
            configured: !!this.reportUrl,
            lastTest: undefined
        };
        if (stats.configured) {
            try {
                const testResult = await this.testConnection();
                stats.lastTest = {
                    ...testResult,
                    time: new Date().toISOString()
                };
            }
            catch (error) {
                stats.lastTest = {
                    success: false,
                    message: String(error),
                    time: new Date().toISOString()
                };
            }
        }
        return stats;
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=reportService.js.map