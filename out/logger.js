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
exports.disposeLogger = exports.showLogs = exports.log = exports.initializeLogger = void 0;
const vscode = __importStar(require("vscode"));
let outputChannel = null;
/**
 * 初始化日志系统
 */
function initializeLogger() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Git Work Summary');
    }
}
exports.initializeLogger = initializeLogger;
/**
 * 全局日志函数
 * @param message 日志消息
 * @param level 日志级别
 */
function log(message, level = 'info') {
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
exports.log = log;
/**
 * 显示日志面板
 */
function showLogs() {
    if (outputChannel) {
        outputChannel.show(true);
    }
}
exports.showLogs = showLogs;
/**
 * 清理日志资源
 */
function disposeLogger() {
    if (outputChannel) {
        outputChannel.dispose();
        outputChannel = null;
    }
}
exports.disposeLogger = disposeLogger;
//# sourceMappingURL=logger.js.map