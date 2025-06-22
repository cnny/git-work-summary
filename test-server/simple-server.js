const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 中间件
app.use(express.json());
app.use(cors());

// 存储接收到的工作总结
const workSummaries = [];

// 接收工作总结的接口
app.post('/work-summary', (req, res) => {
    const summary = req.body;
    
    // 打印接收到的数据
    console.log('📊 收到工作总结:');
    console.log('ID:', summary.id);
    console.log('时间:', summary.date);
    console.log('提交数量:', summary.commits?.total || 0);
    console.log('主要任务:', summary.summary?.mainTasks?.length || 0, '个');
    console.log('---');
    
    // 存储数据
    workSummaries.push({
        ...summary,
        receivedAt: new Date().toISOString()
    });
    
    // 返回成功响应
    res.json({
        success: true,
        message: '工作总结接收成功',
        id: summary.id,
        receivedAt: new Date().toISOString()
    });
});

// 获取所有工作总结的接口
app.get('/work-summaries', (req, res) => {
    res.json({
        total: workSummaries.length,
        summaries: workSummaries
    });
});

// 获取统计信息的接口
app.get('/stats', (req, res) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayCount = workSummaries.filter(s => 
        new Date(s.receivedAt) >= today
    ).length;
    
    const weekCount = workSummaries.filter(s => 
        new Date(s.receivedAt) >= thisWeek
    ).length;
    
    res.json({
        total: workSummaries.length,
        today: todayCount,
        thisWeek: weekCount,
        latest: workSummaries.length > 0 ? workSummaries[workSummaries.length - 1] : null
    });
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Test server is running',
        timestamp: new Date().toISOString()
    });
});

// 测试连接的接口
app.post('/test', (req, res) => {
    console.log('🔧 收到测试请求:', req.body);
    res.json({
        success: true,
        message: 'Test connection successful',
        timestamp: new Date().toISOString()
    });
});

// 首页 - 简单的 HTML 页面显示接收到的数据
app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Work Summary Test Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }
        .header { background: #f5f5f5; padding: 10px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
        .task { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        .commits { background: #e8f4f8; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .stats { background: #e8f8e8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>🚀 Git Work Summary Test Server</h1>
    
    <div class="stats">
        <h2>📊 统计信息</h2>
        <p><strong>总接收数量:</strong> ${workSummaries.length}</p>
        <p><strong>服务器启动时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        <p><strong>接口地址:</strong> http://localhost:${port}/work-summary</p>
    </div>
    
    <h2>📝 最近接收的工作总结</h2>
    
    ${workSummaries.slice(-5).reverse().map(summary => `
        <div class="summary">
            <div class="header">
                <strong>ID:</strong> ${summary.id}<br>
                <strong>时间:</strong> ${summary.date}<br>
                <strong>接收时间:</strong> ${summary.receivedAt}
            </div>
            
            <h3>📋 工作总结</h3>
            <p>${summary.summary?.content || '无内容'}</p>
            
            <h4>🎯 主要任务 (${summary.summary?.mainTasks?.length || 0}个)</h4>
            ${(summary.summary?.mainTasks || []).map(task => `
                <div class="task">
                    <strong>${task.title}</strong> - ${task.progress === 'completed' ? '✅ 已完成' : '🔄 进行中'}<br>
                    <em>${task.description}</em><br>
                    <small>子任务: ${task.subTasks?.join(', ') || '无'}</small>
                </div>
            `).join('')}
            
            <div class="commits">
                <strong>📦 代码提交:</strong> ${summary.commits?.total || 0} 个提交
            </div>
        </div>
    `).join('')}
    
    ${workSummaries.length === 0 ? '<p>暂无接收到的工作总结数据</p>' : ''}
    
    <script>
        // 每30秒刷新一次页面
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
    
    res.send(html);
});

app.listen(port, () => {
    console.log('🚀 Git Work Summary Test Server 已启动');
    console.log(`📡 监听端口: ${port}`);
    console.log(`🌐 访问地址: http://localhost:${port}`);
    console.log(`📊 接口地址: http://localhost:${port}/work-summary`);
    console.log(`🔧 测试地址: http://localhost:${port}/test`);
    console.log('---');
    console.log('在 Cursor 扩展中配置上报接口为: http://localhost:3000/work-summary');
    console.log('---');
}); 