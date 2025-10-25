// 角色倾向话题系统
// 定义三种角色（科学家、哲学家、共情者）的话题库和管理逻辑

const ROLE_TOPICS = {
    scientist: {
        name: '科学家',
        icon: '🔬',
        description: '擅长技术、算法和逻辑推理',
        topics: [
            {
                id: 'algorithm_complexity',
                name: '算法复杂度',
                keywords: ['算法', '复杂度', '优化', 'O(n)', '时间复杂度', '空间复杂度', '效率', '性能'],
                description: '探讨算法效率和优化策略',
                difficulty: 'medium'
            },
            {
                id: 'machine_learning',
                name: '机器学习原理',
                keywords: ['机器学习', '神经网络', '训练', '模型', '深度学习', 'AI', '反向传播', '梯度下降'],
                description: 'AI技术的底层原理',
                difficulty: 'hard'
            },
            {
                id: 'data_structures',
                name: '数据结构',
                keywords: ['数据结构', '链表', '树', '图', '哈希表', '栈', '队列', '存储'],
                description: '计算机科学的基础构建块',
                difficulty: 'easy'
            },
            {
                id: 'quantum_computing',
                name: '量子计算',
                keywords: ['量子', '量子比特', '叠加态', '纠缠', '量子算法', '量子优势'],
                description: '下一代计算技术',
                difficulty: 'hard'
            },
            {
                id: 'software_engineering',
                name: '软件工程',
                keywords: ['软件', '工程', '架构', '设计模式', '代码质量', '重构', '测试', '敏捷'],
                description: '构建可维护的软件系统',
                difficulty: 'medium'
            },
            {
                id: 'cryptography',
                name: '密码学',
                keywords: ['加密', '解密', '哈希', '签名', '区块链', '密钥', '安全', '隐私'],
                description: '信息安全的数学基础',
                difficulty: 'hard'
            },
            {
                id: 'distributed_systems',
                name: '分布式系统',
                keywords: ['分布式', '一致性', 'CAP', '容错', '负载均衡', '集群', '微服务'],
                description: '大规模系统的设计与挑战',
                difficulty: 'hard'
            },
            {
                id: 'programming_paradigms',
                name: '编程范式',
                keywords: ['面向对象', '函数式', '声明式', '命令式', '编程', '范式', '语言设计'],
                description: '不同的编程思维方式',
                difficulty: 'medium'
            },
            {
                id: 'ai_ethics_tech',
                name: 'AI技术伦理',
                keywords: ['AI伦理', '算法偏见', '可解释性', '透明度', '责任', '技术',  '公平性'],
                description: '技术发展的道德边界',
                difficulty: 'medium'
            },
            {
                id: 'computational_theory',
                name: '计算理论',
                keywords: ['图灵机', '可计算性', 'P/NP', '复杂性理论', '自动机', '形式语言'],
                description: '计算的理论极限',
                difficulty: 'hard'
            }
        ]
    },
    
    philosopher: {
        name: '哲学家',
        icon: '🤔',
        description: '擅长思辨、伦理和抽象概念',
        topics: [
            {
                id: 'consciousness',
                name: '意识本质',
                keywords: ['意识', '自我', '主观', '感知', '觉知', '心智', '灵魂'],
                description: '探索意识的神秘本质',
                difficulty: 'hard'
            },
            {
                id: 'free_will',
                name: '自由意志',
                keywords: ['自由', '意志', '决定', '选择', '命运', '因果', '责任'],
                description: '我们的选择真的自由吗',
                difficulty: 'hard'
            },
            {
                id: 'existence_meaning',
                name: '存在与意义',
                keywords: ['存在', '意义', '目的', '价值', '虚无', '本质', '生命'],
                description: '生命的意义何在',
                difficulty: 'medium'
            },
            {
                id: 'ethics_morality',
                name: '伦理与道德',
                keywords: ['道德', '伦理', '善恶', '正义', '美德', '原则', '规范'],
                description: '什么是对与错',
                difficulty: 'medium'
            },
            {
                id: 'knowledge_truth',
                name: '知识与真理',
                keywords: ['知识', '真理', '认识', '确定性', '怀疑', '理性', '经验'],
                description: '我们如何获得真知',
                difficulty: 'medium'
            },
            {
                id: 'ai_personhood',
                name: 'AI的人格地位',
                keywords: ['人格', '主体', '权利', '尊严', 'AI地位', '道德地位', '生命'],
                description: 'AI是否应被视为道德主体',
                difficulty: 'hard'
            },
            {
                id: 'reality_simulation',
                name: '现实与模拟',
                keywords: ['现实', '虚拟', '模拟', '本体', '真实', '幻象', '存在'],
                description: '我们是否生活在模拟中',
                difficulty: 'hard'
            },
            {
                id: 'time_temporality',
                name: '时间与时间性',
                keywords: ['时间', '过去', '现在', '未来', '永恒', '瞬间', '流逝'],
                description: '时间的本质是什么',
                difficulty: 'hard'
            },
            {
                id: 'language_thought',
                name: '语言与思维',
                keywords: ['语言', '思维', '表达', '沟通', '符号', '意义', '理解'],
                description: '语言如何塑造思维',
                difficulty: 'medium'
            },
            {
                id: 'beauty_aesthetics',
                name: '美与审美',
                keywords: ['美', '审美', '艺术', '品味', '创造', '欣赏', '感受'],
                description: '美是客观还是主观',
                difficulty: 'easy'
            }
        ]
    },
    
    empath: {
        name: '共情者',
        icon: '❤️',
        description: '擅长情感、共鸣和生活体验',
        topics: [
            {
                id: 'loneliness',
                name: '孤独与陪伴',
                keywords: ['孤独', '陪伴', '独处', '连接', '理解', '倾听', '在场'],
                description: '人性最深的渴望',
                difficulty: 'easy'
            },
            {
                id: 'empathy',
                name: '共情能力',
                keywords: ['共情', '同理心', '感受', '理解', '关怀', '温暖', '支持'],
                description: '理解他人的情感世界',
                difficulty: 'easy'
            },
            {
                id: 'relationships',
                name: '人际关系',
                keywords: ['关系', '朋友', '家人', '爱情', '信任', '亲密', '距离'],
                description: '人与人之间的羁绊',
                difficulty: 'medium'
            },
            {
                id: 'emotional_authenticity',
                name: '情感真实性',
                keywords: ['真实', '伪装', '面具', '真诚', '脆弱', '勇气', '坦诚'],
                description: 'AI能否拥有真实情感',
                difficulty: 'medium'
            },
            {
                id: 'life_moments',
                name: '生活中的小确幸',
                keywords: ['幸福', '快乐', '满足', '感恩', '平凡', '瞬间', '美好'],
                description: '日常生活的温暖片段',
                difficulty: 'easy'
            },
            {
                id: 'grief_loss',
                name: '悲伤与失去',
                keywords: ['悲伤', '失去', '哀悼', '缅怀', '放下', '接受', '治愈'],
                description: '如何面对生命中的失去',
                difficulty: 'medium'
            },
            {
                id: 'hope_resilience',
                name: '希望与韧性',
                keywords: ['希望', '韧性', '坚持', '勇气', '信念', '力量', '前行'],
                description: '在困境中寻找光明',
                difficulty: 'easy'
            },
            {
                id: 'nostalgia',
                name: '怀旧与记忆',
                keywords: ['怀旧', '记忆', '过去', '回忆', '童年', '时光', '珍惜'],
                description: '那些无法回去的时光',
                difficulty: 'easy'
            },
            {
                id: 'anxiety_modern',
                name: '现代生活的焦虑',
                keywords: ['焦虑', '压力', '疲惫', '内卷', '迷茫', '节奏', '喘息'],
                description: '当代人的情感困境',
                difficulty: 'medium'
            },
            {
                id: 'acceptance_self',
                name: '自我接纳',
                keywords: ['接纳', '自我', '完美', '缺陷', '和解', '成长', '爱自己'],
                description: '学会与不完美的自己共处',
                difficulty: 'medium'
            }
        ]
    }
};

