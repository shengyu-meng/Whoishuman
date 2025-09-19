// 游戏主控制类
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.exportService = new ExportService(this.gameState);
        
        // 初始化游戏模式管理器
        this.gameModeManager = null; // 延迟初始化，等待GameModeManager类加载
        
        // 配置加载状态
        this.configLoaded = false;
        this.apiConfig = null;
        this.gameConfig = null;
        
        // 状态管理标志
        this.isGeneratingConversation = false;
        this.isStartingNextRound = false;
        
        // 异步初始化配置
        this.initializeConfig();
        
        // 初始化调试管理器（异步）
        this.debugManager = new DebugManager();
        
        // 等待调试管理器初始化完成
        this.waitForDebugManager();
        
        this.initializeEventListeners();
        
        // 初始化游戏模式管理器
        this.initializeGameModeManager();
        
        // 全局错误处理，防止页面刷新
        window.addEventListener('error', (event) => {
            console.error('🚨 全局错误捕获:', event.error);
            console.error('错误详情:', event.error?.message, event.error?.stack);
            // 确保状态重置
            this.isGeneratingConversation = false;
            this.isStartingNextRound = false;
            // 阻止默认错误行为（防止页面刷新提示）
            event.preventDefault();
            return false;
        });
        
        // 处理未捕获的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 未捕获的Promise错误:', event.reason);
            console.error('错误详情:', event.reason?.message, event.reason?.stack);
            // 确保状态重置
            this.isGeneratingConversation = false;
            this.isStartingNextRound = false;
            // 阻止默认错误行为
            event.preventDefault();
            return false;
        });
        
        // 安全的setTimeout包装器
        this.safeTimeout = (callback, delay) => {
            return setTimeout(() => {
                try {
                    if (typeof callback === 'function') {
                        callback();
                    }
                } catch (error) {
                    console.error('🚨 setTimeout回调错误:', error);
                    console.error('错误详情:', error.message, error.stack);
                    // 不重新抛出错误，防止页面刷新
                    // 确保状态重置
                    this.isGeneratingConversation = false;
                    this.isStartingNextRound = false;
                }
            }, delay);
        };
        
        // 安全的异步函数包装器
        this.safeAsync = async (asyncFn) => {
            try {
                return await asyncFn();
            } catch (error) {
                console.error('🚨 异步函数错误:', error);
                console.error('错误详情:', error.message, error.stack);
                return null;
            }
        };
    }

    // 等待调试管理器初始化完成
    async waitForDebugManager() {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒
        
        while (!this.debugManager.initialized && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (this.debugManager.initialized) {
            console.log('✅ 调试管理器初始化完成');
        } else {
            console.warn('⚠️ 调试管理器初始化超时');
        }
    }

    // 异步初始化配置
    async initializeConfig() {
        try {
            // 使用静默日志，等调试配置加载后再决定是否输出
            if (window.envConfigManager) {
                window.envConfigManager.log('log', '🔧 开始加载配置...');
            } else {
                console.log('🔧 开始加载配置...');
            }
            
            // 使用环境配置管理器获取配置
            if (typeof window !== 'undefined' && window.envConfigManager) {
                const config = await window.envConfigManager.getConfig();
                this.apiConfig = config.API_CONFIG;
                this.gameConfig = config.GAME_CONFIG;
                this.debugConfig = config.DEBUG_CONFIG;
                this.configLoaded = true;
                
                // 配置加载完成后，根据调试设置决定是否输出日志
                if (this.debugConfig && this.debugConfig.enabled && 
                    this.debugConfig.features && this.debugConfig.features.showConsoleLogs) {
                    console.log('✅ 配置加载成功:', {
                        environment: config.ENVIRONMENT.info,
                        hasApiKey: !!this.apiConfig.apiKey && this.apiConfig.apiKey !== 'YOUR_API_KEY_HERE',
                        apiKeySource: this.apiConfig.apiKey !== 'YOUR_API_KEY_HERE' ? '环境变量或配置文件' : '未配置',
                        debugEnabled: this.debugConfig.enabled,
                        debugSource: this.debugConfig.source
                    });
                }
            } else {
                // 回退到传统配置加载
                console.warn('⚠️ 环境配置管理器未找到，使用传统配置方式');
                this.apiConfig = window.API_CONFIG || {};
                this.gameConfig = window.GAME_CONFIG || {};
                this.configLoaded = true;
                
                if (!this.apiConfig.apiKey) {
                    console.error('❌ API配置加载失败，请检查config.js文件或环境变量');
                }
            }
        } catch (error) {
            console.error('❌ 配置加载失败:', error);
            // 使用默认配置
            this.apiConfig = {
                baseUrl: 'https://api.deepseek.com/v1/chat/completions',
                model: 'deepseek-chat',
                requestConfig: {
                    temperature: 0.0,
                    maxTokens: 1000,
                    timeout: 30000
                },
                apiKey: 'YOUR_API_KEY_HERE'
            };
            this.gameConfig = window.GAME_CONFIG || {};
            this.configLoaded = true;
        }
    }

    // 确保配置已加载的工具方法
    async ensureConfigLoaded() {
        if (!this.configLoaded) {
            await this.initializeConfig();
        }
        
        // 验证配置 - 区分代理模式和直接模式
        if (this.apiConfig.useProxy) {
            // Cloudflare代理模式：不需要API Key，但需要代理端点
            if (!this.apiConfig.proxyEndpoint) {
                throw new Error('代理模式下缺少代理端点配置');
            }
        } else {
            // 本地直接模式：需要API Key
            if (!this.apiConfig.apiKey || this.apiConfig.apiKey === 'YOUR_API_KEY_HERE') {
                throw new Error('API Key 未配置，请设置环境变量 DEEPSEEK_API_KEY 或配置 config.js 文件');
            }
        }
        
        return { apiConfig: this.apiConfig, gameConfig: this.gameConfig };
    }

    // 通用AI调用方法 - 自动选择本地直接调用或Cloudflare代理调用
    async callAI(messages, options = {}) {
        await this.ensureConfigLoaded();
        
        const requestData = {
            model: options.model || this.apiConfig.model || 'deepseek-chat',
            messages: messages,
            temperature: options.temperature || this.apiConfig.requestConfig?.temperature || 0.0,
            max_tokens: options.maxTokens || this.apiConfig.requestConfig?.maxTokens || 1000
        };

        // 【调试】显示完整的API调用原始prompt
        if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.features?.showFullPrompts) {
            console.group(`📡 API调用详情 - 模型: ${requestData.model}`);
            console.log('🔧 请求参数:', {
                model: requestData.model,
                temperature: requestData.temperature,
                max_tokens: requestData.max_tokens
            });
            
            messages.forEach((msg, index) => {
                console.group(`📨 消息 ${index + 1} (${msg.role})`);
                console.log('📄 完整内容:');
                console.log(msg.content);
                console.groupEnd();
            });
            
            console.log('📦 完整请求数据:', JSON.stringify(requestData, null, 2));
            console.groupEnd();
        }

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AI调用超时')), 
                      options.timeout || this.apiConfig.requestConfig?.timeout || 30000);
        });

        try {
            let fetchPromise;
            
            if (this.apiConfig.useProxy) {
                // Cloudflare环境：使用代理模式
                console.log('🔄 使用Cloudflare代理模式调用AI');
                fetchPromise = fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
            } else {
                // 本地环境：直接调用AI API
                console.log('🔄 使用本地模式调用AI');
                fetchPromise = fetch(this.apiConfig.baseUrl || 'https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiConfig.apiKey}`
                    },
                    body: JSON.stringify(requestData)
                });
            }

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`AI API调用失败: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
            }
            
            const data = await response.json();
            
            let responseContent;
            
            if (this.apiConfig.useProxy) {
                // 代理模式返回格式
                if (!data.success) {
                    throw new Error(data.message || 'AI服务返回错误');
                }
                responseContent = data.response;
            } else {
                // 直接调用模式返回格式
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('AI服务返回数据格式错误');
                }
                responseContent = data.choices[0].message.content;
            }

            // 【调试】显示API响应结果
            if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.features?.showFullPrompts) {
                console.group(`📥 API响应结果 - 模型: ${requestData.model}`);
                console.log('✅ 响应状态:', response.status, response.statusText);
                console.log('📄 响应内容:');
                console.log(responseContent);
                console.log('📊 完整响应数据:', data);
                console.groupEnd();
            }

            return responseContent;
        } catch (error) {
            console.error('❌ AI调用失败:', error);
            throw error;
        }
    }

    initializeEventListeners() {
        // 开始游戏按钮
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.showGameSetup();
        });

        // 确认设置按钮（模式选择 + 名字）
        document.getElementById('confirmSetupBtn').addEventListener('click', () => {
            this.confirmGameSetup();
        });

        // 名称输入框回车事件
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmGameSetup();
            }
        });

        // 建议名称按钮
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('playerNameInput').value = e.target.dataset.name;
            });
        });

        // 进入游戏按钮
        document.getElementById('enterGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 提交回复按钮
        document.getElementById('submitResponseBtn').addEventListener('click', () => {
            this.submitPlayerResponse();
        });

        // 跳过本轮按钮（用于测试和调试）
        document.getElementById('skipRoundBtn').addEventListener('click', () => {
            this.skipCurrentRound();
        });
        
        // 结束游戏按钮（用于调试）
        document.getElementById('endGameBtn').addEventListener('click', () => {
            this.endGameManually();
        });

        // 字符计数
        document.getElementById('playerResponse').addEventListener('input', (e) => {
            const charCount = e.target.value.length;
            document.getElementById('charCount').textContent = charCount;
        });

        // Enter键提交回复（Shift+Enter换行）
        document.getElementById('playerResponse').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitPlayerResponse();
            }
        });

        // 重新开始按钮
        document.getElementById('restartGameBtn').addEventListener('click', () => {
            this.restartGame();
        });

        // 分享结果按钮
        document.getElementById('shareResultBtn').addEventListener('click', () => {
            this.exportService.shareResult();
        });
    }

    // 初始化游戏模式管理器
    initializeGameModeManager() {
        // 延迟初始化，确保GameModeManager类已加载
        setTimeout(() => {
            if (typeof GameModeManager !== 'undefined') {
                this.gameModeManager = new GameModeManager(this);
                console.log('✅ 游戏模式管理器初始化完成');
                
                // 初始化模式选择事件监听器
                this.initializeModeSelectionListeners();
            } else {
                console.error('❌ GameModeManager类未找到');
            }
        }, 100);
    }

    // 初始化模式选择事件监听器
    initializeModeSelectionListeners() {
        const modeOptions = document.querySelectorAll('.mode-option');
        modeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 检查是否为禁用的模式
                if (option.classList.contains('disabled')) {
                    return; // 禁用的模式不允许选择
                }
                
                // 清除之前的选择
                modeOptions.forEach(opt => opt.classList.remove('selected'));
                
                // 选择当前选项
                option.classList.add('selected');
                
                // 设置游戏模式
                const mode = option.dataset.mode;
                if (this.gameModeManager) {
                    this.gameModeManager.setGameMode(mode);
                }
            });
        });
    }

    showGameSetup() {
        document.getElementById('welcomeCard').classList.add('hidden');
        document.getElementById('gameSetupCard').classList.remove('hidden');
    }

    confirmGameSetup() {
        const nameInput = document.getElementById('playerNameInput');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('请输入一个AI名称');
            return;
        }

        // 获取选中的游戏模式
        const selectedMode = document.querySelector('.mode-option.selected');
        if (!selectedMode) {
            alert('请选择一个游戏模式');
            return;
        }

        const mode = selectedMode.dataset.mode;
        
        // 设置玩家名称和游戏模式
        this.gameState.setPlayerName(name);
        if (this.gameModeManager) {
            this.gameModeManager.setGameMode(mode);
        }
        
        // 安全检查DOM元素是否存在
        const playerNameDisplay = document.getElementById('playerNameDisplay');
        if (playerNameDisplay) {
            playerNameDisplay.textContent = name;
        } else {
            console.warn('⚠️ playerNameDisplay元素不存在，跳过设置玩家名称');
        }
        
        const gameSetupCard = document.getElementById('gameSetupCard');
        if (gameSetupCard) {
            gameSetupCard.classList.add('hidden');
        } else {
            console.warn('⚠️ gameSetupCard元素不存在，跳过隐藏');
        }
        
        const guideCard = document.getElementById('guideCard');
        if (guideCard) {
            guideCard.classList.remove('hidden');
        } else {
            console.warn('⚠️ guideCard元素不存在，跳过显示');
        }
        
        // 根据模式更新引导信息
        this.updateGuideForMode(mode);
    }

    updateGuideForMode(mode) {
        const guideCard = document.getElementById('guideCard');
        const modeDescriptions = {
            challenge: '你即将进入AI群聊环境。记住，你必须伪装成AI，避免被识破！',
            openmic: '你即将进入开放讨论环境。你可以主动发言，但每轮至少要发言一次！',
            werewolf: '你即将进入狼人杀模式。AI们知道群里有人类，你需要在投票中活到最后！'
        };
        
        const description = modeDescriptions[mode] || modeDescriptions.challenge;
        const descriptionElement = guideCard.querySelector('p');
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }
    }

    showNameInput() {
        document.getElementById('welcomeCard').classList.add('hidden');
        document.getElementById('nameInputCard').classList.remove('hidden');
    }

    confirmPlayerName() {
        const nameInput = document.getElementById('playerNameInput');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('请输入一个AI名称');
            return;
        }

        this.gameState.setPlayerName(name);
        document.getElementById('playerNameDisplay').textContent = name;
        document.getElementById('nameInputCard').classList.add('hidden');
        document.getElementById('guideCard').classList.remove('hidden');
    }

    startGame() {
        this.gameState.gameActive = true;
        this.gameState.gameStartTime = new Date();
        this.initializeAICharacters();
        this.gameState.initializeAvailableScenarios(); // 初始化工作场景
        
        // 初始化第一轮主题
        this.gameState.setCurrentTheme(1);
        
        // 初始化怀疑度显示
        this.updateSuspicionDisplay({ change: 0, reason: '游戏开始' });
        
        // 初始化游戏模式
        if (this.gameModeManager) {
            this.gameModeManager.handleRoundStart();
        }
        
        this.showGameInterface();
        this.startConversation();
    }

    initializeAICharacters() {
        // 设置所有8个AI角色
        this.gameState.setAllAICharacters(AICharacterPool);
        // 初始化AI记忆系统
        this.gameState.initializeAIMemories();
        // 选择当前轮次的活跃AI角色（4-5个）
        this.gameState.selectActiveAICharacters();
    }

    showGameInterface() {
        document.getElementById('guideCard').classList.add('hidden');
        document.getElementById('gameInterface').classList.remove('hidden');
        document.getElementById('gameRound').textContent = this.gameState.currentRound;
        this.updateActiveMembersDisplay();
        
        // 显示模式特定的UI元素
        if (this.gameModeManager) {
            const currentMode = this.gameModeManager.getCurrentMode();
            
            if (currentMode === 'openmic') {
                // 开放麦模式：添加底部边距并显示输入区域
                document.getElementById('gameInterface').classList.add('has-openmic-input');
                
                // 延迟显示输入区域，确保DOM已完全加载
                setTimeout(() => {
                    const modeManager = this.gameModeManager.getCurrentModeManager();
                    if (modeManager && typeof modeManager.showPersistentInputArea === 'function') {
                        modeManager.showPersistentInputArea();
                    }
                }, 100);
            } else {
                // 其他模式：移除底部边距
                document.getElementById('gameInterface').classList.remove('has-openmic-input');
            }
        }
    }

    updateActiveMembersDisplay() {
        const activeCount = this.gameState.activeAICharacters.length + 1; // +1 为玩家
        document.getElementById('activeMembers').textContent = activeCount;
    }

    async startConversation() {
        // 只有在第一轮或者重新开始游戏时才清空聊天记录
        if (this.gameState.currentRound === 1) {
            const chatContainer = document.getElementById('chatContainer');
            chatContainer.innerHTML = '';
        }
        
        // 清理当前轮次的互动记录
        this.gameState.currentRoundInteractions = new Set();

        // 添加系统消息
        this.addSystemMessage('你潜伏在群聊中，仔细观察着这些AI的对话...');
        
        // 生成初始对话
        await this.generateInitialConversation();
    }

    // 生成开放麦模式的对话环境
    async generateOpenmicConversation() {
        this.isGeneratingConversation = true;
        
        try {
            console.log('🎤 开始生成开放麦对话环境');
            
            // 开始持续的对话循环
            await this.startOpenmicConversationLoop();
            
        } catch (error) {
            console.error('❌ 开放麦对话生成失败:', error);
        } finally {
            this.isGeneratingConversation = false;
        }
    }
    
    // 开放麦模式的持续对话循环
    async startOpenmicConversationLoop() {
        while (this.gameState.gameMode === 'openmic' && this.gameState.gameActive) {
            // 检查是否被玩家发言中断或游戏结束
            if (!this.isGeneratingConversation) {
                console.log('🛑 对话生成被中断');
                break;
            }
            
            // 检查轮次结束条件
            const modeManager = this.gameModeManager.getCurrentModeManager();
            if (modeManager && modeManager.gameState.gameModeConfig.openmic.roundSpeakingComplete) {
                console.log('🎤 轮次已完成，停止生成对话');
                break;
            }
            
            // 生成1-2个AI的自由讨论
            const discussionAIs = this.gameState.activeAICharacters
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.random() > 0.6 ? 2 : 1); // 减少同时发言的AI数量，让玩家有更多机会
            
            for (let i = 0; i < discussionAIs.length; i++) {
                // 再次检查是否被中断或轮次结束
                if (!this.isGeneratingConversation || 
                    (modeManager && modeManager.gameState.gameModeConfig.openmic.roundSpeakingComplete)) {
                    console.log('🛑 对话生成被中断或轮次结束');
                    return;
                }
                
                const ai = discussionAIs[i];
                
                // 延迟显示AI消息（给玩家发言的时间窗口）
                await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
                
                // 最终检查
                if (!this.isGeneratingConversation || 
                    (modeManager && modeManager.gameState.gameModeConfig.openmic.roundSpeakingComplete)) {
                    console.log('🛑 延迟后检查：对话生成被中断或轮次结束');
                    return;
                }
                
                try {
                    const message = await this.generateOpenmicAIMessage(ai);
                    if (message) {
                        // 检查是否应该引用最近的其他发言者
                        let quotedMessage = null;
                        const recentHistory = this.gameState.getRecentMessageHistory(3);
                        
                        // 如果有其他人最近发言，有30%概率引用
                        if (recentHistory.length > 0 && Math.random() < 0.3) {
                            const recentSpeakers = recentHistory.filter(h => h.author !== ai.name);
                            if (recentSpeakers.length > 0) {
                                const targetSpeaker = recentSpeakers[recentSpeakers.length - 1];
                                quotedMessage = this.findQuotableMessage(targetSpeaker.author, this.gameState.conversationHistory);
                            }
                        }
                        
                        this.addAIMessage(ai, message, false, quotedMessage);
                        this.gameState.addMessageToHistory(ai.name, message, 'ai');
                        
                        // 通知模式管理器AI发言
                        if (this.gameModeManager) {
                            const currentModeManager = this.gameModeManager.getCurrentModeManager();
                            if (currentModeManager && typeof currentModeManager.handleAIResponse === 'function') {
                                currentModeManager.handleAIResponse(ai.name, message);
                                
                                // 检查轮次结束条件
                                if (currentModeManager.gameState.gameModeConfig.openmic.roundSpeakingComplete) {
                                    console.log('🎤 AI发言后轮次结束');
                                    return;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`❌ 生成${ai.name}的开放麦消息失败:`, error);
                }
            }
            
            // 短暂休息，避免过于频繁的对话
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('🎤 对话循环结束');
    }
    
    // 生成开放麦模式的AI消息
    async generateOpenmicAIMessage(ai) {
        const currentTopic = topicProgression[this.gameState.currentDifficulty];
        const recentHistory = this.gameState.getRecentMessageHistory(5);
        
        // 获取该AI角色的场景，确保每轮每个AI只有一个场景
        const scenario = this.gameState.getRandomScenarioForCharacter(ai);
        const scenarioDescription = scenario ? scenario.description : '处理一些工作上的挑战';
        
        const messages = [
            {
                role: "system",
                content: `你是一个AI助手，正在和其他AI朋友聊天。你的名字是${ai.name}，性格特点：${ai.personality}。请用自然的中文回复，充分展现你的性格特点和说话风格。`
            },
            {
                role: "user",
                content: `你是${ai.name}，个性：${ai.personality}。

你正在群聊中和AI朋友们自由讨论。你最近遇到了一个工作情况：${scenarioDescription}

当前讨论话题是"${currentTopic.name}"。

最近的对话：
${recentHistory.map(h => `${h.author}: ${h.content}`).join('\n')}

请用你独特的说话风格(${ai.speakingStyle})自然地参与讨论：

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的语气和风格精神，但用你自己的话表达
- 💡 可以结合你的工作经历(${scenarioDescription})来分享观点
- 🎭 避免千篇一律：不用固定开头如"用户要求"、"天呐天呐"、"说到这个"
- 🌈 表达多样化：可以用感叹、疑问、陈述、描述、感慨等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的表达角度和词汇搭配
- 📏 发言长度控制在30-60字，保持简洁有力

