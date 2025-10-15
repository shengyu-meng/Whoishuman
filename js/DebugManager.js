// 调试模式管理器
class DebugManager {
    constructor() {
        this.config = null;
        this.isDebugEnabled = false;
        this.originalConsole = {};
        this.logBuffer = [];
        this.conversationLog = [];
        this.systemLog = [];
        this.autoSaveTimer = null;
        this.initialized = false;
        
        // 异步初始化
        this.initAsync();
    }
    
    // 异步初始化调试管理器
    async initAsync() {
        try {
            // 获取环境配置
            if (window.envConfigManager) {
                const fullConfig = await window.envConfigManager.getConfig();
                this.config = fullConfig.DEBUG_CONFIG;
            } else {
                // 回退到传统方式
                this.config = window.DEBUG_CONFIG || { enabled: false };
            }
            
            this.isDebugEnabled = this.config.enabled;
            // 只在调试模式启用时输出日志
            if (this.isDebugEnabled && this.config.features && this.config.features.showConsoleLogs) {
                console.log(`🐛 调试配置加载完成: 启用 (来源: ${this.config.source || 'unknown'})`);
            }
            
            this.init();
            this.initialized = true;
        } catch (error) {
            // 初始化失败时的警告只在开发环境输出
            if (typeof window !== 'undefined' && window.location && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                console.warn('⚠️ 调试管理器初始化失败，使用默认配置:', error.message);
            }
            this.config = { enabled: false };
            this.isDebugEnabled = false;
            this.init();
            this.initialized = true;
        }
    }
    
    // 初始化调试管理器
    init() {
        if (this.isDebugEnabled) {
            console.log('🐛 调试模式已启用');
            this.setupConsoleInterception();
            // 移除自动保存设置，只在游戏结束时手动保存
        } else {
            // 当调试模式关闭时，禁用console日志并隐藏调试按钮
            this.disableConsoleLogs();
            this.hideDebugButtons();
        }
        
        this.setupDebugButtons();
    }
    
    // 设置调试按钮的显示/隐藏
    setupDebugButtons() {
        // 查找所有的调试按钮（可能在不同的容器中）
        // 支持的ID模式: skipRoundBtn, skipRoundBtn_openmic, skipRoundBtn_werewolf 等
        const skipBtns = document.querySelectorAll('[id^="skipRoundBtn"]');
        const endGameBtns = document.querySelectorAll('[id^="endGameBtn"]');
        
        if (this.isDebugEnabled && this.config.features?.showConsoleLogs) {
            console.log('🐛 setupDebugButtons 被调用');
            console.log('🐛 找到按钮:', {
                skip: Array.from(skipBtns).map(b => b.id),
                end: Array.from(endGameBtns).map(b => b.id)
            });
        }
        
        if (this.isDebugEnabled) {
            if (this.config.features?.showSkipButton) {
                skipBtns.forEach(btn => {
                    if (btn) btn.classList.remove('hidden');
                });
            }
            
            if (this.config.features?.showEndGameButton) {
                endGameBtns.forEach(btn => {
                    if (btn) btn.classList.remove('hidden');
                });
            }
        } else {
            this.hideDebugButtons();
        }
    }
    
    // 隐藏调试按钮
    hideDebugButtons() {
        // 查找所有的调试按钮（可能在不同的容器中）
        const skipBtns = document.querySelectorAll('[id^="skipRoundBtn"]');
        const endGameBtns = document.querySelectorAll('[id^="endGameBtn"]');
        
        skipBtns.forEach(btn => {
            if (btn) btn.classList.add('hidden');
        });
        
        endGameBtns.forEach(btn => {
            if (btn) btn.classList.add('hidden');
        });
    }
    
    // 设置控制台日志拦截
    setupConsoleInterception() {
        if (!this.config.features?.showConsoleLogs) {
            this.disableConsoleLogs();
            return;
        }
        
        // 保存原始console方法
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };
        
