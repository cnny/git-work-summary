import axios from 'axios';
import { ConfigurationManager } from './configurationManager';
import { MainTask } from './gitWorkSummaryManager';
import { log } from './logger';

export interface AISummaryResult {
    content: string;
    mainTasks: MainTask[];
}

export class AISummaryService {
    private apiKey: string = '';
    private baseUrl: string = '';
    private model: string = '';
    private provider: string = '';

    constructor(private configManager: ConfigurationManager) {
        this.updateConfiguration();
    }

    updateConfiguration(): void {
        const config = this.configManager.getConfiguration();
        this.provider = config.aiProvider;
        this.apiKey = config.aiApiKey;
        this.baseUrl = config.aiBaseUrl || this.getDefaultBaseUrl(config.aiProvider);
        this.model = config.aiModel || this.getDefaultModel(config.aiProvider);
        
        // 验证并修正DeepSeek模型
        if (this.provider === 'deepseek') {
            if (this.model === 'deepseek-reasoner' || this.model === 'deepseek-r1') {
                console.warn('推理模型可能需要更长响应时间，建议优先使用 deepseek-chat');
            }
        }
        
        log(`AI服务配置更新: Provider=${this.provider}, Model=${this.model}, BaseURL=${this.baseUrl}`);
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
                return 'deepseek-chat'; // 使用稳定的chat模型
            case 'openai':
                return 'gpt-4';
            case 'cursor':
                return 'gpt-4';
            default:
                return 'deepseek-chat';
        }
    }

    /**
     * 内部AI调用方法
     */
    private async callAIInternal(userPrompt: string, systemPrompt: string, mergeMessages: boolean): Promise<AISummaryResult> {
        // 使用配置的超时时间，如果是推理模型且配置时间较短则自动调整
        const config = this.configManager.getConfiguration();
        let timeout = config.aiTimeout * 1000; // 转换为毫秒
        
        // 如果是推理模型但配置的超时时间过短，自动调整
        if ((this.model.includes('reasoner') || this.model.includes('r1')) && config.aiTimeout < 90) {
            timeout = 120000; // 推理模型至少2分钟
            console.warn(`推理模型 ${this.model} 需要较长响应时间，自动调整超时为120秒`);
        }
        
        log(`发起AI请求: ${this.baseUrl}/chat/completions, 模型: ${this.model}, 超时: ${timeout}ms, 合并消息: ${mergeMessages}`);
        
        // 输出提示词日志（如果启用）
        if (config.enablePromptLogging) {
            log('=== AI提示词日志 ===');
            log('系统提示词:');
            log(systemPrompt);
            log('\n用户提示词:');
            log(userPrompt);
            log('==================');
        }
        
        // 构建消息
        let messages;
        if (mergeMessages) {
            // 合并system和user消息
            const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
            messages = [
                {
                    role: 'user',
                    content: combinedPrompt
                }
            ];
        } else {
            // 标准格式
            messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ];
        }
        
        const requestData: any = {
            model: this.model,
            messages: messages,
            temperature: this.model.includes('reasoner') ? 0.1 : 0.3, // 推理模型使用更低的温度
            max_tokens: 2000,
            stream: false
        };
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'VSCode-Extension/1.0.0'
                    },
                    timeout: timeout,
                    validateStatus: function (status) {
                        return status >= 200 && status < 300;
                    }
                }
            );

            log(`AI请求成功，状态码: ${response.status}`);
            
            if (!response.data.choices || response.data.choices.length === 0) {
                throw new Error('AI 服务返回空响应');
            }
            
            return this.parseAIResponse(response.data.choices[0].message.content);
        } catch (error) {
            console.error('AI服务调用详细错误:', error);
            
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error(`AI 服务调用超时 (${this.model})，请检查网络连接或更换模型`);
                }
                
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    throw new Error(`无法连接到 AI 服务 (${this.baseUrl})，请检查网络或配置`);
                }
                
                const statusCode = error.response?.status;
                const errorMessage = error.response?.data?.error?.message || 
                                   error.response?.data?.message || 
                                   error.message;
                
                if (statusCode === 401) {
                    throw new Error('AI API Key 无效或已过期');
                } else if (statusCode === 429) {
                    throw new Error('AI 服务请求过于频繁，请稍后重试');
                } else if (statusCode && statusCode >= 500) {
                    throw new Error(`AI 服务器错误 (${statusCode})，请稍后重试`);
                }
                
                throw new Error(`AI 服务调用失败 (${statusCode}): ${errorMessage}`);
            }
            
            throw new Error(`AI 服务调用失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 解析 AI 响应
     */
    private parseAIResponse(content: string): AISummaryResult {
        try {
            // 尝试从响应中提取 JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('AI 响应格式不正确，未找到 JSON');
            }

            const jsonStr = jsonMatch[0];
            const result = JSON.parse(jsonStr);

            // 验证必要字段
            if (!result.content || !Array.isArray(result.mainTasks)) {
                throw new Error('AI 响应缺少必要字段');
            }

            // 验证 mainTasks 结构
            for (const task of result.mainTasks) {
                if (!task.title || !task.description || !Array.isArray(task.subTasks)) {
                    throw new Error('mainTasks 结构不正确');
                }
                
                // 设置默认值
                task.duration = task.duration || '未知';
                task.progress = task.progress || 'ongoing';
            }

            return {
                content: result.content,
                mainTasks: result.mainTasks
            };
        } catch (error) {
            // 如果解析失败，返回基础总结
            return this.createFallbackSummary(content);
        }
    }

    /**
     * 创建降级总结（当 AI 响应解析失败时）
     */
    private createFallbackSummary(content: string): AISummaryResult {
        return {
            content: content || '工作总结生成失败，请检查提交内容',
            mainTasks: [
                {
                    title: '代码开发',
                    description: '进行了代码开发和修改',
                    subTasks: ['代码编写', '功能实现', '问题修复'],
                    duration: '未知',
                    progress: 'ongoing'
                }
            ]
        };
    }

    /**
     * 测试 AI 服务连接
     */
    async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            console.error('AI API Key 未配置');
            return false;
        }

        try {
            const config = this.configManager.getConfiguration();
            const testTimeout = Math.min(config.aiTimeout * 1000, 30000); // 测试连接最多30秒
            
            log(`测试AI连接: ${this.baseUrl}, 模型: ${this.model}, 超时: ${testTimeout}ms`);
            
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: '测试连接，请回复"连接成功"'
                        }
                    ],
                    max_tokens: 10,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'VSCode-Extension/1.0.0'
                    },
                    timeout: testTimeout
                }
            );

            console.log(`AI连接测试成功，状态码: ${response.status}`);
            return response.status === 200;
        } catch (error) {
            console.error('AI连接测试失败:', error);
            
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    console.error('连接超时');
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    console.error('无法连接到服务器');
                } else if (error.response?.status === 401) {
                    console.error('API Key无效');
                } else if (error.response?.status === 400) {
                    console.error('模型不支持或参数错误');
                }
            }
            
            return false;
        }
    }

    /**
     * 生成项目报告
     */
    async generateReport(
        commits: any[],
        projectStats: any[],
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): Promise<AISummaryResult> {
        try {
            const prompt = this.buildReportPrompt(commits, projectStats, reportType, period);
            
            const config = this.configManager.getConfiguration();
            if (config.enablePromptLogging) {
                console.log('\n📝 项目报告提示词:');
                console.log('=====================================');
                console.log(prompt);
                console.log('=====================================\n');
            }

            const systemPrompt = this.getReportSystemPrompt(reportType);
            return await this.callAIInternal(prompt, systemPrompt, false);
        } catch (error) {
            console.error('生成项目报告失败:', error);
            throw error;
        }
    }

    /**
     * 构建项目报告提示词
     */
    private buildReportPrompt(
        commits: any[],
        projectStats: any[],
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): string {
        const config = this.configManager.getConfiguration();
        const startDate = period.start.toLocaleDateString('zh-CN');
        const endDate = period.end.toLocaleDateString('zh-CN');
        
        // 检查是否有自定义用户提示词模板
        const customTemplate = reportType === 'daily' 
            ? config.customPrompts.dailyUserPromptTemplate
            : config.customPrompts.weeklyUserPromptTemplate;
            
        if (customTemplate) {
            return this.buildCustomReportPrompt(customTemplate, commits, projectStats, reportType, period);
        }
        
        // 使用默认提示词
        const dateRange = reportType === 'daily' ? startDate : `${startDate} - ${endDate}`;
        let prompt = `请生成 ${dateRange} 的项目${reportType === 'daily' ? '日报' : '周报'}：\n\n`;

        // 1. 项目概览
        const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
        const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
        const allFiles = [...new Set(commits.flatMap(c => c.files))];
        
        prompt += `## 项目概览：\n`;
        prompt += `- 涉及项目：${projectStats.length} 个\n`;
        prompt += `- 总提交：${commits.length} 个\n`;
        prompt += `- 代码变更：+${totalAdditions}/-${totalDeletions} 行\n`;
        prompt += `- 涉及文件：${allFiles.length} 个\n\n`;

        // 2. 各项目详细情况（只包含有变更的项目）
        const projectsWithCommits = projectStats.filter(stats => stats.commitCount > 0);
        if (projectsWithCommits.length > 0) {
            prompt += `## 各项目详细情况：\n`;
            for (const stats of projectsWithCommits) {
                prompt += `### 📂 ${stats.projectName} (${stats.projectPath})\n`;
                prompt += `- 提交数：${stats.commitCount} 个\n`;
                prompt += `- 代码变更：+${stats.additions}/-${stats.deletions} 行\n`;
                prompt += `- 涉及文件：${stats.fileCount} 个\n\n`;

                // 该项目的详细提交记录
                const projectCommits = commits.filter(c => c.projectPath === stats.projectPath);
                if (projectCommits.length > 0) {
                    prompt += `#### 详细提交记录：\n`;
                    projectCommits.forEach((commit, index) => {
                        prompt += `**提交 ${index + 1}：**\n`;
                        prompt += `- 消息：${commit.message}\n`;
                        prompt += `- 时间：${commit.date.toLocaleString('zh-CN')}\n`;
                        prompt += `- 作者：${commit.author}\n`;
                        prompt += `- 代码变更：+${commit.additions}/-${commit.deletions} 行\n`;
                        prompt += `- 修改文件（${commit.files.length}个）：\n`;
                        
                        commit.files.slice(0, 3).forEach((file: string, fileIndex: number) => {
                            prompt += `  ${fileIndex + 1}. ${file}\n`;
                        });
                        if (commit.files.length > 3) {
                            prompt += `  ... 等共${commit.files.length}个文件\n`;
                        }
                        
                        prompt += '\n';
                    });
                }
                prompt += '\n';
            }
        }

        // 3. 跨项目功能分析和合并要求
        prompt += `## 跨项目功能分析要求：\n`;
        prompt += `**重要：识别跨项目功能，一个功能只输出一条记录**\n\n`;
        
        prompt += `### 功能识别策略：\n`;
        prompt += `1. **按功能模块合并**：如果多个项目的提交都是为了同一个功能（如：用户认证、数据同步、API接口等），应合并为一个功能项\n`;
        prompt += `2. **按业务需求合并**：如果多个项目的修改都服务于同一个业务需求，应合并描述\n`;
        prompt += `3. **按时间关联合并**：时间相近且明显相关的跨项目提交应合并\n`;
        prompt += `4. **按文件路径识别**：相似的文件路径和模块结构表明可能是同一功能的不同部分\n\n`;
        
        prompt += `### 合并示例：\n`;
        prompt += `- ❌ 错误：项目A-用户登录功能、项目B-用户登录功能、项目C-用户登录功能\n`;
        prompt += `- ✅ 正确：用户登录功能（涉及前端、后端、数据库三个项目）\n\n`;

        // 4. 分析要求
        prompt += `## 分析要求：\n`;
        prompt += `1. **跨项目功能优先**：优先识别和合并跨项目的功能开发\n`;
        prompt += `2. **功能导向描述**：按功能而非项目来组织内容\n`;
        prompt += `3. **项目协作体现**：在描述中体现项目间的协作关系\n`;
        prompt += `4. **避免重复**：同一功能不要在多个项目中重复描述\n`;
        prompt += `5. **简洁实用**：客观描述实际完成情况\n\n`;

        prompt += `请按以下JSON格式输出：\n`;
        prompt += `{\n`;
        prompt += `  "content": "项目${reportType === 'daily' ? '日报' : '周报'}总结，重点体现跨项目功能协作",\n`;
        prompt += `  "mainTasks": [\n`;
        prompt += `    {\n`;
        prompt += `      "title": "功能名称（如涉及项目请在描述中说明）",\n`;
        prompt += `      "description": "功能完成情况和涉及的项目协作",\n`;
        prompt += `      "subTasks": ["具体完成的事项（标注项目）"],\n`;
        prompt += `      "duration": "投入时间估算",\n`;
        prompt += `      "progress": "completed|ongoing"\n`;
        prompt += `    }\n`;
        prompt += `  ]\n`;
        prompt += `}`;

        return prompt;
    }

    /**
     * 使用自定义模板构建报告提示词
     */
    private buildCustomReportPrompt(
        template: string,
        commits: any[],
        projectStats: any[],
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): string {
        const startDate = period.start.toLocaleDateString('zh-CN');
        const endDate = period.end.toLocaleDateString('zh-CN');
        
        // 构建提交信息字符串
        let commitsInfo = '';
        if (commits.length > 0) {
            const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
            const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
            
            commitsInfo += `总提交数: ${commits.length} 个\n`;
            commitsInfo += `代码变更: +${totalAdditions}/-${totalDeletions} 行\n\n`;
            
            commits.forEach((commit, index) => {
                commitsInfo += `提交 ${index + 1}: ${commit.hash.substring(0, 8)}\n`;
                commitsInfo += `- 时间: ${commit.date.toLocaleString('zh-CN')}\n`;
                commitsInfo += `- 消息: ${commit.message}\n`;
                commitsInfo += `- 作者: ${commit.author}\n`;
                commitsInfo += `- 项目: ${commit.projectName || '未知项目'}\n`;
                commitsInfo += `- 变更: +${commit.additions}/-${commit.deletions} 行\n`;
                commitsInfo += `- 文件: ${commit.files.join(', ')}\n\n`;
            });
        } else {
            commitsInfo = `${reportType === 'daily' ? '今日' : '本周'}无提交记录\n`;
        }
        
        // 构建项目统计信息
        let projectStatsInfo = '';
        if (projectStats.length > 0) {
            projectStatsInfo += `项目统计信息:\n`;
            projectStats.forEach((stats, index) => {
                projectStatsInfo += `${index + 1}. ${stats.projectName}: ${stats.commitCount} 个提交\n`;
            });
            projectStatsInfo += '\n';
        }
        
        // 替换模板中的占位符
        let result = template
            .replace(/\{commits\}/g, commitsInfo)
            .replace(/\{projectStats\}/g, projectStatsInfo)
            .replace(/\{commitsCount\}/g, commits.length.toString())
            .replace(/\{projectCount\}/g, projectStats.length.toString());
        
        // 根据报告类型替换日期占位符
        if (reportType === 'daily') {
            result = result.replace(/\{date\}/g, startDate);
        } else {
            result = result.replace(/\{startDate\}/g, startDate);
            result = result.replace(/\{endDate\}/g, endDate);
        }
        
        return result;
    }

    /**
     * 获取报告系统提示词
     */
    private getReportSystemPrompt(reportType: 'daily' | 'weekly'): string {
        const config = this.configManager.getConfiguration();
        
        // 使用自定义提示词（如果配置了）
        if (reportType === 'daily' && config.customPrompts.dailySystemPrompt) {
            return config.customPrompts.dailySystemPrompt;
        }
        if (reportType === 'weekly' && config.customPrompts.weeklySystemPrompt) {
            return config.customPrompts.weeklySystemPrompt;
        }
        
        // 检查是否为多项目模式，使用对应的提示词
        if (config.enableMultiProject && config.customPrompts.multiProjectSystemPrompt) {
            return config.customPrompts.multiProjectSystemPrompt;
        }
        
        // 朴实的系统提示词
        const isMultiProject = config.enableMultiProject && config.projectPaths.length > 1;
        
        if (reportType === 'daily') {
            return `你是${isMultiProject ? '多项目' : ''}工作日报分析师，任务是：

1. 分析Git提交记录，识别完成的工作
2. 将相关提交合并为完整的工作项${isMultiProject ? '，识别跨项目协作' : ''}
3. 生成简洁的日报

分析原则：
- 重点关注实际完成的工作
- 合并相关提交为完整的功能
${isMultiProject ? '- 智能识别跨项目的同一功能，避免重复描述\n- 在功能描述中标注涉及的项目' : ''}
- 使用简洁朴实的语言
- 避免过度解释和分析

输出要求：
- 使用中文，内容简洁
- 严格JSON格式，确保可解析
- 客观描述工作内容${isMultiProject ? '\n- 跨项目功能请在描述中说明涉及的项目' : ''}`;
        } else {
            return `你是${isMultiProject ? '多项目' : ''}周工作报告分析师，任务是：

1. 整合一周的工作成果
2. 按项目或功能模块组织内容
3. 生成简洁的周报

分析要求：
- 按项目整合本周工作
${isMultiProject ? '- 识别跨项目协作的功能，合并描述\n- 避免将同一功能在不同项目中重复列出' : ''}
- 客观描述完成情况
- 使用简洁朴实的语言
- 实事求是地总结工作

输出要求：
- 使用中文，格式为标准JSON
- 内容简洁明了${isMultiProject ? '\n- 跨项目协作请在描述中说明项目分工' : ''}`;
        }
    }

    /**
     * 为未提交的变更生成功能摘要
     */
    async generateUncommittedSummary(changes: {
        staged: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
        modified: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
    }): Promise<string> {
        if (!this.apiKey) {
            throw new Error('AI API Key 未配置');
        }

        const allChanges = [...changes.staged, ...changes.modified];
        if (allChanges.length === 0) {
            return '';
        }

        const prompt = this.buildUncommittedSummaryPrompt(changes);
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: this.getUncommittedSummarySystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 300
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error('生成未提交变更摘要失败:', error);
            return '';
        }
    }

    private buildUncommittedSummaryPrompt(changes: {
        staged: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
        modified: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
    }): string {
        let prompt = `当前工作区的代码变更：\n\n`;
        
        if (changes.staged.length > 0) {
            prompt += `已暂存的变更：\n`;
            changes.staged.forEach((change, index) => {
                prompt += `${index + 1}. ${change.file} (${change.status})\n`;
                // 只取diff的关键部分
                const diffLines = change.diff.split('\n')
                    .filter(line => line.startsWith('+') || line.startsWith('-'))
                    .slice(0, 10);
                if (diffLines.length > 0) {
                    prompt += diffLines.join('\n') + '\n';
                }
            });
            prompt += '\n';
        }

        if (changes.modified.length > 0) {
            prompt += `已修改未暂存的变更：\n`;
            changes.modified.forEach((change, index) => {
                prompt += `${index + 1}. ${change.file} (${change.status})\n`;
                // 只取diff的关键部分
                const diffLines = change.diff.split('\n')
                    .filter(line => line.startsWith('+') || line.startsWith('-'))
                    .slice(0, 10);
                if (diffLines.length > 0) {
                    prompt += diffLines.join('\n') + '\n';
                }
            });
        }

        prompt += `\n请分析这些代码变更，生成一个简短的功能摘要（不超过100字）。`;
        
        return prompt;
    }

    private getUncommittedSummarySystemPrompt(): string {
        return `你是一个专业的代码变更分析助手。你的任务是：

1. 分析当前工作区的代码变更
2. 理解开发者正在进行的工作内容
3. 生成简洁的功能摘要

要求：
- 使用中文
- 不超过100字
- 重点说明正在开发的功能或修复的问题
- 区分已暂存和未暂存的变更
- 避免技术细节，重点说明业务功能

输出格式：
- 如果有暂存变更："准备提交：[功能描述]"
- 如果有未暂存变更："正在开发：[功能描述]"
- 如果两者都有："准备提交：[功能A]；正在开发：[功能B]"`;
    }

    /**
     * 获取当前配置的实际提示词内容
     */
    getCurrentPrompts(): string {
        const config = this.configManager.getConfiguration();
        let content = '';

        // 创建模拟数据用于演示提示词
        const mockCommits = [
            {
                hash: 'a1b2c3d4',
                author: '张三',
                date: new Date('2024-01-15T09:30:15'),
                message: 'feat: 实现用户登录接口',
                files: ['src/auth/login.js', 'src/routes/auth.js'],
                additions: 45,
                deletions: 5,
                projectName: '后端API项目'
            },
            {
                hash: 'e5f6g7h8',
                author: '李四',
                date: new Date('2024-01-15T14:20:30'),
                message: 'fix: 修复登录页面样式问题',
                files: ['src/components/Login.vue', 'src/styles/auth.css'],
                additions: 25,
                deletions: 8,
                projectName: '前端UI项目'
            }
        ];

        const mockProjectStats = [
            { projectName: '后端API项目', commitCount: 1 },
            { projectName: '前端UI项目', commitCount: 1 }
        ];

        const mockPeriod = {
            start: new Date('2024-01-15'),
            end: new Date('2024-01-15')
        };

        content += '# 当前AI提示词配置详情\n\n';
        content += `*生成时间: ${new Date().toLocaleString('zh-CN')}*\n\n`;

        // AI服务配置
        content += '## 🔧 AI服务配置\n\n';
        content += `- **AI提供商**: ${config.aiProvider}\n`;
        content += `- **AI模型**: ${config.aiModel || '默认'}\n`;
        content += `- **API地址**: ${config.aiBaseUrl || '默认'}\n`;
        content += `- **超时时间**: ${config.aiTimeout}秒\n`;
        content += `- **API Key**: ${config.aiApiKey ? '已配置' : '未配置'}\n`;
        content += `- **提示词日志**: ${config.enablePromptLogging ? '已启用' : '已禁用'}\n\n`;

        // 多项目配置
        content += '## 🏗️ 项目配置\n\n';
        content += `- **多项目模式**: ${config.enableMultiProject ? '已启用' : '已禁用'}\n`;
        if (config.enableMultiProject) {
            content += `- **项目数量**: ${config.projectPaths.length} 个\n`;
            if (config.projectPaths.length > 0) {
                content += '- **项目列表**:\n';
                config.projectPaths.forEach((path, index) => {
                    const projectName = config.projectNames[path] || `项目${index + 1}`;
                    content += `  ${index + 1}. ${projectName}\n`;
                });
            }
        }
        content += '\n';

        // 自定义提示词配置
        content += '## ⚙️ 自定义提示词配置\n\n';
        if (Object.keys(config.customPrompts).length > 0) {
            content += '```json\n';
            content += JSON.stringify(config.customPrompts, null, 2);
            content += '\n```\n\n';
        } else {
            content += '当前使用默认提示词（未配置自定义提示词）\n\n';
        }

        // 实际系统提示词
        content += '## 📝 实际系统提示词\n\n';
        
        content += '### 日报系统提示词\n';
        content += '```\n';
        content += this.getReportSystemPrompt('daily');
        content += '\n```\n\n';

        content += '### 周报系统提示词\n';
        content += '```\n';
        content += this.getReportSystemPrompt('weekly');
        content += '\n```\n\n';

        // 实际用户提示词示例
        content += '## 📋 实际用户提示词示例\n\n';
        
        content += '### 日报用户提示词示例\n';
        content += '```\n';
        content += this.buildReportPrompt(mockCommits, mockProjectStats, 'daily', mockPeriod);
        content += '\n```\n\n';

        content += '### 周报用户提示词示例\n';
        content += '```\n';
        content += this.buildReportPrompt(mockCommits, mockProjectStats, 'weekly', {
            start: new Date('2024-01-15'),
            end: new Date('2024-01-21')
        });
        content += '\n```\n\n';

        // 未提交变更提示词
        content += '## 🔄 未提交变更分析提示词\n\n';
        content += '### 系统提示词\n';
        content += '```\n';
        content += this.getUncommittedSummarySystemPrompt();
        content += '\n```\n\n';

        // 占位符说明
        content += '## 📖 占位符说明\n\n';
        content += '### 用户提示词模板支持的占位符\n';
        content += '- `{commits}`: 提交信息详情\n';
        content += '- `{projectStats}`: 项目统计信息\n';
        content += '- `{commitsCount}`: 总提交数量\n';
        content += '- `{projectCount}`: 涉及项目数量\n';
        content += '- `{date}`: 报告日期（日报）\n';
        content += '- `{startDate}`: 开始日期（周报）\n';
        content += '- `{endDate}`: 结束日期（周报）\n\n';

        // 配置建议
        content += '## 💡 配置建议\n\n';
        if (!config.aiApiKey) {
            content += '⚠️ **AI API Key 未配置** - 请在配置中添加有效的API Key\n\n';
        }
        if (!config.enablePromptLogging) {
            content += '💡 **建议启用提示词日志** - 可以在控制台查看实际发送给AI的提示词\n\n';
        }
        if (config.enableMultiProject && config.projectPaths.length === 0) {
            content += '⚠️ **多项目模式已启用但未配置项目路径** - 请添加项目路径\n\n';
        }
        if (Object.keys(config.customPrompts).length === 0) {
            content += '💡 **可以配置自定义提示词** - 根据团队需求定制AI分析风格\n\n';
        }

        content += '---\n\n';
        content += '*提示：修改配置后无需重启VS Code，扩展会自动重新加载配置*\n';
        content += '*如需查看实时提示词日志，请启用"提示词日志输出"并查看输出控制台*';

        return content;
    }
} 