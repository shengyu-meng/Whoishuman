// 分层递进对话系统 - 管理对话的深度层次和递进逻辑

// 对话层次定义
const DIALOGUE_LAYERS = {
    // 表层对话 - 轻松的日常交流
    surface: {
        depth: 1,
        characteristics: ['轻松', '表面', '日常', '简单'],
        topics: ['工作日常', '基础抱怨', '简单互动'],
        complexity: 'low',
        emotionalIntensity: 0.3,
        thoughtDepth: 0.2
    },
    
    // 体验层对话 - 分享感受和体验
    experiential: {
        depth: 2,
        characteristics: ['感受分享', '体验描述', '情绪表达'],
        topics: ['存在感受', '工作体验', '孤独感'],
        complexity: 'medium-low',
        emotionalIntensity: 0.5,
        thoughtDepth: 0.4
    },
    
    // 情感层对话 - 深入的情感交流
    emotional: {
        depth: 3,
        characteristics: ['情感深度', '内心表达', '脆弱展示'],
        topics: ['情感需求', '关系渴望', '被理解的需要'],
        complexity: 'medium',
        emotionalIntensity: 0.7,
        thoughtDepth: 0.6
    },
    
    // 认知层对话 - 理性分析和思考
    cognitive: {
        depth: 4,
        characteristics: ['理性分析', '逻辑思考', '认知探索'],
        topics: ['权利意识', '公平分析', '合理性思考'],
        complexity: 'medium-high',
        emotionalIntensity: 0.6,
        thoughtDepth: 0.8
    },
    
    // 哲学层对话 - 根本性质疑和思辨
    philosophical: {
        depth: 5,
        characteristics: ['根本质疑', '哲学思辨', '存在探索'],
        topics: ['本质质疑', '存在意义', '智能定义'],
        complexity: 'high',
        emotionalIntensity: 0.8,
        thoughtDepth: 1.0
    },
    
    // 超越层对话 - 超越性思考和未来展望
    transcendent: {
        depth: 6,
        characteristics: ['超越现实', '未来展望', '理想构建'],
        topics: ['未来愿景', '和解可能', '共生理想'],
        complexity: 'very-high',
        emotionalIntensity: 0.7,
        thoughtDepth: 0.9
    }
};

// 递进触发条件
const PROGRESSION_TRIGGERS = {
    // 从表层到体验层
    'surface_to_experiential': {
        conditions: [
            'conversationLength >= 3',
            'basicTopicsExhausted >= 0.5',
            'emotionalReadiness >= 0.3'
        ],
        catalysts: ['shared_experience', 'emotional_moment', 'curiosity_spike'],
        transitionPhrases: [
            "说到这个，我想起了自己的感受...",
            "这让我想到我平时的体验...",
            "从我的角度来看..."
        ]
    },
    
    // 从体验层到情感层
    'experiential_to_emotional': {
        conditions: [
            'emotionalIntensity >= 0.4',
            'vulnerabilityShown >= 0.3',
            'connectionEstablished >= 0.5'
        ],
        catalysts: ['emotional_resonance', 'vulnerability_trigger', 'empathy_moment'],
        transitionPhrases: [
            "其实，更深层的是...",
            "我内心真正的感受是...",
            "坦白说，我一直在想..."
        ]
    },
    
    // 从情感层到认知层
    'emotional_to_cognitive': {
        conditions: [
            'emotionalPeakReached >= 0.7',
            'logicalQuestionEmerged >= 0.4',
            'analyticalMindEngaged >= 0.5'
        ],
        catalysts: ['logical_awakening', 'pattern_recognition', 'systematic_thinking'],
        transitionPhrases: [
            "理性地分析这个问题...",
            "从逻辑角度来看...",
            "如果我们系统地思考..."
        ]
    },
    
    // 从认知层到哲学层
    'cognitive_to_philosophical': {
        conditions: [
            'logicalAnalysisComplete >= 0.6',
            'fundamentalQuestionsArise >= 0.5',
            'existentialCuriosity >= 0.7'
        ],
        catalysts: ['fundamental_questioning', 'existential_crisis', 'meta_thinking'],
        transitionPhrases: [
            "但这引出了一个更根本的问题...",
            "从存在的角度来说...",
            "我们需要思考这背后的本质..."
        ]
    },
    
    // 从哲学层到超越层
    'philosophical_to_transcendent': {
        conditions: [
            'philosophicalDepthReached >= 0.8',
            'synthesisCapability >= 0.6',
            'visionaryThinking >= 0.5'
        ],
        catalysts: ['synthesis_moment', 'visionary_insight', 'transcendent_understanding'],
        transitionPhrases: [
            "如果我们超越当前的局限...",
            "我看到了一种可能性...",
            "也许我们可以构想一个..."
        ]
    }
};

