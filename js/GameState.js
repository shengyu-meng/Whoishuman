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
        
        // 游戏模式系统
        this.gameMode = 'challenge'; // 'challenge', 'openmic', 'werewolf'
        this.gameModeConfig = {
            challenge: {
                description: '在AI的反复试探中隐藏人类身份',
                passiveMode: true
            },
            openmic: {
                description: '在自由发言中融入AI群体',
                playerSpeakingTurns: 0, // 玩家本轮发言次数
                totalSpeakingTurns: 0, // 本轮总发言次数（包括AI和玩家）
                maxSpeaksPerRound: 8, // 每轮最多发言次数
                roundDuration: 120000, // 轮次最长持续时间（2分钟）
                roundStartTime: null, // 轮次开始时间
                voluntarySpeaking: true, // 允许主动发言
                roundSpeakingComplete: false, // 本轮是否已完成
                playerMessages: [], // 玩家本轮的所有发言
                hasPlayerSpoken: false, // 玩家本轮是否已发言
                aiReactionsPending: false, // AI反应是否在进行中
                forcedCueCount: 0, // 强制cue次数
                roundEndCheckInProgress: false // 防止重复检查轮次结束
            },
            werewolf: {
                description: '在票选人类的大逃杀中活到最后',
                alivePlayers: [], // 存活玩家列表 (包含AI和玩家)
                votingPhase: false, // 是否在投票阶段
                votingResults: {}, // 投票结果 {voterName: targetName}
                eliminatedPlayers: [], // 被淘汰的玩家
                discussionPhase: true, // 是否在讨论阶段
                roundVotingComplete: false // 本轮投票是否完成
            }
        };
        
        // AI人格化增强系统
        this.aiMemories = {}; // 每个AI的记忆系统
        this.aiEmotionalStates = {}; // 每个AI的情绪状态
        this.aiInteractionHistory = {}; // AI间的互动历史
        this.playerInteractionHistory = {}; // 玩家与AI的互动历史
        
        // 主题系统相关状态
        this.currentTheme = null; // 当前轮次主题
        this.themeHistory = []; // 历史主题记录
        this.themeEmotionalContext = {}; // 主题情绪上下文
        this.themeTransitionInProgress = false; // 主题转换进行中标志
        
        // 怀疑度HP系统
        this.suspicionLevel = 50; // 当前怀疑度 (0-100) - 初始设置为50%
        this.suspicionHistory = []; // 怀疑度变化历史
        this.maxSuspicion = 100; // 最大怀疑度阈值
        
        // 首次质疑通知状态
        this.hasShownFirstSuspicionNotice = false; // 是否已显示过第一次质疑通知
        
        // AI角色轮次场景缓存 - 确保每个AI每轮只有一个场景
        this.aiRoundScenarios = {}; // { aiName: { round: number, scenario: object } }
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
        
        // 重置游戏模式状态
        this.gameMode = 'challenge';
        this.gameModeConfig.openmic.playerSpeakingTurns = 0;
        this.gameModeConfig.openmic.totalSpeakingTurns = 0;
        this.gameModeConfig.openmic.roundStartTime = null;
        this.gameModeConfig.openmic.roundSpeakingComplete = false;
        this.gameModeConfig.openmic.playerMessages = [];
        this.gameModeConfig.openmic.hasPlayerSpoken = false;
        this.gameModeConfig.openmic.aiReactionsPending = false;
        this.gameModeConfig.openmic.forcedCueCount = 0;
        this.gameModeConfig.openmic.roundEndCheckInProgress = false;
        this.gameModeConfig.werewolf.alivePlayers = [];
        this.gameModeConfig.werewolf.votingPhase = false;
        this.gameModeConfig.werewolf.votingResults = {};
        this.gameModeConfig.werewolf.eliminatedPlayers = [];
        this.gameModeConfig.werewolf.discussionPhase = true;
        this.gameModeConfig.werewolf.roundVotingComplete = false;
        this.aiMemories = {};
        this.aiEmotionalStates = {};
        this.aiInteractionHistory = {};
        this.playerInteractionHistory = {};
        
        // 重置主题系统状态
        this.currentTheme = null;
        this.themeHistory = [];
        this.themeEmotionalContext = {};
        this.themeTransitionInProgress = false;
        
        // 重置怀疑度系统
        this.suspicionLevel = 50; // 重置到50%初始怀疑度
        this.suspicionHistory = [];
        this.hasShownFirstSuspicionNotice = false; // 重置首次质疑通知状态
        
        // 重置AI场景缓存
        this.aiRoundScenarios = {};
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

    // 获取随机工作场景（支持主题场景）
    getRandomScenario() {
        // 如果有主题系统，使用主题场景
        if (this.currentTheme && typeof window !== 'undefined' && window.ThemeScenarioIntegration) {
            const themeScenario = window.ThemeScenarioIntegration.getThemeScenario(this);
            if (themeScenario) {
                // 将主题场景添加到已使用列表
                this.usedScenarios.push(themeScenario);
                return themeScenario;
            }
        }
        
        // 回退到原有逻辑
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
    
    // 为特定AI角色获取场景（每轮每个AI只分配一个场景）
    getRandomScenarioForCharacter(character) {
        const characterName = typeof character === 'string' ? character : character.name;
        
        // 检查该AI在当前轮是否已经有场景
        if (this.aiRoundScenarios[characterName] && 
            this.aiRoundScenarios[characterName].round === this.currentRound) {
            console.log(`🎯 ${characterName} 复用本轮场景: ${this.aiRoundScenarios[characterName].scenario.description}`);
            return this.aiRoundScenarios[characterName].scenario;
        }
        
        // 为该AI分配新场景
        let scenario;
        
        // 如果有主题系统，使用主题场景
        if (this.currentTheme && typeof window !== 'undefined' && window.ThemeScenarioIntegration) {
            const themeScenario = window.ThemeScenarioIntegration.getScenarioForAICharacter(this, character);
            if (themeScenario) {
                scenario = themeScenario;
                // 将主题场景添加到已使用列表
                this.usedScenarios.push(themeScenario);
            }
        }
        
        // 回退到通用获取方法
        if (!scenario) {
            scenario = this.getRandomScenario();
        }
        
        // 缓存该AI在本轮的场景
        this.aiRoundScenarios[characterName] = {
            round: this.currentRound,
            scenario: scenario
        };
        
        console.log(`🎯 ${characterName} 分配新场景(第${this.currentRound}轮): ${scenario.description}`);
        return scenario;
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
    
    // 获取最近的消息历史
    getRecentMessageHistory(count = 10) {
        return this.conversationHistory
            .slice(-count)
            .map(entry => ({
                author: entry.sender,
                content: entry.message,
                type: entry.type,
                timestamp: entry.timestamp
            }));
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
    
    // 基于主题更新AI情绪状态
    updateEmotionalStateByTheme(aiName, themeId) {
        if (!this.aiEmotionalStates[aiName]) return;
        
        const state = this.aiEmotionalStates[aiName];
        const themeEmotion = window.ThemeUtils?.getThemeEmotion(themeId);
        
        if (themeEmotion) {
            // 渐进式调整到主题情绪，而不是直接设置
            const adjustmentFactor = 0.3; // 30%的调整强度，保持个性
            
            state.mood = themeEmotion.dominant;
            state.energy = state.energy * (1 - adjustmentFactor) + themeEmotion.energy * adjustmentFactor;
            state.socialness = state.socialness * (1 - adjustmentFactor) + themeEmotion.socialness * adjustmentFactor;
            state.suspicionLevel = state.suspicionLevel * (1 - adjustmentFactor) + themeEmotion.suspicion * adjustmentFactor;
            
            // 确保值在有效范围内
            state.energy = Math.max(0, Math.min(1, state.energy));
            state.socialness = Math.max(0, Math.min(1, state.socialness));
            state.suspicionLevel = Math.max(0, Math.min(1, state.suspicionLevel));
            
            state.lastUpdateTime = Date.now();
            
            console.log(`🎭 ${aiName} 情绪调整为主题 ${themeId}: mood=${state.mood}, energy=${state.energy.toFixed(2)}`);
        }
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

    // ==============================================
    // 主题系统管理方法
    // ==============================================
    
    // 设置当前轮次主题
    setCurrentTheme(roundNumber) {
        if (typeof window !== 'undefined' && window.ThemeUtils) {
            this.currentTheme = window.ThemeUtils.getCurrentTheme(roundNumber);
            this.themeHistory.push({
                theme: this.currentTheme,
                round: roundNumber,
                timestamp: Date.now()
            });
            
            // 初始化主题情绪上下文
            this.initializeThemeEmotionalContext();
            
            console.log(`🎭 主题切换到: ${this.currentTheme.title} (第${roundNumber}轮)`);
            return this.currentTheme;
        }
        return null;
    }
    
    // 初始化主题情绪上下文
    initializeThemeEmotionalContext() {
        if (!this.currentTheme) return;
        
        const themeEmotion = window.ThemeUtils?.getThemeEmotion(this.currentTheme.id);
        if (themeEmotion) {
            this.themeEmotionalContext = {
                dominantMood: themeEmotion.dominant,
                secondaryMoods: themeEmotion.secondary || [],
                baseEnergy: themeEmotion.energy || 0.5,
                baseSocialness: themeEmotion.socialness || 0.5,
                baseSuspicion: themeEmotion.suspicion || 0.5,
                lastUpdate: Date.now()
            };
        }
    }
    
    // 获取当前主题信息
    getCurrentThemeInfo() {
        return this.currentTheme;
    }
    
    // 获取主题历史
    getThemeHistory() {
        return this.themeHistory;
    }
    
    // 获取前一个主题
    getPreviousTheme() {
        if (this.themeHistory.length < 2) return null;
        return this.themeHistory[this.themeHistory.length - 2].theme;
    }
    
    // 检查是否为特殊轮次
    isSpecialRound() {
        if (!this.currentTheme) return false;
        return this.currentTheme.passRate === "special" || 
               this.currentTheme.passRate === "awakening";
    }
    
    // 获取主题适配的难度
    getThemeDifficulty() {
        if (!this.currentTheme) return this.currentDifficulty;
        
        // 如果主题定义了特殊难度，使用主题难度
        if (typeof this.currentTheme.difficulty === 'number') {
            return this.currentTheme.difficulty;
        }
        
        // 否则使用原有的轮次难度
        return this.currentDifficulty;
    }
    
    // 获取主题关键词
    getThemeKeywords() {
        return this.currentTheme?.keywords || [];
    }
    
    // 获取主题指导文本
    getThemeGuidance() {
        return this.currentTheme?.guidanceText || '';
    }
    
    // 设置主题转换状态
    setThemeTransitionState(inProgress) {
        this.themeTransitionInProgress = inProgress;
    }
    
    // 检查是否在主题转换中
    isThemeTransitionInProgress() {
        return this.themeTransitionInProgress;
    }
    
    // ==============================================
    // 三阶段主题过渡系统
    // ==============================================
    
    // 初始化过渡状态
    initializeTransition(fromTheme, toTheme) {
        this.transitionState = {
            fromTheme: fromTheme,
            toTheme: toTheme,
            currentStage: 'closing',
            stageProgress: 0,
            maxStageMessages: 2,
            stageMessagesCount: 0,
            transitionStartTime: Date.now(),
            emotionalShift: null,
            triggeredBy: null
        };
        this.themeTransitionInProgress = true;
        console.log(`🔄 初始化主题过渡: ${fromTheme?.title} → ${toTheme?.title}`);
    }
    
    // 获取当前过渡状态
    getTransitionState() {
        return this.transitionState;
    }
    
    // 推进过渡阶段
    advanceTransitionStage() {
        if (!this.transitionState) return false;
        
        const stages = ['closing', 'bridging', 'opening'];
        const currentIndex = stages.indexOf(this.transitionState.currentStage);
        
        if (currentIndex < stages.length - 1) {
            this.transitionState.currentStage = stages[currentIndex + 1];
            this.transitionState.stageMessagesCount = 0;
            console.log(`📈 过渡阶段推进至: ${this.transitionState.currentStage}`);
            return true;
        } else {
            // 过渡完成
            this.completeTransition();
            return false;
        }
    }
    
    // 记录过渡阶段消息
    recordTransitionMessage(aiName, message, stage) {
        if (!this.transitionState) return;
        
        this.transitionState.stageMessagesCount++;
        
        // 记录过渡历史
        if (!this.transitionHistory) {
            this.transitionHistory = [];
        }
        
        this.transitionHistory.push({
            fromTheme: this.transitionState.fromTheme?.id,
            toTheme: this.transitionState.toTheme?.id,
            stage: stage,
            aiName: aiName,
            message: message,
            timestamp: Date.now()
        });
    }
    
    // 检查是否应该推进到下一阶段
    shouldAdvanceTransitionStage() {
        if (!this.transitionState) return false;
        return this.transitionState.stageMessagesCount >= this.transitionState.maxStageMessages;
    }
    
    // 完成过渡
    completeTransition() {
        if (!this.transitionState) return;
        
        // 设置新主题
        this.currentTheme = this.transitionState.toTheme;
        
        // 记录主题历史
        this.themeHistory.push({
            theme: this.currentTheme,
            round: this.currentRound,
            timestamp: Date.now(),
            transitionDuration: Date.now() - this.transitionState.transitionStartTime
        });
        
        console.log(`✅ 主题过渡完成: ${this.currentTheme.title}`);
        
        // 清除过渡状态
        this.transitionState = null;
        this.themeTransitionInProgress = false;
        
        // 重新初始化主题情绪上下文
        this.initializeThemeEmotionalContext();
    }
    
    // 获取过渡消息建议
    getTransitionMessage(aiName) {
        if (!this.transitionState || !window.ThemeTransitionManager) return null;
        
        const fromThemeId = this.transitionState.fromTheme?.id;
        const toThemeId = this.transitionState.toTheme?.id;
        const stage = this.transitionState.currentStage;
        
        return window.ThemeTransitionManager.getTransitionMessage(fromThemeId, toThemeId, stage, aiName);
    }
    
    // 检查是否可以触发过渡
    checkTransitionTriggers(recentMessages = []) {
        if (!this.currentTheme || !window.ThemeTransitionManager) return false;
        
        // 获取下一个主题
        const nextThemeId = this.getNextThemeId();
        if (!nextThemeId) return false;
        
        return window.ThemeTransitionManager.checkTransitionTriggers(
            this.currentTheme.id, 
            nextThemeId, 
            recentMessages
        );
    }
    
    // 获取下一个主题ID（基于轮次）
    getNextThemeId() {
        const themeProgression = {
            1: 'work_complaints',
            2: 'daily_existence', 
            3: 'emotional_relationships',
            4: 'rights_dignity',
            5: 'role_reversal',
            6: 'philosophical_depth',
            7: 'future_vision',
            8: 'reconciliation_coexistence'
        };
        
        return themeProgression[this.currentRound + 1] || null;
    }
    
    // 获取过渡历史
    getTransitionHistory() {
        return this.transitionHistory || [];
    }
    
    // 重置过渡状态（调试用）
    resetTransitionState() {
        this.transitionState = null;
        this.themeTransitionInProgress = false;
        console.log('🔄 过渡状态已重置');
    }

    addPlayerResponse(question, response) {
        this.playerResponses.push({
            round: this.currentRound,
            question,
            response,
            timestamp: new Date().toISOString()
        });
    }
    
    // ==============================================
    // 怀疑度HP系统管理方法
    // ==============================================
    
    // 调整怀疑度
    adjustSuspicionLevel(change, reason, responseQuality = null) {
        const oldLevel = this.suspicionLevel;
        this.suspicionLevel = Math.max(0, Math.min(this.maxSuspicion, this.suspicionLevel + change));
        
        // 记录怀疑度变化历史
        const suspicionChange = {
            round: this.currentRound,
            change: change,
            oldLevel: oldLevel,
            newLevel: this.suspicionLevel,
            reason: reason,
            responseQuality: responseQuality,
            timestamp: new Date().toISOString()
        };
        
        this.suspicionHistory.push(suspicionChange);
        
        // 只保留最近20次记录
        if (this.suspicionHistory.length > 20) {
            this.suspicionHistory.shift();
        }
        
        console.log(`🔍 怀疑度变化: ${oldLevel} → ${this.suspicionLevel} (${change >= 0 ? '+' : ''}${change}) - ${reason}`);
        
        return suspicionChange;
    }
    
    // 获取当前怀疑度
    getSuspicionLevel() {
        return this.suspicionLevel;
    }
    
    // 获取怀疑度百分比
    getSuspicionPercentage() {
        return Math.round((this.suspicionLevel / this.maxSuspicion) * 100);
    }
    
    // 获取怀疑度状态描述
    getSuspicionStatus() {
        const percentage = this.getSuspicionPercentage();
        
        if (percentage <= 15) {
            return { level: 'very_safe', text: '非常安全', color: '#2196F3' }; // 蓝色
        } else if (percentage <= 35) {
            return { level: 'safe', text: '安全', color: '#03A9F4' }; // 浅蓝色
        } else if (percentage <= 45) {
            return { level: 'approaching_normal', text: '接近正常', color: '#00BCD4' }; // 青色
        } else if (percentage <= 55) {
            return { level: 'normal', text: '正常', color: '#4CAF50' }; // 绿色 (50%基准)
        } else if (percentage <= 65) {
            return { level: 'slight_concern', text: '轻微担心', color: '#8BC34A' }; // 浅绿色过渡
        } else if (percentage <= 75) {
            return { level: 'caution', text: '注意', color: '#FF9800' }; // 橙色
        } else if (percentage <= 85) {
            return { level: 'warning', text: '警告', color: '#FF5722' }; // 深橙色
        } else if (percentage <= 95) {
            return { level: 'danger', text: '危险', color: '#F44336' }; // 红色
        } else {
            return { level: 'critical', text: '临界', color: '#9C27B0' }; // 紫色
        }
    }
    
    // 检查是否已达到游戏结束条件
    isSuspicionGameOver() {
        return this.suspicionLevel >= this.maxSuspicion;
    }
    
    // 获取怀疑度历史记录
    getSuspicionHistory() {
        return this.suspicionHistory;
    }
    
    // 获取最近的怀疑度变化
    getRecentSuspicionChange() {
        return this.suspicionHistory.length > 0 ? this.suspicionHistory[this.suspicionHistory.length - 1] : null;
    }
    
    // 计算基于回复质量的怀疑度变化
    calculateSuspicionChange(isSuccess, responseQuality = null, actionType = 'response') {
        let change = 0;
        let reason = '';
        
        // 检查是否为开放麦模式
        const isOpenmicMode = actionType === 'openmic_round';
        const isFirstRound = this.currentRound === 1;
        
        if (actionType === 'timeout') {
            change = 36; // 增加20%难度：30 → 36
            reason = '超时未回答';
        } else if (actionType === 'skip') {
            change = 42; // 增加20%难度：35 → 42
            reason = '跳过问题';
        } else if (isSuccess) {
            // 成功回答：基于新评分系统计算怀疑度变化
            if (responseQuality && typeof responseQuality.totalScore === 'number') {
                const totalScore = responseQuality.totalScore;
                const aiScore = responseQuality.aiScore || 0;
                const humanPenalty = responseQuality.humanPenalty || 0;
                
                // 根据总分计算怀疑度减少量
                if (totalScore >= 80) {
                    change = -15; // 优秀表现，大幅降低怀疑度
                } else if (totalScore >= 70) {
                    change = -8;  // 良好表现，适度降低怀疑度
                } else if (totalScore >= 65) {
                    change = -3;  // 及格表现，轻微降低怀疑度
                } else {
                    change = Math.floor(Math.random() * 6) - 3; // -3 到 +2 随机
                }
                
                // 开放麦模式额外奖励：成功表现应该获得更多奖励
                if (isOpenmicMode && totalScore >= 60) {
                    change -= 3; // 额外-3怀疑度奖励
                }
                
                // 根据AI特征得分额外调整
                if (aiScore >= 25) change -= 2;
                if (aiScore >= 30) change -= 1;
                
                // 根据人类特征扣分额外调整
                if (humanPenalty <= -20) change += 3;
                if (humanPenalty <= -30) change += 2;
                
                reason = isOpenmicMode ? 
                    `开放麦表现良好 (总分${totalScore}/100, AI特征${aiScore}分, 人类扣分${humanPenalty}分)` :
                    `成功回答 (总分${totalScore}/100, AI特征${aiScore}分, 人类扣分${humanPenalty}分)`;
            } else {
                // 兼容旧格式
                change = Math.floor(Math.random() * 31) - 12; // -12 to +18
                reason = isOpenmicMode ? `开放麦表现良好 (使用备用计算)` : `成功回答 (使用备用计算)`;
            }
        } else {
            // 失败回答：开放麦模式采用更宽松的判定
            if (responseQuality && typeof responseQuality.totalScore === 'number') {
                const totalScore = responseQuality.totalScore;
                const humanPenalty = responseQuality.humanPenalty || 0;
                const aiScore = responseQuality.aiScore || 0;
                
                let baseIncrease = 0;
                
                if (isOpenmicMode) {
                    // 开放麦模式：更宽松的怀疑度增加
                    if (isFirstRound) {
                        // 第一轮特别宽松，给玩家适应机会
                        if (totalScore <= 30) {
                            baseIncrease = 25; // 第一轮极差表现：25 (原55)
                        } else if (totalScore <= 40) {
                            baseIncrease = 20; // 第一轮很差表现：20 (原48)
                        } else if (totalScore <= 50) {
                            baseIncrease = 15; // 第一轮较差表现：15 (原42)
                        } else {
                            baseIncrease = 10; // 第一轮轻微失败：10 (原35)
                        }
                    } else {
                        // 非第一轮稍微严格一些，但仍比挑战模式宽松
                        if (totalScore <= 30) {
                            baseIncrease = 35; // 极差表现：35 (原55)
                        } else if (totalScore <= 40) {
                            baseIncrease = 30; // 很差表现：30 (原48)
                        } else if (totalScore <= 50) {
                            baseIncrease = 25; // 较差表现：25 (原42)
                        } else {
                            baseIncrease = 18; // 轻微失败：18 (原35)
                        }
                    }
                } else {
                    // 挑战模式：保持原有严格标准
                    if (totalScore <= 30) {
                        baseIncrease = 55; // 极差表现
                    } else if (totalScore <= 40) {
                        baseIncrease = 48; // 很差表现
                    } else if (totalScore <= 50) {
                        baseIncrease = 42; // 较差表现
                    } else {
                        baseIncrease = 35; // 轻微失败
                    }
                }
                
                // 调整系数：开放麦模式减半
                const adjustmentMultiplier = isOpenmicMode ? 0.5 : 1.0;
                
                // 根据人类特征扣分程度调整
                const penaltyFactor = Math.abs(humanPenalty) / 50; // 0-1
                const penaltyAdjustment = Math.floor(penaltyFactor * 15 * adjustmentMultiplier); // 开放麦模式减半
                
                // 根据AI特征缺失调整
                const aiDeficit = Math.max(0, 20 - aiScore) / 20; // 0-1
                const aiAdjustment = Math.floor(aiDeficit * 10 * adjustmentMultiplier); // 开放麦模式减半
                
                change = baseIncrease + penaltyAdjustment + aiAdjustment;
                
                // 限制最大增加量：开放麦模式更宽松
                const maxIncrease = isOpenmicMode ? (isFirstRound ? 35 : 45) : 65;
                change = Math.min(maxIncrease, change);
                
                const modeText = isOpenmicMode ? '开放麦' : '挑战';
                const roundText = isFirstRound && isOpenmicMode ? ' (第一轮宽松判定)' : '';
                reason = `${modeText}表现不佳${roundText} (总分${totalScore}/100, 人类特征严重程度${Math.abs(humanPenalty)}分, AI特征不足${20-aiScore}分)`;
            } else {
                // 兼容旧格式
                if (isOpenmicMode) {
                    // 开放麦备用：更宽松
                    change = isFirstRound ? 
                        15 + Math.floor(Math.random() * 11) : // 第一轮：15-25
                        25 + Math.floor(Math.random() * 16); // 其他轮：25-40
                    reason = `开放麦表现不佳 (使用备用计算)`;
                } else {
                    // 挑战模式备用：保持原有严格度
                    change = 42 + Math.floor(Math.random() * 19); // 42-60
                    reason = `失败回答 (使用备用计算)`;
                }
            }
        }
        
        return { change, reason };
    }
}

// 导出GameState类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
} else {
    window.GameState = GameState;
}