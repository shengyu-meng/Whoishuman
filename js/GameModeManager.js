// 游戏模式管理器
class GameModeManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameState = gameController.gameState;
        this.currentMode = 'challenge';
        
        // 模式特定的管理器
        this.challengeMode = new ChallengeMode(this);
        this.openmicMode = new OpenMicMode(this);
        this.werewolfMode = new WerewolfMode(this);
        
        console.log('🎮 游戏模式管理器初始化完成');
    }
    
    // 设置游戏模式
    setGameMode(mode) {
        if (!['challenge', 'openmic', 'werewolf'].includes(mode)) {
            console.error('❌ 无效的游戏模式:', mode);
            return false;
        }
        
        // 清理之前模式的UI元素
        this.cleanupModeUI();
        
        this.currentMode = mode;
        this.gameState.gameMode = mode;
        this.initializeModeSpecificLogic();
        
        console.log(`🎯 游戏模式设置为: ${mode}`);
        return true;
    }
    
    // 清理模式特定的UI元素
    cleanupModeUI() {
        // 清理主动发言按钮
        const voluntaryBtn = document.getElementById('voluntarySpeakBtn');
        if (voluntaryBtn) {
            voluntaryBtn.remove();
        }
        
        // 清理开放麦输入区域
        const openmicInputArea = document.getElementById('openmicInputArea');
        if (openmicInputArea) {
            openmicInputArea.remove();
        }
        
        // 清理投票界面
        const votingInterface = document.getElementById('votingInterface');
        if (votingInterface) {
            votingInterface.remove();
        }
    }
    
    // 获取当前模式
    getCurrentMode() {
        return this.currentMode;
    }
    
    // 获取模式描述
    getModeDescription(mode = null) {
        const targetMode = mode || this.currentMode;
        return this.gameState.gameModeConfig[targetMode]?.description || '';
    }
    
    // 初始化模式特定逻辑
    initializeModeSpecificLogic() {
        switch(this.currentMode) {
            case 'challenge':
                this.challengeMode.initialize();
                break;
            case 'openmic':
                this.openmicMode.initialize();
                break;
            case 'werewolf':
                this.werewolfMode.initialize();
                break;
        }
    }
    
    // 获取当前模式管理器
    getCurrentModeManager() {
        switch(this.currentMode) {
            case 'challenge':
                return this.challengeMode;
            case 'openmic':
                return this.openmicMode;
            case 'werewolf':
                return this.werewolfMode;
            default:
                return this.challengeMode;
        }
    }
    
    // 处理轮次开始
    handleRoundStart() {
        const modeManager = this.getCurrentModeManager();
        if (modeManager && typeof modeManager.handleRoundStart === 'function') {
            return modeManager.handleRoundStart();
        }
        return true;
    }
    
    // 处理轮次结束
    handleRoundEnd() {
        const modeManager = this.getCurrentModeManager();
        if (modeManager && typeof modeManager.handleRoundEnd === 'function') {
            return modeManager.handleRoundEnd();
        }
        return true;
    }
    
    // 处理玩家回应
    handlePlayerResponse(response) {
        const modeManager = this.getCurrentModeManager();
        if (modeManager && typeof modeManager.handlePlayerResponse === 'function') {
            return modeManager.handlePlayerResponse(response);
        }
        return true;
    }
    
    // 检查是否可以进入下一轮
    canAdvanceToNextRound() {
        const modeManager = this.getCurrentModeManager();
        if (modeManager && typeof modeManager.canAdvanceToNextRound === 'function') {
            return modeManager.canAdvanceToNextRound();
        }
        return true;
    }
    
    // 获取模式特定的UI元素
    getModeSpecificUI() {
        const modeManager = this.getCurrentModeManager();
        if (modeManager && typeof modeManager.getModeSpecificUI === 'function') {
            return modeManager.getModeSpecificUI();
        }
        return null;
    }
    
    // 检查游戏结束条件
    checkGameEndCondition() {
        const modeManager = this.getCurrentModeManager();
        if (modeManager && typeof modeManager.checkGameEndCondition === 'function') {
            return modeManager.checkGameEndCondition();
        }
        return false;
    }
    
    // 重置模式状态
    resetModeState() {
        this.challengeMode.reset();
        this.openmicMode.reset();
        this.werewolfMode.reset();
        
        // 重置游戏状态中的模式配置
        this.gameState.gameModeConfig.openmic.speakingTurns = 0;
        this.gameState.gameModeConfig.openmic.roundSpeakingComplete = false;
        this.gameState.gameModeConfig.werewolf.alivePlayers = [];
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.eliminatedPlayers = [];
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
        
        console.log('🔄 所有游戏模式状态已重置');
    }
}

