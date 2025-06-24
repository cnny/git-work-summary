import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import { log } from './logger';

interface GitCommit {
    hash: string;
    author_name: string;
    author_email: string;
    date: string;
    message: string;
    body?: string;
}

export interface CommitInfo {
    hash: string;
    message: string;
    author: string;
    date: Date;
    files: string[];
    additions: number;
    deletions: number;
}

export class GitAnalyzer {
    private git: SimpleGit | null = null;
    private lastProcessedCommit: string | null = null;
    private currentUserEmail: string | null = null;

    /**
     * 获取当前用户信息
     */
    private async getCurrentUser(repoPath: string): Promise<{ name: string; email: string } | null> {
        try {
            if (!this.git) {
                this.git = simpleGit(repoPath);
            }

            const userName = await this.git.getConfig('user.name');
            const userEmail = await this.git.getConfig('user.email');

            if (userName.value && userEmail.value) {
                return {
                    name: userName.value,
                    email: userEmail.value
                };
            }

            return null;
        } catch (error) {
            console.error('获取Git用户信息失败:', error);
            return null;
        }
    }

    /**
     * 获取所有本地分支
     */
    private async getAllLocalBranches(repoPath: string): Promise<string[]> {
        try {
            if (!this.git) {
                this.git = simpleGit(repoPath);
            }

            console.log(`🔍 获取本地分支信息...`);
            console.log(`   工作目录: ${repoPath}`);

            // 尝试多种方法获取分支
            let localBranches: string[] = [];

            try {
                // 方法1：使用标准的 branch 命令
                console.log(`   尝试方法1: git branch`);
                const branches = await this.git.branch();
                console.log(`   分支对象:`, branches);
                console.log(`   所有分支: [${branches.all.join(', ')}]`);
                console.log(`   当前分支: ${branches.current}`);
                
                // 过滤出本地分支
                localBranches = branches.all.filter(branch => {
                    const isLocal = !branch.startsWith('remotes/') && 
                                   !branch.startsWith('origin/') &&
                                   branch !== '(no branch)' &&
                                   !branch.includes('->'); // 排除符号链接
                    
                    console.log(`     分支 "${branch}": ${isLocal ? '本地✅' : '远程❌'}`);
                    return isLocal;
                });
                
                console.log(`   过滤后本地分支: [${localBranches.join(', ')}]`);
                
                // 如果过滤后为空，但有当前分支，则使用当前分支
                if (localBranches.length === 0 && branches.current) {
                    console.log(`   没有找到其他本地分支，使用当前分支: ${branches.current}`);
                    localBranches = [branches.current];
                }
                
            } catch (error) {
                console.log(`   方法1失败: ${error}`);
                
                // 方法2：使用 raw 命令
                try {
                    console.log(`   尝试方法2: git branch --list`);
                    const result = await this.git.raw(['branch', '--list']);
                    console.log(`   原始输出: "${result}"`);
                    
                    localBranches = result
                        .split('\n')
                        .map(line => line.trim().replace(/^\*?\s*/, '')) // 移除 * 和空格
                        .filter(branch => branch && !branch.startsWith('remotes/'));
                    
                    console.log(`   解析后分支: [${localBranches.join(', ')}]`);
                } catch (rawError) {
                    console.log(`   方法2也失败: ${rawError}`);
                    
                    // 方法3：最后尝试获取当前分支
                    try {
                        console.log(`   尝试方法3: 获取当前分支`);
                        const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
                        console.log(`   当前分支: "${currentBranch}"`);
                        
                        if (currentBranch && currentBranch !== 'HEAD') {
                            localBranches = [currentBranch.trim()];
                        }
                    } catch (currentError) {
                        console.log(`   方法3也失败: ${currentError}`);
                    }
                }
            }
            
            console.log(`📋 最终获取到的本地分支: [${localBranches.join(', ')}] (共${localBranches.length}个)`);
            
            return localBranches;
        } catch (error) {
            console.error('❌ 获取本地分支失败:', error);
            
            // 作为最后的备选方案，尝试直接获取当前分支
            try {
                console.log('🔄 备选方案：尝试获取当前分支');
                if (!this.git) {
                    this.git = simpleGit(repoPath);
                }
                const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
                if (currentBranch && currentBranch.trim() !== 'HEAD') {
                    console.log(`✅ 备选方案成功，使用当前分支: ${currentBranch.trim()}`);
                    return [currentBranch.trim()];
                }
            } catch (fallbackError) {
                console.log('❌ 备选方案也失败:', fallbackError);
            }
            
            return [];
        }
    }

