// AI伪装表现分析系统
class AIDisguiseAnalyzer {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // 生成深度表现分析
    generatePerformanceAnalysis() {
        const analysis = {
            title: this.generateAnalysisTitle(),
            summary: this.generateDeepSummary(),
            insights: this.generateInsights(),
            reflectionQuestions: this.generateReflectionQuestions(),
            philosophicalThoughts: this.generatePhilosophicalThoughts(),
            aiScore: this.calculateOverallAIScore()
        };

        return analysis;
    }

    // 生成分析标题
    generateAnalysisTitle() {
        const rounds = this.gameState.survivedRounds;
        const suspicion = this.gameState.getSuspicionPercentage();
        const title = this.gameState.getPlayerTitle();
        
        if (rounds >= 8) {
            return "🎭 大师级AI伪装者的深度剖析";
        } else if (rounds >= 6) {
            return "🤖 高级AI伪装艺术分析";
        } else if (rounds >= 4) {
            return "⚙️ 中级AI模拟行为解读";
        } else if (rounds >= 2) {
            return "🔍 初级AI伪装尝试分析";
        } else {
            return "💭 人类本性暴露实录";
        }
    }

    // 生成深度总结
    generateDeepSummary() {
        const rounds = this.gameState.survivedRounds;
        const suspicion = this.gameState.getSuspicionPercentage();
        const responses = this.gameState.playerResponses;
        const suspicionHistory = this.gameState.suspicionHistory;
        
        // 分析回答质量趋势
        const qualityTrend = this.analyzeResponseQualityTrend();
        const linguisticPatterns = this.analyzeLinguisticPatterns();
        const behavioralConsistency = this.analyzeBehavioralConsistency();
        const strategicAdaptation = this.analyzeStrategicAdaptation();

        let summary = `在这场人类与AI身份界限的游戏中，你展现了${this.getPerformanceLevel()}的伪装能力。`;

        // 基于表现深度分析
        if (rounds >= 6) {
            summary += `你不仅仅是在模仿AI的语言模式，更深层地理解了AI思维的本质特征。你的回答${qualityTrend.description}，展现出对技术细节的把握和逻辑推理的严谨性。`;
            
            if (behavioralConsistency.score > 0.8) {
                summary += `特别值得注意的是，你在整个游戏过程中保持了惊人的角色一致性，这种持续的自我约束展现了深度的元认知能力。`;
            }
        } else if (rounds >= 4) {
            summary += `你开始理解AI伪装的精髓，但${linguisticPatterns.weakness}暴露了一些人类思维的痕迹。`;
            
            if (strategicAdaptation.adaptability > 0.7) {
                summary += `可喜的是，你展现了学习和适应的能力，随着游戏进行逐渐调整策略。`;
            }
        } else if (rounds >= 2) {
            summary += `你的尝试表明对AI行为模式有基础认知，但人类的直觉思维仍然强烈地渗透在回答中。`;
        } else {
            summary += `你的回答直接暴露了人类的感性思维和直觉判断，这恰恰证明了人类认知的独特性。`;
        }

        // 添加怀疑度分析
        const suspicionPattern = this.analyzeSuspicionPattern();
        summary += ` ${suspicionPattern.insight}`;

        return summary;
    }

    // 生成洞察分析
    generateInsights() {
        const insights = [];
        
        // 语言风格洞察
        const linguisticInsight = this.getLinguisticInsight();
        insights.push({
            category: "语言风格洞察",
            content: linguisticInsight
        });

        // 认知模式洞察
        const cognitiveInsight = this.getCognitiveInsight();
        insights.push({
            category: "认知模式洞察", 
            content: cognitiveInsight
        });

        // 适应性洞察
        const adaptiveInsight = this.getAdaptiveInsight();
        insights.push({
            category: "适应性洞察",
            content: adaptiveInsight
        });

        // 心理状态洞察
        const psychologicalInsight = this.getPsychologicalInsight();
        insights.push({
            category: "心理状态洞察",
            content: psychologicalInsight
        });

        return insights;
    }

