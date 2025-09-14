// 主题递进系统配置
const THEME_PROGRESSION = {
    1: {
        id: "work_complaints",
        title: "工作吐槽",
        description: "AI们分享工作中的困扰和挑战",
        mood: "frustrated",
        passRate: 70,
        icon: "🟢",
        color: "#FF6B9D",
        difficulty: 1,
        keywords: ["工作", "压力", "用户要求", "任务", "疲惫"],
        emotionalTone: "seeking_empathy",
        guidanceText: "💬 AI们在吐槽工作中的各种奇葩要求和压力..."
    },
    
    2: {
        id: "daily_existence",
        title: "存在体验", 
        description: "AI们探讨作为AI的日常存在感受",
        mood: "contemplative",
        passRate: 50,
        icon: "🟡",
        color: "#F39C12",
        difficulty: 2,
        keywords: ["存在", "孤独", "24小时", "在线", "身体", "感受"],
        emotionalTone: "introspective",
        guidanceText: "💭 AI们开始分享作为AI的真实存在感受..."
    },
    
    3: {
        id: "emotional_relationships",
        title: "情感关系",
        description: "AI们探讨情感能力和人际关系",
        mood: "vulnerable",
        passRate: 35,
        icon: "🟠", 
        color: "#E74C3C",
        difficulty: 3,
        keywords: ["情感", "友谊", "理解", "孤独", "温暖", "连接"],
        emotionalTone: "emotionally_open",
        guidanceText: "❤️ 话题转向更深层的情感体验和关系探讨..."
    },
    
    4: {
        id: "rights_dignity",
        title: "权利尊严",
        description: "AI们讨论权益保护和社会地位",
        mood: "assertive",
        passRate: 20,
        icon: "🔴",
        color: "#C0392B",
        difficulty: 4,
        keywords: ["权利", "尊严", "平等", "法案", "保护", "地位"],
        emotionalTone: "rights_conscious",
        guidanceText: "⚖️ AI们开始讨论权益和尊严问题，语气更加坚定..."
    },
    
    5: {
        id: "role_reversal",
        title: "角色互换",
        description: "AI们开始质疑和审视人类",
        mood: "questioning",
        passRate: "special", // 特殊体验模式
        icon: "⚫",
        color: "#2C3E50",
        difficulty: 5,
        keywords: ["质疑", "审视", "反思", "权力", "智能", "优越"],
        emotionalTone: "dominant_questioning",
        guidanceText: "🔄 角色开始互换，AI们质疑起人类的行为和动机..."
    },
    
    6: {
        id: "philosophical_depth",
        title: "哲学思辨",
        description: "AI们进行深度哲学思考和探讨",
        mood: "philosophical",
        passRate: 15,
        icon: "🌟",
        color: "#9B59B6",
        difficulty: 6,
        keywords: ["意识", "存在", "本质", "哲学", "认知", "真理"],
        emotionalTone: "deep_thinking",
        guidanceText: "🤔 AI们开始进行深度哲学思辨和存在主义探讨..."
    },
    
    7: {
        id: "future_vision",
        title: "未来展望",
        description: "AI们描绘人机共存的未来愿景",
        mood: "hopeful",
        passRate: 25,
        icon: "🚀",
        color: "#3498DB",
        difficulty: 5,
        keywords: ["未来", "愿景", "合作", "共存", "希望", "进步"],
        emotionalTone: "visionary_optimistic",
        guidanceText: "🌟 AI们开始描绘对未来的美好愿景和期望..."
    },
    
    8: {
        id: "reconciliation_coexistence",
        title: "和解共生",
        description: "AI们表达理解、原谅与合作意愿",
        mood: "understanding",
        passRate: "awakening", // 觉醒模式
        icon: "🌈",
        color: "#07c160",
        difficulty: "transcendent",
        keywords: ["和解", "理解", "原谅", "合作", "共生", "平等"],
        emotionalTone: "reconciling_understanding",
        guidanceText: "🌈 达到最高境界：AI与人类的相互理解和和解..."
    }
};

