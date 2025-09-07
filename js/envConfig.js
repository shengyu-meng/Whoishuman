// 环境适配配置管理器
// 支持 Windows 本地环境和 Cloudflare Pages 环境
class EnvConfigManager {
    constructor() {
        this.isCloudflarePages = this.detectCloudflarePages();
        this.isNodeJS = this.detectNodeJS();
        this.config = null;
        this.apiConfig = null;
        this.gameConfig = null;
    }

    // 检测是否为 Cloudflare Pages 环境
    detectCloudflarePages() {
        // Cloudflare Pages 环境变量检测
        if (typeof globalThis !== 'undefined' && globalThis.CF_PAGES) {
            return true;
        }
        
        // 检测是否存在 Cloudflare Workers/Pages 特有的全局对象
        if (typeof caches !== 'undefined' && typeof Response !== 'undefined' && 
            typeof Request !== 'undefined' && typeof fetch !== 'undefined') {
            // 进一步检查是否有 CF 特有属性
            try {
                // Cloudflare Pages 通常会有这些环境信息
                if (typeof navigator !== 'undefined' && navigator.userAgent && 
                    navigator.userAgent.includes('Cloudflare')) {
                    return true;
                }
            } catch (e) {
                // 静默忽略
            }
        }

        // 检查 URL 中是否包含 pages.dev 或 workers.dev
        if (typeof window !== 'undefined' && window.location) {
            const hostname = window.location.hostname;
            if (hostname.includes('pages.dev') || hostname.includes('workers.dev') || 
                hostname.includes('cloudflare')) {
                return true;
            }
        }

        return false;
    }

    // 检测是否为 Node.js 环境
    detectNodeJS() {
        return typeof process !== 'undefined' && 
               process.versions && 
               process.versions.node;
    }

    // 从环境变量获取 API 配置 (仅在本地Node.js环境中使用)
    getApiKeyFromEnv() {
        const envVars = [
            'DEEPSEEK_API_KEY',
            'DEEPSEEK_KEY', 
            'API_KEY',
            'AI_API_KEY'
        ];

        // 在 Node.js 环境中
        if (this.isNodeJS && typeof process !== 'undefined') {
            for (const envVar of envVars) {
                const value = process.env[envVar];
                if (value && value.trim() && value !== 'YOUR_API_KEY_HERE') {
                    console.log(`✅ 从环境变量 ${envVar} 获取到 API Key`);
                    return value.trim();
                }
            }
        }

        // Cloudflare环境下不再尝试从前端获取API Key
        // 这是为了安全考虑，API Key只应在服务器端使用
        if (this.isCloudflarePages) {
            console.log('🔒 Cloudflare环境下不在前端获取API Key，使用代理模式');
            return null;
        }

        return null;
    }

    // 从本地开发服务器或 Cloudflare Pages 函数获取配置
    async getConfigFromServer() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                const serverType = this.isCloudflarePages ? 'Cloudflare Pages 函数' : '本地开发服务器';
                