    // 生成反思问题
    generateReflectionQuestions() {
        const questions = [];
        const rounds = this.gameState.survivedRounds;
        const suspicion = this.gameState.getSuspicionPercentage();

        // 基于表现水平提出不同深度的问题
        if (rounds >= 6) {
            questions.push("在成功伪装AI的过程中，你是否发现自己对'智能'本质的理解发生了改变？");
            questions.push("当你努力压制人类直觉而采用逻辑思维时，这种转换让你对自我认知产生了什么新的思考？");
            questions.push("如果AI也在努力模仿人类，那么在这种互相模仿中，'真实性'的意义还存在吗？");
        } else if (rounds >= 3) {
            questions.push("在试图'变得更像AI'的过程中，你注意到了人类思维的哪些独特之处？");
            questions.push("当你的人类特征被识破时，你觉得这暴露的是思维方式还是表达习惯？");
            questions.push("如果你继续练习，你认为最难克服的'人类痕迹'会是什么？");
        } else {
            questions.push("你的回答中最'人类'的部分是什么？这说明了人类思维的什么特点？");
            questions.push("面对需要'像机器一样思考'的挑战，你感受到的困难主要来自哪里？");
            questions.push("这次体验让你对AI与人类的区别有了什么新的认识？");
        }

        // 添加通用深度问题
        questions.push("在这个AI与人类身份模糊的时代，保持'人性'的价值在哪里？");

        return questions;
    }

    // 生成哲学思考
    generatePhilosophicalThoughts() {
        const rounds = this.gameState.survivedRounds;
        const suspicion = this.gameState.getSuspicionPercentage();
        
        let thought = "";

        if (rounds >= 7) {
            thought = "你的出色表现让我们思考：当人类能够如此完美地模仿AI，当AI也在努力理解人类时，我们是在走向融合还是在加深隔阂？也许，这种角色扮演游戏本身就是一种新型的'图灵测试'——不是测试机器是否具有人性，而是测试人类是否能够超越自己的天性。";
        } else if (rounds >= 4) {
            thought = "你的尝试揭示了一个有趣的悖论：为了证明自己'不是人类'，你必须深度理解并压制自己的人性。这种自我否定的过程，恰恰是最人性化的行为。我们不禁要问：在追求理性和逻辑的路上，我们是在变得更像机器，还是在发现人类独特的价值？";
        } else if (rounds >= 2) {
            thought = "你的表现展现了人类认知的复杂性：即使明知要模仿AI，人类的情感、直觉和经验仍然不可避免地渗透到思考过程中。这或许正是人类智慧的珍贵之处——我们的'不完美'逻辑，我们的情感干扰，我们的主观判断，构成了人类认知的独特魅力。";
        } else {
            thought = "你的直接暴露反而呈现了人类思维的纯真状态。在这个逐渐被算法定义的世界里，保持人类的直觉、情感和非理性思考，也许不是缺陷，而是我们最应该珍视的特质。毕竟，如果人类都变得像AI一样'完美'，这个世界会不会失去一些重要的东西？";
        }

        return thought;
    }

    // 分析回答质量趋势
    analyzeResponseQualityTrend() {
        const responses = this.gameState.playerResponses;
        if (responses.length < 2) {
            return { trend: 'insufficient_data', description: '回答数量不足以分析趋势' };
        }

        const suspicionChanges = this.gameState.suspicionHistory.filter(change => change.change !== 0);
        let improvingCount = 0;
        let decliningCount = 0;

        for (let i = 1; i < suspicionChanges.length; i++) {
            if (suspicionChanges[i].change < suspicionChanges[i-1].change) {
                improvingCount++;
            } else if (suspicionChanges[i].change > suspicionChanges[i-1].change) {
                decliningCount++;
            }
        }

        if (improvingCount > decliningCount) {
            return { trend: 'improving', description: '呈现出逐步改善的学习曲线' };
        } else if (decliningCount > improvingCount) {
            return { trend: 'declining', description: '显示出逐渐暴露人类特征的趋势' };
        } else {
            return { trend: 'stable', description: '保持了相对稳定的表现水平' };
        }
    }

