// 本地开发服务器
// 提供API配置端点，从环境变量读取敏感信息
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 静态文件服务
app.use(express.static('.'));

// CORS支持
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// API配置端点 - 从环境变量读取敏感信息
app.get('/api/config', (req, res) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
        console.error('❌ 未找到 DEEPSEEK_API_KEY 环境变量');
        return res.status(500).json({ 
            error: 'API Key 未配置',
            message: '请设置 DEEPSEEK_API_KEY 环境变量'
        });
    }

    console.log(`✅ 成功获取环境变量 DEEPSEEK_API_KEY: ${apiKey.substring(0, 8)}...`);

    const config = {
        hasApiKey: true,
        apiKey: apiKey, // 在生产环境中，这里会被安全地处理
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        requestConfig: {
            temperature: 0.0,
            maxTokens: 1000,
            timeout: 30000
        }
    };

    res.json(config);
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        environment: 'development',
        timestamp: new Date().toISOString(),
        hasApiKey: !!process.env.DEEPSEEK_API_KEY
    });
});

// 默认路由 - 返回主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 开发服务器已启动:`);
    console.log(`   本地访问: http://localhost:${PORT}`);
    console.log(`   网络访问: http://0.0.0.0:${PORT}`);
    console.log(`   API端点: http://localhost:${PORT}/api/config`);
    console.log(`   健康检查: http://localhost:${PORT}/api/health`);
    
    // 检查环境变量
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
        console.log(`✅ 检测到 DEEPSEEK_API_KEY: ${apiKey.substring(0, 8)}...`);
    } else {
        console.log('❌ 未检测到 DEEPSEEK_API_KEY 环境变量');
        console.log('   请确保已设置系统环境变量 DEEPSEEK_API_KEY');
    }
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});