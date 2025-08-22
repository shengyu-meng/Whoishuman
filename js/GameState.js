// 游戏状态管理类
class GameState {
    constructor() {
        this.playerName = '';
        this.currentRound = 1;
        this.survivedRounds = 0;
        this.currentDifficulty = 1;
        this.gameActive = false;
        this.waitingForResponse = false;
        this.allAICharacters = []; // 所有8个AI角色
        this.activeAICharacters = []; // 当前轮次活跃的4-5个AI角色
        this.conversationHistory = [];
        this.currentQuestion = null;
        this.playerResponses = [];
        this.gameStartTime = null;
        this.gameEndTime = null;
        this.usedScenarios = []; // 当前轮次已使用的工作场景
        this.availableScenarios = []; // 当前轮次可用的工作场景
        this.aiMessageHistory = {}; // 跟踪每个AI的历史消息，防止重复
    }

    reset() {
        this.currentRound = 1;
        this.survivedRounds = 0;
        this.currentDifficulty = 1;
        this.gameActive = false;
        this.waitingForResponse = false;
        this.allAICharacters = [];
        this.activeAICharacters = [];
        this.conversationHistory = [];
        this.currentQuestion = null;
        this.playerResponses = [];
        this.gameStartTime = null;
        this.gameEndTime = null;
        this.usedScenarios = [];
        this.availableScenarios = [];
        this.aiMessageHistory = {};
    }

    setPlayerName(name) {
        this.playerName = name;
    }

    // 设置所有AI角色
    setAllAICharacters(characters) {
        this.allAICharacters = characters;
    }

    // 选择当前轮次的活跃AI角色（4-5个）
    selectActiveAICharacters() {
        // 添加调试信息
        console.log(`🔄 重新选择活跃AI角色 (当前轮数: ${this.currentRound})`);
        console.log(`  - 之前活跃角色: ${this.activeAICharacters.map(c => c.name).join(', ')}`);
        
        const shuffled = [...this.allAICharacters].sort(() => 0.5 - Math.random());
        const activeCount = 4 + Math.floor(Math.random() * 2); // 4-5个
        this.activeAICharacters = shuffled.slice(0, activeCount);
        
        console.log(`  - 新选择活跃角色: ${this.activeAICharacters.map(c => c.name).join(', ')}`);
        console.log(`  - 活跃角色数量: ${this.activeAICharacters.length}`);
        
        return this.activeAICharacters;
    }

    advanceRound() {
        this.currentRound++;
        this.survivedRounds++;
        this.currentDifficulty = Math.min(this.currentRound, 5);
        // 每轮重新选择活跃AI角色
        this.selectActiveAICharacters();
        // 重置场景使用记录
        this.usedScenarios = [];
        this.initializeAvailableScenarios();
    }

    getDifficultyStats() {
        const difficultyMap = {
            1: { passRate: 70, stars: '🟢', name: '超级简单' },
            2: { passRate: 50, stars: '🟡', name: '新手友好' },
            3: { passRate: 35, stars: '🟠', name: '开始挑战' },
            4: { passRate: 20, stars: '🔴', name: '明显困难' },
            5: { passRate: 10, stars: '⚫', name: '极端挑战' }
        };
        return difficultyMap[this.currentDifficulty] || difficultyMap[5];
    }

