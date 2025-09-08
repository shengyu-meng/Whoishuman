const fs = require('fs');
const path = require('path');

// 日志保存服务
class LogSaver {
    constructor() {
        this.logsDir = path.join(__dirname, '..', '.logs');
        this.ensureLogsDirectory();
    }
    
    // 确保.logs文件夹存在
    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
            console.log('📁 创建.logs文件夹:', this.logsDir);
        }
    }
    
    // 保存对话日志
    async saveConversationLog(logData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `conversation_${timestamp}.json`;
            const filepath = path.join(this.logsDir, filename);
            
            await fs.promises.writeFile(filepath, JSON.stringify(logData, null, 2), 'utf8');
            console.log('💬 对话日志已保存:', filename);
            return { success: true, filename, path: filepath };
        } catch (error) {
            console.error('❌ 保存对话日志失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 保存系统日志
    async saveSystemLog(logData) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `system_${timestamp}.json`;
            const filepath = path.join(this.logsDir, filename);
            
            await fs.promises.writeFile(filepath, JSON.stringify(logData, null, 2), 'utf8');
            console.log('🔧 系统日志已保存:', filename);
            return { success: true, filename, path: filepath };
        } catch (error) {
            console.error('❌ 保存系统日志失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 保存游戏完整日志（包含对话和系统日志）
    async saveGameLogs(conversationLog, systemLog) {
        const results = [];
        
        // 保存对话日志
        if (conversationLog && conversationLog.length > 0) {
            const conversationResult = await this.saveConversationLog(conversationLog);
            results.push({ type: 'conversation', ...conversationResult });
        }
        
        // 保存系统日志
        if (systemLog && systemLog.length > 0) {
            const systemResult = await this.saveSystemLog(systemLog);
            results.push({ type: 'system', ...systemResult });
        }
        
        return results;
    }
}

module.exports = LogSaver;