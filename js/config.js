// API配置文件 - 存储敏感信息和配置项
// 请勿将此文件提交到版本控制系统

// DeepSeek API配置
const API_CONFIG = {
    // DeepSeek API密钥
    apiKey: '',
    
    // API基础URL
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    
    // API模型配置
    model: 'deepseek-chat',
    
    // API请求配置
    requestConfig: {
        temperature: 0.8,
        maxTokens: 1000,
        timeout: 30000
    }
};

// 游戏配置
const GAME_CONFIG = {
    // 游戏难度配置
    difficulty: {
        maxLevel: 5,
        basePassRate: 70
    },
    
    // AI角色配置
    aiCharacters: {
        minActive: 4,
        maxActive: 5
    },
    
    // 对话配置
    conversation: {
        typingDelay: {
            min: 800,
            max: 2000
        },
        messageDelay: {
            min: 1500,
            max: 3000
        }
    },
    
    // 重试配置
    retry: {
        maxAttempts: 5,
        similarityThreshold: 0.6
    }
};

// 调试模式配置
const DEBUG_CONFIG = {
    // 调试模式开关 - 设置为true启用调试功能
    enabled: true,
    
    // 调试功能开关
    features: {
        // 显示"跳过本轮"按钮
        showSkipButton: true,
        
        // 显示"结束游戏"按钮
        showEndGameButton: true,
        
        // 显示浏览器控制台日志
        showConsoleLogs: true,
        
        // 自动保存对话和系统日志到文件
        autoSaveLogs: true,
        
        // 显示认知增强器调试信息
        showCognitionDebug: true,
        
        // 显示完整AI提示词
        showFullPrompts: true
    },
    
    // 日志保存配置
    logging: {
        // 日志文件保存路径
        logDirectory: '.logs',
        
        // 对话日志文件名前缀
        conversationLogPrefix: 'conversation_',
        
        // 系统日志文件名前缀
        systemLogPrefix: 'system_',
        
        // 日志文件格式
        logFormat: 'json', // 'json' 或 'text'
        
        // 自动保存间隔（毫秒）
        autoSaveInterval: 30000 // 30秒
    }
};

// 导出配置对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, GAME_CONFIG, DEBUG_CONFIG };
} else {
    window.API_CONFIG = API_CONFIG;
    window.GAME_CONFIG = GAME_CONFIG;
    window.DEBUG_CONFIG = DEBUG_CONFIG;
}