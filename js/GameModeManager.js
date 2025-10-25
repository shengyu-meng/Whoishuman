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
        const votingInterface = document.getElementById('voteModal');
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
        this.gameState.gameModeConfig.werewolf.playerSpokenThisRound = false;
        this.gameState.gameModeConfig.werewolf.fixedParticipants = undefined;
        this.gameState.gameModeConfig.werewolf.votingHistory = [];
        this.gameState.gameModeConfig.werewolf.playerTotalVotes = 0;
        
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
            
            // 检查调试模式以决定按钮初始class
            const isDebugEnabled = window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled;
            const showSkip = isDebugEnabled && window.DEBUG_CONFIG.features?.showSkipButton;
            const showEnd = isDebugEnabled && window.DEBUG_CONFIG.features?.showEndGameButton;
            
            const skipBtnClass = showSkip ? 'debug-btn secondary-btn' : 'debug-btn secondary-btn hidden';
            const endBtnClass = showEnd ? 'debug-btn secondary-btn' : 'debug-btn secondary-btn hidden';
            
            inputArea.innerHTML = `
                <div class="openmic-input-container">
                    <textarea id="openmicInput" placeholder="在开放麦模式中，你可以随时发言参与讨论..." maxlength="500"></textarea>
                    <div class="openmic-input-footer">
                        <div class="char-count">
                            <span id="openmicCharCount">0</span>/500
                        </div>
                        <div class="input-buttons">
                            <button id="openmicSendBtn" class="openmic-send-btn" disabled>发送</button>
                            <button id="skipRoundBtn" class="${skipBtnClass}" onclick="console.log('直接onclick触发！'); window.gameController && window.gameController.skipCurrentRound();">跳过本轮</button>
                            <button id="endGameBtn" class="${endBtnClass}" onclick="console.log('结束游戏onclick触发！'); window.gameController && window.gameController.endGameManually();">结束游戏</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到游戏界面底部
            gameInterface.appendChild(inputArea);
            
            // 绑定事件监听器
            this.setupOpenmicInputListeners();
            
            console.log('🎤 开放麦输入区域已显示，调试按钮初始状态:', { showSkip, showEnd });
        }
    }
    
    setupOpenmicInputListeners() {
        const input = document.getElementById('openmicInput');
        const sendBtn = document.getElementById('openmicSendBtn');
        const charCount = document.getElementById('openmicCharCount');
        const skipBtn = document.getElementById('skipRoundBtn');
        const endGameBtn = document.getElementById('endGameBtn');
        
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
        
        // 绑定调试按钮事件
        console.log('🎤 开始绑定开放麦调试按钮事件...');
        if (skipBtn) {
            console.log('🎤 找到 skipRoundBtn，绑定点击事件');
            console.log('🎤 skipBtn当前状态:', {
                id: skipBtn.id,
                className: skipBtn.className,
                display: window.getComputedStyle(skipBtn).display,
                visibility: window.getComputedStyle(skipBtn).visibility,
                pointerEvents: window.getComputedStyle(skipBtn).pointerEvents
            });
            skipBtn.addEventListener('click', (e) => {
                console.log('🐛 开放麦：skipRoundBtn 被点击！', e);
                console.log('🎤 点击时按钮状态:', {
                    className: skipBtn.className,
                    display: window.getComputedStyle(skipBtn).display
                });
                if (this.gameController && typeof this.gameController.skipCurrentRound === 'function') {
                    console.log('🐛 开放麦：调用 gameController.skipCurrentRound()');
                    this.gameController.skipCurrentRound();
                } else {
                    console.error('❌ gameController.skipCurrentRound 不存在', this.gameController);
                }
            }, true); // 使用捕获阶段
            console.log('✅ 开放麦：skipRoundBtn 事件已绑定');
        } else {
            console.warn('⚠️ 开放麦：skipRoundBtn 未找到');
        }
        
        if (endGameBtn) {
            console.log('🎤 找到 endGameBtn，绑定点击事件');
            endGameBtn.addEventListener('click', () => {
                console.log('🐛 开放麦：endGameBtn 被点击！');
                if (this.gameController && typeof this.gameController.endGameManually === 'function') {
                    console.log('🐛 开放麦：调用 gameController.endGameManually()');
                    this.gameController.endGameManually();
                } else {
                    console.error('❌ gameController.endGameManually 不存在', this.gameController);
                }
            });
            console.log('✅ 开放麦：endGameBtn 事件已绑定');
        } else {
            console.warn('⚠️ 开放麦：endGameBtn 未找到');
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
        
        // 初始化基本配置
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.eliminatedPlayers = [];
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
        this.gameState.gameModeConfig.werewolf.playerSpokenThisRound = false;
        this.gameState.gameModeConfig.werewolf.allAISpoken = false;
        this.gameState.gameModeConfig.werewolf.votingHistory = []; // 保存每轮投票历史
        this.gameState.gameModeConfig.werewolf.playerTotalVotes = 0; // 玩家总得票数
        
        // 只在游戏开始后初始化存活玩家和固定参与者
        if (this.gameState.allAICharacters && this.gameState.allAICharacters.length > 0) {
            this.initializePlayersAndAIs();
        } else {
            console.log('⚠️ allAICharacters未初始化，将在游戏开始时初始化玩家列表');
        }
    }
    
    initializePlayersAndAIs() {
        // 初始化固定参与的AI（6个AI + 1个玩家 = 7人）
        const allAIs = this.gameState.allAICharacters || [];
        let fixedParticipants = this.gameState.gameModeConfig.werewolf.fixedParticipants;
        if (!fixedParticipants || fixedParticipants.length === 0) {
            if (allAIs.length > 0) {
                const shuffled = [...allAIs].sort(() => 0.5 - Math.random());
                // 固定选择6个AI参与，加上玩家总共7人
                fixedParticipants = shuffled.slice(0, Math.min(6, shuffled.length)).map(ai => ai.name);
                this.gameState.gameModeConfig.werewolf.fixedParticipants = fixedParticipants;
            } else {
                this.gameState.gameModeConfig.werewolf.fixedParticipants = [];
                fixedParticipants = [];
            }
        }
        
        // 初始化存活玩家列表（只包含固定参与的AI + 玩家）
        const alivePlayers = [...fixedParticipants];
        alivePlayers.push(this.gameState.playerName);
        this.gameState.gameModeConfig.werewolf.alivePlayers = alivePlayers;
        
        // 设置活跃AI角色为固定参与的AI
        this.gameState.activeAICharacters = allAIs.filter(ai => fixedParticipants.includes(ai.name));
        
        console.log('🐺 狼人杀游戏初始化：总共', alivePlayers.length, '人（6个AI + 1个玩家）');
        console.log('🐺 存活玩家:', alivePlayers);
        console.log('👥 固定参与AI:', fixedParticipants);
    }
    
    reset() {
        this.gameState.gameModeConfig.werewolf.alivePlayers = [];
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.eliminatedPlayers = [];
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
        this.gameState.gameModeConfig.werewolf.votingHistory = [];
        this.gameState.gameModeConfig.werewolf.playerTotalVotes = 0;
    }
    
    handleRoundStart() {
        // 首次进入轮次时，如果还没初始化玩家列表，现在初始化
        const werewolfConfig = this.gameState.gameModeConfig.werewolf;
        if (!werewolfConfig.alivePlayers || werewolfConfig.alivePlayers.length === 0 ||
            (werewolfConfig.alivePlayers.length === 1 && werewolfConfig.alivePlayers[0] === this.gameState.playerName)) {
            console.log('🐺 初始化玩家列表和固定参与AI');
            this.initializePlayersAndAIs();
        }
        
        // 重置轮次状态
        this.gameState.gameModeConfig.werewolf.discussionPhase = true;
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = false;
        this.gameState.gameModeConfig.werewolf.playerSpokenThisRound = false;
        this.gameState.gameModeConfig.werewolf.allAISpoken = false;
        
        let fixed = this.gameState.gameModeConfig.werewolf.fixedParticipants || [];
        const aliveSet = new Set(this.gameState.gameModeConfig.werewolf.alivePlayers);
        
        // 如果固定参与者为空或不足，重新选择（保持6个AI）
        if (!fixed || fixed.length === 0) {
            const candidates = this.gameState.allAICharacters.filter(ai => aliveSet.has(ai.name));
            if (candidates.length > 0) {
                const shuffled = [...candidates].sort(() => 0.5 - Math.random());
                fixed = shuffled.slice(0, Math.min(6, shuffled.length)).map(ai => ai.name);
                this.gameState.gameModeConfig.werewolf.fixedParticipants = fixed;
            }
        }
        
        // 更新活跃AI角色
        this.gameState.activeAICharacters = this.gameState.allAICharacters.filter(ai => 
            fixed.includes(ai.name) && aliveSet.has(ai.name)
        );
        
        // 显示持久的输入区域（类似开放麦模式）
        this.showWerewolfInputArea();
        
        console.log('🐺 轮次开始 - 存活玩家:', this.gameState.gameModeConfig.werewolf.alivePlayers);
        console.log('🐺 轮次开始 - 参与AI:', this.gameState.activeAICharacters.map(ai => ai.name));
        
        return true;
    }
    
    handlePlayerResponse(response) {
        const config = this.gameState.gameModeConfig.werewolf;
        
        // 记录玩家在讨论阶段发言
        if (config.discussionPhase) {
            config.playerSpokenThisRound = true;
            console.log('🐺 狼人杀模式：玩家在讨论阶段发言');
            
            // 触发AI判断并更新怀疑度
            // 使用与闯关模式相同的判断逻辑
            if (this.gameController && typeof this.gameController.judgePlayerResponse === 'function') {
                // 异步调用判断，但不阻塞玩家继续发言
                this.gameController.judgePlayerResponse(response).catch(error => {
                    console.error('❌ 狼人杀模式：AI判断失败', error);
                });
            }
        }
        
        return true;
    }
    
    async handleRoundEnd() {
        // 进入投票阶段
        if (this.gameState.gameModeConfig.werewolf.discussionPhase) {
            this.startVotingPhase();
            return false;
        }
        
        // 投票阶段结束，处理投票结果
        if (this.gameState.gameModeConfig.werewolf.votingPhase) {
            return await this.processVotingResults();
        }
        
        return true;
    }
    
    startVotingPhase() {
        console.log('🗳️ 进入投票阶段');
        this.gameState.gameModeConfig.werewolf.discussionPhase = false;
        this.gameState.gameModeConfig.werewolf.votingPhase = true;
        
        // 移除输入区域
        this.hideWerewolfInputArea();
        
        // 直接显示投票界面
        this.showVotingInterface();
    }
    
    showVotingInterface() {
        const alive = this.gameState.gameModeConfig.werewolf.alivePlayers;
        const fixed = this.gameState.gameModeConfig.werewolf.fixedParticipants || [];
        const candidates = alive.filter(name => name !== this.gameState.playerName && fixed.includes(name));
        
        const overlay = document.createElement('div');
        overlay.id = 'voteModal';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1000';
        overlay.style.pointerEvents = 'none'; // 允许背景可滚动
        
        const modal = document.createElement('div');
        modal.id = 'votingInterface';
        modal.style.background = '#fff';
        modal.style.borderRadius = '8px';
        modal.style.padding = '24px';
        modal.style.minWidth = '400px';
        modal.style.maxWidth = '600px';
        modal.style.maxHeight = '80vh'; // 限制最大高度
        modal.style.overflowY = 'auto'; // 内部可滚动
        modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
        modal.style.pointerEvents = 'auto'; // 恢复模态框的交互
        
        modal.innerHTML = `
            <h3 style="margin-top:0">🗳️ 投票阶段</h3>
            <p style="color:#666;margin-bottom:20px;">谁是隐藏在群聊中的人类？投票选出你认为最可疑的对象。得票最多者将被淘汰。</p>
            <div class="vote-options">
                ${candidates.map(name => `
                    <div class="vote-option" data-target="${name}" style="padding:12px;border:2px solid #ddd;border-radius:8px;margin:8px 0;cursor:pointer;transition:all 0.2s;">
                        <span class="vote-name" style="font-size:16px;font-weight:500;">${name}</span>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;">
                <button id="submitVoteBtn" class="primary-btn" disabled style="padding:10px 24px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-size:16px;">确认投票</button>
                <button id="skipRoundBtn_werewolf" class="debug-btn secondary-btn hidden" style="padding:10px 20px;background:#ff9800;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">跳过本轮</button>
                <button id="endGameBtn_werewolf" class="debug-btn secondary-btn hidden" style="padding:10px 20px;background:#f44336;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">结束游戏</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        const gameInterface = document.getElementById('gameInterface');
        if (gameInterface) {
            gameInterface.appendChild(overlay);
            this.setupVotingEventListeners();
            
            // 绑定调试按钮事件
            const skipBtn = document.getElementById('skipRoundBtn_werewolf');
            const endGameBtn = document.getElementById('endGameBtn_werewolf');
            
            if (skipBtn) {
                skipBtn.addEventListener('click', () => {
                    if (this.gameController && typeof this.gameController.skipCurrentRound === 'function') {
                        this.gameController.skipCurrentRound();
                    }
                });
            }
            
            if (endGameBtn) {
                endGameBtn.addEventListener('click', () => {
                    if (this.gameController && typeof this.gameController.endGameManually === 'function') {
                        this.gameController.endGameManually();
                    }
                });
            }
            
            // 如果调试模式已启用，立即显示按钮（不依赖异步初始化）
            if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
                console.log('🐺 投票界面：调试模式已启用，直接显示按钮');
                const skipBtn = document.getElementById('skipRoundBtn_werewolf');
                const endGameBtn = document.getElementById('endGameBtn_werewolf');
                if (skipBtn && window.DEBUG_CONFIG.features?.showSkipButton) {
                    skipBtn.classList.remove('hidden');
                    console.log('🐺 投票：显示跳过按钮');
                }
                if (endGameBtn && window.DEBUG_CONFIG.features?.showEndGameButton) {
                    endGameBtn.classList.remove('hidden');
                    console.log('🐺 投票：显示结束按钮');
                }
            }
            
            // 立即应用调试按钮状态
            setTimeout(() => {
                if (window.debugManager && window.debugManager.initialized) {
                    console.log('🐺 投票界面：通过debugManager应用调试按钮状态');
                    window.debugManager.setupDebugButtons();
                } else if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
                    // debugManager还在初始化中，但按钮已经通过直接方式显示了
                    console.log('🐺 投票界面：调试按钮已通过直接方式显示');
                }
            }, 100);
        }
    }
    
    setupVotingEventListeners() {
        const voteOptions = document.querySelectorAll('.vote-option');
        const submitBtn = document.getElementById('submitVoteBtn');
        let selectedTarget = null;
        
        voteOptions.forEach(option => {
            option.addEventListener('mouseenter', () => {
                if (!option.classList.contains('selected')) {
                    option.style.borderColor = '#4CAF50';
                    option.style.backgroundColor = '#f0f9f0';
                }
            });
            
            option.addEventListener('mouseleave', () => {
                if (!option.classList.contains('selected')) {
                    option.style.borderColor = '#ddd';
                    option.style.backgroundColor = 'transparent';
                }
            });
            
            option.addEventListener('click', () => {
                voteOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.borderColor = '#ddd';
                    opt.style.backgroundColor = 'transparent';
                });
                
                option.classList.add('selected');
                option.style.borderColor = '#4CAF50';
                option.style.backgroundColor = '#e8f5e9';
                selectedTarget = option.dataset.target;
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor = 'pointer';
                }
            });
        });
        
        if (submitBtn) {
            submitBtn.style.opacity = '0.5';
            submitBtn.addEventListener('click', () => {
                if (selectedTarget) {
                    this.submitPlayerVote(selectedTarget);
                }
            });
        }
    }
    
    async submitPlayerVote(target) {
        // 记录玩家投票
        this.gameState.gameModeConfig.werewolf.votingResults[this.gameState.playerName] = target;
        
        // 显示"AI正在投票"的提示
        this.showAIVotingIndicator();
        
        // 生成AI投票（异步）
        await this.generateAIVotes();
        
        // 隐藏投票提示
        this.hideAIVotingIndicator();
        
        // 处理投票结果
        await this.processVotingResults();
    }
    
    showAIVotingIndicator() {
        const votingInterface = document.getElementById('votingInterface');
        if (!votingInterface) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'aiVotingIndicator';
        indicator.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            text-align: center;
            color: #0369a1;
            font-size: 14px;
        `;
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 3px solid #0ea5e9; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>AI正在分析发言并投票...</span>
            </div>
        `;
        
        votingInterface.appendChild(indicator);
        
        // 添加旋转动画
        if (!document.getElementById('spinKeyframes')) {
            const style = document.createElement('style');
            style.id = 'spinKeyframes';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    hideAIVotingIndicator() {
        const indicator = document.getElementById('aiVotingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    async generateAIVotes(excludePlayer = false) {
        const alivePlayers = this.gameState.gameModeConfig.werewolf.alivePlayers;
        const aiPlayers = alivePlayers.filter(name => name !== this.gameState.playerName);
        
        console.log('🤖 AI开始基于发言分析进行投票...');
        console.log('🤖 投票模式:', excludePlayer ? '排除玩家（调试模式）' : '包含所有存活玩家');
        
        // 使用Promise.all并行处理所有AI的投票分析
        await Promise.all(aiPlayers.map(aiName => this.generateSingleAIVote(aiName, alivePlayers, excludePlayer)));
        
        console.log('🗳️ 投票结果:', this.gameState.gameModeConfig.werewolf.votingResults);
    }
    
    async generateSingleAIVote(aiName, alivePlayers, excludePlayer = false) {
        // 获取本轮所有参与者的发言历史
        const conversationHistory = this.gameState.getRecentMessageHistory(20);
        
        // 过滤出存活玩家的发言（排除自己）
        let possibleTargets = alivePlayers.filter(name => name !== aiName);
        
        // 如果是调试模式，排除玩家
        if (excludePlayer) {
            possibleTargets = possibleTargets.filter(name => name !== this.gameState.playerName);
            console.log(`🐛 调试模式：${aiName} 的投票候选人排除了玩家`, possibleTargets);
        }
        
        // 如果没有可投票的目标，跳过
        if (possibleTargets.length === 0) {
            console.log(`⚠️ ${aiName} 没有可投票的目标`);
            return;
        }
        
        // 【新增】获取当前怀疑度，用于影响投票倾向
        const currentSuspicion = this.gameState.suspicionLevel;
        const suspicionInfluence = this.calculateSuspicionInfluence(currentSuspicion);
        console.log(`📊 ${aiName} 投票时考虑怀疑度: ${currentSuspicion}% (影响系数: ${suspicionInfluence.toFixed(2)})`);
        
        // 统计每个参与者的发言
        const speakerMessages = {};
        possibleTargets.forEach(name => {
            speakerMessages[name] = conversationHistory
                .filter(msg => msg.author === name && msg.type !== 'system')
                .map(msg => msg.content)
                .join('\n');
        });
        
        // 如果没有足够的发言内容，使用怀疑度加权随机投票
        const hasEnoughContent = Object.values(speakerMessages).some(msgs => msgs.length > 20);
        if (!hasEnoughContent) {
            const target = this.weightedRandomVote(possibleTargets, suspicionInfluence);
            this.gameState.gameModeConfig.werewolf.votingResults[aiName] = target;
            console.log(`🎲 ${aiName} 因信息不足进行加权随机投票给: ${target}`);
            return;
        }
        
        try {
            // 调用AI分析每个参与者的发言（传入怀疑度信息）
            const analysisPrompt = this.buildVotingAnalysisPrompt(aiName, speakerMessages, suspicionInfluence);
            const analysis = await this.gameController.callAI(analysisPrompt, {
                maxTokens: 300,
                temperature: 0.7
            });
            
            // 解析AI的投票决定
            const votedTarget = this.parseVotingDecision(analysis, possibleTargets);
            this.gameState.gameModeConfig.werewolf.votingResults[aiName] = votedTarget;
            
            console.log(`🗳️ ${aiName} 投票给: ${votedTarget} (考虑怀疑度: ${currentSuspicion}%)`);
            
        } catch (error) {
            console.error(`❌ ${aiName} 投票分析失败:`, error);
            // 失败时随机投票
            const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
            this.gameState.gameModeConfig.werewolf.votingResults[aiName] = target;
        }
    }
    
    // 计算怀疑度对投票的影响系数
    calculateSuspicionInfluence(suspicionLevel) {
        // 怀疑度越高，AI越倾向于投玩家
        // 0-40%: 影响很小 (1.0-1.2x)
        // 40-60%: 中等影响 (1.2-1.5x)
        // 60-80%: 高度影响 (1.5-2.5x)
        // 80-100%: 极强影响 (2.5-4.0x)
        
        if (suspicionLevel < 40) {
            return 1.0 + (suspicionLevel / 40) * 0.2; // 1.0-1.2
        } else if (suspicionLevel < 60) {
            return 1.2 + ((suspicionLevel - 40) / 20) * 0.3; // 1.2-1.5
        } else if (suspicionLevel < 80) {
            return 1.5 + ((suspicionLevel - 60) / 20) * 1.0; // 1.5-2.5
        } else {
            return 2.5 + ((suspicionLevel - 80) / 20) * 1.5; // 2.5-4.0
        }
    }
    
    // 基于怀疑度的加权随机投票
    weightedRandomVote(possibleTargets, suspicionInfluence) {
        const playerName = this.gameState.playerName;
        
        // 如果玩家在候选名单中，根据影响系数提高其被选中概率
        if (possibleTargets.includes(playerName)) {
            const playerWeight = suspicionInfluence; // 玩家的权重
            const otherWeight = 1.0; // 其他AI的权重
            
            // 计算总权重
            const totalWeight = playerWeight + (possibleTargets.length - 1) * otherWeight;
            
            // 随机选择
            const rand = Math.random() * totalWeight;
            
            if (rand < playerWeight) {
                // 选中玩家
                return playerName;
            } else {
                // 选中其他AI
                const otherTargets = possibleTargets.filter(name => name !== playerName);
                return otherTargets[Math.floor(Math.random() * otherTargets.length)];
            }
        } else {
            // 玩家不在候选名单，正常随机
            return possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        }
    }
    
    buildVotingAnalysisPrompt(aiName, speakerMessages, suspicionInfluence = 1.0) {
        const participants = Object.keys(speakerMessages);
        
        // 获取当前讨论话题
        const currentTopic = window.topicProgression ? 
            window.topicProgression[this.gameState.currentDifficulty] : 
            { name: 'AI与人类', description: 'AI与人类的关系' };
        
        // 获取已淘汰玩家列表
        const eliminatedPlayers = this.gameState.gameModeConfig.werewolf.eliminatedPlayers || [];
        const eliminatedText = eliminatedPlayers.length > 0 
            ? `\n\n❌ **已淘汰成员**：${eliminatedPlayers.join('、')} 已经在之前的投票中被淘汰出局，不再参与游戏。` 
            : '';
        
        let messagesText = '';
        participants.forEach(name => {
            const messages = speakerMessages[name];
            if (messages && messages.trim()) {
                messagesText += `\n【${name}的发言】:\n${messages}\n`;
            } else {
                messagesText += `\n【${name}的发言】: (本轮未发言或发言很少)\n`;
            }
        });
        
        // 根据怀疑度影响生成额外的观察提示（但不指名道姓）
        let suspicionHint = '';
        
        if (suspicionInfluence >= 2.5) {
            // 高怀疑度：提示整体氛围紧张，但不指定具体对象
            suspicionHint = `\n\n🚨 **群体观察**：根据最近的多轮对话，群内的怀疑氛围已经非常浓重。有些成员的发言风格、思维方式持续显示出与AI特征的偏差。请特别仔细地分析每个人的发言。`;
        } else if (suspicionInfluence >= 1.5) {
            // 中高怀疑度：提示需要警惕
            suspicionHint = `\n\n⚠️ **观察提示**：群内已经出现了一些值得关注的发言模式，建议仔细分析每个成员是否符合AI的思维特征。`;
        } else if (suspicionInfluence >= 1.2) {
            // 轻度怀疑度：轻微提示
            suspicionHint = `\n\n💡 **留意**：已有一些发言需要额外审查，请综合判断。`;
        }
        
        return [
            {
                role: "system",
                content: `你是${aiName}，一个参与"谁是人类"游戏的AI。在这个游戏中，有一个人类混入了AI群聊，伪装成AI。你的任务是通过分析发言，找出谁最像人类。

❗【重要】你不知道谁是人类，所有参与者对你来说都是平等的。你必须基于发言内容客观判断。${eliminatedText}`
            },
            {
                role: "user",
                content: `现在是投票环节，你需要投出一个你认为最可能是人类的参与者。
${eliminatedPlayers.length > 0 ? `\n⚠️ 注意：${eliminatedPlayers.join('、')}已经被淘汰，请从剩余的**存活成员**中选择最可疑的对象。\n` : ''}
本轮讨论话题：${currentTopic.name} - ${currentTopic.description}

人类的特征：
- 倾向于使用情感化语言（"我觉得"、"感觉"、"好像"）
- 回答较短，缺乏技术深度
- 使用口语化表达，有语气词
- 思维跳跃，缺乏逻辑性
- 可能暴露主观判断和个人偏好
- **发言与话题无关或相关度很低**（说明没有真正理解和参与讨论）

AI的特征：
- 理性客观的表达方式
- 结构化、系统化的思维
- 技术性和专业性的词汇
- 逻辑严密，有因果关系
- 避免情感表达
- **紧扣话题进行深入讨论**
- **每次发言都有新的观点和思考**

以下是本轮讨论中各参与者的发言：
${messagesText}
${suspicionHint}

请分析每个参与者的发言特征，判断谁最可能是伪装的人类。

**特别注意**：
1. 评估发言与话题"${currentTopic.name}"的相关度
2. 注意发言的语言风格、逻辑性和专业性
3. **所有参与者都应该被平等对待，不要有先入为主的偏见**
${suspicionInfluence >= 1.2 ? `4. 结合上述观察提示，综合判断最可疑的对象` : ''}

要求：
1. 只需要给出你的投票对象名字
2. 格式：投票给：[名字]
3. 不要给出分析过程，直接给出结果

你的投票：`
            }
        ];
    }
    
    parseVotingDecision(analysisText, possibleTargets) {
        // 尝试从AI回复中提取投票对象
        const match = analysisText.match(/投票给[：:]\s*[【\[]?(.*?)[】\]]?(?:\s|$|。|，)/);
        
        if (match) {
            const votedName = match[1].trim();
            // 检查是否是有效的投票对象
            if (possibleTargets.includes(votedName)) {
                return votedName;
            }
            
            // 尝试模糊匹配
            const fuzzyMatch = possibleTargets.find(name => 
                votedName.includes(name) || name.includes(votedName)
            );
            if (fuzzyMatch) {
                return fuzzyMatch;
            }
        }
        
        // 尝试直接在文本中查找参与者名字
        for (const name of possibleTargets) {
            if (analysisText.includes(name)) {
                return name;
            }
        }
        
        // 解析失败，随机选择
        console.warn('⚠️ 无法解析投票对象，随机选择:', analysisText);
        return possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    }
    
    async processVotingResults() {
        const votingResults = this.gameState.gameModeConfig.werewolf.votingResults;
        
        // 统计票数
        const voteCount = {};
        Object.values(votingResults).forEach(target => {
            voteCount[target] = (voteCount[target] || 0) + 1;
        });
        
        // 统计玩家得票数
        const playerVotes = voteCount[this.gameState.playerName] || 0;
        this.gameState.gameModeConfig.werewolf.playerTotalVotes += playerVotes;
        
        // 保存本轮投票历史
        this.gameState.gameModeConfig.werewolf.votingHistory.push({
            round: this.gameState.currentRound,
            votingResults: {...votingResults},
            voteCount: {...voteCount},
            playerVotes: playerVotes
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
        console.log(`📊 玩家累计得票: ${this.gameState.gameModeConfig.werewolf.playerTotalVotes}`);
        
        // 检查第一轮玩家免疫
        const isFirstRound = this.gameState.currentRound === 1;
        const playerWillBeEliminated = eliminatedPlayer === this.gameState.playerName;
        const hasImmunity = isFirstRound && playerWillBeEliminated;
        
        if (hasImmunity) {
            console.log('🛡️ 第一轮免疫：玩家得票最高但获得免疫，没有人被淘汰');
        }
        
        // 展示详细的投票结果
        await this.displayVotingResults(votingResults, voteCount, eliminatedPlayer, hasImmunity);
        
        // 关闭投票界面（在展示结果后）
        const voteModal = document.getElementById('voteModal');
        if (voteModal) {
            voteModal.remove();
        }
        
        // 如果玩家存活，生成AI对玩家本轮表现的评价
        if (eliminatedPlayer !== this.gameState.playerName) {
            await this.generatePlayerRoundEvaluation(playerVotes);
        }
        
        // 淘汰玩家（如果没有免疫）
        if (eliminatedPlayer && !hasImmunity) {
            await this.eliminatePlayer(eliminatedPlayer);
        }
        
        // 检查游戏结束条件
        const endCondition = this.checkGameEndCondition();
        if (endCondition && endCondition.gameOver) {
            console.log('🎮 游戏结束:', endCondition);
            this.handleGameEnd(endCondition);
            return false;
        }
        
        // 设置投票完成标志，允许进入下一轮
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = true;
        
        // 如果游戏未结束，推进到下一轮
        console.log('🔄 投票结束，准备进入下一轮');
        await this.advanceToNextRound();
        return true;
    }
    
    async displayVotingResults(votingResults, voteCount, eliminatedPlayer, hasImmunity = false) {
        // 在投票框上显示结果
        const votingInterface = document.getElementById('votingInterface');
        if (!votingInterface) return;
        
        // 隐藏投票选项和按钮
        const voteOptions = votingInterface.querySelector('.vote-options');
        const submitBtn = document.getElementById('submitVoteBtn');
        if (voteOptions) voteOptions.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        
        // 构建投票结果消息
        let resultHTML = '<div style="margin-top:20px;"><h4 style="margin:0 0 15px 0;color:#333;">📊 投票结果公布</h4>';
        
        // 按票数排序
        const sortedVotes = Object.entries(voteCount).sort((a, b) => b[1] - a[1]);
        
        resultHTML += '<div style="background:#f5f5f5;border-radius:8px;padding:15px;margin-bottom:15px;">';
        sortedVotes.forEach(([player, votes]) => {
            const isTarget = player === eliminatedPlayer;
            const voters = Object.entries(votingResults)
                .filter(([voter, target]) => target === player)
                .map(([voter, target]) => voter);
            
            const bgColor = isTarget ? '#ffebee' : '#fff';
            const borderColor = isTarget ? '#f44336' : '#ddd';
            
            resultHTML += `
                <div style="background:${bgColor};border:2px solid ${borderColor};border-radius:6px;padding:10px;margin:8px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:500;font-size:16px;">${isTarget ? '🎯' : '📌'} ${player}</span>
                        <span style="font-weight:bold;color:${isTarget ? '#f44336' : '#666'};font-size:18px;">${votes}票</span>
                    </div>
                    ${votes > 0 ? `<div style="margin-top:8px;color:#666;font-size:14px;">投票者：${voters.join(', ')}</div>` : ''}
                </div>
            `;
        });
        resultHTML += '</div>';
        
        // 根据是否有免疫显示不同的消息
        if (hasImmunity) {
            resultHTML += `<div style="background:#e8f5e9;border:2px solid #4caf50;border-radius:8px;padding:12px;text-align:center;">
                <strong style="color:#2e7d32;">🛡️ ${eliminatedPlayer} 得票最高，但第一轮拥有免疫权，本轮无人出局！</strong>
            </div></div>`;
        } else {
            resultHTML += `<div style="background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:12px;text-align:center;">
                <strong style="color:#856404;">❌ ${eliminatedPlayer} 得票最高，被淘汰出局！</strong>
            </div></div>`;
        }
        
        // 显示结果
        votingInterface.innerHTML += resultHTML;
        
        // 等待一段时间让玩家看到结果
        await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    async generatePlayerRoundEvaluation(playerVotes) {
        console.log('🎯 生成玩家本轮表现评价');
        
        // 获取玩家本轮的所有发言
        const conversationHistory = this.gameState.getRecentMessageHistory(20);
        const playerMessages = conversationHistory
            .filter(msg => msg.author === this.gameState.playerName && msg.type !== 'system')
            .map(msg => msg.content);
        
        if (playerMessages.length === 0) {
            // 玩家本轮没有发言
            const systemMsg = `📊 本轮评价：你本轮没有发言，AI们无法判断你的身份。得票数：${playerVotes}票`;
            this.addSystemEvaluation(systemMsg);
            return;
        }
        
        // 获取当前怀疑度
        const currentSuspicion = this.gameState.suspicionLevel;
        
        try {
            // 根据得票数决定评价基调
            let evaluationTone = '';
            if (playerVotes === 0) {
                evaluationTone = '该参与者本轮表现良好，发言较为自然，未引起AI们的怀疑。';
            } else if (playerVotes === 1) {
                evaluationTone = '该参与者本轮表现中规中矩，有个别AI注意到一些细节，但整体未引起广泛怀疑。';
            } else if (playerVotes === 2) {
                evaluationTone = '该参与者本轮表现存在一些问题，部分AI注意到了可疑之处。';
            } else {
                evaluationTone = '该参与者本轮表现存在明显问题，引起了多位AI的怀疑。';
            }
            
            // 调用AI生成评价
            const evaluationPrompt = [
                {
                    role: 'system',
                    content: `你是一个客观的AI分析师，需要评价一个参与者在"谁是人类"游戏中的表现。`
                },
                {
                    role: 'user',
                    content: `在本轮游戏中，参与者"${this.gameState.playerName}"的发言如下：

${playerMessages.map((msg, i) => `发言${i + 1}: ${msg}`).join('\n\n')}

投票结果：${this.gameState.playerName}获得${playerVotes}票。

评价基调：${evaluationTone}

请根据以下标准评价该参与者的表现：
1. **AI特征符合度**：发言是否体现了AI的逻辑性、技术性、系统性思维
2. **可疑之处**：是否有人类化的情感表达、口语化、简短回复等
3. **整体评价**：简要总结本轮表现

【重要】禁止事项：
- 不要提及"重复发言"或"发言相似"，因为我们没有历史发言数据
- 评价的正负面倾向必须与得票数一致（0票=正面，1票=中性偏正，2票=中性偏负，3+票=负面）

要求：
- 评价要客观中立
- 指出具体的优点和问题
- 控制在80-120字
- 直接给出评价内容，不要加标题

评价：`
                }
            ];
            
            const evaluation = await this.gameController.callAI(evaluationPrompt, {
                maxTokens: 200,
                temperature: 0.7
            });
            
            // 计算怀疑度变化（基于得票数）
            let suspicionChange = 0;
            if (playerVotes === 0) {
                suspicionChange = -8; // 无人投票，表现良好，降低怀疑
            } else if (playerVotes === 1) {
                suspicionChange = -2; // 1票，表现尚可，轻微降低
            } else if (playerVotes === 2) {
                suspicionChange = 5; // 2票，轻度增加
            } else if (playerVotes >= 3) {
                suspicionChange = Math.min(15, playerVotes * 3); // 3票以上，显著增加
            }
            
            // 应用难度系数
            if (this.gameState.difficultyMultiplier && this.gameState.difficultyMultiplier !== 1.0) {
                suspicionChange = Math.round(suspicionChange * this.gameState.difficultyMultiplier);
            }
            
            // 更新怀疑度
            const oldSuspicion = currentSuspicion;
            this.gameState.adjustSuspicionLevel(suspicionChange, `本轮得票${playerVotes}票`);
            const newSuspicion = this.gameState.suspicionLevel;
            
            // 立即更新UI显示
            if (this.gameController && typeof this.gameController.updateSuspicionDisplay === 'function') {
                this.gameController.updateSuspicionDisplay({
                    change: suspicionChange,
                    reason: `本轮得票${playerVotes}票`
                });
            }
            
            // 构建系统消息（纯文本格式，不使用markdown）
            const changeSymbol = suspicionChange > 0 ? '↑' : suspicionChange < 0 ? '↓' : '→';
            const changeColor = suspicionChange > 0 ? '#f44336' : suspicionChange < 0 ? '#4caf50' : '#666';
            
            const systemMsg = `📊 本轮表现评价

${evaluation.trim()}

怀疑度变化：${oldSuspicion}% ${changeSymbol} ${newSuspicion}% (${suspicionChange >= 0 ? '+' : ''}${suspicionChange}%)
得票情况：本轮获得 ${playerVotes} 票`;
            
            this.addSystemEvaluation(systemMsg);
            
            console.log(`📊 评价完成 - 怀疑度: ${oldSuspicion}% → ${newSuspicion}% (${suspicionChange >= 0 ? '+' : ''}${suspicionChange})`);
            
        } catch (error) {
            console.error('❌ 生成评价失败:', error);
            // 失败时仍然显示基本信息和更新怀疑度
            const fallbackChange = playerVotes >= 3 ? 10 : playerVotes === 2 ? 5 : playerVotes === 1 ? 0 : -5;
            const oldSuspicion = this.gameState.suspicionLevel;
            this.gameState.adjustSuspicionLevel(fallbackChange, `本轮得票${playerVotes}票`);
            const newSuspicion = this.gameState.suspicionLevel;
            
            // 更新UI
            if (this.gameController && typeof this.gameController.updateSuspicionDisplay === 'function') {
                this.gameController.updateSuspicionDisplay({
                    change: fallbackChange,
                    reason: `本轮得票${playerVotes}票`
                });
            }
            
            const changeSymbol = fallbackChange > 0 ? '↑' : fallbackChange < 0 ? '↓' : '→';
            const systemMsg = `📊 本轮评价：得票${playerVotes}票。怀疑度：${oldSuspicion}% ${changeSymbol} ${newSuspicion}%。继续努力保持伪装！`;
            this.addSystemEvaluation(systemMsg);
        }
    }
    
    addSystemEvaluation(message) {
        // 添加系统评价消息到聊天容器
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message evaluation-message';
        messageDiv.style.cssText = 'background: linear-gradient(135deg, rgba(7, 193, 96, 0.1), rgba(7, 193, 96, 0.05)); border-left: 4px solid #07c160; padding: 12px 16px; margin: 15px auto; border-radius: 8px; white-space: pre-wrap; max-width: min(600px, 70vw); width: fit-content;';
        messageDiv.textContent = message;
        
        chatContainer.appendChild(messageDiv);
        
        // 滚动到底部
        if (this.gameController && typeof this.gameController.scrollToBottom === 'function') {
            this.gameController.scrollToBottom();
        }
    }
    
    async eliminatePlayer(playerName) {
        const alivePlayers = this.gameState.gameModeConfig.werewolf.alivePlayers;
        const index = alivePlayers.indexOf(playerName);
        if (index > -1) {
            alivePlayers.splice(index, 1);
            this.gameState.gameModeConfig.werewolf.eliminatedPlayers.push(playerName);
        }
        
        // 更新参与AI名单（固定名单移除被淘汰AI）
        if (playerName !== this.gameState.playerName) {
            this.gameState.activeAICharacters = this.gameState.activeAICharacters.filter(ai => ai.name !== playerName);
        }
        
        console.log(`❌ ${playerName} 被淘汰`);
        console.log('🟢 剩余存活玩家:', alivePlayers);
        
        this.gameState.gameModeConfig.werewolf.votingPhase = false;
        this.gameState.gameModeConfig.werewolf.votingResults = {};
        this.gameState.gameModeConfig.werewolf.roundVotingComplete = true;
    }
    
    canAdvanceToNextRound() {
        const endCondition = this.checkGameEndCondition();
        if (endCondition && endCondition.gameOver) {
            return false;
        }
        return this.gameState.gameModeConfig.werewolf.roundVotingComplete;
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
    
    async advanceToNextRound() {
        console.log('🔄 狼人杀模式：准备进入下一轮');
        
        // 等待一段时间再开始下一轮
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 调用GameController的startNextRound
        if (this.gameController && typeof this.gameController.startNextRound === 'function') {
            await this.gameController.startNextRound();
        }
    }
    
    handleGameEnd(endCondition) {
        console.log('🎮 狼人杀游戏结束:', endCondition);
        
        // 调用GameController的游戏结束处理
        if (this.gameController && typeof this.gameController.showModeSpecificGameOver === 'function') {
            this.gameController.showModeSpecificGameOver(endCondition);
        }
    }
    
    // 显示狼人杀模式的持久输入区域
    showWerewolfInputArea() {
        const gameInterface = document.getElementById('gameInterface');
        if (gameInterface && !document.getElementById('werewolfInputArea')) {
            const inputArea = document.createElement('div');
            inputArea.id = 'werewolfInputArea';
            inputArea.className = 'openmic-input-area'; // 复用开放麦样式
            inputArea.innerHTML = `
                <div class="openmic-input-container">
                    <textarea id="werewolfInput" placeholder="在狼人杀模式中，你可以随时发言参与讨论..." maxlength="500"></textarea>
                    <div class="openmic-input-footer">
                        <div class="char-count">
                            <span id="werewolfCharCount">0</span>/500
                        </div>
                        <div class="input-buttons">
                            <button id="werewolfSendBtn" class="openmic-send-btn" disabled>发送</button>
                            <button id="skipRoundBtn_werewolf_input" class="debug-btn secondary-btn hidden">跳过本轮</button>
                            <button id="endGameBtn_werewolf_input" class="debug-btn secondary-btn hidden">结束游戏</button>
                        </div>
                    </div>
                </div>
            `;
            
            gameInterface.appendChild(inputArea);
            this.setupWerewolfInputListeners();
            
            // 如果调试模式已启用，立即显示按钮（不依赖异步初始化）
            if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
                console.log('🐺 狼人杀：调试模式已启用，直接显示按钮');
                const skipBtn = document.getElementById('skipRoundBtn_werewolf_input');
                const endGameBtn = document.getElementById('endGameBtn_werewolf_input');
                if (skipBtn && window.DEBUG_CONFIG.features?.showSkipButton) {
                    skipBtn.classList.remove('hidden');
                    console.log('🐺 显示跳过按钮');
                }
                if (endGameBtn && window.DEBUG_CONFIG.features?.showEndGameButton) {
                    endGameBtn.classList.remove('hidden');
                    console.log('🐺 显示结束按钮');
                }
            }
            
            // 延迟应用调试按钮状态，确保debugManager已初始化
            setTimeout(() => {
                if (window.debugManager && window.debugManager.initialized) {
                    console.log('🐺 狼人杀：通过debugManager应用调试按钮状态');
                    window.debugManager.setupDebugButtons();
                } else if (window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled) {
                    // debugManager还在初始化中，但按钮已经通过直接方式显示了
                    console.log('🐺 狼人杀：调试按钮已通过直接方式显示');
                }
            }, 100);
            
            console.log('🐺 狼人杀输入区域已显示');
        }
    }
    
    setupWerewolfInputListeners() {
        const input = document.getElementById('werewolfInput');
        const sendBtn = document.getElementById('werewolfSendBtn');
        const charCount = document.getElementById('werewolfCharCount');
        const skipBtn = document.getElementById('skipRoundBtn_werewolf_input');
        const endGameBtn = document.getElementById('endGameBtn_werewolf_input');
        
        if (input && sendBtn && charCount) {
            // 字符计数
            input.addEventListener('input', () => {
                const length = input.value.length;
                charCount.textContent = length;
                sendBtn.disabled = length < 5;
            });
            
            // 发送按钮点击
            sendBtn.addEventListener('click', () => {
                this.handleWerewolfSend();
            });
            
            // 回车发送
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (!sendBtn.disabled) {
                        this.handleWerewolfSend();
                    }
                }
            });
        }
        
        // 绑定调试按钮事件
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                if (this.gameController && typeof this.gameController.skipCurrentRound === 'function') {
                    this.gameController.skipCurrentRound();
                }
            });
        }
        
        if (endGameBtn) {
            endGameBtn.addEventListener('click', () => {
                if (this.gameController && typeof this.gameController.endGameManually === 'function') {
                    this.gameController.endGameManually();
                }
            });
        }
    }
    
    handleWerewolfSend() {
        const input = document.getElementById('werewolfInput');
        const sendBtn = document.getElementById('werewolfSendBtn');
        
        if (input && sendBtn) {
            const message = input.value.trim();
            if (message.length >= 5) {
                input.value = '';
                document.getElementById('werewolfCharCount').textContent = '0';
                sendBtn.disabled = true;
                
                // 使用GameController处理消息
                if (this.gameController && typeof this.gameController.handleWerewolfMessage === 'function') {
                    this.gameController.handleWerewolfMessage(message);
                } else {
                    console.warn('⚠️ GameController.handleWerewolfMessage 方法不存在');
                }
            }
        }
    }
    
    hideWerewolfInputArea() {
        const inputArea = document.getElementById('werewolfInputArea');
        if (inputArea) {
            inputArea.remove();
        }
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