# Git Work Summary 测试服务器

这是一个简单的 Express 服务器，用于接收和显示 Git Work Summary 扩展上报的工作总结数据。

## 🚀 快速开始

### 1. 安装依赖
```bash
cd test-server
npm install
```

### 2. 启动服务器
```bash
npm start
# 或者
node simple-server.js
```

### 3. 确认服务器启动
服务器启动成功后，你会看到以下信息：
```
🚀 Git Work Summary Test Server 已启动
📡 监听端口: 3000
🌐 访问地址: http://localhost:3000
📊 接口地址: http://localhost:3000/work-summary
🔧 测试地址: http://localhost:3000/test
---
在 Cursor 扩展中配置上报接口为: http://localhost:3000/work-summary
---
```

## 📋 功能说明

### 主要接口

#### 1. 工作总结接收接口
- **URL**: `POST http://localhost:3000/work-summary`
- **功能**: 接收扩展上报的工作总结数据
- **响应**: JSON 格式的成功确认

#### 2. 测试连接接口
- **URL**: `POST http://localhost:3000/test`
- **功能**: 测试扩展与服务器的连接
- **响应**: 连接成功确认

#### 3. 数据查看接口
- **URL**: `GET http://localhost:3000/work-summaries`
- **功能**: 获取所有接收到的工作总结（JSON 格式）

#### 4. 统计信息接口
- **URL**: `GET http://localhost:3000/stats`
- **功能**: 获取接收统计信息

#### 5. 健康检查接口
- **URL**: `GET http://localhost:3000/health`
- **功能**: 检查服务器运行状态

### Web 界面

#### 1. 主页面
- **URL**: `http://localhost:3000`
- **功能**: 可视化显示接收到的工作总结
- **特性**: 
  - 显示统计信息
  - 展示最近的工作总结
  - 自动30秒刷新

## ⚙️ 在扩展中配置

1. **启动 Cursor 扩展**
2. **打开配置界面**：命令面板 → "Git Work Summary: Configure Settings"
3. **填写上报接口地址**：`http://localhost:3000/work-summary`
4. **测试连接**：在配置界面点击"测试配置"按钮

## 📊 数据格式

服务器接收的工作总结数据格式：

```json
{
  "id": "summary-1234567890-abcdef123",
  "timestamp": 1234567890000,
  "date": "2024-01-01T12:00:00.000Z",
  "summary": {
    "content": "整体工作总结内容",
    "mainTasks": [
      {
        "title": "主要工作项标题",
        "description": "详细描述",
        "subTasks": ["具体实现1", "具体实现2"],
        "duration": "预估工作时长",
        "progress": "ongoing|completed"
      }
    ]
  },
  "commits": {
    "total": 5,
    "details": [
      {
        "hash": "abcd1234",
        "message": "feat: 添加新功能",
        "author": "开发者 <email@example.com>",
        "date": "2024-01-01T10:00:00.000Z",
        "files": ["src/file1.ts", "src/file2.ts"],
        "changes": {
          "additions": 50,
          "deletions": 10
        }
      }
    ]
  },
  "metadata": {
    "source": "cursor-git-work-summary",
    "version": "1.0.0",
    "reportTime": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🔧 开发模式

如果需要在开发时自动重启服务器：

```bash
npm run dev
```

这会使用 nodemon 监控文件变化并自动重启。

## 📝 日志输出

服务器运行时会在控制台输出：
- 接收到的工作总结基本信息
- 测试连接请求
- 错误信息（如果有）

示例日志：
```
📊 收到工作总结:
ID: summary-1234567890-abcdef123
时间: 2024-01-01T12:00:00.000Z
提交数量: 5
主要任务: 3 个
---
```

## 🛠️ 故障排除

### 常见问题

1. **端口被占用**
   - 错误：`EADDRINUSE: address already in use :::3000`
   - 解决：关闭占用端口的程序或修改服务器端口

2. **无法访问服务器**
   - 检查服务器是否启动成功
   - 确认防火墙设置
   - 尝试 `curl http://localhost:3000/health` 测试

3. **扩展连接失败**
   - 确认服务器运行在正确端口
   - 检查扩展配置中的 URL 是否正确
   - 查看服务器控制台是否有错误信息

### 调试方法

1. **检查服务器状态**：
   ```bash
   curl http://localhost:3000/health
   ```

2. **测试接口**：
   ```bash
   curl -X POST http://localhost:3000/test \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

3. **查看数据**：
   访问 `http://localhost:3000` 查看接收到的数据

## 📦 依赖包

- `express`: Web 服务器框架
- `cors`: 跨域资源共享
- `nodemon`: 开发时自动重启（开发依赖） 