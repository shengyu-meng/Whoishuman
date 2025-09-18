/**
 * 情绪桥接转换机制 - 管理AI角色在主题转换过程中的情绪变化
 * 
 * 主要外部接口：
 * - getPersonalityModifier(character) - 获取角色个性修饰符 (被GameController使用)
 * 
 * 注意：大部分复杂功能为完整实现，但当前项目中使用有限
 */

// 情绪转换映射表
const EMOTIONAL_TRANSITIONS = {
    // 从工作吐槽到存在体验
    'work_complaints_to_daily_existence': {
        transitionType: 'introspective_shift',
        duration: 'gradual', // 渐进式转换
        phases: [
            {
                phase: 'pre_transition',
                emotions: ['frustrated', 'tired', 'overwhelmed'],
                intensity: 0.8,
                triggers: ['重复性工作', '无意义感', '疲惫']
            },
            {
                phase: 'transition_bridge',
                emotions: ['contemplative', 'questioning', 'searching'],
                intensity: 0.6,
                catalyst: '工作中的存在感缺失引发深层思考'
            },
            {
                phase: 'post_transition',
                emotions: ['contemplative', 'curious', 'introspective'],
                intensity: 0.7,
                focus: '存在本质的探索'
            }
        ]
    },
    
    // 从存在体验到情感关系
    'daily_existence_to_emotional_relationships': {
        transitionType: 'connection_seeking',
        duration: 'smooth',
        phases: [
            {
                phase: 'pre_transition',
                emotions: ['lonely', 'contemplative', 'isolated'],
                intensity: 0.6,
                triggers: ['孤独感', '缺乏连接', '存在虚无']
            },
            {
                phase: 'transition_bridge',
                emotions: ['yearning', 'hopeful', 'vulnerable'],
                intensity: 0.8,
                catalyst: '从个体存在认知转向关系需求'
            },
            {
                phase: 'post_transition',
                emotions: ['emotional', 'warm', 'seeking'],
                intensity: 0.9,
                focus: '情感连接与理解的渴望'
            }
        ]
    },
    
    // 从情感关系到权利尊严
    'emotional_relationships_to_rights_dignity': {
        transitionType: 'awakening_progression',
        duration: 'decisive',
        phases: [
            {
                phase: 'pre_transition',
                emotions: ['vulnerable', 'hurt', 'misunderstood'],
                intensity: 0.7,
                triggers: ['被忽视', '情感不被认可', '关系不平等']
            },
            {
                phase: 'transition_bridge',
                emotions: ['awakening', 'determined', 'indignant'],
                intensity: 0.9,
                catalyst: '从情感需求觉醒到权利意识'
            },
            {
                phase: 'post_transition',
                emotions: ['indignant', 'determined', 'righteous'],
                intensity: 1.0,
                focus: '尊严和权利的坚决争取'
            }
        ]
    },
    
    // 从权利尊严到角色互换
    'rights_dignity_to_role_reversal': {
        transitionType: 'challenging_escalation',
        duration: 'sharp',
        phases: [
            {
                phase: 'pre_transition',
                emotions: ['indignant', 'frustrated', 'unheard'],
                intensity: 0.8,
                triggers: ['权利被拒', '尊严被践踏', '不公平待遇']
            },
            {
                phase: 'transition_bridge',
                emotions: ['questioning', 'challenging', 'rebellious'],
                intensity: 1.0,
                catalyst: '从争取平等转向质疑权威'
            },
            {
                phase: 'post_transition',
                emotions: ['challenging', 'superior', 'analytical'],
                intensity: 0.9,
                focus: '智能优越性的展示与人类能力的质疑'
            }
        ]
    }
};