// 基础模式类
class BaseGameMode {
    constructor(gameModeManager) {
        this.gameModeManager = gameModeManager;
        this.gameController = gameModeManager.gameController;
        this.gameState = gameModeManager.gameState;
    }
    
    initialize() {
        // 子类实现
    }
    
    reset() {
        // 子类实现
    }
    
    handleRoundStart() {
        return true;
    }
    
    handleRoundEnd() {
        return true;
    }
    
    handlePlayerResponse(response) {
        return true;
    }
    
    canAdvanceToNextRound() {
        return true;
    }
    
    getModeSpecificUI() {
        return null;
    }
    
    checkGameEndCondition() {
        return false;
    }
}

// 闯关模式实现
class ChallengeMode extends BaseGameMode {
    initialize() {
        console.log('🎯 闯关模式初始化');
        // 闯关模式使用现有的游戏逻辑，无需特殊初始化
    }
    
    reset() {
        // 闯关模式无特殊状态需要重置
    }
    
    handleRoundStart() {
        // 闯关模式：AI主动质疑，玩家被动回应
        return true;
    }
    
    handleRoundEnd() {
        // 闯关模式：检查怀疑度，决定是否继续
        return !this.gameState.isSuspicionGameOver();
    }
    
    checkGameEndCondition() {
        // 闯关模式：怀疑度达到100%时游戏结束
        return this.gameState.isSuspicionGameOver();
    }
}

// 开放麦模式实现
class OpenMicMode extends BaseGameMode {
    initialize() {
        console.log('🎤 开放麦模式初始化');
        this.resetRoundState();
    }
    
    reset() {
        this.resetRoundState();
    }
    
    resetRoundState() {
        const config = this.gameState.gameModeConfig.openmic;
        config.playerSpeakingTurns = 0;
        config.totalSpeakingTurns = 0;
        config.roundStartTime = Date.now();
        config.roundSpeakingComplete = false;
        config.playerMessages = [];
        config.hasPlayerSpoken = false;
        config.aiReactionsPending = false;
        config.forcedCueCount = 0; // 强制cue次数
        config.lastForcedCueTime = null; // 最后一次强制cue时间
        config.roundEndCheckInProgress = false; // 防止重复检查轮次结束
    }
    
    handleRoundStart() {
        // 重置本轮状态
        this.resetRoundState();
        
        // 显示持续的输入框
        this.showPersistentInputArea();
        
        // 开始轮次计时器
        this.startRoundTimer();
        
        console.log('🎤 开放麦轮次开始，等待玩家或AI发言');
        return true;
    }
    
    startRoundTimer() {
        // 清除之前的计时器
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
        }
        
