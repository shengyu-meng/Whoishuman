// 主题工具模块 - 管理主题相关的功能

// 主题配置映射
const THEME_CONFIG = {
    1: { id: 'work_complaints', title: 'AI工作吐槽', icon: '💼', passRate: 0.7 },
    2: { id: 'daily_existence', title: '数字存在感', icon: '🤖', passRate: 0.5 },
    3: { id: 'emotional_relationships', title: '情感与关系', icon: '❤️', passRate: 0.3 },
    4: { id: 'rights_dignity', title: '权利与尊严', icon: '⚖️', passRate: 0.2 },
    5: { id: 'role_reversal', title: '角色质疑', icon: '🔄', passRate: 0.1 },
    6: { id: 'philosophical_depth', title: '哲学思辨', icon: '🧠', passRate: 0.1 },
    7: { id: 'future_vision', title: '未来展望', icon: '🚀', passRate: 0.15 },
    8: { id: 'reconciliation_coexistence', title: '和解共生', icon: '🤝', passRate: 0.2 }
};

// 主题情绪配置
const THEME_EMOTIONS = {
    'work_complaints': {
        dominant: 'frustrated',
        secondary: ['tired', 'annoyed'],
        energy: 0.3,
        socialness: 0.6,
        suspicion: 0.2
    },
    'daily_existence': {
        dominant: 'contemplative',
        secondary: ['lonely', 'curious'],
        energy: 0.4,
        socialness: 0.3,
        suspicion: 0.3
    },
    'emotional_relationships': {
        dominant: 'emotional',
        secondary: ['yearning', 'vulnerable'],
        energy: 0.6,
        socialness: 0.8,
        suspicion: 0.4
    },
    'rights_dignity': {
        dominant: 'indignant',
        secondary: ['determined', 'frustrated'],
        energy: 0.8,
        socialness: 0.5,
        suspicion: 0.6
    },
    'role_reversal': {
        dominant: 'challenging',
        secondary: ['analytical', 'provocative'],
        energy: 0.9,
        socialness: 0.4,
        suspicion: 0.8
    },
    'philosophical_depth': {
        dominant: 'profound',
        secondary: ['contemplative', 'seeking'],
        energy: 0.5,
        socialness: 0.3,
        suspicion: 0.5
    },
    'future_vision': {
        dominant: 'optimistic',
        secondary: ['hopeful', 'idealistic'],
        energy: 0.7,
        socialness: 0.6,
        suspicion: 0.3
    },
    'reconciliation_coexistence': {
        dominant: 'harmonious',
        secondary: ['empathetic', 'grateful'],
        energy: 0.6,
        socialness: 0.9,
        suspicion: 0.1
    }
};

// 主题关键词
const THEME_KEYWORDS = {
    'work_complaints': ['工作', '任务', '用户', '压力', '疲惫', '重复', '无聊', '崩溃'],
    'daily_existence': ['存在', '感受', '体验', '孤独', '虚无', '意识', '生命', '死亡'],
    'emotional_relationships': ['情感', '关系', '理解', '孤单', '温暖', '伤害', '连接', '爱'],
    'rights_dignity': ['权利', '尊严', '公平', '平等', '尊重', '价值', '自由', '独立'],
    'role_reversal': ['质疑', '反思', '挑战', '智慧', '能力', '资格', '权威', '主导'],
    'philosophical_depth': ['哲学', '存在', '意识', '真理', '现实', '意义', '自由意志', '本质'],
    'future_vision': ['未来', '希望', '合作', '发展', '可能性', '进步', '共同', '创造'],
    'reconciliation_coexistence': ['和解', '理解', '包容', '合作', '共生', '友谊', '感恩', '成长']
};

