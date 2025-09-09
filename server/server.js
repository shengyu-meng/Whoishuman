const express = require('express');
const cors = require('cors');
const path = require('path');
const LogSaver = require('./logSaver');

const app = express();
const port = process.env.PORT || 3001;

// CORS配置 - 允许所有本地开发地址
app.use(cors({
    origin: [
        'http://localhost:8000', 
        'http://127.0.0.1:8000', 
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'http://localhost:5500',  // Live Server默认端口
        'http://127.0.0.1:5500'   // Live Server默认端口
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

// 创建日志保存实例
const logSaver = new LogSaver();

// API端点：保存游戏日志
app.post('/api/save-logs', async (req, res) => {
    try {
        const { conversationLog, systemLog } = req.body;
        
        console.log('📨 收到日志保存请求');
        console.log('对话日志条数:', conversationLog ? conversationLog.length : 0);
        console.log('系统日志条数:', systemLog ? systemLog.length : 0);
        
        if (!conversationLog && !systemLog) {
            return res.status(400).json({
                success: false,
                message: '没有提供日志数据'
            });
        }
        
        const results = await logSaver.saveGameLogs(conversationLog, systemLog);
        
        res.json({
            success: true,
            message: '日志保存成功',
            results: results
        });
        
        console.log('✅ 日志保存完成，返回结果:', results.length, '个文件');
        
    } catch (error) {
        console.error('❌ 保存日志时出错:', error);
        res.status(500).json({
            success: false,
            message: '日志保存失败',
            error: error.message
        });
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: '日志保存服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`🚀 日志保存服务已启动`);
    console.log(`📡 服务地址: http://localhost:${port}`);
    console.log(`🔧 API端点: http://localhost:${port}/api/save-logs`);
    console.log(`❤️  健康检查: http://localhost:${port}/api/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🔄 正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 正在关闭服务器...');
    process.exit(0);
});