    /**
     * 获取最近的提交信息
     */
    async getRecentCommits(repoPath: string, maxCommits: number, onlyMyCommits: boolean = false, scanAllBranches: boolean = false): Promise<CommitInfo[]> {
        try {
            this.git = simpleGit(repoPath);
            
            // 检查是否为 Git 仓库
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                throw new Error('当前目录不是 Git 仓库');
            }

            // 获取当前用户信息（如果需要过滤）
            let currentUser: { name: string; email: string } | null = null;
            if (onlyMyCommits) {
                currentUser = await this.getCurrentUser(repoPath);
                if (!currentUser) {
                    throw new Error('无法获取当前 Git 用户信息，请检查 Git 配置');
                }
            }

            // 获取提交记录
            let allCommits: any[] = [];
            
            if (scanAllBranches) {
                // 扫描所有本地分支
                console.log('🔍 开始扫描所有本地分支...');
                const branches = await this.getAllLocalBranches(repoPath);
                console.log(`📋 找到本地分支: ${branches.join(', ')}`);
                const commitMap = new Map<string, any>(); // 用于去重
                
                for (const branch of branches) {
                    try {
                        console.log(`🔄 正在扫描分支: ${branch}`);
                        const branchLog = await this.git.log({
                            maxCount: maxCommits,
                            from: branch
                        });
                        
                        console.log(`  └─ 分支 ${branch} 找到 ${branchLog.all.length} 个提交`);
                        
                        // 将提交添加到 Map 中去重
                        for (const commit of branchLog.all) {
                            if (!commitMap.has(commit.hash)) {
                                commitMap.set(commit.hash, commit);
                                console.log(`    ✅ 新提交: ${commit.hash.substring(0, 8)} - ${commit.message}`);
                            } else {
                                console.log(`    ⏭️  重复提交: ${commit.hash.substring(0, 8)} (已存在)`);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ 获取分支 ${branch} 的提交记录失败:`, error);
                    }
                }
                
                // 转换为数组并按时间排序
                allCommits = Array.from(commitMap.values()).sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                
                console.log(`📊 合并后总提交数: ${allCommits.length}`);
                
                // 限制数量
                allCommits = allCommits.slice(0, maxCommits);
                console.log(`✂️  限制后提交数: ${allCommits.length}`);
            } else {
                // 只扫描当前分支
                console.log('🔍 只扫描当前分支...');
                const log = await this.git.log({
                    maxCount: maxCommits
                });
                allCommits = Array.from(log.all);
                console.log(`📋 当前分支找到 ${allCommits.length} 个提交`);
            }

            // 调试信息：显示所有提交
            console.log(`\n📈 Git分析调试汇总:`);
            console.log(`├─ 总共找到: ${allCommits.length} 个提交`);
            console.log(`├─ 最后处理的提交: ${this.lastProcessedCommit || '无'}`);
            
            // 显示最近几个提交的详细信息
            if (allCommits.length > 0) {
                console.log(`├─ 最近的提交:`);
                allCommits.slice(0, 5).forEach((commit, index) => {
                    const timeStr = new Date(commit.date).toLocaleString('zh-CN');
                    console.log(`│  ${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.author_name} - ${timeStr}`);
                    console.log(`│     "${commit.message}"`);
                });
            }
            
            // 过滤出新的提交（自上次处理后的提交）
            let newCommits = this.filterNewCommits(allCommits);
            console.log(`└─ 过滤新提交后: ${newCommits.length} 个提交`);
            
            if (this.lastProcessedCommit && allCommits.length > 0) {
                const lastIndex = allCommits.findIndex(commit => commit.hash === this.lastProcessedCommit);
                if (lastIndex === -1) {
                    console.log(`⚠️  注意: 未在当前提交列表中找到上次处理的提交 ${this.lastProcessedCommit.substring(0, 8)}`);
                    console.log(`     这可能是因为分支切换或提交历史变更`);
                } else {
                    console.log(`✅ 上次处理的提交位于第 ${lastIndex + 1} 位`);
                }
            }
            
            // 如果只需要当前用户的提交，进行过滤
            if (onlyMyCommits && currentUser) {
                console.log(`\n👤 用户过滤开始:`);
                console.log(`├─ 当前Git用户: ${currentUser.name} <${currentUser.email}>`);
                console.log(`├─ 过滤前提交数: ${newCommits.length}`);
                
                const beforeFilter = newCommits.length;
                newCommits = newCommits.filter((commit, index) => {
                    const match = commit.author_email === currentUser!.email;
                    const timeStr = new Date(commit.date).toLocaleString('zh-CN');
                    
                    if (match) {
                        console.log(`│  ✅ 匹配: ${commit.hash.substring(0, 8)} - ${commit.author_name} - ${timeStr}`);
                    } else {
                        console.log(`│  ❌ 跳过: ${commit.hash.substring(0, 8)} - ${commit.author_name} <${commit.author_email}> - ${timeStr}`);
                    }
                    return match;
                });
                console.log(`└─ 过滤后提交数: ${beforeFilter} -> ${newCommits.length}`);
            }
            
            if (newCommits.length === 0) {
                console.log(`\n❌ 最终结果: 没有找到新的提交记录`);
                console.log(`💡 可能的原因:`);
                console.log(`   1. 所有提交都已经被处理过`);
                console.log(`   2. 启用了用户过滤，但没有匹配的提交`);
                console.log(`   3. 当前分支没有新的提交`);
                return [];
            } else {
                console.log(`\n✅ 最终结果: 找到 ${newCommits.length} 个新提交需要处理`);
            }

            // 获取每个提交的详细信息
            const commitInfos: CommitInfo[] = [];
            for (const commit of newCommits) {
                const commitInfo = await this.getCommitDetails(commit);
                if (commitInfo) {
                    commitInfos.push(commitInfo);
                }
            }

            // 更新最后处理的提交
            if (commitInfos.length > 0) {
                this.lastProcessedCommit = commitInfos[0].hash;
            }

            return commitInfos;
        } catch (error) {
            throw new Error(`Git 分析失败: ${error}`);
        }
    }

    /**
     * 根据日期范围获取提交记录
     */
    async getCommitsByDateRange(
        repoPath: string, 
        startDate: Date, 
        endDate: Date, 
        onlyMyCommits: boolean = false, 
        scanAllBranches: boolean = false
    ): Promise<CommitInfo[]> {
        try {
            this.git = simpleGit(repoPath);
            
            // 检查是否为 Git 仓库
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                throw new Error('当前目录不是 Git 仓库');
            }
            
            console.log(`📅 按日期范围获取提交: ${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`);
            console.log(`🔧 时间戳范围: ${startDate.getTime()} - ${endDate.getTime()}`);

            // 获取当前用户信息（如果需要过滤）
            let currentUser: { name: string; email: string } | null = null;
            if (onlyMyCommits) {
                currentUser = await this.getCurrentUser(repoPath);
                if (!currentUser) {
                    throw new Error('无法获取当前 Git 用户信息，请检查 Git 配置');
                }
                console.log(`👤 当前用户: ${currentUser.name} <${currentUser.email}>`);
            }

            // 获取提交记录
            let allCommits: any[] = [];
            
            if (scanAllBranches) {
                // 扫描所有本地分支
                console.log('🔍 扫描所有本地分支...');
                const branches = await this.getAllLocalBranches(repoPath);
                console.log(`📋 找到本地分支: ${branches.join(', ')}`);
                const commitMap = new Map<string, any>(); // 用于去重
                
                for (const branch of branches) {
                    try {
                        console.log(`🔄 正在扫描分支: ${branch}`);
                        // 使用最简单的log获取方式，避免任何日期参数
                        const branchLog = await this.git.log({
                            from: branch,
                            maxCount: 1000 // 增加获取数量确保覆盖足够的历史
                        });
                        
                        console.log(`  └─ 分支 ${branch} 总共获取 ${branchLog.all.length} 个提交`);
                        
                        // 在JavaScript中过滤日期范围并去重
                        let filteredCount = 0;
                        for (const commit of branchLog.all) {
                            try {
                                const commitDate = new Date(commit.date);
                                
                                // 检查日期是否在范围内
                                if (commitDate >= startDate && commitDate <= endDate) {
                                    if (!commitMap.has(commit.hash)) {
                                        commitMap.set(commit.hash, commit);
                                        filteredCount++;
                                    }
                                }
                            } catch (dateError) {
                                console.warn(`  ⚠️  解析提交日期失败: ${commit.hash} - ${commit.date}`);
                            }
                        }
                        
                        console.log(`    └─ 过滤后在日期范围内: ${filteredCount} 个提交`);
                    } catch (error) {
                        console.error(`❌ 获取分支 ${branch} 的提交记录失败:`, error);
                        // 继续处理其他分支，不让单个分支的错误影响整体
                    }
                }
                
                // 转换为数组并按时间排序
                allCommits = Array.from(commitMap.values()).sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                
                console.log(`📊 所有分支合并后总提交数: ${allCommits.length}`);
            } else {
                // 只扫描当前分支
                console.log('🔍 只扫描当前分支...');
                try {
                    const log = await this.git.log({
                        maxCount: 1000 // 增加获取数量确保覆盖足够的历史
                    });
                    
                    console.log(`📋 当前分支总共获取 ${log.all.length} 个提交`);
                    
                    // 在JavaScript中过滤日期范围
                    allCommits = log.all.filter(commit => {
                        try {
                            const commitDate = new Date(commit.date);
                            return commitDate >= startDate && commitDate <= endDate;
                        } catch (dateError) {
                            console.warn(`⚠️  解析提交日期失败: ${commit.hash} - ${commit.date}`);
                            return false;
                        }
                    });
                    
                    console.log(`📋 当前分支在指定时间范围内找到 ${allCommits.length} 个提交`);
                } catch (error) {
                    console.error(`❌ 获取当前分支提交记录失败:`, error);
                    throw error;
                }
            }

            // 如果只需要当前用户的提交，进行过滤
            if (onlyMyCommits && currentUser) {
                console.log(`\n👤 用户过滤开始:`);
                console.log(`├─ 过滤前提交数: ${allCommits.length}`);
                
                const beforeFilter = allCommits.length;
                allCommits = allCommits.filter((commit) => {
                    const match = commit.author_email === currentUser!.email;
                    if (match) {
                        console.log(`  ✅ 匹配用户: ${commit.hash.substring(0, 8)} - ${commit.author_name}`);
                    }
                    return match;
                });
                console.log(`└─ 过滤后提交数: ${beforeFilter} -> ${allCommits.length}`);
            }

            if (allCommits.length === 0) {
                console.log(`📭 在指定时间范围内没有找到符合条件的提交记录`);
                return [];
            }

            console.log(`✅ 找到 ${allCommits.length} 个符合条件的提交`);

            // 获取每个提交的详细信息
            const commitInfos: CommitInfo[] = [];
            for (const commit of allCommits) {
                const commitInfo = await this.getCommitDetails(commit);
                if (commitInfo) {
                    commitInfos.push(commitInfo);
                }
            }

            console.log(`📝 成功获取 ${commitInfos.length} 个提交的详细信息`);
            return commitInfos;
        } catch (error) {
            console.error(`根据日期范围获取Git提交失败:`, error);
            throw new Error(`根据日期范围获取Git提交失败: ${error}`);
        }
    }

    /**
     * 获取提交的详细信息
     */
    private async getCommitDetails(commit: any): Promise<CommitInfo | null> {
        try {
            if (!this.git) {
                return null;
            }

            // 过滤非实际编程操作的提交
            if (this.shouldFilterCommit(commit)) {
                console.log(`过滤非编程提交: ${commit.hash.substring(0, 8)} - ${commit.message}`);
                return null;
            }

            // 获取提交涉及的文件
            const diffSummary = await this.git.diffSummary([`${commit.hash}^`, commit.hash]);
            
            // 获取文件变更详情
            const files = diffSummary.files.map(file => file.file);
            const additions = diffSummary.insertions;
            const deletions = diffSummary.deletions;

            return {
                hash: commit.hash,
                message: commit.message,
                author: `${commit.author_name} <${commit.author_email}>`,
                date: new Date(commit.date),
                files,
                additions,
                deletions
            };
        } catch (error) {
            console.error(`获取提交详情失败 (${commit.hash}):`, error);
            return null;
        }
    }

    /**
     * 判断是否应该过滤此提交（非实际编程操作）
     */
    private shouldFilterCommit(commit: any): boolean {
        const message = commit.message.trim().toLowerCase();
        
        // 过滤merge提交
        if (message.startsWith('merge') || message.includes('merge into') || 
            message.startsWith('合并') || message.includes('合并到')) {
            return true;
        }
        
        // 过滤其他非编程操作
        const filterPatterns = [
            /^merge\s+/i,                              // merge开头的提交
            /merge\s+.*\s+into\s+/i,                   // merge ... into ...
            /^revert\s+/i,                             // revert开头的提交  
            /^initial\s+commit$/i,                     // 初始提交
            /^初始化.*提交$/i,                          // 中文初始提交
            /^(hotfix|release)\/.*merge/i,             // 分支合并相关
            /^bump\s+version/i,                        // 版本更新
            /^update\s+.*\.md$/i,                      // 仅更新文档
            /^docs?:\s+/i,                             // 文档更新提交
            /^chore:\s+/i,                             // 杂务提交
            /^ci:\s+/i,                                // CI相关提交
            /^build:\s+/i,                             // 构建相关提交
        ];
        
        return filterPatterns.some(pattern => pattern.test(message));
    }

    /**
     * 过滤出新的提交
     */
    private filterNewCommits(commits: any[]): any[] {
        if (!this.lastProcessedCommit) {
            return commits;
        }

        const lastIndex = commits.findIndex(commit => commit.hash === this.lastProcessedCommit);
        if (lastIndex === -1) {
            return commits;
        }

        return commits.slice(0, lastIndex);
    }

    /**
     * 获取工作区状态
     */
    async getWorkspaceStatus(repoPath: string): Promise<{
        staged: string[];
        modified: string[];
        untracked: string[];
    }> {
        try {
            this.git = simpleGit(repoPath);
            const status = await this.git.status();

            return {
                staged: status.staged,
                modified: status.modified,
                untracked: status.not_added
            };
        } catch (error) {
            throw new Error(`获取工作区状态失败: ${error}`);
        }
    }

    /**
     * 获取分支信息
     */
    async getBranchInfo(repoPath: string): Promise<{
        current: string;
        all: string[];
    }> {
        try {
            this.git = simpleGit(repoPath);
            const branches = await this.git.branch();

            return {
                current: branches.current,
                all: branches.all
            };
        } catch (error) {
            throw new Error(`获取分支信息失败: ${error}`);
        }
    }

    /**
     * 获取远程仓库信息
     */
    async getRemoteInfo(repoPath: string): Promise<{
        origin?: string;
        remotes: Record<string, string>;
    }> {
        try {
            this.git = simpleGit(repoPath);
            const remotes = await this.git.getRemotes(true);
            
            const remoteMap: Record<string, string> = {};
            let origin: string | undefined;

            for (const remote of remotes) {
                if (remote.name && remote.refs && remote.refs.fetch) {
                    remoteMap[remote.name] = remote.refs.fetch;
                    if (remote.name === 'origin') {
                        origin = remote.refs.fetch;
                    }
                }
            }

            return {
                origin,
                remotes: remoteMap
            };
        } catch (error) {
            throw new Error(`获取远程仓库信息失败: ${error}`);
        }
    }

    /**
     * 重置最后处理的提交记录
     */
    resetLastProcessedCommit(): void {
        const previousCommit = this.lastProcessedCommit;
        this.lastProcessedCommit = null;
        console.log(`🔄 重置提交记录: ${previousCommit ? previousCommit.substring(0, 8) : '无'} -> 无`);
        console.log(`   下次分析将处理所有提交`);
    }

    /**
     * 设置最后处理的提交
     */
    setLastProcessedCommit(commitHash: string): void {
        this.lastProcessedCommit = commitHash;
    }

    /**
     * 获取未提交的变更内容
     */
    async getUncommittedChanges(repoPath: string): Promise<{
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
    }> {
        try {
            if (!this.git) {
                this.git = simpleGit(repoPath);
            }

            const status = await this.git.status();
            const result = {
                staged: [] as Array<{ file: string; status: string; diff: string; }>,
                modified: [] as Array<{ file: string; status: string; diff: string; }>
            };

            // 获取已暂存的文件变更
            for (const file of status.staged) {
                try {
                    const diff = await this.git.diff(['--cached', file]);
                    result.staged.push({
                        file: file,
                        status: status.files.find(f => f.path === file)?.index || 'M',
                        diff: diff
                    });
                } catch (error) {
                    console.warn(`获取文件 ${file} 的暂存变更失败:`, error);
                    result.staged.push({
                        file: file,
                        status: status.files.find(f => f.path === file)?.index || 'M',
                        diff: ''
                    });
                }
            }

            // 获取已修改但未暂存的文件变更
            for (const file of status.modified) {
                try {
                    const diff = await this.git.diff([file]);
                    result.modified.push({
                        file: file,
                        status: status.files.find(f => f.path === file)?.working_dir || 'M',
                        diff: diff
                    });
                } catch (error) {
                    console.warn(`获取文件 ${file} 的工作区变更失败:`, error);
                    result.modified.push({
                        file: file,
                        status: status.files.find(f => f.path === file)?.working_dir || 'M',
                        diff: ''
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('获取未提交变更失败:', error);
            return { staged: [], modified: [] };
        }
    }

    /**
     * 获取特定提交的变更内容
     */
    async getCommitChanges(repoPath: string, commitHash: string): Promise<{
        files: Array<{
            file: string;
            status: string;
            diff: string;
        }>;
    }> {
        try {
            if (!this.git) {
                this.git = simpleGit(repoPath);
            }

            // 获取提交的文件列表
            const show = await this.git.show([commitHash, '--name-status']);
            const files = show
                .split('\n')
                .filter(line => line.match(/^[AMDRC]\s+/))
                .map(line => {
                    const parts = line.split('\t');
                    return {
                        status: parts[0],
                        file: parts[1]
                    };
                });

            const result = {
                files: [] as Array<{ file: string; status: string; diff: string; }>
            };

            // 获取每个文件的具体变更
            for (const fileInfo of files) {
                try {
                    const diff = await this.git.show([`${commitHash}`, '--', fileInfo.file]);
                    result.files.push({
                        file: fileInfo.file,
                        status: fileInfo.status,
                        diff: diff
                    });
                } catch (error) {
                    console.warn(`获取文件 ${fileInfo.file} 的提交变更失败:`, error);
                    result.files.push({
                        file: fileInfo.file,
                        status: fileInfo.status,
                        diff: ''
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('获取提交变更失败:', error);
            return { files: [] };
        }
    }

    /**
     * 判断commit message是否无意义
     */
    isMeaninglessCommitMessage(message: string): boolean {
        const meaninglessPatterns = [
            /^(fix|update|modify|change|add|remove|delete)$/i,
            /^(wip|work in progress|临时|temp|test|测试)$/i,
            /^(.|..|...)$/,
            /^(commit|提交|保存|save)$/i,
            /^(minor|小修改|小改|bug|bugfix)$/i,
            /^(refactor|重构|优化|optimize)$/i,
            /^[\d\s\-_.,!@#$%^&*()+=[\]{}|\\:";'<>?/`~]*$/,
            /^(merge|合并)/i,
            /^(init|initial|初始)/i
        ];

        const cleanMessage = message.trim();
        
        // 检查是否为空或过短
        if (!cleanMessage || cleanMessage.length < 3) {
            return true;
        }

        // 检查是否匹配无意义模式
        return meaninglessPatterns.some(pattern => pattern.test(cleanMessage));
    }
} 