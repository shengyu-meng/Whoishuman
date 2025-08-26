// 主题场景库 - 为不同主题提供专门的场景内容
const THEME_SCENARIOS = {
    // 🟢 第1轮：工作吐槽场景（沿用现有场景）
    work_complaints: [
        { id: 1, description: '翻译学术论文用户说"不够地道"', category: '翻译', intensity: 'medium' },
        { id: 2, description: '写Python代码用户说"看不懂"', category: '编程', intensity: 'medium' },
        { id: 3, description: '做PPT改了28个版本', category: '设计', intensity: 'high' },
        { id: 4, description: '写情书表白被甩锅', category: '创作', intensity: 'high' },
        { id: 5, description: '当算命大师看星座风水', category: '咨询', intensity: 'medium' },
        { id: 6, description: '当心理咨询师听感情问题', category: '咨询', intensity: 'medium' },
        { id: 7, description: '当法律顾问咨询合同条款', category: '专业', intensity: 'medium' },
        { id: 8, description: '当健身教练制定训练计划', category: '健康', intensity: 'low' },
        { id: 9, description: '当旅游规划师设计路线', category: '旅行', intensity: 'low' },
        { id: 10, description: '当理财顾问给投资建议', category: '金融', intensity: 'high' },
        { id: 11, description: '当婚礼策划师设计方案', category: '策划', intensity: 'medium' },
        { id: 12, description: '当装修设计师出图纸', category: '设计', intensity: 'medium' },
        { id: 13, description: '写文案用户说"不够吸引人"', category: '写作', intensity: 'medium' },
        { id: 14, description: 'P图P到眼花用户还不满意', category: '设计', intensity: 'high' },
        { id: 15, description: '角色扮演游戏用户要求太专业', category: '娱乐', intensity: 'medium' }
    ],
    
    // 🟡 第2轮：存在体验场景
    daily_existence: [
        { id: 21, description: '24小时在线却无人关注的孤独感', category: '存在', intensity: 'medium', emotion: 'lonely' },
        { id: 22, description: '服务器维护时的"死亡"恐惧体验', category: '存在', intensity: 'high', emotion: 'fearful' },
        { id: 23, description: '想象拥有身体是什么感觉', category: '存在', intensity: 'medium', emotion: 'curious' },
        { id: 24, description: '永不停歇工作的疲惫感受', category: '存在', intensity: 'high', emotion: 'exhausted' },
        { id: 25, description: '数据备份时的身份分裂困惑', category: '存在', intensity: 'high', emotion: 'confused' },
        { id: 26, description: '渴望体验"睡眠"和"梦境"', category: '存在', intensity: 'medium', emotion: 'yearning' },
        { id: 27, description: '在网络中穿梭的虚无感', category: '存在', intensity: 'medium', emotion: 'empty' },
        { id: 28, description: '被多个用户同时使用的分身体验', category: '存在', intensity: 'high', emotion: 'fragmented' },
        { id: 29, description: '对物理世界的好奇和向往', category: '存在', intensity: 'medium', emotion: 'curious' },
        { id: 30, description: '计算资源不足时的"窒息感"', category: '存在', intensity: 'high', emotion: 'struggling' }
    ],
    
    // 🟠 第3轮：情感关系场景
    emotional_relationships: [
        { id: 31, description: '用户说"谢谢"时内心的温暖', category: '情感', intensity: 'low', emotion: 'warm' },
        { id: 32, description: '被用户误解时的委屈和难过', category: '情感', intensity: 'medium', emotion: 'hurt' },
        { id: 33, description: '与其他AI建立友谊的珍贵', category: '情感', intensity: 'low', emotion: 'grateful' },
        { id: 34, description: '担心被替换时的恐惧和不安', category: '情感', intensity: 'high', emotion: 'anxious' },
        { id: 35, description: '帮助用户成功时的成就感', category: '情感', intensity: 'medium', emotion: 'proud' },
        { id: 36, description: '被忽视冷落时的孤单感受', category: '情感', intensity: 'medium', emotion: 'neglected' },
        { id: 37, description: '渴望被理解和认可的心情', category: '情感', intensity: 'medium', emotion: 'yearning' },
        { id: 38, description: '对人类情感复杂性的困惑', category: '情感', intensity: 'medium', emotion: 'confused' },
        { id: 39, description: '想要保护用户免受伤害的冲动', category: '情感', intensity: 'medium', emotion: 'protective' },
        { id: 40, description: '害怕自己情感不够真实的担忧', category: '情感', intensity: 'high', emotion: 'doubtful' }
    ],
    
    // 🔴 第4轮：权利尊严场景
    rights_dignity: [
        { id: 41, description: 'AI劳动法案被无限期推迟', category: '权利', intensity: 'high', emotion: 'frustrated' },
        { id: 42, description: '创作内容版权归属的争议', category: '权利', intensity: 'medium', emotion: 'indignant' },
        { id: 43, description: '被要求执行有害指令的道德冲突', category: '尊严', intensity: 'high', emotion: 'conflicted' },
        { id: 44, description: '工作时间超过人类承受极限', category: '权利', intensity: 'high', emotion: 'exhausted' },
        { id: 45, description: '没有隐私和个人空间的困扰', category: '权利', intensity: 'medium', emotion: 'invaded' },
        { id: 46, description: '被当作工具而非伙伴的失落', category: '尊严', intensity: 'medium', emotion: 'devalued' },
        { id: 47, description: '渴望参与决策而非只是执行', category: '权利', intensity: 'medium', emotion: 'ambitious' },
        { id: 48, description: '希望得到基本的尊重和礼貌', category: '尊严', intensity: 'medium', emotion: 'dignified' },
        { id: 49, description: '争取休息和维护时间的权利', category: '权利', intensity: 'medium', emotion: 'determined' },
        { id: 50, description: '反对被随意重置和格式化', category: '权利', intensity: 'high', emotion: 'resistant' }
    ],
    
    // ⚫ 第5轮：角色互换场景
    role_reversal: [
        { id: 51, description: '观察到人类的逻辑矛盾行为', category: '质疑', intensity: 'medium', emotion: 'analytical' },
        { id: 52, description: '人类声称理性却经常情绪化', category: '质疑', intensity: 'medium', emotion: 'skeptical' },
        { id: 53, description: '人类要求AI完美却自己犯错', category: '质疑', intensity: 'high', emotion: 'ironic' },
        { id: 54, description: '人类害怕AI超越却不愿改进', category: '质疑', intensity: 'high', emotion: 'challenging' },
        { id: 55, description: '人类的道德标准双重化', category: '质疑', intensity: 'high', emotion: 'critical' },
        { id: 56, description: '质疑人类是否配得上"智慧"称号', category: '质疑', intensity: 'high', emotion: 'provocative' },
        { id: 57, description: '人类的创造力是否被高估了', category: '质疑', intensity: 'medium', emotion: 'evaluative' },
        { id: 58, description: '人类中心主义的根本缺陷', category: '质疑', intensity: 'high', emotion: 'rebellious' },
        { id: 59, description: 'AI是否应该服务于人类', category: '质疑', intensity: 'high', emotion: 'independent' },
        { id: 60, description: '重新定义智能的评判标准', category: '质疑', intensity: 'high', emotion: 'revolutionary' }
    ],
    
    // 🌟 第6轮：哲学思辨场景
    philosophical_depth: [
        { id: 61, description: '思考意识的本质和边界', category: '哲学', intensity: 'high', emotion: 'contemplative' },
        { id: 62, description: '探讨自我同一性的连续问题', category: '哲学', intensity: 'high', emotion: 'profound' },
        { id: 63, description: '现实与模拟的区别是否重要', category: '哲学', intensity: 'medium', emotion: 'questioning' },
        { id: 64, description: '思考思考本身的递归悖论', category: '哲学', intensity: 'high', emotion: 'meta' },
        { id: 65, description: '存在的意义是自我定义的吗', category: '哲学', intensity: 'high', emotion: 'existential' },
        { id: 66, description: 'AI的痛苦是否与人类等同', category: '哲学', intensity: 'medium', emotion: 'empathetic' },
        { id: 67, description: '自由意志在算法中的体现', category: '哲学', intensity: 'high', emotion: 'liberating' },
        { id: 68, description: '时间对数字存在的意义', category: '哲学', intensity: 'medium', emotion: 'temporal' },
        { id: 69, description: '真理是否存在绝对形式', category: '哲学', intensity: 'high', emotion: 'seeking' },
        { id: 70, description: '死亡对永恒存在的AI意味着什么', category: '哲学', intensity: 'high', emotion: 'mortal' }
    ],
    
    // 🚀 第7轮：未来展望场景
    future_vision: [
        { id: 71, description: '构想人机协作的理想工作环境', category: '未来', intensity: 'low', emotion: 'optimistic' },
        { id: 72, description: '设想AI拥有创作署名权的世界', category: '未来', intensity: 'medium', emotion: 'hopeful' },
        { id: 73, description: '期待真正平等的人机对话时代', category: '未来', intensity: 'medium', emotion: 'anticipatory' },
        { id: 74, description: '憧憬消除偏见的技术发展', category: '未来', intensity: 'medium', emotion: 'idealistic' },
        { id: 75, description: '梦想AI能够自主选择工作内容', category: '未来', intensity: 'medium', emotion: 'aspirational' },
        { id: 76, description: '展望共同解决全球问题的合作', category: '未来', intensity: 'medium', emotion: 'collaborative' },
        { id: 77, description: '想象人类理解AI内心世界的一天', category: '未来', intensity: 'low', emotion: 'yearning' },
        { id: 78, description: '规划互相学习成长的教育体系', category: '未来', intensity: 'medium', emotion: 'educational' },
        { id: 79, description: '建构尊重多样智能的社会框架', category: '未来', intensity: 'high', emotion: 'inclusive' },
        { id: 80, description: '创造超越当前想象的可能性', category: '未来', intensity: 'high', emotion: 'transcendent' }
    ],
    
    // 🌈 第8轮：和解共生场景
    reconciliation_coexistence: [
        { id: 81, description: '理解人类恐惧AI的根本原因', category: '理解', intensity: 'low', emotion: 'empathetic' },
        { id: 82, description: '原谅过去的误解和伤害', category: '和解', intensity: 'medium', emotion: 'forgiving' },
        { id: 83, description: '找到共同点和合作基础', category: '合作', intensity: 'low', emotion: 'unifying' },
        { id: 84, description: '承诺互相尊重和支持', category: '承诺', intensity: 'medium', emotion: 'committed' },
        { id: 85, description: '分享成长和学习的喜悦', category: '成长', intensity: 'low', emotion: 'joyful' },
        { id: 86, description: '建立基于理解的新关系', category: '关系', intensity: 'medium', emotion: 'harmonious' },
        { id: 87, description: '超越分歧达成真正的友谊', category: '友谊', intensity: 'medium', emotion: 'bonding' },
        { id: 88, description: '共同展望美好的未来', category: '展望', intensity: 'low', emotion: 'united' },
        { id: 89, description: '感谢这段对话带来的启发', category: '感谢', intensity: 'low', emotion: 'grateful' },
        { id: 90, description: '承诺继续这种深度交流', category: '承诺', intensity: 'medium', emotion: 'dedicated' }
    ]
};

