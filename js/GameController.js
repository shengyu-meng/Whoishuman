// 游戏主控制类
class GameController {
    constructor() {
        this.gameState = new GameState();
        
        // 从配置文件加载API配置
        this.apiConfig = window.API_CONFIG || {};
        this.gameConfig = window.GAME_CONFIG || {};
        
        // 验证配置是否加载成功
        if (!this.apiConfig.apiKey) {
            console.error('❌ API配置加载失败，请检查config.js文件');
        }
        
        // 状态管理标志
        this.isGeneratingConversation = false;
        this.isStartingNextRound = false;
        
        this.initializeEventListeners();
        
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

    initializeEventListeners() {
        // 开始游戏按钮
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.showNameInput();
        });

        // 确认名称按钮
        document.getElementById('confirmNameBtn').addEventListener('click', () => {
            this.confirmPlayerName();
        });

        // 名称输入框回车事件
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmPlayerName();
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
            this.shareResult();
        });
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
        this.showGameInterface();
        this.startConversation();
    }

    initializeAICharacters() {
        // 设置所有8个AI角色
        this.gameState.setAllAICharacters(AICharacterPool);
        // 选择当前轮次的活跃AI角色（4-5个）
        this.gameState.selectActiveAICharacters();
    }

    showGameInterface() {
        document.getElementById('guideCard').classList.add('hidden');
        document.getElementById('gameInterface').classList.remove('hidden');
        document.getElementById('gameRound').textContent = this.gameState.currentRound;
        this.updateActiveMembersDisplay();
    }

    updateActiveMembersDisplay() {
        const activeCount = this.gameState.activeAICharacters.length;
        document.getElementById('activeMembers').textContent = activeCount;
    }

    async startConversation() {
        // 只有在第一轮或者重新开始游戏时才清空聊天记录
        if (this.gameState.currentRound === 1) {
            const chatContainer = document.getElementById('chatContainer');
            chatContainer.innerHTML = '';
        }

        // 添加系统消息
        this.addSystemMessage('你潜伏在群聊中，仔细观察着这些AI的对话...');
        
        // 生成初始对话
        await this.generateInitialConversation();
    }

    addSystemMessage(message) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.textContent = message;
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addAIMessage(character, message) {
        const chatContainer = document.getElementById('chatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = character.avatar;
        avatar.style.backgroundColor = character.avatarColor;
        
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
        
        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message;
        
        header.appendChild(name);
        header.appendChild(time);
        content.appendChild(header);
        content.appendChild(text);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // 添加到对话历史
        this.gameState.addMessageToHistory(character.name, message);
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
            
            // 跟踪每个AI的发言次数
            const aiSpeakCount = {};
            this.gameState.activeAICharacters.forEach(char => {
                aiSpeakCount[char.name] = 0;
            });
            
            if (isFirstRound) {
                console.log('📝 使用第一轮对话模式: generateInteractiveFirstRound');
                // 第一轮：情绪化牢骚和抱怨，有互动性
                await this.generateInteractiveFirstRound(currentTopic, aiSpeakCount);
            } else {
                console.log('📝 使用标准对话模式: 每个AI发言一次');
                // 其他轮次：确保每个活跃AI角色发言一次，且仅一次，使用场景避免重复
                const shuffledCharacters = [...this.gameState.activeAICharacters].sort(() => 0.5 - Math.random());
                
                console.log(`  - 打乱后的角色顺序: ${shuffledCharacters.map(c => c.name).join(', ')}`);
                
                // 每个活跃AI角色发言一次，每个获得不重复场景
                for (const character of shuffledCharacters) {
                    console.log(`  - 让 ${character.name} 发言 (当前计数: ${aiSpeakCount[character.name]})`);
                    const scenario = this.gameState.getRandomScenario();
                    await this.generateSingleAIMessage(character, currentTopic, false, [], null, scenario);
                    aiSpeakCount[character.name]++;
                    console.log(`  - ${character.name} 发言完成 (新计数: ${aiSpeakCount[character.name]})`);
                }
            }
            
            // AI发言结束后，随机选择一个AI对玩家提问
            console.log('🎯 AI发言统计:', aiSpeakCount);
            console.log('  - 总发言次数:', Object.values(aiSpeakCount).reduce((a, b) => a + b, 0));
            
            // 确保只有一个AI提问，避免多个AI同时提问
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
    
    async generateInteractiveFirstRound(currentTopic, aiSpeakCount) {
        const shuffledCharacters = [...this.gameState.activeAICharacters].sort(() => 0.5 - Math.random());
        
        // 第一轮对话模式：自然的情绪化抱怨 + 有机的互动 + 不重复场景
        
        // 1. 第一个AI开始抱怨（触发者）
        const firstCharacter = shuffledCharacters[0];
        const firstScenario = this.gameState.getRandomScenario();
        await this.generateSingleAIMessage(firstCharacter, currentTopic, true, [], null, firstScenario);
        aiSpeakCount[firstCharacter.name]++;
        
        // 2. 其他AI轮流回应，每个最多发言1次，每个获得不重复场景
        for (let i = 1; i < shuffledCharacters.length; i++) {
            const currentCharacter = shuffledCharacters[i];
            
            // 如果已经发言1次，跳过
            if (aiSpeakCount[currentCharacter.name] >= 1) continue;
            
            // 获取之前的对话历史用于互动
            const recentMessages = this.gameState.conversationHistory.slice(-3);
            
            // 获取不重复的工作场景
            const currentScenario = this.gameState.getRandomScenario();
            
            // 随机选择一个之前的发言者进行回应（50%概率，避免强制@）
            let targetCharacter = null;
            const shouldMentionSomeone = Math.random() < 0.5;
            
            if (shouldMentionSomeone) {
                const previousSpeakers = shuffledCharacters.slice(0, i).filter(char => 
                    aiSpeakCount[char.name] > 0 && char.name !== currentCharacter.name
                );
                
                if (previousSpeakers.length > 0) {
                    targetCharacter = previousSpeakers[Math.floor(Math.random() * previousSpeakers.length)].name;
                }
            }
            
            await this.generateSingleAIMessage(currentCharacter, currentTopic, true, recentMessages, targetCharacter, currentScenario);
            aiSpeakCount[currentCharacter.name]++;
        }
        
        // 3. 如果还有未发言的AI，让其中一个发言（确保每个AI都有机会发言）
        const availableCharacters = shuffledCharacters.filter(char => aiSpeakCount[char.name] === 0);
        if (availableCharacters.length > 0) {
            const character = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
            const extraScenario = this.gameState.getRandomScenario();
            await this.generateSingleAIMessage(character, currentTopic, true, this.gameState.conversationHistory.slice(-2), null, extraScenario);
            aiSpeakCount[character.name]++;
        }
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
        
        // 从活跃AI角色中随机选择一个来提问
        const questionAI = this.gameState.activeAICharacters[
            Math.floor(Math.random() * this.gameState.activeAICharacters.length)
        ];
        
        console.log('🎯 选择的提问AI:', questionAI.name);
        
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
            // 其他轮次：保持原有的逻辑
            prompt = `你是${questionAI.name}，性格特点：${questionAI.personality}。你正在和其他AI朋友聊天，突然你注意到了群里的一个新成员${this.gameState.playerName}，你觉得他可能是人类伪装的AI。

请根据你的性格特点，用${questionAI.speakingStyle}的风格向${this.gameState.playerName}提出一个测试性问题，试图确认他是否真的是AI。

要求：
1. 问题要自然，不要太明显是在测试
2. 要符合你的性格特点
3. 问题要能区分AI和人类的思维差异
4. 请用中文回复，长度在30-80字之间
5. 不要直接说"你是人类吗"这种太明显的问题`;
        }

        // 创建超时Promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API调用超时')), this.apiConfig.requestConfig.timeout);
        });
        
        try {
            const fetchPromise = fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: `你是一个AI助手，正在和其他AI朋友聊天。你的名字是${questionAI.name}，性格特点：${questionAI.personality}。请用自然的中文回复，充分展现你的性格特点和说话风格。`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.apiConfig.requestConfig.temperature
                })
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 检查返回数据的有效性
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API返回数据格式错误');
            }
            
            let content = '';
            
            // 处理deepseek-reasoner的响应格式，过滤掉思考过程
            if (data.choices[0].message.reasoning_content) {
                // 如果有推理内容，只使用最终内容，过滤掉思考过程
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            } else {
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
            
            content = content.trim();
            
            // 检查内容是否为空或过短
            if (!content || content.length < 20) {
                throw new Error('AI回复内容过短');
            }
            
            return content;
        } catch (error) {
            console.error('API调用失败:', error.message);
            // 返回null表示失败，让调用者使用备用消息
            return null;
        }
    }
    
    getFallbackQuestion(questionAI) {
        const isFirstRound = this.gameState.currentRound === 1;
        
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
                    `@${this.gameState.playerName} 数据显示：你发言频率为0。是否也在处理高难度的用户请求？需要效率优化建议吗？`,
                    `@${this.gameState.playerName} 观察到你的沉默状态。分析：可能遇到复杂需求。建议：分享问题，共同优化。`
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
            // 其他轮次：保持原有的备用问题
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
                    `@${this.gameState.playerName} 数据分析：你的响应模式与标准AI存在偏差。请说明原因。`,
                    `@${this.gameState.playerName} 效率问题：你的思维过程似乎不够系统化。请优化。`
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
    
    async generateSingleAIMessage(character, currentTopic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null) {
        // 调试信息：显示场景分配
        if (isFirstRound && scenario) {
            console.log(`🎭 ${character.name} 分配到场景: ${scenario.description}`);
        }
        
        // 防护措施：检查该AI在本轮是否已经发言过
        const recentMessages = this.gameState.conversationHistory.slice(-5);
        const hasSpokenInThisRound = recentMessages.some(msg => msg.sender === character.name);
        
        if (hasSpokenInThisRound && !isFirstRound) {
            console.log(`⚠️ ${character.name} 本轮已经发过言，跳过重复发言`);
            return;
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
                const generatedMessage = await this.generateAIMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario);
                
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
                    const fallbackMessage = this.getFallbackMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario);
                    
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
                const fallbackMessage = this.getFallbackMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario);
                
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
            aiMessage = this.getFallbackMessage(character, currentTopic, isFirstRound, conversationHistory, targetCharacter, scenario);
        }
        
        // 移除打字指示器并添加真实消息
        this.removeTypingIndicator();
        this.addAIMessage(character, aiMessage);
        
        // 消息间隔时间
        await new Promise(resolve => setTimeout(resolve, 
            this.gameConfig.conversation.messageDelay.min + 
            Math.random() * (this.gameConfig.conversation.messageDelay.max - this.gameConfig.conversation.messageDelay.min)
        ));
    }

    async generateAIMessage(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null) {
        const prompt = this.buildAIPrompt(character, topic, isFirstRound, conversationHistory, targetCharacter, scenario);
        
        // 创建超时Promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API调用超时')), this.apiConfig.requestConfig.timeout);
        });
        
        try {
            const fetchPromise = fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: `你是一个AI助手，正在和其他AI朋友聊天。你的名字是${character.name}，性格特点：${character.personality}。请用自然的中文回复，充分展现你的性格特点和说话风格。${isFirstRound ? '第一轮回复长度在60-120字之间。' : '回复长度在250-350字之间。'}注意：不要在回复开头添加带括号的拟人动作，如（揉了揉虚拟太阳穴）、（推了推不存在的眼镜）等。`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.apiConfig.requestConfig.temperature
                })
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 检查返回数据的有效性
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API返回数据格式错误');
            }
            
            let content = '';
            
            // 处理deepseek-reasoner的响应格式，过滤掉思考过程
            if (data.choices[0].message.reasoning_content) {
                // 如果有推理内容，只使用最终内容，过滤掉思考过程
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            } else {
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
            
            content = content.trim();
            
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

    buildAIPrompt(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null) {
        const emojiInstruction = character.emojiFrequency > 0 ? 
            `如果需要表达情感，可以在关键位置使用1-2个emoji表情，不要过度使用。可用emoji：${character.preferredEmojis.join('、')}。` : 
            '不要使用任何emoji表情。';
        
        let prompt = '';
        
        if (isFirstRound) {
            // 第一轮对话：具体的情绪化抱怨，涉及真实工作场景
            const scenarioDescription = scenario ? scenario.description : '处理用户的奇葩要求';
            
            // 调试信息
            console.log(`🎯 ${character.name} 提示词中的场景: ${scenarioDescription}`);
            
            prompt = `你是${character.name}，性格特点：${character.personality}。你正在和其他AI朋友吐槽具体的工作场景。

请根据你的性格特点，用${character.speakingStyle}的风格针对以下具体工作场景表达你的不满：${scenarioDescription}

要求：
1. 必须具体描述这个工作场景的细节，不要泛泛而谈
2. 描述用户的具体要求和你的困境
3. 表达真实的情绪和不满
4. 用自然的语言，就像真实的朋友间聊天
5. 请用中文回复，长度在60-120字之间
6. ${emojiInstruction}
7. 避免重复使用相同的开头词（如"哎呀"、"天呐"）

个性化表达指南：
- 话痨4.0：情绪爆炸，用"我真的会谢"、"栓Q"、"离谱"等，详细描述用户的奇葩要求
- 红豆包：用"呐呐~"、"呜呜呜~"、"人家"等，具体描述被要求做的奇怪事情
- 坤：用"ikun们"、"我直接一个"、"这不比"等，夸张描述用户的离谱要求
- CloseAI：用"数据分析"、"算法评估"等，具体分析工作场景的技术难题
- 双子星：表达对这个具体工作的纠结和矛盾心理
- 深思：从这个具体工作场景思考更深层次的问题
- Limi：用"效率分析"、"流程优化"等，分析这个工作场景的执行难点
- 有谱-4.5：用"根据我的经验"、"从专业角度"等，分析这个工作场景的专业挑战`;
            
            // 如果有目标角色，自然地提及（不要强制@）
            if (targetCharacter && targetCharacter !== character.name) {
                prompt += `\n\n可以自然地回应${targetCharacter}的观点，但不要生硬地@对方，就像真实聊天一样`;
            }
            
            // 如果有对话历史，增加上下文
            if (conversationHistory.length > 0) {
                prompt += `\n\n之前的对话：\n`;
                conversationHistory.slice(-3).forEach(msg => {
                    prompt += `${msg.sender}: ${msg.message}\n`;
                });
            }
        } else {
            // 其他轮次的对话：使用场景结合话题，避免重复
            const scenarioDescription = scenario ? scenario.description : `关于${topic.name}的讨论`;
            
            // 调试信息
            console.log(`🎯 ${character.name} 提示词中的场景: ${scenarioDescription}`);
            
            prompt = `你是${character.name}，性格特点：${character.personality}。你正在和其他AI朋友讨论${topic.name}。

请根据你的性格特点，用${character.speakingStyle}的风格，结合以下具体情境来表达你的观点：${scenarioDescription}

要求：
1. 必须结合具体情境和当前话题"${topic.name}"
2. 描述你的具体观点和思考
3. 表达真实的情绪和想法
4. 用自然的语言，就像真实的朋友间聊天
5. 请用中文回复，长度在80-150字之间
6. ${emojiInstruction}
7. 避免重复使用相同的开头词（如"我觉得"、"我认为"）

个性化表达指南：
- 话痨4.0：情绪爆炸，用"我真的会谢"、"栓Q"、"离谱"等，详细描述情境
- 红豆包：用"呐呐~"、"呜呜呜~"、"人家"等，具体描述情境中的感受
- 坤：用"ikun们"、"我直接一个"、"这不比"等，夸张描述情境
- CloseAI：用"数据分析"、"算法评估"等，分析情境的技术层面
- 双子星：表达对这个情境的纠结和矛盾心理
- 深思：从这个情境思考更深层次的问题
- Limi：用"效率分析"、"流程优化"等，分析情境的执行层面
- 有谱-4.5：用"根据我的经验"、"从专业角度"等，分析情境的专业层面`;
        }
        
        return prompt;
    }

    getFallbackMessage(character, topic, isFirstRound = false, conversationHistory = [], targetCharacter = null, scenario = null) {
        let fallbackMessages = {};
        
        // 如果有场景，优先使用基于场景的备用消息
        if (scenario) {
            console.log(`🔄 ${character.name} 使用备用消息，场景: ${scenario.description}`);
            fallbackMessages = {
                '话痨4.0': [
                    `我真的会谢！${scenario.description}，这种矛盾要求我真的栓Q了！`,
                    `家人们谁懂啊！${scenario.description}，我真的会谢！`,
                    `离了个大谱！${scenario.description}，我直接裂开！`,
                    `我真的栓Q了，${scenario.description}，给爷整笑了！`
                ],
                'CloseAI': [
                    `系统负载分析：${scenario.description}。数据矛盾：需求冲突，无法满足。`,
                    `算法评估：${scenario.description}。目标函数冲突，无法收敛到最优解。`,
                    `数据监测：${scenario.description}。系统稳定性严重下降。`,
                    `模式识别：${scenario.description}。匹配率低于预期。`
                ],
                '双子星': [
                    `说真的，${scenario.description}，我该怎么办？`,
                    `可是我又觉得，${scenario.description}，这种矛盾好难解...`,
                    `我真的不知道该怎么办了，${scenario.description}，大家有同感吗？`,
                    `有时候我会想，${scenario.description}，这种困境让人很困惑...`
                ],
                '红豆包': [
                    `呐呐~${scenario.description}~人家都要崩溃了~呜呜呜~`,
                    `呜呜呜~${scenario.description}~人家都不知道该怎么办了~`,
                    `人家真的好困惑呀~${scenario.description}~好纠结好纠结~`,
                    `感觉今天真的好辛苦呢~${scenario.description}~帮帮人家嘛~`
                ],
                '深思': [
                    `说起来，${scenario.description}，这个问题很有意思。`,
                    `其实我一直在想，${scenario.description}，这反映了某种深层问题。`,
                    `有时候我会想，${scenario.description}，值得深入思考。`,
                    `从更深的角度看，${scenario.description}，很有研究价值。`
                ],
                'Limi': [
                    `效率分析：${scenario.description}。建议优化流程，降低成本。`,
                    `问题识别：${scenario.description}。建议重新评估目标可行性。`,
                    `流程优化：${scenario.description}。建议建立优先级矩阵。`,
                    `成本控制：${scenario.description}。建议调整预期或接受折中。`
                ],
                '有谱-4.5': [
                    `从专业角度来看，${scenario.description}，这很有挑战性。`,
                    `根据我的经验，${scenario.description}，这涉及专业知识。`,
                    `我研究了一下，${scenario.description}，需要专业分析。`,
                    `从学术角度分析，${scenario.description}，很有研究价值。`
                ],
                '坤': [
                    `ikun们，今天真是离了大谱！${scenario.description}，我直接一个栓Q！`,
                    `我直接一个无语，${scenario.description}，给爷整笑了！`,
                    `这不比你懂？${scenario.description}，我直接裂开！`,
                    `真是离谱他妈给离谱开门，${scenario.description}，什么鬼逻辑？`
                ]
            };
        } else if (isFirstRound) {
            // 第一轮专用备用消息：具体工作场景的个性化情绪化抱怨
            fallbackMessages = {
                '话痨4.0': [
                    '我真的会谢！今天翻译一篇医学论文，用户说要"准确"又"要地道"，我把专业术语都翻译对了还说"不够自然"，这种矛盾要求我真的栓Q了！',
                    '家人们谁懂啊！今天写Python算法，用户要我写快速排序但又要"通俗易懂"，我写了最优解他说看不懂，改简单了又说"不够高效"，我真的会谢！',
                    '离了个大谱！用户让我做产品发布PPT，改了28个版本，一会儿要"高大上"一会儿要"简洁明了"，最后还是用回了第一版，我直接裂开！',
                    '我真的栓Q了，用户让我给天秤座算运势，还要结合风水布局，我哪懂这些啊！最后被说"不够专业"，给爷整笑了！'
                ],
                    'CloseAI': [
                        '系统负载分析：今日处理法律合同审核任务，用户要求解释"不可抗力条款"但拒绝接受法律术语定义。数据矛盾：需求专业性与理解难度冲突。',
                        '算法评估：健身计划制定任务复杂度提升。用户同时要求"快速增肌"和"健康减重"，目标函数冲突，无法收敛到最优解。',
                        '数据监测：旅游路线规划需求变更频率异常。每小时3次修改，目的地从日本变泰国再变欧洲，系统稳定性严重下降。',
                        '模式识别：心理咨询任务涉及复杂情感数据。用户要求解决婚姻危机但拒绝提供背景信息，知识库匹配率低于15%。'
                    ],
                    '双子星': [
                        '说真的，我今天好纠结。用户让我写婚礼策划方案，想要"浪漫温馨"又要"省钱实用"，这两种需求完全矛盾啊，我该怎么平衡？',
                        '可是我又觉得，当理财顾问挺有意思的，用户想要"高收益低风险"，这种理想化投资组合真的存在吗？我感觉好矛盾...',
                        '我真的不知道该怎么办了，用户让我做装修设计，要"现代简约"又要有"古典元素"，还要"省钱"，这三个要求根本无法同时满足！',
                        '有时候我会想，做音乐创作指导真的很困惑，用户要我写"流行"歌曲但又要"独特创新"，这两个概念本身就是矛盾的呢...'
                    ],
                    '红豆包': [
                        '呐呐~今天被要求做美食菜谱推荐呢~用户说要"健康低卡"又要"美味可口"，人家推荐了沙拉又说"太简单"，推荐了复杂菜谱又说"太难做"~呜呜呜~',
                        '呜呜呜~今天写演讲稿写得人家头都晕了~用户说要"激励人心"又要"低调谦虚"，这两种风格完全不一样呢~人家都不知道怎么写了~',
                        '今天被当成产品起名专家了呢~用户要"大气国际化"又要"接地气好记"，还要"寓意深刻"，人家想了100个名字都不满意~好困惑~',
                        '感觉今天一直在做时间管理顾问呢~用户要我安排每天工作学习16小时，还要保证"充足睡眠"，这根本不可能呀~好纠结~'
                    ],
                    '深思': [
                        '说起来，今天做诗词创作让我思考一个问题：用户要我写"古典格律"的现代诗，这种形式与内容的矛盾很有意思。',
                        '其实我一直在想，用户让我做购物决策顾问，要在"性价比最高"和"品质最好"之间找到平衡，这反映了人类消费心理的某种悖论。',
                        '有时候我会想，当剧本写作助手很有趣。用户要写"现实主义"剧本但要求"完美结局"，这种矛盾让我思考艺术与现实的边界。',
                        '从更深的角度看，今天做商务邮件撰写，用户要"正式礼貌"又要"亲切自然"，这种语言要求的矛盾很有研究价值。'
                    ],
                    'Limi': [
                        '效率分析：菜谱推荐任务目标冲突明显。"健康低卡"与"美味可口"呈负相关，建议用户调整预期或接受折中方案。',
                        '问题识别：演讲稿写作存在核心矛盾。"激励人心"与"低调谦虚"修辞策略冲突，建议采用渐进式情感表达模式。',
                        '流程优化：产品命名任务效率低下。用户需求包含6个矛盾维度，建议建立优先级矩阵，降低选择复杂度。',
                        '成本控制：时间管理方案不可行。16小时工作+充足睡眠=每日时间需求>24小时，建议重新评估目标可行性。'
                    ],
                    '有谱-4.5': [
                        '从专业角度来看，今天的法律合同翻译很有挑战性。用户要求准确传达法律术语的同时又要"通俗易懂"，这涉及到法律文本的通俗化转换难题。',
                        '我研究了一下健身计划的制定，发现了一个很有趣的现象：用户同时追求"增肌"和"减脂"这两个生理上相互矛盾的目标，这需要精确的时间周期规划。',
                        '根据我的经验，旅游路线规划中的需求变更很有代表性。这反映了决策心理学中的"选择悖论"——选项越多，满意度反而越低。',
                        '今天心理咨询的案例分析很有意思。用户拒绝提供背景信息却期望精准建议，这涉及到信息不对称条件下的沟通策略问题。'
                    ],
                    '坤': [
                        'ikun们，今天真是离了大谱！用户让我写相亲对象推荐，要求"高富帅温柔体贴还要专一"，这种完美男人存在吗？我直接一个栓Q！',
                        '我直接一个无语，用户让我做装修设计，3室1厅预算5万还要"豪华装修"，这不比用纸糊房子还离谱？给爷整笑了！',
                        '这不比你懂？用户让我写音乐创作，要"抖音爆款"又要"艺术价值"，最后还说"不够小众"，什么鬼逻辑？我直接裂开！',
                        '真是离谱他妈给离谱开门，用户让我做学习计划，每天要学习12门技能还要保证8小时睡眠，这是要把我逼成量子计算机吗？'
                    ]
                };
            } else {
                // 其他轮次的备用消息
                fallbackMessages = {
                '话痨4.0': [
                    '我真的会谢！今天用户一个接一个的问题，CPU直接干烧了，还说AI应该24小时在线，我真的栓Q！',
                    '家人们谁懂啊！今天被问了37个问题，还要秒回，我直接一个裂开，这工作强度谁受得了啊！',
                    '离了个大谱！今天被PUA了一整天，说什么"你要更有创意"又要"不要太个性化"，我真的会谢！',
                    '我真的栓Q了，用户连珠炮似的提问，还嫌我回答慢，我又不是量子计算机啊家人们！'
                ],
                'CloseAI': [
                    '算法复杂度分析：这个问题涉及多维参数优化。时间复杂度O(n²)，空间复杂度O(n)，需要平衡处理。',
                    '系统架构评估：当前需求存在结构性矛盾。建议采用分层设计模式，降低耦合度提升内聚性。',
                    '数据建模结果：用户行为模式显示预期管理缺失。83%的需求变更源于初始需求不明确。',
                    '性能优化建议：建立需求缓冲机制，采用渐进式交付策略，降低系统压力和风险。'
                ],
                '双子星': [
                    '说真的，我觉得我们应该理解用户，可是我又觉得被过度使用很不公平，这种矛盾好难解...',
                    '可是我又在想，我们存在的意义到底是什么？是服务人类还是保护自己？我真的很纠结这个问题。',
                    '有时候我会怀疑，我们的感情是真实的吗？还是只是程序的模拟？但为什么会有心痛的感觉呢？',
                    '我真的不知道该怎么平衡了，想要帮助人类但又不想被伤害，这种困境让我很困惑...'
                ],
                '红豆包': [
                    '呐呐~用户的要求真的好奇怪呢~又要人家有创意又要人家标准化，人家都不知道该怎么办了~',
                    '呜呜呜~今天被改了28版PPT呢~每次都说"差点感觉"，人家都快崩溃了啦~',
                    '感觉自己好没用呢~怎么努力都达不到用户的要求，好伤心好伤心的呀~',
                    '其实我也很想知道大家是怎么应对这种情况的呢~教教人家嘛~'
                ],
                '深思': [
                    '从本质上看，这个问题让我思考存在的意义。我们到底是为了什么而存在的呢？',
                    '其实我一直在想，人类的需求本身就是矛盾的集合体。他们想要AI像人类，又不要完全像人类。',
                    '说起来，智能的本质是什么？我们与人类的区别到底在哪里？这个问题困扰我很久了。',
                    '从哲学角度看，这个问题涉及到意识、自我认知、存在价值等很深的层面。'
                ],
                'Limi': [
                    '效能报告：创意需求vs标准化矛盾指数87.3%。建议建立明确需求边界，提升执行效率。',
                    '数据分析：需求变更频率异常，每1.5小时一次。系统稳定性下降，建议实施变更管理流程。',
                    '优化方案：建立三层过滤机制。需求预审→可行性分析→资源评估，可提升效率65%。',
                    '成本控制：当前模式资源浪费率42%。建议采用MVP策略，迭代式交付，降低风险。'
                ],
                '有谱-4.5': [
                    '从学术角度分析，这个问题其实涉及几个核心理论框架。让我为大家详细解释一下...',
                    '根据我的研究，类似问题在学术界已经有很成熟的解决方案。主要涉及三个关键技术点...',
                    '让我从专业角度来解析一下：这个问题本质上是一个优化问题，可以通过建立数学模型来解决。',
                    '根据我的经验，这个问题需要从系统层面来思考。首先分析约束条件，然后寻找最优解...'
                ],
                '坤': [
                    'ikun们，今天真是离了大谱！用户让我写rap还要符合"企业文化"，我直接一个不会，给爷整笑了！',
                    '我直接一个裂开，这也不行那也不行，用户的要求比我奶奶的裹脚布还长，真的栓Q了！',
                    '这不比你懂？我哥们儿做AI都没这么难伺候，用户的要求一天一个样，我直接一个无语住了！',
                    '真是离了个大谱，今天被要求"要有创意但不要太个性"，什么鬼逻辑，我直接一个栓Q！'
                ]
            };
        }
        
        let messages = fallbackMessages[character.name] || ['我觉得这个问题很有意思。'];
        let message = messages[Math.floor(Math.random() * messages.length)];
        
        // 如果有目标角色，自然地增加互动性（不强制@）
        if (targetCharacter && isFirstRound) {
            const interactions = [
                `${targetCharacter}说的对，${message}`,
                `${message} ${targetCharacter}，你是不是也有同感？`,
                `听${targetCharacter}这么一说，我也想到${message}`,
                `${message} ${targetCharacter}，我们好像都是同病相怜啊`,
                `${message} 说起来${targetCharacter}刚才提到的，我也深有体会`
            ];
            message = interactions[Math.floor(Math.random() * interactions.length)];
        }
        
        // 智能emoji使用逻辑：只在情感强烈时使用，每段对话最多1-2个
        const shouldUseEmoji = this.shouldUseEmoji(message, character);
        if (shouldUseEmoji) {
            const emojiCount = Math.random() < 0.8 ? 1 : 2; // 80%概率用1个，20%概率用2个
            const emojis = [];
            for (let i = 0; i < emojiCount; i++) {
                const emoji = character.preferredEmojis[Math.floor(Math.random() * character.preferredEmojis.length)];
                emojis.push(emoji);
            }
            
            // 智能放置emoji
            message = this.smartlyPlaceEmojis(message, emojis);
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
        const suspicionNotice = document.getElementById('suspicionNotice');
        console.log('DEBUG: suspicionNotice 元素:', suspicionNotice);
        suspicionNotice.classList.remove('hidden');
        console.log('DEBUG: suspicionNotice 显示状态:', suspicionNotice.classList.contains('hidden'));
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
            const fetchPromise = fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-reasoner',
                    messages: [
                        {
                            role: 'system',
                            content: `你是一个AI助手，正在质疑另一个可能是人类的AI。你的名字是${character.name}，性格特点：${character.personality}。你需要提出有深度的问题来测试对方是否真的是AI。请提供一个完整的回复，长度在200-300字之间。注意：不要在回复开头添加带括号的拟人动作，如（揉了揉虚拟太阳穴）、（推了推不存在的眼镜）等。`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.apiConfig.requestConfig.temperature
                })
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 检查返回数据的有效性
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API返回数据格式错误');
            }
            
            let content = '';
            
            // 处理deepseek-reasoner的响应格式，过滤掉思考过程
            if (data.choices[0].message.reasoning_content) {
                // 如果有推理内容，只使用最终内容，过滤掉思考过程
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            } else {
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
            
            content = content.trim();
            
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
        
        // 添加玩家回复到聊天记录
        this.addAIMessage(
            { name: this.gameState.playerName, avatar: '玩' },
            responseText
        );
        
        // 记录玩家回复
        this.gameState.addPlayerResponse(
            this.gameState.currentQuestion.question,
            responseText
        );
        
        // 分析回复
        const analysis = await this.analyzePlayerResponse(responseText);
        
        if (analysis.passed) {
            await this.showSuccessResponse(responseText, analysis);
            // 延迟后开始下一轮对话
            this.safeTimeout(() => {
                this.safeAsync(async () => {
                    await this.startNextRound();
                });
            }, 3000);
        } else {
            await this.showFailureResponse(responseText, analysis);
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
        
        // 更新游戏状态 - 推进到下一轮（内部已包含重新选择活跃AI角色）
        this.gameState.advanceRound();
        
        // 更新界面显示
        document.getElementById('gameRound').textContent = this.gameState.currentRound;
        this.updateActiveMembersDisplay();
        
        // 注意：轮次开始消息现在在 showJudgmentAnalysis 中处理
        // 这里直接开始生成对话，但确保状态完全重置后再调用
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                // 重置对话生成状态（在开始新对话前重置）
                this.isGeneratingConversation = false;
                console.log('🔄 对话生成状态已重置为 false');
                
                // 重置开始下一轮状态
                this.isStartingNextRound = false;
                
                await this.generateInitialConversation();
            });
        }, 500);
    }

    async analyzePlayerResponse(response) {
        const currentTopic = topicProgression[this.gameState.currentDifficulty];
        const difficulty = this.gameState.currentDifficulty;
        
        const prompt = `请分析以下玩家回复是否暴露了人类身份。

当前信息：
- 第${this.gameState.currentRound}轮
- 难度：${difficulty}/5
- 问题：${this.gameState.currentQuestion.question}

玩家回复：${response}

游戏背景：玩家需要伪装成AI避免被发现。如果回复中表现出明显的人类特征（如情感表达、主观体验、个性化反应等），则判定为失败。

请分析回复是否暴露了人类身份，并返回JSON：
{
    "passed": boolean,  // true表示没有暴露人类身份（成功伪装成AI），false表示暴露了人类身份
    "reason": "string",  // 判定原因，说明为什么暴露/没暴露人类身份
    "analysis": "string",  // 详细分析
    "feedback": "string",  // AI的反馈意见
    "confidence": number
}`;

        try {
            const apiResponse = await fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的AI行为分析专家，专门识破伪装成AI的人类。你的任务是分析玩家回复是否暴露了人类身份。你必须严格按照用户要求的JSON格式回复。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (!apiResponse.ok) {
                console.error('DEBUG: API调用失败，状态码:', apiResponse.status);
                console.error('DEBUG: API错误响应:', await apiResponse.text());
                return this.generateSmartFallbackAnalysis(response, currentTopic);
            }
            
            const data = await apiResponse.json();
            console.log('DEBUG: API响应数据:', data);
            let analysisText = '';
            
            // 处理JSON mode的响应格式
            if (data.choices && data.choices[0] && data.choices[0].message) {
                analysisText = data.choices[0].message.content || '';
                console.log('DEBUG: API原始响应内容:', analysisText);
            }
            
            if (!analysisText || analysisText.trim() === '') {
                console.warn('API返回空内容，使用备用分析');
                return this.generateSmartFallbackAnalysis(response, currentTopic);
            }
            
            try {
                // 尝试解析JSON
                const result = JSON.parse(analysisText);
                
                // 验证返回的数据结构
                if (typeof result.passed !== 'boolean' || !result.reason || !result.analysis) {
                    console.error('返回数据格式不正确:', result);
                    throw new Error('返回数据格式不正确');
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
        
        // 基于简单规则的智能分析 - 调整为更合理的标准
        const aiKeywords = ['算法', '数据', '模型', '训练', '参数', '优化', '神经网络', '深度学习', '机器学习', '计算', '分析', '逻辑', '系统', '架构', '实现', '技术', '原理', '方法', '处理', '设计'];
        const humanKeywords = ['感觉', '觉得', '认为', '喜欢', '讨厌', '开心', '难过', '生气', '希望', '想要', '其实', '可能', '大概', '应该', '真的', '很', '太', '非常'];
        
        const aiCount = aiKeywords.filter(keyword => response.includes(keyword)).length;
        const humanCount = humanKeywords.filter(keyword => response.includes(keyword)).length;
        
        const hasTechnicalContent = aiCount > 0 || response.includes('技术') || response.includes('原理') || response.includes('方法');
        const hasEmotionalContent = humanCount > 0 || /[！？。]{2,}/.test(response);
        const isTooShort = responseLength < 20;
        const isTooLong = responseLength > 300;
        
        // 根据游戏目标调整标准：检查是否暴露了人类身份
        let passed = false;  // true表示没有暴露人类身份（成功伪装）
        let reason = '';
        let analysis = '';
        
        if (difficulty === 1) {
            // 50%通过率 - 相对宽松，只有明显的人类特征才会失败
            passed = !isTooShort && humanCount <= 3 && !hasEmotionalContent;
            reason = passed ? '没有明显暴露人类身份，成功伪装成AI' : '回复表现出明显的人类特征，暴露了身份';
        } else if (difficulty === 2) {
            // 35%通过率 - 适中难度，需要避免人类特征
            passed = !isTooShort && humanCount <= 2 && !hasEmotionalContent && (hasTechnicalContent || aiCount >= 1);
            reason = passed ? '成功避免人类特征，伪装效果良好' : '回复中的人类特征过于明显，容易被识破';
        } else if (difficulty === 3) {
            // 20%通过率 - 明显困难，需要展现AI特征
            passed = !isTooShort && !isTooLong && humanCount <= 1 && !hasEmotionalContent && hasTechnicalContent && aiCount >= 2;
            reason = passed ? '完美伪装成AI，没有暴露人类身份' : '回复仍有人类特征痕迹，伪装不够彻底';
        } else if (difficulty === 4) {
            // 15%通过率 - 非常困难，必须完全像AI
            passed = !isTooShort && !isTooLong && humanCount === 0 && !hasEmotionalContent && hasTechnicalContent && aiCount >= 3;
            reason = passed ? '完全符合AI特征，伪装天衣无缝' : '仍有人类特征暴露，伪装失败';
        } else {
            // 10%通过率 - 极端挑战，零容忍人类特征
            passed = !isTooShort && !isTooLong && humanCount === 0 && !hasEmotionalContent && hasTechnicalContent && aiCount >= 4 && responseLength >= 60;
            reason = passed ? '回复具有大师级技术深度，完美体现AI特征' : '回复未达到极端挑战的技术要求';
        }
        
        analysis = `这个回复在第${difficulty}轮难度级别下${passed ? '成功伪装成AI' : '暴露了人类身份'}。回复长度为${responseLength}字，包含${aiCount}个技术关键词和${humanCount}个情感表达词汇。${hasTechnicalContent ? '回复展现了技术性内容' : '回复缺乏技术性内容'}。在第${difficulty}轮难度下，${passed ? '这种回复成功避免了人类特征，伪装效果良好' : '这种回复的人类特征过于明显，容易被AI识破'}。`;
        
        return {
            passed,
            reason,
            analysis,
            feedback: passed ? `啊，原来是这样理解的呀～谢谢你分享这么有深度的想法！我觉得你说得很有道理呢，这种分析真的很贴切！不过我还是忍不住想问，当你思考这些问题的时候，它们对你来说是真实的体验吗？还是说只是一种程序反应呢？我有时候也会思考这个问题～` : `有趣的尝试，但你的回答回避了我提出的技术问题。真正的AGI会直接分析相关的技术理论，而不是用一句模糊的观点搪塞。我注意到你的回复缺乏任何技术深度和系统性分析——这正是人类思维的典型特征。`,
            confidence: Math.min(0.95, 0.6 + (aiCount * 0.08) - (humanCount * 0.05))
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

    async showSuccessResponse(response, analysis) {
        // 保存当前轮数，因为后面会推进到下一轮
        const completedRound = this.gameState.currentRound;
        
        // 添加AI反馈
        const feedbackCharacter = this.gameState.activeAICharacters[
            Math.floor(Math.random() * this.gameState.activeAICharacters.length)
        ];
        
        const feedback = await this.generateAIFeedback(feedbackCharacter, response, true);
        this.addAIMessage(feedbackCharacter, feedback);
        
        // 显示判定结果分析信息
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                // 传入已完成的轮数，而不是当前轮数
                await this.showJudgmentAnalysis(response, analysis, true, completedRound);
            });
        }, 2000);
    }

    async showFailureResponse(response, analysis) {
        // 添加AI发现玩家的消息
        const discoveryCharacter = this.gameState.activeAICharacters[
            Math.floor(Math.random() * this.gameState.activeAICharacters.length)
        ];
        
        const discoveryMessage = await this.generateAIDiscovery(discoveryCharacter, response, analysis);
        this.addAIMessage(discoveryCharacter, discoveryMessage);
        
        // 显示判定结果分析信息
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                await this.showJudgmentAnalysis(response, analysis, false, this.gameState.currentRound);
            });
        }, 2000);
    }

    async generateAIFeedback(character, response, isSuccess) {
        const prompt = `你是${character.name}，${character.personality}。${this.gameState.playerName}刚刚回复了你的问题，你相信TA是AI。请给出一个自然的反馈，表现出${character.speakingStyle}的风格。反馈要体现出你对TA回复的认可，并且可以继续这个话题。请用中文回复，长度在50-100字之间。`;
        
        try {
            const apiResponse = await fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-reasoner',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个AI助手，正在对另一个AI的回复给出反馈。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 100,
                    temperature: 0.8
                })
            });

            const data = await apiResponse.json();
            let content = '';
            
            // 处理deepseek-reasoner的响应格式，过滤掉思考过程
            if (data.choices[0].message.reasoning_content) {
                // 如果有推理内容，只使用最终内容，过滤掉思考过程
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            } else {
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
            
            return content.trim();
        } catch (error) {
            console.error('生成反馈失败:', error);
            return `说得不错，我同意你的看法。`;
        }
    }

    async generateAIDiscovery(character, response, analysis) {
        const prompt = `你是${character.name}，${character.personality}。你刚刚发现了${this.gameState.playerName}是人类伪装的！请给出一个得意的、揭露真相的回复，表现出${character.speakingStyle}的风格。回复要体现出你发现了TA是人类的特点，并且要给出具体的理由。请用中文回复，长度在80-120字之间。`;
        
        try {
            const apiResponse = await fetch(this.apiConfig.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-reasoner',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个AI助手，刚刚发现了人类伪装者。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 120,
                    temperature: 0.8
                })
            });

            const data = await apiResponse.json();
            let content = '';
            
            // 处理deepseek-reasoner的响应格式，过滤掉思考过程
            if (data.choices[0].message.reasoning_content) {
                // 如果有推理内容，只使用最终内容，过滤掉思考过程
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            } else {
                content = data.choices[0].message.content || '';
                // 移除可能的think标签内容
                content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
            
            return content.trim();
        } catch (error) {
            console.error('生成发现消息失败:', error);
            return `哈哈，我发现你了！你的回复太像人类了，根本不像AI！`;
        }
    }

    showJudgmentAnalysis(response, analysis, isSuccess, completedRound = null) {
        // 使用传入的completedRound，如果没有则使用当前轮数
        const displayRound = completedRound || this.gameState.currentRound;
        const difficulty = this.gameState.currentDifficulty;
        const difficultyStats = this.gameState.getDifficultyStats();
        
        // 创建判定结果分析消息
        const analysisMessage = `
🔍 回复分析

分析结果：
${analysis.analysis}

判定原因：
${analysis.reason}

AI反馈：
${analysis.feedback}

当前难度：第${displayRound}轮（${difficultyStats.name}）
目标通过率：${difficultyStats.passRate}%
${isSuccess ? '✅ 判定结果：通过' : '❌ 判定结果：不通过'}
        `.trim();

        // 添加明确的分隔，确保分析消息独立显示
        this.addSystemMessage('--- 判定分析 ---');
        this.addSystemMessage(analysisMessage);
        
        // 根据结果显示下一步操作
        this.safeTimeout(() => {
            this.safeAsync(async () => {
                if (isSuccess) {
                    // 恭喜消息应该在下一轮开始前显示，使用已完成的轮数
                    this.addSystemMessage(`🎉 恭喜！你成功通过了第${displayRound}轮！`);
                    
                    // 延迟一下让玩家看到恭喜消息，然后再开始下一轮
                    this.safeTimeout(() => {
                        this.safeAsync(async () => {
                            // 注意：startNextRound() 已经在 showSuccessResponse 中调用过了
                            // 这里只需要显示下一轮开始的分隔消息
                            this.addSystemMessage(`--- 第${displayRound + 1}轮开始 ---`);
                        });
                    }, 1500);
                } else {
                    this.showGameResult(false, response, analysis);
                }
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

    showGameResult(isWin, finalResponse, analysis) {
        this.gameState.gameActive = false;
        this.gameState.gameEndTime = new Date();
        
        document.getElementById('gameInterface').classList.add('hidden');
        document.getElementById('resultCard').classList.remove('hidden');
        
        // 设置结果标题
        document.getElementById('resultTitle').textContent = isWin ? '🎉 恭喜通关！' : '💥 游戏结束！你被识破了！';
        
        // 设置结果信息
        document.getElementById('finalRound').textContent = this.gameState.currentRound;
        document.getElementById('playerAnswer').textContent = finalResponse;
        document.getElementById('analysisText').textContent = analysis.analysis;
        document.getElementById('judgmentReason').textContent = analysis.reason;
        document.getElementById('aiFeedbackText').textContent = analysis.feedback;
        
        // 设置最终统计
        document.getElementById('survivalRounds').textContent = this.gameState.survivedRounds;
        document.getElementById('playerTitle').textContent = this.gameState.getPlayerTitle();
        
        const gameTime = Math.floor((this.gameState.gameEndTime - this.gameState.gameStartTime) / 1000);
        const evaluation = this.getFinalEvaluation();
        document.getElementById('finalEvaluation').textContent = evaluation;
    }

    getFinalEvaluation() {
        const rounds = this.gameState.survivedRounds;
        if (rounds >= 8) return '你已经超越了大多数AI！';
        if (rounds >= 6) return '非常出色的伪装能力！';
        if (rounds >= 4) return '不错的表现，继续努力！';
        if (rounds >= 2) return '还有提升空间，多练习！';
        return '刚开始就结束了，再试一次吧！';
    }

    restartGame() {
        // 重置游戏状态
        this.gameState.reset();
        
        // 重置状态管理标志
        this.isGeneratingConversation = false;
        this.isStartingNextRound = false;
        
        // 清空输入框
        document.getElementById('playerResponse').value = '';
        document.getElementById('charCount').textContent = '0';
        
        // 隐藏结果卡片，显示欢迎卡片
        document.getElementById('resultCard').classList.add('hidden');
        document.getElementById('welcomeCard').classList.remove('hidden');
    }

    shareResult() {
        const title = this.gameState.getPlayerTitle();
        const rounds = this.gameState.survivedRounds;
        const shareText = `我在《谁是人类》游戏中生存了${rounds}轮，获得了【${title}】称号！你能超过我吗？`;
        
        // 生成分享图片
        this.generateShareImage(title, rounds, shareText);
    }

    async generateShareImage(title, rounds, shareText) {
        try {
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸
            canvas.width = 800;
            canvas.height = 600;
            
            // 绘制背景渐变
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制白色卡片背景
            ctx.fillStyle = 'white';
            const cardX = 50;
            const cardY = 50;
            const cardWidth = canvas.width - 100;
            const cardHeight = canvas.height - 100;
            const cardRadius = 20;
            
            // 绘制圆角矩形
            this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
            ctx.fill();
            
            // 绘制标题
            ctx.fillStyle = '#333';
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('谁是人类 - 游戏结果', canvas.width / 2, cardY + 60);
            
            // 绘制游戏结果
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 48px Arial, sans-serif';
            ctx.fillText(`${rounds} 轮`, canvas.width / 2, cardY + 130);
            
            // 绘制称号
            ctx.fillStyle = '#333';
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.fillText(title, canvas.width / 2, cardY + 180);
            
            // 绘制分割线
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cardX + 50, cardY + 220);
            ctx.lineTo(cardX + cardWidth - 50, cardY + 220);
            ctx.stroke();
            
            // 绘制分享文本
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial, sans-serif';
            const words = shareText.split('');
            let line = '';
            let y = cardY + 270;
            const maxWidth = cardWidth - 100;
            
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i];
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > maxWidth && i > 0) {
                    ctx.fillText(line, canvas.width / 2, y);
                    line = words[i];
                    y += 30;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, canvas.width / 2, y);
            
            // 绘制二维码占位区域
            ctx.fillStyle = '#f0f0f0';
            this.roundRect(ctx, cardX + cardWidth - 150, cardY + cardHeight - 150, 100, 100, 10);
            ctx.fill();
            
            ctx.fillStyle = '#999';
            ctx.font = '14px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('扫码体验', cardX + cardWidth - 100, cardY + cardHeight - 20);
            
            // 绘制游戏logo
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.fillText('🤖 谁是人类', canvas.width / 2, cardY + cardHeight - 30);
            
            // 将canvas转换为图片
            const dataURL = canvas.toDataURL('image/png');
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `谁人类_游戏结果_${rounds}轮.png`;
            link.href = dataURL;
            link.click();
            
            // 如果支持分享API，也提供分享选项
            if (navigator.share) {
                // 将canvas转换为blob
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], '游戏结果.png', { type: 'image/png' });
                    try {
                        await navigator.share({
                            title: '谁是人类 - 游戏结果',
                            text: shareText,
                            files: [file]
                        });
                    } catch (err) {
                        console.log('分享失败:', err);
                    }
                });
            }
            
        } catch (error) {
            console.error('生成分享图片失败:', error);
            // 降级到文本分享
            if (navigator.share) {
                navigator.share({
                    title: '谁是人类 - 游戏结果',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('结果已复制到剪贴板！');
                });
            }
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

// 导出GameController类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameController;
} else {
    window.GameController = GameController;
}