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
exports.HistoryViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const workSummaryStorage_1 = require("./workSummaryStorage");
const gitAnalyzer_1 = require("./gitAnalyzer");
const configurationManager_1 = require("./configurationManager");
const logger_1 = require("./logger");
class HistoryViewProvider {
    constructor(context) {
        this.context = context;
        this.storage = new workSummaryStorage_1.WorkSummaryStorage(context);
        this.gitAnalyzer = new gitAnalyzer_1.GitAnalyzer();
        this.configManager = new configurationManager_1.ConfigurationManager();
    }
    /**
     * 显示工作总结历史
     */
    async showHistory() {
        const panel = vscode.window.createWebviewPanel('gitWorkSummaryHistory', 'Git Work Summary 历史记录', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [this.context.extensionUri]
        });
        // 加载数据并显示
        await this.loadAndDisplayHistory(panel);
        // 处理来自 webview 的消息
        panel.webview.onDidReceiveMessage(async (message) => {
            (0, logger_1.log)(`收到webview消息: ${JSON.stringify(message)}`);
            try {
                switch (message.command) {
                    case 'refresh':
                        (0, logger_1.log)('执行刷新操作');
                        await this.loadAndDisplayHistory(panel);
                        vscode.window.showInformationMessage('历史记录已刷新');
                        break;
                    case 'delete':
                        (0, logger_1.log)(`执行删除操作: ${message.id}`);
                        await this.deleteSummary(message.id);
                        await this.loadAndDisplayHistory(panel);
                        break;
                    case 'export':
                        (0, logger_1.log)('执行导出操作');
                        await this.exportSummaries();
                        break;
                    case 'viewDetails':
                        (0, logger_1.log)(`执行查看详情操作: ${message.id}`);
                        await this.showSummaryDetails(message.id);
                        break;
                    default:
                        (0, logger_1.log)(`未知命令: ${message.command}`);
                }
            }
            catch (error) {
                (0, logger_1.log)(`处理webview消息失败: ${error}`);
                vscode.window.showErrorMessage(`操作失败: ${error}`);
            }
        });
    }
    /**
     * 加载并显示历史记录
     */
    async loadAndDisplayHistory(panel) {
        try {
            const [summaries, statistics] = await Promise.all([
                this.storage.getAllSummaries(),
                this.storage.getStatistics()
            ]);
            panel.webview.html = this.getHistoryWebviewContent(summaries, statistics);
        }
        catch (error) {
            vscode.window.showErrorMessage(`加载历史记录失败: ${error}`);
        }
    }
    /**
     * 删除工作总结
     */
    async deleteSummary(id) {
        const confirm = await vscode.window.showWarningMessage('确定要删除这个工作总结吗？删除后将重置相关的提交记录，可以重新生成报告。', { modal: true }, '删除');
        if (confirm === '删除') {
            try {
                // 获取要删除的总结，以便重置相关的提交记录
                const summaryToDelete = await this.storage.getSummaryById(id);
                // 删除工作总结
                const deleted = await this.storage.deleteSummary(id);
                if (deleted && summaryToDelete) {
                    (0, logger_1.log)(`删除工作总结: ${id}, 包含 ${summaryToDelete.commits.length} 个提交`);
                    // 重置Git分析器的最后处理提交记录，以便重新处理这些提交
                    this.gitAnalyzer.resetLastProcessedCommit();
                    (0, logger_1.log)('已重置Git提交处理记录，相关提交可以重新处理');
                    vscode.window.showInformationMessage('工作总结已删除，相关提交记录已重置');
                }
                else {
                    vscode.window.showWarningMessage('工作总结不存在或删除失败');
                }
            }
            catch (error) {
                (0, logger_1.log)(`删除工作总结失败: ${error}`);
                vscode.window.showErrorMessage(`删除失败: ${error}`);
            }
        }
    }
    /**
     * 导出工作总结
     */
    async exportSummaries() {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('work-summaries.json'),
            filters: {
                'JSON 文件': ['json']
            }
        });
        if (saveUri) {
            try {
                await this.storage.exportSummaries(saveUri.fsPath);
                vscode.window.showInformationMessage('工作总结已导出');
            }
            catch (error) {
                vscode.window.showErrorMessage(`导出失败: ${error}`);
            }
        }
    }
    /**
     * 显示工作总结详情
     */
    async showSummaryDetails(id) {
        const summary = await this.storage.getSummaryById(id);
        if (!summary) {
            vscode.window.showErrorMessage('未找到工作总结');
            return;
        }
        const panel = vscode.window.createWebviewPanel('gitWorkSummaryDetails', `工作总结详情 - ${new Date(summary.timestamp).toLocaleDateString('zh-CN')}`, vscode.ViewColumn.Two, {
            enableScripts: true
        });
        panel.webview.html = this.getSummaryDetailsWebviewContent(summary);
    }
    /**
     * 获取历史记录 HTML 内容
     */
    getHistoryWebviewContent(summaries, statistics) {
        const summaryRows = summaries.map(summary => {
            const date = new Date(summary.timestamp).toLocaleString('zh-CN');
            const statusIcon = this.getStatusIcon(summary.reportStatus);
            const mainTasksPreview = summary.mainTasks.slice(0, 2).map(task => task.title).join(', ');
            const moreTasksText = summary.mainTasks.length > 2 ? `... 等 ${summary.mainTasks.length} 项` : '';
            // 获取类型标签和日期范围
            const typeTag = this.getTypeTag(summary);
            const dateRange = this.getDateRange(summary);
            return `
                <tr>
                    <td>${date}</td>
                    <td>${dateRange}</td>
                    <td>${typeTag}</td>
                    <td>${summary.commits.length}</td>
                    <td class="main-tasks">${mainTasksPreview}${moreTasksText}</td>
                    <td class="status ${summary.reportStatus}">${statusIcon} ${this.getStatusText(summary.reportStatus)}</td>
                    <td class="actions">
                        <button onclick="viewDetails('${summary.id}')" class="btn-small">详情</button>
                        <button onclick="deleteSummary('${summary.id}')" class="btn-small btn-danger">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>工作总结历史</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            padding: 15px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-charts-blue);
        }
        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--vscode-editor-background);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-input-border);
        }
        th {
            background-color: var(--vscode-input-background);
            font-weight: bold;
        }
        .main-tasks {
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .date-range {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            white-space: nowrap;
        }
        .type-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
        }
        .type-summary {
            background-color: var(--vscode-charts-blue);
            color: white;
        }
        .type-daily {
            background-color: var(--vscode-charts-green);
            color: white;
        }
        .type-weekly {
            background-color: var(--vscode-charts-purple);
            color: white;
        }
        .status {
            font-weight: bold;
        }
        .status.success {
            color: var(--vscode-charts-green);
        }
        .status.failed {
            color: var(--vscode-charts-red);
        }
        .status.pending {
            color: var(--vscode-charts-yellow);
        }
        .actions {
            white-space: nowrap;
        }
        button {
            padding: 6px 12px;
            margin-right: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn-small {
            padding: 4px 8px;
            font-size: 11px;
        }
        .btn-danger {
            background-color: var(--vscode-errorBackground);
            color: var(--vscode-errorForeground);
        }
        .btn-danger:hover {
            background-color: var(--vscode-errorBackground);
            opacity: 0.8;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Git Work Summary 历史记录</h1>
        <div>
            <button onclick="refresh()">刷新</button>
            <button onclick="exportData()">导出数据</button>
        </div>
    </div>

    <div class="statistics">
        <div class="stat-card">
            <div class="stat-number">${statistics.total}</div>
            <div class="stat-label">总计</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${statistics.thisWeek}</div>
            <div class="stat-label">本周</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${statistics.thisMonth}</div>
            <div class="stat-label">本月</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${statistics.successfulReports}</div>
            <div class="stat-label">上报成功</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${statistics.failedReports}</div>
            <div class="stat-label">上报失败</div>
        </div>
    </div>

    ${summaries.length > 0 ? `
    <table>
        <thead>
            <tr>
                <th>生成时间</th>
                <th>日期范围</th>
                <th>类型</th>
                <th>提交数</th>
                <th>主要工作</th>
                <th>上报状态</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            ${summaryRows}
        </tbody>
    </table>
    ` : `
    <div class="empty-state">
        <h3>暂无工作总结记录</h3>
        <p>开始使用 Git Work Summary 扩展后，工作总结将显示在这里</p>
    </div>
    `}

    <script>
        const vscode = acquireVsCodeApi();

        function refresh() {
            console.log('刷新按钮被点击');
            vscode.postMessage({ command: 'refresh' });
        }

        function exportData() {
            console.log('导出按钮被点击');
            vscode.postMessage({ command: 'export' });
        }

        function deleteSummary(id) {
            console.log('删除按钮被点击:', id);
            // 移除重复的确认对话框，因为后端已经有确认了
            vscode.postMessage({ command: 'delete', id: id });
        }

        function viewDetails(id) {
            console.log('查看详情按钮被点击:', id);
            vscode.postMessage({ command: 'viewDetails', id: id });
        }

        // 页面加载完成后的回调
        window.addEventListener('load', function() {
            console.log('历史记录页面加载完成');
        });
    </script>
</body>
</html>`;
    }
    /**
     * 获取工作总结详情 HTML 内容
     */
    getSummaryDetailsWebviewContent(summary) {
        const commitRows = summary.commits.map(commit => `
            <tr>
                <td><code>${commit.hash.substring(0, 8)}</code></td>
                <td>${commit.message}</td>
                <td>${commit.author}</td>
                <td>${commit.date.toLocaleString('zh-CN')}</td>
                <td>${commit.files.length}</td>
                <td class="changes">+${commit.additions} -${commit.deletions}</td>
            </tr>
        `).join('');
        const taskRows = summary.mainTasks.map(task => `
            <div class="task-card">
                <h4>${task.title}</h4>
                <p>${task.description}</p>
                <div class="task-meta">
                    <span class="duration">耗时: ${task.duration}</span>
                    <span class="progress ${task.progress}">${task.progress === 'completed' ? '已完成' : '进行中'}</span>
                </div>
                <div class="subtasks">
                    <h5>具体实现:</h5>
                    <ul>
                        ${task.subTasks.map(subtask => `<li>${subtask}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>工作总结详情</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.6;
        }
        .summary-header {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .summary-content {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-charts-blue);
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 6px 6px 0;
        }
        .task-card {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .task-card h4 {
            margin: 0 0 10px 0;
            color: var(--vscode-charts-blue);
        }
        .task-meta {
            display: flex;
            gap: 15px;
            margin: 10px 0;
            font-size: 12px;
        }
        .progress.completed {
            color: var(--vscode-charts-green);
        }
        .progress.ongoing {
            color: var(--vscode-charts-yellow);
        }
        .subtasks ul {
            margin: 5px 0;
            padding-left: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-input-border);
        }
        th {
            background-color: var(--vscode-input-background);
            font-weight: bold;
        }
        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
        .changes {
            font-family: monospace;
            font-size: 12px;
        }
        .section {
            margin: 30px 0;
        }
        .section h3 {
            border-bottom: 2px solid var(--vscode-input-border);
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="summary-header">
        <h1>工作总结详情</h1>
        <p><strong>生成时间:</strong> ${new Date(summary.timestamp).toLocaleString('zh-CN')}</p>
        <p><strong>总结 ID:</strong> <code>${summary.id}</code></p>
        <p><strong>上报状态:</strong> <span class="progress ${summary.reportStatus}">${this.getStatusText(summary.reportStatus)}</span></p>
        ${summary.reportError ? `<p><strong>错误信息:</strong> <span style="color: var(--vscode-charts-red);">${summary.reportError}</span></p>` : ''}
    </div>

    <div class="section">
        <h3>工作总结</h3>
        <div class="summary-content">
            ${(summary.summary || '暂无总结内容').replace(/\n/g, '<br>')}
        </div>
    </div>

    <div class="section">
        <h3>主要工作项</h3>
        ${taskRows}
    </div>

    <div class="section">
        <h3>代码提交记录</h3>
        <table>
            <thead>
                <tr>
                    <th>哈希</th>
                    <th>提交信息</th>
                    <th>作者</th>
                    <th>时间</th>
                    <th>文件数</th>
                    <th>变更</th>
                </tr>
            </thead>
            <tbody>
                ${commitRows}
            </tbody>
        </table>
    </div>
</body>
</html>`;
    }
    /**
     * 获取状态图标
     */
    getStatusIcon(status) {
        switch (status) {
            case 'success':
                return '✅';
            case 'failed':
                return '❌';
            case 'pending':
                return '⏳';
            default:
                return '❓';
        }
    }
    /**
     * 获取状态文本
     */
    getStatusText(status) {
        switch (status) {
            case 'success':
                return '成功';
            case 'failed':
                return '失败';
            case 'pending':
                return '待处理';
            default:
                return '未知';
        }
    }
    /**
     * 获取类型标签（只显示类型）
     */
    getTypeTag(summary) {
        const type = summary.type || 'daily'; // 默认为daily
        switch (type) {
            case 'daily':
                return '<span class="type-tag type-daily">日报</span>';
            case 'weekly':
                return '<span class="type-tag type-weekly">周报</span>';
            default:
                return '<span class="type-tag type-daily">日报</span>';
        }
    }
    /**
     * 获取日期范围
     */
    getDateRange(summary) {
        const type = summary.type || 'daily'; // 默认为daily
        switch (type) {
            case 'daily': {
                // 对于日报，直接使用 date 字段（格式如 '2024-01-15'）
                if (summary.date) {
                    const date = new Date(summary.date);
                    return date.toLocaleDateString('zh-CN');
                }
                else {
                    // 兼容旧数据，使用 timestamp
                    const timestamp = new Date(summary.timestamp);
                    return timestamp.toLocaleDateString('zh-CN');
                }
            }
            case 'weekly': {
                // 对于周报，date 字段格式为 '2024-01-15_2024-01-21'
                if (summary.date && summary.date.includes('_')) {
                    const [startDateStr, endDateStr] = summary.date.split('_');
                    const startDate = new Date(startDateStr);
                    const endDate = new Date(endDateStr);
                    return `${startDate.toLocaleDateString('zh-CN')} ~ ${endDate.toLocaleDateString('zh-CN')}`;
                }
                else {
                    // 兼容旧数据，使用 timestamp 计算周范围
                    const timestamp = new Date(summary.timestamp);
                    const weekStart = this.getStartOfWeek(timestamp);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const startStr = weekStart.toLocaleDateString('zh-CN');
                    const endStr = weekEnd.toLocaleDateString('zh-CN');
                    return `${startStr} ~ ${endStr}`;
                }
            }
            default: {
                // 默认情况，使用 date 字段或 timestamp
                if (summary.date) {
                    const date = new Date(summary.date);
                    return date.toLocaleDateString('zh-CN');
                }
                else {
                    const timestamp = new Date(summary.timestamp);
                    return timestamp.toLocaleDateString('zh-CN');
                }
            }
        }
    }
    /**
     * 获取周的开始日期（可配置）
     */
    getStartOfWeek(date) {
        const config = this.configManager.getConfiguration();
        const weekStartDay = config.weekStartDay; // 0=周日, 1=周一, ..., 6=周六
        const startOfWeek = new Date(date);
        const currentDay = startOfWeek.getDay(); // 0=周日, 1=周一, ..., 6=周六
        // 计算需要往前推多少天到达周起始日
        let daysToSubtract = currentDay - weekStartDay;
        if (daysToSubtract < 0) {
            daysToSubtract += 7; // 如果是负数，需要加7天
        }
        startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }
}
exports.HistoryViewProvider = HistoryViewProvider;
//# sourceMappingURL=historyViewProvider.js.map