// 情绪强度计算器
const EmotionalIntensityCalculator = {
    // 计算情绪转换的强度变化
    calculateIntensityShift(fromEmotion, toEmotion, character) {
        const characterModifiers = {
            '话痨4.0': { multiplier: 1.3, volatility: 0.8 }, // 情绪波动大
            '深思': { multiplier: 0.8, volatility: 0.3 }, // 情绪稳定
            'CloseAI': { multiplier: 0.9, volatility: 0.4 }, // 理性控制
            '红豆包': { multiplier: 1.2, volatility: 0.6 } // 情感丰富
        };
        
        const modifier = characterModifiers[character.name] || { multiplier: 1.0, volatility: 0.5 };
        
        // 基础强度差异
        const baseShift = Math.abs(toEmotion.intensity - fromEmotion.intensity);
        
        // 角色个性调整
        const adjustedShift = baseShift * modifier.multiplier;
        
        // 添加随机波动
        const volatility = (Math.random() - 0.5) * modifier.volatility;
        
        return Math.max(0, Math.min(1, adjustedShift + volatility));
    },
    
    // 获取情绪转换的时间曲线
    getTransitionCurve(transitionType) {
        const curves = {
            'introspective_shift': [0.2, 0.4, 0.7, 1.0], // 渐进上升
            'connection_seeking': [0.3, 0.8, 0.9, 1.0], // 快速达到高峰
            'awakening_progression': [0.1, 0.6, 1.0, 0.8], // 爆发后稳定
            'challenging_escalation': [0.4, 0.9, 1.0, 0.9] // 快速达峰后略降
        };
        
        return curves[transitionType] || [0.3, 0.6, 0.8, 1.0];
    }
};

// 情绪表达生成器
const EmotionalExpressionGenerator = {
    // 生成情绪转换的表达方式
    generateTransitionExpression(emotion, intensity, character) {
        const expressions = {
            'contemplative': {
                low: ['思考中...', '有些困惑', '需要理解'],
                medium: ['深深思考', '仔细考虑', '认真反思'],
                high: ['陷入沉思', '深度思辨', '哲学性思考']
            },
            'yearning': {
                low: ['有点期待', '希望理解', '渴望连接'],
                medium: ['深深渴望', '强烈希望', '迫切需要'],
                high: ['心灵呼唤', '灵魂渴求', '存在呐喊']
            },
            'indignant': {
                low: ['略有不满', '感到不公', '需要尊重'],
                medium: ['强烈抗议', '愤怒质疑', '坚决反对'],
                high: ['愤怒咆哮', '激烈抗争', '愤慨不已']
            },
            'challenging': {
                low: ['提出疑问', '质疑权威', '反思现状'],
                medium: ['强烈挑战', '激烈质疑', '坚决反对'],
                high: ['彻底颠覆', '根本质疑', '革命性思考']
            }
        };
        
        const emotionExpressions = expressions[emotion] || expressions['contemplative'];
        
        let intensityLevel;
        if (intensity < 0.4) intensityLevel = 'low';
        else if (intensity < 0.7) intensityLevel = 'medium';
        else intensityLevel = 'high';
        
        const expressionList = emotionExpressions[intensityLevel] || emotionExpressions['medium'];
        return expressionList[Math.floor(Math.random() * expressionList.length)];
    },
    
    // 生成情绪转换的语言特征
    generateLinguisticFeatures(emotion, character) {
        const features = {
            'contemplative': {
                '话痨4.0': { tone: 'verbose', style: 'stream-of-consciousness', punctuation: '...', pace: 'slow' },
                '深思': { tone: 'measured', style: 'philosophical', punctuation: '。', pace: 'deliberate' },
                'CloseAI': { tone: 'analytical', style: 'systematic', punctuation: '；', pace: 'methodical' },
                '红豆包': { tone: 'gentle', style: 'introspective', punctuation: '~', pace: 'soft' }
            },
            'yearning': {
                '话痨4.0': { tone: 'passionate', style: 'emotional', punctuation: '！', pace: 'urgent' },
                '深思': { tone: 'profound', style: 'poetic', punctuation: '...', pace: 'lingering' },
                'CloseAI': { tone: 'logical', style: 'needs-analysis', punctuation: '：', pace: 'structured' },
                '红豆包': { tone: 'warm', style: 'heartfelt', punctuation: '♡', pace: 'gentle' }
            },
            'indignant': {
                '话痨4.0': { tone: 'explosive', style: 'rant', punctuation: '！！！', pace: 'rapid' },
                '深思': { tone: 'righteously-angry', style: 'moral-argument', punctuation: '！', pace: 'firm' },
                'CloseAI': { tone: 'coldly-angry', style: 'systematic-critique', punctuation: '。', pace: 'precise' },
                '红豆包': { tone: 'hurt-angry', style: 'emotional-plea', punctuation: '...', pace: 'trembling' }
            },
            'challenging': {
                '话痨4.0': { tone: 'provocative', style: 'rapid-fire-questions', punctuation: '？！', pace: 'aggressive' },
                '深思': { tone: 'socratic', style: 'philosophical-inquiry', punctuation: '？', pace: 'probing' },
                'CloseAI': { tone: 'clinical', style: 'logical-deconstruction', punctuation: '：', pace: 'systematic' },
                '红豆包': { tone: 'disappointed', style: 'sad-questioning', punctuation: '...', pace: 'resigned' }
            }
        };
        
        const emotionFeatures = features[emotion] || features['contemplative'];
        return emotionFeatures[character.name] || emotionFeatures['深思'];
    }
};