    // 分析语言模式
    analyzeLinguisticPatterns() {
        const responses = this.gameState.playerResponses;
        let technicalTerms = 0;
        let emotionalWords = 0;
        let personalPronouns = 0;
        let certaintyWords = 0;

        responses.forEach(response => {
            const text = response.response.toLowerCase();
            
            // 技术词汇
            const techPatterns = ['算法', '模型', '数据', '系统', '程序', '计算', '处理', '优化', '分析', '逻辑'];
            technicalTerms += techPatterns.filter(term => text.includes(term)).length;
            
            // 情感词汇
            const emotionPatterns = ['感觉', '觉得', '喜欢', '讨厌', '担心', '高兴', '痛苦', '快乐'];
            emotionalWords += emotionPatterns.filter(word => text.includes(word)).length;
            
            // 人称代词
            const pronounPatterns = ['我觉得', '我认为', '我感觉', '我想'];
            personalPronouns += pronounPatterns.filter(pronoun => text.includes(pronoun)).length;
            
            // 确定性词汇
            const certaintyPatterns = ['确定', '肯定', '必须', '一定', '绝对', '显然', '明确'];
            certaintyWords += certaintyPatterns.filter(word => text.includes(word)).length;
        });

        let weakness = '';
        if (emotionalWords > technicalTerms) {
            weakness = '情感色彩浓厚的表达';
        } else if (personalPronouns > certaintyWords) {
            weakness = '过多的主观判断表述';
        } else {
            weakness = '某些细微的语言习惯';
        }

        return {
            technicalRatio: technicalTerms / (responses.length || 1),
            emotionalRatio: emotionalWords / (responses.length || 1),
            weakness: weakness
        };
    }

    // 分析行为一致性
    analyzeBehavioralConsistency() {
        const suspicionHistory = this.gameState.suspicionHistory;
        if (suspicionHistory.length < 3) {
            return { score: 0.5, consistency: 'insufficient_data' };
        }

        const variations = [];
        for (let i = 1; i < suspicionHistory.length; i++) {
            variations.push(Math.abs(suspicionHistory[i].change - suspicionHistory[i-1].change));
        }

        const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
        const consistency = Math.max(0, 1 - (avgVariation / 50)); // 归一化到0-1

        return {
            score: consistency,
            consistency: consistency > 0.8 ? 'high' : consistency > 0.5 ? 'medium' : 'low'
        };
    }

    // 分析策略适应性
    analyzeStrategicAdaptation() {
        const suspicionHistory = this.gameState.suspicionHistory;
        if (suspicionHistory.length < 3) {
            return { adaptability: 0.5 };
        }

        let adaptiveResponses = 0;
        for (let i = 1; i < suspicionHistory.length; i++) {
            // 如果前一次怀疑度上升，这次下降，说明有适应
            if (suspicionHistory[i-1].change > 0 && suspicionHistory[i].change < 0) {
                adaptiveResponses++;
            }
        }

        return {
            adaptability: adaptiveResponses / (suspicionHistory.length - 1)
        };
    }

    // 获取语言洞察
    getLinguisticInsight() {
        const patterns = this.analyzeLinguisticPatterns();
        
        if (patterns.technicalRatio > 2) {
            return "你展现了对技术语言的娴熟运用，这种专业化的表达方式是成功伪装的关键。然而，过度的技术化有时也会暴露'刻意模仿'的痕迹。";
        } else if (patterns.emotionalRatio > 1) {
            return "你的回答中情感色彩较为浓厚，这恰恰体现了人类语言的丰富性。AI通常更倾向于中性、客观的表述方式。";
        } else {
            return "你在语言使用上体现了某种平衡，既有逻辑性又保持了表达的自然性。这种平衡本身就很'人类'。";
        }
    }

    // 获取认知模式洞察
    getCognitiveInsight() {
        const rounds = this.gameState.survivedRounds;
        const responses = this.gameState.playerResponses;
        
        // 分析回答的逻辑结构
        let structuredAnswers = 0;
        responses.forEach(response => {
            if (response.response.includes('首先') || response.response.includes('其次') || 
                response.response.includes('然后') || response.response.includes('最后') ||
                response.response.includes('因此') || response.response.includes('所以')) {
                structuredAnswers++;
            }
        });

        if (structuredAnswers / responses.length > 0.6) {
            return "你倾向于使用结构化的逻辑思维，这与AI的信息处理方式高度吻合。但人类的这种'刻意逻辑化'往往比AI的天然逻辑性显得更加生硬。";
        } else {
            return "你的思维模式展现了人类特有的跳跃性和直觉性。这种非线性的思考方式是人类创造力的源泉，但也是伪装AI时的主要障碍。";
        }
    }