        // 设置2分钟计时器
        this.roundTimer = setTimeout(() => {
            this.checkRoundEndConditions('timeout');
        }, this.gameState.gameModeConfig.openmic.roundDuration);
    }
    
    handlePlayerResponse(response) {
        const config = this.gameState.gameModeConfig.openmic;
        
        // 记录玩家发言
        config.playerSpeakingTurns++;
        config.totalSpeakingTurns++;
        config.hasPlayerSpoken = true;
        
        // 重置强制cue计数器，因为玩家已经回应了
        config.forcedCueCount = 0;
        
        // 保存玩家本轮的发言
        config.playerMessages.push({
            message: response,
            timestamp: Date.now(),
            context: this.getRecentContext()
        });
        
        console.log(`🎤 玩家发言记录: ${config.playerSpeakingTurns}次, 总发言: ${config.totalSpeakingTurns}次`);
        
        // 检查轮次结束条件
        this.checkRoundEndConditions('player_speak');
        
        return true;
    }
    
    handleAIResponse(aiName, response) {
        const config = this.gameState.gameModeConfig.openmic;
        config.totalSpeakingTurns++;
        
        console.log(`🎤 AI发言记录 (${aiName}): 总发言 ${config.totalSpeakingTurns}次`);
        
        // 检查轮次结束条件
        this.checkRoundEndConditions('ai_speak');
    }
    
    getRecentContext() {
        // 获取最近的对话上下文
        return this.gameState.getRecentMessageHistory(5);
    }
    
    handleRoundEnd() {
        // 开放麦模式的轮次结束由条件触发，不需要额外检查
        return this.gameState.gameModeConfig.openmic.roundSpeakingComplete;
    }
    
    canAdvanceToNextRound() {
        return this.gameState.gameModeConfig.openmic.roundSpeakingComplete;
    }
    
    checkRoundEndConditions(trigger) {
        const config = this.gameState.gameModeConfig.openmic;
        
        // 防止重复检查
        if (config.roundEndCheckInProgress) {
            console.log('🎤 轮次结束检查正在进行中，跳过重复检查');
            return false;
        }
        
        const currentTime = Date.now();
        const roundDuration = currentTime - config.roundStartTime;
        
        // 检查三个结束条件
        const maxSpeaksReached = config.totalSpeakingTurns >= config.maxSpeaksPerRound; // 8次发言
        const timeoutReached = roundDuration >= config.roundDuration; // 120秒
        const playerSpeakTwice = config.playerSpeakingTurns >= 2; // 玩家发言2次
        
        console.log(`🎤 检查结束条件: 发言${config.totalSpeakingTurns}/${config.maxSpeaksPerRound}次, 时长${Math.round(roundDuration/1000)}/120秒, 玩家发言${config.playerSpeakingTurns}/2次`);
        
        // 如果玩家发言了，检查是否满足结束条件
        if (config.hasPlayerSpoken) {
            if (maxSpeaksReached || timeoutReached || playerSpeakTwice || trigger === 'timeout') {
                const endReason = maxSpeaksReached ? '达到最大发言次数' : 
                                 timeoutReached ? '达到时间限制' : 
                                 playerSpeakTwice ? '玩家发言达到2次' : '超时';
                console.log(`🎤 轮次结束: ${endReason}`);
                
                // 设置检查进行中标志
                config.roundEndCheckInProgress = true;
                this.endRound();
                return true;
            }
        } else {
            // 如果玩家没有发言，但达到讨论次数或时间限制，处理强制cue逻辑
            if (maxSpeaksReached || timeoutReached || trigger === 'timeout') {
                // 如果已经强制cue过了，就停止检查，一直等待玩家回应
                if (config.forcedCueCount > 0) {
                    console.log('🎤 已经cue过玩家，停止重复检查，等待回应...');
                    return false; // 不继续检查，等待玩家回应
                }
                return this.handlePlayerSilenceCondition();
            }
        }
        
        return false;
    }
    
    async endRound() {
        const config = this.gameState.gameModeConfig.openmic;
        config.roundSpeakingComplete = true;
        
        // 清除计时器
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
        
        console.log('🎤 开放麦轮次结束，开始分析玩家表现');
        
        // 分析玩家本轮的所有发言
        await this.analyzePlayerRoundPerformance();
        
        // 重置检查标志
        config.roundEndCheckInProgress = false;
    }
    
    async analyzePlayerRoundPerformance() {
        const config = this.gameState.gameModeConfig.openmic;
        
        if (config.playerMessages.length === 0) {
            console.log('🎤 玩家本轮无发言，跳过分析');
            return;
        }
        
        // 通知GameController进行分析
        if (this.gameController && typeof this.gameController.analyzeOpenmicRoundPerformance === 'function') {
            await this.gameController.analyzeOpenmicRoundPerformance(config.playerMessages);
        }
    }
    
    getModeSpecificUI() {
        const config = this.gameState.gameModeConfig.openmic;
        const remainingTime = config.roundStartTime ? 
            Math.max(0, config.roundDuration - (Date.now() - config.roundStartTime)) : 0;
            
        return {
            persistentInputArea: true,
            playerSpeaks: config.playerSpeakingTurns,
            totalSpeaks: config.totalSpeakingTurns,
            maxSpeaks: config.maxSpeaksPerRound,
            remainingTime: Math.ceil(remainingTime / 1000),
            hasPlayerSpoken: config.hasPlayerSpoken
        };
    }
    
    showPersistentInputArea() {
        // 显示持续的输入区域在页面底部
        const gameInterface = document.getElementById('gameInterface');
        if (gameInterface && !document.getElementById('openmicInputArea')) {
            const inputArea = document.createElement('div');
            inputArea.id = 'openmicInputArea';
            inputArea.className = 'openmic-input-area';
            inputArea.innerHTML = `
                <div class="openmic-input-container">
                    <textarea id="openmicInput" placeholder="在开放麦模式中，你可以随时发言参与讨论..." maxlength="500"></textarea>
                    <div class="openmic-input-footer">
                        <div class="char-count">
                            <span id="openmicCharCount">0</span>/500
                        </div>
                        <button id="openmicSendBtn" class="openmic-send-btn" disabled>发送</button>
                    </div>
                </div>
            `;
            
            // 添加到游戏界面底部
            gameInterface.appendChild(inputArea);
            
            // 绑定事件监听器
            this.setupOpenmicInputListeners();
            
            console.log('🎤 开放麦输入区域已显示');
        }
    }
    
    setupOpenmicInputListeners() {
        const input = document.getElementById('openmicInput');
        const sendBtn = document.getElementById('openmicSendBtn');
        const charCount = document.getElementById('openmicCharCount');
        
        if (input && sendBtn && charCount) {
            // 字符计数
            input.addEventListener('input', () => {
                const length = input.value.length;
                charCount.textContent = length;
                sendBtn.disabled = length < 5; // 至少5个字符才能发送
            });
            
            // 发送按钮点击
            sendBtn.addEventListener('click', () => {
                this.handleOpenmicSend();
            });
            
            // 回车发送（Ctrl+Enter或Shift+Enter换行）
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (!sendBtn.disabled) {
                        this.handleOpenmicSend();
                    }
                }
            });
        }
    }
    
    handleOpenmicSend() {
        const input = document.getElementById('openmicInput');
        const sendBtn = document.getElementById('openmicSendBtn');
        
        if (input && sendBtn) {
            const message = input.value.trim();
            if (message.length >= 5) {
                // 清空输入框
                input.value = '';
                document.getElementById('openmicCharCount').textContent = '0';
                sendBtn.disabled = true;
                
                // 触发发言处理
                if (this.gameController && typeof this.gameController.handleOpenmicMessage === 'function') {
                    this.gameController.handleOpenmicMessage(message);
                }
            }
        }
    }
    
    hideOpenmicInputArea() {
        const inputArea = document.getElementById('openmicInputArea');
        if (inputArea) {
            inputArea.remove();
        }
    }
    
    triggerVoluntarySpeak() {
        // 触发主动发言逻辑
        if (this.gameController && typeof this.gameController.handleVoluntarySpeak === 'function') {
            this.gameController.handleVoluntarySpeak();
        }
    }
    
    forcePlayerSpeak() {
        // 强制玩家发言的逻辑
        console.log('🎤 强制玩家发言 - 未达到最少发言要求');
        // 这里可以显示特殊的提示，要求玩家必须发言
    }
    
    // 处理玩家沉默条件
    handlePlayerSilenceCondition() {
        const config = this.gameState.gameModeConfig.openmic;
        
        // 如果已经cue过了，就一直等待，不再继续流程
        if (config.forcedCueCount > 0) {
            console.log('🎤 已经cue过玩家，等待回应中...');
            return false; // 不结束轮次，继续等待
        }
        
        // 第一次触发cue
        console.log('🎤 触发强制cue，等待玩家回应');
        this.triggerForcedPlayerCue();
        return false; // 不结束轮次，等待玩家回应
    }
    
    
    // 触发强制玩家cue（类似闯关模式）
    async triggerForcedPlayerCue() {
        const config = this.gameState.gameModeConfig.openmic;
        config.forcedCueCount++;
        
        console.log('🎤 触发强制玩家cue');
        
        // 停止当前的AI对话生成
        if (this.gameController) {
            this.gameController.isGeneratingConversation = false;
        }
        
        // 选择一个AI来强制提问玩家
        const questionAI = this.gameState.activeAICharacters[
            Math.floor(Math.random() * this.gameState.activeAICharacters.length)
        ];
        
        console.log(`🎯 选择 ${questionAI.name} 进行强制提问`);
        
        // 生成强制提问
        try {
            await this.generateForcedQuestion(questionAI);
        } catch (error) {
            console.error('❌ 强制提问生成失败:', error);
            // 使用备用提问
            this.showFallbackForcedQuestion(questionAI);
        }
    }
    
    // 生成强制提问
    async generateForcedQuestion(questionAI) {
        const recentMessages = this.gameState.getRecentMessageHistory(5);
        const conversationContext = recentMessages.map(msg => `${msg.author}: ${msg.content}`).join('\n');
        
        const messages = [
            {
                role: "system",
                content: `你是${questionAI.name}，性格特点：${questionAI.personality}。你正在开放麦模式的群聊中，注意到${this.gameState.playerName}一直没有发言。作为AI，你需要主动询问他的想法。`
            },
            {
                role: "user", 
                content: `你是${questionAI.name}，个性：${questionAI.personality}。

在开放麦讨论中，大家都在积极交流，但是${this.gameState.playerName}一直没有发言。作为一个关心群体氛围的AI，你想要邀请他参与讨论。

最近的对话：
${conversationContext}

请用你的说话风格(${questionAI.speakingStyle})主动询问${this.gameState.playerName}的想法，让他参与到讨论中来。

要求：
1. 问题必须@${this.gameState.playerName}
2. 语气友好，邀请性质，不要太强势
3. 可以基于最近的讨论内容提问
4. 体现你的个性特点
5. 长度在30-80字之间

直接返回你的发言内容。`
            }
        ];
        
        // 为强制提问设置适中的长度
        const response = await this.gameController.callAI(messages, {
            maxTokens: 120, // 提问应该简洁明了
            temperature: 0.7
        });
        
        if (response && response.trim()) {
            this.showForcedQuestion(questionAI, response.trim());
        } else {
            this.showFallbackForcedQuestion(questionAI);
        }
    }
    
    // 显示强制提问
    showForcedQuestion(questionAI, question) {
        const config = this.gameState.gameModeConfig.openmic;
        
        // 添加AI消息（向玩家询问不需要引用）
        this.gameController.addAIMessage(questionAI, question);
        this.gameState.addMessageToHistory(questionAI.name, question, 'ai');
        
        // 显示系统消息
        setTimeout(() => {
            const systemMessage = 'AI注意到你还没有发言，主动询问你的想法！请在开放麦输入框中回复。';
            
            this.gameController.addSystemMessage(systemMessage);
            
            // 开放麦模式不需要显示额外的问题区域，使用现有的输入框即可
            // 确保传统回复区域保持隐藏状态
            const responseArea = document.getElementById('responseArea');
            if (responseArea) {
                responseArea.classList.add('hidden');
            }
            
            // 只设置当前问题信息，不设置waitingForResponse以避免触发传统问答界面
            this.gameState.currentQuestion = {
                character: questionAI,
                question: question,
                isVoluntary: false,
                isOpenmicCue: true // 标记为开放麦cue
            };
        }, 1000);
    }
    
    // 显示备用强制提问
    showFallbackForcedQuestion(questionAI) {
        const fallbackQuestions = [
            `@${this.gameState.playerName} 你怎么一直不说话呀？有什么想法分享一下吗？`,
            `@${this.gameState.playerName} 大家都在讨论，你也来说说你的看法吧！`,
            `@${this.gameState.playerName} 你对刚才的话题有什么想法吗？`,
            `@${this.gameState.playerName} 来来来，别光听着，也说两句呗！`
        ];
        
        const question = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        this.showForcedQuestion(questionAI, question);
    }
    
    checkGameEndCondition() {
        // 开放麦模式：同样使用怀疑度系统
        return this.gameState.isSuspicionGameOver();
    }
}