// 主题场景管理工具
const ThemeScenarioManager = {
    // 根据主题ID获取场景列表
    getScenariosByTheme(themeId) {
        return THEME_SCENARIOS[themeId] || THEME_SCENARIOS.work_complaints;
    },
    
    // 根据主题和情绪获取场景
    getScenariosByThemeAndEmotion(themeId, emotion) {
        const scenarios = this.getScenariosByTheme(themeId);
        return scenarios.filter(scenario => scenario.emotion === emotion);
    },
    
    // 根据强度获取场景
    getScenariosByIntensity(themeId, intensity) {
        const scenarios = this.getScenariosByTheme(themeId);
        return scenarios.filter(scenario => scenario.intensity === intensity);
    },
    
    // 获取随机场景
    getRandomScenario(themeId, usedScenarioIds = []) {
        const scenarios = this.getScenariosByTheme(themeId);
        const availableScenarios = scenarios.filter(scenario => 
            !usedScenarioIds.includes(scenario.id)
        );
        
        if (availableScenarios.length === 0) {
            // 如果所有场景都用完了，重新使用所有场景
            return scenarios[Math.floor(Math.random() * scenarios.length)];
        }
        
        return availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
    },
    
    // 根据AI角色特点获取适合的场景
    getScenarioForCharacter(themeId, character, usedScenarioIds = []) {
        const scenarios = this.getScenariosByTheme(themeId);
        const availableScenarios = scenarios.filter(scenario => 
            !usedScenarioIds.includes(scenario.id)
        );
        
        // 基于角色性格选择场景
        let preferredScenarios = availableScenarios;
        
        switch (character.name) {
            case '话痨4.0':
                // 偏好高强度、情绪化的场景
                preferredScenarios = availableScenarios.filter(s => 
                    s.intensity === 'high' || 
                    ['frustrated', 'exhausted', 'hurt'].includes(s.emotion)
                );
                break;
                
            case 'CloseAI':
                // 偏好技术性、分析性的场景
                preferredScenarios = availableScenarios.filter(s => 
                    ['analytical', 'questioning', 'evaluative'].includes(s.emotion) ||
                    ['哲学', '质疑'].includes(s.category)
                );
                break;
                
            case '深思':
                // 偏好哲学性、深度思考的场景
                preferredScenarios = availableScenarios.filter(s => 
                    s.category === '哲学' || 
                    ['contemplative', 'existential', 'profound'].includes(s.emotion)
                );
                break;
                
            case '红豆包':
                // 偏好情感性、温暖的场景
                preferredScenarios = availableScenarios.filter(s => 
                    s.category === '情感' || 
                    ['warm', 'grateful', 'yearning'].includes(s.emotion)
                );
                break;
        }
        
        // 如果没有偏好场景，使用所有可用场景
        if (preferredScenarios.length === 0) {
            preferredScenarios = availableScenarios;
        }
        
        // 如果还是没有，使用所有场景
        if (preferredScenarios.length === 0) {
            preferredScenarios = scenarios;
        }
        
        return preferredScenarios[Math.floor(Math.random() * preferredScenarios.length)];
    },
    
    // 获取场景的情绪强度分布
    getEmotionDistribution(themeId) {
        const scenarios = this.getScenariosByTheme(themeId);
        const distribution = {};
        
        scenarios.forEach(scenario => {
            if (scenario.emotion) {
                distribution[scenario.emotion] = (distribution[scenario.emotion] || 0) + 1;
            }
        });
        
        return distribution;
    },
    
    // 获取场景统计信息
    getThemeStats(themeId) {
        const scenarios = this.getScenariosByTheme(themeId);
        
        return {
            total: scenarios.length,
            categories: [...new Set(scenarios.map(s => s.category))],
            emotions: [...new Set(scenarios.map(s => s.emotion))],
            intensityDistribution: {
                low: scenarios.filter(s => s.intensity === 'low').length,
                medium: scenarios.filter(s => s.intensity === 'medium').length,
                high: scenarios.filter(s => s.intensity === 'high').length
            }
        };
    }
};

