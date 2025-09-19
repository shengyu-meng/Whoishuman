/**
 * API配置文件 - 存储敏感信息和配置项
 * 注意：请勿将此文件提交到版本控制系统
 */

// DeepSeek API配置
const API_CONFIG = {
    apiKey: '',                                        // DeepSeek API密钥
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',  // API基础URL
    model: 'deepseek-chat',                           // API模型配置
    
    // API请求配置
    requestConfig: {
        temperature: 0.0,                             // 响应随机性控制
        maxTokens: 1000,                             // 最大响应长度
        timeout: 30000                               // 请求超时时间(ms)
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
    },
    
    // 回答超时配置
    responseTimeout: {
        enabled: false,                                  // 默认关闭超时限制
        timeoutDuration: 60000,                         // 超时时间(ms) - 60秒
        showCountdown: true,                            // 是否显示倒计时
        warningTime: 10000                              // 警告提示时间(ms) - 10秒
    },
    
    // AI分析阈值配置
    analysis: {
        // 行为一致性检测阈值
        behavioralConsistencyThreshold: 0.8,
        
        // 关键词重叠检测阈值
        keywordOverlapThreshold: 0.8,
        
        // 深度增强基础阈值
        depthEnhancementBaseThreshold: 0.8,
        
        // 最小增强阈值
        minEnhancementThreshold: 0.5
    },
    
    // 注意：themeProgression 配置已移除（未使用）
    // 主题相关配置现在在 ThemeUtils.js 中管理
};

// 调试模式配置
const DEBUG_CONFIG = {
    enabled: true,                                    // 调试模式总开关
    
    // 调试功能开关
    features: {
        showSkipButton: true,                        // 显示"跳过本轮"按钮
        showEndGameButton: true,                     // 显示"结束游戏"按钮
        showConsoleLogs: true,                       // 显示浏览器控制台日志
        autoSaveLogs: true,                         // 自动保存对话和系统日志到文件
        showCognitionDebug: true,                   // 显示认知增强器调试信息
        showFullPrompts: true                       // 显示完整AI提示词
    },
    
    // 日志保存配置
    logging: {
        logDirectory: '.logs',                       // 日志文件保存路径
        conversationLogPrefix: 'conversation_',     // 对话日志文件名前缀
        systemLogPrefix: 'system_',                 // 系统日志文件名前缀
        logFormat: 'json',                          // 日志文件格式 ('json' 或 'text')
        autoSaveInterval: 30000                     // 自动保存间隔(ms) - 30秒
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