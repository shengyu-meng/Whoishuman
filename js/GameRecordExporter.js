// 游戏记录导出系统
class GameRecordExporter {
    constructor(gameState, gameController) {
        this.gameState = gameState;
        this.gameController = gameController;
    }

    // 生成完整的markdown导出内容
    generateMarkdownReport() {
        const timestamp = new Date().toLocaleString('zh-CN');
        const gameInfo = this.getGameInfo();
        
        let markdown = `# 《谁是人类》游戏记录\n\n`;
        markdown += `**导出时间**: ${timestamp}\n\n`;
        
        // AI伪装表现分析（放在开头）
        markdown += this.generatePerformanceAnalysisSection();
        
        // 游戏概述
        markdown += this.generateGameSummary(gameInfo);
        
        // 游戏统计
        markdown += this.generateGameStats(gameInfo);
        
        // 轮次记录
        markdown += this.generateRoundHistory();
        
        // 对话记录
        markdown += this.generateConversationHistory();
        
        // 判定记录
        markdown += this.generateJudgmentHistory();
        
        // 怀疑度变化记录
        markdown += this.generateSuspicionHistory();
        
        // 系统提示记录
        markdown += this.generateSystemMessages();
        
        // 主题变化记录
        markdown += this.generateThemeHistory();
        
        // AI角色信息
        markdown += this.generateAICharacterInfo();
        
        // 游戏结束信息
        markdown += this.generateGameEndInfo(gameInfo);
        
        return markdown;
    }
    
    // 生成AI伪装表现分析部分
    generatePerformanceAnalysisSection() {
        try {
            // 如果GameController中已经有分析结果，直接使用
            if (this.gameController && this.gameController.performanceAnalysis) {
                const analysis = this.gameController.performanceAnalysis;
                return this.formatAnalysisAsMarkdown(analysis);
            }
            
            // 否则重新生成分析
            if (typeof AIDisguiseAnalyzer !== 'undefined') {
                const analyzer = new AIDisguiseAnalyzer(this.gameState);
                const analysis = analyzer.generatePerformanceAnalysis();
                return this.formatAnalysisAsMarkdown(analysis);
            }
            
            return '## 🎭 AI伪装表现分析\n\n*分析功能暂不可用*\n\n---\n\n';
        } catch (error) {
            console.error('生成表现分析时出错:', error);
            return '## 🎭 AI伪装表现分析\n\n*分析生成失败*\n\n---\n\n';
        }
    }
    
    // 将分析结果格式化为Markdown
    formatAnalysisAsMarkdown(analysis) {
        let markdown = `## ${analysis.title}\n\n`;
        
        // 深度总结
        markdown += `### 深度分析\n\n${analysis.summary}\n\n`;
        
        // 洞察与发现
        markdown += `### 洞察与发现\n\n`;
        analysis.insights.forEach(insight => {
            markdown += `**${insight.category}**: ${insight.content}\n\n`;
        });
        
        // 反思问题
        markdown += `### 🤔 值得深思的问题\n\n`;
        analysis.reflectionQuestions.forEach((question, index) => {
            markdown += `${index + 1}. ${question}\n\n`;
        });
        
        // 哲学思辨
        markdown += `### 💭 哲学思辨\n\n${analysis.philosophicalThoughts}\n\n`;
        
        // AI评分
        markdown += `### AI伪装综合评分\n\n**${analysis.aiScore}/100**\n\n`;
        
        markdown += `---\n\n`;
        
        return markdown;
    }

    // 获取游戏基本信息
    getGameInfo() {
        return {
            playerName: this.gameState.playerName,
            totalRounds: this.gameState.currentRound,
            survivedRounds: this.gameState.survivedRounds,
            finalDifficulty: this.gameState.currentDifficulty,
            gameStartTime: this.gameState.gameStartTime,
            gameEndTime: this.gameState.gameEndTime || new Date().toISOString(),
            playerTitle: this.gameState.getPlayerTitle(),
            finalSuspicionLevel: this.gameState.getSuspicionLevel(),
            suspicionStatus: this.gameState.getSuspicionStatus(),
            gameActive: this.gameState.gameActive,
            isSuspicionGameOver: this.gameState.isSuspicionGameOver()
        };
    }

