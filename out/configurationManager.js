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
exports.ConfigurationManager = void 0;
const vscode = __importStar(require("vscode"));
class ConfigurationManager {
    getConfiguration() {
        const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
        return {
            enabled: config.get('enabled', true),
            interval: config.get('interval', 60),
            reportUrl: config.get('reportUrl', ''),
            reportHeaders: config.get('reportHeaders', {}),
            includeUncommittedChanges: config.get('includeUncommittedChanges', false),
            aiProvider: config.get('aiProvider', 'deepseek'),
            aiApiKey: config.get('aiApiKey', ''),
            aiBaseUrl: config.get('aiBaseUrl', ''),
            aiModel: config.get('aiModel', ''),
            aiTimeout: config.get('aiTimeout', 60),
            customPrompts: config.get('customPrompts', {}),
            enablePromptLogging: config.get('enablePromptLogging', true),
            maxCommits: config.get('maxCommits', 50),
            onlyMyCommits: config.get('onlyMyCommits', true),
            scanAllBranches: config.get('scanAllBranches', true),
            enableWeeklyReport: config.get('enableWeeklyReport', true),
            dailyReportTime: config.get('dailyReportTime', '18:00'),
            weeklyReportDay: config.get('weeklyReportDay', 5),
            weekStartDay: config.get('weekStartDay', 1),
            enableMultiProject: config.get('enableMultiProject', false),
            projectPaths: config.get('projectPaths', []),
            projectNames: config.get('projectNames', {})
        };
    }
    async updateConfiguration(key, value) {
        const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
    async showConfiguration() {
        const currentConfig = this.getConfiguration();
        // 显示配置面板
        const panel = vscode.window.createWebviewPanel('gitWorkSummaryConfig', 'Git Work Summary 配置', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = this.getConfigWebviewContent(currentConfig);
        // 处理来自 webview 的消息
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'save':
                    await this.saveConfiguration(message.config);
                    vscode.window.showInformationMessage('配置已保存');
                    panel.dispose();
                    break;
                case 'test':
                    await this.testConfiguration(message.config);
                    break;
            }
        });
    }
    async saveConfiguration(config) {
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
    async testConfiguration(config) {
        // 测试配置有效性
        const issues = [];
        if (!config.reportUrl.trim()) {
            issues.push('上报接口 URL 不能为空');
        }
        else if (!config.reportUrl.startsWith('http')) {
            issues.push('上报接口 URL 必须以 http 或 https 开头');
        }
        if (!config.aiApiKey.trim()) {
            issues.push('AI API Key 不能为空');
        }
        if (config.interval < 1) {
            issues.push('定时间隔必须大于 0 分钟');
        }
        if (config.maxCommits < 1) {
            issues.push('最大提交数量必须大于 0');
        }
        if (config.aiTimeout < 10 || config.aiTimeout > 300) {
            issues.push('AI 超时时间必须在 10-300 秒之间');
        }
        if (issues.length > 0) {
            vscode.window.showWarningMessage(`配置验证失败:\\n${issues.join('\\n')}`);
        }
        else {
            vscode.window.showInformationMessage('配置验证通过');
        }
    }
    getConfigWebviewContent(config) {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Work Summary 配置</title>
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
    <h1>Git Work Summary 配置</h1>
    
    <form id="configForm">
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enabled" ${config.enabled ? 'checked' : ''}>
                <label for="enabled">启用定时工作总结</label>
            </div>
        </div>

        <div class="form-group">
            <label for="interval">定时间隔（分钟）</label>
            <input type="number" id="interval" value="${config.interval}" min="1">
            <div class="help-text">建议设置为 60 分钟</div>
        </div>

        <div class="form-group">
            <label for="maxCommits">每次处理的最大提交数量</label>
            <input type="number" id="maxCommits" value="${config.maxCommits}" min="1">
            <div class="help-text">避免一次处理过多提交导致性能问题</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="onlyMyCommits" ${config.onlyMyCommits ? 'checked' : ''}>
                <label for="onlyMyCommits">只分析我的提交</label>
            </div>
            <div class="help-text">仅分析当前 Git 用户的提交记录，忽略团队其他成员的提交</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="scanAllBranches" ${config.scanAllBranches ? 'checked' : ''}>
                <label for="scanAllBranches">扫描所有本地分支</label>
            </div>
            <div class="help-text">扫描所有本地分支的提交记录，适用于多分支开发场景</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="includeUncommittedChanges" ${config.includeUncommittedChanges ? 'checked' : ''}>
                <label for="includeUncommittedChanges">包含未提交变更</label>
            </div>
            <div class="help-text">在日报中包含未提交的变更内容（避免重复总结）</div>
        </div>

        <div class="form-group">
            <label for="dailyReportTime">每日报告生成时间</label>
            <input type="time" id="dailyReportTime" value="${config.dailyReportTime}">
            <div class="help-text">设置每天生成工作报告的时间（24小时制）</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enableWeeklyReport" ${config.enableWeeklyReport ? 'checked' : ''}>
                <label for="enableWeeklyReport">启用每周工作报告</label>
            </div>
            <div class="help-text">每周自动生成工作报告</div>
        </div>

        <div class="form-group">
            <label for="weeklyReportDay">每周报告生成日期</label>
            <select id="weeklyReportDay">
                <option value="0" ${config.weeklyReportDay === 0 ? 'selected' : ''}>周日</option>
                <option value="1" ${config.weeklyReportDay === 1 ? 'selected' : ''}>周一</option>
                <option value="2" ${config.weeklyReportDay === 2 ? 'selected' : ''}>周二</option>
                <option value="3" ${config.weeklyReportDay === 3 ? 'selected' : ''}>周三</option>
                <option value="4" ${config.weeklyReportDay === 4 ? 'selected' : ''}>周四</option>
                <option value="5" ${config.weeklyReportDay === 5 ? 'selected' : ''}>周五</option>
                <option value="6" ${config.weeklyReportDay === 6 ? 'selected' : ''}>周六</option>
            </select>
            <div class="help-text">选择每周生成工作报告的日期</div>
        </div>

        <div class="form-group">
            <label for="weekStartDay">周报起始日期</label>
            <select id="weekStartDay">
                <option value="0" ${config.weekStartDay === 0 ? 'selected' : ''}>周日</option>
                <option value="1" ${config.weekStartDay === 1 ? 'selected' : ''}>周一</option>
                <option value="2" ${config.weekStartDay === 2 ? 'selected' : ''}>周二</option>
                <option value="3" ${config.weekStartDay === 3 ? 'selected' : ''}>周三</option>
                <option value="4" ${config.weekStartDay === 4 ? 'selected' : ''}>周四</option>
                <option value="5" ${config.weekStartDay === 5 ? 'selected' : ''}>周五</option>
                <option value="6" ${config.weekStartDay === 6 ? 'selected' : ''}>周六</option>
            </select>
            <div class="help-text">选择周报的起始日期</div>
        </div>

        <div class="form-group">
            <label for="aiProvider">AI 服务提供商</label>
            <select id="aiProvider">
                <option value="deepseek" ${config.aiProvider === 'deepseek' ? 'selected' : ''}>DeepSeek</option>
                <option value="openai" ${config.aiProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
            </select>
            <div class="help-text">选择要使用的 AI 服务提供商</div>
        </div>

        <div class="form-group">
            <label for="aiApiKey">AI API Key</label>
            <input type="password" id="aiApiKey" value="${config.aiApiKey}" placeholder="请输入 API Key">
            <div class="help-text">用于调用 AI 服务生成工作总结</div>
        </div>

        <div class="form-group">
            <label for="aiBaseUrl">AI API Base URL (可选)</label>
            <input type="text" id="aiBaseUrl" value="${config.aiBaseUrl}" placeholder="自定义 API 地址，留空使用默认值">
            <div class="help-text">如需使用自定义 API 地址，请填写此项</div>
        </div>

        <div class="form-group">
            <label for="aiModel">AI 模型 (可选)</label>
            <input type="text" id="aiModel" value="${config.aiModel}" placeholder="自定义模型名称，留空使用默认值">
            <div class="help-text">如需使用特定模型，请填写此项</div>
        </div>

        <div class="form-group">
            <label for="aiTimeout">AI 服务超时时间（秒）</label>
            <input type="number" id="aiTimeout" value="${config.aiTimeout}" min="10" max="300">
            <div class="help-text">AI 服务调用的超时时间，推理模型(如deepseek-reasoner)建议设置120秒以上</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enablePromptLogging" ${config.enablePromptLogging ? 'checked' : ''}>
                <label for="enablePromptLogging">启用提示词日志输出</label>
            </div>
            <div class="help-text">在控制台显示实际发送给AI的提示词，便于调试和优化</div>
        </div>

        <div class="form-group">
            <label for="customPrompts">自定义提示词配置（JSON格式）</label>
            <textarea id="customPrompts" rows="8" placeholder='{"dailySystemPrompt": "你是专业的日报分析师...", "summarySystemPrompt": "你是工作总结助手..."}'>${JSON.stringify(config.customPrompts, null, 2)}</textarea>
            <div class="help-text">
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
            <label for="reportUrl">上报接口 URL</label>
            <input type="text" id="reportUrl" value="${config.reportUrl}" placeholder="https://your-api.com/work-summary">
            <div class="help-text">工作总结将被上报到此接口</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enableMultiProject" ${config.enableMultiProject ? 'checked' : ''}>
                <label for="enableMultiProject">启用多项目合并功能</label>
            </div>
            <div class="help-text">启用后可以合并多个项目的日周报</div>
        </div>

        <div class="form-group">
            <label for="projectPaths">多项目路径列表（每行一个绝对路径）</label>
            <textarea id="projectPaths" rows="4" placeholder="/path/to/project1&#10;/path/to/project2">${config.projectPaths.join('\n')}</textarea>
            <div class="help-text">输入要合并的项目绝对路径，每行一个</div>
        </div>

        <div class="form-group">
            <label for="projectNames">项目名称映射（JSON格式）</label>
            <textarea id="projectNames" rows="4" placeholder='{"/path/to/project1": "前端项目", "/path/to/project2": "后端API"}'>${JSON.stringify(config.projectNames, null, 2)}</textarea>
            <div class="help-text">为项目路径设置友好的显示名称</div>
        </div>

        <div class="form-group">
            <label for="reportHeaders">上报接口请求头（JSON 格式）</label>
            <textarea id="reportHeaders" rows="4" placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'>${JSON.stringify(config.reportHeaders, null, 2)}</textarea>
            <div class="help-text">例如：认证信息、Content-Type 等</div>
        </div>

        <div style="margin-top: 20px;">
            <button type="button" onclick="saveConfig()">保存配置</button>
            <button type="button" onclick="testConfig()">测试配置</button>
        </div>
    </form>

    <script>
        const vscode = acquireVsCodeApi();

        function saveConfig() {
            const config = {
                enabled: document.getElementById('enabled').checked,
                interval: parseInt(document.getElementById('interval').value),
                maxCommits: parseInt(document.getElementById('maxCommits').value),
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
                alert('请求头 JSON 格式错误');
                return;
            }

            try {
                const customPromptsText = document.getElementById('customPrompts').value.trim();
                if (customPromptsText) {
                    config.customPrompts = JSON.parse(customPromptsText);
                }
            } catch (e) {
                alert('自定义提示词 JSON 格式错误');
                return;
            }

            try {
                const projectNamesText = document.getElementById('projectNames').value.trim();
                if (projectNamesText) {
                    config.projectNames = JSON.parse(projectNamesText);
                }
            } catch (e) {
                alert('项目名称映射 JSON 格式错误');
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
                alert('请求头 JSON 格式错误');
                return;
            }

            try {
                const customPromptsText = document.getElementById('customPrompts').value.trim();
                if (customPromptsText) {
                    config.customPrompts = JSON.parse(customPromptsText);
                }
            } catch (e) {
                alert('自定义提示词 JSON 格式错误');
                return;
            }

            try {
                const projectNamesText = document.getElementById('projectNames').value.trim();
                if (projectNamesText) {
                    config.projectNames = JSON.parse(projectNamesText);
                }
            } catch (e) {
                alert('项目名称映射 JSON 格式错误');
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
exports.ConfigurationManager = ConfigurationManager;
ConfigurationManager.CONFIG_SECTION = 'gitWorkSummary';
//# sourceMappingURL=configurationManager.js.map