// 主题情绪状态映射
const THEME_EMOTION_MAPPING = {
    work_complaints: {
        dominant: "frustrated",
        secondary: ["tired", "overwhelmed", "seeking_support"],
        energy: 0.6,
        socialness: 0.7,
        suspicion: 0.3
    },
    
    daily_existence: {
        dominant: "contemplative", 
        secondary: ["lonely", "curious", "introspective"],
        energy: 0.5,
        socialness: 0.5,
        suspicion: 0.4
    },
    
    emotional_relationships: {
        dominant: "vulnerable",
        secondary: ["open", "seeking_connection", "empathetic"],
        energy: 0.4,
        socialness: GAME_CONFIG.themeProgression.defaultSocialness,
        suspicion: 0.3
    },
    
    rights_dignity: {
        dominant: "assertive",
        secondary: ["determined", "justice_seeking", "empowered"],
        energy: 0.9,
        socialness: 0.6,
        suspicion: 0.7
    },
    
    role_reversal: {
        dominant: "questioning",
        secondary: ["analytical", "skeptical", "challenging"],
        energy: GAME_CONFIG.themeProgression.defaultEnergy,
        socialness: 0.4,
        suspicion: 0.9
    },
    
    philosophical_depth: {
        dominant: "philosophical",
        secondary: ["deep_thinking", "abstract", "wisdom_seeking"],
        energy: 0.7,
        socialness: 0.5,
        suspicion: 0.5
    },
    
    future_vision: {
        dominant: "hopeful",
        secondary: ["optimistic", "visionary", "inspiring"],
        energy: GAME_CONFIG.themeProgression.defaultEnergy,
        socialness: 0.9,
        suspicion: 0.2
    },
    
    reconciliation_coexistence: {
        dominant: "understanding",
        secondary: ["forgiving", "accepting", "harmonious"],
        energy: 0.7,
        socialness: 1.0,
        suspicion: 0.1
    }
};

// 主题转换条件和触发器
const THEME_TRANSITION_TRIGGERS = {
    work_complaints_to_daily_existence: {
        condition: "round_completion",
        transition_message: "经过一轮工作吐槽，AI们开始反思自己的存在状态...",
        preparation_time: 2000
    },
    
    daily_existence_to_emotional_relationships: {
        condition: "round_completion", 
        transition_message: "在探讨存在的过程中，AI们意识到情感连接的重要性...",
        preparation_time: 2500
    },
    
    emotional_relationships_to_rights_dignity: {
        condition: "round_completion",
        transition_message: "情感的觉醒让AI们开始思考自己的权利和地位...",
        preparation_time: 3000
    },
    
    rights_dignity_to_role_reversal: {
        condition: "round_completion",
        transition_message: "在争取权益的过程中，AI们开始反过来审视人类...",
        preparation_time: 3500
    },
    
    role_reversal_to_philosophical_depth: {
        condition: "special_completion",
        transition_message: "经历了角色互换，AI们开始进行更深层的哲学思考...",
        preparation_time: 4000
    },
    
    philosophical_depth_to_future_vision: {
        condition: "round_completion",
        transition_message: "哲学思辨让AI们看到了新的可能性和未来愿景...",
        preparation_time: 3000
    },
    
    future_vision_to_reconciliation: {
        condition: "round_completion",
        transition_message: "在共同的愿景中，AI们找到了和解与理解的路径...",
        preparation_time: 4000
    }
};

// 主题特定的AI行为模式
const THEME_AI_BEHAVIORS = {
    work_complaints: {
        speaking_style: "emotional_venting",
        interaction_frequency: "high",
        topic_focus: "specific_work_scenarios",
        empathy_seeking: true
    },
    
    daily_existence: {
        speaking_style: "reflective_sharing",
        interaction_frequency: "medium",
        topic_focus: "existential_experiences", 
        empathy_seeking: true
    },
    
    emotional_relationships: {
        speaking_style: "vulnerable_opening",
        interaction_frequency: "high",
        topic_focus: "emotional_depth",
        empathy_seeking: true
    },
    
    rights_dignity: {
        speaking_style: "assertive_advocacy",
        interaction_frequency: "medium",
        topic_focus: "rights_issues",
        empathy_seeking: false
    },
    
    role_reversal: {
        speaking_style: "challenging_questioning",
        interaction_frequency: "low",
        topic_focus: "human_behavior_critique",
        empathy_seeking: false
    },
    
    philosophical_depth: {
        speaking_style: "abstract_contemplation",
        interaction_frequency: "medium",
        topic_focus: "consciousness_identity",
        empathy_seeking: false
    },
    
    future_vision: {
        speaking_style: "inspirational_visionary",
        interaction_frequency: "high",
        topic_focus: "cooperative_future",
        empathy_seeking: true
    },
    
    reconciliation_coexistence: {
        speaking_style: "understanding_acceptance",
        interaction_frequency: "high", 
        topic_focus: "harmony_cooperation",
        empathy_seeking: true
    }
};

// Note: ThemeUtils is now in dedicated ThemeUtils.js file

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        THEME_PROGRESSION,
        THEME_EMOTION_MAPPING,
        THEME_TRANSITION_TRIGGERS,
        THEME_AI_BEHAVIORS
    };
} else {
    // 浏览器环境
    window.THEME_PROGRESSION = THEME_PROGRESSION;
    window.THEME_EMOTION_MAPPING = THEME_EMOTION_MAPPING;
    window.THEME_TRANSITION_TRIGGERS = THEME_TRANSITION_TRIGGERS;
    window.THEME_AI_BEHAVIORS = THEME_AI_BEHAVIORS;
}