    // 生成游戏概述
    generateGameSummary(gameInfo) {
        let summary = `## 🎮 游戏概述\n\n`;
        summary += `**玩家名称**: ${gameInfo.playerName}\n`;
        summary += `**获得称号**: ${gameInfo.playerTitle}\n`;
        summary += `**生存轮数**: ${gameInfo.survivedRounds}\n`;
        summary += `**总轮数**: ${gameInfo.totalRounds}\n`;
        summary += `**最终难度**: ${this.gameState.getDifficultyStats().name} (${gameInfo.finalDifficulty})\n`;
        summary += `**最终怀疑度**: ${gameInfo.finalSuspicionLevel}% (${gameInfo.suspicionStatus.text})\n`;
        
        if (gameInfo.gameStartTime && gameInfo.gameEndTime) {
            const duration = Math.round((new Date(gameInfo.gameEndTime) - new Date(gameInfo.gameStartTime)) / 1000 / 60);
            summary += `**游戏时长**: ${duration}分钟\n`;
        }
        
        summary += `\n`;
        return summary;
    }

    // 生成游戏统计
    generateGameStats(gameInfo) {
        let stats = `## 📊 游戏统计\n\n`;
        
        const totalQuestions = this.gameState.playerResponses.length;
        const totalConversations = this.gameState.conversationHistory.filter(msg => msg.type === 'ai' || msg.type === 'player').length;
        const totalSuspicionChanges = this.gameState.suspicionHistory.length;
        const totalThemeChanges = this.gameState.themeHistory.length;
        
        stats += `**总问答数**: ${totalQuestions}\n`;
        stats += `**总对话数**: ${totalConversations}\n`;
        stats += `**怀疑度变化次数**: ${totalSuspicionChanges}\n`;
        stats += `**主题变化次数**: ${totalThemeChanges}\n`;
        stats += `**活跃AI角色数**: ${this.gameState.activeAICharacters.length}\n`;
        stats += `**总AI角色数**: ${this.gameState.allAICharacters.length}\n`;
        
        stats += `\n`;
        return stats;
    }

    // 生成轮次历史
    generateRoundHistory() {
        let history = `## 🔄 轮次历史\n\n`;
        
        for (let round = 1; round <= this.gameState.currentRound; round++) {
            const roundResponses = this.gameState.playerResponses.filter(r => r.round === round);
            const roundTheme = this.gameState.themeHistory.find(t => t.round === round);
            
            history += `### 第${round}轮\n`;
            if (roundTheme) {
                history += `**主题**: ${roundTheme.theme.title}\n`;
            }
            history += `**问答数**: ${roundResponses.length}\n`;
            
            if (roundResponses.length > 0) {
                roundResponses.forEach((response, index) => {
                    history += `${index + 1}. **问题**: ${response.question}\n`;
                    history += `   **回答**: ${response.response}\n`;
                });
            }
            history += `\n`;
        }
        
        return history;
    }