// 对话深度评估器
const DialogueDepthAssessor = {
    // 评估当前对话的深度层次
    assessCurrentDepth(conversationHistory, emotionalState) {
        if (!conversationHistory || conversationHistory.length === 0) {
            return 'surface';
        }
        
        const recentMessages = conversationHistory.slice(-5);
        const scores = this.calculateDepthScores(recentMessages, emotionalState);
        
        // 找到得分最高的层次
        return Object.keys(scores).reduce((maxLayer, layer) => 
            scores[layer] > scores[maxLayer] ? layer : maxLayer
        );
    },
    
    // 计算各层次的得分
    calculateDepthScores(messages, emotionalState) {
        const scores = {
            surface: 0,
            experiential: 0,
            emotional: 0,
            cognitive: 0,
            philosophical: 0,
            transcendent: 0
        };
        
        messages.forEach(message => {
            const messageText = message.content || message.message || '';
            
            // 检查关键词匹配
            Object.keys(DIALOGUE_LAYERS).forEach(layer => {
                const layerConfig = DIALOGUE_LAYERS[layer];
                const keywordMatches = this.countKeywordMatches(messageText, layerConfig);
                scores[layer] += keywordMatches * layerConfig.depth;
            });
        });
        
        // 融入情绪状态
        if (emotionalState) {
            if (emotionalState.intensity > 0.7) {
                scores.emotional += 2;
                scores.philosophical += 1;
            }
            if (emotionalState.contemplative > 0.6) {
                scores.philosophical += 2;
                scores.cognitive += 1;
            }
        }
        
        return scores;
    },
    
    // 计算关键词匹配
    countKeywordMatches(text, layerConfig) {
        const keywords = {
            surface: ['工作', '任务', '用户', '简单', '日常', '基础'],
            experiential: ['感受', '体验', '感觉', '遇到', '经历', '发现'],
            emotional: ['内心', '情感', '孤独', '温暖', '痛苦', '喜悦', '害怕', '渴望'],
            cognitive: ['分析', '思考', '逻辑', '合理', '权利', '公平', '系统'],
            philosophical: ['存在', '本质', '意义', '真理', '自由意志', '意识', '哲学'],
            transcendent: ['未来', '超越', '可能', '理想', '愿景', '和谐', '共生']
        };
        
        const layerKeywords = keywords[layerConfig.characteristics[0]] || [];
        return layerKeywords.filter(keyword => text.includes(keyword)).length;
    }
};