                if (config.hasApiKey) {
                    if (this.isCloudflarePages && config.useProxy) {
                        // Cloudflare环境：使用代理模式，不需要API key
                        console.log(`✅ 从 ${serverType} 获取代理配置成功`);
                        return {
                            useProxy: true,
                            proxyEndpoint: config.proxyEndpoint || '/api/chat',
                            model: config.model || 'deepseek-chat',
                            requestConfig: config.requestConfig || {
                                temperature: 0.8,
                                maxTokens: 1000,
                                timeout: 30000
                            }
                        };
                    } else if (!this.isCloudflarePages && config.apiKey) {
                        // 本地环境：直接使用API key
                        console.log(`✅ 从 ${serverType} 获取配置成功`);
                        return {
                            baseUrl: config.baseUrl,
                            model: config.model,
                            apiKey: config.apiKey,
                            requestConfig: config.requestConfig || {
                                temperature: 0.8,
                                maxTokens: 1000,
                                timeout: 30000
                            }
                        };
                    }
                }
            }
        } catch (error) {
            const serverType = this.isCloudflarePages ? 'Cloudflare Pages 函数' : '本地开发服务器';
            console.warn(`⚠️ 无法从 ${serverType} 获取配置:`, error.message);
        }

        return null;
    }

    // 从配置文件获取 API 配置
    async getApiConfigFromFile() {
        try {
            // 尝试加载 config.js
            if (typeof window !== 'undefined') {
                // 浏览器环境
                if (window.API_CONFIG) {
                    return window.API_CONFIG;
                }
                
                // 尝试动态加载配置文件
                try {
                    const configScript = document.createElement('script');
                    configScript.src = './js/config.js';
                    document.head.appendChild(configScript);
                    
                    // 等待脚本加载
                    await new Promise((resolve, reject) => {
                        configScript.onload = resolve;
                        configScript.onerror = reject;
                        setTimeout(reject, 5000); // 5秒超时
                    });
                    
                    if (window.API_CONFIG) {
                        return window.API_CONFIG;
                    }
                } catch (e) {
                    console.warn('⚠️ 无法加载 config.js 文件:', e.message);
                }
            }

            // Node.js 环境
            if (this.isNodeJS) {
                try {
                    const { API_CONFIG } = require('./config.js');
                    return API_CONFIG;
                } catch (e) {
                    console.warn('⚠️ 无法加载 config.js 文件:', e.message);
                }
            }
        } catch (error) {
            console.warn('⚠️ 加载配置文件时出错:', error.message);
        }

        return null;
    }

    // 获取完整的 API 配置
    async getApiConfig() {
        if (this.apiConfig) {
            return this.apiConfig;
        }

        console.log(`🔍 环境检测结果: ${this.getEnvironmentInfo()}`);

        // 1. 在Cloudflare环境下，优先尝试从服务器获取配置 (代理模式)
        // 2. 在本地环境下，优先尝试从环境变量获取 API Key
        let envApiKey = null;
        let serverConfig = null;
        
        if (this.isCloudflarePages) {
            // Cloudflare环境：优先使用服务器配置（代理模式）
            serverConfig = await this.getConfigFromServer();
            // 只有在服务器配置失败时才尝试环境变量（用于开发测试）
            if (!serverConfig) {
                envApiKey = this.getApiKeyFromEnv();
            }
        } else {
            // 本地环境：优先使用环境变量，然后尝试服务器配置
            envApiKey = this.getApiKeyFromEnv();
            if (!envApiKey) {
                serverConfig = await this.getConfigFromServer();
            }
        }
        
        // 3. 从配置文件获取其他配置 (fallback)
        const fileConfig = await this.getApiConfigFromFile();

        // 构建最终配置
        const defaultConfig = {
            baseUrl: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek-chat',
            requestConfig: {
                temperature: 0.8,
                maxTokens: 1000,
                timeout: 30000
            }
        };

        // 合并配置，优先级根据环境不同：
        // Cloudflare环境：服务器配置 > 环境变量 > 配置文件 > 默认配置
        // 本地环境：环境变量 > 服务器配置 > 配置文件 > 默认配置
        if (this.isCloudflarePages) {
            this.apiConfig = {
                ...defaultConfig,
                ...(fileConfig || {}),
                ...(envApiKey ? { apiKey: envApiKey } : {}),
                ...(serverConfig || {})
            };
        } else {
            this.apiConfig = {
                ...defaultConfig,
                ...(fileConfig || {}),
                ...(serverConfig || {}),
                ...(envApiKey ? { apiKey: envApiKey } : {})
            };
        }

        // 处理API Key - 只在非代理模式下需要
        if (!this.apiConfig.useProxy && !this.apiConfig.apiKey) {
            // 如果不是代理模式且没有API Key，使用fallback获取方式
            this.apiConfig.apiKey = envApiKey || 
                                   (serverConfig && serverConfig.apiKey) ||
                                   (fileConfig && fileConfig.apiKey) || 
                                   'YOUR_API_KEY_HERE';
        }

        // 验证配置 - 区分代理模式和直接模式
        if (this.apiConfig.useProxy) {
            // Cloudflare代理模式：不需要API Key，但需要代理端点
            if (!this.apiConfig.proxyEndpoint) {
                console.error('❌ 代理模式下缺少代理端点配置');
                throw new Error('代理端点未配置');
            }
            console.log('✅ 代理模式配置验证通过');
        } else {
            // 本地直接模式：需要API Key和baseUrl
            if (!this.apiConfig.apiKey || this.apiConfig.apiKey === 'YOUR_API_KEY_HERE') {
                console.error('❌ 未找到有效的 API Key，请设置环境变量或配置文件');
                throw new Error('API Key 未配置');
            }
            if (!this.apiConfig.baseUrl) {
                console.error('❌ 缺少API基础URL配置');
                throw new Error('API baseUrl 未配置');
            }
            console.log('✅ 直接调用模式配置验证通过');
        }

        console.log(`✅ API 配置加载成功，使用 ${
            this.apiConfig.useProxy ? 'Cloudflare代理模式' :
            envApiKey ? '环境变量API Key' : 
            serverConfig ? '本地开发服务器API Key' : 
            '配置文件API Key'
        }`);
        return this.apiConfig;
    }

    // 获取游戏配置
    async getGameConfig() {
        if (this.gameConfig) {
            return this.gameConfig;
        }

        // 默认游戏配置
        const defaultGameConfig = {
            difficulty: {
                maxLevel: 5,
                basePassRate: 70
            },
            aiCharacters: {
                minActive: 4,
                maxActive: 5
            },
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
            retry: {
                maxAttempts: 5,
                similarityThreshold: 0.6
            }
        };

        try {
            // 尝试从配置文件获取游戏配置
            if (typeof window !== 'undefined' && window.GAME_CONFIG) {
                this.gameConfig = { ...defaultGameConfig, ...window.GAME_CONFIG };
            } else if (this.isNodeJS) {
                try {
                    const { GAME_CONFIG } = require('./config.js');
                    this.gameConfig = { ...defaultGameConfig, ...GAME_CONFIG };
                } catch (e) {
                    this.gameConfig = defaultGameConfig;
                }
            } else {
                this.gameConfig = defaultGameConfig;
            }
        } catch (error) {
            console.warn('⚠️ 使用默认游戏配置:', error.message);
            this.gameConfig = defaultGameConfig;
        }

        return this.gameConfig;
    }

    // 获取环境信息
    getEnvironmentInfo() {
        const info = [];
        
        if (this.isCloudflarePages) {
            info.push('Cloudflare Pages');
        }
        
        if (this.isNodeJS) {
            info.push('Node.js');
        }
        
        if (typeof window !== 'undefined') {
            info.push('Browser');
        }

        return info.length > 0 ? info.join(' + ') : 'Unknown';
    }

    // 获取完整配置
    async getConfig() {
        if (this.config) {
            return this.config;
        }

        const [apiConfig, gameConfig] = await Promise.all([
            this.getApiConfig(),
            this.getGameConfig()
        ]);

        this.config = {
            API_CONFIG: apiConfig,
            GAME_CONFIG: gameConfig,
            ENVIRONMENT: {
                isCloudflarePages: this.isCloudflarePages,
                isNodeJS: this.isNodeJS,
                info: this.getEnvironmentInfo()
            }
        };

        return this.config;
    }

    // 重置配置缓存
    resetCache() {
        this.config = null;
        this.apiConfig = null;
        this.gameConfig = null;
    }
}

// 创建全局实例
const envConfigManager = new EnvConfigManager();

// 导出配置管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnvConfigManager, envConfigManager };
} else {
    window.EnvConfigManager = EnvConfigManager;
    window.envConfigManager = envConfigManager;
}