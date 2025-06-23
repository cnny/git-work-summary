import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | null = null;

/**
 * 初始化日志系统
 */
export function initializeLogger(): void {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Git Work Summary');
    }
}

/**
 * 全局日志函数
 * @param message 日志消息
 * @param level 日志级别
 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // 输出到控制台
    console.log(logMessage);
    
    // 输出到VS Code输出通道
    if (outputChannel) {
        outputChannel.appendLine(logMessage);
    }
    
    // 如果是错误级别，也显示通知
    if (level === 'error') {
        vscode.window.showErrorMessage(`Git Work Summary: ${message}`);
    }
}

/**
 * 显示日志面板
 */
export function showLogs(): void {
    if (outputChannel) {
        outputChannel.show(true);
    }
}

/**
 * 清理日志资源
 */
export function disposeLogger(): void {
    if (outputChannel) {
        outputChannel.dispose();
        outputChannel = null;
    }
}