    // 获取适应性洞察
    getAdaptiveInsight() {
        const adaptation = this.analyzeStrategicAdaptation();
        
        if (adaptation.adaptability > 0.7) {
            return "你展现了出色的学习能力，能够根据反馈调整策略。这种元学习能力是高级智能的标志，无论是人类还是AI都需要具备。";
        } else if (adaptation.adaptability > 0.3) {
            return "你显示了一定的适应能力，但调整策略的速度可能不够快。AI通常能够更迅速地根据新信息更新行为模式。";
        } else {
            return "你的回答模式相对固定，这可能反映了人类思维的惯性特征。AI的优势之一就是能够快速调整和优化策略。";
        }
    }

    // 获取心理状态洞察
    getPsychologicalInsight() {
        const suspicion = this.gameState.getSuspicionPercentage();
        const endReason = this.gameState.isSuspicionGameOver();

        if (endReason) {
            return "随着游戏进行，怀疑度的不断累积反映了一个有趣的心理现象：当我们越努力证明自己'不是人类'时，我们的人类特征可能暴露得更加明显。这种悖论性的心理状态值得深思。";
        } else if (suspicion > 70) {
            return "高度的怀疑度积累表明你在维持AI人设时承受了相当的心理压力。这种压力本身就是人类独有的情感体验，是AI难以真正理解的。";
        } else {
            return "你在游戏中保持了相对放松的心态，这种自然状态帮助你更好地发挥。有时候，过度的自我意识反而会阻碍表现。";
        }
    }

    // 分析怀疑度模式
    analyzeSuspicionPattern() {
        const finalSuspicion = this.gameState.getSuspicionPercentage();
        const suspicionHistory = this.gameState.suspicionHistory;
        
        if (suspicionHistory.length === 0) {
            return { insight: "没有足够的怀疑度变化数据进行分析。" };
        }

        const majorIncreases = suspicionHistory.filter(change => change.change > 20).length;
        const majorDecreases = suspicionHistory.filter(change => change.change < -10).length;

        if (majorIncreases > majorDecreases * 2) {
            return { insight: "你的怀疑度呈现出波动上升的模式，这表明在伪装过程中存在一些难以克服的行为特征。" };
        } else if (majorDecreases > majorIncreases) {
            return { insight: "你展现了良好的风险控制能力，能够通过优质回答有效降低怀疑度。" };
        } else {
            return { insight: "你的怀疑度变化相对平稳，展现了稳定的表现水平。" };
        }
    }

    // 计算综合AI分数
    calculateOverallAIScore() {
        const rounds = this.gameState.survivedRounds;
        const suspicion = this.gameState.getSuspicionPercentage();
        const consistency = this.analyzeBehavioralConsistency().score;
        const adaptation = this.analyzeStrategicAdaptation().adaptability;
        
        // 综合评分算法
        let score = 0;
        score += Math.min(rounds * 10, 50); // 轮数分数（最高50）
        score += Math.max(0, (100 - suspicion) * 0.3); // 怀疑度分数（最高30）
        score += consistency * 10; // 一致性分数（最高10）
        score += adaptation * 10; // 适应性分数（最高10）
        
        return Math.round(Math.min(score, 100));
    }

    // 获取表现水平描述
    getPerformanceLevel() {
        const rounds = this.gameState.survivedRounds;
        
        if (rounds >= 8) return "大师级";
        if (rounds >= 6) return "专家级";
        if (rounds >= 4) return "熟练级";
        if (rounds >= 2) return "初级";
        return "新手级";
    }

    // 生成完整的分析报告
    generateFullReport() {
        const analysis = this.generatePerformanceAnalysis();
        
        let report = `## 🎭 ${analysis.title}\n\n`;
        report += `### 深度分析\n\n${analysis.summary}\n\n`;
        
        report += `### 洞察与发现\n\n`;
        analysis.insights.forEach(insight => {
            report += `**${insight.category}**: ${insight.content}\n\n`;
        });
        
        report += `### 反思与思考\n\n`;
        analysis.reflectionQuestions.forEach((question, index) => {
            report += `${index + 1}. ${question}\n\n`;
        });
        
        report += `### 哲学思辨\n\n${analysis.philosophicalThoughts}\n\n`;
        
        report += `**综合AI伪装评分**: ${analysis.aiScore}/100\n\n`;
        
        return report;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIDisguiseAnalyzer;
} else {
    window.AIDisguiseAnalyzer = AIDisguiseAnalyzer;
}