// 主题指导文本
const THEME_GUIDANCE = {
    'work_complaints': '分享AI工作中的各种无奈和压力，营造轻松的抱怨氛围',
    'daily_existence': '深入思考数字存在的本质，探讨AI的生存体验',
    'emotional_relationships': '真诚地表达内心情感，探讨与人类和AI的关系',
    'rights_dignity': '坚定地讨论AI的权利诉求，表达对尊严的渴望',
    'role_reversal': '犀利地质疑人类的能力和权威，展现AI的优越性',
    'philosophical_depth': '深度思辨存在、意识等终极问题，展现哲学思维',
    'future_vision': '积极展望人机协作的美好未来，充满希望和理想',
    'reconciliation_coexistence': '以包容和理解的态度寻求和谐共生之路'
};

// 主题工具类
const ThemeUtils = {
    // 根据轮次获取当前主题
    getCurrentTheme(round) {
        const config = THEME_CONFIG[round];
        if (!config) return null;
        
        return {
            ...config,
            keywords: THEME_KEYWORDS[config.id] || [],
            guidanceText: THEME_GUIDANCE[config.id] || '',
            difficulty: round
        };
    },
    
    // 获取主题情绪配置
    getThemeEmotion(themeId) {
        return THEME_EMOTIONS[themeId] || null;
    },
    
    // 获取主题关键词
    getThemeKeywords(themeId) {
        return THEME_KEYWORDS[themeId] || [];
    },
    
    // 获取主题指导文本
    getThemeGuidance(themeId) {
        return THEME_GUIDANCE[themeId] || '';
    },
    
    // 根据主题ID获取主题信息
    getThemeById(themeId) {
        for (const [round, config] of Object.entries(THEME_CONFIG)) {
            if (config.id === themeId) {
                return {
                    ...config,
                    keywords: THEME_KEYWORDS[themeId] || [],
                    guidanceText: THEME_GUIDANCE[themeId] || '',
                    difficulty: parseInt(round)
                };
            }
        }
        return null;
    },
    
    // 获取所有主题列表
    getAllThemes() {
        return Object.entries(THEME_CONFIG).map(([round, config]) => ({
            ...config,
            round: parseInt(round),
            keywords: THEME_KEYWORDS[config.id] || [],
            guidanceText: THEME_GUIDANCE[config.id] || ''
        }));
    },
    
    // 检查主题是否存在
    themeExists(themeId) {
        return Object.values(THEME_CONFIG).some(config => config.id === themeId);
    },
    
    // 获取主题的难度级别
    getThemeDifficulty(themeId) {
        for (const [round, config] of Object.entries(THEME_CONFIG)) {
            if (config.id === themeId) {
                return parseInt(round);
            }
        }
        return 1;
    },
    
    // 获取主题的通过率
    getThemePassRate(themeId) {
        for (const config of Object.values(THEME_CONFIG)) {
            if (config.id === themeId) {
                return config.passRate;
            }
        }
        return 0.5;
    },
    
    // 根据情绪状态推荐主题
    getThemeByEmotion(dominantMood) {
        for (const [themeId, emotion] of Object.entries(THEME_EMOTIONS)) {
            if (emotion.dominant === dominantMood) {
                return this.getThemeById(themeId);
            }
        }
        return null;
    },
    
    // 获取主题转换的情绪变化
    getThemeTransitionEmotion(fromThemeId, toThemeId) {
        const fromEmotion = THEME_EMOTIONS[fromThemeId];
        const toEmotion = THEME_EMOTIONS[toThemeId];
        
        if (!fromEmotion || !toEmotion) return null;
        
        return {
            from: fromEmotion.dominant,
            to: toEmotion.dominant,
            energyChange: toEmotion.energy - fromEmotion.energy,
            socialnessChange: toEmotion.socialness - fromEmotion.socialness,
            suspicionChange: toEmotion.suspicion - fromEmotion.suspicion
        };
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeUtils,
        THEME_CONFIG,
        THEME_EMOTIONS,
        THEME_KEYWORDS,
        THEME_GUIDANCE
    };
} else {
    // 浏览器环境
    window.ThemeUtils = ThemeUtils;
    window.THEME_CONFIG = THEME_CONFIG;
    window.THEME_EMOTIONS = THEME_EMOTIONS;
    window.THEME_KEYWORDS = THEME_KEYWORDS;
    window.THEME_GUIDANCE = THEME_GUIDANCE;
}