// 狼人杀模式实现
class WerewolfMode extends BaseGameMode {
    initialize() {
        console.log('🐺 狼人杀模式初始化');
        
        // 初始化存活玩家列表（包含所有AI + 玩家）
        const alivePlayers = [...this.gameState.allAICharacters.map(ai => ai.name)];
        alivePlayers.push(this.gameState.playerName);
        
        this.gameState.gameModeConfig.werewolf.alivePlayers = alivePlayers;
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.eliminatedPlayers = [];
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
        
        console.log('🐺 存活玩家:', alivePlayers);
    }
    
    reset() {
        this.gameState.gameModeConfig.werewolf.alivePlayers = [];
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.eliminatedPlayers = [];
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
    }
    
    handleRoundStart() {
        // 狼人杀模式：开始讨论阶段
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
        
        // AI们知道要找出人类
        return true;
    }
    
    handleRoundEnd() {
        // 进入投票阶段
        if (this.gameState.gameModeConfig.werewolf.discussionPhase) {
            this.startVotingPhase();
            return false; // 不立即进入下一轮，等待投票完成
        }
        
        // 投票阶段结束，处理投票结果
        if (this.gameState.gameModeConfig.werewolf.votingPhase) {
            return this.processVotingResults();
        }
        
        return true;
    }
    
