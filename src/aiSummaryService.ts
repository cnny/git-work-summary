import axios from 'axios';
import { CommitInfo, WorkSummary, MainTask } from './gitWorkSummaryManager';
import { ConfigurationManager, CustomPrompts } from './configurationManager';

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
        
        console.log(`AI服务配置更新: Provider=${this.provider}, Model=${this.model}, BaseURL=${this.baseUrl}`);
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
     * 生成工作总结
     */
    async generateSummary(commits: CommitInfo[], historySummaries: WorkSummary[]): Promise<AISummaryResult> {
        if (!this.apiKey) {
            throw new Error('AI API Key 未配置');
        }

        const prompt = this.buildPrompt(commits, historySummaries);
        
        // 第一次尝试：使用标准格式
        try {
            return await this.callAI(prompt, false);
        } catch (error) {
            console.warn('标准格式调用失败，尝试合并消息格式:', error);
            
            // 第二次尝试：合并system和user消息（某些模型可能不支持system role）
            if (this.model.includes('reasoner') || this.model.includes('r1')) {
                try {
                    return await this.callAI(prompt, true);
                } catch (retryError) {
                    console.error('合并消息格式也失败:', retryError);
                    throw retryError;
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * 调用AI接口的通用方法（带自定义系统提示词）
     */
    private async callAIWithSystemPrompt(userPrompt: string, systemPrompt: string): Promise<AISummaryResult> {
        // 第一次尝试：使用标准格式
        try {
            return await this.callAIInternal(userPrompt, systemPrompt, false);
        } catch (error) {
            console.warn('标准格式调用失败，尝试合并消息格式:', error);
            
            // 第二次尝试：合并system和user消息（某些模型可能不支持system role）
            if (this.model.includes('reasoner') || this.model.includes('r1')) {
                try {
                    return await this.callAIInternal(userPrompt, systemPrompt, true);
                } catch (retryError) {
                    console.error('合并消息格式也失败:', retryError);
                    throw retryError;
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * 调用AI接口的通用方法
     */
    private async callAI(prompt: string, mergeMessages: boolean): Promise<AISummaryResult> {
        return await this.callAIInternal(prompt, this.getSystemPrompt(), mergeMessages);
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
        
        console.log(`发起AI请求: ${this.baseUrl}/chat/completions, 模型: ${this.model}, 超时: ${timeout}ms, 合并消息: ${mergeMessages}`);
        
        // 输出提示词日志（如果启用）
        if (config.enablePromptLogging) {
            console.log('=== AI提示词日志 ===');
            console.log('系统提示词:');
            console.log(systemPrompt);
            console.log('\n用户提示词:');
            console.log(userPrompt);
            console.log('==================');
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

            console.log(`AI请求成功，状态码: ${response.status}`);
            
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
     * 构建提示词
     */
    private buildPrompt(commits: CommitInfo[], historySummaries: WorkSummary[]): string {
        const config = this.configManager.getConfiguration();
        
        // 使用自定义用户提示词模板（如果配置了）
        if (config.customPrompts.summaryUserPromptTemplate) {
            return this.buildCustomPrompt(config.customPrompts.summaryUserPromptTemplate, commits, historySummaries);
        }
        
        // 默认提示词构建
        let prompt = '请分析以下 Git 提交记录并生成工作总结：\n\n';

        // 计算总体时间范围
        if (commits.length > 0) {
            const firstCommit = commits[commits.length - 1];
            const lastCommit = commits[0];
            const timeSpan = lastCommit.date.getTime() - firstCommit.date.getTime();
            const hours = Math.round(timeSpan / (1000 * 60 * 60) * 10) / 10; // 保留1位小数
            const days = Math.ceil(timeSpan / (1000 * 60 * 60 * 24));
            
            prompt += `## 工作时间范围：\n`;
            prompt += `- 开始时间: ${firstCommit.date.toLocaleString('zh-CN')}\n`;
            prompt += `- 结束时间: ${lastCommit.date.toLocaleString('zh-CN')}\n`;
            prompt += `- 总时间跨度: ${hours}小时 (${days}天)\n`;
            prompt += `- 提交频率: 平均每${Math.round(hours/commits.length * 10) / 10}小时一次提交\n\n`;
        }

        // 添加当前提交信息
        prompt += '## 本次提交记录：\n';
        commits.forEach((commit, index) => {
            prompt += `### 提交 ${index + 1}:\n`;
            prompt += `- 哈希: ${commit.hash.substring(0, 8)}\n`;
            prompt += `- 作者: ${commit.author}\n`;
            prompt += `- 时间: ${commit.date.toLocaleString('zh-CN')}\n`;
            prompt += `- 消息: ${commit.message}\n`;
            prompt += `- 修改文件: ${commit.files.join(', ')}\n`;
            prompt += `- 新增行数: ${commit.additions}, 删除行数: ${commit.deletions}\n`;
            
            // 计算与上一个提交的时间间隔
            if (index > 0) {
                const prevCommit = commits[index - 1];
                const timeDiff = prevCommit.date.getTime() - commit.date.getTime();
                const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60) * 10) / 10;
                prompt += `- 距离上次提交: ${hoursDiff}小时\n`;
            }
            prompt += '\n';
        });

        // 添加历史总结信息用于合并
        if (historySummaries.length > 0) {
            prompt += '## 最近工作历史：\n';
            historySummaries.slice(0, 5).forEach((summary, index) => {
                prompt += `### ${index + 1}. ${new Date(summary.timestamp).toLocaleDateString('zh-CN')}:\n`;
                summary.mainTasks.forEach(task => {
                    prompt += `- ${task.title}: ${task.description} (${task.progress}, 耗时: ${task.duration})\n`;
                });
                prompt += '\n';
            });
        }

        prompt += `
## 总结要求：
1. 结合历史工作内容，识别出主要的工作项目/需求
2. 对于跨多次提交的同一个需求或功能，应该合并为一个大项
3. 每个主要工作项包含多个具体的实现细节
4. 总结应该体现工作的连续性和完整性
5. 使用中文进行总结
6. **重要**: 耗时估算要准确，以小时为单位，参考：
   - 小功能修改: 0.5-2小时
   - 中等功能开发: 2-8小时
   - 大型功能开发: 8-24小时
   - 复杂功能或架构: 24小时以上
   - 根据提交的代码量、文件数、时间跨度来综合评估

请按以下 JSON 格式输出：
{
  "content": "整体工作总结内容",
  "mainTasks": [
    {
      "title": "主要工作项标题",
      "description": "详细描述",
      "subTasks": ["具体实现1", "具体实现2"],
      "duration": "X.X小时", 
      "progress": "ongoing|completed"
    }
  ]
}`;

        return prompt;
    }

    /**
     * 使用自定义模板构建提示词
     */
    private buildCustomPrompt(template: string, commits: CommitInfo[], historySummaries: WorkSummary[]): string {
        // 构建提交信息字符串
        let commitsInfo = '';
        commits.forEach((commit, index) => {
            commitsInfo += `提交 ${index + 1}:\n`;
            commitsInfo += `- 哈希: ${commit.hash.substring(0, 8)}\n`;
            commitsInfo += `- 作者: ${commit.author}\n`;
            commitsInfo += `- 时间: ${commit.date.toLocaleString('zh-CN')}\n`;
            commitsInfo += `- 消息: ${commit.message}\n`;
            commitsInfo += `- 修改文件: ${commit.files.join(', ')}\n`;
            commitsInfo += `- 新增行数: ${commit.additions}, 删除行数: ${commit.deletions}\n\n`;
        });

        // 构建历史总结信息字符串
        let historyInfo = '';
        if (historySummaries.length > 0) {
            historySummaries.slice(0, 5).forEach((summary, index) => {
                historyInfo += `${index + 1}. ${new Date(summary.timestamp).toLocaleDateString('zh-CN')}:\n`;
                summary.mainTasks.forEach(task => {
                    historyInfo += `- ${task.title}: ${task.description} (${task.progress}, 耗时: ${task.duration})\n`;
                });
                historyInfo += '\n';
            });
        }

        // 时间范围信息
        let timeRangeInfo = '';
        if (commits.length > 0) {
            const firstCommit = commits[commits.length - 1];
            const lastCommit = commits[0];
            const timeSpan = lastCommit.date.getTime() - firstCommit.date.getTime();
            const hours = Math.round(timeSpan / (1000 * 60 * 60) * 10) / 10;
            const days = Math.ceil(timeSpan / (1000 * 60 * 60 * 24));
            
            timeRangeInfo = `开始时间: ${firstCommit.date.toLocaleString('zh-CN')}\n`;
            timeRangeInfo += `结束时间: ${lastCommit.date.toLocaleString('zh-CN')}\n`;
            timeRangeInfo += `总时间跨度: ${hours}小时 (${days}天)\n`;
            timeRangeInfo += `提交频率: 平均每${Math.round(hours/commits.length * 10) / 10}小时一次提交`;
        }

        // 替换模板中的占位符
        return template
            .replace(/\{commits\}/g, commitsInfo)
            .replace(/\{history\}/g, historyInfo)
            .replace(/\{timeRange\}/g, timeRangeInfo)
            .replace(/\{commitsCount\}/g, commits.length.toString())
            .replace(/\{historyCount\}/g, historySummaries.length.toString());
    }

    /**
     * 获取系统提示词
     */
    private getSystemPrompt(): string {
        const config = this.configManager.getConfiguration();
        
        // 使用自定义提示词（如果配置了）
        if (config.customPrompts.summarySystemPrompt) {
            return config.customPrompts.summarySystemPrompt;
        }
        
        // 默认系统提示词
        const providerNote = this.provider === 'deepseek' 
            ? '你是基于 DeepSeek 的专业软件开发工作总结助手。' 
            : '你是一个专业的软件开发工作总结助手。';
            
        return `${providerNote}你的任务是：

1. 分析 Git 提交记录，理解开发者的工作内容
2. 结合历史工作记录，识别出持续进行的项目和需求
3. 将零散的提交整理成有逻辑的工作项目
4. 生成结构化的工作总结

总结原则：
- 注重工作的连续性，将相关的提交合并为完整的功能开发
- 区分主要工作项和具体实现细节
- 体现开发进度和完成状态
- 使用专业但易懂的技术语言
- 重点关注业务价值和技术实现

输出要求：
- 使用中文
- 格式为严格的 JSON
- 内容准确、结构清晰
- 确保 JSON 格式正确，可以被解析`;
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
            
            console.log(`测试AI连接: ${this.baseUrl}, 模型: ${this.model}, 超时: ${testTimeout}ms`);
            
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
     * 生成日报或周报
     */
    async generateReport(
        commits: CommitInfo[], 
        summaries: WorkSummary[], 
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): Promise<AISummaryResult> {
        if (!this.apiKey) {
            throw new Error('AI API Key 未配置');
        }

        const prompt = this.buildReportPrompt(commits, summaries, reportType, period);
        
        console.log(`生成${reportType === 'daily' ? '日报' : '周报'}: Provider=${this.provider}, Model=${this.model}, BaseURL=${this.baseUrl}`);
        
                // 使用改进的AI调用方法
        return await this.callAIWithSystemPrompt(prompt, this.getReportSystemPrompt(reportType));
    }

    /**
     * 构建报告提示词
     */
    private buildReportPrompt(
        commits: CommitInfo[], 
        summaries: WorkSummary[], 
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): string {
        const startDate = period.start.toLocaleDateString('zh-CN');
        const endDate = period.end.toLocaleDateString('zh-CN');

        if (reportType === 'daily') {
            return this.buildDailyReportPrompt(commits, summaries, startDate);
        } else {
            return this.buildWeeklyReportPrompt(commits, summaries, startDate, endDate);
        }
    }

    /**
     * 构建日报提示词
     */
    private buildDailyReportPrompt(commits: CommitInfo[], summaries: WorkSummary[], dateStr: string): string {
        const config = this.configManager.getConfiguration();
        
        // 使用自定义日报用户提示词模板（如果配置了）
        if (config.customPrompts.dailyUserPromptTemplate) {
            return this.buildCustomReportPrompt(config.customPrompts.dailyUserPromptTemplate, commits, summaries, { type: 'daily', date: dateStr });
        }
        
        // 默认日报提示词构建
        let prompt = `请生成 ${dateStr} 的工作日报，需要智能分析和总结：\n\n`;

        // 1. 今日提交详细信息
        if (commits.length > 0) {
            prompt += `## 今日Git提交记录（共 ${commits.length} 个）：\n`;
            
            // 计算总体统计
            const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
            const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
            const allFiles = [...new Set(commits.flatMap(c => c.files))];
            
            prompt += `### 统计概览：\n`;
            prompt += `- 总提交数: ${commits.length} 个\n`;
            prompt += `- 代码变更: +${totalAdditions}/-${totalDeletions} 行\n`;
            prompt += `- 涉及文件: ${allFiles.length} 个\n`;
            prompt += `- 提交时间跨度: ${commits[commits.length-1].date.toLocaleTimeString('zh-CN')} - ${commits[0].date.toLocaleTimeString('zh-CN')}\n\n`;

            prompt += `### 详细提交记录：\n`;
            commits.forEach((commit, index) => {
                prompt += `**提交 ${index + 1}**: ${commit.hash.substring(0, 8)}\n`;
                prompt += `- 时间: ${commit.date.toLocaleString('zh-CN')}\n`;
                prompt += `- 消息: ${commit.message}\n`;
                prompt += `- 作者: ${commit.author}\n`;
                prompt += `- 变更: +${commit.additions}/-${commit.deletions} 行\n`;
                prompt += `- 文件: ${commit.files.join(', ')}\n`;
                
                // 计算与上一个提交的时间间隔
                if (index > 0) {
                    const prevCommit = commits[index - 1];
                    const timeDiff = prevCommit.date.getTime() - commit.date.getTime();
                    const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60) * 10) / 10;
                    prompt += `- 距上次提交: ${hoursDiff}小时\n`;
                }
                prompt += '\n';
            });
        } else {
            prompt += `## 今日Git提交记录：\n无\n\n`;
        }

        // 2. 近期工作上下文（用于识别跨天任务）
        if (summaries.length > 0) {
            prompt += `## 近期工作上下文（用于识别延续性任务）：\n`;
            const recentSummaries = summaries.slice(0, 3); // 只取最近3天
            recentSummaries.forEach((summary, index) => {
                const summaryDate = new Date(summary.timestamp).toLocaleDateString('zh-CN');
                prompt += `### ${summaryDate} 工作记录：\n`;
                summary.mainTasks.forEach(task => {
                    prompt += `- ${task.title}: ${task.description}`;
                    if (task.progress === 'ongoing') {
                        prompt += ` **[进行中]**`;
                    }
                    prompt += `\n`;
                });
                prompt += '\n';
            });
        }

        // 3. 分析要求
        prompt += `## 分析要求：\n`;
        prompt += `请基于以上信息，生成功能导向和业务导向的工作日报，要求：\n\n`;
        prompt += `1. **功能导向**: 重点描述完成了什么功能，而非技术实现细节\n`;
        prompt += `2. **业务导向**: 突出功能对用户体验、业务流程的改进和价值\n`;
        prompt += `3. **智能合并**: 将相关的提交合并为逻辑完整的功能模块\n`;
        prompt += `4. **任务识别**: 识别今日是否在继续昨日或更早的功能开发\n`;
        prompt += `5. **进度跟踪**: 标明功能开发的完成状态（completed/ongoing）\n`;
        prompt += `6. **工作量评估**: 根据功能复杂度和开发量合理估算工作时长\n\n`;

        prompt += `## 时长评估标准：\n`;
        prompt += `- 小功能修改/Bug修复: 0.5-2小时\n`;
        prompt += `- 中等功能开发: 2-6小时\n`;
        prompt += `- 大功能开发: 6-8小时\n`;
        prompt += `- 复杂功能/架构: 8小时以上\n\n`;

        prompt += `请按以下JSON格式输出：\n`;
        prompt += `{\n`;
        prompt += `  "content": "详细的工作日报内容，重点描述完成的功能和业务价值，避免过多技术细节",\n`;
        prompt += `  "mainTasks": [\n`;
        prompt += `    {\n`;
        prompt += `      "title": "功能模块或业务需求标题",\n`;
        prompt += `      "description": "功能描述和业务价值，说明对用户或业务的改进",\n`;
        prompt += `      "subTasks": ["完成的具体功能点1", "完成的具体功能点2"],\n`;
        prompt += `      "duration": "X.X小时",\n`;
        prompt += `      "progress": "completed|ongoing"\n`;
        prompt += `    }\n`;
        prompt += `  ]\n`;
        prompt += `}`;

        return prompt;
    }

    /**
     * 使用自定义模板构建报告提示词
     */
    private buildCustomReportPrompt(template: string, commits: CommitInfo[], summaries: WorkSummary[], options: { type: 'daily' | 'weekly', date?: string, startDate?: string, endDate?: string }): string {
        // 构建提交信息字符串
        let commitsInfo = '';
        if (commits.length > 0) {
            const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
            const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
            const allFiles = [...new Set(commits.flatMap(c => c.files))];
            
            commitsInfo += `总提交数: ${commits.length} 个\n`;
            commitsInfo += `代码变更: +${totalAdditions}/-${totalDeletions} 行\n`;
            commitsInfo += `涉及文件: ${allFiles.length} 个\n\n`;
            
            commits.forEach((commit, index) => {
                commitsInfo += `提交 ${index + 1}: ${commit.hash.substring(0, 8)}\n`;
                commitsInfo += `- 时间: ${commit.date.toLocaleString('zh-CN')}\n`;
                commitsInfo += `- 消息: ${commit.message}\n`;
                commitsInfo += `- 作者: ${commit.author}\n`;
                commitsInfo += `- 变更: +${commit.additions}/-${commit.deletions} 行\n`;
                commitsInfo += `- 文件: ${commit.files.join(', ')}\n\n`;
            });
        } else {
            commitsInfo = '今日无提交记录\n';
        }

        // 构建历史总结信息字符串
        let summariesInfo = '';
        if (summaries.length > 0) {
            summaries.slice(0, 5).forEach((summary, index) => {
                const summaryDate = new Date(summary.timestamp).toLocaleDateString('zh-CN');
                summariesInfo += `${summaryDate}:\n`;
                summariesInfo += `${summary.summary || '无总结内容'}\n`;
                summary.mainTasks.forEach(task => {
                    summariesInfo += `- ${task.title}: ${task.description} (${task.progress}, ${task.duration})\n`;
                });
                summariesInfo += '\n';
            });
        }

        // 替换模板中的占位符
        let result = template
            .replace(/\{commits\}/g, commitsInfo)
            .replace(/\{summaries\}/g, summariesInfo)
            .replace(/\{commitsCount\}/g, commits.length.toString())
            .replace(/\{summariesCount\}/g, summaries.length.toString());

        // 根据报告类型替换日期占位符
        if (options.type === 'daily' && options.date) {
            result = result.replace(/\{date\}/g, options.date);
        } else if (options.type === 'weekly' && options.startDate && options.endDate) {
            result = result.replace(/\{startDate\}/g, options.startDate);
            result = result.replace(/\{endDate\}/g, options.endDate);
        }

        return result;
    }

    /**
     * 构建周报提示词
     */
    private buildWeeklyReportPrompt(commits: CommitInfo[], summaries: WorkSummary[], startDate: string, endDate: string): string {
        const config = this.configManager.getConfiguration();
        
        // 使用自定义周报用户提示词模板（如果配置了）
        if (config.customPrompts.weeklyUserPromptTemplate) {
            return this.buildCustomReportPrompt(config.customPrompts.weeklyUserPromptTemplate, commits, summaries, { type: 'weekly', startDate, endDate });
        }
        
        // 默认周报提示词构建
        let prompt = `请生成本周工作报告（${startDate} 至 ${endDate}），进行深度分析和总结：\n\n`;

        // 1. 本周提交统计
        if (commits.length > 0) {
            prompt += `## 本周Git提交统计：\n`;
            
            const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
            const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
            const allFiles = [...new Set(commits.flatMap(c => c.files))];
            const dailyCommits = this.groupCommitsByDay(commits);
            
            prompt += `### 整体统计：\n`;
            prompt += `- 总提交数: ${commits.length} 个\n`;
            prompt += `- 代码变更: +${totalAdditions}/-${totalDeletions} 行\n`;
            prompt += `- 涉及文件: ${allFiles.length} 个\n`;
            prompt += `- 活跃天数: ${Object.keys(dailyCommits).length} 天\n\n`;

            prompt += `### 每日提交分布：\n`;
            Object.entries(dailyCommits).forEach(([date, dayCommits]) => {
                const dayAdditions = dayCommits.reduce((sum, c) => sum + c.additions, 0);
                const dayDeletions = dayCommits.reduce((sum, c) => sum + c.deletions, 0);
                prompt += `- ${date}: ${dayCommits.length} 个提交, +${dayAdditions}/-${dayDeletions} 行\n`;
            });
            prompt += '\n';

            prompt += `### 主要提交记录：\n`;
            commits.forEach((commit, index) => {
                prompt += `**${index + 1}.** ${commit.message}\n`;
                prompt += `  - 时间: ${commit.date.toLocaleString('zh-CN')}\n`;
                prompt += `  - 变更: +${commit.additions}/-${commit.deletions} 行\n`;
                prompt += `  - 文件: ${commit.files.slice(0, 3).join(', ')}${commit.files.length > 3 ? '...' : ''}\n\n`;
            });
        }

        // 2. 本周工作总结记录
        if (summaries.length > 0) {
            prompt += `## 本周工作总结记录：\n`;
            summaries.forEach((summary, index) => {
                const summaryDate = new Date(summary.timestamp).toLocaleDateString('zh-CN');
                prompt += `### ${summaryDate} 工作总结：\n`;
                prompt += `${summary.summary || '无总结内容'}\n\n`;
                if (summary.mainTasks.length > 0) {
                    prompt += `**主要任务：**\n`;
                    summary.mainTasks.forEach(task => {
                        prompt += `- ${task.title}: ${task.description} (${task.progress}, ${task.duration})\n`;
                    });
                    prompt += '\n';
                }
            });
        }

        // 3. 分析要求
        prompt += `## 周报分析要求：\n`;
        prompt += `请基于以上信息生成高质量的周工作报告，要求：\n\n`;
        prompt += `1. **项目整合**: 将本周所有工作按项目/功能模块进行整合\n`;
        prompt += `2. **进度跟踪**: 分析各项目的完成进度和里程碑\n`;
        prompt += `3. **价值体现**: 突出本周工作对业务目标的贡献\n`;
        prompt += `4. **技术成长**: 总结技术难点的突破和能力提升\n`;
        prompt += `5. **效率分析**: 评估工作效率和时间分配\n`;
        prompt += `6. **下周规划**: 基于本周进度提出下周重点\n\n`;

        prompt += `请按以下JSON格式输出：\n`;
        prompt += `{\n`;
        prompt += `  "content": "详细的周工作报告，包含工作总结、成果亮点、效率分析、下周计划等",\n`;
        prompt += `  "mainTasks": [\n`;
        prompt += `    {\n`;
        prompt += `      "title": "主要项目/功能模块",\n`;
        prompt += `      "description": "项目进展、完成情况、业务价值",\n`;
        prompt += `      "subTasks": ["本周完成的具体任务", "解决的技术问题"],\n`;
        prompt += `      "duration": "本周投入时间",\n`;
        prompt += `      "progress": "completed|ongoing"\n`;
        prompt += `    }\n`;
        prompt += `  ]\n`;
        prompt += `}`;

        return prompt;
    }

    /**
     * 按天分组提交记录
     */
    private groupCommitsByDay(commits: CommitInfo[]): Record<string, CommitInfo[]> {
        const grouped: Record<string, CommitInfo[]> = {};
        
        commits.forEach(commit => {
            const dateKey = commit.date.toLocaleDateString('zh-CN');
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(commit);
        });
        
        return grouped;
    }

    /**
     * 生成多项目报告
     */
    async generateMultiProjectReport(
        commits: any[],
        projectStats: any[],
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): Promise<AISummaryResult> {
        try {
            const prompt = this.buildMultiProjectReportPrompt(commits, projectStats, reportType, period);
            
            const config = this.configManager.getConfiguration();
            if (config.enablePromptLogging) {
                console.log('\n📝 多项目报告提示词:');
                console.log('=====================================');
                console.log(prompt);
                console.log('=====================================\n');
            }

            const systemPrompt = this.getReportSystemPrompt(reportType);
            return await this.callAIInternal(prompt, systemPrompt, false);
        } catch (error) {
            console.error('生成多项目报告失败:', error);
            throw error;
        }
    }

    /**
     * 构建多项目报告提示词
     */
    private buildMultiProjectReportPrompt(
        commits: any[],
        projectStats: any[],
        reportType: 'daily' | 'weekly',
        period: { start: Date; end: Date }
    ): string {
        const startDate = period.start.toLocaleDateString('zh-CN');
        const endDate = period.end.toLocaleDateString('zh-CN');
        const dateRange = reportType === 'daily' ? startDate : `${startDate} - ${endDate}`;

        let prompt = `请生成 ${dateRange} 的多项目${reportType === 'daily' ? '日报' : '周报'}，需要智能分析和总结：\n\n`;

        // 1. 多项目概览
        prompt += `## 多项目概览：\n`;
        prompt += `- 项目总数: ${projectStats.length} 个\n`;
        prompt += `- 总提交数: ${commits.length} 个\n`;
        const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
        const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
        prompt += `- 总代码变更: +${totalAdditions}/-${totalDeletions} 行\n`;
        const allFiles = [...new Set(commits.flatMap(c => c.files))];
        prompt += `- 涉及文件: ${allFiles.length} 个\n\n`;

        // 2. 各项目详细情况
        prompt += `## 各项目详细情况：\n`;
        for (const stats of projectStats) {
            prompt += `### 📂 ${stats.projectName}\n`;
            prompt += `- 路径: ${stats.projectPath}\n`;
            prompt += `- 提交数: ${stats.commitCount} 个\n`;
            prompt += `- 代码变更: +${stats.additions}/-${stats.deletions} 行\n`;
            prompt += `- 涉及文件: ${stats.fileCount} 个\n`;

            // 该项目的提交详情
            const projectCommits = commits.filter(c => c.projectPath === stats.projectPath);
            if (projectCommits.length > 0) {
                prompt += `- 提交详情:\n`;
                projectCommits.forEach((commit, index) => {
                    prompt += `  ${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.message} (${commit.author})\n`;
                    prompt += `     时间: ${commit.date.toLocaleString('zh-CN')}, 变更: +${commit.additions}/-${commit.deletions}\n`;
                });
            }
            prompt += '\n';
        }

        // 3. 分析要求
        prompt += `## 分析要求：\n`;
        prompt += `请基于以上多项目信息，生成一份功能导向和业务导向的${reportType === 'daily' ? '日报' : '周报'}，要求：\n\n`;
        
        prompt += `### 📊 功能交付分析：\n`;
        prompt += `- 分析各项目完成的功能模块和业务需求\n`;
        prompt += `- 识别项目间的功能协作和业务关联\n`;
        prompt += `- 评估功能对用户体验和业务流程的改进\n`;
        prompt += `- 发现功能交付中的问题和改进点\n\n`;

        prompt += `### 🎯 主要功能整理：\n`;
        prompt += `- 按项目维度整理主要功能交付\n`;
        prompt += `- 识别跨项目的功能协作\n`;
        prompt += `- 标注功能完成状态和业务价值\n`;
        prompt += `- 预估后续功能开发计划\n\n`;

        prompt += `### 📈 项目功能对比：\n`;
        prompt += `- 对比各项目的功能活跃度和交付量\n`;
        prompt += `- 分析不同项目的业务重点和功能特色\n`;
        prompt += `- 识别需要重点关注的功能模块\n\n`;

        prompt += `### 💡 建议和总结：\n`;
        prompt += `- 提出多项目功能协作的优化建议\n`;
        prompt += `- 总结${reportType === 'daily' ? '今日' : '本周'}的功能交付成果\n`;
        prompt += `- 规划下一步的功能开发重点\n\n`;

        prompt += `请按以下JSON格式输出：\n`;
        prompt += `{\n`;
        prompt += `  "content": "详细的多项目${reportType === 'daily' ? '日报' : '周报'}内容，重点描述功能交付和业务价值，避免过多技术细节",\n`;
        prompt += `  "mainTasks": [\n`;
        prompt += `    {\n`;
        prompt += `      "title": "功能模块标题（标注项目名称）",\n`;
        prompt += `      "description": "功能描述和业务价值，说明对用户或业务的改进",\n`;
        prompt += `      "subTasks": ["完成的具体功能点1", "完成的具体功能点2"],\n`;
        prompt += `      "duration": "投入时间估算",\n`;
        prompt += `      "progress": "completed|ongoing"\n`;
        prompt += `    }\n`;
        prompt += `  ]\n`;
        prompt += `}`;

        return prompt;
    }

    /**
     * 获取提示词示例（用于调试和查看）
     */
    getPromptExamples(): string {
        const mockCommits: CommitInfo[] = [
            {
                hash: 'a1b2c3d4',
                author: '张三',
                date: new Date('2024-01-15T09:30:15'),
                message: 'feat: 实现用户登录接口',
                files: ['src/auth/login.js', 'src/routes/auth.js'],
                additions: 45,
                deletions: 5
            },
            {
                hash: 'e5f6g7h8',
                author: '张三',
                date: new Date('2024-01-15T14:20:30'),
                message: 'fix: 修复登录页面样式问题',
                files: ['src/components/Login.vue', 'src/styles/auth.css'],
                additions: 25,
                deletions: 8
            },
            {
                hash: 'i9j0k1l2',
                author: '张三',
                date: new Date('2024-01-15T17:45:00'),
                message: 'refactor: 优化权限验证逻辑',
                files: ['src/middleware/auth.js', 'src/utils/permission.js'],
                additions: 50,
                deletions: 2
            }
        ];

        const mockSummaries: WorkSummary[] = [
            {
                id: 'summary-20240114',
                timestamp: new Date('2024-01-14T18:00:00').getTime(),
                type: 'daily',
                date: '2024-01-14',
                commits: [],
                summary: '完成了认证系统的架构设计和数据库表结构',
                mainTasks: [
                    {
                        title: '用户认证系统设计',
                        description: '完成了认证系统的架构设计和数据库表结构',
                        subTasks: ['数据库表设计', '认证流程设计'],
                        duration: '3.0小时',
                        progress: 'ongoing'
                    }
                ],
                reportStatus: 'success'
            }
        ];

        let content = '# Git Work Summary 提示词示例\n\n';
        content += '本文档展示了扩展使用的AI提示词，帮助您了解AI是如何分析和总结工作内容的。\n\n';

        // 日报提示词
        content += '## 📅 日报提示词示例\n\n';
        content += '### 系统提示词（日报）\n\n';
        content += '```\n';
        content += this.getReportSystemPrompt('daily');
        content += '\n```\n\n';

        content += '### 用户提示词（日报）\n\n';
        content += '```\n';
        content += this.buildDailyReportPrompt(mockCommits, mockSummaries, '2024-01-15');
        content += '\n```\n\n';

        // 周报提示词
        content += '## 📊 周报提示词示例\n\n';
        content += '### 系统提示词（周报）\n\n';
        content += '```\n';
        content += this.getReportSystemPrompt('weekly');
        content += '\n```\n\n';

        content += '### 用户提示词（周报）\n\n';
        content += '```\n';
        content += this.buildWeeklyReportPrompt(mockCommits, mockSummaries, '2024-01-15', '2024-01-21');
        content += '\n```\n\n';

        // 普通工作总结提示词
        content += '## 🔄 普通工作总结提示词示例\n\n';
        content += '### 系统提示词（工作总结）\n\n';
        content += '```\n';
        content += this.getSystemPrompt();
        content += '\n```\n\n';

        content += '### 用户提示词（工作总结）\n\n';
        content += '```\n';
        content += this.buildPrompt(mockCommits, mockSummaries);
        content += '\n```\n\n';

        // 配置信息
        const config = this.configManager.getConfiguration();
        content += '## ⚙️ 当前AI配置\n\n';
        content += `- **AI提供商**: ${config.aiProvider}\n`;
        content += `- **模型**: ${this.model}\n`;
        content += `- **API地址**: ${this.baseUrl}\n`;
        content += `- **超时时间**: ${config.aiTimeout}秒\n`;
        content += `- **API Key**: ${config.aiApiKey ? '已配置' : '未配置'}\n\n`;

        content += '## 📖 提示词说明\n\n';
        content += '### 日报分析特点\n';
        content += '- 智能合并相关提交为完整工作项\n';
        content += '- 结合历史上下文识别跨天任务\n';
        content += '- 基于代码量评估工作时长\n';
        content += '- 突出业务价值和技术亮点\n\n';

        content += '### 周报分析特点\n';
        content += '- 按项目/功能模块整合工作\n';
        content += '- 分析工作效率和成长趋势\n';
        content += '- 提供数据支撑的统计分析\n';
        content += '- 基于进展提出下周规划\n\n';

        content += '### 工作总结特点\n';
        content += '- 实时分析新增提交\n';
        content += '- 识别工作模式和开发意图\n';
        content += '- 体现工作的连续性和完整性\n';
        content += '- 准确评估技术难度和耗时\n\n';

        content += '---\n\n';
        content += `*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;
        content += `*扩展版本: Git Work Summary v1.0.0*`;

        return content;
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
        
        // 默认系统提示词
        if (reportType === 'daily') {
            return `你是专业的功能导向工作日报分析师，具备以下能力：

核心职责：
1. **功能识别**: 深度分析Git提交记录，识别完成的功能模块和业务需求
2. **业务理解**: 将技术实现转化为业务价值和用户体验改进
3. **功能整合**: 将零散的提交合并为完整的功能交付
4. **价值评估**: 评估功能对业务流程和用户体验的改进价值

分析原则：
- 重点关注"做了什么功能"而非"怎么做的技术细节"
- 相关的提交要合并为一个完整的功能模块
- 识别功能开发、Bug修复、体验优化等不同类型的业务价值
- 基于功能复杂度和业务影响合理评估工作时长
- 强调功能对用户或业务流程的改进，弱化技术实现细节

输出要求：
- 使用中文，面向业务和功能描述
- 严格JSON格式，确保可解析
- 内容聚焦功能交付和业务价值
- 避免过多技术术语和实现细节`;
        } else {
            return `你是专业的周工作报告分析师，具备以下能力：

核心职责：
1. **全局统筹**: 从整周角度分析工作成果和项目进展
2. **趋势分析**: 识别工作效率趋势和技术成长轨迹
3. **价值总结**: 突出本周工作对业务目标的贡献
4. **规划建议**: 基于本周进展提出下周重点方向

分析深度：
- 按项目/功能模块整合本周所有工作
- 分析各项目的完成度和里程碑达成情况
- 评估技术难点突破和能力提升
- 统计工作量分布和效率指标
- 识别需要延续到下周的任务

报告质量：
- 体现工作的系统性和完整性
- 突出技术成果和业务价值
- 提供数据支撑的效率分析
- 使用中文，格式为标准JSON`;
        }
    }

    /**
     * 改进无意义的commit message
     */
    async improveCommitMessage(originalMessage: string, changes: {
        files: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
    }): Promise<string> {
        if (!this.apiKey) {
            throw new Error('AI API Key 未配置');
        }

        const prompt = this.buildCommitMessagePrompt(originalMessage, changes);
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: this.getCommitMessageSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 200
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const improvedMessage = response.data.choices[0].message.content.trim();
            return improvedMessage || originalMessage;
        } catch (error) {
            console.error('改进commit message失败:', error);
            return originalMessage;
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

    private buildCommitMessagePrompt(originalMessage: string, changes: {
        files: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
    }): string {
        let prompt = `原始commit message: "${originalMessage}"\n\n`;
        prompt += `代码变更内容：\n`;
        
        changes.files.forEach((change, index) => {
            prompt += `\n文件 ${index + 1}: ${change.file} (${change.status})\n`;
            // 只取diff的前几行，避免内容过长
            const diffLines = change.diff.split('\n').slice(0, 20);
            prompt += diffLines.join('\n');
            if (change.diff.split('\n').length > 20) {
                prompt += '\n... (内容过长，已截断)';
            }
            prompt += '\n';
        });

        prompt += `\n请基于代码变更内容，生成一个简洁、准确、有意义的commit message。`;
        
        return prompt;
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

    private getCommitMessageSystemPrompt(): string {
        return `你是一个专业的Git commit message改进助手。你的任务是：

1. 分析代码变更内容，理解实际的功能修改
2. 生成简洁、准确、有意义的commit message
3. 遵循良好的commit message规范

要求：
- 使用中文
- 长度控制在50字以内
- 动词开头，如"添加"、"修复"、"更新"、"重构"等
- 准确描述具体做了什么
- 避免无意义的词语如"修改"、"更新"等泛泛而谈的表述

示例：
- 原始: "fix" → 改进: "修复用户登录验证失败的问题"
- 原始: "update" → 改进: "更新商品列表页面的样式布局"
- 原始: "." → 改进: "添加订单状态查询API接口"`;
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
} 