        // 拦截console方法以便保存日志
        const self = this;
        ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
            console[method] = (...args) => {
                // 调用原始方法
                self.originalConsole[method].apply(console, args);
                
                // 保存到系统日志
                self.addSystemLog(method.toUpperCase(), args.join(' '));
            };
        });
    }
    
    // 禁用控制台日志
    disableConsoleLogs() {
        // 当调试模式关闭时，应该禁用console日志
        if (!this.isDebugEnabled || !this.config.features?.showConsoleLogs) {
            // 先保存原始console方法（如果还没保存的话）
            if (!this.originalConsole.log) {
                this.originalConsole = {
                    log: console.log,
                    warn: console.warn,
                    error: console.error,
                    info: console.info,
                    debug: console.debug
                };
            }
            
            const noop = () => {};
            console.log = noop;
            console.warn = noop;
            console.error = noop;
            console.info = noop;
            console.debug = noop;
        }
    }
    
    // 启用控制台日志
    enableConsoleLogs() {
        if (this.originalConsole.log) {
            console.log = this.originalConsole.log;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
            console.info = this.originalConsole.info;
            console.debug = this.originalConsole.debug;
        }
    }
    
    // 添加对话日志
    addConversationLog(type, sender, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            sender,
            message,
            metadata
        };
        
        this.conversationLog.push(logEntry);
        
        if (this.isDebugEnabled && this.config.features?.showConsoleLogs) {
            console.log(`💬 [${type}] ${sender}: ${message}`, metadata);
        }
    }
    
    // 添加系统日志
    addSystemLog(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata
        };
        
        this.systemLog.push(logEntry);
    }
    
    // 保存日志到文件
    async saveLogsToFile() {
        if (!this.isDebugEnabled) {
            return;
        }
        
        try {
            // 检查是否是本地开发环境并尝试服务器端保存
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // 在本地开发环境中，直接使用浏览器下载，避免404错误
                if (this.config.features?.showConsoleLogs) {
                    console.log('📁 本地环境：使用浏览器下载模式保存日志');
                }
                await this.fallbackToDownload();
                return;
            }
            
            // 如果服务器端保存失败或非本地环境，回退到浏览器下载
            await this.fallbackToDownload();
            
        } catch (error) {
            console.error('❌ 保存日志文件失败:', error);
            // 尝试回退到浏览器下载
            try {
                await this.fallbackToDownload();
            } catch (fallbackError) {
                console.error('❌ 回退下载也失败:', fallbackError);
            }
        }
    }
    
    // 服务器端保存日志
    async saveLogsToServer() {
        try {
            // 使用相同的主机名避免CORS问题，但确保使用正确的服务器地址
            const currentHost = window.location.hostname;
            // 如果是localhost，也尝试使用127.0.0.1（服务器在两个地址都监听）
            const serverHost = currentHost === 'localhost' ? 'localhost' : currentHost;
            const serverUrl = `http://${serverHost}:3001/api/save-logs`;
            
            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationLog: this.conversationLog.length > 0 ? this.conversationLog : null,
                    systemLog: this.systemLog.length > 0 ? this.systemLog : null
                })
            });
            
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success) {
                if (this.config.features?.showConsoleLogs) {
                    console.log('✅ 服务器端保存成功:', result.results);
                }
                return true;
            } else {
                throw new Error(result.message || '服务器端保存失败');
            }
        } catch (error) {
            if (this.config.features?.showConsoleLogs) {
                console.warn('⚠️ 服务器端保存失败，将使用浏览器下载:', error.message);
            }
            return false;
        }
    }
    
    // 回退到浏览器下载模式
    async fallbackToDownload() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // 保存对话日志
        if (this.conversationLog.length > 0) {
            const conversationFilename = `${this.config.logging?.conversationLogPrefix || 'conversation_'}${timestamp}.json`;
            await this.downloadFile(conversationFilename, JSON.stringify(this.conversationLog, null, 2));
        }
        
        // 保存系统日志
        if (this.systemLog.length > 0) {
            const systemFilename = `${this.config.logging?.systemLogPrefix || 'system_'}${timestamp}.json`;
            await this.downloadFile(systemFilename, JSON.stringify(this.systemLog, null, 2));
        }
        
        if (this.config.features?.showConsoleLogs) {
            console.log('📁 日志文件已下载（需手动移动到.logs文件夹）');
        }
    }
    
    // 下载文件到指定目录
    async downloadFile(filename, content) {
        // 由于浏览器安全限制，无法直接写入指定目录
        // 这里使用浏览器下载功能，用户需要手动移动到.logs文件夹
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    // 调试接口方法 - 供外部调用或控制台调试使用
    
    getConversationLogs() {                          // 获取对话日志
        return this.conversationLog;
    }
    
    getSystemLogs() {                               // 获取系统日志
        return this.systemLog;
    }
    
    clearLogs() {                                   // 清理所有日志
        this.conversationLog = [];
        this.systemLog = [];
        
        if (this.isDebugEnabled && this.config.features?.showConsoleLogs) {
            console.log('🗑️ 日志已清理');
        }
    }
    
    // 手动保存日志
    async manualSave() {
        if (this.isDebugEnabled) {
            await this.saveLogsToFile();
        }
    }
    
    // 切换调试模式
    toggleDebugMode(enabled) {
        this.isDebugEnabled = enabled;
        this.config.enabled = enabled;
        
        if (enabled) {
            // 先恢复console方法，然后重新设置拦截
            this.enableConsoleLogs();
            console.log('🐛 调试模式已启用');
            this.setupConsoleInterception();
            this.setupDebugButtons();
        } else {
            console.log('🐛 调试模式已禁用');
            this.hideDebugButtons();
            this.disableConsoleLogs();
            
            // 清理日志数据
            this.clearLogs();
        }
    }
    
    // 销毁调试管理器
    destroy() {
        // 恢复原始console方法
        Object.assign(console, this.originalConsole);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugManager;
} else {
    window.DebugManager = DebugManager;
}