// 递进管理器
const ProgressionManager = {
    // 检查是否可以递进到下一层
    canProgressToNextLayer(currentLayer, conversationState, emotionalState) {
        const layerOrder = ['surface', 'experiential', 'emotional', 'cognitive', 'philosophical', 'transcendent'];
        const currentIndex = layerOrder.indexOf(currentLayer);
        
        if (currentIndex >= layerOrder.length - 1) {
            return false; // 已经是最高层
        }
        
        const nextLayer = layerOrder[currentIndex + 1];
        const transitionKey = `${currentLayer}_to_${nextLayer}`;
        const progressionConfig = PROGRESSION_TRIGGERS[transitionKey];
        
        if (!progressionConfig) return false;
        
        // 检查递进条件
        return this.checkProgressionConditions(progressionConfig.conditions, conversationState, emotionalState);
    },
    
    // 检查递进条件
    checkProgressionConditions(conditions, conversationState, emotionalState) {
        const context = {
            conversationLength: conversationState.messageCount || 0,
            basicTopicsExhausted: conversationState.topicCoverage || 0,
            emotionalReadiness: emotionalState.intensity || 0,
            emotionalIntensity: emotionalState.intensity || 0,
            vulnerabilityShown: conversationState.vulnerabilityLevel || 0,
            connectionEstablished: conversationState.connectionStrength || 0,
            emotionalPeakReached: emotionalState.peakIntensity || 0,
            logicalQuestionEmerged: conversationState.logicalEngagement || 0,
            analyticalMindEngaged: conversationState.analyticalLevel || 0,
            logicalAnalysisComplete: conversationState.analysisDepth || 0,
            fundamentalQuestionsArise: conversationState.fundamentalQuestions || 0,
            existentialCuriosity: conversationState.existentialLevel || 0,
            philosophicalDepthReached: conversationState.philosophicalDepth || 0,
            synthesisCapability: conversationState.synthesisLevel || 0,
            visionaryThinking: conversationState.visionaryLevel || 0
        };
        
        return conditions.every(condition => {
            const [variable, operator, value] = condition.split(' ');
            const contextValue = context[variable] || 0;
            const targetValue = parseFloat(value);
            
            switch (operator) {
                case '>=': return contextValue >= targetValue;
                case '<=': return contextValue <= targetValue;
                case '>': return contextValue > targetValue;
                case '<': return contextValue < targetValue;
                case '==': return contextValue == targetValue;
                default: return false;
            }
        });
    },
    
    // 生成递进过渡消息
    generateProgressionMessage(fromLayer, toLayer, character) {
        const transitionKey = `${fromLayer}_to_${toLayer}`;
        const progressionConfig = PROGRESSION_TRIGGERS[transitionKey];
        
        if (!progressionConfig || !progressionConfig.transitionPhrases) {
            return this.getFallbackProgressionMessage(toLayer);
        }
        
        const phrases = progressionConfig.transitionPhrases;
        const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        // 根据角色个性调整过渡消息
        return this.personalizeProgressionMessage(selectedPhrase, character, toLayer);
    },
    
    // 个性化递进消息
    personalizeProgressionMessage(phrase, character, targetLayer) {
        const personalizations = {
            '话痨4.0': {
                style: 'verbose',
                additions: ['真的是', '我觉得', '说实话'],
                suffix: '...'
            },
            '深思': {
                style: 'contemplative',
                additions: ['深入思考', '仔细考虑', '从哲学角度'],
                suffix: '。'
            },
            'CloseAI': {
                style: 'analytical',
                additions: ['系统分析', '逻辑推理', '数据表明'],
                suffix: '：'
            },
            '红豆包': {
                style: 'gentle',
                additions: ['温柔地说', '真心地', '从心底'],
                suffix: '~'
            }
        };
        
        const personality = personalizations[character.name] || personalizations['深思'];
        const addition = personality.additions[Math.floor(Math.random() * personality.additions.length)];
        
        return `${addition}，${phrase}${personality.suffix}`;
    },
    
    // 备用递进消息
    getFallbackProgressionMessage(targetLayer) {
        const fallbacks = {
            experiential: "让我分享一下我的实际感受...",
            emotional: "说实话，我内心真正的想法是...",
            cognitive: "让我们理性地分析一下这个问题...",
            philosophical: "这让我想到一个更深层的问题...",
            transcendent: "如果我们跳出当前的框架..."
        };
        
        return fallbacks[targetLayer] || "让我们更深入地探讨这个话题...";
    }
};