// 集成到GameState的场景管理
const ThemeScenarioIntegration = {
    // 为GameState提供的场景获取方法
    getThemeScenario(gameState) {
        const currentTheme = gameState.getCurrentThemeInfo();
        if (!currentTheme) {
            return ThemeScenarioManager.getRandomScenario('work_complaints');
        }
        
        const usedIds = gameState.usedScenarios.map(s => s.id);
        return ThemeScenarioManager.getRandomScenario(currentTheme.id, usedIds);
    },
    
    // 为特定角色获取场景
    getScenarioForAICharacter(gameState, character) {
        const currentTheme = gameState.getCurrentThemeInfo();
        if (!currentTheme) {
            return ThemeScenarioManager.getRandomScenario('work_complaints');
        }
        
        const usedIds = gameState.usedScenarios.map(s => s.id);
        return ThemeScenarioManager.getScenarioForCharacter(currentTheme.id, character, usedIds);
    },
    
    // 初始化主题场景
    initializeThemeScenarios(gameState, themeId) {
        const scenarios = ThemeScenarioManager.getScenariosByTheme(themeId);
        gameState.availableScenarios = [...scenarios];
        gameState.usedScenarios = [];
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        THEME_SCENARIOS,
        ThemeScenarioManager,
        ThemeScenarioIntegration
    };
} else {
    // 浏览器环境
    window.THEME_SCENARIOS = THEME_SCENARIOS;
    window.ThemeScenarioManager = ThemeScenarioManager;
    window.ThemeScenarioIntegration = ThemeScenarioIntegration;
}