    // 生成对话历史
    generateConversationHistory() {
        let conversation = `## 💬 完整对话记录\n\n`;
        
        this.gameState.conversationHistory.forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString('zh-CN');
            
            switch (msg.type) {
                case 'ai':
                    conversation += `**[${timestamp}] ${msg.sender}**: ${msg.message}\n\n`;
                    break;
                case 'player':
                    conversation += `**[${timestamp}] ${this.gameState.playerName}**: ${msg.message}\n\n`;
                    break;
                case 'system':
                    conversation += `*[${timestamp}] 系统*: ${msg.message}\n\n`;
                    break;
                case 'judgment':
                    conversation += `**[${timestamp}] 判定结果**: ${msg.message}\n\n`;
                    break;
                default:
                    conversation += `[${timestamp}] ${msg.sender}: ${msg.message}\n\n`;
            }
        });
        
        return conversation;
    }

    // 生成判定历史
    generateJudgmentHistory() {
        let judgments = `## ⚖️ 判定记录\n\n`;
        
        const judgmentMessages = this.gameState.conversationHistory.filter(msg => msg.type === 'judgment');
        
        if (judgmentMessages.length === 0) {
            judgments += `暂无判定记录\n\n`;
            return judgments;
        }
        
        judgmentMessages.forEach((judgment, index) => {
            const timestamp = new Date(judgment.timestamp).toLocaleString('zh-CN');
            judgments += `### 判定 ${index + 1}\n`;
            judgments += `**时间**: ${timestamp}\n`;
            judgments += `**结果**: ${judgment.message}\n\n`;
        });
        
        return judgments;
    }

    // 生成怀疑度变化历史
    generateSuspicionHistory() {
        let suspicion = `## 🔍 怀疑度变化记录\n\n`;
        
        if (this.gameState.suspicionHistory.length === 0) {
            suspicion += `暂无怀疑度变化记录\n\n`;
            return suspicion;
        }
        
        suspicion += `| 时间 | 轮次 | 变化 | 原因 | 之前 | 之后 | 回复质量 |\n`;
        suspicion += `|------|------|------|------|------|------|----------|\n`;
        
        this.gameState.suspicionHistory.forEach(change => {
            const timestamp = new Date(change.timestamp).toLocaleString('zh-CN');
            const changeStr = change.change >= 0 ? `+${change.change}` : `${change.change}`;
            const quality = change.responseQuality ? 
                `${change.responseQuality.totalScore || 'N/A'}分` : 'N/A';
            
            suspicion += `| ${timestamp} | ${change.round} | ${changeStr} | ${change.reason} | ${change.oldLevel}% | ${change.newLevel}% | ${quality} |\n`;
        });
        
        suspicion += `\n`;
        return suspicion;
    }

    // 生成系统消息记录
    generateSystemMessages() {
        let systemMsgs = `## 🔧 系统提示记录\n\n`;
        
        const systemMessages = this.gameState.conversationHistory.filter(msg => msg.type === 'system');
        
        if (systemMessages.length === 0) {
            systemMsgs += `暂无系统提示记录\n\n`;
            return systemMsgs;
        }
        
        systemMessages.forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleString('zh-CN');
            systemMsgs += `${index + 1}. **[${timestamp}]** ${msg.message}\n\n`;
        });
        
        return systemMsgs;
    }

    // 生成主题变化历史
    generateThemeHistory() {
        let themes = `## 🎭 主题变化记录\n\n`;
        
        if (this.gameState.themeHistory.length === 0) {
            themes += `暂无主题变化记录\n\n`;
            return themes;
        }
        
        this.gameState.themeHistory.forEach((themeRecord, index) => {
            const timestamp = new Date(themeRecord.timestamp).toLocaleString('zh-CN');
            themes += `### 主题 ${index + 1}\n`;
            themes += `**轮次**: 第${themeRecord.round}轮\n`;
            themes += `**时间**: ${timestamp}\n`;
            themes += `**主题**: ${themeRecord.theme.title}\n`;
            if (themeRecord.theme.description) {
                themes += `**描述**: ${themeRecord.theme.description}\n`;
            }
            if (themeRecord.theme.keywords && themeRecord.theme.keywords.length > 0) {
                themes += `**关键词**: ${themeRecord.theme.keywords.join(', ')}\n`;
            }
            themes += `\n`;
        });
        
        return themes;
    }

    // 生成AI角色信息
    generateAICharacterInfo() {
        let aiInfo = `## 🤖 AI角色信息\n\n`;
        
        aiInfo += `### 活跃角色 (${this.gameState.activeAICharacters.length}个)\n`;
        this.gameState.activeAICharacters.forEach(character => {
            aiInfo += `- **${character.name}**: ${character.personality || '未知性格'}\n`;
        });
        aiInfo += `\n`;
        
        if (this.gameState.allAICharacters.length > this.gameState.activeAICharacters.length) {
            const inactiveCharacters = this.gameState.allAICharacters.filter(
                char => !this.gameState.activeAICharacters.find(active => active.name === char.name)
            );
            
            aiInfo += `### 备用角色 (${inactiveCharacters.length}个)\n`;
            inactiveCharacters.forEach(character => {
                aiInfo += `- **${character.name}**: ${character.personality || '未知性格'}\n`;
            });
            aiInfo += `\n`;
        }
        
        // AI记忆和情绪状态（如果有的话）
        if (Object.keys(this.gameState.aiMemories).length > 0) {
            aiInfo += `### AI记忆状态\n`;
            Object.entries(this.gameState.aiMemories).forEach(([name, memory]) => {
                if (memory.topicsDiscussed && memory.topicsDiscussed.length > 0) {
                    aiInfo += `**${name}**: 讨论了${memory.topicsDiscussed.length}个话题\n`;
                }
            });
            aiInfo += `\n`;
        }
        
        return aiInfo;
    }

    // 生成游戏结束信息
    generateGameEndInfo(gameInfo) {
        let endInfo = `## 🏁 游戏结束信息\n\n`;
        
        if (gameInfo.isSuspicionGameOver) {
            endInfo += `**结束原因**: 怀疑度达到上限 (${gameInfo.finalSuspicionLevel}%)\n`;
        } else if (!gameInfo.gameActive) {
            endInfo += `**结束原因**: 游戏正常结束\n`;
        } else {
            endInfo += `**状态**: 游戏进行中\n`;
        }
        
        endInfo += `**最终称号**: ${gameInfo.playerTitle}\n`;
        endInfo += `**怀疑度状态**: ${gameInfo.suspicionStatus.text} (${gameInfo.finalSuspicionLevel}%)\n`;
        
        if (gameInfo.gameEndTime) {
            endInfo += `**结束时间**: ${new Date(gameInfo.gameEndTime).toLocaleString('zh-CN')}\n`;
        }
        
        endInfo += `\n---\n\n`;
        endInfo += `*本报告由《谁是人类》游戏自动生成*\n`;
        
        return endInfo;
    }

    // 生成文件名
    generateFileName() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const playerName = this.gameState.playerName || '玩家';
        const rounds = this.gameState.survivedRounds;
        
        return `WhoisHuman_${playerName}_${rounds}轮_${timestamp}.md`;
    }

    // 导出为markdown文件
    exportToMarkdown() {
        try {
            const markdown = this.generateMarkdownReport();
            const filename = this.generateFileName();
            
            // 创建Blob对象
            const blob = new Blob([markdown], { 
                type: 'text/markdown;charset=utf-8' 
            });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理URL对象
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return {
                success: true,
                filename: filename,
                size: blob.size
            };
        } catch (error) {
            console.error('导出失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取导出预览（前500字符）
    getExportPreview() {
        const markdown = this.generateMarkdownReport();
        return markdown.substring(0, 500) + (markdown.length > 500 ? '\n\n...(更多内容)' : '');
    }

    // 验证导出数据完整性
    validateExportData() {
        const issues = [];
        
        if (!this.gameState.playerName) {
            issues.push('玩家姓名缺失');
        }
        
        if (this.gameState.conversationHistory.length === 0) {
            issues.push('对话记录为空');
        }
        
        if (this.gameState.playerResponses.length === 0) {
            issues.push('问答记录为空');
        }
        
        if (this.gameState.currentRound <= 0) {
            issues.push('轮次信息异常');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
}

// 导出GameRecordExporter类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameRecordExporter;
} else {
    window.GameRecordExporter = GameRecordExporter;
}