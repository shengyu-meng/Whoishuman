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

// 导出配置对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, GAME_CONFIG };
} else {
    window.API_CONFIG = API_CONFIG;
    window.GAME_CONFIG = GAME_CONFIG;
}