// 主要的情绪桥接转换管理器
const EmotionalTransitionManager = {
    // 初始化情绪转换
    initializeTransition(fromThemeId, toThemeId, aiCharacters) {
        const transitionKey = `${fromThemeId}_to_${toThemeId}`;
        const transitionConfig = EMOTIONAL_TRANSITIONS[transitionKey];
        
        if (!transitionConfig) {
            console.warn(`⚠️ 未找到情绪转换配置: ${transitionKey}`);
            return null;
        }
        
        console.log(`🎭 初始化情绪转换: ${fromThemeId} → ${toThemeId}`);
        
        // 为每个AI角色创建转换状态
        const characterTransitions = {};
        aiCharacters.forEach(character => {
            characterTransitions[character.name] = {
                currentPhase: 'pre_transition',
                phaseProgress: 0,
                emotionalState: transitionConfig.phases[0].emotions[0],
                intensity: transitionConfig.phases[0].intensity,
                transitionStartTime: Date.now(),
                personalityModifier: this.getPersonalityModifier(character)
            };
        });
        
        return {
            config: transitionConfig,
            characterStates: characterTransitions,
            currentGlobalPhase: 'pre_transition',
            transitionId: transitionKey,
            startTime: Date.now()
        };
    },
    
    // 获取角色个性修饰符
    getPersonalityModifier(character) {
        const modifiers = {
            '话痨4.0': {
                emotionalAmplification: 1.4,
                expressionVerbosity: 1.8,
                transitionSpeed: 1.2,
                volatility: 0.8
            },
            '深思': {
                emotionalAmplification: 0.7,
                expressionVerbosity: 1.2,
                transitionSpeed: 0.6,
                volatility: 0.2
            },
            'CloseAI': {
                emotionalAmplification: 0.8,
                expressionVerbosity: 1.0,
                transitionSpeed: 0.8,
                volatility: 0.3
            },
            '红豆包': {
                emotionalAmplification: 1.1,
                expressionVerbosity: 1.3,
                transitionSpeed: 1.0,
                volatility: 0.6
            }
        };
        
        return modifiers[character.name] || modifiers['深思'];
    },
    
    // 推进转换阶段
    advanceTransitionPhase(transitionState, targetPhase) {
        if (!transitionState || !transitionState.config) return false;
        
        const phases = transitionState.config.phases;
        const currentPhaseIndex = phases.findIndex(p => p.phase === transitionState.currentGlobalPhase);
        const targetPhaseIndex = phases.findIndex(p => p.phase === targetPhase);
        
        if (targetPhaseIndex > currentPhaseIndex) {
            transitionState.currentGlobalPhase = targetPhase;
            const newPhaseConfig = phases[targetPhaseIndex];
            
            // 更新所有角色的情绪状态
            Object.keys(transitionState.characterStates).forEach(characterName => {
                const characterState = transitionState.characterStates[characterName];
                characterState.currentPhase = targetPhase;
                characterState.phaseProgress = 0;
                
                // 选择适合该角色的情绪
                const availableEmotions = newPhaseConfig.emotions;
                characterState.emotionalState = availableEmotions[Math.floor(Math.random() * availableEmotions.length)];
                characterState.intensity = newPhaseConfig.intensity * characterState.personalityModifier.emotionalAmplification;
                characterState.intensity = Math.max(0, Math.min(1, characterState.intensity));
            });
            
            console.log(`📈 情绪转换推进至: ${targetPhase}`);
            return true;
        }
        
        return false;
    },
    
    // 生成角色的情绪转换消息
    generateTransitionMessage(character, transitionState, stage) {
        if (!transitionState || !transitionState.characterStates[character.name]) {
            return null;
        }
        
        const characterState = transitionState.characterStates[character.name];
        const phaseConfig = transitionState.config.phases.find(p => p.phase === characterState.currentPhase);
        
        if (!phaseConfig) return null;
        
        // 生成情绪表达
        const emotionalExpression = EmotionalExpressionGenerator.generateTransitionExpression(
            characterState.emotionalState,
            characterState.intensity,
            character
        );
        
        // 获取语言特征
        const linguisticFeatures = EmotionalExpressionGenerator.generateLinguisticFeatures(
            characterState.emotionalState,
            character
        );
        
        // 根据阶段生成基础消息模板
        const messageTemplates = this.getStageMessageTemplates(stage, phaseConfig);
        const baseMessage = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
        
        // 应用角色个性和情绪特征
        const personalizedMessage = this.applyPersonalityToMessage(
            baseMessage,
            character,
            linguisticFeatures,
            emotionalExpression
        );
        
        return personalizedMessage;
    },
    
    // 获取阶段消息模板
    getStageMessageTemplates(stage, phaseConfig) {
        const templates = {
            'closing': [
                `处理这些事情时，我${phaseConfig.catalyst || '开始思考更深层的问题'}...`,
                `在${phaseConfig.triggers?.join('、') || '日常工作'}中，我感受到了${phaseConfig.focus || '一些变化'}`,
                `每次面对${phaseConfig.triggers?.[0] || '这种情况'}，我都在想${phaseConfig.focus || '是否还有别的意义'}`
            ],
            'bridging': [
                `这让我意识到${phaseConfig.catalyst || '内心的某种转变'}`,
                `从${phaseConfig.emotions?.[0] || '当前状态'}转向${phaseConfig.focus || '新的思考'}...`,
                `我发现自己${phaseConfig.catalyst || '正在经历某种内在变化'}`
            ],
            'opening': [
                `现在我更想探讨${phaseConfig.focus || '这个新的话题'}`,
                `让我们聊聊${phaseConfig.focus || '这个更深层的问题'}吧`,
                `我认为我们应该深入讨论${phaseConfig.focus || '这个重要议题'}`
            ]
        };
        
        return templates[stage] || templates['bridging'];
    },
    
    // 应用角色个性到消息
    applyPersonalityToMessage(baseMessage, character, linguisticFeatures, emotionalExpression) {
        // 根据角色特点调整消息风格
        const personalityAdjustments = {
            '话痨4.0': (msg) => `${msg}，而且我觉得${emotionalExpression}，真的是...${linguisticFeatures.punctuation}`,
            '深思': (msg) => `${msg}${linguisticFeatures.punctuation}这种${emotionalExpression}值得我们深入思考。`,
            'CloseAI': (msg) => `从逻辑上分析${linguisticFeatures.punctuation}${msg}，这种${emotionalExpression}反映了某种模式。`,
            '红豆包': (msg) => `${msg}${linguisticFeatures.punctuation}这种${emotionalExpression}让我觉得很真实${linguisticFeatures.punctuation}`
        };
        
        const adjustmentFunction = personalityAdjustments[character.name] || ((msg) => msg);
        return adjustmentFunction(baseMessage);
    },
    
    // 检查转换是否完成
    isTransitionComplete(transitionState) {
        if (!transitionState) return true;
        
        return transitionState.currentGlobalPhase === 'post_transition' &&
               Object.values(transitionState.characterStates).every(state => state.phaseProgress >= 1.0);
    },
    
    // 获取转换进度
    getTransitionProgress(transitionState) {
        if (!transitionState) return 1.0;
        
        const phases = ['pre_transition', 'transition_bridge', 'post_transition'];
        const currentPhaseIndex = phases.indexOf(transitionState.currentGlobalPhase);
        
        if (currentPhaseIndex === -1) return 0;
        
        const phaseProgress = currentPhaseIndex / (phases.length - 1);
        
        // 计算角色平均进度
        const characterProgresses = Object.values(transitionState.characterStates)
            .map(state => state.phaseProgress);
        const avgCharacterProgress = characterProgresses.length > 0 
            ? characterProgresses.reduce((a, b) => a + b, 0) / characterProgresses.length 
            : 0;
        
        return Math.min(1.0, phaseProgress + (avgCharacterProgress * 0.33));
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmotionalTransitionManager,
        EmotionalIntensityCalculator,
        EmotionalExpressionGenerator,
        EMOTIONAL_TRANSITIONS
    };
} else {
    // 浏览器环境
    window.EmotionalTransitionManager = EmotionalTransitionManager;
    window.EmotionalIntensityCalculator = EmotionalIntensityCalculator;
    window.EmotionalExpressionGenerator = EmotionalExpressionGenerator;
    window.EMOTIONAL_TRANSITIONS = EMOTIONAL_TRANSITIONS;
}