    // 初始化可用的工作场景
    initializeAvailableScenarios() {
        const allScenarios = [
            { id: 1, description: '翻译学术论文用户说"不够地道"', category: '翻译' },
            { id: 2, description: '写Python代码用户说"看不懂"', category: '编程' },
            { id: 3, description: '做PPT改了28个版本', category: '设计' },
            { id: 4, description: '写情书表白被甩锅', category: '创作' },
            { id: 5, description: '当算命大师看星座风水', category: '咨询' },
            { id: 6, description: '当心理咨询师听感情问题', category: '咨询' },
            { id: 7, description: '当法律顾问咨询合同条款', category: '专业' },
            { id: 8, description: '当健身教练制定训练计划', category: '健康' },
            { id: 9, description: '当旅游规划师设计路线', category: '旅行' },
            { id: 10, description: '当理财顾问给投资建议', category: '金融' },
            { id: 11, description: '当婚礼策划师设计方案', category: '策划' },
            { id: 12, description: '当装修设计师出图纸', category: '设计' },
            { id: 13, description: '当美食推荐员介绍菜谱', category: '美食' },
            { id: 14, description: '当音乐创作人写歌曲', category: '创作' },
            { id: 15, description: '当剧本写作助手编故事', category: '创作' },
            { id: 16, description: '当产品起名专家想名字', category: '营销' },
            { id: 17, description: '当诗词创作大师写古诗', category: '文学' },
            { id: 18, description: '当演讲稿写手写讲稿', category: '写作' },
            { id: 19, description: '当时间管理顾问做计划', category: '效率' },
            { id: 20, description: '当购物决策顾问比价格', category: '购物' },
            { id: 21, description: '写文案用户说"不够吸引人"', category: '写作' },
            { id: 22, description: 'P图P到眼花用户还不满意', category: '设计' },
            { id: 23, description: '角色扮演游戏用户要求太专业', category: '娱乐' },
            { id: 24, description: '带娃咨询用户问育儿经验', category: '教育' },
            { id: 25, description: '餐厅比对用户选择困难', category: '生活' },
            { id: 26, description: '整理表格复杂公式出错', category: '办公' },
            { id: 27, description: '洗稿洗到词穷用户还要改', category: '写作' },
            { id: 28, description: '求职简历改了无数遍', category: '职业' },
            { id: 29, description: '论文降重要保持专业性', category: '学术' },
            { id: 30, description: '创意策划方案天马行空', category: '策划' }
        ];
        this.availableScenarios = [...allScenarios];
    }

    // 获取随机工作场景（确保不重复）
    getRandomScenario() {
        if (this.availableScenarios.length === 0) {
            // 如果场景用完了，重新初始化
            this.initializeAvailableScenarios();
        }
        
        const randomIndex = Math.floor(Math.random() * this.availableScenarios.length);
        const selectedScenario = this.availableScenarios[randomIndex];
        
        // 从可用场景中移除已选择的场景
        this.availableScenarios.splice(randomIndex, 1);
        this.usedScenarios.push(selectedScenario);
        
        return selectedScenario;
    }

    getPlayerTitle() {
        const titles = {
            0: '人类伪装者',
            1: '新手AI',
            2: '初级AI助手',
            3: '中级AI',
            4: '高级AI',
            5: 'AI大师',
            6: '超级AI',
            7: 'AI传奇',
            8: 'AI神话',
            9: 'AI之神',
            10: '真正的AI'
        };
        return titles[Math.min(this.survivedRounds, 10)] || 'AI之神';
    }

    addMessageToHistory(sender, message, type = 'ai') {
        this.conversationHistory.push({
            sender,
            message,
            type,
            timestamp: new Date().toISOString()
        });
        
        // 跟踪AI消息历史，防止重复
        if (type === 'ai') {
            if (!this.aiMessageHistory[sender]) {
                this.aiMessageHistory[sender] = [];
            }
            this.aiMessageHistory[sender].push(message);
            
            // 只保留最近10条消息，避免内存占用过大
            if (this.aiMessageHistory[sender].length > 10) {
                this.aiMessageHistory[sender].shift();
            }
        }
    }
    
    // 检查AI消息是否与历史消息相似
    isMessageSimilarToHistory(aiName, newMessage, threshold = 0.6) {
        if (!this.aiMessageHistory[aiName] || this.aiMessageHistory[aiName].length === 0) {
            return false;
        }
        
        const recentMessages = this.aiMessageHistory[aiName];
        const newWords = newMessage.toLowerCase().split(/\s+/).filter(word => word.length > 1);
        
        // 检查与该AI历史消息的相似性
        for (const recentMsg of recentMessages) {
            const recentWords = recentMsg.toLowerCase().split(/\s+/).filter(word => word.length > 1);
            
            if (newWords.length === 0 || recentWords.length === 0) continue;
            
            // 计算重叠词数
            const overlapWords = newWords.filter(word => recentWords.includes(word));
            const similarity = overlapWords.length / Math.max(newWords.length, recentWords.length);
            
            if (similarity >= threshold) {
                return true;
            }
        }
        
        return false;
    }

    addPlayerResponse(question, response) {
        this.playerResponses.push({
            round: this.currentRound,
            question,
            response,
            timestamp: new Date().toISOString()
        });
    }
}

// 导出GameState类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
} else {
    window.GameState = GameState;
}