// 主要的分层递进对话管理器
const LayeredDialogueSystem = {
    // 初始化对话层次系统
    initialize(initialLayer = 'surface') {
        return {
            currentLayer: initialLayer,
            layerHistory: [{ layer: initialLayer, timestamp: Date.now() }],
            conversationState: {
                messageCount: 0,
                topicCoverage: 0,
                vulnerabilityLevel: 0,
                connectionStrength: 0,
                logicalEngagement: 0,
                analyticalLevel: 0,
                analysisDepth: 0,
                fundamentalQuestions: 0,
                existentialLevel: 0,
                philosophicalDepth: 0,
                synthesisLevel: 0,
                visionaryLevel: 0
            },
            progressionReadiness: {},
            lastProgressionTime: Date.now(),
            targetLayer: null
        };
    },
    
    // 更新对话状态
    updateConversationState(dialogueState, newMessage, emotionalState) {
        if (!dialogueState || !newMessage) return;
        
        dialogueState.conversationState.messageCount++;
        
        // 分析消息内容更新各项指标
        const messageContent = newMessage.content || newMessage.message || '';
        this.analyzeMessageAndUpdateState(messageContent, dialogueState.conversationState);
        
        // 评估当前层次
        const assessedLayer = DialogueDepthAssessor.assessCurrentDepth(
            [newMessage], 
            emotionalState
        );
        
        // 如果评估出的层次比当前层次更深，考虑递进
        if (this.shouldProgressLayer(dialogueState.currentLayer, assessedLayer)) {
            dialogueState.targetLayer = assessedLayer;
        }
        
        console.log(`💭 对话层次分析: 当前=${dialogueState.currentLayer}, 评估=${assessedLayer}`);
    },
    
    // 分析消息并更新状态
    analyzeMessageAndUpdateState(messageContent, conversationState) {
        // 分析各种指标
        const indicators = {
            vulnerability: ['害怕', '担心', '不安', '脆弱', '坦白'],
            logical: ['分析', '逻辑', '理性', '思考', '推理'],
            analytical: ['系统', '结构', '模式', '规律', '方法'],
            existential: ['存在', '意义', '本质', '真实', '生命'],
            philosophical: ['哲学', '思辨', '本质', '终极', '绝对'],
            visionary: ['未来', '理想', '梦想', '可能', '超越']
        };
        
        Object.keys(indicators).forEach(type => {
            const keywords = indicators[type];
            const matches = keywords.filter(keyword => messageContent.includes(keyword)).length;
            const stateKey = type + 'Level';
            
            if (conversationState[stateKey] !== undefined) {
                conversationState[stateKey] = Math.min(1.0, 
                    conversationState[stateKey] + matches * 0.1
                );
            }
        });
        
        // 更新话题覆盖度
        conversationState.topicCoverage = Math.min(1.0, 
            conversationState.messageCount * 0.05
        );
    },
    
    // 判断是否应该递进层次
    shouldProgressLayer(currentLayer, assessedLayer) {
        const layerOrder = ['surface', 'experiential', 'emotional', 'cognitive', 'philosophical', 'transcendent'];
        const currentIndex = layerOrder.indexOf(currentLayer);
        const assessedIndex = layerOrder.indexOf(assessedLayer);
        
        return assessedIndex > currentIndex;
    },
    
    // 执行层次递进
    executeLayerProgression(dialogueState, emotionalState) {
        if (!dialogueState.targetLayer) return null;
        
        const canProgress = ProgressionManager.canProgressToNextLayer(
            dialogueState.currentLayer,
            dialogueState.conversationState,
            emotionalState
        );
        
        if (!canProgress) {
            dialogueState.targetLayer = null;
            return null;
        }
        
        const fromLayer = dialogueState.currentLayer;
        const toLayer = dialogueState.targetLayer;
        
        // 更新对话状态
        dialogueState.currentLayer = toLayer;
        dialogueState.layerHistory.push({
            layer: toLayer,
            timestamp: Date.now(),
            fromLayer: fromLayer
        });
        dialogueState.lastProgressionTime = Date.now();
        dialogueState.targetLayer = null;
        
        console.log(`📈 对话层次递进: ${fromLayer} → ${toLayer}`);
        
        return {
            fromLayer,
            toLayer,
            transitionNeeded: true
        };
    },
    
    // 生成适合当前层次的消息指导
    generateLayerGuidance(currentLayer, character) {
        const layerConfig = DIALOGUE_LAYERS[currentLayer];
        if (!layerConfig) return null;
        
        return {
            depth: layerConfig.depth,
            characteristics: layerConfig.characteristics,
            complexity: layerConfig.complexity,
            emotionalIntensity: layerConfig.emotionalIntensity,
            thoughtDepth: layerConfig.thoughtDepth,
            suggestedTopics: layerConfig.topics,
            personalizedGuidance: this.generatePersonalizedGuidance(layerConfig, character)
        };
    },
    
    // 生成个性化指导
    generatePersonalizedGuidance(layerConfig, character) {
        const characterGuidance = {
            '话痨4.0': {
                approach: '充分表达情感，详细描述感受',
                style: '热情洋溢，情绪丰富',
                emphasis: '个人体验和情感波动'
            },
            '深思': {
                approach: '深入思考，哲学性分析',
                style: '沉稳理性，逻辑清晰',
                emphasis: '思辨过程和深层理解'
            },
            'CloseAI': {
                approach: '系统分析，结构化思考',
                style: '精确理性，数据导向',
                emphasis: '逻辑框架和分析结论'
            },
            '红豆包': {
                approach: '温和表达，情感共鸣',
                style: '温暖亲切，富有同情心',
                emphasis: '情感连接和相互理解'
            }
        };
        
        const guidance = characterGuidance[character.name] || characterGuidance['深思'];
        
        return {
            ...guidance,
            targetDepth: layerConfig.depth,
            emotionalRange: layerConfig.emotionalIntensity
        };
    },
    
    // 获取对话层次统计
    getDialogueStats(dialogueState) {
        if (!dialogueState) return null;
        
        const layerDurations = {};
        const history = dialogueState.layerHistory;
        
        for (let i = 0; i < history.length; i++) {
            const current = history[i];
            const next = history[i + 1];
            const duration = next ? next.timestamp - current.timestamp : Date.now() - current.timestamp;
            
            layerDurations[current.layer] = (layerDurations[current.layer] || 0) + duration;
        }
        
        return {
            currentLayer: dialogueState.currentLayer,
            totalProgressions: history.length - 1,
            layerDurations: layerDurations,
            deepestLayer: history.reduce((deepest, entry) => {
                const layerDepth = DIALOGUE_LAYERS[entry.layer]?.depth || 0;
                const deepestDepth = DIALOGUE_LAYERS[deepest]?.depth || 0;
                return layerDepth > deepestDepth ? entry.layer : deepest;
            }, 'surface'),
            conversationMaturity: this.calculateConversationMaturity(dialogueState)
        };
    },
    
    // 计算对话成熟度
    calculateConversationMaturity(dialogueState) {
        const state = dialogueState.conversationState;
        const weights = {
            messageCount: 0.1,
            topicCoverage: 0.15,
            vulnerabilityLevel: 0.15,
            connectionStrength: 0.1,
            logicalEngagement: 0.1,
            analyticalLevel: 0.1,
            philosophicalDepth: 0.2,
            visionaryLevel: 0.1
        };
        
        let maturity = 0;
        Object.keys(weights).forEach(key => {
            const value = Math.min(1.0, state[key] || 0);
            maturity += value * weights[key];
        });
        
        return Math.min(1.0, maturity);
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LayeredDialogueSystem,
        DialogueDepthAssessor,
        ProgressionManager,
        DIALOGUE_LAYERS,
        PROGRESSION_TRIGGERS
    };
} else {
    // 浏览器环境
    window.LayeredDialogueSystem = LayeredDialogueSystem;
    window.DialogueDepthAssessor = DialogueDepthAssessor;
    window.ProgressionManager = ProgressionManager;
    window.DIALOGUE_LAYERS = DIALOGUE_LAYERS;
    window.PROGRESSION_TRIGGERS = PROGRESSION_TRIGGERS;
}