    startVotingPhase() {
        console.log('🗳️ 进入投票阶段');
        this.gameState.gameModeConfig.werewolf.discussionPhase = false;
        this.gameState.gameModeConfig.werewolf.votingPhase = true;
        
        // 显示投票界面
        this.showVotingInterface();
    }
    
    showVotingInterface() {
        // 创建投票界面
        const votingInterface = document.createElement('div');
        votingInterface.id = 'votingInterface';
        votingInterface.className = 'voting-interface';
        votingInterface.innerHTML = `
            <h3>🗳️ 投票阶段</h3>
            <p>请选择你认为最可能是人类的角色：</p>
            <div class="vote-options">
                ${this.gameState.gameModeConfig.werewolf.alivePlayers
                    .filter(name => name !== this.gameState.playerName)
                    .map(name => `
                        <div class="vote-option" data-target="${name}">
                            <span class="vote-name">${name}</span>
                        </div>
                    `).join('')}
            </div>
            <button id="submitVoteBtn" class="primary-btn" disabled>提交投票</button>
        `;
        
        // 插入到游戏界面
        const gameInterface = document.getElementById('gameInterface');
        if (gameInterface) {
            gameInterface.appendChild(votingInterface);
            this.setupVotingEventListeners();
        }
    }
    
    setupVotingEventListeners() {
        const voteOptions = document.querySelectorAll('.vote-option');
        const submitBtn = document.getElementById('submitVoteBtn');
        let selectedTarget = null;
        
        voteOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 清除之前的选择
                voteOptions.forEach(opt => opt.classList.remove('selected'));
                
                // 选择当前选项
                option.classList.add('selected');
                selectedTarget = option.dataset.target;
                
                // 启用提交按钮
                if (submitBtn) {
                    submitBtn.disabled = false;
                }
            });
        });
        
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (selectedTarget) {
                    this.submitPlayerVote(selectedTarget);
                }
            });
        }
    }
    
    submitPlayerVote(target) {
        // 记录玩家投票
        this.gameState.gameModeConfig.werewolf.votingResults[this.gameState.playerName] = target;
        
        // 生成AI投票
        this.generateAIVotes();
        
        // 处理投票结果
        this.processVotingResults();
    }
    
    generateAIVotes() {
        const alivePlayers = this.gameState.gameModeConfig.werewolf.alivePlayers;
        const aiPlayers = alivePlayers.filter(name => name !== this.gameState.playerName);
        
        aiPlayers.forEach(aiName => {
            // AI随机投票，但更倾向于投给玩家
            const possibleTargets = alivePlayers.filter(name => name !== aiName);
            let target;
            
            // 70%概率投给玩家，30%概率投给其他AI
            if (Math.random() < 0.7 && possibleTargets.includes(this.gameState.playerName)) {
                target = this.gameState.playerName;
            } else {
                const otherTargets = possibleTargets.filter(name => name !== this.gameState.playerName);
                target = otherTargets[Math.floor(Math.random() * otherTargets.length)];
            }
            
            this.gameState.gameModeConfig.werewolf.votingResults[aiName] = target;
        });
        
        console.log('🗳️ 投票结果:', this.gameState.gameModeConfig.werewolf.votingResults);
    }
    
    processVotingResults() {
        const votingResults = this.gameState.gameModeConfig.werewolf.votingResults;
        
        // 统计票数
        const voteCount = {};
        Object.values(votingResults).forEach(target => {
            voteCount[target] = (voteCount[target] || 0) + 1;
        });
        
        // 找出得票最多的玩家
        let maxVotes = 0;
        let eliminatedPlayer = null;
        
        Object.entries(voteCount).forEach(([player, votes]) => {
            if (votes > maxVotes) {
                maxVotes = votes;
                eliminatedPlayer = player;
            }
        });
        
        console.log('🗳️ 票数统计:', voteCount);
        console.log('❌ 被淘汰的玩家:', eliminatedPlayer);
        
        // 淘汰玩家
        if (eliminatedPlayer) {
            this.eliminatePlayer(eliminatedPlayer);
        }
        
        // 检查游戏结束条件
        return !this.checkGameEndCondition();
    }
    
    eliminatePlayer(playerName) {
        // 从存活列表中移除
        const alivePlayers = this.gameState.gameModeConfig.werewolf.alivePlayers;
        const index = alivePlayers.indexOf(playerName);
        if (index > -1) {
            alivePlayers.splice(index, 1);
            this.gameState.gameModeConfig.werewolf.eliminatedPlayers.push(playerName);
        }
        
        console.log(`❌ ${playerName} 被淘汰`);
        console.log('🟢 剩余存活玩家:', alivePlayers);
        
        // 清理投票界面
        const votingInterface = document.getElementById('votingInterface');
        if (votingInterface) {
            votingInterface.remove();
        }
        
        // 重置投票状态
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = true;
    }
    
    canAdvanceToNextRound() {
        return this.gameState.gameModeConfig.werewolf.roundVotingComplete && 
               !this.checkGameEndCondition();
    }
    
    getModeSpecificUI() {
        const alivePlayers = this.gameState.gameModeConfig.werewolf.alivePlayers;
        return {
            alivePlayersCount: alivePlayers.length,
            alivePlayers: alivePlayers,
            eliminatedPlayers: this.gameState.gameModeConfig.werewolf.eliminatedPlayers,
            votingPhase: this.gameState.gameModeConfig.werewolf.votingPhase,
            discussionPhase: this.gameState.gameModeConfig.werewolf.discussionPhase
        };
    }
    
    checkGameEndCondition() {
        const alivePlayers = this.gameState.gameModeConfig.werewolf.alivePlayers;
        
        // 如果玩家被淘汰，游戏失败
        if (!alivePlayers.includes(this.gameState.playerName)) {
            console.log('💀 玩家被淘汰，游戏失败');
            return { gameOver: true, result: 'defeat', reason: 'player_eliminated' };
        }
        
        // 如果只剩玩家+1个AI，游戏胜利
        if (alivePlayers.length <= 2 && alivePlayers.includes(this.gameState.playerName)) {
            console.log('🎉 只剩玩家和1个AI，游戏胜利');
            return { gameOver: true, result: 'victory', reason: 'last_survivor' };
        }
        
        return false;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameModeManager, BaseGameMode, ChallengeMode, OpenMicMode, WerewolfMode };
} else {
    window.GameModeManager = GameModeManager;
    window.BaseGameMode = BaseGameMode;
    window.ChallengeMode = ChallengeMode;
    window.OpenMicMode = OpenMicMode;
    window.WerewolfMode = WerewolfMode;
}