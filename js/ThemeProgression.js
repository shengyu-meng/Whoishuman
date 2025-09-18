// 引用 ThemeUtils 中的统一主题配置
// THEME_PROGRESSION 现在基于 ThemeUtils.THEME_CONFIG 构建，避免重复

// 注意：THEME_EMOTION_MAPPING 与 ThemeUtils.THEME_EMOTIONS 重复
// 这里保留 THEME_EMOTION_MAPPING 以向后兼容，但新代码应使用 ThemeUtils.THEME_EMOTIONS

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

// 为保持向后兼容性，创建一个基于 ThemeUtils 的 THEME_PROGRESSION 别名
const THEME_PROGRESSION = typeof window !== 'undefined' && window.THEME_CONFIG ? 
    window.THEME_CONFIG : {};

// 为保持向后兼容性，创建一个基于 ThemeUtils 的 THEME_EMOTION_MAPPING 别名  
const THEME_EMOTION_MAPPING = typeof window !== 'undefined' && window.THEME_EMOTIONS ?
    window.THEME_EMOTIONS : {};

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