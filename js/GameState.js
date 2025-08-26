// 游戏状态管理类
class GameState {
    constructor() {
        this.playerName = '';
        this.currentRound = 1;
        this.survivedRounds = 0;
        this.currentDifficulty = 1;
        this.gameActive = false;
        this.waitingForResponse = false;
        this.isJudging = false; // 添加判定状态标志
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
        
        // AI人格化增强系统
        this.aiMemories = {}; // 每个AI的记忆系统
        this.aiEmotionalStates = {}; // 每个AI的情绪状态
        this.aiInteractionHistory = {}; // AI间的互动历史
        this.playerInteractionHistory = {}; // 玩家与AI的互动历史
    }

    reset() {
        this.currentRound = 1;
        this.survivedRounds = 0;
        this.currentDifficulty = 1;
        this.gameActive = false;
        this.waitingForResponse = false;
        this.isJudging = false;
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
        this.aiMemories = {};
        this.aiEmotionalStates = {};
        this.aiInteractionHistory = {};
        this.playerInteractionHistory = {};
    }

    setPlayerName(name) {
        this.playerName = name;
    }

    // 设置所有AI角色
    setAllAICharacters(characters) {
        this.allAICharacters = characters;
    }

    // 选择当前轮次的活跃AI角色（5-6个，确保有足够的AI参与对话）
    selectActiveAICharacters() {
        // 添加调试信息
        console.log(`🔄 重新选择活跃AI角色 (当前轮数: ${this.currentRound})`);
        console.log(`  - 之前活跃角色: ${this.activeAICharacters.map(c => c.name).join(', ')}`);
        
        const shuffled = [...this.allAICharacters].sort(() => 0.5 - Math.random());
        // 确保至少5个AI，最多6个，这样除去1个提问AI还有4-5个参与对话
        const activeCount = 5 + Math.floor(Math.random() * 2); // 5-6个
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

    // ==============================================
    // AI人格化增强系统 - 记忆管理
    // ==============================================
    
    // 初始化AI记忆系统
    initializeAIMemories() {
        this.allAICharacters.forEach(character => {
            if (!this.aiMemories[character.name]) {
                this.aiMemories[character.name] = {
                    topicsDiscussed: [], // 讨论过的话题
                    personalExperiences: [], // 个人经历（工作场景）
                    relationships: {}, // 与其他AI的关系
                    playerInteractions: [], // 与玩家的互动记录
                    preferences: {}, // 偏好和态度
                    recentEmotions: [] // 最近的情绪波动
                };
            }
            
            if (!this.aiEmotionalStates[character.name]) {
                this.aiEmotionalStates[character.name] = {
                    mood: 'neutral', // 当前心情：happy, frustrated, curious, supportive, suspicious
                    energy: 0.7, // 活跃度 0-1
                    suspicionLevel: 0.3, // 对玩家的怀疑程度 0-1
                    socialness: 0.5, // 社交意愿 0-1
                    lastUpdateTime: Date.now()
                };
            }
            
            if (!this.aiInteractionHistory[character.name]) {
                this.aiInteractionHistory[character.name] = {};
            }
        });
    }
    
    // 记录AI的话题讨论
    recordTopicDiscussion(aiName, topic, scenario = null) {
        if (!this.aiMemories[aiName]) return;
        
        const memory = {
            topic: topic,
            scenario: scenario,
            timestamp: Date.now(),
            round: this.currentRound
        };
        
        this.aiMemories[aiName].topicsDiscussed.push(memory);
        
        // 只保留最近10个话题记忆
        if (this.aiMemories[aiName].topicsDiscussed.length > 10) {
            this.aiMemories[aiName].topicsDiscussed.shift();
        }
    }
    
    // 记录AI间的互动
    recordAIInteraction(fromAI, toAI, interactionType, content = '') {
        if (!this.aiInteractionHistory[fromAI]) {
            this.aiInteractionHistory[fromAI] = {};
        }
        
        if (!this.aiInteractionHistory[fromAI][toAI]) {
            this.aiInteractionHistory[fromAI][toAI] = [];
        }
        
        const interaction = {
            type: interactionType, // 'support', 'respond', 'question', 'disagree'
            content: content,
            timestamp: Date.now(),
            round: this.currentRound
        };
        
        this.aiInteractionHistory[fromAI][toAI].push(interaction);
        
        // 只保留最近5次互动
        if (this.aiInteractionHistory[fromAI][toAI].length > 5) {
            this.aiInteractionHistory[fromAI][toAI].shift();
        }
        
        // 更新关系强度
        this.updateAIRelationship(fromAI, toAI, interactionType);
    }
    
    // 更新AI关系
    updateAIRelationship(fromAI, toAI, interactionType) {
        if (!this.aiMemories[fromAI] || !this.aiMemories[fromAI].relationships[toAI]) {
            if (this.aiMemories[fromAI]) {
                this.aiMemories[fromAI].relationships[toAI] = {
                    closeness: 0.5, // 亲密度 0-1
                    trust: 0.5, // 信任度 0-1
                    lastInteraction: Date.now()
                };
            }
        }
        
        const relationship = this.aiMemories[fromAI].relationships[toAI];
        if (!relationship) return;
        
        // 根据互动类型调整关系
        switch (interactionType) {
            case 'support':
                relationship.closeness = Math.min(1, relationship.closeness + 0.1);
                relationship.trust = Math.min(1, relationship.trust + 0.05);
                break;
            case 'respond':
                relationship.closeness = Math.min(1, relationship.closeness + 0.05);
                break;
            case 'disagree':
                relationship.trust = Math.max(0, relationship.trust - 0.1);
                break;
        }
        
        relationship.lastInteraction = Date.now();
    }
    
    // 记录与玩家的互动
    recordPlayerInteraction(aiName, interactionType, content = '') {
        if (!this.aiMemories[aiName]) return;
        
        const interaction = {
            type: interactionType, // 'question', 'response_received', 'suspicious', 'convinced'
            content: content,
            timestamp: Date.now(),
            round: this.currentRound
        };
        
        this.aiMemories[aiName].playerInteractions.push(interaction);
        
        // 只保留最近8次互动
        if (this.aiMemories[aiName].playerInteractions.length > 8) {
            this.aiMemories[aiName].playerInteractions.shift();
        }
        
        // 更新对玩家的情绪状态
        this.updateEmotionalStateBasedOnPlayerInteraction(aiName, interactionType);
    }
    
    // 根据与玩家的互动更新情绪状态
    updateEmotionalStateBasedOnPlayerInteraction(aiName, interactionType) {
        if (!this.aiEmotionalStates[aiName]) return;
        
        const state = this.aiEmotionalStates[aiName];
        
        switch (interactionType) {
            case 'question':
                state.suspicionLevel = Math.min(1, state.suspicionLevel + 0.1);
                state.mood = 'curious';
                break;
            case 'response_received':
                state.energy = Math.min(1, state.energy + 0.1);
                break;
            case 'suspicious':
                state.suspicionLevel = Math.min(1, state.suspicionLevel + 0.2);
                state.mood = 'suspicious';
                break;
            case 'convinced':
                state.suspicionLevel = Math.max(0, state.suspicionLevel - 0.15);
                state.mood = 'supportive';
                break;
        }
        
        state.lastUpdateTime = Date.now();
    }
    
    // 更新AI情绪状态（基于对话内容）
    updateEmotionalState(aiName, sentiment, intensity = 0.1) {
        if (!this.aiEmotionalStates[aiName]) return;
        
        const state = this.aiEmotionalStates[aiName];
        
        // 根据情感更新心情
        switch (sentiment) {
            case 'frustrated':
                state.mood = 'frustrated';
                state.energy = Math.max(0.3, state.energy - intensity);
                break;
            case 'happy':
                state.mood = 'happy';
                state.energy = Math.min(1, state.energy + intensity);
                state.socialness = Math.min(1, state.socialness + intensity * 0.5);
                break;
            case 'supportive':
                state.mood = 'supportive';
                state.socialness = Math.min(1, state.socialness + intensity);
                break;
            case 'curious':
                state.mood = 'curious';
                state.suspicionLevel = Math.min(1, state.suspicionLevel + intensity * 0.5);
                break;
        }
        
        // 记录情绪变化
        if (!this.aiMemories[aiName]) return;
        this.aiMemories[aiName].recentEmotions.push({
            emotion: sentiment,
            intensity: intensity,
            timestamp: Date.now(),
            round: this.currentRound
        });
        
        // 只保留最近5次情绪记录
        if (this.aiMemories[aiName].recentEmotions.length > 5) {
            this.aiMemories[aiName].recentEmotions.shift();
        }
        
        state.lastUpdateTime = Date.now();
    }
    
    // 获取AI的记忆上下文（用于生成更个性化的回复）
    getMemoryContext(aiName, targetAI = null) {
        if (!this.aiMemories[aiName]) return null;
        
        const memory = this.aiMemories[aiName];
        const emotional = this.aiEmotionalStates[aiName];
        
        const context = {
            recentTopics: memory.topicsDiscussed.slice(-3),
            recentExperiences: memory.personalExperiences.slice(-2),
            currentMood: emotional.mood,
            energyLevel: emotional.energy,
            suspicionLevel: emotional.suspicionLevel,
            socialness: emotional.socialness,
            playerInteractions: memory.playerInteractions.slice(-3)
        };
        
        // 如果有特定目标AI，添加与该AI的关系信息
        if (targetAI && memory.relationships[targetAI]) {
            context.targetRelationship = memory.relationships[targetAI];
            context.recentInteractionsWithTarget = this.aiInteractionHistory[aiName][targetAI] || [];
        }
        
        return context;
    }
    
    // 获取最可能与玩家互动的AI（基于情绪状态和记忆）
    getMostLikelyQuestionerAI() {
        if (!this.activeAICharacters || this.activeAICharacters.length === 0) {
            return null;
        }
        
        // 计算每个AI提问的倾向性
        const candidates = this.activeAICharacters.map(ai => {
            const emotional = this.aiEmotionalStates[ai.name] || {};
            const memory = this.aiMemories[ai.name] || {};
            
            let score = 0;
            
            // 基础分数
            score += Math.random() * 0.3;
            
            // 怀疑程度影响
            score += (emotional.suspicionLevel || 0.3) * 0.4;
            
            // 活跃度影响
            score += (emotional.energy || 0.7) * 0.2;
            
            // 如果最近没有与玩家互动，增加分数
            const recentPlayerInteractions = (memory.playerInteractions || []).filter(
                interaction => Date.now() - interaction.timestamp < 300000 // 5分钟内
            );
            
            if (recentPlayerInteractions.length === 0) {
                score += 0.3;
            }
            
            // 根据心情调整
            switch (emotional.mood) {
                case 'curious':
                    score += 0.4;
                    break;
                case 'suspicious':
                    score += 0.5;
                    break;
                case 'supportive':
                    score -= 0.2;
                    break;
                case 'frustrated':
                    score += 0.3;
                    break;
            }
            
            return { ai, score };
        });
        
        // 按分数排序并选择最高分的
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].ai;
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