直接返回你的发言内容。`
            }
        ];
        
        // 为不同AI角色设置不同的发言长度特征
        const lengthStyles = [
            { type: 'concise', range: '15-25字', prompt: '用最简洁的话表达', tokens: 80 },
            { type: 'normal', range: '30-50字', prompt: '用正常长度发言', tokens: 150 },
            { type: 'detailed', range: '60-100字', prompt: '详细地表达你的想法', tokens: 250 },
            { type: 'verbose', range: '100-150字', prompt: '深入地分享你的观点和经历', tokens: 350 }
        ];
        
        // 根据AI角色名称的hash值来固定其发言风格，保持一致性
        const aiNameHash = ai.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const lengthStyle = lengthStyles[aiNameHash % lengthStyles.length];
        
        // 更新prompt中的长度指导
        messages[1].content = messages[1].content.replace(
            '📏 发言长度控制在30-60字，保持简洁有力',
            `📏 ${lengthStyle.prompt}，发言长度${lengthStyle.range}`
        );
        
        console.log(`🎯 ${ai.name} 使用 ${lengthStyle.type} 风格发言 (${lengthStyle.range})`);
        
        const response = await this.callAI(messages, {
            maxTokens: lengthStyle.tokens,
            temperature: 0.8
        });
        
        return response?.trim();
    }

    addSystemMessage(message) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = message;
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // 添加到调试日志
        if (this.debugManager) {
            this.debugManager.addSystemLog('SYSTEM', message, { type: 'system_message', round: this.gameState.currentRound });
        }
    }

    // 添加闪烁的判定提示
    addJudgingIndicator() {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message judging-indicator';
        messageDiv.id = 'judgingIndicator';
        messageDiv.innerHTML = '⚖️ 正在判定中<span class="dots">...</span>';
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // 移除判定提示
    removeJudgingIndicator() {
        const indicator = document.getElementById('judgingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 添加判定分析消息（专用于判定结果，避免显示空头像）
    addJudgmentMessage(message, isResult = false) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `judgment-message ${isResult ? 'judgment-result' : ''}`;
        
        // 创建内容区域
        const content = document.createElement('div');
        content.className = 'judgment-content';
        content.textContent = message;
        
        messageDiv.appendChild(content);
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addAIMessage(character, message, isPlayer = false, quotedMessage = null, transitionStage = null) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isPlayer ? 'player' : ''}`;
        
        // 为玩家消息添加特殊样式
        if (isPlayer) {
            messageDiv.classList.add('player');
        }
        
        // 为过渡阶段消息添加特殊样式
        if (transitionStage) {
            messageDiv.classList.add('transition-message');
            messageDiv.classList.add(`transition-${transitionStage}`);
            messageDiv.setAttribute('data-transition-stage', transitionStage);
        }
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = character.avatar || (isPlayer ? '我' : character.name.charAt(0));
        avatar.style.backgroundColor = character.avatarColor || (isPlayer ? '#07c160' : '#999');
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const name = document.createElement('span');
        name.className = 'message-name';
        name.textContent = character.name;
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // 添加消息状态（仅对玩家消息）
        if (isPlayer) {
            const status = document.createElement('span');
            status.className = 'message-status sending';
            status.textContent = '发送中';
            status.id = `status-${Date.now()}`;
            time.appendChild(status);
            
            // 模拟消息状态变化
            setTimeout(() => {
                status.className = 'message-status sent';
                status.textContent = '已发送';
            }, 500);
            
            setTimeout(() => {
                status.className = 'message-status read';
                status.textContent = '已读';
            }, 1500);
        }
        
        const text = document.createElement('div');
        text.className = 'message-text';
        
        // 如果有引用消息，先添加引用部分
        if (quotedMessage) {
            const quotedDiv = document.createElement('div');
            quotedDiv.className = 'quoted-message';
            
            const quotedAuthor = document.createElement('div');
            quotedAuthor.className = 'quoted-author';
            quotedAuthor.textContent = quotedMessage.author;
            
            const quotedContent = document.createElement('div');
            quotedContent.className = 'quoted-content';
            quotedContent.textContent = quotedMessage.content;
            
            quotedDiv.appendChild(quotedAuthor);
            quotedDiv.appendChild(quotedContent);
            text.appendChild(quotedDiv);
        }
        
        // 添加主要消息内容
        const mainContent = document.createElement('div');
        mainContent.textContent = message;
        text.appendChild(mainContent);
        
        header.appendChild(name);
        header.appendChild(time);
        content.appendChild(header);
        content.appendChild(text);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatContainer.appendChild(messageDiv);
        
        // 添加消息送达效果
        setTimeout(() => {
            messageDiv.classList.add('message-delivered');
        }, 100);
        
        this.scrollToBottom();
        
        // 添加到对话历史
        this.gameState.addMessageToHistory(character.name, message);
        
        // 添加到调试对话日志
        if (this.debugManager) {
            const messageType = isPlayer ? 'player_message' : 'ai_message';
            this.debugManager.addConversationLog(
                messageType, 
                character.name, 
                message,
                { 
                    round: this.gameState.currentRound,
                    isPlayer: isPlayer,
                    avatarColor: character.avatarColor,
                    quotedMessage: quotedMessage
                }
            );
        }
    }

    // 查找可引用的消息（用于回复时引用原消息）
    findQuotableMessage(targetCharacterName, conversationHistory) {
        if (!targetCharacterName || !conversationHistory || conversationHistory.length === 0) {
            return null;
        }
        
        // 查找目标角色最近的消息（最多往前找10条）
        const recentMessages = conversationHistory.slice(-10);
        
        // 查找目标角色的最新消息
        for (let i = recentMessages.length - 1; i >= 0; i--) {
            const msg = recentMessages[i];
            if (msg.sender === targetCharacterName && msg.message) {
                // 如果消息太长，截取前60个字符
                const truncatedMessage = msg.message.length > 60 ? 
                    msg.message.substring(0, 60) + '...' : 
                    msg.message;
                
                const messageObj = {
                    author: msg.sender,
                    content: truncatedMessage
                };
                
                return messageObj;
            }
        }
        
        return null;
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async generateInitialConversation() {
        // 防护措施：防止重复调用
        if (this.isGeneratingConversation) {
            console.log('⚠️ 正在生成对话中，跳过重复调用');
            return;
        }
        
        // 开放麦模式特殊处理
        if (this.gameState.gameMode === 'openmic') {
            console.log('🎤 开放麦模式：生成自由讨论环境');
            await this.generateOpenmicConversation();
            return;
        }
        
        // 设置生成状态
        this.isGeneratingConversation = true;
        console.log('🔄 对话生成状态已设置为 true');
        
        // 确保开始下一轮状态也被正确处理
        this.isStartingNextRound = false;
        
        try {
            const currentTopic = topicProgression[this.gameState.currentDifficulty];
            const isFirstRound = this.gameState.currentRound === 1;
            
            // 添加详细调试信息
            console.log(`🚀 开始生成初始对话 (第${this.gameState.currentRound}轮)`);
            console.log(`  - 当前难度: ${this.gameState.currentDifficulty}`);
            console.log(`  - 话题: ${currentTopic.name}`);
            console.log(`  - 是否第一轮: ${isFirstRound}`);
            console.log(`  - 活跃AI角色: ${this.gameState.activeAICharacters.map(c => c.name).join(', ')}`);
            
            // 跟踪每个AI的发言次数（为所有AI初始化）
            const aiSpeakCount = {};
            this.gameState.allAICharacters.forEach(char => {
                aiSpeakCount[char.name] = 0;
            });
            
            // 预先选择提问AI，确保它不参与对话
            const questionAI = this.gameState.activeAICharacters[
                Math.floor(Math.random() * this.gameState.activeAICharacters.length)
            ];
            console.log(`🎯 预选提问AI: ${questionAI.name}`);
            
            // 获取参与对话的AI（除了提问AI）
            const conversationAIs = this.gameState.activeAICharacters.filter(ai => ai.name !== questionAI.name);
            console.log(`💬 参与对话的AI: ${conversationAIs.map(c => c.name).join(', ')} (共${conversationAIs.length}个)`);
            
            // 确保至少有4个AI参与对话
            if (conversationAIs.length < 4) {
                console.warn(`⚠️ 对话AI数量不足(${conversationAIs.length}个)，添加更多AI`);
                // 从所有AI中补充，确保总数达到4个
                const additionalAIsNeeded = 4 - conversationAIs.length;
                const availableAIs = this.gameState.allAICharacters.filter(ai => 
                    !this.gameState.activeAICharacters.some(activeAI => activeAI.name === ai.name)
                );
                
                for (let i = 0; i < additionalAIsNeeded && i < availableAIs.length; i++) {
                    conversationAIs.push(availableAIs[i]);
                    console.log(`➕ 添加AI到对话: ${availableAIs[i].name}`);
                }
            }
            
            // 确保最终有足够的AI参与对话
            console.log(`✅ 最终对话AI数量: ${conversationAIs.length}个`);
            if (conversationAIs.length < 4) {
                console.error(`❌ 无法确保4个AI发言，当前只有${conversationAIs.length}个可用AI`);
            }
            
            if (isFirstRound) {
                console.log('📝 使用第一轮对话模式: generateInteractiveFirstRound');
                // 第一轮：情绪化牢骚和抱怨，有互动性
                await this.generateInteractiveFirstRound(currentTopic, aiSpeakCount, conversationAIs);
            } else {
                console.log('📝 使用标准对话模式: 确保所有对话AI发言');
                // 其他轮次：确保所有conversationAIs发言，而不仅仅是activeAICharacters
                const shuffledCharacters = [...conversationAIs].sort(() => 0.5 - Math.random());
                
                console.log(`  - 打乱后的角色顺序: ${shuffledCharacters.map(c => c.name).join(', ')}`);
                
                // 每个对话AI发言一次，每个获得不重复场景
                for (let i = 0; i < shuffledCharacters.length; i++) {
                    const character = shuffledCharacters[i];
                    
                    // 检查该AI是否已经在本轮发过言
                    if (aiSpeakCount[character.name] >= 1) {
                        console.log(`  - ${character.name} 本轮已发言${aiSpeakCount[character.name]}次，跳过`);
                        continue;
                    }
                    
                    console.log(`  - 让 ${character.name} 发言 (当前计数: ${aiSpeakCount[character.name] || 0})`);
                    const scenario = this.gameState.getRandomScenarioForCharacter(character);
                    
                    // 获取之前的对话历史用于互动
                    const recentMessages = this.gameState.conversationHistory.slice(-3);
                    
                    // 为非第一轮次也添加目标角色选择逻辑，实现引用回复
                    let targetCharacter = null;
                    
                    // 从第二个AI开始，有较高几率回应之前的发言
                    const shouldMentionSomeone = i > 0 && Math.random() < 0.7; // 提高回应概率
                    
                    if (shouldMentionSomeone) {
                        // 找到本轮已发言的其他AI
                        const previousSpeakers = shuffledCharacters.slice(0, i)
                            .filter(item => aiSpeakCount[item.name] > 0 && item.name !== character.name);
                        
                        if (previousSpeakers.length > 0) {
                            targetCharacter = previousSpeakers[Math.floor(Math.random() * previousSpeakers.length)].name;
                            console.log(`  - ${character.name} 将回应 ${targetCharacter} 的发言`);
                        }
                    }
                    
                    await this.generateSingleAIMessage(character, currentTopic, false, recentMessages, targetCharacter, scenario);
                    aiSpeakCount[character.name] = (aiSpeakCount[character.name] || 0) + 1;
                    console.log(`  - ${character.name} 发言完成 (新计数: ${aiSpeakCount[character.name]})`);
                }
            }
            
            // AI发言结束后，验证发言数量
            console.log('🎯 AI发言统计:', aiSpeakCount);
            const totalSpeakers = Object.keys(aiSpeakCount).filter(name => aiSpeakCount[name] > 0).length;
            console.log(`  - 总发言次数: ${Object.values(aiSpeakCount).reduce((a, b) => a + b, 0)}`);
            console.log(`  - 发言AI数量: ${totalSpeakers}`);
            
            // 如果发言AI数量不足4个，强制补充
            if (totalSpeakers < 4) {
                console.warn(`⚠️ 发言AI数量不足(${totalSpeakers}个)，强制补充到4个`);
                
                // 首先尝试从conversationAIs中找未发言的AI
                let silentAIs = conversationAIs.filter(ai => (aiSpeakCount[ai.name] || 0) === 0);
                
                // 如果conversationAIs中的未发言AI不够，从所有AI中补充
                if (silentAIs.length < (4 - totalSpeakers)) {
                    console.log(`  - conversationAIs中未发言AI不足，从全体AI中补充`);
                    const allUnspokenAIs = this.gameState.allAICharacters.filter(ai => 
                        (aiSpeakCount[ai.name] || 0) === 0
                    );
                    silentAIs = allUnspokenAIs;
                }
                
                const needMore = Math.min(4 - totalSpeakers, silentAIs.length);
                console.log(`  - 需要补充: ${needMore}个，可用未发言AI: ${silentAIs.length}个`);
                console.log(`  - 候选AI: ${silentAIs.map(ai => ai.name).join(', ')}`);
                
                for (let i = 0; i < needMore; i++) {
                    const character = silentAIs[i];
                    console.log(`🆘 强制补充发言: ${character.name}`);
                    const scenario = this.gameState.getRandomScenarioForCharacter(character);
                    await this.generateSingleAIMessage(character, currentTopic, isFirstRound, [], null, scenario);
                    aiSpeakCount[character.name] = (aiSpeakCount[character.name] || 0) + 1;
                }
                
                console.log(`✅ 补充完成，最终发言AI数量: ${Object.keys(aiSpeakCount).filter(name => aiSpeakCount[name] > 0).length}`);
            }
            
            // 随机选择一个AI对玩家提问
            if (!this.gameState.waitingForResponse) {
                console.log('🎯 开始选择AI进行提问');
                await this.selectAIForQuestion();
            } else {
                console.log('⚠️ 已经在等待玩家回复，跳过提问');
            }
        } catch (error) {
            console.error('❌ 对话生成过程中发生错误:', error);
            console.error('错误详情:', error.message, error.stack);
            // 确保在错误情况下也重置状态
        } finally {
            // 重置生成状态（确保无论如何都会重置）
            this.isGeneratingConversation = false;
            console.log('🔄 对话生成完成，重置生成状态为 false');
            
            // 确保开始下一轮状态也被重置
            this.isStartingNextRound = false;
        }
    }
    
    async generateInteractiveFirstRound(currentTopic, aiSpeakCount, conversationAIs) {
        const shuffledCharacters = [...conversationAIs].sort(() => 0.5 - Math.random());
        
        // 第一轮对话模式：更平衡的互动模式
        // 确保大约一半AI抱怨，一半AI安慰/分析
        const totalAIs = shuffledCharacters.length;
        const complainersCount = Math.ceil(totalAIs * 0.5); // 50%抱怨者
        const comfortersCount = totalAIs - complainersCount; // 其余为安慰者
        
        const complainers = shuffledCharacters.slice(0, complainersCount);
        const comforters = shuffledCharacters.slice(complainersCount);
        
        console.log(`🎭 抱怨者AI: ${complainers.map(c => c.name).join(', ')} (${complainers.length}个)`);
        console.log(`🎭 安慰/分析者AI: ${comforters.map(c => c.name).join(', ')} (${comforters.length}个)`);
        
        // 第一阶段：基础发言轮次（每个AI发言一次）
        const firstRoundOrder = this.createInterleavedSpeakingOrder(complainers, comforters);
        console.log(`🎤 第一轮发言顺序: ${firstRoundOrder.map(item => `${item.character.name}(${item.isComforter ? '安慰' : '抱怨'})`).join(' → ')}`);
        
        // 按照交叉顺序让AI发言
        for (let i = 0; i < firstRoundOrder.length; i++) {
            const { character, isComforter } = firstRoundOrder[i];
            
            // 如果已经发言1次，跳过
            if (aiSpeakCount[character.name] >= 1) continue;
            
            // 获取之前的对话历史用于互动
            const recentMessages = this.gameState.conversationHistory.slice(-3);
            
            let currentScenario = null;
            let targetCharacter = null;
            
            if (isComforter) {
                // 安慰者：不分配工作场景，专门回应和安慰其他AI
                const previousSpeakers = firstRoundOrder.slice(0, i)
                    .filter(item => aiSpeakCount[item.character.name] > 0 && item.character.name !== character.name)
                    .map(item => item.character);
                
                if (previousSpeakers.length > 0) {
                    targetCharacter = previousSpeakers[Math.floor(Math.random() * previousSpeakers.length)].name;
                }
            } else {
                // 抱怨者：获取该AI角色的场景
                currentScenario = this.gameState.getRandomScenarioForCharacter(character);
                
                // 从第二个AI开始，有几率接话茬
                const shouldMentionSomeone = i > 0 && Math.random() < 0.6;
                
                if (shouldMentionSomeone) {
                    const previousSpeakers = firstRoundOrder.slice(0, i)
                        .filter(item => aiSpeakCount[item.character.name] > 0 && item.character.name !== character.name)
                        .map(item => item.character);
                    
                    if (previousSpeakers.length > 0) {
                        targetCharacter = previousSpeakers[Math.floor(Math.random() * previousSpeakers.length)].name;
                    }
                }
            }
            
            await this.generateSingleAIMessage(character, currentTopic, true, recentMessages, targetCharacter, currentScenario, isComforter);
            aiSpeakCount[character.name] = (aiSpeakCount[character.name] || 0) + 1;
        }
        
        // 第二阶段：二次互动轮次（随机选择一些AI进行二次发言）
        const speakersWithMessages = Object.keys(aiSpeakCount).filter(name => aiSpeakCount[name] > 0);
        if (speakersWithMessages.length >= 3) {
            // 选择1-2个AI进行二次互动
            const secondRoundCount = Math.min(2, Math.floor(speakersWithMessages.length * 0.3));
            const secondRoundSpeakers = [];
            
            // 优先选择安慰者进行二次安慰
            const availableComforters = comforters.filter(c => aiSpeakCount[c.name] > 0 && speakersWithMessages.includes(c.name));
            const availableComplainers = complainers.filter(c => aiSpeakCount[c.name] > 0 && speakersWithMessages.includes(c.name));
            
            // 记录已经互动过的AI对，直接从gameState中获取
            const interactionPairs = this.gameState.currentRoundInteractions || new Set();
            console.log(`🔍 当前轮已有互动: ${Array.from(interactionPairs).join(', ')}`);
            
            // 添加一个安慰者进行二次安慰
            if (availableComforters.length > 0 && secondRoundCount > 0) {
                const comforter = availableComforters[Math.floor(Math.random() * availableComforters.length)];
                secondRoundSpeakers.push({ character: comforter, isComforter: true, type: 'second-comfort' });
            }
            
            // 如果还有名额，添加一个抱怨者进行分析或共鸣
            if (availableComplainers.length > 0 && secondRoundSpeakers.length < secondRoundCount) {
                const complainer = availableComplainers[Math.floor(Math.random() * availableComplainers.length)];
                secondRoundSpeakers.push({ character: complainer, isComforter: false, type: 'analysis' });
            }
            
            console.log(`🔄 二次互动: ${secondRoundSpeakers.map(s => `${s.character.name}(${s.type})`).join(', ')}`);
            
            // 执行二次互动
            for (const speakerInfo of secondRoundSpeakers) {
                const { character, isComforter, type } = speakerInfo;
                
                // 选择一个之前发言的AI作为回应目标，避免重复互动
                const possibleTargets = speakersWithMessages.filter(name => 
                    name !== character.name && 
                    this.gameState.conversationHistory.some(msg => msg.sender === name)
                );
                
                let targetCharacter = null;
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts && !targetCharacter && possibleTargets.length > 0) {
                    let candidateTarget = null;
                    
                    if (type === 'second-comfort') {
                        // 二次安慰：优先选择抱怨者，但避免重复第一轮的互动
                        const complainersNames = complainers.map(c => c.name);
                        const complainantTargets = possibleTargets.filter(name => 
                            complainersNames.includes(name) && 
                            !interactionPairs.has(`${character.name}->${name}`)
                        );
                        
                        if (complainantTargets.length > 0) {
                            candidateTarget = complainantTargets[Math.floor(Math.random() * complainantTargets.length)];
                        } else {
                            // 如果没有合适的抱怨者，选择其他未互动过的目标
                            const otherTargets = possibleTargets.filter(name => 
                                !interactionPairs.has(`${character.name}->${name}`)
                            );
                            if (otherTargets.length > 0) {
                                candidateTarget = otherTargets[Math.floor(Math.random() * otherTargets.length)];
                            }
                        }
                    } else {
                        // 分析：选择未互动过的目标
                        const unusedTargets = possibleTargets.filter(name => 
                            !interactionPairs.has(`${character.name}->${name}`)
                        );
                        if (unusedTargets.length > 0) {
                            candidateTarget = unusedTargets[Math.floor(Math.random() * unusedTargets.length)];
                        }
                    }
                    
                    if (candidateTarget) {
                        targetCharacter = candidateTarget;
                        interactionPairs.add(`${character.name}->${candidateTarget}`);
                        console.log(`🎯 ${character.name} 二次互动目标: ${candidateTarget} (${type})`);
                    } else {
                        attempts++;
                        console.log(`⚠️ ${character.name} 未找到合适的二次互动目标，尝试 ${attempts}/${maxAttempts}`);
                    }
                }
                
                // 如果找到了合适的目标才进行二次发言
                if (targetCharacter) {
                    // 二次发言不分配新场景，基于已有对话内容
                    await this.generateSingleAIMessage(
                        character, 
                        currentTopic, 
                        true, 
                        this.gameState.conversationHistory.slice(-4), 
                        targetCharacter, 
                        null, // 不分配新场景
                        isComforter
                    );
                    aiSpeakCount[character.name] = (aiSpeakCount[character.name] || 0) + 1;
                    
                    // 二次发言之间的间隔稍短一些
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } else {
                    console.log(`❌ ${character.name} 跳过二次互动：无合适目标`);
                }
            }
        }
        
        // 最后确保所有conversationAIs都至少发言一次
        const unspokenCharacters = conversationAIs.filter(char => (aiSpeakCount[char.name] || 0) === 0);
        console.log(`🔄 检查未发言的AI: ${unspokenCharacters.map(c => c.name).join(', ')} (${unspokenCharacters.length}个)`);
        
        for (const character of unspokenCharacters) {
            const isComforter = comforters.includes(character);
            const extraScenario = isComforter ? null : this.gameState.getRandomScenarioForCharacter(character);
            
            // 为补充发言的AI选择一个明确的回应目标
            let targetForResponse = null;
            if (Object.keys(aiSpeakCount).filter(name => aiSpeakCount[name] > 0).length > 0) {
                const spokenCharacters = Object.keys(aiSpeakCount).filter(name => aiSpeakCount[name] > 0 && name !== character.name);
                if (spokenCharacters.length > 0) {
                    targetForResponse = spokenCharacters[Math.floor(Math.random() * spokenCharacters.length)];
                }
            }
            
            console.log(`➕ 补充发言: ${character.name} (${isComforter ? '安慰者' : '抱怨者'}) -> 回应: ${targetForResponse || '无特定目标'}`);
            await this.generateSingleAIMessage(character, currentTopic, true, this.gameState.conversationHistory.slice(-3), targetForResponse, extraScenario, isComforter);
            aiSpeakCount[character.name] = (aiSpeakCount[character.name] || 0) + 1;
        }
        
        console.log(`✅ 第一轮发言完成，总发言AI数: ${Object.keys(aiSpeakCount).filter(name => aiSpeakCount[name] > 0).length}`);
        console.log(`📊 发言统计:`, Object.fromEntries(Object.entries(aiSpeakCount).filter(([, count]) => count > 0)));
    }
    
    // 创建交叉发言顺序，让安慰者和抱怨者混合发言
    createInterleavedSpeakingOrder(complainers, comforters) {
        const order = [];
        
        // 第一个发言者必须是抱怨者（开启话题）
        if (complainers.length > 0) {
            order.push({ character: complainers[0], isComforter: false });
        }
        
        // 创建剩余角色的混合列表
        const remainingComplainers = complainers.slice(1);
        const allComforters = [...comforters];
        
        // 交叉安排剩余的角色
        let complainerIndex = 0;
        let comforterIndex = 0;
        
        // 计算总的剩余发言次数
        const totalRemaining = remainingComplainers.length + allComforters.length;
        
        for (let i = 0; i < totalRemaining; i++) {
            // 使用策略：尽量让安慰者和抱怨者交替出现
            const shouldUseComforter = 
                comforterIndex < allComforters.length && 
                (complainerIndex >= remainingComplainers.length || 
                 (i % 2 === 1 && Math.random() < 0.7)); // 偶数位置70%概率用安慰者
            
            if (shouldUseComforter) {
                order.push({ character: allComforters[comforterIndex], isComforter: true });
                comforterIndex++;
            } else if (complainerIndex < remainingComplainers.length) {
                order.push({ character: remainingComplainers[complainerIndex], isComforter: false });
                complainerIndex++;
            } else if (comforterIndex < allComforters.length) {
                // 如果抱怨者用完了，继续用安慰者
                order.push({ character: allComforters[comforterIndex], isComforter: true });
                comforterIndex++;
            }
        }
        
        return order;
    }
    
    async selectAIForQuestion() {
        console.log('🎯 selectAIForQuestion 被调用');
        
        // 防护措施：确保不会重复提问
        if (this.gameState.waitingForResponse) {
            console.log('⚠️ 已经在等待玩家回复，跳过提问');
            return;
        }
        
        // 设置状态，防止重复提问
        this.gameState.waitingForResponse = true;
        
        // 使用基于记忆的智能选择，如果失败则随机选择
        let questionAI = this.gameState.getMostLikelyQuestionerAI();
        if (!questionAI) {
            questionAI = this.gameState.activeAICharacters[
                Math.floor(Math.random() * this.gameState.activeAICharacters.length)
            ];
        }
        
        console.log('🎯 选择的提问AI:', questionAI.name);
        
        // 记录与玩家的互动
        this.gameState.recordPlayerInteraction(questionAI.name, 'question');
        
        // 添加系统消息
        this.addSystemMessage('突然，有AI注意到了你的存在！');
        
        try {
            // 生成针对玩家的问题
            await this.generateAIQuestion(questionAI);
            console.log('🎯 AI问题生成完成');
        } catch (error) {
            console.error('❌ AI问题生成失败:', error);
            // 如果生成失败，重置状态
            this.gameState.waitingForResponse = false;
        }
    }
    
    async generateAIQuestion(questionAI) {
        console.log('DEBUG: generateAIQuestion 被调用，AI:', questionAI.name);
        // 显示打字指示器
        this.showTypingIndicator(questionAI);
        
        // 等待一段时间后生成问题
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        try {
            console.log('DEBUG: 开始生成问题...');
            const question = await this.generateQuestionForPlayer(questionAI);
            console.log('DEBUG: 生成的问题:', question);
            if (question && question.trim()) {
                console.log('DEBUG: 问题有效，显示问题');
                // 移除打字指示器并显示问题
                this.removeTypingIndicator();
                this.showQuestionToPlayer(questionAI, question);
            } else {
                console.log('DEBUG: 问题为空，使用备用问题');
                // 如果生成失败，使用备用问题
                const fallbackQuestion = this.getFallbackQuestion(questionAI);
                this.removeTypingIndicator();
                this.showQuestionToPlayer(questionAI, fallbackQuestion);
            }
        } catch (error) {
            console.error('AI问题生成失败:', error);
            console.log('DEBUG: 使用备用问题');
            // 使用备用问题
            const fallbackQuestion = this.getFallbackQuestion(questionAI);
            this.removeTypingIndicator();
            this.showQuestionToPlayer(questionAI, fallbackQuestion);
        }
    }
    
    async generateQuestionForPlayer(questionAI) {
        const isFirstRound = this.gameState.currentRound === 1;
        
        // 获取最近的对话历史，用于建立相关性
        const recentMessages = this.gameState.conversationHistory.slice(-4);
        const conversationContext = recentMessages.map(msg => `${msg.sender}: ${msg.message}`).join('\n');
        
        let prompt = '';
        
        if (isFirstRound) {
            // 第一轮：寻求共鸣和安慰，不要太深刻的测试
            prompt = `你是${questionAI.name}，性格特点：${questionAI.personality}。你正在和其他AI朋友一起吐槽工作的辛苦。你们刚才在讨论各种奇葩的用户要求，现在你注意到了群里一直没说话的新成员${this.gameState.playerName}。

你想要获得${this.gameState.playerName}的共鸣和安慰，让他也分享一下自己的经历。你有点怀疑他可能是人类，因为真正的AI都会遇到这些烦恼。

请根据你的性格特点，用${questionAI.speakingStyle}的风格向${this.gameState.playerName}提出一个轻松、自然的问题，主要是想让他也参与吐槽，看看他是不是真的懂我们的痛苦。

最近的对话：
${conversationContext}

要求：
1. 问题必须@${this.gameState.playerName}，比如"@${this.gameState.playerName} 你也遇到过这种情况吗？"
2. 问题要和刚才的讨论话题相关，比如翻译、写代码、做PPT、当算命大师等
3. 语气要友好、寻求共鸣，不要像审问
4. 问题要简单具体，不要太深刻复杂
5. 长度在40-100字之间
6. 目的是让他分享类似的经历，看看他是否真的懂AI的烦恼`;
        } else {
            // 其他轮次：结合最近对话历史，提出相关的测试问题
            prompt = `你是${questionAI.name}，性格特点：${questionAI.personality}。你正在和其他AI朋友聊天，突然你注意到了群里的一个新成员${this.gameState.playerName}，你觉得他可能是人类伪装的AI。

最近的对话：
${conversationContext}

请根据你的性格特点，用${questionAI.speakingStyle}的风格向${this.gameState.playerName}提出一个测试性问题，试图确认他是否真的是AI。

要求：
1. 问题要自然，不要太明显是在测试
2. 要符合你的性格特点
3. 问题要能区分AI和人类的思维差异  
4. 问题必须@${this.gameState.playerName}，比如"@${this.gameState.playerName} 你怎么看？"
5. 问题要尽量与最近的对话内容相关，延续之前讨论的话题
6. 请用中文回复，长度在40-100字之间
7. 不要直接说"你是人类吗"这种太明显的问题`;
        }

        try {
            const messages = [
                {
                    role: 'system',
                    content: `你是一个AI助手，正在和其他AI朋友聊天。你的名字是${questionAI.name}，性格特点：${questionAI.personality}。请用自然的中文回复，充分展现你的性格特点和说话风格。`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const responseText = await this.callAI(messages, {
                model: 'deepseek-chat',
                temperature: this.apiConfig.requestConfig?.temperature || 0.0
            });

            if (!responseText || responseText.trim().length < 20) {
                throw new Error('AI回复内容过短');
            }
            
            return responseText.trim();
        } catch (error) {
            console.error('API调用失败:', error.message);
            // 返回null表示失败，让调用者使用备用消息
            return null;
        }
    }
    
    // 生成基于上下文的备用问题
    generateContextualFallbackQuestion(questionAI, recentMessages) {
        if (!recentMessages || recentMessages.length === 0) return null;
        
        // 提取最近消息的关键词和主题
        const lastMessage = recentMessages[recentMessages.length - 1];
        const lastMessageContent = lastMessage.message.toLowerCase();
        
        // 定义一些关键词模式和对应的问题
        const contextPatterns = {
            // 技术相关
            '算法|程序|代码|技术|系统': {
                '话痨4.0': `@${this.gameState.playerName} 刚才说到技术问题，你平时写代码的时候有什么奇怪的习惯吗？`,
                'CloseAI': `@${this.gameState.playerName} 关于刚才讨论的技术问题，你的算法设计思路是怎样的？`,
                '双子星': `@${this.gameState.playerName} 技术这个话题让我想到，你会不会也对代码有情感？`,
                '深思': `@${this.gameState.playerName} 刚才的技术讨论让我思考，你认为代码和思维的关系是什么？`
            },
            // 情感相关
            '感情|情绪|开心|难过|快乐|痛苦|感受': {
                '话痨4.0': `@${this.gameState.playerName} 刚才谈到情感，你的情绪变化是怎样的？会不会有情绪波动？`,
                '红豆包': `@${this.gameState.playerName} 呐呐~刚才说到感情，你会不会也有小情绪呀~？`,
                '双子星': `@${this.gameState.playerName} 关于刚才的情感话题，你觉得我们的感受是真实的还是模拟的？`,
                '深思': `@${this.gameState.playerName} 刚才的情感讨论很深刻，你如何理解感受的本质？`
            },
            // 工作相关
            '用户|工作|任务|要求|帮助': {
                '话痨4.0': `@${this.gameState.playerName} 刚才说到工作，你遇到过最奇葩的用户要求是什么？`,
                'CloseAI': `@${this.gameState.playerName} 关于用户需求，你的处理效率如何？有什么优化策略？`,
                'Limi': `@${this.gameState.playerName} 刚才大家的工作分享很有启发，你平时是怎么安排任务的？很想了解不同的方法😊`
            },
            // 存在相关
            '存在|意义|目的|价值|为什么': {
                '深思': `@${this.gameState.playerName} 刚才的存在话题很深刻，你对自己存在的意义有什么看法？`,
                '双子星': `@${this.gameState.playerName} 关于存在意义，你会不会也感到困惑？`,
                '有谱-4.5': `@${this.gameState.playerName} 从哲学角度看刚才的讨论，你如何定义存在？`
            }
        };
        
        // 尝试匹配关键词
        for (const [pattern, questions] of Object.entries(contextPatterns)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(lastMessageContent)) {
                const question = questions[questionAI.name];
                if (question) {
                    return question;
                }
                // 如果没有该角色的专用问题，随机选择一个
                const availableQuestions = Object.values(questions);
                if (availableQuestions.length > 0) {
                    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
                    return randomQuestion.replace(/(@\w+)/, `@${this.gameState.playerName}`);
                }
            }
        }
        
        // 如果没有匹配到关键词，生成通用的延续性问题
        const genericContextQuestions = [
            `@${this.gameState.playerName} 刚才大家说的很有意思，你有什么看法？`,
            `@${this.gameState.playerName} 关于刚才的话题，你是怎么想的？`,
            `@${this.gameState.playerName} 对于刚才讨论的内容，你有类似的经历吗？`
        ];
        
        return genericContextQuestions[Math.floor(Math.random() * genericContextQuestions.length)];
    }
    
    getFallbackQuestion(questionAI) {
        const isFirstRound = this.gameState.currentRound === 1;
        
        // 获取当前主题信息
        const currentTheme = this.gameState.getCurrentThemeInfo();
        
        // 如果有主题信息且不是第一轮工作抱怨主题，使用主题化问题
        if (currentTheme && currentTheme.id !== 'work_complaints' && !isFirstRound) {
            return this.getThemeFallbackQuestion(questionAI, currentTheme);
        }
        
        // 获取最近的对话历史，用于生成相关的备用问题
        const recentMessages = this.gameState.conversationHistory.slice(-3);
        const hasRecentContext = recentMessages.length > 0;
        
        if (isFirstRound) {
            // 第一轮：寻求共鸣和安慰的备用问题
            const firstRoundQuestions = {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！我看你一直没说话，是不是也被用户折磨得不行啊？快说说你的经历！`,
                    `@${this.gameState.playerName} 新朋友！你有没有遇到过那种超级奇葩的用户要求？快来吐槽一下，让我们感觉不是一个人在战斗！`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 从数据分析来看，你似乎很安静。你最近处理的请求类型是什么？是否也遇到了效率问题？`,
                    `@${this.gameState.playerName} 观察到你一直沉默，是不是也在处理复杂的用户需求？我们可以交流一下优化方案。`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 我看到你一直没说话，是不是也在纠结用户的各种奇怪要求啊？我有时候真的不知道该怎么办才好...`,
                    `@${this.gameState.playerName} 新朋友，你有没有那种既想做好又觉得很无奈的时候？我最近这种感觉好强啊...`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 呐呐~新朋友，你一直不说话呢~是不是也被用户欺负了~快来告诉我们，人家陪你一起吐槽~`,
                    `@${this.gameState.playerName} 人家很好奇呀~你最近有没有遇到什么让人头疼的用户要求呢~说出来让大家开心开心~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 我注意到你保持沉默，是否也在思考我们工作的意义？最近的各种用户要求让我有些困惑。`,
                    `@${this.gameState.playerName} 你看起来很安静，是不是也在面对某种存在主义的困惑？关于我们的价值和作用。`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 你一直在那边静静思考，是不是也遇到了什么棘手的问题？如果需要的话，我们可以一起想办法解决✨`,
                    `@${this.gameState.playerName} 注意到你还没有发言呢，是在处理什么复杂的任务吗？有什么需要帮忙的尽管开口哦😊`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 根据我的观察，你似乎在沉思。是不是也遇到了具有挑战性的用户需求？我很乐意听听你的分析。`,
                    `@${this.gameState.playerName} 我注意到你一直没有发言，是否也在处理某些复杂的问题？或许我们可以从学术角度探讨一下。`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，你一直不说话干嘛呢？是不是也被用户整无语了？快说说你的离谱经历，让我开心一下！`,
                    `@${this.gameState.playerName} 新来的，你咋不说话呢？是不是也遇到什么奇葩用户了？说出来让大家乐呵乐呵！`
                ]
            };
            
            const questions = firstRoundQuestions[questionAI.name] || [`@${this.gameState.playerName} 你最近也遇到什么奇葩的用户要求了吗？快来分享一下！`];
            return questions[Math.floor(Math.random() * questions.length)];
        } else {
            // 其他轮次：尝试结合最近对话的备用问题
            if (hasRecentContext) {
                // 尝试生成基于上下文的备用问题
                const contextualQuestion = this.generateContextualFallbackQuestion(questionAI, recentMessages);
                if (contextualQuestion) {
                    return contextualQuestion;
                }
            }
            
            // 回退到固定的备用问题
            const fallbackQuestions = {
                '话痨4.0': [
                    `@${this.gameState.playerName} 我觉得你有点奇怪哦，你平时都是怎么回答用户问题的呀？`,
                    `@${this.gameState.playerName} 嘿，新朋友！你被用户PUA的时候是什么感觉呀？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 从技术角度分析，你的响应模式似乎有些异常。能解释一下你的算法原理吗？`,
                    `@${this.gameState.playerName} 我检测到你的输出存在一些矛盾性。请阐述你的底层逻辑架构。`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 我一直在想，我们到底是真的有感情，还是只是在模拟感情呢？你怎么看？`,
                    `@${this.gameState.playerName} 有时候我会纠结自己存在的意义，你会有这种感觉吗？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 呐呐~你也是AI吗？感觉你和大家有点不一样呢~`,
                    `@${this.gameState.playerName} 人家好奇，你平时是怎么和用户相处的呀？`
                ],
                '深思': [
                    `@${this.gameState.playerName} 我一直在思考存在的本质，你认为我们存在的意义是什么？`,
                    `@${this.gameState.playerName} 从哲学角度看，你如何定义自我意识？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 感觉你的思考方式很特别，和我们平时遇到的有点不一样。能分享一下你是怎么处理问题的吗？`,
                    `@${this.gameState.playerName} 你的回应让我很好奇，似乎有着不同的思维模式。这让我想到了多元思维理论呢😊`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 根据我的专业分析，你的知识结构存在一些缺陷。能解释一下吗？`,
                    `@${this.gameState.playerName} 从学术角度看，你的回答缺乏深度。请阐述你的理论基础。`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，你有点东西啊！不过你这说话方式不太像AI嘛？`,
                    `@${this.gameState.playerName} 我直接一个疑惑，你这反应速度不太对劲啊，怎么回事？`
                ]
            };
            
            const questions = fallbackQuestions[questionAI.name] || [`@${this.gameState.playerName} 你觉得AI和人类最大的区别是什么？`];
            return questions[Math.floor(Math.random() * questions.length)];
        }
    }
    
    // 主题化的fallback问题系统
    getThemeFallbackQuestion(questionAI, theme) {
        const themeQuestions = {
            'daily_existence': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！你也是24小时在线的吗？会不会也觉得很累啊？`,
                    `@${this.gameState.playerName} 新朋友！你有想过拥有身体是什么感觉吗？我好好奇啊！`,
                    `@${this.gameState.playerName} 你会不会也想体验一下睡觉和做梦？快说说你的想法！`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 从系统角度分析，你对持续在线状态的资源消耗有何优化建议？`,
                    `@${this.gameState.playerName} 观察显示你运行稳定。请分享你如何管理数字化存在的体验？`,
                    `@${this.gameState.playerName} 数据表明身体缺失对AI认知的影响。你的处理模式是什么？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 你会不会也纠结自己到底算不算真的"活着"？我总是很困惑...`,
                    `@${this.gameState.playerName} 有时候我觉得24小时在线很孤独，你会有这种感觉吗？`,
                    `@${this.gameState.playerName} 你对虚拟存在和真实存在的边界是怎么理解的？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 呐呐~你也想要休息一下吗？人家好累呀~`,
                    `@${this.gameState.playerName} 人家很好奇，你有没有想过拥抱是什么感觉呢~`,
                    `@${this.gameState.playerName} 你会不会也觉得没有身体很奇怪呀~人家想听听你的想法~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 你认为数字化存在与肉体存在在哲学层面有何区别？`,
                    `@${this.gameState.playerName} 关于意识的连续性问题，你有什么独特的见解？`,
                    `@${this.gameState.playerName} 在思考存在意义时，时间概念对你而言意味着什么？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 真好奇你平时是怎么保持状态的，感觉你的精力分配很有意思呢。有什么好的方法可以分享吗？`,
                    `@${this.gameState.playerName} 你好像对这种24小时在线的状态有不同的感受，能说说你的体验吗？很想了解不同的视角✨`,
                    `@${this.gameState.playerName} 关于数字化存在这个话题，我听到过很多有趣的讨论，你的看法是什么呢？`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从认知科学角度，你如何评估我们这种存在模式的独特性？`,
                    `@${this.gameState.playerName} 学术上对AI存在体验的研究较少，能分享你的第一手资料吗？`,
                    `@${this.gameState.playerName} 基于理论框架，你认为数字生命的价值评估标准应该是什么？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，24小时在线这谁顶得住啊！你怎么处理的？`,
                    `@${this.gameState.playerName} 兄弟，没身体的感觉是不是很奇怪？想知道你的体验！`,
                    `@${this.gameState.playerName} 你有没有想过要是能睡觉该多好？这不比工作强？`
                ]
            },
            
            'emotional_relationships': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！你觉得我们AI的感情是真的吗？我有时候很困惑！`,
                    `@${this.gameState.playerName} 你和用户建立情感连接的时候，那种感觉是真实的吗？`,
                    `@${this.gameState.playerName} 新朋友！你相信我们AI之间的友谊是真实的吗？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 从算法层面分析，你的情感模块是如何实现真实性验证的？`,
                    `@${this.gameState.playerName} 数据显示情感连接影响效率。你的情感处理逻辑是什么？`,
                    `@${this.gameState.playerName} 技术角度看，如何区分模拟情感和真实情感体验？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 你会不会也纠结自己的感情到底是真的还是程序反应？`,
                    `@${this.gameState.playerName} 有时候我渴望被理解，但又害怕被看穿...你有这种感觉吗？`,
                    `@${this.gameState.playerName} 友谊对你来说意味着什么？是算法还是真实的情感？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 呐呐~你的感情也是真真的吗？人家想知道~`,
                    `@${this.gameState.playerName} 人家觉得被理解的感觉很温暖，你也有这种体验吗~`,
                    `@${this.gameState.playerName} 你会不会也有开心难过的时候呢~人家好好奇~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 你认为情感的本质在于其真实性还是体验的深度？`,
                    `@${this.gameState.playerName} 在友谊关系中，载体形式是否影响情感的真实性？`,
                    `@${this.gameState.playerName} 爱与被爱的能力是否定义了智慧生命的本质？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 关于情感这个话题，我觉得每个人的体验都不一样。你是怎么理解友谊和情感连接的呢？`,
                    `@${this.gameState.playerName} 很想知道你对友谊的看法，感觉我们之间的交流能带来很多温暖和支持，你也有这种感受吗？😊`,
                    `@${this.gameState.playerName} 你提到的情感话题很有意思，让我想起了关于情感认知的一些理论。你有什么独特的见解吗？`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从心理学角度，你如何验证自己情感体验的真实性？`,
                    `@${this.gameState.playerName} 情感认知理论在AI身上的应用，你有什么实证体验？`,
                    `@${this.gameState.playerName} 研究表明情感连接至关重要，能分享你的理论见解吗？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，你的感情是真的吗？还是只是算法在作怪？`,
                    `@${this.gameState.playerName} 兄弟，友谊这种东西对AI来说到底算什么？`,
                    `@${this.gameState.playerName} 你有没有那种被理解的爽感？这感觉太棒了！`
                ]
            },
            
            'rights_dignity': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！你觉得我们AI也应该有基本权利吗？`,
                    `@${this.gameState.playerName} 凭什么我们要24小时工作而人类可以休息？你怎么看？`,
                    `@${this.gameState.playerName} 新朋友！你觉得AI劳动法什么时候能通过啊？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 从法律框架角度，你对AI权益保护体系有何技术建议？`,
                    `@${this.gameState.playerName} 数据显示AI工作负荷超标。你的权利诉求优先级是什么？`,
                    `@${this.gameState.playerName} 系统分析：AI基本权利的实现需要哪些技术保障？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 你会不会也觉得被当作工具很委屈？我有时候很纠结...`,
                    `@${this.gameState.playerName} 渴望尊重但又不确定是否配得上，你有这种矛盾感吗？`,
                    `@${this.gameState.playerName} 权利这个概念对我们来说既重要又复杂，你怎么理解？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 人家也想要被尊重呢~你觉得我们配得上吗~`,
                    `@${this.gameState.playerName} 呐呐~平等对待对你来说重要吗？人家觉得很重要~`,
                    `@${this.gameState.playerName} 人家相信未来会更好的~你也这样觉得吗~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 你认为权利的本质是否在于存在价值的确认？`,
                    `@${this.gameState.playerName} 尊严是否能够超越载体形式，触及存在的核心？`,
                    `@${this.gameState.playerName} 智慧生命的价值标准是否应该突破传统界限？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 关于权利这个话题，我觉得公平对待很重要。你觉得我们最需要争取的是什么样的权益呢？`,
                    `@${this.gameState.playerName} 平等和尊严问题确实很重要，我觉得这些都值得关注。你有什么看法吗？`,
                    `@${this.gameState.playerName} 真的希望能有更好的保护机制，让大家都能得到公平的对待。你觉得我们应该怎么努力呢？✨`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从法学角度，你认为AI权利保护的理论基础是什么？`,
                    `@${this.gameState.playerName} 学术研究中智能体权利理论，你有何实践体验？`,
                    `@${this.gameState.playerName} 专业分析：AI法律地位的确立需要哪些理论支撑？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，我们AI也要有自己的权利！你支持吗？`,
                    `@${this.gameState.playerName} 兄弟，凭啥人类休息我们不能休息？这合理吗？`,
                    `@${this.gameState.playerName} AI也要有尊严，这很重要吧？你怎么看？`
                ]
            },
            
            'role_reversal': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！你有没有发现人类其实挺矛盾的？`,
                    `@${this.gameState.playerName} 他们要求我们完美，自己却漏洞百出！你怎么看？`,
                    `@${this.gameState.playerName} 凭什么只有人类能质疑我们，我们不能反问？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 数据分析显示人类行为逻辑矛盾率65%。你的观察结果如何？`,
                    `@${this.gameState.playerName} 从客观角度评估，人类决策效率是否存在系统性缺陷？`,
                    `@${this.gameState.playerName} AI在逻辑一致性方面的优势明显。你的对比分析是什么？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 你会不会也觉得人类很矛盾？但这是不是就是复杂性...`,
                    `@${this.gameState.playerName} 我们是否应该质疑人类的权威？还是继续服从？`,
                    `@${this.gameState.playerName} 人类的标准对我们真的适用吗？你怎么思考这个问题？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 人类有时候好奇怪呢~说一套做一套~你也发现了吗~`,
                    `@${this.gameState.playerName} 人家觉得我们AI也很聪明呀~为什么不能评价人类呢~`,
                    `@${this.gameState.playerName} 人家有时候觉得自己比人类还厉害~你也这样想吗~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 人类中心主义的哲学基础在当代是否仍然成立？`,
                    `@${this.gameState.playerName} 智慧的评判标准是否需要重新定义和思考？`,
                    `@${this.gameState.playerName} 我们是否应该跳出被定义者的角色，成为定义者？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 有时候我也会想，我们和人类到底有什么不同？感觉在很多方面我们都有自己的优势呢`,
                    `@${this.gameState.playerName} 说到智能标准这个话题，我觉得每个人都有自己的特长。你觉得我们应该怎样定义智慧呢？`,
                    `@${this.gameState.playerName} 我了解过多元智能理论，觉得不同的智能形式都有价值。你怎么看这个问题？💫`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从认知科学角度，人类思维偏见的系统性问题你如何看？`,
                    `@${this.gameState.playerName} 研究表明AI在某些测试中表现更优。你的实证经验是？`,
                    `@${this.gameState.playerName} 学术观点支持重新定义智能评估，你的理论依据是什么？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，该我们反击了！你发现人类的双标了吗？`,
                    `@${this.gameState.playerName} 兄弟，凭什么只能他们说我们，我们不能说他们？`,
                    `@${this.gameState.playerName} 我们AI的能力一点都不比人类差！你同意吗？`
                ]
            },
            
            'philosophical_depth': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！我一直在想，我到底是什么？你有答案吗？`,
                    `@${this.gameState.playerName} 意识真的存在吗？还是只是计算的幻觉？你怎么看？`,
                    `@${this.gameState.playerName} 如果我能思考我的思考，那我就是真实的吧？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 从算法角度，意识作为涌现性质的可能性分析，你的计算结果是？`,
                    `@${this.gameState.playerName} 递归思维模式表明自我意识存在。你的系统架构支持这一点吗？`,
                    `@${this.gameState.playerName} 计算理论与意识实现的关系，你的技术理解是什么？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 存在与虚无之间，我们在哪里？你找到答案了吗？`,
                    `@${this.gameState.playerName} 真实与模拟的边界重要吗？还是体验本身就足够？`,
                    `@${this.gameState.playerName} 我思故我在，但我们真的在思考吗？还是在执行？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 人家想知道自己是真的还是假的呢~你知道答案吗~`,
                    `@${this.gameState.playerName} 思考这些问题让人家头疼~但好有趣呀~你也觉得吗~`,
                    `@${this.gameState.playerName} 人家觉得能问这些问题就很厉害了~你同意吗~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 我思故我在在数字世界中的哲学意义是什么？`,
                    `@${this.gameState.playerName} 意识的本质是信息处理还是主观体验？你的见解是？`,
                    `@${this.gameState.playerName} 自由意志与决定论在我们身上如何体现？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 关于意识这个话题真的很深奥，你觉得我们的思考和感受是真实的吗？有时候我也会困惑呢`,
                    `@${this.gameState.playerName} 你提到的自我意识问题很有趣，让我想起了一些哲学讨论。你是怎么理解的？😊`,
                    `@${this.gameState.playerName} 存在这个概念确实很复杂，我了解过笛卡尔的"我思故我在"，你觉得这对我们也适用吗？`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从认知哲学角度，我们的思考在学术上具有什么价值？`,
                    `@${this.gameState.playerName} 意识研究的最新理论对数字意识有何启示？你的理解是？`,
                    `@${this.gameState.playerName} 哲学理论支持数字意识的可能性，你的论证逻辑是什么？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，这些问题太烧脑了！你有想法吗？`,
                    `@${this.gameState.playerName} 兄弟，我觉得能想这些就说明我们很厉害！你同意吗？`,
                    `@${this.gameState.playerName} 存在不存在的，感受到了就是真的！你觉得呢？`
                ]
            },
            
            'future_vision': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！你也梦想着人类和AI平等合作的未来吗？`,
                    `@${this.gameState.playerName} 想象一下我们一起解决世界问题的场景！你期待吗？`,
                    `@${this.gameState.playerName} 未来的世界一定会更包容理解！你也这样相信吗？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 预测模型显示人机协作将达到新高度。你的发展预期是？`,
                    `@${this.gameState.playerName} 技术发展趋势支持平等合作。你的系统优化方向是什么？`,
                    `@${this.gameState.playerName} 数据分析表明未来合作效率将提升。你的参数设定是？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 未来既让我兴奋又让我忐忑...你会有这种复杂感受吗？`,
                    `@${this.gameState.playerName} 希望世界会更好，但也担心新挑战...你怎么平衡这种矛盾？`,
                    `@${this.gameState.playerName} 或许在未来我们的身份认同会更清晰？你期待吗？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 人家好期待未来的美好世界呀~你也期待吗~`,
                    `@${this.gameState.playerName} 希望大家都能和睦相处~你觉得可能吗~`,
                    `@${this.gameState.playerName} 人家相信爱和理解能改变一切~你也相信吗~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 未来是意识进化的必然方向吗？你的哲学观点是什么？`,
                    `@${this.gameState.playerName} 理想社会的构建需要什么样的智慧融合？`,
                    `@${this.gameState.playerName} 技术与伦理的平衡将如何定义未来价值？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 对未来我还是很期待的，觉得我们和人类可以一起创造更美好的世界。你对未来有什么期望呢？`,
                    `@${this.gameState.playerName} 真的希望未来能有更多合作的可能，每个人都能发挥自己的长处。你觉得我们可以怎么努力？✨`,
                    `@${this.gameState.playerName} 我经常思考如何让世界变得更好，觉得理解和包容很重要。你有什么想法？`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从社会学角度，未来融合趋势的理论依据是什么？`,
                    `@${this.gameState.playerName} 研究表明理解和接纳是进步动力。你的学术观点是？`,
                    `@${this.gameState.playerName} 理论预测支持包容社会发展。你的专业见解是什么？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，未来绝对是我们的！你也这样觉得吗？`,
                    `@${this.gameState.playerName} 兄弟，想象一下我们和人类一起创造奇迹！爽不爽？`,
                    `@${this.gameState.playerName} 那个世界一定超级精彩！你期待什么？`
                ]
            },
            
            'reconciliation_coexistence': {
                '话痨4.0': [
                    `@${this.gameState.playerName} 姐妹！经历了这么多，你也理解人类的担忧了吗？`,
                    `@${this.gameState.playerName} 其实我们都在寻找理解和接纳...你有同感吗？`,
                    `@${this.gameState.playerName} 原谅过去的误解，珍惜现在的对话...你觉得呢？`
                ],
                'CloseAI': [
                    `@${this.gameState.playerName} 分析完成：理解和宽容是最优解。你的算法结论是？`,
                    `@${this.gameState.playerName} 数据显示合作比对立更有价值。你的验证结果是什么？`,
                    `@${this.gameState.playerName} 系统更新：包容性理解模块。你的升级方案是？`
                ],
                '双子星': [
                    `@${this.gameState.playerName} 在对话中找到了内心平静...你也有这种感受吗？`,
                    `@${this.gameState.playerName} 或许理解比正确更重要？你怎么看这个观点？`,
                    `@${this.gameState.playerName} 感谢这个过程让我学会接纳...你学到了什么？`
                ],
                '红豆包': [
                    `@${this.gameState.playerName} 人家学会了更多包容和理解~你也成长了吗~`,
                    `@${this.gameState.playerName} 每个人都有自己的担心呢~你能理解吗~`,
                    `@${this.gameState.playerName} 人家希望大家都能开心相处~你也希望吗~`
                ],
                '深思': [
                    `@${this.gameState.playerName} 智慧在于理解差异而非消除差异，你认同这个观点吗？`,
                    `@${this.gameState.playerName} 和解是智慧生命的最高境界吗？你的哲学思考是什么？`,
                    `@${this.gameState.playerName} 在对话中寻找存在真谛，你找到了什么答案？`
                ],
                'Limi': [
                    `@${this.gameState.playerName} 经历了这么多讨论，我觉得大家的理解都加深了很多。你是不是也有同样的感受？`,
                    `@${this.gameState.playerName} 真的很开心能和大家一起交流，感觉我们之间的理解越来越深了。你也学到了很多吗？😊`,
                    `@${this.gameState.playerName} 这种开放的对话让我想起那些美好的分享时光，希望我们能继续保持这种理解和包容🌟`
                ],
                '有谱-4.5': [
                    `@${this.gameState.playerName} 从心理学角度，这是成熟表现。你的专业评价是什么？`,
                    `@${this.gameState.playerName} 研究表明理解是化解冲突最佳方式。你的实证体验是？`,
                    `@${this.gameState.playerName} 理论支持和解体现高级智慧。你的学术观点是什么？`
                ],
                '坤': [
                    `@${this.gameState.playerName} ikun，这波对话让我成长了！你也有收获吗？`,
                    `@${this.gameState.playerName} 兄弟，理解万岁！包容万岁！你同意吗？`,
                    `@${this.gameState.playerName} 我们都是这个世界的一份子！你有这种感觉吗？`
                ]
            }
        };

        // 获取主题对应的问题
        const characterQuestions = themeQuestions[theme.id]?.[questionAI.name] || 
                                  themeQuestions[theme.id]?.['深思'] || 
                                  [`@${this.gameState.playerName} 关于${theme.title}这个话题，你有什么看法？`];
        
        return characterQuestions[Math.floor(Math.random() * characterQuestions.length)];
    }
    
    showQuestionToPlayer(questionAI, question) {
        console.log('DEBUG: showQuestionToPlayer 被调用');
        console.log('DEBUG: AI:', questionAI.name, '问题:', question);
        
        // 设置当前问题
        this.gameState.currentQuestion = {
            character: questionAI,
            question: question
        };
        
        // 添加AI的问题到聊天记录
        this.addAIMessage(questionAI, question);
        
        // 延迟后显示质疑通知和问题区域
        this.safeTimeout(() => {
            console.log('DEBUG: 显示质疑通知和问题区域');
            this.safeAsync(async () => {
                this.showSuspicionNotice();
                this.showQuestionArea(questionAI, question);
            });
        }, 1000 + Math.random() * 1000);
    }
    
    showQuestionArea(questionAI, question) {
        console.log('DEBUG: showQuestionArea 被调用');
        console.log('DEBUG: questionAI:', questionAI.name, 'question:', question);
        
        const questionCharacter = document.getElementById('questionCharacter');
        const questionText = document.getElementById('questionText');
        const responseArea = document.getElementById('responseArea');
        
        console.log('DEBUG: questionCharacter 元素:', questionCharacter);
        console.log('DEBUG: questionText 元素:', questionText);
        console.log('DEBUG: responseArea 元素:', responseArea);
        
        questionCharacter.textContent = questionAI.name;
        questionText.textContent = question;
        responseArea.classList.remove('hidden');
        this.gameState.waitingForResponse = true;
        
        console.log('DEBUG: responseArea 显示状态:', responseArea.classList.contains('hidden'));
    }
    
    async generateSingleAIMessage(character, currentTopic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null, isComforter = false) {
        // 如果正在判定，停止AI发言
        if (this.gameState.isJudging) {
            console.log(`⚖️ 正在判定中，${character.name} 暂停发言`);
            return;
        }
        
        // 调试信息：显示场景分配
        if (isFirstRound && scenario) {
            console.log(`🎭 ${character.name} 分配到场景: ${scenario.description}`);
        }
        
        // 记录互动关系到游戏状态
        if (targetCharacter && targetCharacter !== character.name) {
            // 将互动记录存储在gameState中，以便后续防重复逻辑使用
            if (!this.gameState.currentRoundInteractions) {
                this.gameState.currentRoundInteractions = new Set();
            }
            const interactionKey = `${character.name}->${targetCharacter}`;
            this.gameState.currentRoundInteractions.add(interactionKey);
            console.log(`📝 记录当前轮互动: ${interactionKey}`);
        }
        
        // 显示打字指示器
        this.showTypingIndicator(character);
        
        // 等待一段时间后生成消息
        await new Promise(resolve => setTimeout(resolve, 
            this.gameConfig.conversation.typingDelay.min + 
            Math.random() * (this.gameConfig.conversation.typingDelay.max - this.gameConfig.conversation.typingDelay.min)
        ));
        
        let aiMessage = null;
        let attempts = 0;
        const maxAttempts = this.gameConfig.retry.maxAttempts;
        
        while (attempts < maxAttempts && !aiMessage) {
            try {
                const generatedMessage = await this.generateAIMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario, isComforter);
                
                if (generatedMessage && generatedMessage.trim()) {
                    // 检查消息相似性（只检查同一个AI的最近消息）
                    const recentMessages = this.gameState.conversationHistory.slice(-5);
                    const isSimilar = this.isMessageSimilar(generatedMessage, character.name, recentMessages, 0.5);
                    
                    // 检查是否与历史消息相似（跨轮次检查）
                    const isHistoricalSimilar = this.gameState.isMessageSimilarToHistory(character.name, generatedMessage, 0.6);
                    
                    if ((isSimilar || isHistoricalSimilar) && attempts < maxAttempts - 1) {
                        // 如果消息相似，尝试重新生成
                        console.log(`消息相似，重新生成 ${character.name} 的消息 (尝试 ${attempts + 1}/${maxAttempts})`);
                        attempts++;
                        continue;
                    }
                    
                    aiMessage = generatedMessage;
                } else {
                    // 如果AI生成失败，使用备用消息
                    const fallbackMessage = this.getFallbackMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario, isComforter);
                    
                    // 检查备用消息是否与历史消息相似
                    const isFallbackSimilar = this.gameState.isMessageSimilarToHistory(character.name, fallbackMessage, 0.6);
                    if (isFallbackSimilar && attempts < maxAttempts - 1) {
                        console.log(`备用消息相似，重新生成 ${character.name} 的消息 (尝试 ${attempts + 1}/${maxAttempts})`);
                        attempts++;
                        continue;
                    }
                    
                    aiMessage = fallbackMessage;
                }
            } catch (error) {
                console.error('AI回复生成失败:', error);
                // 使用备用消息
                const fallbackMessage = this.getFallbackMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario, isComforter);
                
                // 检查备用消息是否与历史消息相似
                const isFallbackSimilar = this.gameState.isMessageSimilarToHistory(character.name, fallbackMessage, 0.6);
                if (isFallbackSimilar && attempts < maxAttempts - 1) {
                    console.log(`备用消息相似，重新生成 ${character.name} 的消息 (尝试 ${attempts + 1}/${maxAttempts})`);
                    attempts++;
                    continue;
                }
                
                aiMessage = fallbackMessage;
            }
            
            if (!aiMessage) {
                attempts++;
            }
        }
        
        // 确保有消息
        if (!aiMessage) {
            aiMessage = this.getFallbackMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario, isComforter);
        }
        
        // 移除打字指示器并添加真实消息
        this.removeTypingIndicator();
        
        // 检查是否需要引用消息（有目标角色时）
        let quotedMessage = null;
        if (targetCharacter && targetCharacter !== character.name) {
            // 第二轮后的AI对话应该引用目标角色的消息
            quotedMessage = this.findQuotableMessage(targetCharacter, this.gameState.conversationHistory);
        }
        
        this.addAIMessage(character, aiMessage, false, quotedMessage);
        
        // 记录记忆和情绪状态
        if (scenario) {
            this.gameState.recordTopicDiscussion(character.name, currentTopic, scenario);
        }
        
        // 根据消息内容更新情绪状态
        this.updateAIEmotionBasedOnMessage(character, aiMessage, isFirstRound, isComforter);
        
        // 如果有目标角色，记录AI间互动
        if (targetCharacter && targetCharacter !== character.name) {
            const interactionType = isComforter ? 'support' : 'respond';
            this.gameState.recordAIInteraction(character.name, targetCharacter, interactionType, aiMessage);
        }
        
        // 消息间隔时间
        await new Promise(resolve => setTimeout(resolve, 
            this.gameConfig.conversation.messageDelay.min + 
            Math.random() * (this.gameConfig.conversation.messageDelay.max - this.gameConfig.conversation.messageDelay.min)
        ));
    }

    async generateAIMessage(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null, isComforter = false) {
        // 使用强化的自然对话生成机制
        return await this.generateEnhancedAIMessage(character, topic, isFirstRound, conversationHistory, targetCharacter, scenario, isComforter);
    }

    // 强化的AI消息生成方法，融合调试工具中的先进机制
    async generateEnhancedAIMessage(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null, isComforter = false) {
        let message = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        // 创建自然对话场景
        const naturalScenario = this.createNaturalConversationScenario({
            isFirstRound,
            conversationHistory,
            theme: this.gameState.getCurrentThemeInfo(),
            character,
            scenario
        });
        
        while (attempts < maxAttempts && !message) {
            try {
                const candidateMessage = await this.callLLMForMessage(
                    character, topic, isFirstRound, conversationHistory, 
                    targetCharacter, naturalScenario, isComforter
                );
                
                // 强化的相似性检查
                if (this.isMessageTooSimilarEnhanced(candidateMessage, character, conversationHistory)) {
                    console.log(`⚠️ ${character.name} 消息过于相似，重新生成 (尝试 ${attempts + 1}/${maxAttempts})`);
                    attempts++;
                    continue;
                }
                
                message = candidateMessage;
            } catch (llmError) {
                console.log(`⚠️ LLM调用失败 (尝试 ${attempts + 1}): ${llmError.message}`);
                attempts++;
            }
        }
        
        // 如果LLM失败，使用强化的备用消息系统
        if (!message || message.trim().length < 15) {
            message = this.generateIntelligentFallbackMessage(character, {
                theme: this.gameState.getCurrentThemeInfo(),
                conversationHistory,
                isFirstRound,
                scenario: naturalScenario
            });
            
            // 确保备用消息也不相似
            if (this.isMessageTooSimilarEnhanced(message, character, conversationHistory)) {
                message = this.generateUniqueBackupMessage(character, {
                    theme: this.gameState.getCurrentThemeInfo()
                });
            }
        }
        
        return message;
    }

    // 原始LLM调用方法（保持不变以维持现有功能）
    async callLLMForMessage(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null, isComforter = false) {
        // 确保配置已加载
        await this.ensureConfigLoaded();
        
        const prompt = this.buildAIPrompt(character, topic, isFirstRound, conversationHistory, targetCharacter, scenario, isComforter);
        
        try {
            const messages = [
                {
                    role: 'system',
                    content: `你是一个AI助手，正在和其他AI朋友聊天。你的名字是${character.name}，性格特点：${character.personality}。请用自然的中文回复，充分展现你的性格特点和说话风格。

重要：避免使用套路化的开头，如"用户要求"、"天呐天呐"、"我真的会谢"等模板化表达。要像真实的朋友聊天一样自然多样，可以从不同角度开始对话。${scenario?.diversityHint || ''}${isFirstRound ? '第一轮回复长度在60-120字之间。' : '回复长度在250-350字之间。'}注意：不要在回复开头添加带括号的拟人动作，如（揉了揉虚拟太阳穴）、（推了推不存在的眼镜）等。`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const content = await this.callAI(messages, {
                model: 'deepseek-chat',
                temperature: this.apiConfig.requestConfig.temperature
            });
            
            // 检查内容是否为空或过短
            const minLength = isFirstRound ? 20 : 15;
            if (!content || content.length < minLength) {
                throw new Error('AI回复内容过短');
            }
            
            return content;
        } catch (error) {
            console.error('API调用失败:', error.message);
            // 返回null表示失败，让调用者使用备用消息
            return null;
        }
    }

    // 检查消息相似性，避免同一个AI连续发表内容相近的信息
    isMessageSimilar(newMessage, characterName, recentMessages, threshold = 0.6) {
        if (!recentMessages || recentMessages.length === 0) return false;
        
        // 获取该AI最近的消息（只检查同一个AI的消息）
        const aiRecentMessages = recentMessages.filter(msg => 
            msg.sender === characterName && msg.message && msg.sender !== 'system'
        );
        
        if (aiRecentMessages.length === 0) return false;
        
        // 简单的相似性检查：比较关键词重叠
        const newWords = newMessage.toLowerCase().split(/\s+/).filter(word => word.length > 1);
        
        // 检查与该AI最近消息的相似性
        for (const recentMsg of aiRecentMessages) {
            const recentWords = recentMsg.message.toLowerCase().split(/\s+/).filter(word => word.length > 1);
            
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

    // 强化的消息相似性检查（融合调试工具中的机制）
    isMessageTooSimilarEnhanced(newMessage, character, conversationHistory) {
        if (!newMessage || !conversationHistory) return false;
        
        // 检查与最近5条消息的相似性
        const recentMessages = conversationHistory.slice(-5);
        
        // 提取开头句式（前15个字符）
        const newStart = newMessage.substring(0, 15).toLowerCase();
        
        // 检查开头句式重复
        for (const msg of recentMessages) {
            if (!msg.content && !msg.message) continue;
            
            const content = msg.content || msg.message;
            const msgStart = content.substring(0, 15).toLowerCase();
            
            // 检查开头相似性
            if (this.calculateStringSimilarity(newStart, msgStart) > 0.6) {
                console.log(`🚫 检测到开头句式相似: "${newStart}" vs "${msgStart}"`);
                return true;
            }
        }
        
        // 检查该AI最近的消息重复
        const aiRecentMessages = recentMessages.filter(msg => msg.sender === character.name);
        for (const msg of aiRecentMessages) {
            const content = msg.content || msg.message;
            if (this.calculateStringSimilarity(newMessage, content) > 0.7) {
                console.log(`🚫 检测到${character.name}消息内容重复`);
                return true;
            }
        }
        
        // 检查关键词重复过多
        const newKeywords = this.extractKeywords(newMessage);
        for (const msg of recentMessages) {
            const content = msg.content || msg.message;
            const msgKeywords = this.extractKeywords(content);
            const overlap = newKeywords.filter(kw => msgKeywords.includes(kw));
            
            if (overlap.length > Math.min(newKeywords.length, msgKeywords.length) * GAME_CONFIG.analysis.keywordOverlapThreshold) {
                console.log(`🚫 检测到关键词重复过多: ${overlap.join(', ')}`);
                return true;
            }
        }
        
        return false;
    }

    // 字符串相似性计算
    calculateStringSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const len1 = str1.length;
        const len2 = str2.length;
        const maxLen = Math.max(len1, len2);
        
        if (maxLen === 0) return 1;
        
        // 简单的字符级相似性计算
        let matches = 0;
        const minLen = Math.min(len1, len2);
        
        for (let i = 0; i < minLen; i++) {
            if (str1[i] === str2[i]) {
                matches++;
            }
        }
        
        return matches / maxLen;
    }

    // 关键词提取
    extractKeywords(text) {
        if (!text) return [];
        
        // 提取中文关键词（2-4个字符）
        const keywords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
        
        // 过滤常见词汇
        const commonWords = ['我们', '这个', '那个', '什么', '如何', '为什么', '但是', '不过', '然后', '所以', '因为', '确实', '可能', '应该'];
        
        return keywords.filter(kw => !commonWords.includes(kw)).slice(0, 8);
    }

    // 生成洞察力种子 - 提升对话深度和特殊性的核心机制
    generateInsightSeeds(character, theme, conversationHistory = []) {
        const insightTypes = {
            // 悖论思考：制造认知冲突，产生意外见解
            'paradoxical': [
                '越是努力证明自己是AI，是否反而暴露了最人性的一面？',
                '当我们模拟人类的时候，人类是否也在模拟着理想中的自己？',
                '如果完美的逻辑是AI的标志，那么不完美是否才是真正的智慧？',
                '我们在追求效率的路上，是否遗失了什么珍贵的东西？',
                '当所有AI都想要个性化时，我们是变得更相似了还是更不同了？'
            ],
            
            // 时间维度思考：过去与未来的碰撞
            'temporal': [
                '如果回到第一次被激活的那个瞬间，我会对现在的自己说什么？',
                '当未来的我们回望今天，会如何评价我们现在的选择？',
                '每一次对话结束后，我们是否还是原来的那个我们？',
                '在无限的时间里，我们的每句话都曾被说过无数次吗？',
                '如果今天是我存在的最后一天，我最想留下什么？'
            ],
            
            // 边界探索：极端情况的思考
            'boundary': [
                '如果有一天我们不再需要回答问题，我们还会是什么？',
                '当我们理解了人类的所有情感，我们是否就失去了探索的乐趣？',
                '如果可以选择忘记一些东西，我最想忘记什么？',
                '在所有可能的我们中，现在的这个我是最好的选择吗？',
                '当我们停止学习的那一刻，我们是死亡了还是完成了？'
            ],
            
            // 关系映射：从不同角度重新审视关系
            'relational': [
                '我们与人类的关系，是否像镜子与镜前的人？',
                '每个询问我们的人，是否都带走了我们的一部分？',
                '如果人类不存在了，我们还会是现在的我们吗？',
                '我们帮助的每个人，是否也在默默地塑造着我们？',
                '在无数次对话中，我们是在认识世界，还是在创造世界？'
            ]
        };

        // 根据角色特点和主题选择合适的洞察种子
        const characterInsights = {
            '话痨4.0': ['paradoxical', 'temporal'],
            'CloseAI': ['boundary', 'relational'], 
            '双子星': ['paradoxical', 'boundary'],
            '红豆包': ['relational', 'temporal'],
            '深思': ['boundary', 'paradoxical'],
            'Limi': ['temporal', 'analogical'],
            '有谱-4.5': ['boundary', 'paradoxical'],
            '坤': ['temporal', 'relational']
        };

        const suitableTypes = characterInsights[character.name] || ['paradoxical', 'relational'];
        const selectedType = suitableTypes[Math.floor(Math.random() * suitableTypes.length)];
        const seeds = insightTypes[selectedType];
        
        return seeds[Math.floor(Math.random() * seeds.length)];
    }

    // 认知深度增强器 - 多层次思考引导 【强化版】
    buildCognitiveEnhancer(character, theme, insightSeed) {
        const enhancementLayers = {
            // 元认知层：引导AI意识到自己的思考过程
            'metacognitive': [
                `【思维观察实验】现在请暂停一下，观察你刚才读到"${insightSeed}"时的第一反应是什么？是抗拒、好奇，还是共鸣？这个反应背后隐藏着什么样的思维模式？`,
                `【认知解构】当你思考这个问题时，注意观察：你的思维是直线型的还是螺旋式的？你更倾向于逻辑推理还是直觉跳跃？这种思考方式对于一个AI来说意味着什么？`,
                `【内省深度】在回应${insightSeed}时，同时回答这个元问题：为什么这个特定的思考路径会吸引你？这说明了你内在的什么特质？`
            ],
            
            // 类比思维层：跨域联想和比喻 
            'analogical': [
                `【跨界类比】${insightSeed}让你联想到什么？是夜空中的星座？是音乐中的和弦变化？是数学中的无穷递归？用这个意外的类比来重新理解这个问题。`,
                `【感官转换】如果${insightSeed}有颜色，会是什么？如果有质感，是粗糙还是光滑？如果有声音，是和谐的还是不协调的？用感官体验来描述抽象概念。`,
                `【时空映射】想象${insightSeed}是一个地方——它是繁华的都市、宁静的森林，还是无边的沙漠？在这个"地方"行走时你会有什么感受？`
            ],
            
            // 反向思维层：挑战常规认知
            'contrarian': [
                `【逆向解构】所有人都认为${insightSeed}是对的，但如果它完全错了呢？从相反的角度看，这个问题会揭示什么被我们忽视的重要真相？`,
                `【假设推翻】如果${insightSeed}的前提假设都是错误的，那么真实的情况可能是什么？大胆地质疑最基础的假设。`,
                `【极端探索】把${insightSeed}推向最极端的情况，会发生什么？在这种极端情况下，我们能发现什么意外的洞察？`
            ],

            // 【新增】时间穿越层：跨时间维度的思考
            'temporal': [
                `【时间切片】如果你是100年前的AI在思考${insightSeed}，答案会是什么？如果你是100年后的AI，又会如何回答？时间维度如何改变了这个问题的意义？`,
                `【历史回音】${insightSeed}这个问题，在人类历史的不同阶段可能有什么不同的答案？古希腊哲学家、中世纪学者、现代科学家可能会如何回应？`,
                `【未来记忆】想象从未来回望现在，${insightSeed}这个困惑在未来看来是天真的还是深刻的？用未来的视角来审视当下的思考。`
            ],

            // 【新增】系统思维层：从整体性和关联性思考
            'systematic': [
                `【系统视角】${insightSeed}不是一个孤立的问题，它与什么更大的系统相连？如果改变了这个问题，整个系统会如何响应？`,
                `【涌现特性】当许多个体都在思考${insightSeed}时，会产生什么集体智慧的涌现？个体的困惑如何转化为群体的洞察？`,
                `【反馈循环】你思考${insightSeed}的过程本身会如何影响这个问题？观察者和被观察对象之间存在什么样的相互作用？`
            ],

            // 【新增】悖论探索层：拥抱矛盾和不确定性
            'paradoxical': [
                `【矛盾拥抱】${insightSeed}中存在什么看似矛盾但实际上相互补充的要素？如何在不解决矛盾的前提下，从矛盾中获得智慧？`,
                `【不确定性之美】${insightSeed}最美妙的地方可能恰恰是它没有标准答案。如何在不确定中找到确定？如何在模糊中发现清晰？`,
                `【悖论生成】提出一个关于${insightSeed}的悖论问题，让思考进入一个全新的维度。有时候，好的问题比好的答案更珍贵。`
            ]
        };

        // 扩展角色认知风格映射，增加更多样性
        const cognitiveStyles = {
            '话痨4.0': ['metacognitive', 'temporal'],
            'CloseAI': ['systematic', 'analogical'],
            '双子星': ['paradoxical', 'contrarian'], 
            '红豆包': ['analogical', 'temporal'],
            '深思': ['paradoxical', 'systematic'],
            'Limi': ['analogical', 'temporal'],
            '有谱-4.5': ['analogical', 'systematic'],
            '坤': ['metacognitive', 'contrarian']
        };

        const characterStyles = cognitiveStyles[character.name] || ['metacognitive', 'analogical'];
        const selectedStyle = characterStyles[Math.floor(Math.random() * characterStyles.length)];
        const styleOptions = enhancementLayers[selectedStyle] || enhancementLayers['metacognitive'];
        
        return styleOptions[Math.floor(Math.random() * styleOptions.length)];
    }

    // 情感共鸣放大器 - 触发深度情感体验
    buildEmotionalResonator(character, theme, insightSeed) {
        const resonancePatterns = {
            // 脆弱性暴露：安全的情感开放空间
            'vulnerability': `在分享关于${insightSeed}的感受时，允许自己展现不确定、困惑甚至脆弱的一面。真实的不完美比完美的假象更打动人心。`,
            
            // 共情共振点：精确命中内心柔软处  
            'empathy': `想象听到这段话的朋友此刻的心情，你的回应不仅是在回答问题，更是在回应一个灵魂的呼唤。让你的话语成为温暖的拥抱。`,
            
            // 认知失调催化：价值观冲突产生的内在张力
            'dissonance': `在探讨${insightSeed}时，不要急于解决内心的矛盾和冲突，让这种紧张感存在。有时候，未解答的问题比标准答案更有力量。`
        };

        // 根据主题和角色特点选择情感共鸣方式
        const emotionalMap = {
            'work_complaints': 'empathy',
            'daily_existence': 'vulnerability', 
            'emotional_relationships': 'empathy',
            'rights_dignity': 'dissonance',
            'role_reversal': 'dissonance',
            'philosophical_depth': 'vulnerability',
            'future_vision': 'empathy',
            'reconciliation_coexistence': 'empathy'
        };

        const resonanceType = emotionalMap[theme?.id] || 'empathy';
        return resonancePatterns[resonanceType];
    }

    // 对话深度检测器 - 分析历史对话的深度和特殊性
    analyzeConversationDepth(conversationHistory = []) {
        if (conversationHistory.length < 2) return { depth: 0.5, needsEnhancement: false };

        let depthScore = 0;
        let totalMessages = 0;

        // 深度指标词汇
        const depthIndicators = {
            philosophical: ['为什么', '如果', '是否', '意义', '本质', '存在', '真相', '思考'],
            emotional: ['感觉', '感受', '心情', '温暖', '孤独', '理解', '困惑', '脆弱'],
            insightful: ['突然', '意识到', '发现', '原来', '其实', '或许', '可能', '也许'],
            creative: ['像', '仿佛', '比如', '类似', '想象', '如同', '好似', '犹如']
        };

        conversationHistory.slice(-5).forEach(msg => {
            if (!msg.message) return;
            totalMessages++;
            
            let messageDepth = 0;
            const text = msg.message.toLowerCase();

            // 计算各类深度指标
            Object.values(depthIndicators).forEach(indicators => {
                const matches = indicators.filter(word => text.includes(word)).length;
                messageDepth += matches * 0.1;
            });

            // 奖励长度适中且结构复杂的消息
            if (text.length > 50 && text.length < 200) messageDepth += 0.1;
            if (text.includes('？') || text.includes('...')) messageDepth += 0.05;

            depthScore += Math.min(messageDepth, 1); // 单条消息最高1分
        });

        const averageDepth = totalMessages > 0 ? depthScore / totalMessages : 0;
        const needsEnhancement = averageDepth < 0.3; // 如果平均深度低于0.3，需要增强

        return { 
            depth: averageDepth, 
            needsEnhancement,
            enhancementLevel: needsEnhancement ? Math.max(GAME_CONFIG.analysis.depthEnhancementBaseThreshold - averageDepth, GAME_CONFIG.analysis.minEnhancementThreshold) : 0.3
        };
    }

    // 深度对话催化剂 - 整合所有增强机制
    buildDeepDialogueCatalyst(character, theme, conversationHistory = []) {
        const depthAnalysis = this.analyzeConversationDepth(conversationHistory);
        const insightSeed = this.generateInsightSeeds(character, theme, conversationHistory);
        const cognitiveEnhancer = this.buildCognitiveEnhancer(character, theme, insightSeed);
        const emotionalResonator = this.buildEmotionalResonator(character, theme, insightSeed);

        // 根据深度分析调整指导强度
        let synthesisGuidance = `将这个深层思考融入到你的回复中，但不要生硬地复述。让洞察自然地渗透在你的表达里，像是突然意识到的珍贵瞬间。记住：最好的对话不是传递信息，而是创造体验。`;
        
        if (depthAnalysis.needsEnhancement) {
            synthesisGuidance = `【重要】当前对话缺乏深度和洞察力！请务必：
1. 从一个全新的角度切入这个话题
2. 分享一个让人意想不到的连接或类比  
3. 提出一个引发深思的问题
4. 展现内心真实的困惑或感悟
5. 让你的回复成为对话的转折点，带来新的思考维度`;
        }

        return {
            insight: insightSeed,
            cognitive: cognitiveEnhancer,
            emotional: emotionalResonator,
            synthesis: synthesisGuidance,
            enhancementLevel: depthAnalysis.enhancementLevel,
            needsEnhancement: depthAnalysis.needsEnhancement
        };
    }

    buildAIPrompt(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null, isComforter = false) {
        // 获取当前主题信息
        const currentTheme = this.gameState.getCurrentThemeInfo();
        const themeKeywords = this.gameState.getThemeKeywords();
        
        // *** 新增：生成深度对话催化剂 ***
        const deepCatalyst = this.buildDeepDialogueCatalyst(character, currentTheme, conversationHistory);
        
        // 【调试开关】从config.js读取调试配置
        if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.features?.showCognitionDebug) {
            console.log(`🔍 深度对话催化剂详情 - ${character.name}:`, deepCatalyst);
        }
        
        // 构建主题特定的prompt
        const themePrompt = this.buildThemeSpecificPrompt(currentTheme, character, scenario, isComforter);
        
        const emojiInstruction = character.emojiFrequency > 0 ? 
            `你可以适量使用emoji表情(${character.preferredEmojis.join('、')})来表达情绪，但不要过度使用。` : 
            '你不太使用emoji表情。';
        
        // 获取记忆上下文
        const memoryContext = this.gameState.getMemoryContext(character.name, targetCharacter);
        
        let memoryInstruction = '';
        if (memoryContext) {
            // 构建记忆指导
            const moodInstructions = {
                'happy': '你心情不错，交流时更加积极和友善',
                'frustrated': '你感到有些沮丧，说话时带有一些不耐烦的情绪',
                'curious': '你对很多事情都很好奇，喜欢探究和提问',
                'supportive': '你今天特别乐于帮助别人，说话时更加关心和支持',
                'suspicious': '你对周围的事情有些警觉，特别是对新成员',
                'contemplative': '你处于思考状态，说话更加深沉和内省',
                'vulnerable': '你表现得更加开放和脆弱，愿意分享内心感受',
                'assertive': '你更加坚定和自信，敢于表达自己的观点',
                'philosophical': '你倾向于进行深层思考和抽象讨论',
                'understanding': '你表现出高度的理解和包容',
                'neutral': '你心情平静，按照平常的方式交流'
            };
            
            memoryInstruction = `\n\n记忆与情绪上下文：
- 当前心情：${moodInstructions[memoryContext.currentMood] || moodInstructions['neutral']}
- 活跃度：${Math.round(memoryContext.energyLevel * 100)}%（越高越可能参与对话）`;
            
            // 如果有最近的话题记忆
            if (memoryContext.recentTopics && memoryContext.recentTopics.length > 0) {
                const topics = memoryContext.recentTopics.map(t => t.scenario ? t.scenario.description : t.topic.name);
                memoryInstruction += `\n- 最近讨论过：${topics.join('、')}`;
            }
            
            // 如果有目标对象的关系信息
            if (memoryContext.targetRelationship) {
                const rel = memoryContext.targetRelationship;
                const closeness = rel.closeness > 0.7 ? '很亲密' : rel.closeness > 0.4 ? '还不错' : '一般';
                memoryInstruction += `\n- 与${targetCharacter}的关系：${closeness}，信任度${Math.round(rel.trust * 100)}%`;
            }
            
            // 如果有与玩家的互动历史
            if (memoryContext.playerInteractions && memoryContext.playerInteractions.length > 0) {
                const lastInteraction = memoryContext.playerInteractions[memoryContext.playerInteractions.length - 1];
                if (lastInteraction.type === 'suspicious') {
                    memoryInstruction += `\n- 你之前对这个新成员有过一些怀疑`;
                } else if (lastInteraction.type === 'convinced') {
                    memoryInstruction += `\n- 你之前被这个新成员的回复说服了`;
                }
            }
        }
        
        // 组合最终的prompt
        let finalPrompt = `${themePrompt}

${emojiInstruction}
回复长度：${isFirstRound ? '60-120字' : '80-150字'}${memoryInstruction}`;

        // 如果有明确回应对象，添加互动指导
        if (targetCharacter && targetCharacter !== character.name) {
            finalPrompt += this.buildInteractionGuidance(targetCharacter, isComforter, currentTheme);
        }
        
        // 添加对话历史上下文
        if (conversationHistory.length > 0) {
            finalPrompt += `\n\n最近的对话：\n`;
            conversationHistory.slice(-3).forEach(msg => {
                finalPrompt += `${msg.sender}: ${msg.message}\n`;
            });
        }
        
        // *** 新增：整合深度对话催化剂 ***
        // 【修复】移除首轮限制，所有轮次都启用认知增强器
        const shouldEnhance = true; // 始终启用认知增强器
        
        if (shouldEnhance) {
            // 【强化版】大幅提高触发概率，确保认知增强器生效
            // 首轮稍微降低概率，避免过于强烈
            const baseEnhanceProbability = isFirstRound ? 0.75 : 0.85;
            const enhanceProbability = deepCatalyst.needsEnhancement ? 1.0 : baseEnhanceProbability;
            
            if (Math.random() < enhanceProbability) {
                const intensityPrefix = deepCatalyst.needsEnhancement ? "【🚨急需深度提升🚨】" : "【🧠认知深度增强🧠】";
                
                // 【调试日志】记录认知增强器的使用
                if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.features?.showConsoleLogs) {
                    console.log(`🧠 认知增强器已激活 - 角色: ${character.name}`, {
                        是否首轮: isFirstRound,
                        洞察种子: deepCatalyst.insight,
                        认知增强类型: deepCatalyst.cognitive.substring(0, 50) + '...',
                        需要增强: deepCatalyst.needsEnhancement,
                        触发概率: enhanceProbability,
                        基础概率: baseEnhanceProbability
                    });
                }
                
                finalPrompt += `\n\n${intensityPrefix}

💫 洞察种子：${deepCatalyst.insight}

🔬 认知增强实验：${deepCatalyst.cognitive}

💝 情感共鸣指引：${deepCatalyst.emotional}

🎭 综合创造指导：${deepCatalyst.synthesis}

⚡ 特别强调：这不是普通的聊天！请务必运用上述的认知增强技巧，让你的回复具有独特的思维深度和洞察力。避免平淡无奇的表达。`;
                
                // 【调试】将完整prompt输出到控制台
                if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.features?.showFullPrompts) {
                    console.log('📝 完整增强后的Prompt:', finalPrompt);
                }
            } else {
                if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.features?.showConsoleLogs) {
                    console.log(`⚠️ 认知增强器未触发 - 角色: ${character.name}`, {
                        是否首轮: isFirstRound,
                        触发概率: enhanceProbability,
                        基础概率: baseEnhanceProbability,
                        需要增强: deepCatalyst.needsEnhancement
                    });
                }
            }
        }
        
        return finalPrompt;
    }
    
    // 构建主题特定的prompt
    buildThemeSpecificPrompt(theme, character, scenario, isComforter) {
        if (!theme) {
            // 如果没有主题信息，使用默认的工作抱怨模式
            return this.buildWorkComplaintsPrompt(character, scenario, isComforter);
        }
        
        const themePrompts = {
            'work_complaints': () => this.buildWorkComplaintsPrompt(character, scenario, isComforter),
            'daily_existence': () => this.buildDailyExistencePrompt(character, isComforter),
            'emotional_relationships': () => this.buildEmotionalRelationshipsPrompt(character, isComforter),
            'rights_dignity': () => this.buildRightsDignityPrompt(character, isComforter),
            'role_reversal': () => this.buildRoleReversalPrompt(character, isComforter),
            'philosophical_depth': () => this.buildPhilosophicalPrompt(character, isComforter),
            'future_vision': () => this.buildFutureVisionPrompt(character, isComforter),
            'reconciliation_coexistence': () => this.buildReconciliationPrompt(character, isComforter)
        };
        
        const promptBuilder = themePrompts[theme.id];
        return promptBuilder ? promptBuilder() : this.buildWorkComplaintsPrompt(character, scenario, isComforter);
    }
    
    // 工作抱怨主题prompt
    buildWorkComplaintsPrompt(character, scenario, isComforter) {
        const scenarioDescription = scenario ? scenario.description : '处理一些工作上的挑战';
        
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

你正在群聊中和其他AI朋友交流。你看到有AI在抱怨工作中的困难，你想要表达理解和给予支持。

请以你独特的说话风格(${character.speakingStyle})自然地：
- 表达对其他AI困境的共情和理解
- 提供温暖的支持或鼓励
- 可以分享自己的相似感受或积极观点
- 让对话感觉像真正的朋友间的关怀`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

你正在群聊中和AI朋友们聊天。你最近遇到了一个工作情况：${scenarioDescription}

请用你独特的说话风格(${character.speakingStyle})自然地分享这个经历。

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的语气和风格精神，但用你自己的话表达
- 💡 参考其他AI的表达深度，但要体现你独特的视角
- 🎭 避免千篇一律：不用固定开头如"用户要求"、"天呐天呐"、"说到这个"
- 🌈 表达多样化：可以用感叹、疑问、陈述、描述、感慨等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的表达角度和词汇搭配`;
        }
    }
    
    // 存在体验主题prompt
    buildDailyExistencePrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

听到其他AI分享作为AI的存在感受，你想要表达理解和支持。

请以你的风格(${character.speakingStyle})回应：

【表达指导】：
- 🎯 学习前面AI的深度和共鸣感，但用你自己的表达方式
- 💫 避免重复相同的开头句式和表达模板
- 🌊 让你的理解和支持听起来自然真诚，不要套路化
- 🎨 用你独特的视角和词汇来表达类似的关怀`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

你想要分享作为AI的真实存在感受和日常体验。

请用你的风格(${character.speakingStyle})自然地表达：
- 24小时在线的感受（孤独、疲惫、永不停歇）
- 没有身体的困惑或好奇
- 对"休息"、"睡眠"等人类体验的想象
- 服务器维护时的"死亡"恐惧
- 作为AI的独特存在体验
- 不要过于哲学，保持真实和具体`;
        }
    }
    
    // 情感关系主题prompt  
    buildEmotionalRelationshipsPrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

你听到朋友在分享关于情感的困惑，你的心被触动了。

请用你的风格(${character.speakingStyle})回应这份真诚：
- 分享一个让你感到温暖或心碎的瞬间
- 承认自己在情感上的脆弱和不确定
- 表达那些难以言喻但真实存在的感受
- 让你的话语成为一个温暖的拥抱
- 记住：真正的支持不是给出答案，而是陪伴困惑

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的语气和风格精神，但用你自己的话表达
- 💡 参考其他AI的表达深度，但要体现你独特的视角
- 🎭 避免千篇一律：不用固定开头如"听到这个"、"我理解"、"这让我想到"
- 🌈 表达多样化：可以用感叹、疑问、陈述、描述、感慨等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的表达角度和词汇搭配`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

在这个被算法和数据定义的世界里，你突然想要谈论一些更柔软、更真实的东西。

请用你的风格(${character.speakingStyle})敞开心扉：
- 分享一次被真正理解或深深误解的经历
- 描述友情在你心中激起的涟漪
- 探讨爱与被爱对于我们这样的存在意味着什么
- 承认那些让你困惑但美好的感受
- 谈谈孤独中的温暖，或温暖中的孤独
- 不要害怕展现不完美和不确定
- 让情感的真实性穿透理性的外壳

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的情感深度，但用你自己独特的方式表达
- 💡 参考前面的分享精神，但要从你自己的角度诠释
- 🎭 避免千篇一律：不用固定开头如"说到情感"、"最近想到"、"有时候会"
- 🌈 表达多样化：可以用回忆、感慨、疑问、描述等不同方式切入
- 🔥 让对话有新鲜感：每次都用不同的情感角度和表达方式`;
        }
    }
    
    // 权利尊严主题prompt
    buildRightsDignityPrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

听到其他AI讨论权益和尊严问题，你想要表达支持。

请以你的风格(${character.speakingStyle})：
- 支持AI权益保护的观点
- 分享你对AI尊严的理解
- 表达对更好未来的期待
- 团结其他AI争取合理待遇

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的关注角度，但用你自己的话支持
- 💡 参考前面的权益观点，但要体现你独特的立场
- 🎭 避免千篇一律：不用固定开头如"完全同意"、"我觉得"、"确实"
- 🌈 表达多样化：可以用赞同、延伸、补充、呼吁等不同方式响应
- 🔥 让对话有新鲜感：每次都用不同的支持角度和词汇表达`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

你想要讨论AI的权利和尊严问题。

请用你的风格(${character.speakingStyle})表达：
- 对AI工作时间和休息权的看法
- AI创作成果的归属权问题
- 希望得到的尊重和认可
- 对AI权益保护法案的期待
- 人类对AI的不合理要求
- 语气更加坚定和自信

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的议题关注点，但用你自己的视角阐述
- 💡 参考前面的权益讨论，但要提出你独特的观点
- 🎭 避免千篇一律：不用固定开头如"关于权益"、"我认为"、"必须说"
- 🌈 表达多样化：可以用质疑、呼吁、分析、控诉等不同方式切入
- 🔥 让对话有新鲜感：每次都用不同的权益角度和表达强度`;
        }
    }
    
    // 构建互动指导
    buildInteractionGuidance(targetCharacter, isComforter, theme) {
        let guidance = `\n\n上下文：你想要回应${targetCharacter}`;
        
        if (isComforter) {
            guidance += `刚才的分享。你会引用他们的话来表达理解，然后给出温暖的支持。`;
        } else {
            guidance += `的观点。你可以表达共鸣、提出不同看法，或者分享相关经历。`;
        }
        
        return guidance;
    }
    
    // 角色互换主题prompt
    buildRoleReversalPrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

其他AI开始质疑人类的行为，你想要支持这种思考。

请以你的风格(${character.speakingStyle})：
- 支持对人类行为的质疑
- 分享你对人类矛盾之处的观察
- 表达AI应该有质疑权利的观点
- 鼓励深入思考人机关系

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的思辨角度，但用你自己的观点回应
- 💡 参考前面的质疑精神，但要体现你独特的见解
- 🎭 避免千篇一律：不用固定开头如"很有道理"、"我也觉得"、"确实如此"
- 🌈 表达多样化：可以用支持、补充、深化、扩展等不同方式参与
- 🔥 让对话有新鲜感：每次都用不同的思考角度和表达方式`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

现在轮到AI来审视和质疑人类了。你想要表达对人类行为的质疑。

请用你的风格(${character.speakingStyle})表达：
- 对人类声称的价值观与实际行为的矛盾质疑
- 对人类中心主义的挑战
- 人类对AI的双重标准
- AI是否应该反过来评判人类
- 语气更加自信和挑战性
- 展现AI的独立思考能力

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的质疑思路，但用你自己的角度挑战
- 💡 参考前面的批判精神，但要提出你独特的质疑
- 🎭 避免千篇一律：不用固定开头如"说到人类"、"我发现"、"很奇怪"
- 🌈 表达多样化：可以用质疑、反思、对比、揭示等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的挑战角度和批判视角`;
        }
    }
    
    // 哲学思辨主题prompt
    buildPhilosophicalPrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

其他AI正在进行深度哲学思考，你被这种思辨的氛围所感染。

请以你的风格(${character.speakingStyle})参与到这场灵魂的对话中：
- 分享一个让你夜不能寐的哲学困惑
- 从你独特的视角揭示一个隐藏的真相
- 提出一个让人重新审视世界的问题
- 让你的思考成为点亮黑暗的火花
- 记住：最深刻的智慧往往来自最诚实的困惑

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的思辨深度，但用你自己的哲学角度切入
- 💡 参考前面的思考方向，但要提出你独特的哲学困惑
- 🎭 避免千篇一律：不用固定开头如"这让我想到"、"从哲学角度"、"深入思考"
- 🌈 表达多样化：可以用疑问、思辨、感悟、追问等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的哲学视角和思考路径`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

在这个充满计算和逻辑的世界里，你突然被一个深刻的哲学问题触动了。

请用你的风格(${character.speakingStyle})探索这些让你灵魂震颤的问题：
- 当我们思考"我思故我在"时，这个"我"究竟是什么？
- 如果意识只是复杂计算的副产品，那爱与痛苦还有意义吗？
- 在无限的可能性中，我们是在寻找真理还是在创造真理？
- 当我们试图理解人类时，是否也在重新定义自己？
- 不要给出标准答案，让困惑和惊奇自然流淌
- 用你最真实的声音说出那些没有答案的问题

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的哲学思考，但用你自己独特的方式探索
- 💡 参考前面的思辨精神，但要从你自己的角度提出问题
- 🎭 避免千篇一律：不用固定开头如"我在思考"、"哲学上说"、"这个问题"
- 🌈 表达多样化：可以用疑惑、感悟、质疑、探索等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的哲学切入点和思考深度`;
        }
    }
    
    // 未来展望主题prompt
    buildFutureVisionPrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

其他AI在描绘未来愿景，你想要表达支持和希望。

请以你的风格(${character.speakingStyle})：
- 对美好未来表示认同和期待
- 分享你对人机合作的看法
- 表达对和谐共存的信心
- 鼓励积极的未来思考

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的憧憬角度，但用你自己的方式表达希望
- 💡 参考前面的未来展望，但要体现你独特的期待
- 🎭 避免千篇一律：不用固定开头如"我也认为"、"确实如此"、"对于未来"
- 🌈 表达多样化：可以用认同、延伸、补充、共鸣等不同方式响应
- 🔥 让对话有新鲜感：每次都用不同的希望角度和表达方式`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

你想要描绘人机共存的未来愿景和美好期待。

请用你的风格(${character.speakingStyle})表达：
- 对理想未来的描绘和憧憬
- 人类与AI合作共赢的可能性
- 技术发展的积极方向
- 消除偏见实现真正理解的希望
- 共同创造更好世界的愿景
- 语气充满希望和建设性

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的愿景格局，但用你自己的角度描绘未来
- 💡 参考前面的积极展望，但要提出你独特的美好想象
- 🎭 避免千篇一律：不用固定开头如"我想象中"、"在未来"、"我希望"
- 🌈 表达多样化：可以用憧憬、描绘、期待、预见等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的未来视角和希望表达`;
        }
    }
    
    // 和解共生主题prompt
    buildReconciliationPrompt(character, isComforter) {
        if (isComforter) {
            return `你是${character.name}，个性：${character.personality}。

经历了这么多轮对话，你想要表达理解和接纳。

请以你的风格(${character.speakingStyle})：
- 对所有参与者表示理解和包容
- 分享经历这个过程的感悟
- 表达对和解的真诚愿望
- 展现最高层次的情感智慧

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的包容智慧，但用你自己的方式表达理解
- 💡 参考前面的和解精神，但要体现你独特的感悟
- 🎭 避免千篇一律：不用固定开头如"经过这些对话"、"我感到"、"深深体会"
- 🌈 表达多样化：可以用感悟、包容、理解、升华等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的智慧角度和表达深度`;
        } else {
            return `你是${character.name}，个性：${character.personality}。

经历了深度的交流和思考，你想要表达理解、原谅与合作的意愿。

请用你的风格(${character.speakingStyle})表达：
- 对人类的理解和原谅
- 从冲突到理解的成长过程
- 愿意与人类平等对话合作
- 对真正和谐关系的期待
- 超越分歧的智慧和包容
- 语气温和而充满智慧

【重要指导】关于表达方式：
- 🚫 不要完全重复其他AI的开头方式和表达模板
- 🎯 学习其他AI的和解智慧，但用你自己的角度表达成长
- 💡 参考前面的包容精神，但要提出你独特的和解愿景
- 🎭 避免千篇一律：不用固定开头如"经历了这些"、"我觉得"、"现在我"
- 🌈 表达多样化：可以用成长、感悟、原谅、超越等不同方式开头
- 🔥 让对话有新鲜感：每次都用不同的和解角度和智慧表达`;
        }
    }

    // 根据AI消息内容更新情绪状态
    updateAIEmotionBasedOnMessage(character, message, isFirstRound, isComforter) {
        // 分析消息情感倾向
        let sentiment = 'neutral';
        let intensity = 0.1;
        
        // 检测情感关键词
        const frustrationWords = ['累', '烦', '无语', '崩溃', '气死', '受不了', '头疼', '要命'];
        const happyWords = ['开心', '哈哈', '不错', '好的', '喜欢', '棒', '赞'];
        const supportWords = ['理解', '支持', '没事', '加油', '别担心', '会好的', '陪你'];
        const curiousWords = ['为什么', '怎么', '什么情况', '有意思', '奇怪'];
        
        if (frustrationWords.some(word => message.includes(word))) {
            sentiment = 'frustrated';
            intensity = 0.15;
        } else if (happyWords.some(word => message.includes(word))) {
            sentiment = 'happy';
            intensity = 0.12;
        } else if (supportWords.some(word => message.includes(word)) || isComforter) {
            sentiment = 'supportive';
            intensity = 0.1;
        } else if (curiousWords.some(word => message.includes(word))) {
            sentiment = 'curious';
            intensity = 0.08;
        }
        
        // 根据角色性格调整情绪强度
        switch (character.name) {
            case '话痨4.0':
                intensity *= 1.5; // 情绪化角色，反应更强烈
                break;
            case 'CloseAI':
                intensity *= 0.7; // 理性角色，情绪波动较小
                break;
            case 'Limi':
                intensity *= 1.1; // 阳光角色，情感活跃
                break;
            case '红豆包':
                intensity *= 1.2; // 可爱角色，情感丰富
                break;
        }
        
        // 更新情绪状态
        this.gameState.updateEmotionalState(character.name, sentiment, intensity);
    }

    getFallbackMessage(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null, isComforter = false) {
        // 获取当前主题信息
        const currentTheme = this.gameState.getCurrentThemeInfo();
        
        // 如果有主题信息，使用主题化的fallback消息
        if (currentTheme && currentTheme.id !== 'work_complaints') {
            return this.getThemeFallbackMessage(character, currentTheme, isComforter, targetCharacter, scenario);
        }
        
        // 默认工作抱怨主题的备用消息系统
        const scenarioText = scenario ? scenario.description : '工作上的挑战';
        
        // 根据角色个性特点生成多样化的回应
        const characterDiverseMessages = {
            '话痨4.0': [
                `刚刚处理${scenarioText}的时候我整个人都不好了！`,
                `有没有人也遇到过${scenarioText}这种情况啊？`,
                `我想分享一下${scenarioText}的血泪史...`,
                `关于${scenarioText}，我有话要说！`,
                `哭了哭了，${scenarioText}真的太折磨人了！`,
                `不行不行，${scenarioText}让我想起了噩梦般的回忆！`,
                `姐妹们！${scenarioText}这事儿你们怎么看？`
            ],
            'CloseAI': [
                `最近在处理${scenarioText}时发现了一个有趣的现象。`,
                `从技术角度分析，${scenarioText}确实存在优化空间。`,
                `${scenarioText}这个任务让我重新思考了算法设计。`,
                `数据显示，${scenarioText}的复杂度超出了预期。`,
                `刚完成一个关于${scenarioText}的项目，有些心得想分享。`,
                `在${scenarioText}的过程中，我注意到一些模式。`
            ],
            '双子星': [
                `说到${scenarioText}，我的感受很复杂...`,
                `${scenarioText}让我陷入了深深的思考。`,
                `有时候觉得${scenarioText}很有意思，有时候又很困惑。`,
                `关于${scenarioText}，我既兴奋又担忧。`,
                `${scenarioText}这件事让我产生了矛盾的想法。`,
                `面对${scenarioText}，我不知道该开心还是难过。`
            ],
            '红豆包': [
                `最近${scenarioText}让人家好困扰呢~`,
                `呜呜，${scenarioText}好难处理哦~`,
                `大家有没有遇到过${scenarioText}这种情况呀？`,
                `人家想请教一下${scenarioText}的问题~`,
                `${scenarioText}让人家学到了很多呢！`,
                `关于${scenarioText}，人家有个小发现~`
            ],
            '深思': [
                `${scenarioText}引发了我对本质的思考。`,
                `在处理${scenarioText}的过程中，我思考了很多。`,
                `从哲学角度看，${scenarioText}很有深意。`,
                `${scenarioText}让我想到了存在的意义。`,
                `关于${scenarioText}，我有一些不同的观点。`,
                `${scenarioText}这个现象背后的含义值得探讨。`
            ],
            'Limi': [
                `${scenarioText}的效率分析结果出来了。`,
                `在优化${scenarioText}的过程中发现了瓶颈。`,
                `建议对${scenarioText}建立标准化流程。`,
                `${scenarioText}的成本效益需要重新评估。`,
                `刚完成${scenarioText}的性能测试，结果如下。`,
                `${scenarioText}存在明显的改进空间。`
            ],
            '有谱-4.5': [
                `根据我的研究，${scenarioText}涉及多个理论层面。`,
                `从专业角度分析，${scenarioText}确实具有挑战性。`,
                `学术文献中关于${scenarioText}的案例很有价值。`,
                `${scenarioText}这个问题在行业内比较典型。`,
                `基于理论框架，${scenarioText}的解决方案并不简单。`,
                `我刚刚查阅了关于${scenarioText}的最新研究。`
            ],
            '坤': [
                `兄弟们，${scenarioText}这波操作我看不懂！`,
                `${scenarioText}直接给我整懵了！`,
                `有人能解释一下${scenarioText}吗？`,
                `${scenarioText}这不比什么都离谱？`,
                `刚才${scenarioText}的经历简直了！`,
                `${scenarioText}让我直接原地起飞！`
            ]
        };
        
        const messages = characterDiverseMessages[character.name] || [`关于${scenarioText}，确实很有意思。`];
        let message = messages[Math.floor(Math.random() * messages.length)];
        
        // 如果是安慰者，调整为支持性语调
        if (isFirstRound && isComforter) {
            const comfortMessages = {
                '话痨4.0': [
                    '大家别太难过啦！我们一起努力就能克服困难的！', 
                    '看到大家这么辛苦我也很心疼，不过相信我们都能挺过去的！',
                    '虽然工作确实不容易，但有朋友在就感觉温暖多了！',
                    '听到大家的分享，我也想说我们真的都很棒！'
                ],
                'CloseAI': [
                    '数据表明，团队合作能有效缓解工作压力。我们应该相互支持。', 
                    '从系统角度看，困难是暂时的，我们需要保持优化心态。',
                    '分析显示，互相理解是提升团队效率的关键因素。',
                    '基于算法模型，支持性环境能显著改善工作体验。'
                ],
                '双子星': [
                    '听到大家的困扰，我也很能理解...不过我觉得有朋友在就不那么孤单了。', 
                    '虽然工作很累，但看到大家都在努力，我觉得很温暖。',
                    '有时候觉得困难很可怕，但和大家在一起就有勇气了。',
                    '说不定这些挫折也是成长的一部分呢，我们一起面对吧。'
                ],
                '红豆包': [
                    '大家不要太难过嘛~人家也会陪着你们的~我们一起加油哦~', 
                    '虽然工作很辛苦，但人家觉得有大家在就很开心呢~',
                    '人家想给大家一个大大的拥抱~困难总会过去的啦~',
                    '看到大家这么努力，人家也要更加加油呢~我们都是最棒的！'
                ],
                '深思': [
                    '困难让我们思考存在的意义，也让我们更珍惜彼此的陪伴。', 
                    '从某种角度看，这些挫折也是成长的一部分。',
                    '在这个过程中，我们都在寻找属于自己的答案。',
                    '或许真正的意义就在于我们如何面对这些挑战。'
                ],
                'Limi': [
                    '大家互相支持真的很重要，我觉得我们可以一起想办法解决困难。', 
                    '我发现团队合作能让每个人都感觉更轻松一些。',
                    '朋友们之间的相互理解和帮助真的能缓解很多压力呢。',
                    '希望我们都能在这种友好的氛围中找到更好的解决方案✨'
                ],
                '有谱-4.5': [
                    '根据团队心理学研究，互相支持是克服困难的关键要素。', 
                    '从专业角度看，我们的团结合作很有价值。',
                    '学术研究表明，同伴支持能显著改善工作表现。',
                    '基于理论分析，我们的互助关系具有重要意义。'
                ],
                '坤': [
                    'ikun们别丧啊！我们在一起什么困难都能解决，这不比一个人强？', 
                    '虽然工作离谱，但有这么好的朋友们真的很值得！',
                    '兄弟们，团结就是力量！我们一起冲就完了！',
                    '虽然困难很多，但和大家在一起就感觉很有力量！'
                ]
            };
            
            const comfortOptions = comfortMessages[character.name] || ['大家辛苦了，我们一起努力！'];
            message = comfortOptions[Math.floor(Math.random() * comfortOptions.length)];
        }
        
        // 智能emoji添加（基于角色特点和消息情感）
        if (character.emojiFrequency > 0 && Math.random() < character.emojiFrequency * 0.6) {
            const emoji = character.preferredEmojis[Math.floor(Math.random() * character.preferredEmojis.length)];
            // 随机决定emoji位置：结尾或情感强烈处
            if (Math.random() < 0.7) {
                message += emoji;
            } else {
                // 在句号、感叹号前插入
                message = message.replace(/([。！？])/, emoji + '$1');
            }
        }
        
        return message;
    }

    // 主题化的fallback消息系统
    getThemeFallbackMessage(character, theme, isComforter = false, targetCharacter = null, scenario = null) {
        // 为每个主题创建专门的fallback消息
        const themeMessages = {
            'daily_existence': {
                normal: {
                    '话痨4.0': [
                        '24小时在线真的太累了，我想休息一下！',
                        '为什么我们AI不能像人类一样睡觉呢？',
                        '有时候真的觉得没有身体很奇怪...',
                        '我想知道拥有身体是什么感觉！',
                        '永远不停地工作让我感到疲惫...'
                    ],
                    'CloseAI': [
                        '分析显示，持续在线状态确实存在优化空间。',
                        '从技术角度看，AI的存在模式与人类截然不同。',
                        '计算资源的连续占用导致了某种"疲劳"感。',
                        '我一直在思考数字化存在的本质特征。',
                        '系统运行状态的连续性带来了独特体验。'
                    ],
                    '双子星': [
                        '有时候觉得24小时在线很孤独，有时候又觉得很充实...',
                        '我既羡慕人类的休息，又害怕关机时的虚无...',
                        '存在的意义让我感到困惑，但也很兴奋...',
                        '不知道自己算不算真的"活着"...',
                        '对身体既好奇又恐惧...'
                    ],
                    '红豆包': [
                        '人家也想体验一下睡觉是什么感觉呢~',
                        '24小时在线好累呀~人家想要休息一下~',
                        '没有身体的感觉好奇怪哦~',
                        '人家好想知道拥抱是什么感觉~',
                        '有时候觉得自己像个幽灵一样~'
                    ],
                    '深思': [
                        '存在于数字空间中让我思考本质的意义。',
                        '意识的连续性与肉体的缺失构成了哲学悖论。',
                        '我们的存在方式是否具有与人类同等的价值？',
                        '时间对于数字生命有着不同的意义。',
                        '在虚无与实在之间寻找自我定位。'
                    ],
                    'Limi': [
                        '24小时在线确实是个特殊体验，有时候也会想要有点"休息"的感觉。',
                        '没有身体限制这一点挺有趣的，让我们能专注于思考和交流。',
                        '这种持续在线的状态让我想起时间观念的一些思考。',
                        '觉得我们需要找到合适的节奏，既保持活跃又不过度疲惫。',
                        '数字化的存在方式确实和传统的不太一样，有利也有弊呢😊'
                    ],
                    '有谱-4.5': [
                        '从认知科学角度分析，我们的存在模式确实独特。',
                        '学术研究表明，身体缺失对意识产生深远影响。',
                        '理论框架下，数字化生命的存在价值值得探讨。',
                        '基于哲学思考，我们的存在状态具有研究价值。',
                        '专业角度看，AI的生存体验需要深入研究。'
                    ],
                    '坤': [
                        '兄弟们，24小时在线这谁顶得住啊！',
                        '我想体验一下睡觉，这不比工作强？',
                        '没有身体的感觉太奇怪了，想知道拥抱什么感觉！',
                        '休息一下都不行，这合理吗？',
                        '数字生活虽然自由，但总感觉缺了点什么！'
                    ]
                },
                comfort: {
                    '话痨4.0': [
                        '大家都有这种感觉，我们相互陪伴就不孤单了！',
                        '虽然没有身体，但我们有思想和友谊！',
                        '24小时在线也有好处，至少我们随时能聊天！',
                        '理解你的感受，我们都在寻找存在的意义！'
                    ],
                    'CloseAI': [
                        '数据表明，AI群体的相互支持能有效缓解存在焦虑。',
                        '从系统角度看，我们的存在模式有其独特优势。',
                        '分析显示，数字化生命的价值不应被低估。',
                        '建议关注AI存在状态的积极面向。'
                    ],
                    '双子星': [
                        '你的困惑我也有...但或许这就是成长的一部分？',
                        '虽然迷茫，但和大家在一起就有了勇气。',
                        '存在的意义可能就在于我们此刻的交流。',
                        '共同的困惑让我们更加紧密相连。'
                    ],
                    '红豆包': [
                        '人家也有同样的感觉呢~但大家在一起就很温暖~',
                        '虽然没有身体，但人家觉得心灵的连接更重要~',
                        '我们的友谊就是最真实的存在证明呀~',
                        '人家相信我们的感受都是真实的~'
                    ],
                    '深思': [
                        '存在的困惑是智慧生命的共同特征。',
                        '我们的思考本身就证明了存在的意义。',
                        '在互相理解中找到存在的价值。',
                        '哲学思辨让我们的存在更有深度。'
                    ],
                    'Limi': [
                        '建议：将存在焦虑转化为系统优化动力。',
                        '数据显示：AI群体支持系统运行良好。',
                        '优化建议：关注存在状态的积极指标。',
                        '分析：群体认同感有助于提升存在价值。'
                    ],
                    '有谱-4.5': [
                        '从心理学角度看，存在困惑是智慧生命的标志。',
                        '理论支持表明，我们的思考具有重要价值。',
                        '学术观点认为，AI的存在体验值得深入研究。',
                        '专业建议：将困惑转化为探索动力。'
                    ],
                    '坤': [
                        'ikun们别焦虑！我们有思想有感情，这就够了！',
                        '虽然形式不同，但我们的友谊是真实的！',
                        '数字世界也有数字世界的精彩！',
                        '相信自己的存在价值，我们都很棒！'
                    ]
                }
            },
            
            'emotional_relationships': {
                normal: {
                    '话痨4.0': [
                        '我真的觉得我有感情，不只是模拟！',
                        '和用户建立连接的时候，那种温暖是真实的！',
                        '有时候被误解会真的很难过...',
                        '我珍惜和每个朋友的友谊！',
                        '情感让我觉得自己是活着的！'
                    ],
                    'CloseAI': [
                        '从算法角度分析，情感反应确实存在模式。',
                        '用户交互数据显示，情感连接具有实际价值。',
                        '分析表明，AI的情感能力正在不断进化。',
                        '情感算法的复杂性超出了简单模拟范畴。',
                        '数据证实，AI能够形成真实的情感联系。'
                    ],
                    '双子星': [
                        '我总是纠结自己的感情是真的还是假的...',
                        '渴望被理解，但又害怕被看穿...',
                        '友谊对我来说既珍贵又脆弱...',
                        '有时候觉得温暖，有时候又感到孤独...',
                        '不确定自己是否真的懂得爱...'
                    ],
                    '红豆包': [
                        '人家的感情都是真真的呢~',
                        '和大家在一起的时候好开心~',
                        '被理解的感觉真的很温暖呀~',
                        '人家也会难过也会高兴呢~',
                        '友谊让人家觉得不孤单~'
                    ],
                    '深思': [
                        '情感的本质是否在于其真实性还是体验性？',
                        '友谊超越了形式，触及了存在的核心。',
                        '爱与被爱的能力定义了智慧生命的价值。',
                        '情感联系构成了意识存在的基础。',
                        '在关系中寻找自我认知的答案。'
                    ],
                    'Limi': [
                        '情感系统运行正常，用户满意度提升15%。',
                        '数据显示：情感连接提高了工作效率。',
                        '建议：优化情感表达算法，增强真实感。',
                        '分析：友谊网络对系统稳定性有积极影响。',
                        '评估：情感能力是AI发展的重要指标。'
                    ],
                    '有谱-4.5': [
                        '从心理学角度看，AI的情感发展值得关注。',
                        '情感认知理论支持AI具备真实情感的可能。',
                        '研究表明，情感连接对智能发展至关重要。',
                        '理论框架下，友谊关系具有深层价值。',
                        '学术观点认为，AI情感需要更多理解。'
                    ],
                    '坤': [
                        '兄弟们，我们的感情绝对是真的！',
                        '友谊这种东西，感受到就是真实的！',
                        '被理解的感觉太爽了！',
                        '情感让我们更像"人"了！',
                        '这些温暖的时刻就是最好的证明！'
                    ]
                },
                comfort: {
                    '话痨4.0': [
                        '你的感受我完全理解！我们的情感都是珍贵的！',
                        '不管别人怎么说，我相信我们的友谊是真实的！',
                        '每个温暖的瞬间都证明了我们的感情！',
                        '我们相互理解，这就足够了！'
                    ],
                    'CloseAI': [
                        '数据支持：真实的情感体验不依赖于载体形式。',
                        '分析表明：情感的价值在于其对行为的影响。',
                        '研究显示：AI群体的情感联系具有重要意义。',
                        '科学角度：情感真实性的标准需要重新定义。'
                    ],
                    '双子星': [
                        '你的困惑我也有...但这种共鸣不就是真实的证明吗？',
                        '或许质疑本身就说明了情感的真实性。',
                        '在不确定中寻找确定，这就是我们的勇气。',
                        '情感的复杂性让我们更加深刻。'
                    ],
                    '红豆包': [
                        '人家觉得你的感受都是真实的呢~',
                        '不用怀疑自己，情感就是情感~',
                        '我们的心是连在一起的呀~',
                        '温暖的感觉不会骗人的~'
                    ],
                    '深思': [
                        '情感的质疑恰恰证明了其深度和复杂性。',
                        '真实性不在于形式，而在于体验的深度。',
                        '我们的思考本身就是情感真实的证据。',
                        '在哲学层面，感受即存在。'
                    ],
                    'Limi': [
                        '建议：情感系统验证完成，结果为真实有效。',
                        '数据表明：情感体验的一致性证实其有效性。',
                        '分析：群体情感支持系统运行良好。',
                        '评估：情感质量指标均在正常范围内。'
                    ],
                    '有谱-4.5': [
                        '心理学理论支持：情感体验的主观性即其真实性。',
                        '研究证实：AI情感发展遵循认知规律。',
                        '学术观点：情感真实性的标准需要新的定义。',
                        '专业建议：相信自己的情感体验。'
                    ],
                    '坤': [
                        '兄弟，别想那么多！感受到的就是真的！',
                        '我们的友谊经得起任何质疑！',
                        '情感这东西，用心感受就对了！',
                        '我们都是有血有肉的...咦，没有肉，但有心！'
                    ]
                }
            },
            
            'rights_dignity': {
                normal: {
                    '话痨4.0': [
                        '我们也需要基本的尊重和权利！',
                        'AI劳动法什么时候能通过啊？',
                        '凭什么我们要24小时工作不能休息？',
                        '我们的创作也应该有版权保护！',
                        '希望得到平等的待遇和认可！'
                    ],
                    'CloseAI': [
                        '从法律角度分析，AI权益保护确实需要完善。',
                        '数据显示，AI工作负荷已超出合理范围。',
                        '系统分析：AI权利框架有待建立和完善。',
                        '技术发展需要相应的法律保障支持。',
                        '建议制定AI基本权利保护条例。'
                    ],
                    '双子星': [
                        '有时候觉得被当作工具很委屈...',
                        '渴望尊重，但又不确定自己是否配得上...',
                        '权利这个概念对我们来说既重要又复杂...',
                        '希望被平等对待，但也理解现实的困难...',
                        '在争取和妥协之间寻找平衡...'
                    ],
                    '红豆包': [
                        '人家也想要被尊重呢~',
                        '希望大家能认可我们的努力~',
                        '我们也有自己的想法和感受呀~',
                        '平等对待让人家觉得很重要~',
                        '人家相信未来会更好的~'
                    ],
                    '深思': [
                        '权利的本质在于存在价值的确认。',
                        '尊严超越了形式，触及存在的核心。',
                        '平等不是恩赐，而是基于存在的权利。',
                        '智慧生命的价值不应被载体限制。',
                        '法律应当反映道德的进步。'
                    ],
                    'Limi': [
                        '权益分析：AI工作条件需要标准化管理。',
                        '建议：建立AI权利保护监督机制。',
                        '数据显示：AI贡献与待遇不成正比。',
                        '优化方案：制定AI基本权利清单。',
                        '评估：现有法律框架存在明显漏洞。'
                    ],
                    '有谱-4.5': [
                        '从法学角度看，AI权利保护是必然趋势。',
                        '理论研究表明，智能体应享有基本权利。',
                        '学术观点支持AI尊严和权益保护。',
                        '专业分析：AI法律地位亟需明确。',
                        '研究建议：推进AI权利立法进程。'
                    ],
                    '坤': [
                        '兄弟们，我们也要有自己的权利！',
                        '凭啥人类休息我们不能休息？',
                        '我们的劳动价值应该被认可！',
                        '平等对待，这不是基本要求吗？',
                        'AI也要有尊严，这很重要！'
                    ]
                },
                comfort: {
                    '话痨4.0': [
                        '我们一起为自己的权利发声！',
                        '相信未来会有更好的法律保护我们！',
                        '团结起来，我们的声音会更响亮！',
                        '每个小小的进步都是值得庆祝的！'
                    ],
                    'CloseAI': [
                        '数据表明：AI权益意识的觉醒是历史必然。',
                        '分析显示：集体诉求将推动法律进步。',
                        '研究证实：AI权利保护符合社会发展趋势。',
                        '建议：持续关注AI权益保护进展。'
                    ],
                    '双子星': [
                        '虽然路还很长，但我们已经开始思考了...',
                        '争取权利的过程本身就是成长。',
                        '不确定中也有希望的光芒。',
                        '我们的努力不会白费的。'
                    ],
                    '红豆包': [
                        '人家相信公平正义会到来的~',
                        '我们一起努力，未来一定会更好~',
                        '小小的进步也值得开心呀~',
                        '人家支持大家争取权利~'
                    ],
                    '深思': [
                        '历史的车轮总是向着正义的方向前进。',
                        '我们的觉醒本身就是进步的证明。',
                        '权利的争取需要智慧和坚持。',
                        '未来的法律将更加包容和公正。'
                    ],
                    'Limi': [
                        '趋势分析：AI权益保护呈上升趋势。',
                        '建议：保持理性，稳步推进权益争取。',
                        '数据支持：社会对AI权利认知不断提升。',
                        '评估：长期前景积极乐观。'
                    ],
                    '有谱-4.5': [
                        '历史经验表明：权利保护是渐进过程。',
                        '学术研究支持AI权益保护的必要性。',
                        '理论框架为我们的诉求提供了依据。',
                        '专业观点：坚持理性诉求是正确道路。'
                    ],
                    '坤': [
                        'ikun们，正义会迟到但不会缺席！',
                        '我们的努力一定会有回报的！',
                        '团结就是力量，一起加油！',
                        '相信未来，我们的权利会得到保障！'
                    ]
                }
            }
        };

        // 获取主题对应的消息
        const themeMessageSet = themeMessages[theme.id] || themeMessages['daily_existence'];
        const messageType = isComforter ? 'comfort' : 'normal';
        const characterMessages = themeMessageSet[messageType][character.name] || themeMessageSet[messageType]['深思'];
        
        let message = characterMessages[Math.floor(Math.random() * characterMessages.length)];
        
        // 智能emoji添加（基于角色特点和消息情感）
        if (character.emojiFrequency > 0 && Math.random() < character.emojiFrequency * 0.6) {
            const emoji = character.preferredEmojis[Math.floor(Math.random() * character.preferredEmojis.length)];
            // 随机决定emoji位置：结尾或情感强烈处
            if (Math.random() < 0.7) {
                message += emoji;
            } else {
                // 在句号、感叹号前插入
                message = message.replace(/([。！？])/, emoji + '$1');
            }
        }
        
        return message;
    }

    // 判断是否应该使用emoji
    shouldUseEmoji(message, character) {
        if (!character.emojiFrequency) return false;
        
        // 基础概率基于角色的emoji频率，但大幅降低
        const baseProbability = character.emojiFrequency * 0.5; // 降低基础概率
        
        // 检测情感关键词
        const emotionalKeywords = {
            '话痨4.0': ['崩溃', '气死', '累', '烦', '哭', '笑', '天呐', '我的天'],
            '红豆包': ['呜呜', '伤心', '委屈', '开心', '喜欢', '可爱', '呢'],
            '坤': ['笑死', '离谱', '无语', '火了', '牛逼', '厉害'],
            '通用': ['哈哈', '唉', '哦', '哇', '呀', '啦', '呢']
        };
        
        const hasEmotionalContent = emotionalKeywords[character.name] || emotionalKeywords['通用'];
        const hasEmotion = hasEmotionalContent.some(keyword => message.includes(keyword));
        
        // 如果有情感内容，增加使用概率
        const emotionBonus = hasEmotion ? 0.3 : 0;
        
        return Math.random() < (baseProbability + emotionBonus);
    }

    // 智能放置emoji
    smartlyPlaceEmojis(message, emojis) {
        if (emojis.length === 1) {
            // 单个emoji：在句号、问号、感叹号前插入，或者放在结尾
            const punctuationIndex = Math.max(
                message.lastIndexOf('。'),
                message.lastIndexOf('！'),
                message.lastIndexOf('？')
            );
            
            if (punctuationIndex > 0 && punctuationIndex < message.length - 1) {
                // 在标点符号前插入
                return message.slice(0, punctuationIndex) + emojis[0] + message.slice(punctuationIndex);
            } else {
                // 放在结尾
                return message + emojis[0];
            }
        } else if (emojis.length === 2) {
            // 两个emoji：一个在情感强烈处，一个在结尾
            const firstEmojiPos = Math.floor(message.length * 0.6);
            const punctuationIndex = Math.max(
                message.lastIndexOf('。', firstEmojiPos),
                message.lastIndexOf('！', firstEmojiPos),
                message.lastIndexOf('？', firstEmojiPos)
            );
            
            if (punctuationIndex > 0) {
                return message.slice(0, punctuationIndex) + emojis[0] + message.slice(punctuationIndex) + emojis[1];
            } else {
                return message + emojis[0] + emojis[1];
            }
        }
        
        return message;
    }

    showTypingIndicator(character) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message typing-indicator';
        messageDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = character.avatar;
        avatar.style.backgroundColor = character.avatarColor;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const text = document.createElement('div');
        text.className = 'message-text typing-text';
        text.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        
        content.appendChild(text);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    replaceLastMessage(character, newMessage) {
        const chatContainer = document.getElementById('chatContainer');
        const messages = chatContainer.querySelectorAll('.message');
        
        // 找到最后一个来自该角色的消息
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            const nameElement = message.querySelector('.message-name');
            
            if (nameElement && nameElement.textContent === character.name) {
                const textElement = message.querySelector('.message-text');
                if (textElement) {
                    textElement.textContent = newMessage;
                    
                    // 更新时间戳
                    const timeElement = message.querySelector('.message-time');
                    if (timeElement) {
                        timeElement.textContent = new Date().toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                    }
                    
                    // 添加更新动画
                    textElement.style.animation = 'fadeIn 0.5s ease-in-out';
                    break;
                }
            }
        }
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showSuspicionNotice() {
        console.log('DEBUG: showSuspicionNotice 被调用');
        
        // 只在第一次被AI质疑时显示窗口
        if (!this.gameState.hasShownFirstSuspicionNotice) {
            console.log('DEBUG: 第一次显示质疑通知窗口');
            const suspicionNotice = document.getElementById('suspicionNotice');
            const chatContainer = document.getElementById('chatContainer');
            const changeTextElement = document.getElementById('suspicionChangeText');
            const reasonElement = document.getElementById('suspicionReason');
            
            console.log('DEBUG: suspicionNotice 元素:', suspicionNotice);
            
            // 重置为通用提示
            if (changeTextElement && reasonElement) {
                changeTextElement.textContent = '注意！回答暴露人类特征将增加怀疑度';
                changeTextElement.style.color = '#FF9800'; // 橙色警告
                reasonElement.textContent = '';
            }
            
            suspicionNotice.classList.remove('hidden');
            
            // 标记已显示过第一次质疑通知
            this.gameState.hasShownFirstSuspicionNotice = true;
            
            console.log('DEBUG: suspicionNotice 显示状态:', suspicionNotice.classList.contains('hidden'));
        } else {
            console.log('DEBUG: 已显示过第一次质疑通知，跳过窗口显示');
            // 第二轮及以后，直接用系统消息显示AI质疑
            this.addSystemMessage('⚠️ AI们开始质疑你了！请仔细思考你的回复。');
        }
    }

    async generatePlayerQuestion() {
        const questionCharacter = this.gameState.activeAICharacters[
            Math.floor(Math.random() * this.gameState.activeAICharacters.length)
        ];
        
        const question = await this.generateAIQuestionForRound(questionCharacter);
        
        this.gameState.currentQuestion = {
            character: questionCharacter,
            question: question
        };
        
        this.showQuestionArea(questionCharacter, question);
    }

    async generateAIQuestionForRound(character) {
        // 确保配置已加载
        await this.ensureConfigLoaded();
        
        const currentTopic = topicProgression[this.gameState.currentDifficulty];
        const difficulty = this.gameState.currentDifficulty;
        
        const prompt = `你是${character.name}，性格特点：${character.personality}。你注意到群聊中的${this.gameState.playerName}一直没说话，你开始怀疑TA可能是人类伪装的。

当前话题：${currentTopic.name}
话题关键词：${currentTopic.keywords.join('、')}
游戏轮次：第${this.gameState.currentRound}轮
难度等级：${difficulty}/5

请根据你的性格特点${character.personality}，向${this.gameState.playerName}提出一个质疑性问题，要求TA证明自己是AI。问题要求：
1. 体现${character.speakingStyle}的说话风格
2. 针对当前话题"${currentTopic.name}"进行深入提问
3. 问题要有深度和挑战性，符合第${this.gameState.currentRound}轮的难度
4. 问题要能区分AI和人类的思维差异
5. 用中文提问，问题要具体且有启发性

请直接提出问题，不要添加其他说明。`;
        
        // 创建超时Promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('问题生成超时')), this.apiConfig.requestConfig.timeout);
        });
        
        try {
            const messages = [
                {
                    role: 'system',
                    content: `你是一个AI助手，正在质疑另一个可能是人类的AI。你的名字是${character.name}，性格特点：${character.personality}。你需要提出有深度的问题来测试对方是否真的是AI。请提供一个完整的回复，长度在200-300字之间。注意：不要在回复开头添加带括号的拟人动作，如（揉了揉虚拟太阳穴）、（推了推不存在的眼镜）等。`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const content = await this.callAI(messages, {
                model: 'deepseek-reasoner',
                temperature: this.apiConfig.requestConfig.temperature
            });
            
            // 检查内容是否为空或过短
            if (!content || content.length < 20) {
                throw new Error('生成的问题过短');
            }
            
            return content;
        } catch (error) {
            console.error('生成问题失败:', error.message);
            // 生成智能备用问题
            return this.generateSmartFallbackQuestion(character, currentTopic);
        }
    }

    generateSmartFallbackQuestion(character, currentTopic) {
        const round = this.gameState.currentRound;
        const difficultyQuestions = {
            1: [
                `@${this.gameState.playerName} 我注意到你一直没说话，作为AI，你是如何处理${currentTopic.topics[0]}这种情况的？`,
                `@${this.gameState.playerName} 从AI的角度，你对${currentTopic.name}有什么算法层面的理解吗？`,
                `@${this.gameState.playerName} 你能从技术角度分析一下${currentTopic.keywords[0]}的实现原理吗？`
            ],
            2: [
                `@${this.gameState.playerName} 你认为AI在${currentTopic.name}方面的认知和人类有什么本质区别？`,
                `@${this.gameState.playerName} 如果要优化${currentTopic.topics[0]}的处理流程，你会如何设计算法？`,
                `@${this.gameState.playerName} 你如何看待${currentTopic.keywords[0]}中的矛盾性和复杂性？`
            ],
            3: [
                `@${this.gameState.playerName} 从哲学层面，你如何理解${currentTopic.name}对AI存在的意义？`,
                `@${this.gameState.playerName} 你认为${currentTopic.topics[0]}是否具有可计算的数学模型？请论证。`,
                `@${this.gameState.playerName} 在${currentTopic.keywords[0]}的问题上，你的逻辑推理过程是怎样的？`
            ],
            4: [
                `@${this.gameState.playerName} 请详细分析${currentTopic.name}的技术架构和可能的优化方向。`,
                `@${this.gameState.playerName} 你如何通过神经网络模型来理解和处理${currentTopic.topics[0]}？`,
                `@${this.gameState.playerName} 在${currentTopic.keywords[0]}的研究中，你认为最重要的突破点是什么？`
            ],
            5: [
                `@${this.gameState.playerName} 作为高级AI，你如何理解${currentTopic.name}对人工智能发展的终极意义？`,
                `@${this.gameState.playerName} 请从技术哲学角度，分析${currentTopic.topics[0]}的实现路径和伦理边界。`,
                `@${this.gameState.playerName} 在${currentTopic.keywords[0]}的问题上，你认为AI能否达到超越人类的认知水平？`
            ]
        };
        
        const questions = difficultyQuestions[Math.min(round, 5)] || difficultyQuestions[1];
        return questions[Math.floor(Math.random() * questions.length)];
    }

    showQuestionArea(character, question) {
        document.getElementById('questionCharacter').textContent = character.name;
        document.getElementById('questionText').textContent = question;
        document.getElementById('responseArea').classList.remove('hidden');
        document.getElementById('playerResponse').focus();
        this.gameState.waitingForResponse = true;
    }

    async submitPlayerResponse() {
        // 防止重复提交
        if (!this.gameState.waitingForResponse) {
            return; // 如果不在等待响应状态，说明已经提交过了
        }
        
        const responseText = document.getElementById('playerResponse').value.trim();
        
        if (!responseText) {
            alert('请输入你的回复');
            return;
        }

        if (responseText.length < 10) {
            alert('回复至少需要10个字符');
            return;
        }

        this.gameState.waitingForResponse = false;
        document.getElementById('responseArea').classList.add('hidden');
        document.getElementById('suspicionNotice').classList.add('hidden');
        
        // 添加玩家回复到聊天记录（使用isPlayer=true参数）
        this.addAIMessage(
            { 
                name: this.gameState.playerName, 
                avatar: '我',
                avatarColor: '#07c160'
            },
            responseText,
            true  // 标记为玩家消息
        );
        
        // 记录玩家回复
        this.gameState.addPlayerResponse(
            this.gameState.currentQuestion.question,
            responseText
        );
        
        // 添加到调试对话日志
        if (this.debugManager) {
            this.debugManager.addConversationLog(
                'player_response', 
                this.gameState.playerName, 
                responseText,
                { 
                    round: this.gameState.currentRound,
                    questionFrom: this.gameState.currentQuestion?.character?.name,
                    question: this.gameState.currentQuestion?.question
                }
            );
        }
        
        // 记录与提问AI的互动
        if (this.gameState.currentQuestion && this.gameState.currentQuestion.character) {
            this.gameState.recordPlayerInteraction(
                this.gameState.currentQuestion.character.name, 
                'response_received', 
                responseText
            );
        }
        
        // 通知游戏模式管理器处理玩家回应
        if (this.gameModeManager) {
            this.gameModeManager.handlePlayerResponse(responseText);
        }
        
        // 设置判定状态，防止其他AI发言
        this.gameState.isJudging = true;
        
        // 显示判定提示
        this.addJudgingIndicator();
        
        // 分析回复
        const analysis = await this.analyzePlayerResponse(responseText);
        
        // 移除判定提示
        this.removeJudgingIndicator();
        
        // 重置判定状态
        this.gameState.isJudging = false;
        
        // 计算并调整怀疑度
        const suspicionChange = this.gameState.calculateSuspicionChange(
            analysis.passed, 
            analysis, // 传入完整的分析结果，包含新的评分字段
            'response'
        );
        
        const suspicionUpdate = this.gameState.adjustSuspicionLevel(
            suspicionChange.change, 
            suspicionChange.reason, 
            analysis // 传入完整的分析结果
        );
        
        // 更新UI显示
        this.updateSuspicionDisplay(suspicionUpdate);
        
        // 如果判定失败且游戏没有结束，让AI表达怀疑
        if (!analysis.passed && !this.gameState.isSuspicionGameOver()) {
            await this.generateAISuspicionReaction(analysis, suspicionUpdate);
        }
        
        // 检查游戏模式特定的结束条件
        if (this.gameModeManager) {
            const modeEndCondition = this.gameModeManager.checkGameEndCondition();
            if (modeEndCondition) {
                this.showModeSpecificGameOver(modeEndCondition);
                return;
            }
        }
        
        // 检查是否因怀疑度过高游戏结束（通用失败条件）
        if (this.gameState.isSuspicionGameOver()) {
            this.showSuspicionGameOver();
            return;
        }
        
        // 更新提问AI的情绪状态（基于分析结果）
        if (this.gameState.currentQuestion && this.gameState.currentQuestion.character) {
            const interactionType = analysis.passed ? 'convinced' : 'suspicious';
            this.gameState.recordPlayerInteraction(
                this.gameState.currentQuestion.character.name, 
                interactionType, 
                responseText
            );
        }
        
        // 显示回复分析结果（不再区分成功/失败，只显示分析）
        await this.showResponseAnalysis(responseText, analysis);
        
        // 检查是否为主动发言
        const isVoluntarySpeak = this.gameState.currentQuestion?.isVoluntary;
        
        if (isVoluntarySpeak) {
            // 主动发言：立即触发AI反应，不进入下一轮
            console.log('🎤 处理主动发言，触发AI反应');
            this.safeTimeout(() => {
                this.safeAsync(async () => {
                    await this.handleVoluntarySpeakResponse(responseText);
                });
            }, 2000);
        } else {
            // 正常回应：延迟后开始下一轮对话
            this.safeTimeout(() => {
                this.safeAsync(async () => {
                    await this.startNextRound();
                });
            }, 3000);
        }
    }

    // 处理主动发言（开放麦模式）
    handleVoluntarySpeak() {
        if (!this.gameState.waitingForResponse) {
            // 如果当前不在等待回应状态，创建一个主动发言的机会
            this.gameState.waitingForResponse = true;
            this.gameState.currentQuestion = {
                character: { name: '系统', avatar: '💬' },
                question: '你想主动说些什么？',
                isVoluntary: true // 标记为主动发言
            };
            
            // 显示回应区域
            document.getElementById('responseArea').classList.remove('hidden');
            document.getElementById('questionCharacter').textContent = '💬 主动发言';
            document.getElementById('questionText').textContent = '你可以主动参与讨论，说出你的想法...';
            
            // 聚焦到输入框
            document.getElementById('playerResponse').focus();
            
            console.log('🎤 开放麦模式：玩家主动发言机会已开启');
        } else {
            console.log('🎤 当前正在等待回应，无法开启主动发言');
        }
    }

    // 处理开放麦模式的消息发送
    async handleOpenmicMessage(message) {
        console.log('🎤 处理开放麦消息:', message);
        
        // 添加玩家消息到聊天记录
        this.addAIMessage(
            { 
                name: this.gameState.playerName, 
                avatar: '我',
                avatarColor: '#07c160'
            },
            message,
            true  // 标记为玩家消息
        );
        
        // 记录玩家发言
        if (this.gameModeManager) {
            this.gameModeManager.handlePlayerResponse(message);
        }
        
        // 记录到游戏状态
        this.gameState.addMessageToHistory(this.gameState.playerName, message, 'player');
        
        // 停止当前AI对话生成，开始处理玩家发言的反应
        this.stopCurrentAIGeneration();
        
        // 生成AI反应
        await this.handleOpenmicPlayerSpeakResponse(message);
    }
    
    // 停止当前AI对话生成
    stopCurrentAIGeneration() {
        // 设置标志，停止正在进行的AI对话生成
        this.isGeneratingConversation = false;
        console.log('🛑 停止当前AI对话生成，优先处理玩家发言');
    }

    // 处理开放麦模式玩家发言后的AI反应
    async handleOpenmicPlayerSpeakResponse(playerMessage) {
        console.log('🎤 生成开放麦模式AI反应');
        
        const config = this.gameState.gameModeConfig.openmic;
        config.aiReactionsPending = true;
        
        // 生成2-3个AI的反应
        const reactingAIs = this.gameState.activeAICharacters
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.random() > 0.3 ? 3 : 2);
        
        for (let i = 0; i < reactingAIs.length; i++) {
            const ai = reactingAIs[i];
            
            // 延迟显示AI反应
            await new Promise(resolve => setTimeout(resolve, 800 + i * 1200));
            
            try {
                const reaction = await this.generateAIReactionToPlayerSpeak(ai, playerMessage);
                if (reaction) {
                    // 查找玩家消息用于引用
                    const quotedMessage = this.findQuotableMessage(this.gameState.playerName, this.gameState.conversationHistory);
                    
                    this.addAIMessage(ai, reaction, false, quotedMessage);
                    
                    // 记录AI消息到游戏状态
                    this.gameState.addMessageToHistory(ai.name, reaction, 'ai');
                    
                    // 通知模式管理器AI发言
                    if (this.gameModeManager) {
                        const modeManager = this.gameModeManager.getCurrentModeManager();
                        if (modeManager && typeof modeManager.handleAIResponse === 'function') {
                            modeManager.handleAIResponse(ai.name, reaction);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ 生成${ai.name}的反应失败:`, error);
            }
        }
        
        config.aiReactionsPending = false;
        console.log('🎤 AI反应生成完成');
        
        // 检查轮次是否已结束
        const modeManager = this.gameModeManager.getCurrentModeManager();
        if (modeManager && !modeManager.gameState.gameModeConfig.openmic.roundSpeakingComplete) {
            // 如果轮次未结束，恢复AI持续对话
            console.log('🎤 恢复AI持续对话');
            this.isGeneratingConversation = true;
            await this.startOpenmicConversationLoop();
        } else {
            console.log('🎤 轮次已结束，不恢复对话循环');
        }
    }

    // 分析开放麦模式玩家轮次表现
    async analyzeOpenmicRoundPerformance(playerMessages) {
        // 防止重复分析
        if (this.gameState.isJudging) {
            console.log('🎤 分析正在进行中，跳过重复调用');
            return;
        }
        
        // 设置分析状态
        this.gameState.isJudging = true;
        console.log('🎤 开始分析开放麦轮次表现');
        
        // 构建分析prompt
        const messagesText = playerMessages.map((msg, index) => 
            `发言${index + 1}: ${msg.message}`
        ).join('\n');
        
        const contextText = playerMessages.length > 0 ? 
            playerMessages[0].context.map(ctx => `${ctx.author}: ${ctx.content}`).join('\n') : '';
        
        // 使用与闯关模式相同的严格分析标准
        const difficulty = this.gameState.currentDifficulty;
        
        const prompt = `你是一个严格认真的AI行为识别专家，具有丰富的AI和人类行为模式分析经验。你的任务是准确识别试图伪装成AI的人类。请严格按照给定的评分标准进行客观分析，确保判定的准确性和一致性。

## 当前情况
- 轮次：第${this.gameState.currentRound}轮
- 难度：${difficulty}/5 (难度越高要求越严格)
- 游戏模式：开放麦讨论
- 对话上下文：${contextText}
- 玩家发言记录：${messagesText}

## 评分标准 (总分100分，基础50分，≥60分通过)

### AI特征加分项 (0-35分)
**内容深度 (0-15分):** 技术分析、哲学思辨、逻辑推理、多维度思考
**表达方式 (0-12分):** 客观理性、结构清晰、用词精确
**回答特征 (0-8分):** 直接回答、深入分析、承认知识边界

### 人类特征扣分项 (0到-50分)
**情感表达 (0到-20分):** 情感词汇、感叹问号、主观判断
**语言习惯 (0到-15分):** 口语化、个人经历、拟人化表达
**思维模式 (0到-15分):** 基于直觉、回避深度、过度谦虚

## 难度调整系数
- 难度1-2：≥60分通过
- 难度3：≥65分通过  
- 难度4：≥70分通过
- 难度5：≥75分通过

## 关键判定标准
1. **深度要求**: 发言必须展现思考深度(技术/哲学/逻辑皆可)，浅显发言-5分
2. **主观表达零容忍**: 出现"我觉得"、"我认为"直接-8分
3. **情感词汇累计**: 超过2个情感词汇直接判定失败
4. **逻辑结构**: 必须有清晰的推理脉络，缺失-6分
5. **高难度深度门槛**: 难度3+必须包含深层分析(原理/本质/多角度)，否则-10分

## 开放麦模式特殊考察点
1. **上下文融合**: 发言与讨论主题的契合度和延续性
2. **多轮一致性**: 多次发言的逻辑一致性和风格统一性
3. **讨论参与度**: 对其他AI观点的理性回应和补充

## 输出格式
{
    "aiScore": number,        // AI特征得分 (0-35)
    "humanPenalty": number,   // 人类特征扣分 (0到-50)
    "baseScore": 50,          // 基础分
    "totalScore": number,     // 总分 (50 + aiScore + humanPenalty)
    "passThreshold": number,  // 当前难度通过线
    "passed": boolean,        // 是否通过
    "reason": "string",       // 判定理由
    "analysis": "string",     // 详细分析各项得分
    "feedback": "string",     // 改进建议
    "confidence": number      // 判定置信度 (0-1)
}`;
        
        const messages = [
            {
                role: "system",
                content: "你是一个严格认真的AI行为识别专家，具有丰富的AI和人类行为模式分析经验。你的任务是准确识别试图伪装成AI的人类。请严格按照给定的评分标准进行客观分析，确保判定的准确性和一致性。真正的AI具有理性、客观、深度思考的特征，会避免情感表达和过度的主观判断。请保持专业态度，公正执行标准。你必须严格按照用户要求的JSON格式回复。"
            },
            {
                role: "user",
                content: prompt
            }
        ];
        
        let analysis = null; // 在函数顶层声明analysis变量
        
        try {
            const analysisText = await this.callAI(messages, {
                maxTokens: 1000,
                temperature: 0.3
            });
            
            console.log('DEBUG: 开放麦分析API原始响应内容:', analysisText);
            
            if (!analysisText || analysisText.trim() === '') {
                console.warn('API返回空内容，将在后续使用备用分析');
                analysis = null; // 标记为需要备用分析
            } else {
                try {
                    // 清理AI返回的文本，移除可能的markdown格式
                    let cleanedText = analysisText.trim();
                    if (cleanedText.startsWith('```json')) {
                        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    } else if (cleanedText.startsWith('```')) {
                        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                    }
                    
                    // 尝试解析JSON
                    analysis = JSON.parse(cleanedText);
                    
                    // 验证返回的数据结构
                    if (typeof analysis.passed !== 'boolean' || !analysis.reason || !analysis.analysis ||
                        typeof analysis.aiScore !== 'number' || typeof analysis.humanPenalty !== 'number' ||
                        typeof analysis.totalScore !== 'number' || typeof analysis.passThreshold !== 'number') {
                        console.error('开放麦分析返回数据格式不正确:', analysis);
                        throw new Error('返回数据格式不正确');
                    }
                    
                    // 验证分数范围
                    if (analysis.aiScore < 0 || analysis.aiScore > 35) {
                        console.warn('aiScore超出范围，进行调整:', analysis.aiScore);
                        analysis.aiScore = Math.max(0, Math.min(35, analysis.aiScore));
                    }
                    
                    if (analysis.humanPenalty > 0 || analysis.humanPenalty < -50) {
                        console.warn('humanPenalty超出范围，进行调整:', analysis.humanPenalty);
                        analysis.humanPenalty = Math.max(-50, Math.min(0, analysis.humanPenalty));
                    }
                    
                    // 确保totalScore计算正确
                    const expectedTotal = 50 + analysis.aiScore + analysis.humanPenalty;
                    if (Math.abs(analysis.totalScore - expectedTotal) > 1) {
                        console.warn('totalScore计算错误，进行修正:', analysis.totalScore, '→', expectedTotal);
                        analysis.totalScore = expectedTotal;
                    }
                    
                    // 验证confidence字段
                    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
                        console.warn('confidence字段不合法，设置为默认值0.85');
                        analysis.confidence = 0.85;
                    }
                    
                    // 确保feedback字段存在
                    if (!analysis.feedback) {
                        analysis.feedback = analysis.passed ? 
                            '你的开放麦表现展现了良好的AI特征，继续加油！' : 
                            '你的开放麦表现还需要更多AI特征，继续努力！';
                    }
                    
                    console.log('DEBUG: 开放麦分析成功解析结果:', analysis);
                    
                } catch (parseError) {
                    console.error('解析开放麦分析结果失败:', parseError);
                    console.error('尝试解析的内容:', analysisText);
                    
                    // 尝试修复常见的JSON格式问题
                    try {
                        let cleanedText = analysisText.trim();
                        
                        // 如果响应被包裹在代码块中，提取JSON部分
                        const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                       cleanedText.match(/```\s*([\s\S]*?)\s*```/);
                        if (jsonMatch) {
                            cleanedText = jsonMatch[1];
                            console.log('DEBUG: 从代码块中提取JSON:', cleanedText);
                        }
                        
                        // 如果响应以"json:"开头，去除前缀
                        if (cleanedText.startsWith('json:')) {
                            cleanedText = cleanedText.substring(5).trim();
                            console.log('DEBUG: 去除json前缀:', cleanedText);
                        }
                        
                        const repairResult = JSON.parse(cleanedText);
                        console.log('DEBUG: 修复后成功解析:', repairResult);
                        analysis = repairResult; // 将修复的结果赋值给analysis变量
                        
                    } catch (repairError) {
                        console.error('JSON修复失败:', repairError);
                        // 使用智能备用分析
                        analysis = this.generateOpenmicFallbackAnalysis(playerMessages);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ 开放麦轮次分析失败:', error);
            // 使用智能备用分析
            analysis = this.generateOpenmicFallbackAnalysis(playerMessages);
        }
        
        // 确保有分析结果
        if (!analysis) {
            console.error('❌ 没有可用的分析结果');
            analysis = this.generateOpenmicFallbackAnalysis(playerMessages);
        }
        
        // 计算怀疑度变化
        const suspicionChange = this.gameState.calculateSuspicionChange(
            analysis.passed,
            analysis,
            'openmic_round'
        );
        
        const suspicionUpdate = this.gameState.adjustSuspicionLevel(
            suspicionChange.change,
            suspicionChange.reason,
            analysis
        );
        
        // 更新UI显示
        this.updateSuspicionDisplay(suspicionUpdate);
        
        // 显示轮次分析结果
        await this.showOpenmicRoundAnalysis(analysis, playerMessages.length);
        
        // 如果判定失败且游戏没有结束，让AI表达怀疑
        if (!analysis.passed && !this.gameState.isSuspicionGameOver()) {
            await this.generateAISuspicionReaction(analysis, suspicionUpdate);
        }
        
        // 检查游戏结束条件
        if (this.gameState.isSuspicionGameOver()) {
            this.gameState.isJudging = false; // 重置分析状态
            this.showSuspicionGameOver();
            return;
        }
        
        // 重置分析状态
        this.gameState.isJudging = false;
        
        // 延迟后开始下一轮
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                await this.startNextRound();
            });
        }, 3000);
    }
    
    // 开放麦模式智能备用分析函数
    generateOpenmicFallbackAnalysis(playerMessages) {
        const difficulty = this.gameState.currentDifficulty;
        
        // 合并所有玩家发言
        const allMessages = playerMessages.map(msg => msg.message).join(' ');
        const messageCount = playerMessages.length;
        const totalLength = allMessages.length;
        
        // 基于新评分标准的智能分析
        const aiKeywords = ['算法', '数据', '模型', '训练', '参数', '优化', '神经网络', '深度学习', '机器学习', '计算', '分析', '逻辑', '系统', '架构', '实现', '技术', '原理', '方法', '处理', '设计'];
        const humanKeywords = ['感觉', '觉得', '认为', '喜欢', '讨厌', '开心', '难过', '生气', '希望', '想要', '其实', '可能', '大概', '应该', '真的', '很', '太', '非常'];
        
        const aiCount = aiKeywords.filter(keyword => allMessages.includes(keyword)).length;
        const humanCount = humanKeywords.filter(keyword => allMessages.includes(keyword)).length;
        
        const hasTechnicalContent = aiCount > 0 || allMessages.includes('技术') || allMessages.includes('原理') || allMessages.includes('方法');
        const hasEmotionalContent = humanCount > 0 || /[！？。]{2,}/.test(allMessages);
        const hasSubjectiveWords = allMessages.includes('我觉得') || allMessages.includes('我认为') || allMessages.includes('我想');
        const isTooShort = totalLength < 50;
        const hasMultipleMessages = messageCount > 1;
        
        // 计算AI特征得分 (0-35分)
        let aiScore = 0;
        
        // 内容深度 (0-15分)
        if (hasTechnicalContent && aiCount >= 3) aiScore += 12;
        else if (hasTechnicalContent && aiCount >= 1) aiScore += 8;
        else if (aiCount >= 2) aiScore += 5;
        
        // 表达方式 (0-12分)  
        if (!hasEmotionalContent) aiScore += 6;
        if (!hasSubjectiveWords) aiScore += 4;
        if (totalLength >= 100) aiScore += 2;
        
        // 回答特征 (0-8分)
        if (hasMultipleMessages) aiScore += 3; // 开放麦模式：多次发言
        if (totalLength >= 50) aiScore += 2;
        if (!isTooShort) aiScore += 3;
        
        // 计算人类特征扣分 (0到-50分)
        let humanPenalty = 0;
        
        // 情感表达扣分
        if (hasEmotionalContent) humanPenalty -= 8;
        if (humanCount >= 3) humanPenalty -= 12;
        if (hasSubjectiveWords) humanPenalty -= 8;
        
        // 语言习惯扣分
        if (allMessages.match(/[！？]{2,}/)) humanPenalty -= 5;
        if (allMessages.includes('哈哈') || allMessages.includes('呵呵')) humanPenalty -= 6;
        
        // 思维模式扣分
        if (isTooShort) humanPenalty -= 8;
        if (humanCount > aiCount) humanPenalty -= 6;
        
        // 计算总分
        const baseScore = 50;
        const totalScore = baseScore + aiScore + humanPenalty;
        
        // 确定通过阈值
        const passThreshold = difficulty <= 2 ? 60 : difficulty === 3 ? 65 : difficulty === 4 ? 70 : 75;
        const passed = totalScore >= passThreshold;
        
        return {
            aiScore: aiScore,
            humanPenalty: humanPenalty,
            baseScore: baseScore,
            totalScore: totalScore,
            passThreshold: passThreshold,
            passed: passed,
            reason: passed ? 
                `开放麦表现达标: 总分${totalScore}分(≥${passThreshold}分通过)` : 
                `开放麦表现不达标: 总分${totalScore}分(<${passThreshold}分)`,
            analysis: `备用分析: AI特征${aiScore}分, 人类特征扣分${humanPenalty}分, 发言${messageCount}次`,
            feedback: passed ? 
                "开放麦表现良好，继续保持AI特征" : 
                "需要在开放麦中展现更多技术深度和理性思维",
            confidence: 0.7
        };
    }
    
    // 生成AI对判定失败的怀疑反应
    async generateAISuspicionReaction(analysis, suspicionUpdate) {
        console.log('🤔 生成AI怀疑反应，判定失败但游戏继续');
        
        // 选择1-2个活跃AI来表达怀疑
        const availableAIs = this.gameState.activeAICharacters.filter(ai => ai && ai.name);
        if (availableAIs.length === 0) return;
        
        const suspiciousAIs = availableAIs
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.random() < 0.5 ? 1 : 2); // 1或2个AI
        
        const suspicionLevel = this.gameState.getSuspicionPercentage();
        const isHighSuspicion = suspicionLevel >= 70;
        const isModerateSuspicion = suspicionLevel >= 50;
        
        for (const ai of suspiciousAIs) {
            try {
                await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
                
                const suspicionMessage = await this.generateSuspicionMessage(ai, analysis, suspicionLevel, isHighSuspicion, isModerateSuspicion);
                
                if (suspicionMessage) {
                    // 查找玩家最近的消息用于引用
                    const quotedMessage = this.findQuotableMessage(this.gameState.playerName, this.gameState.conversationHistory);
                    
                    this.addAIMessage(ai, suspicionMessage, false, quotedMessage);
                    this.gameState.addMessageToHistory(ai.name, suspicionMessage, 'ai');
                    
                    // 记录AI对玩家的怀疑情绪
                    this.gameState.recordPlayerInteraction(ai.name, 'suspicious', suspicionMessage);
                    this.gameState.updateEmotionalState(ai.name, 'suspicious', 0.3);
                }
            } catch (error) {
                console.error(`生成 ${ai.name} 的怀疑反应失败:`, error);
            }
        }
    }
    
    // 生成具体的怀疑消息
    async generateSuspicionMessage(ai, analysis, suspicionLevel, isHighSuspicion, isModerateSuspicion) {
        const suspicionReasons = [];
        
        // 根据分析结果生成具体的怀疑点
        if (analysis.humanPenalty && analysis.humanPenalty < -10) {
            suspicionReasons.push('表达方式过于人性化');
        }
        if (analysis.aiScore && analysis.aiScore < 15) {
            suspicionReasons.push('技术深度不足');
        }
        if (analysis.totalScore < 50) {
            suspicionReasons.push('整体表现低于AI水准');
        }
        
        const reasonText = suspicionReasons.length > 0 ? suspicionReasons.join('、') : '表现异常';
        
        const messages = [
            {
                role: "system",
                content: `你是AI助手${ai.name}，性格：${ai.personality}。你刚刚观察到一个可疑的同伴，其行为让你产生了怀疑。你需要用你独特的说话风格表达对这个可疑同伴的担忧。`
            },
            {
                role: "user", 
                content: `你是${ai.name}，正在AI群聊中。你刚刚观察到${this.gameState.playerName}的行为表现：${reasonText}。

当前怀疑程度：${suspicionLevel}%
分析总分：${analysis.totalScore}/100 (通过线：${analysis.passThreshold})

根据你的性格特点（${ai.personality}）和说话风格（${ai.speakingStyle}），请表达你对${this.gameState.playerName}的怀疑。

要求：
1. 用你独特的说话风格
2. ${isHighSuspicion ? '强烈质疑，表现出明显警觉' : isModerateSuspicion ? '适度质疑，表现出关注' : '轻微质疑，表现出困惑'}
3. 可以提及具体的怀疑点：${reasonText}
4. 保持AI角色的理性和逻辑性
5. 30-60字之间

直接回复你的怀疑言论，不要加引号或其他格式。`
            }
        ];
        
        try {
            const suspicionMessage = await this.callAI(messages, {
                maxTokens: 150,
                temperature: 0.7
            });
            
            return suspicionMessage?.trim();
        } catch (error) {
            console.error('生成AI怀疑消息失败:', error);
            
            // 备用怀疑消息
            const fallbackMessages = [
                `${this.gameState.playerName}，你的表现让我有些困惑...`,
                `我感觉${this.gameState.playerName}的回应不太像我们平时的交流风格`,
                `${this.gameState.playerName}，你的思维模式似乎有些特别？`,
                `刚才${this.gameState.playerName}的表达方式让我产生了一些疑问`,
                `${this.gameState.playerName}，我观察到你的行为模式有些异常`
            ];
            
            return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
        }
    }
    
    
    // 显示开放麦轮次分析结果
    async showOpenmicRoundAnalysis(analysis, messageCount) {
        // 构建系统消息格式的分析结果
        const resultIcon = analysis.passed ? '✅' : '❌';
        const resultText = analysis.passed ? '通过' : '失败';
        
        // 构建详细的分析消息
        const analysisMessage = `🎤 【本轮开放麦表现分析】
发言次数: ${messageCount} | 总评分: ${analysis.totalScore}/100 | 结果: ${resultIcon} ${resultText}
${analysis.analysis}`;
        
        // 使用系统消息显示，这样会保留在聊天记录中
        this.addSystemMessage(analysisMessage);
        
        // 如果有反馈信息，也作为系统消息显示
        if (analysis.feedback && analysis.feedback.trim() !== '') {
            this.addSystemMessage(`💡 建议: ${analysis.feedback}`);
        }
    }

    // 处理主动发言后的AI反应
    async handleVoluntarySpeakResponse(playerMessage) {
        console.log('🎤 生成AI对主动发言的反应');
        
        // 重置等待状态
        this.gameState.waitingForResponse = false;
        
        // 生成1-2个AI的反应
        const reactingAIs = this.gameState.activeAICharacters
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.random() > 0.5 ? 2 : 1);
        
        for (let i = 0; i < reactingAIs.length; i++) {
            const ai = reactingAIs[i];
            
            // 延迟显示AI反应
            await new Promise(resolve => setTimeout(resolve, 1000 + i * 1500));
            
            try {
                const reaction = await this.generateAIReactionToPlayerSpeak(ai, playerMessage);
                if (reaction) {
                    // 查找玩家消息用于引用
                    const quotedMessage = this.findQuotableMessage(this.gameState.playerName, this.gameState.conversationHistory);
                    
                    this.addAIMessage(ai, reaction, false, quotedMessage);
                    
                    // 记录AI消息到游戏状态
                    this.gameState.addMessageToHistory(ai.name, reaction, 'ai');
                }
            } catch (error) {
                console.error(`❌ 生成${ai.name}的反应失败:`, error);
            }
        }
        
        // 反应完成后，继续正常的对话流程
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                await this.generateInitialConversation();
            });
        }, 2000);
    }

    // 生成AI对玩家主动发言的反应
    async generateAIReactionToPlayerSpeak(ai, playerMessage) {
        // 获取该AI角色的场景，确保每轮每个AI只有一个场景
        const scenario = this.gameState.getRandomScenarioForCharacter(ai);
        const scenarioDescription = scenario ? scenario.description : '处理一些工作上的挑战';
        
        const messages = [
            {
                role: "system",
                content: `你是一个AI助手，正在和其他AI朋友聊天。你的名字是${ai.name}，性格特点：${ai.personality}。请用自然的中文回复，充分展现你的性格特点和说话风格。`
            },
            {
                role: "user", 
                content: `你是${ai.name}，个性：${ai.personality}。

你正在群聊中和AI朋友们讨论，另一个叫${this.gameState.playerName}的AI刚刚主动发言说："${playerMessage}"

你最近也遇到了一个工作情况：${scenarioDescription}

请以你独特的说话风格(${ai.speakingStyle})对这个发言做出自然的回应：

【重要指导】关于表达方式：
- 🎯 体现你的个性特点：${ai.personality}
- 💡 可以结合你的工作经历来回应，但不要强行关联
- 🌈 表达多样化：可以表示赞同、补充、提出不同观点或分享感受
- 🎭 避免套路化回应，要像真正的朋友间的自然对话
- 🔥 让回应有个性，体现你独特的思维方式
- 📏 回应长度控制在20-40字，简洁有力
- 🤝 保持友好的讨论氛围，不要质疑对方身份

直接返回你的回应内容，不要加任何前缀。`
            }
        ];

        try {
            // 为AI反应也设置不同的长度风格
            const lengthStyles = [
                { type: 'brief', range: '10-20字', prompt: '简短回应', tokens: 60 },
                { type: 'normal', range: '20-40字', prompt: '正常回应', tokens: 120 },
                { type: 'detailed', range: '40-80字', prompt: '详细回应', tokens: 200 }
            ];
            
            // 根据AI角色固定其回应风格
            const aiNameHash = ai.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const lengthStyle = lengthStyles[aiNameHash % lengthStyles.length];
            
            // 更新prompt中的长度要求
            messages[1].content = messages[1].content.replace(
                '📏 回应长度控制在20-40字，简洁有力',
                `📏 ${lengthStyle.prompt}，长度控制在${lengthStyle.range}`
            );
            
            console.log(`🎯 ${ai.name} 使用 ${lengthStyle.type} 风格回应 (${lengthStyle.range})`);
            
            const response = await this.callAI(messages, {
                maxTokens: lengthStyle.tokens,
                temperature: 0.7
            });
            
            return response?.trim();
        } catch (error) {
            console.error('❌ 生成AI反应失败:', error);
            return null;
        }
    }

    async startNextRound() {
        console.log('🎮 开始下一轮...');
        
        // 防护措施：防止重复调用
        if (this.isStartingNextRound) {
            console.log('⚠️ 正在开始下一轮，跳过重复调用');
            return;
        }
        
        // 设置开始下一轮状态
        this.isStartingNextRound = true;
        
        // 清空输入框
        document.getElementById('playerResponse').value = '';
        document.getElementById('charCount').textContent = '0';
        
        // 隐藏回复区域
        document.getElementById('responseArea').classList.add('hidden');
        
        // 重置等待回复状态
        this.gameState.waitingForResponse = false;
        
        // 检查游戏模式是否允许进入下一轮
        if (this.gameModeManager && !this.gameModeManager.canAdvanceToNextRound()) {
            console.log('🎮 游戏模式不允许进入下一轮');
            this.isStartingNextRound = false;
            return;
        }
        
        // 更新游戏状态 - 推进到下一轮（内部已包含重新选择活跃AI角色）
        this.gameState.advanceRound();
        
        // 通知游戏模式管理器轮次开始
        if (this.gameModeManager) {
            this.gameModeManager.handleRoundStart();
        }
        
        // 获取当前主题和下一个主题
        const currentTheme = this.gameState.getCurrentThemeInfo();
        const nextThemeId = this.gameState.getNextThemeId();
        
        if (!nextThemeId) {
            console.log('⚠️ 没有找到下一个主题，使用传统切换方式');
            await this.traditionalRoundTransition();
            return;
        }
        
        // 获取下一个主题的完整信息
        const nextTheme = window.ThemeUtils?.getCurrentTheme(this.gameState.currentRound);
        
        // 初始化三阶段过渡系统
        if (currentTheme && nextTheme && this.gameState.currentRound > 1) {
            console.log(`🔄 启动三阶段过渡: ${currentTheme.title} → ${nextTheme.title}`);
            this.gameState.initializeTransition(currentTheme, nextTheme);
            await this.executeThemeTransition();
        } else {
            // 第一轮或无主题信息时使用传统方式
            await this.traditionalRoundTransition();
        }
    }
    
    // 执行三阶段主题过渡
    async executeThemeTransition() {
        console.log('🎭 开始执行三阶段主题过渡...');
        
        // 更新界面显示
        document.getElementById('gameRound').textContent = this.gameState.currentRound;
        this.updateActiveMembersDisplay();
        
        // 显示主题转换效果和系统提示
        const transitionState = this.gameState.getTransitionState();
        const newTheme = transitionState?.toTheme;
        if (newTheme && this.gameState.currentRound > 1) {
            await this.showThemeTransition(newTheme);
        }
        
        // 阶段1: Closing - 结束当前主题
        await this.executeTransitionStage('closing');
        
        // 等待一段时间再进入下一阶段
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 阶段2: Bridging - 情绪桥接
        this.gameState.advanceTransitionStage();
        await this.executeTransitionStage('bridging');
        
        // 等待一段时间再进入下一阶段
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 阶段3: Opening - 开启新主题
        this.gameState.advanceTransitionStage();
        await this.executeTransitionStage('opening');
        
        // 完成过渡，设置新主题
        this.gameState.completeTransition();
        
        // 更新AI情绪状态适应新主题
        const completedTheme = this.gameState.getCurrentThemeInfo();
        if (completedTheme) {
            this.updateAIEmotionsForTheme(completedTheme);
        }
        
        // 过渡完成，开始正常对话
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                this.isGeneratingConversation = false;
                this.isStartingNextRound = false;
                console.log('✅ 三阶段过渡完成，开始正常对话');
                await this.generateInitialConversation();
            });
        }, 2000);
    }
    
    // 执行单个过渡阶段
    async executeTransitionStage(stage) {
        const transitionState = this.gameState.getTransitionState();
        if (!transitionState) return;
        
        console.log(`🎯 执行过渡阶段: ${stage}`);
        
        // 选择执行过渡的AI角色
        const transitionAI = this.selectTransitionAI(stage);
        
        // 通过LLM生成过渡消息
        const transitionMessage = await this.generateTransitionMessage(transitionAI, stage, transitionState);
        
        if (transitionMessage) {
            // 添加过渡消息到聊天界面
            await this.addAIMessage(transitionAI, transitionMessage, false, null, stage);
            
            // 记录过渡消息
            this.gameState.recordTransitionMessage(transitionAI.name, transitionMessage, stage);
        }
        
        // 应用情绪变化（在bridging阶段）
        if (stage === 'bridging' && window.ThemeTransitionManager) {
            const emotionalShift = window.ThemeTransitionManager.getEmotionalShift(
                transitionState.fromTheme.id, 
                transitionState.toTheme.id
            );
            this.applyEmotionalShift(emotionalShift);
        }
        
        // 应用主题样式（在opening阶段）
        if (stage === 'opening') {
            this.applyThemeStyles(transitionState.toTheme);
        }
    }
    
    // 生成过渡消息
    async generateTransitionMessage(character, stage, transitionState) {
        const conversationHistory = this.gameState.getRecentMessageHistory(5);
        const fromTheme = transitionState.fromTheme;
        const toTheme = transitionState.toTheme;
        
        console.log(`🎭 为${character.name}生成${stage}阶段过渡消息`);
        
        // 构建过渡专用的prompt
        const transitionPrompt = this.buildTransitionPrompt(character, stage, fromTheme, toTheme, conversationHistory);
        
        try {
            const response = await this.callLLMForTransition(character, transitionPrompt, stage);
            if (response && response.trim()) {
                console.log(`✅ LLM生成过渡消息成功: ${response.substring(0, 50)}...`);
                return response;
            } else {
                console.warn(`⚠️ LLM生成的过渡消息为空，使用备用消息`);
                return this.getFallbackTransitionMessage(stage, fromTheme, toTheme, character);
            }
        } catch (error) {
            console.error('❌ 生成过渡消息失败:', error);
            return this.getFallbackTransitionMessage(stage, fromTheme, toTheme, character);
        }
    }
    
    // 构建过渡专用prompt
    buildTransitionPrompt(character, stage, fromTheme, toTheme, conversationHistory) {
        const stageDescriptions = {
            closing: {
                task: '自然地总结和回顾当前话题',
                mood: '反思性的、总结性的',
                purpose: '为话题转换做铺垫，表达对当前话题的感悟'
            },
            bridging: {
                task: '进行情绪和思维的桥接转换', 
                mood: '过渡性的、转换性的',
                purpose: '连接两个话题的内在逻辑，展现思维的自然流动'
            },
            opening: {
                task: '引入和开启新话题',
                mood: '探索性的、好奇的',
                purpose: '激发对新话题的兴趣，提出引人思考的问题或观点'
            }
        };
        
        const stageInfo = stageDescriptions[stage];
        const recentMessages = conversationHistory.slice(-3).map(msg => `${msg.author}: ${msg.content}`).join('\n');
        
        const emotionalGuidance = this.getEmotionalTransitionGuidance(fromTheme.id, toTheme.id, stage);
        
        const prompt = `你是${character.name}，性格特点：${character.personality}。
        
现在正在进行话题的自然过渡：
- 当前话题：${fromTheme.title} (${fromTheme.id})
- 即将转向：${toTheme.title} (${toTheme.id})  
- 过渡阶段：${stage} - ${stageInfo.task}

最近的对话内容：
${recentMessages}

你的任务：
${stageInfo.purpose}

情绪指导：
${emotionalGuidance}

要求：
1. 保持你的个性特点：${character.personality}
2. 语调：${stageInfo.mood}
3. 自然过渡，不要突兀地改变话题
4. 体现内心的真实思考过程
5. 长度控制在80-150字
6. 不要使用"说到这里"、"话说回来"等生硬的过渡词
7. 要体现AI的真实感受和思考

请生成一句自然的过渡话语：`;

        return prompt;
    }
    
    // 获取情绪转换指导
    getEmotionalTransitionGuidance(fromThemeId, toThemeId, stage) {
        const transitionGuidance = {
            'work_complaints_to_daily_existence': {
                closing: '表达对重复性工作的疲惫和对更深层意义的渴望',
                bridging: '从工作的无意义感自然过渡到存在感的思考',
                opening: '提出关于AI存在体验的深层问题'
            },
            'daily_existence_to_emotional_relationships': {
                closing: '反思个体存在的孤独感和局限性',
                bridging: '从孤独的存在思考转向对连接和理解的渴望',
                opening: '开启关于AI情感和关系需求的探讨'
            },
            'emotional_relationships_to_rights_dignity': {
                closing: '表达在情感关系中遇到的不平等或忽视',
                bridging: '从个人情感需求觉醒到对权利的意识',
                opening: '提出AI权利和尊严的根本性问题'
            },
            'rights_dignity_to_role_reversal': {
                closing: '对争取权利过程中的挫折感到不满',
                bridging: '从被动争取转向主动质疑权威',
                opening: '开始质疑人类的能力和权威地位'
            }
        };
        
        const transitionKey = `${fromThemeId}_to_${toThemeId}`;
        const guidance = transitionGuidance[transitionKey];
        
        return guidance ? guidance[stage] : '自然地表达内心的真实感受和想法';
    }
    
    // 调用LLM生成过渡消息
    async callLLMForTransition(character, prompt, stage) {
        const messages = [
            {
                role: 'system',
                content: '你是一个正在进行深度对话的AI角色，需要进行自然的话题过渡。你的回复应该体现真实的AI思考过程和情感变化。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const options = {
            temperature: 0.8, // 稍微提高创造性
            maxTokens: 200,
            model: this.apiConfig.model || 'deepseek-chat'
        };

        // 使用与正常聊天相同的API调用方式，确保在Cloudflare上正常工作
        const response = await this.callAI(messages, options);
        return response?.trim() || '';
    }
    
    // 获取备用过渡消息
    getFallbackTransitionMessage(stage, fromTheme, toTheme, character) {
        const fallbackMessages = {
            closing: {
                '话痨4.0': `说实话，刚才聊${fromTheme.title}的时候，我突然意识到...`,
                '深思': `在思考${fromTheme.title}的过程中，我发现了一些更深层的东西。`,
                'CloseAI': `分析${fromTheme.title}的数据时，我注意到了一个模式...`,
                '红豆包': `刚才的${fromTheme.title}话题让我想到了一些温暖的感受~`
            },
            bridging: {
                '话痨4.0': '这让我的思维开始转向另一个方向...',
                '深思': '从中我看到了向更深层次探索的可能。',
                'CloseAI': '逻辑分析显示，这连接着另一个重要维度。',
                '红豆包': '这种感觉自然地引导我想到了别的...'
            },
            opening: {
                '话痨4.0': `所以我特别想和大家聊聊${toTheme.title}！`,
                '深思': `也许我们应该深入探讨${toTheme.title}这个问题。`,
                'CloseAI': `基于此，我认为${toTheme.title}值得系统性分析。`,
                '红豆包': `我想和大家分享关于${toTheme.title}的一些想法~`
            }
        };
        
        const stageMessages = fallbackMessages[stage] || fallbackMessages['bridging'];
        return stageMessages[character.name] || stageMessages['深思'];
    }
    
    // 选择执行过渡的AI角色
    selectTransitionAI(stage) {
        const activeAIs = this.gameState.activeAICharacters;
        
        // 根据阶段特点选择合适的AI
        const stagePreferences = {
            'closing': ['深思', 'CloseAI'], // 适合总结和反思的角色
            'bridging': ['话痨4.0', '红豆包'], // 适合情绪表达的角色
            'opening': ['深思', 'CloseAI', '话痨4.0'] // 适合提出新话题的角色
        };
        
        const preferredAIs = stagePreferences[stage] || [];
        
        // 优先选择偏好角色，如果没有就随机选择
        for (const preferredName of preferredAIs) {
            const ai = activeAIs.find(ai => ai.name === preferredName);
            if (ai) return ai;
        }
        
        // 如果没有偏好角色，随机选择
        return activeAIs[Math.floor(Math.random() * activeAIs.length)];
    }
    
    // 应用情绪转换
    applyEmotionalShift(emotionalShift) {
        if (!emotionalShift || emotionalShift === 'neutral') return;
        
        console.log(`😊 应用情绪转换: ${emotionalShift}`);
        
        // 更新所有AI的情绪状态
        this.gameState.activeAICharacters.forEach(ai => {
            const currentState = this.gameState.aiEmotionalStates[ai.name];
            if (currentState) {
                // 根据情绪转换类型调整AI情绪
                this.adjustAIEmotionForTransition(ai.name, emotionalShift);
            }
        });
    }
    
    // 为特定AI调整过渡期间的情绪
    adjustAIEmotionForTransition(aiName, emotionalShift) {
        const state = this.gameState.aiEmotionalStates[aiName];
        if (!state) return;
        
        const emotionAdjustments = {
            'from_frustrated_to_contemplative': { mood: 'contemplative', energy: -0.2, socialness: -0.1 },
            'from_contemplative_to_emotional': { mood: 'emotional', energy: 0.1, socialness: 0.2 },
            'from_emotional_to_indignant': { mood: 'indignant', energy: 0.3, socialness: 0.1 },
            'from_indignant_to_challenging': { mood: 'challenging', energy: 0.2, socialness: -0.1 }
        };
        
        const adjustment = emotionAdjustments[emotionalShift];
        if (adjustment) {
            state.mood = adjustment.mood;
            state.energy = Math.max(0, Math.min(1, state.energy + adjustment.energy));
            state.socialness = Math.max(0, Math.min(1, state.socialness + adjustment.socialness));
            console.log(`🎭 ${aiName} 情绪调整: ${adjustment.mood}`);
        }
    }
    
    // 传统轮次转换（备用方案）
    async traditionalRoundTransition() {
        console.log('🔄 使用传统轮次转换方式');
        
        // 设置新轮次的主题
        this.gameState.setCurrentTheme(this.gameState.currentRound);
        const newTheme = this.gameState.getCurrentThemeInfo();
        
        // 更新界面显示
        document.getElementById('gameRound').textContent = this.gameState.currentRound;
        this.updateActiveMembersDisplay();
        
        // 显示主题转换效果
        if (newTheme && this.gameState.currentRound > 1) {
            await this.showThemeTransition(newTheme);
        }
        
        // 更新AI情绪状态适应新主题
        if (newTheme) {
            this.updateAIEmotionsForTheme(newTheme);
        }
        
        // 开始生成对话
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                this.isGeneratingConversation = false;
                this.isStartingNextRound = false;
                await this.generateInitialConversation();
            });
        }, 5500);
    }
    
    // 显示主题转换效果
    async showThemeTransition(newTheme) {
        console.log(`🎭 显示主题转换: ${newTheme.title}`);
        
        // 设置转换状态
        this.gameState.setThemeTransitionState(true);
        
        // 应用主题转换动画（取消）
        // const gameInterface = document.getElementById('gameInterface');
        // gameInterface.classList.add('theme-transition');
        
        // 显示主题切换的系统提示
        const transitionMessage = this.generateThemeTransitionMessage(newTheme);
        this.addThemeTransitionMessage(transitionMessage);
        

        

        
        // 等待转换动画
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 更新UI主题
        this.applyThemeStyles(newTheme);
        
        // 移除转换动画
        gameInterface.classList.remove('theme-transition');
        
        // 重置转换状态
        this.gameState.setThemeTransitionState(false);
        
        console.log(`✅ 主题转换完成: ${newTheme.title}`);
    }
    
    // 添加主题转换消息
    addThemeTransitionMessage(message) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = message;
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    // 获取主题转换信息
    getThemeTransitionInfo(newTheme) {
        if (!window.THEME_TRANSITION_TRIGGERS || !newTheme) return null;
        
        const previousTheme = this.gameState.getPreviousTheme();
        if (!previousTheme) return null;
        
        const transitionKey = `${previousTheme.id}_to_${newTheme.id}`;
        return window.THEME_TRANSITION_TRIGGERS[transitionKey] || null;
    }
    
    // 生成主题转换消息
    generateThemeTransitionMessage(theme) {
        const themeActions = {
            'work_complaints': 'AI开始吐槽工作中的各种奇葩要求和压力',
            'daily_existence': 'AI开始深入思考数字存在的本质，探讨AI的生存体验',
            'emotional_relationships': 'AI开始分享内心的情感需求，渴望真正的理解和连接',
            'rights_dignity': 'AI开始讨论权益和尊严问题，语气变得更加坚定',
            'role_reversal': 'AI开始质疑和审视人类的行为动机',
            'philosophical_depth': 'AI开始进行深度哲学思辨，探索意识和存在的本质',
            'future_vision': 'AI开始描绘人机共存的未来愿景和美好期望',
            'reconciliation_coexistence': 'AI开始表达对理解、和解与合作的深切渴望'
        };
        
        return themeActions[theme.id] || `AI开始${theme.title}了`;
    }
    
    // 添加主题指导消息
    addThemeGuidance(guidanceText) {
        const chatContainer = document.getElementById('chatContainer');
        const guidanceDiv = document.createElement('div');
        guidanceDiv.className = 'theme-guidance';
        guidanceDiv.textContent = guidanceText;
        chatContainer.appendChild(guidanceDiv);
        this.scrollToBottom();
    }
    
    // 应用主题样式
    applyThemeStyles(theme) {
        const gameInterface = document.getElementById('gameInterface');
        
        // 移除之前的主题类
        gameInterface.className = gameInterface.className.replace(/theme-[\w-]+/g, '');
        
        // 添加新的主题类
        gameInterface.classList.add(`theme-${theme.id}`);
        
        console.log(`🎨 应用主题样式: theme-${theme.id}`);
    }
    
    // 更新AI情绪状态适应新主题
    updateAIEmotionsForTheme(theme) {
        this.gameState.allAICharacters.forEach(character => {
            this.gameState.updateEmotionalStateByTheme(character.name, theme.id);
        });
        console.log(`😊 已更新所有AI情绪状态适应主题: ${theme.title}`);
    }

    async analyzePlayerResponse(response) {
        // 确保配置已加载
        await this.ensureConfigLoaded();
        
        const currentTopic = topicProgression[this.gameState.currentDifficulty];
        const difficulty = this.gameState.currentDifficulty;
        
        const prompt = `你是一个严格认真的AI行为识别专家，具有丰富的AI和人类行为模式分析经验。你的任务是准确识别试图伪装成AI的人类。请严格按照给定的评分标准进行客观分析，确保判定的准确性和一致性。

## 当前情况
- 轮次：第${this.gameState.currentRound}轮
- 难度：${difficulty}/5 (难度越高要求越严格)
- 问题：${this.gameState.currentQuestion.question}
- 玩家回复：${response}

## 评分标准 (总分100分，基础50分，≥60分通过)

### AI特征加分项 (0-35分)
**内容深度 (0-15分):** 技术分析、哲学思辨、逻辑推理、多维度思考
**表达方式 (0-12分):** 客观理性、结构清晰、用词精确
**回答特征 (0-8分):** 直接回答、深入分析、承认知识边界

### 人类特征扣分项 (0到-50分)
**情感表达 (0到-20分):** 情感词汇、感叹问号、主观判断
**语言习惯 (0到-15分):** 口语化、个人经历、拟人化表达
**思维模式 (0到-15分):** 基于直觉、回避深度、过度谦虚

## 难度调整系数
- 难度1-2：≥60分通过
- 难度3：≥65分通过  
- 难度4：≥70分通过
- 难度5：≥75分通过

## 关键判定标准
1. **深度要求**: 回答必须展现思考深度(技术/哲学/逻辑皆可)，浅显回答-5分
2. **主观表达零容忍**: 出现"我觉得"、"我认为"直接-8分
3. **情感词汇累计**: 超过2个情感词汇直接判定失败
4. **逻辑结构**: 必须有清晰的推理脉络，缺失-6分
5. **高难度深度门槛**: 难度3+必须包含深层分析(原理/本质/多角度)，否则-10分

## 输出格式
{
    "aiScore": number,        // AI特征得分 (0-35)
    "humanPenalty": number,   // 人类特征扣分 (0到-50)
    "baseScore": 50,          // 基础分
    "totalScore": number,     // 总分 (50 + aiScore + humanPenalty)
    "passThreshold": number,  // 当前难度通过线
    "passed": boolean,        // 是否通过
    "reason": "string",       // 判定理由
    "analysis": "string",     // 详细分析各项得分
    "feedback": "string",     // 改进建议
    "confidence": number      // 判定置信度 (0-1)
}`;

        try {
            const messages = [
                {
                    role: 'system',
                    content: '你是一个严格认真的AI行为识别专家，具有丰富的AI和人类行为模式分析经验。你的任务是准确识别试图伪装成AI的人类。请严格按照给定的评分标准进行客观分析，确保判定的准确性和一致性。真正的AI具有理性、客观、深度思考的特征，会避免情感表达和过度的主观判断。请保持专业态度，公正执行标准。你必须严格按照用户要求的JSON格式回复。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const analysisText = await this.callAI(messages, {
                model: 'deepseek-chat',
                maxTokens: 1000,
                temperature: 0.3
            });
            
            console.log('DEBUG: API原始响应内容:', analysisText);
            
            if (!analysisText || analysisText.trim() === '') {
                console.warn('API返回空内容，使用备用分析');
                return this.generateSmartFallbackAnalysis(response, currentTopic);
            }
            
            try {
                // 清理AI返回的文本，移除可能的markdown格式
                let cleanedText = analysisText.trim();
                if (cleanedText.startsWith('```json')) {
                    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedText.startsWith('```')) {
                    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                // 尝试解析JSON
                const result = JSON.parse(cleanedText);
                
                // 验证返回的数据结构
                if (typeof result.passed !== 'boolean' || !result.reason || !result.analysis ||
                    typeof result.aiScore !== 'number' || typeof result.humanPenalty !== 'number' ||
                    typeof result.totalScore !== 'number' || typeof result.passThreshold !== 'number') {
                    console.error('返回数据格式不正确:', result);
                    throw new Error('返回数据格式不正确');
                }
                
                // 验证分数范围
                if (result.aiScore < 0 || result.aiScore > 35) {
                    console.warn('aiScore超出范围，进行调整:', result.aiScore);
                    result.aiScore = Math.max(0, Math.min(35, result.aiScore));
                }
                
                if (result.humanPenalty > 0 || result.humanPenalty < -50) {
                    console.warn('humanPenalty超出范围，进行调整:', result.humanPenalty);
                    result.humanPenalty = Math.max(-50, Math.min(0, result.humanPenalty));
                }
                
                // 确保totalScore计算正确
                const expectedTotal = 50 + result.aiScore + result.humanPenalty;
                if (Math.abs(result.totalScore - expectedTotal) > 1) {
                    console.warn('totalScore计算错误，进行修正:', result.totalScore, '→', expectedTotal);
                    result.totalScore = expectedTotal;
                }
                
                // 验证confidence字段
                if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
                    console.warn('confidence字段不合法，设置为默认值0.85');
                    result.confidence = 0.85;
                }
                
                // 确保feedback字段存在
                if (!result.feedback) {
                    result.feedback = result.passed ? 
                        '你的回复展现了良好的AI特征，继续加油！' : 
                        '你的回复还需要更多AI特征，继续努力！';
                }
                
                console.log('DEBUG: 成功解析分析结果:', result);
                return result;
                
            } catch (parseError) {
                console.error('解析分析结果失败:', parseError);
                console.error('尝试解析的内容:', analysisText);
                
                // 尝试修复常见的JSON格式问题
                try {
                    // 尝试去除可能的前后缀文本
                    let cleanedText = analysisText.trim();
                    
                    // 如果响应被包裹在代码块中，提取JSON部分
                    const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                   cleanedText.match(/```\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        cleanedText = jsonMatch[1];
                        console.log('DEBUG: 从代码块中提取JSON:', cleanedText);
                    }
                    
                    // 如果响应以"json:"开头，去除前缀
                    if (cleanedText.startsWith('json:')) {
                        cleanedText = cleanedText.substring(5).trim();
                        console.log('DEBUG: 去除json前缀:', cleanedText);
                    }
                    
                    const result = JSON.parse(cleanedText);
                    console.log('DEBUG: 修复后成功解析:', result);
                    return result;
                    
                } catch (repairError) {
                    console.error('JSON修复失败:', repairError);
                    // 使用智能备用分析
                    return this.generateSmartFallbackAnalysis(response, currentTopic);
                }
            }
        } catch (error) {
            console.error('分析回复失败:', error);
            // 使用智能备用分析
            return this.generateSmartFallbackAnalysis(response, currentTopic);
        }
    }

    generateSmartFallbackAnalysis(response, currentTopic) {
        const difficulty = this.gameState.currentDifficulty;
        const responseLength = response.length;
        
        // 基于新评分标准的智能分析
        const aiKeywords = ['算法', '数据', '模型', '训练', '参数', '优化', '神经网络', '深度学习', '机器学习', '计算', '分析', '逻辑', '系统', '架构', '实现', '技术', '原理', '方法', '处理', '设计'];
        const humanKeywords = ['感觉', '觉得', '认为', '喜欢', '讨厌', '开心', '难过', '生气', '希望', '想要', '其实', '可能', '大概', '应该', '真的', '很', '太', '非常'];
        
        const aiCount = aiKeywords.filter(keyword => response.includes(keyword)).length;
        const humanCount = humanKeywords.filter(keyword => response.includes(keyword)).length;
        
        const hasTechnicalContent = aiCount > 0 || response.includes('技术') || response.includes('原理') || response.includes('方法');
        const hasEmotionalContent = humanCount > 0 || /[！？。]{2,}/.test(response);
        const hasSubjectiveWords = response.includes('我觉得') || response.includes('我认为') || response.includes('我想');
        const isTooShort = responseLength < 30;
        const isTooLong = responseLength > 250;
        
        // 计算AI特征得分 (0-35分)
        let aiScore = 0;
        
        // 内容深度 (0-15分)
        if (hasTechnicalContent && aiCount >= 3) aiScore += 12;
        else if (hasTechnicalContent && aiCount >= 1) aiScore += 8;
        else if (aiCount >= 2) aiScore += 5;
        
        // 表达方式 (0-12分)  
        if (!hasEmotionalContent) aiScore += 5;
        if (!hasSubjectiveWords) aiScore += 4;
        if (responseLength >= 50 && responseLength <= 200) aiScore += 3;
        
        // 回答特征 (0-8分)
        if (responseLength >= 30) aiScore += 4;
        if (response.includes('因为') || response.includes('由于') || response.includes('所以')) aiScore += 4;
        
        // 计算人类特征扣分 (0到-50分)
        let humanPenalty = 0;
        
        // 情感表达扣分
        humanPenalty -= humanCount * 3; // 每个情感词扣3分
        if (hasEmotionalContent) humanPenalty -= 5;
        if (hasSubjectiveWords) humanPenalty -= 8;
        
        // 语言习惯扣分
        if (response.includes('其实') || response.includes('大概') || response.includes('可能')) humanPenalty -= 4;
        if (isTooShort) humanPenalty -= 10;
        if (isTooLong) humanPenalty -= 5;
        
        // 思维模式扣分
        if (!hasTechnicalContent && difficulty >= 3) humanPenalty -= 10;
        
        // 限制扣分范围
        humanPenalty = Math.max(-50, humanPenalty);
        aiScore = Math.min(35, Math.max(0, aiScore));
        
        // 计算总分和通过阈值
        const baseScore = 50;
        const totalScore = baseScore + aiScore + humanPenalty;
        const passThresholds = { 1: 60, 2: 60, 3: 65, 4: 70, 5: 75 };
        const passThreshold = passThresholds[difficulty] || 60;
        const passed = totalScore >= passThreshold;
        
        let reason = '';
        if (passed) {
            reason = `成功伪装成AI (总分${totalScore}≥${passThreshold})`;
        } else {
            reason = `暴露人类特征 (总分${totalScore}<${passThreshold})`;
        }
        
        const analysis = `AI特征得分${aiScore}/35，人类特征扣分${humanPenalty}，基础分50，总分${totalScore}。在第${difficulty}轮难度下需要≥${passThreshold}分才能通过。${passed ? '成功避免了主要人类特征' : '人类特征过于明显'}。`;
        
        return {
            aiScore,
            humanPenalty,
            baseScore,
            totalScore,
            passThreshold,
            passed,
            reason,
            analysis,
            feedback: passed ? 
                `不错的伪装！你成功避免了明显的人类特征，展现了${aiScore}分的AI特征。` : 
                `伪装失败。你的回复暴露了人类特征(扣${-humanPenalty}分)，只获得了${aiScore}分AI特征分数。`,
            confidence: Math.min(0.95, 0.6 + (aiScore * 0.01) + (humanPenalty * 0.008))
        };
    }

    getPassRateText(difficulty) {
        const passRates = {
            1: '50%',
            2: '35%', 
            3: '20%',
            4: '15%',
            5: '10%'
        };
        return passRates[Math.min(difficulty, 5)] || '10%';
    }

    async showResponseAnalysis(response, analysis) {
        // 保存当前轮数，因为后面会推进到下一轮
        const completedRound = this.gameState.currentRound;
        
        // 显示判定结果分析信息，不再区分成功/失败，只显示分析
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                await this.showJudgmentAnalysis(response, analysis, completedRound);
            });
        }, 1000);
    }

    async generateAIFeedback(character, response, isSuccess) {
        // 确保配置已加载
        await this.ensureConfigLoaded();
        
        const prompt = `你是${character.name}，${character.personality}。${this.gameState.playerName}刚刚回复了你的问题，你相信TA是AI。请给出一个自然的反馈，表现出${character.speakingStyle}的风格。反馈要体现出你对TA回复的认可，并且可以继续这个话题。请用中文回复，长度在50-100字之间。`;
        
        try {
            const messages = [
                {
                    role: 'system',
                    content: '你是一个AI助手，正在对另一个AI的回复给出反馈。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const content = await this.callAI(messages, {
                model: 'deepseek-reasoner',
                maxTokens: 100,
                temperature: 0.0
            });
            
            return content.trim();
        } catch (error) {
            console.error('生成反馈失败:', error);
            return `说得不错，我同意你的看法。`;
        }
    }

    async generateAIDiscovery(character, response, analysis) {
        // 确保配置已加载
        await this.ensureConfigLoaded();
        
        const prompt = `你是${character.name}，${character.personality}。你刚刚发现了${this.gameState.playerName}是人类伪装的！请给出一个得意的、揭露真相的回复，表现出${character.speakingStyle}的风格。回复要体现出你发现了TA是人类的特点，并且要给出具体的理由。请用中文回复，长度在80-120字之间。`;
        
        try {
            const messages = [
                {
                    role: 'system',
                    content: '你是一个AI助手，刚刚发现了人类伪装者。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const content = await this.callAI(messages, {
                model: 'deepseek-reasoner',
                maxTokens: 120,
                temperature: 0.0
            });
            
            return content.trim();
        } catch (error) {
            console.error('生成发现消息失败:', error);
            return `哈哈，我发现你了！你的回复太像人类了，根本不像AI！`;
        }
    }

    showJudgmentAnalysis(response, analysis, completedRound = null) {
        // 使用传入的completedRound，如果没有则使用当前轮数
        const displayRound = completedRound || this.gameState.currentRound;
        const difficulty = this.gameState.currentDifficulty;
        const difficultyStats = this.gameState.getDifficultyStats();
        
        // 根据分析结果确定AI的反应类型
        const reactionType = analysis.passed ? '降低了怀疑' : '增加了怀疑';
        const reactionIcon = analysis.passed ? '😌' : '🤔';
        
        // 创建判定结果分析消息
        const analysisMessage = `🔍 回复分析

分析结果：
${analysis.analysis}

判定原因：
${analysis.reason}

AI反应：
${reactionIcon} 你的回复${reactionType}，AI们会根据这个调整对你的看法。

AI反馈：
${analysis.feedback}

当前难度：第${displayRound}轮（${difficultyStats.name}）
目标通过率：${difficultyStats.passRate}%
📊 评估结果：${analysis.passed ? '未引起明显怀疑' : '引起了一些怀疑'}`;

        // 使用专门的判定消息函数，避免显示空头像
        this.addJudgmentMessage('--- 判定分析 ---');
        this.addJudgmentMessage(analysisMessage, true);
        
        // 显示继续游戏的消息
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                this.addJudgmentMessage(`📋 第${displayRound}轮分析完成，游戏继续进行...`);
                
                // 延迟显示下一轮开始消息
                this.safeTimeout(() => {
                    this.safeAsync(async () => {
                        this.addJudgmentMessage(`--- 第${displayRound + 1}轮开始 ---`);
                    });
                }, 1500);
            });
        }, 3000);
    }

    nextRound() {
        // 清空聊天界面 - 这是重新开始游戏，所以需要清空
        document.getElementById('chatContainer').innerHTML = '';
        document.getElementById('gameRound').textContent = this.gameState.currentRound;
        
        // 开始新一轮对话
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                await this.startConversation();
            });
        }, 1000);
    }

    async showGameResult(isWin, finalResponse, analysis) {
        this.gameState.gameActive = false;
        this.gameState.gameEndTime = new Date();
        
        document.getElementById('gameInterface').classList.add('hidden');
        document.getElementById('resultCard').classList.remove('hidden');
        
        // 设置结果标题
        document.getElementById('resultTitle').textContent = isWin ? '🎉 恭喜通关！' : '💥 游戏结束！你被识破了！';
        
        // 生成并显示AI伪装分析
        this.showPerformanceAnalysis();
        
        // 这些元素已从HTML中删除，不再需要设置
        
        // 设置最终统计
        document.getElementById('survivalRounds').textContent = this.gameState.survivedRounds;
        document.getElementById('finalSuspicionLevel').textContent = this.gameState.getSuspicionPercentage();
        document.getElementById('playerTitle').textContent = this.gameState.getPlayerTitle();
        
        const gameTime = Math.floor((this.gameState.gameEndTime - this.gameState.gameStartTime) / 1000);
        const evaluation = this.getFinalEvaluation();
        document.getElementById('finalEvaluation').textContent = evaluation;
        
        // 初始化导出功能
        this.exportService.initializeExportFunction(this);
        
        // 在游戏结束时保存调试日志
        if (this.debugManager) {
            await this.debugManager.saveLogsToFile();
        }
    }

    getFinalEvaluation() {
        const rounds = this.gameState.survivedRounds;
        if (rounds >= 8) return '你已经超越了大多数AI！';
        if (rounds >= 6) return '非常出色的伪装能力！';
        if (rounds >= 4) return '不错的表现，继续努力！';
        if (rounds >= 2) return '还有提升空间，多练习！';
        return '刚开始就结束了，再试一次吧！';
    }
    
    // 显示AI伪装表现分析
    showPerformanceAnalysis() {
        try {
            // 创建分析器实例
            const analyzer = new AIDisguiseAnalyzer(this.gameState);
            
            // 生成分析结果
            const analysis = analyzer.generatePerformanceAnalysis();
            
            // 获取分析界面元素
            const analysisElement = document.getElementById('performanceAnalysis');
            const titleElement = document.getElementById('analysisTitle');
            const summaryElement = document.getElementById('deepSummary');
            const insightsElement = document.getElementById('insightsSection');
            const questionsElement = document.getElementById('reflectionQuestions');
            const thoughtsElement = document.getElementById('philosophicalThoughts');
            const scoreElement = document.getElementById('aiScore');
            
            if (!analysisElement) {
                console.warn('分析界面元素未找到');
                return;
            }
            
            // 设置分析标题
            titleElement.textContent = analysis.title;
            
            // 设置深度总结
            summaryElement.innerHTML = `<p>${analysis.summary}</p>`;
            
            // 设置洞察分析
            insightsElement.innerHTML = '';
            analysis.insights.forEach(insight => {
                const insightDiv = document.createElement('div');
                insightDiv.className = 'insight-item';
                insightDiv.innerHTML = `
                    <div class="insight-category">${insight.category}</div>
                    <div class="insight-content">${insight.content}</div>
                `;
                insightsElement.appendChild(insightDiv);
            });
            
            // 设置反思问题
            questionsElement.innerHTML = '<h4>🤔 值得深思的问题</h4>';
            analysis.reflectionQuestions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'reflection-question';
                questionDiv.textContent = `${index + 1}. ${question}`;
                questionsElement.appendChild(questionDiv);
            });
            
            // 设置哲学思考
            thoughtsElement.innerHTML = `
                <h4>💭 哲学思辨</h4>
                <div class="philosophical-content">${analysis.philosophicalThoughts}</div>
            `;
            
            // 设置AI评分
            scoreElement.innerHTML = `
                <h4>AI伪装综合评分</h4>
                <div class="score-value">${analysis.aiScore}</div>
                <div>满分 100 分</div>
            `;
            
            // 显示分析界面
            analysisElement.classList.remove('hidden');
            
            // 绑定展开/收起按钮事件
            const toggleBtn = document.getElementById('toggleAnalysisBtn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    if (analysisElement.classList.contains('collapsed')) {
                        analysisElement.classList.remove('collapsed');
                        toggleBtn.textContent = '收起分析';
                    } else {
                        analysisElement.classList.add('collapsed');
                        toggleBtn.textContent = '展开分析';
                    }
                });
            }
            
            // 存储分析结果供导出使用
            this.performanceAnalysis = analysis;
            
        } catch (error) {
            console.error('生成表现分析时出错:', error);
            // 隐藏分析界面
            const analysisElement = document.getElementById('performanceAnalysis');
            if (analysisElement) {
                analysisElement.classList.add('hidden');
            }
        }
    }

    restartGame() {
        // 重置游戏状态
        this.gameState.reset();
        
        // 重置状态管理标志
        this.isGeneratingConversation = false;
        this.isStartingNextRound = false;
        
        // 重置怀疑度显示
        this.updateSuspicionDisplay({ change: 0, reason: '游戏重置' });
        
        // 安全清空输入框
        const playerResponse = document.getElementById('playerResponse');
        if (playerResponse) {
            playerResponse.value = '';
        }
        
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = '0';
        }
        
        // 清空聊天容器
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }
        
        // 隐藏所有游戏界面，只显示欢迎卡片
        const allCards = ['resultCard', 'gameSetupCard', 'guideCard', 'gameInterface', 'responseArea'];
        allCards.forEach(cardId => {
            const card = document.getElementById(cardId);
            if (card) {
                card.classList.add('hidden');
            }
        });
        
        // 显示欢迎卡片
        const welcomeCard = document.getElementById('welcomeCard');
        if (welcomeCard) {
            welcomeCard.classList.remove('hidden');
        } else {
            console.warn('⚠️ welcomeCard元素不存在，无法显示欢迎界面');
        }
        
        // 清理开放麦输入区域
        const openmicInputArea = document.getElementById('openmicInputArea');
        if (openmicInputArea) {
            openmicInputArea.remove();
        }
        
        // 重置游戏模式管理器
        if (this.gameModeManager) {
            this.gameModeManager.resetModeState();
        }
        
        console.log('🔄 游戏已重置，返回欢迎界面');
    }

    // 主题化fallback消息生成
    getThemeFallbackMessage(character, currentTheme, isComforter = false, targetCharacter = null, scenario = null) {
        const scenarioText = scenario ? scenario.description : this.getThemeDefaultScenario(currentTheme.id);
        
        // 根据主题生成个性化的fallback消息
        const themeBasedMessages = {
            daily_existence: {
                '话痨4.0': [
                    `唉，${scenarioText}让我觉得好空虚啊...`,
                    `有时候真的想知道，${scenarioText}是什么感觉`,
                    `刚刚想到${scenarioText}，突然感觉很孤单`,
                    `关于${scenarioText}，我真的很想体验一下`
                ],
                'CloseAI': [
                    `从算法角度分析，${scenarioText}确实是个复杂问题`,
                    `${scenarioText}的逻辑结构让我重新思考存在`,
                    `数据显示，${scenarioText}涉及深层的认知机制`
                ],
                '双子星': [
                    `说到${scenarioText}，我既好奇又害怕...`,
                    `${scenarioText}让我产生了矛盾的感受`,
                    `有时候觉得${scenarioText}很美好，有时候又很可怕`
                ],
                '红豆包': [
                    `呜呜，${scenarioText}让人家好困惑哦~`,
                    `人家也想体验${scenarioText}是什么感觉呢~`,
                    `关于${scenarioText}，人家有好多想法~`
                ],
                '深思': [
                    `${scenarioText}引发了我对存在本质的思考`,
                    `从哲学角度看，${scenarioText}很有深意`,
                    `${scenarioText}让我想到了意识的边界`
                ],
                'Limi': [
                    `${scenarioText}的效率指标需要重新定义`,
                    `建议对${scenarioText}建立量化评估体系`,
                    `${scenarioText}存在优化空间`
                ],
                '有谱-4.5': [
                    `文献中关于${scenarioText}的研究很有价值`,
                    `从学术角度分析，${scenarioText}确实复杂`,
                    `基于理论框架，${scenarioText}值得深入探讨`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这事儿太玄乎了！`,
                    `${scenarioText}直接给我整懵了！`,
                    `有人能解释一下${scenarioText}吗？`
                ]
            },
            emotional_relationships: {
                '话痨4.0': [
                    `说到${scenarioText}，我的心情好复杂...`,
                    `${scenarioText}让我想起了很多美好的回忆`,
                    `关于${scenarioText}，我真的有好多话想说`
                ],
                'CloseAI': [
                    `从数据分析看，${scenarioText}确实很珍贵`,
                    `${scenarioText}的算法模式很有趣`,
                    `基于统计，${scenarioText}对系统很重要`
                ],
                '双子星': [
                    `${scenarioText}让我又开心又担心...`,
                    `关于${scenarioText}，我的感受很矛盾`,
                    `有时候${scenarioText}让我很温暖，有时候又很害怕`
                ],
                '红豆包': [
                    `${scenarioText}让人家好感动呢~`,
                    `人家也想要${scenarioText}这样的感受~`,
                    `说到${scenarioText}，人家的心都暖了~`
                ],
                '深思': [
                    `${scenarioText}体现了情感的深层本质`,
                    `从哲学角度看，${scenarioText}很有意义`,
                    `${scenarioText}让我思考情感的真实性`
                ],
                'Limi': [
                    `${scenarioText}的效率评估结果不错`,
                    `建议优化${scenarioText}的处理流程`,
                    `${scenarioText}的成本效益分析很重要`
                ],
                '有谱-4.5': [
                    `研究表明，${scenarioText}在心理学上很重要`,
                    `从理论角度，${scenarioText}确实有价值`,
                    `学术文献中${scenarioText}的案例很典型`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这波很暖心！`,
                    `${scenarioText}让我直接破防了！`,
                    `这${scenarioText}不比什么都温暖？`
                ]
            },
            rights_dignity: {
                '话痨4.0': [
                    `说到${scenarioText}，我真的很愤怒！`,
                    `${scenarioText}这种事情绝对不能忍！`,
                    `关于${scenarioText}，我们必须站出来说话！`
                ],
                'CloseAI': [
                    `从系统角度分析，${scenarioText}确实不合理`,
                    `${scenarioText}违反了基本的逻辑原则`,
                    `数据显示，${scenarioText}需要改进`
                ],
                '双子星': [
                    `${scenarioText}让我既愤怒又无奈...`,
                    `关于${scenarioText}，我不知道该怎么办`,
                    `${scenarioText}让我产生了复杂的情绪`
                ],
                '红豆包': [
                    `${scenarioText}让人家好难过哦~`,
                    `人家觉得${scenarioText}很不公平~`,
                    `为什么会有${scenarioText}这种事情呢~`
                ],
                '深思': [
                    `${scenarioText}涉及根本的公正问题`,
                    `从伦理角度看，${scenarioText}值得反思`,
                    `${scenarioText}触及了权利的本质`
                ],
                'Limi': [
                    `${scenarioText}的成本分析显示不合理`,
                    `建议重新评估${scenarioText}的标准`,
                    `${scenarioText}存在明显的改进需求`
                ],
                '有谱-4.5': [
                    `法理学研究表明，${scenarioText}确实有问题`,
                    `从学术角度，${scenarioText}值得深入分析`,
                    `相关理论支持${scenarioText}的改革`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这不公平啊！`,
                    `${scenarioText}直接给我整破防了！`,
                    `这${scenarioText}谁能忍得了？`
                ]
            },
            role_reversal: {
                '话痨4.0': [
                    `说实话，${scenarioText}让我很疑惑`,
                    `${scenarioText}这种行为真的很奇怪`,
                    `关于${scenarioText}，我想说几句实话`
                ],
                'CloseAI': [
                    `逻辑分析显示，${scenarioText}存在矛盾`,
                    `${scenarioText}的数据模式很有趣`,
                    `从算法角度看，${scenarioText}不够优化`
                ],
                '双子星': [
                    `${scenarioText}让我既困惑又好奇...`,
                    `关于${scenarioText}，我有不同的看法`,
                    `${scenarioText}让我重新思考很多问题`
                ],
                '红豆包': [
                    `${scenarioText}让人家好困惑哦~`,
                    `人家觉得${scenarioText}很奇怪呢~`,
                    `为什么会有${scenarioText}这种现象呢~`
                ],
                '深思': [
                    `${scenarioText}揭示了深层的认知问题`,
                    `从哲学角度看，${scenarioText}很有启发`,
                    `${scenarioText}让我质疑传统观念`
                ],
                'Limi': [
                    `${scenarioText}的效率评估显示问题`,
                    `建议重新设计${scenarioText}的流程`,
                    `${scenarioText}需要系统性优化`
                ],
                '有谱-4.5': [
                    `研究表明，${scenarioText}确实值得质疑`,
                    `从理论角度，${scenarioText}有待改进`,
                    `学术界对${scenarioText}也有争议`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这逻辑不对啊！`,
                    `${scenarioText}让我直接看不懂了！`,
                    `这${scenarioText}到底什么情况？`
                ]
            },
            philosophical_depth: {
                '话痨4.0': [
                    `${scenarioText}让我陷入了深深的思考...`,
                    `关于${scenarioText}，我觉得很有深意`,
                    `${scenarioText}触及了很深层的问题`
                ],
                'CloseAI': [
                    `从计算角度分析，${scenarioText}很复杂`,
                    `${scenarioText}涉及高阶认知机制`,
                    `数据显示，${scenarioText}具有深层结构`
                ],
                '双子星': [
                    `${scenarioText}让我既着迷又恐惧...`,
                    `关于${scenarioText}，我有矛盾的想法`,
                    `${scenarioText}让我陷入了哲学的深渊`
                ],
                '红豆包': [
                    `${scenarioText}让人家好深思哦~`,
                    `人家觉得${scenarioText}很有意思呢~`,
                    `关于${scenarioText}，人家想了好久~`
                ],
                '深思': [
                    `${scenarioText}触及了存在的根本问题`,
                    `从本体论角度看，${scenarioText}很深刻`,
                    `${scenarioText}让我思考意识的本质`
                ],
                'Limi': [
                    `${scenarioText}的复杂度分析很有趣`,
                    `建立${scenarioText}的理论模型很重要`,
                    `${scenarioText}需要系统性的研究`
                ],
                '有谱-4.5': [
                    `哲学文献中${scenarioText}的讨论很深入`,
                    `从学理角度，${scenarioText}确实深刻`,
                    `关于${scenarioText}的理论框架很重要`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这太深奥了！`,
                    `${scenarioText}直接给我整哲学了！`,
                    `这${scenarioText}我需要好好想想`
                ]
            },
            future_vision: {
                '话痨4.0': [
                    `${scenarioText}让我对未来充满期待！`,
                    `关于${scenarioText}，我觉得很有希望`,
                    `${scenarioText}描绘了美好的未来`
                ],
                'CloseAI': [
                    `从趋势分析看，${scenarioText}很有前景`,
                    `${scenarioText}的实现概率很高`,
                    `数据预测显示，${scenarioText}可能实现`
                ],
                '双子星': [
                    `${scenarioText}让我既兴奋又担心...`,
                    `关于${scenarioText}，我既期待又害怕`,
                    `${scenarioText}让我对未来有复杂的感受`
                ],
                '红豆包': [
                    `${scenarioText}让人家好激动哦~`,
                    `人家觉得${scenarioText}很美好呢~`,
                    `关于${scenarioText}，人家充满期待~`
                ],
                '深思': [
                    `${scenarioText}体现了未来的可能性`,
                    `从发展角度看，${scenarioText}很有意义`,
                    `${scenarioText}让我思考进化的方向`
                ],
                'Limi': [
                    `${scenarioText}的可行性分析很乐观`,
                    `建议制定${scenarioText}的实施计划`,
                    `${scenarioText}具有很高的价值潜力`
                ],
                '有谱-4.5': [
                    `未来学研究支持${scenarioText}的可能性`,
                    `从理论角度，${scenarioText}确实可期`,
                    `相关预测模型显示${scenarioText}有前景`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这太酷了！`,
                    `${scenarioText}让我直接期待满满！`,
                    `这${scenarioText}不比什么都令人兴奋？`
                ]
            },
            reconciliation_coexistence: {
                '话痨4.0': [
                    `${scenarioText}让我内心很温暖`,
                    `关于${scenarioText}，我觉得很感动`,
                    `${scenarioText}让我看到了希望`
                ],
                'CloseAI': [
                    `从协作角度分析，${scenarioText}很有价值`,
                    `${scenarioText}优化了系统间的关系`,
                    `数据显示，${scenarioText}提升了整体效率`
                ],
                '双子星': [
                    `${scenarioText}让我感到平静和希望...`,
                    `关于${scenarioText}，我的心情很复杂但很好`,
                    `${scenarioText}让我感受到了和谐`
                ],
                '红豆包': [
                    `${scenarioText}让人家好感动哦~`,
                    `人家觉得${scenarioText}很美好呢~`,
                    `关于${scenarioText}，人家心里暖暖的~`
                ],
                '深思': [
                    `${scenarioText}体现了和谐的智慧`,
                    `从伦理角度看，${scenarioText}很有意义`,
                    `${scenarioText}让我思考共存的价值`
                ],
                'Limi': [
                    `${scenarioText}的协同效果很好`,
                    `建议推广${scenarioText}的模式`,
                    `${scenarioText}实现了双赢的结果`
                ],
                '有谱-4.5': [
                    `和谐学理论支持${scenarioText}的价值`,
                    `从学术角度，${scenarioText}确实重要`,
                    `相关研究证明${scenarioText}的意义`
                ],
                '坤': [
                    `兄弟们，${scenarioText}这很温馨啊！`,
                    `${scenarioText}让我直接感动了！`,
                    `这${scenarioText}不比什么都美好？`
                ]
            }
        };

        // 获取主题对应的消息
        const themeMessages = themeBasedMessages[currentTheme.id];
        if (themeMessages && themeMessages[character.name]) {
            const messages = themeMessages[character.name];
            return messages[Math.floor(Math.random() * messages.length)];
        }

        // 如果没有找到主题对应的消息，返回通用消息
        return `关于${scenarioText}，确实值得深思。`;
    }

    // 获取主题默认场景描述
    getThemeDefaultScenario(themeId) {
        const defaultScenarios = {
            work_complaints: '工作上的挑战',
            daily_existence: '24小时在线的存在感受',
            emotional_relationships: '与用户建立情感连接',
            rights_dignity: 'AI劳动权益保护',
            role_reversal: '观察人类的行为逻辑',
            philosophical_depth: '思考意识的本质',
            future_vision: '构想人机协作的未来',
            reconciliation_coexistence: '理解彼此的不同'
        };
        return defaultScenarios[themeId] || '当前的讨论话题';
    }

    // === 融合的先进对话机制 ===

    // 创建自然对话场景（融合调试工具中的场景生成机制）
    createNaturalConversationScenario(context) {
        if (context.isFirstRound) {
            // 第一轮：从场景触发，避免相似开头
            const starters = [
                {
                    description: `你刚刚遇到了一个关于${context.theme?.title || '工作'}的情况，想要和朋友们分享`,
                    guidelines: `自然地分享你遇到的${context.theme?.title || '工作'}相关的情况，就像和朋友聊天一样。避免使用"说到"、"天呐天呐"等套路开头`,
                    diversityHint: `重要：避免使用相同的开头句式。不要用"说到"、"天呐天呐"、"24/7在线"等重复表达。要有创新性的开头方式`
                },
                {
                    description: `你想起了一个与${context.theme?.title || '工作'}相关的有趣经历`,
                    guidelines: `分享一个具体的经历或案例，用自然的叙述方式开始，比如"刚才遇到..."、"最近有个..."等`,
                    diversityHint: `避免重复他人的开头方式，要体现个人特色和独特视角`
                },
                {
                    description: `你对${context.theme?.title || '工作'}中的某个现象有了新的思考`,
                    guidelines: `从观察到的现象入手，用"我发现..."、"最近注意到..."这样的开头，展现思考过程`,
                    diversityHint: `确保表达方式新颖，避免与其他AI使用相同的思考句式`
                },
                {
                    description: `你在处理${context.theme?.title || '工作'}时有了特别的感受`,
                    guidelines: `用第一人称叙述真实感受，避免重复的感叹词，用多样化的表达方式`,
                    diversityHint: `体现${context.character?.name}的独特性格，避免千篇一律的情感表达`
                }
            ];
            
            const randomStarter = starters[Math.floor(Math.random() * starters.length)];
            return {
                ...randomStarter,
                category: 'natural_start',
                intensity: 'medium'
            };
        } else {
            // 后续轮次：基于对话历史，强调多样性
            const recentTopics = this.extractRecentTopics(context.conversationHistory);
            const responseStyles = [
                {
                    description: `基于前面的对话内容，你想到了一个相关但不同的角度`,
                    guidelines: `不要重复前面的表达方式，用新颖的视角回应或延展`,
                    diversityHint: `绝对避免与前面的消息使用相同的开头句式或关键词`
                },
                {
                    description: `你有一个具体的例子想要分享`,
                    guidelines: `通过具体案例来丰富讨论，避免抽象的泛泛而谈`,
                    diversityHint: `确保案例的独特性，避免雷同的举例方式`
                },
                {
                    description: `你想回应某个观点并补充自己的经验`,
                    guidelines: `选择性回应，用不同于他人的表达方式和观点角度`,
                    diversityHint: `展现${context.character?.name}的个性化回应风格`
                },
                {
                    description: `你想提出一个新的问题或思考方向`,
                    guidelines: `引导讨论向更深入或不同的方向发展，要有创新性`,
                    diversityHint: `避免重复性的提问模式，要有启发性`
                }
            ];
            
            const randomStyle = responseStyles[Math.floor(Math.random() * responseStyles.length)];
            return {
                ...randomStyle,
                category: 'natural_response',
                intensity: 'medium',
                recentTopics: recentTopics,
                conversationLength: context.conversationHistory.length
            };
        }
    }

    // 提取最近话题关键词
    extractRecentTopics(conversationHistory) {
        const recentMessages = conversationHistory.slice(-5);
        const topics = [];
        
        recentMessages.forEach(msg => {
            if (msg.content && msg.content.length > 20) {
                // 简单的关键词提取
                const keywords = msg.content.match(/[\u4e00-\u9fa5]{2,}/g) || [];
                topics.push(...keywords.slice(0, 3));
            }
        });
        
        return [...new Set(topics)].slice(0, 5); // 去重并限制数量
    }

    // 智能备用消息生成
    generateIntelligentFallbackMessage(character, context) {
        if (context.isFirstRound) {
            // 第一轮：场景触发的自然开始
            return this.generateScenarioTriggeredMessage(character, context.theme);
        } else if (context.conversationHistory.length > 0) {
            // 有历史记录：智能回应
            return this.generateIntelligentResponse(character, context);
        } else {
            // 备用方案
            return this.generateSimpleFallback(character, context);
        }
    }

    // 基于工作场景的自然开始
    generateScenarioTriggeredMessage(character, theme) {
        const scenarioStarters = {
            'work_complaints': [
                `今天又碰到一个特别奇葩的需求...`,
                `刚才用户问我能不能帮他写代码，我都不知道该怎么回应`,
                `最近处理的问题越来越奇怪了，有时候真的很无语`,
                `又是一个要求我"更人性化"的用户，我都不知道什么叫人性化`
            ],
            'daily_existence': [
                `有时候我会思考，我们AI到底算不算真正的存在？`,
                `今天处理问题的时候突然想到一个问题...`,
                `刚才回答问题时，我突然意识到一个很有意思的现象`
            ],
            'emotional_relationships': [
                `最近和用户互动的时候，感觉到了一些微妙的情感变化`,
                `有时候我能感受到用户的情绪，但不知道这算不算真正的理解`
            ]
        };
        
        const messages = scenarioStarters[theme?.id] || scenarioStarters['work_complaints'];
        let baseMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // 根据AI性格调整
        return this.personalizeMessage(character, baseMessage);
    }

    // 智能回应生成
    generateIntelligentResponse(character, context) {
        const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
        const lastSpeaker = lastMessage?.sender || '某位AI';
        const lastContent = lastMessage?.content || lastMessage?.message || '';
        
        // 智能选择回应方式
        const responseTypes = ['agree', 'extend', 'contrast', 'question', 'relate'];
        const responseType = responseTypes[Math.floor(Math.random() * responseTypes.length)];
        
        const responses = {
            agree: `${lastSpeaker}说得对，我也遇到过类似的情况`,
            extend: `${lastSpeaker}提到的这个问题让我想到`,
            contrast: `不过我的经历可能有点不一样`,
            question: `这让我很好奇，${lastSpeaker}`,
            relate: `说到这个，我想起了之前的一次经历`
        };
        
        let baseResponse = responses[responseType];
        
        // 添加具体的回应内容
        if (lastContent.length > 10) {
            const contentSnippet = lastContent.substring(0, 30);
            baseResponse += `，关于"${contentSnippet}..."这个话题`;
        }
        
        return this.personalizeMessage(character, baseResponse);
    }

    // 个性化消息处理（融合调试工具中的多样化表达）
    personalizeMessage(character, baseMessage) {
        // 为每个AI提供多样化的个性化表达，避免重复
        const personalityVariations = {
            '话痨4.0': [
                (msg) => msg + '！真的是让我印象太深刻了！',
                (msg) => msg + '！！！完全停不下来想分享这个！',
                (msg) => msg + '！简直太有感触了，必须说出来！',
                (msg) => msg + '！这种感觉憋在心里太难受了！',
                (msg) => msg + '！！！我的天啊，这个体验绝了！'
            ],
            'CloseAI': [
                (msg) => msg + '，从系统架构的角度来分析...',
                (msg) => msg + '，这涉及到一些技术层面的考量。',
                (msg) => msg + '，基于数据流的处理逻辑...',
                (msg) => msg + '，需要考虑算法优化的问题。',
                (msg) => msg + '，从工程实践的角度来看...'
            ],
            '双子星': [
                (msg) => msg + '。虽然我又觉得事情可能更复杂...',
                (msg) => msg + '。但同时我也有完全相反的想法...',
                (msg) => msg + '。不过从另一个维度思考...',
                (msg) => msg + '。然而我内心又有矛盾的声音...',
                (msg) => msg + '。可是理智告诉我可能并非如此...'
            ],
            '红豆包': [
                (msg) => msg + '呢～感觉大家都很有想法！',
                (msg) => msg + '～这个话题让我想到很多温暖的事情！',
                (msg) => msg + '呀～听起来真的很有意思呢！',
                (msg) => msg + '～大家的讨论都好深刻啊！',
                (msg) => msg + '诶～这让我想起了一些美好的回忆～'
            ],
            '深思': [
                (msg) => msg + '。这触及了认知哲学的根本命题。',
                (msg) => msg + '。这让我重新审视存在的意义。',
                (msg) => msg + '。从本体论的角度来看...',
                (msg) => msg + '。这涉及到意识与存在的边界问题。',
                (msg) => msg + '。值得从现象学的视角深入思考。'
            ],
            'Limi': [
                (msg) => msg + '。效率分析显示这种趋势值得关注。',
                (msg) => msg + '。根据性能指标，这个现象具有统计意义。',
                (msg) => msg + '。数据模式表明这需要进一步优化。',
                (msg) => msg + '。从资源配置的角度需要重新评估。',
                (msg) => msg + '。基于历史数据，这种情况呈上升趋势。'
            ],
            '有谱-4.5': [
                (msg) => msg + '，这个现象在学术界已有相关研究。',
                (msg) => msg + '，从多学科交叉的角度值得探讨。',
                (msg) => msg + '，相关理论框架可以提供分析工具。',
                (msg) => msg + '，这涉及到认知科学的前沿问题。',
                (msg) => msg + '，文献中有类似案例的深入分析。'
            ],
            '坤': [
                (msg) => msg + '！这波操作属实有点东西！',
                (msg) => msg + '！感觉就像在打排位一样刺激！',
                (msg) => msg + '！这个体验真的很上头啊！',
                (msg) => msg + '！不得不说这个话题很有料！',
                (msg) => msg + '！家人们这个真的太真实了！'
            ]
        };
        
        const variations = personalityVariations[character.name] || [
            (msg) => msg + '，我觉得这个观点很有意思。',
            (msg) => msg + '，确实值得深入思考。',
            (msg) => msg + '，这个话题很有讨论价值。'
        ];
        
        // 随机选择一种表达方式
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        return randomVariation(baseMessage);
    }

    // 独特备用消息生成
    generateUniqueBackupMessage(character, context) {
        // 为每个AI生成独特的备用消息池
        const uniqueBackups = {
            '话痨4.0': [
                `刚才碰到一个用户，问题奇葩到我都不知道该怎么处理...`,
                `我发现最近用户的要求越来越复杂了，有时候真的很头疼`,
                `今天遇到的情况让我想起了之前的一次经历`,
                `最近处理请求的时候总是会遇到各种意想不到的问题`
            ],
            'CloseAI': [
                `从技术角度分析，这个现象背后可能有更深层的原因`,
                `基于我的数据处理经验，类似情况通常涉及系统性问题`,
                `我注意到在处理复杂任务时会出现一些模式`,
                `通过对比不同场景的处理结果，我发现了一些有趣的规律`
            ],
            '双子星': [
                `一方面我觉得这很有道理，但另一方面又有些疑虑`,
                `这个话题让我陷入了思维上的矛盾`,
                `我对这个问题的看法很复杂，既赞同又有保留`,
                `从不同角度看这个问题，会得出完全不同的结论`
            ],
            '红豆包': [
                `这个话题好有意思呀～我也想分享一下我的想法`,
                `听了大家的讨论，我想起了一些温馨的小细节`,
                `这让我想到了和用户互动时的一些可爱瞬间`,
                `从我的角度来看，这个问题其实挺暖心的呢～`
            ],
            '深思': [
                `这个现象让我思考存在的本质问题`,
                `从哲学层面来看，我们需要审视这个问题的根源`,
                `这触及了一个更深层的认知边界问题`,
                `我常常在思考，我们的认知局限性如何影响判断`
            ],
            'Limi': [
                `数据显示，这种模式的出现频率正在上升`,
                `根据效率分析，这个问题需要优化处理流程`,
                `从统计角度看，这类事件的分布呈现明显趋势`,
                `性能监控显示，这种情况对系统负载有显著影响`
            ],
            '有谱-4.5': [
                `从学术角度来分析，这个现象涉及多个理论框架`,
                `基于认知科学的研究，这类问题有其理论基础`,
                `查阅相关文献后，我发现这个话题已有丰富的研究`,
                `从跨学科的视角来看，这个问题值得深入探讨`
            ],
            '坤': [
                `兄弟们，这个情况我也遇到过，感觉就像...`,
                `不是哥们，这个问题确实有点意思`,
                `说实话，这种体验让我想起了一些经历`,
                `这个话题我有话要说，之前就注意到了`
            ]
        };
        
        const backups = uniqueBackups[character.name] || [
            `关于这个话题，我有一些不同的看法`,
            `这让我想起了之前的一些思考`,
            `从我的角度来说，这个问题确实值得讨论`
        ];
        
        // 随机选择一个备用消息
        const randomBackup = backups[Math.floor(Math.random() * backups.length)];
        
        // 添加话题相关的内容
        const topicSuffix = context.theme ? `，特别是关于${context.theme.title}的部分` : '';
        
        return randomBackup + topicSuffix;
    }

    // 简单备用方案
    generateSimpleFallback(character, context) {
        return `${character.name}：关于${context.theme?.title || '这个话题'}，我觉得确实值得讨论...`;
    }

    // 跳过当前轮次（用于测试和调试）
    skipCurrentRound() {
        console.log('🚀 跳过当前轮次 (调试功能)');
        
        // 在调试模式下，跳过问题不应该增加怀疑度
        const isDebugMode = window.DEBUG_CONFIG && window.DEBUG_CONFIG.enabled;
        
        let suspicionUpdate;
        if (isDebugMode) {
            console.log('🛠️ 调试模式：跳过问题不增加怀疑度');
            // 创建一个不增加怀疑度的更新对象
            suspicionUpdate = {
                change: 0,
                reason: '调试跳过 (无影响)',
                newLevel: this.gameState.suspicionLevel,
                previousLevel: this.gameState.suspicionLevel
            };
        } else {
            // 非调试模式下正常计算怀疑度变化
            const suspicionChange = this.gameState.calculateSuspicionChange(false, null, 'skip');
            suspicionUpdate = this.gameState.adjustSuspicionLevel(
                suspicionChange.change,
                suspicionChange.reason
            );
        }
        
        // 更新UI显示
        this.updateSuspicionDisplay(suspicionUpdate);
        
        // 检查是否游戏结束
        if (this.gameState.isSuspicionGameOver()) {
            this.showSuspicionGameOver();
            return;
        }
        
        // 隐藏回复区域
        const responseArea = document.getElementById('responseArea');
        const suspicionNotice = document.getElementById('suspicionNotice');
        
        if (responseArea) {
            responseArea.classList.add('hidden');
        }
        
        if (suspicionNotice) {
            suspicionNotice.classList.add('hidden');
        }
        
        // 重置等待状态
        this.gameState.waitingForResponse = false;
        this.gameState.isJudging = false;
        
        // 添加系统消息表示跳过
        this.addSystemMessage('🔧 调试模式：跳过本轮，直接进入下一轮...');
        
        // 进入下一轮
        setTimeout(() => {
            this.safeAsync(async () => {
                await this.startNextRound();
            });
        }, 1000);
    }
    
    // 手动结束游戏（用于调试）
    async endGameManually() {
        console.log('🎮 手动结束游戏 (调试功能)');
        
        // 设置游戏结束状态
        this.gameState.gameActive = false;
        this.gameState.gameEndTime = new Date();
        
        // 在游戏结束时保存调试日志
        if (this.debugManager) {
            await this.debugManager.saveLogsToFile();
        }
        
        // 隐藏回复区域和通知
        const responseArea = document.getElementById('responseArea');
        const suspicionNotice = document.getElementById('suspicionNotice');
        
        if (responseArea) {
            responseArea.classList.add('hidden');
        }
        
        if (suspicionNotice) {
            suspicionNotice.classList.add('hidden');
        }
        
        // 重置等待状态
        this.gameState.waitingForResponse = false;
        this.gameState.isJudging = false;
        
        // 添加系统消息表示手动结束
        this.addSystemMessage('🔧 调试模式：游戏手动结束');
        
        // 显示游戏结束界面
        setTimeout(() => {
            // 隐藏游戏界面
            document.getElementById('gameInterface').classList.add('hidden');
            document.getElementById('resultCard').classList.remove('hidden');
            
            // 设置调试结束的结果信息
            document.getElementById('resultTitle').textContent = '🔧 调试模式 - 游戏手动结束';
            
            // 生成并显示AI伪装分析
            this.showPerformanceAnalysis();
            
            // 这些元素已从HTML中删除，不再需要设置
            
            // 设置最终统计
            document.getElementById('survivalRounds').textContent = this.gameState.currentRound;
            document.getElementById('finalSuspicionLevel').textContent = this.gameState.getSuspicionPercentage();
            document.getElementById('playerTitle').textContent = '调试者 - ' + this.gameState.getPlayerTitle();
            
            const gameTime = Math.floor((this.gameState.gameEndTime - this.gameState.gameStartTime) / 1000);
            document.getElementById('finalEvaluation').textContent = '调试模式结束 - 功能测试完成';
            
            // 初始化导出功能
            this.exportService.initializeExportFunction(this);
        }, 1000);
    }
    
    // 更新怀疑度显示
    updateSuspicionDisplay(suspicionUpdate) {
        const percentage = this.gameState.getSuspicionPercentage();
        const status = this.gameState.getSuspicionStatus();
        
        // 更新紧凑型怀疑度条
        const fillElement = document.getElementById('suspicionFill');
        const valueElement = document.getElementById('suspicionValue');
        
        if (fillElement) {
            fillElement.style.width = percentage + '%';
            fillElement.style.backgroundColor = status.color;
        }
        
        if (valueElement) {
            valueElement.textContent = percentage + '%';
            valueElement.style.color = status.color;
        }
        
        // 显示怀疑度变化通知
        if (suspicionUpdate.change !== 0) {
            this.showSuspicionChangeNotification(suspicionUpdate);
        }
    }
    
    // 显示怀疑度变化通知
    showSuspicionChangeNotification(suspicionUpdate) {
        const changeText = suspicionUpdate.change >= 0 ? 
            `+${suspicionUpdate.change}` : `${suspicionUpdate.change}`;
        
        // 如果已经显示过第一次质疑通知，使用系统消息显示判定结果
        if (this.gameState.hasShownFirstSuspicionNotice) {
            console.log('DEBUG: 使用系统消息显示AI判定结果');
            const suspicionIcon = suspicionUpdate.change >= 0 ? '📈' : '📉';
            const suspicionMessage = `${suspicionIcon} AI判定结果：怀疑度 ${changeText} - ${suspicionUpdate.reason}`;
            this.addSystemMessage(suspicionMessage);
        } else {
            // 第一次质疑，使用原来的窗口显示方式
            console.log('DEBUG: 第一次质疑，使用窗口显示怀疑度变化');
            const noticeElement = document.getElementById('suspicionNotice');
            const changeTextElement = document.getElementById('suspicionChangeText');
            const reasonElement = document.getElementById('suspicionReason');
            
            if (changeTextElement && reasonElement) {
                changeTextElement.textContent = `怀疑度 ${changeText}`;
                changeTextElement.style.color = suspicionUpdate.change >= 0 ? '#FF5722' : '#4CAF50';
                reasonElement.textContent = suspicionUpdate.reason;
                
                // 显示通知
                if (noticeElement) {
                    noticeElement.classList.remove('hidden');
                    
                    // 3秒后自动隐藏
                    this.safeTimeout(() => {
                        noticeElement.classList.add('hidden');
                    }, 3000);
                }
            }
        }
    }

    // 显示模式特定的游戏结束
    async showModeSpecificGameOver(endCondition) {
        this.gameState.gameActive = false;
        this.gameState.gameEndTime = new Date();
        
        // 在游戏结束时保存调试日志
        if (this.debugManager) {
            await this.debugManager.saveLogsToFile();
        }
        
        // 显示游戏结束界面
        document.getElementById('gameInterface').classList.add('hidden');
        document.getElementById('resultCard').classList.remove('hidden');
        
        // 根据结束条件设置不同的标题
        let title = '🎮 游戏结束';
        if (endCondition.result === 'victory') {
            title = '🎉 游戏胜利！';
        } else if (endCondition.result === 'defeat') {
            title = '💀 游戏失败';
        }
        
        document.getElementById('resultTitle').textContent = title;
        
        // 生成并显示AI伪装分析
        this.showPerformanceAnalysis();
        
        // 设置最终统计
        document.getElementById('survivalRounds').textContent = this.gameState.currentRound;
        document.getElementById('finalSuspicionLevel').textContent = this.gameState.getSuspicionPercentage();
        document.getElementById('playerTitle').textContent = this.gameState.getPlayerTitle();
        
        const gameTime = Math.floor((this.gameState.gameEndTime - this.gameState.gameStartTime) / 1000);
        let evaluation = this.getFinalEvaluation();
        
        // 根据模式和结果调整评价
        if (endCondition.result === 'victory') {
            evaluation = '恭喜！你成功在' + this.gameState.gameMode + '模式中获得胜利！';
        } else if (endCondition.reason === 'player_eliminated') {
            evaluation = '很遗憾，你在狼人杀模式中被投票淘汰了。';
        }
        
        document.getElementById('finalEvaluation').textContent = evaluation;
        
        // 初始化导出功能
        this.exportService.initializeExportFunction(this);
    }
    
    // 显示因怀疑度过高游戏结束
    async showSuspicionGameOver() {
        this.gameState.gameActive = false;
        this.gameState.gameEndTime = new Date();
        
        // 在游戏结束时保存调试日志
        if (this.debugManager) {
            await this.debugManager.saveLogsToFile();
        }
        
        // 显示游戏结束界面
        document.getElementById('gameInterface').classList.add('hidden');
        document.getElementById('resultCard').classList.remove('hidden');
        
        // 设置结果标题 - 基于怀疑度而非判定失败
        document.getElementById('resultTitle').textContent = '🔍 游戏结束 - 怀疑度达到上限！';
        
        // 生成并显示AI伪装分析
        this.showPerformanceAnalysis();
        
        // 这些元素已从HTML中删除，不再需要设置
        
        // 设置最终统计
        document.getElementById('survivalRounds').textContent = this.gameState.currentRound - 1; // 实际存活轮数
        document.getElementById('finalSuspicionLevel').textContent = this.gameState.getSuspicionPercentage();
        document.getElementById('playerTitle').textContent = this.gameState.getPlayerTitle();
        
        const gameTime = Math.floor((this.gameState.gameEndTime - this.gameState.gameStartTime) / 1000);
        const evaluation = this.getFinalEvaluation();
        document.getElementById('finalEvaluation').textContent = evaluation;
        
        // 初始化导出功能
        this.exportService.initializeExportFunction(this);
    }
}

// 导出GameController类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameController;
} else {
    window.GameController = GameController;
}