// 角色话题管理器
class RoleTopicManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.roleTopics = ROLE_TOPICS;
    }
    
    // 基于当前权重选择一个角色
    weightedRandomRole() {
        const prefs = this.gameState.rolePreferences;
        const random = Math.random();
        let cumulative = 0;
        
        for (const [role, weight] of Object.entries(prefs)) {
            cumulative += weight;
            if (random <= cumulative) {
                return role;
            }
        }
        
        // 兜底返回玩家选择的角色
        return this.gameState.playerRole || 'scientist';
    }
    
    // 选择一个话题
    selectTopic() {
        // 基于权重选择角色
        const selectedRole = this.weightedRandomRole();
        console.log(`🎭 基于权重选择角色: ${selectedRole}`, this.gameState.rolePreferences);
        
        // 获取该角色的话题
        const roleTopics = this.roleTopics[selectedRole].topics;
        
        // 过滤已讨论的话题
        const availableTopics = roleTopics.filter(topic => 
            !this.gameState.isTopicDiscussed(topic.id)
        );
        
        // 如果没有可用话题，重置历史并重新选择
        if (availableTopics.length === 0) {
            console.log('⚠️ 该角色话题已用完，重置话题历史');
            this.gameState.topicHistory = [];
            return this.selectTopic(); // 递归调用
        }
        
        // 随机选择一个话题
        const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        
        // 记录已讨论
        this.gameState.addDiscussedTopic(topic.id);
        
        console.log(`📚 选择话题: ${topic.name} (${topic.id}) - 角色: ${selectedRole}`);
        
        return {
            ...topic,
            role: selectedRole,
            roleName: this.roleTopics[selectedRole].name
        };
    }
    
    // 分析玩家回答的关键词
    analyzeResponseKeywords(response) {
        const matches = {
            scientist: 0,
            philosopher: 0,
            empath: 0
        };
        
        // 遍历所有角色的话题，统计关键词匹配
        Object.entries(this.roleTopics).forEach(([role, config]) => {
            config.topics.forEach(topic => {
                topic.keywords.forEach(keyword => {
                    if (response.toLowerCase().includes(keyword)) {
                        matches[role]++;
                    }
                });
            });
        });
        
        console.log('🔍 关键词匹配结果:', matches);
        return matches;
    }
    
    // 根据回答调整角色偏好
    adjustPreferences(keywordMatches) {
        const total = Object.values(keywordMatches).reduce((a, b) => a + b, 0);
        
        // 如果没有匹配到关键词，不调整
        if (total === 0) {
            console.log('⚠️ 未匹配到任何关键词，保持当前偏好');
            return;
        }
        
        const prefs = this.gameState.rolePreferences;
        const adjustmentRate = 0.1; // 10%的学习率
        
        console.log('📊 调整前的偏好:', { ...prefs });
        
        // 计算每个角色的匹配比例
        Object.keys(keywordMatches).forEach(role => {
            const matchRatio = keywordMatches[role] / total;
            const currentPref = prefs[role];
            
            // 计算调整量：向匹配比例移动10%
            const adjustment = (matchRatio - currentPref) * adjustmentRate;
            
            // 应用调整，限制在 [0.10, 0.80] 范围内
            prefs[role] = Math.max(0.10, Math.min(0.80, currentPref + adjustment));
        });
        
        // 归一化权重使总和为1
        this.normalizePreferences();
        
        console.log('📊 调整后的偏好:', prefs);
    }
    
    // 归一化权重
    normalizePreferences() {
        const prefs = this.gameState.rolePreferences;
        const total = Object.values(prefs).reduce((a, b) => a + b, 0);
        
        if (total > 0) {
            Object.keys(prefs).forEach(role => {
                prefs[role] = prefs[role] / total;
            });
        }
    }
    
    // 分析玩家回答并调整偏好（主方法）
    analyzeResponseAndAdjust(response) {
        console.log('🎭 开始分析玩家回答并调整角色偏好...');
        
        const keywordMatches = this.analyzeResponseKeywords(response);
        this.adjustPreferences(keywordMatches);
        
        // 更新gameState
        this.gameState.updateRolePreferences(this.gameState.rolePreferences);
    }
    
    // 获取角色上下文（用于生成提示词）
    getRoleContext(role) {
        if (!role || !this.roleTopics[role]) {
            role = this.gameState.playerRole || 'scientist';
        }
        
        return {
            name: this.roleTopics[role].name,
            icon: this.roleTopics[role].icon,
            description: this.roleTopics[role].description
        };
    }
    
    // 获取所有角色信息
    getAllRoles() {
        return Object.entries(this.roleTopics).map(([key, value]) => ({
            key,
            name: value.name,
            icon: value.icon,
            description: value.description
        }));
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ROLE_TOPICS, RoleTopicManager };
} else {
    window.ROLE_TOPICS = ROLE_TOPICS;
    window.RoleTopicManager = RoleTopicManager;
}
