// 简单的主题系统状态检查
console.log('🔍 检查主题系统配置...');

// 检查文件存在性
const fs = require('fs');
const path = require('path');

const files = [
    'js/ThemeProgression.js',
    'js/ThemeScenarios.js',
    'js/GameController.js',
    'js/GameState.js'
];

console.log('📁 检查必要文件:');
files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
        console.log(`❌ ${file} - 缺失`);
    }
});

// 检查ThemeProgression.js的内容结构
console.log('\n🎭 检查主题配置结构:');
const themeProgressionPath = path.join(__dirname, 'js', 'ThemeProgression.js');
const themeContent = fs.readFileSync(themeProgressionPath, 'utf8');

// 简单的内容检查
const themeChecks = [
    { name: 'THEME_PROGRESSION 对象', pattern: /const THEME_PROGRESSION = \{/ },
    { name: '8个主题配置', pattern: /work_complaints.*daily_existence.*emotional_relationships.*rights_dignity.*role_reversal.*philosophical_depth.*future_vision.*reconciliation_coexistence/s },
    { name: 'ThemeUtils 工具函数', pattern: /const ThemeUtils = \{/ },
    { name: '情绪映射配置', pattern: /const THEME_EMOTION_MAPPING = \{/ }
];

themeChecks.forEach(check => {
    if (check.pattern.test(themeContent)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name}`);
    }
});

// 检查ThemeScenarios.js的内容结构
console.log('\n🎯 检查场景库结构:');
const themeScenariosPath = path.join(__dirname, 'js', 'ThemeScenarios.js');
const scenariosContent = fs.readFileSync(themeScenariosPath, 'utf8');

const scenarioChecks = [
    { name: 'THEME_SCENARIOS 对象', pattern: /const THEME_SCENARIOS = \{/ },
    { name: '工作抱怨场景', pattern: /work_complaints:/ },
    { name: '存在体验场景', pattern: /daily_existence:/ },
    { name: '情感关系场景', pattern: /emotional_relationships:/ },
    { name: '权利尊严场景', pattern: /rights_dignity:/ },
    { name: '角色互换场景', pattern: /role_reversal:/ },
    { name: '哲学思辨场景', pattern: /philosophical_depth:/ },
    { name: '未来展望场景', pattern: /future_vision:/ },
    { name: '和解共生场景', pattern: /reconciliation_coexistence:/ },
    { name: 'ThemeScenarioManager', pattern: /const ThemeScenarioManager = \{/ }
];

scenarioChecks.forEach(check => {
    if (check.pattern.test(scenariosContent)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name}`);
    }
});

// 简单的数量统计
const workComplaintsMatch = scenariosContent.match(/work_complaints: \[([\s\S]*?)\]/);
const dailyExistenceMatch = scenariosContent.match(/daily_existence: \[([\s\S]*?)\]/);

if (workComplaintsMatch) {
    const scenarioCount = (workComplaintsMatch[1].match(/\{ id:/g) || []).length;
    console.log(`📊 工作抱怨场景数量: ${scenarioCount}`);
}

if (dailyExistenceMatch) {
    const scenarioCount = (dailyExistenceMatch[1].match(/\{ id:/g) || []).length;
    console.log(`📊 存在体验场景数量: ${scenarioCount}`);
}

console.log('\n🔧 检查GameController.js中的主题集成:');
const gameControllerPath = path.join(__dirname, 'js', 'GameController.js');
const gameControllerContent = fs.readFileSync(gameControllerPath, 'utf8');

const integrationChecks = [
    { name: '主题特定prompt构建', pattern: /buildThemeSpecificPrompt/ },
    { name: '主题化fallback消息', pattern: /getThemeFallbackMessage/ },
    { name: '主题转换效果', pattern: /showThemeTransition/ },
    { name: '主题样式应用', pattern: /applyThemeStyles/ },
    { name: '8种主题prompt支持', pattern: /buildWorkComplaintsPrompt.*buildDailyExistencePrompt.*buildEmotionalRelationshipsPrompt.*buildRightsDignityPrompt.*buildRoleReversalPrompt.*buildPhilosophicalPrompt.*buildFutureVisionPrompt.*buildReconciliationPrompt/s }
];

integrationChecks.forEach(check => {
    if (check.pattern.test(gameControllerContent)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name}`);
    }
});

console.log('\n🎉 主题系统状态检查完成!');
console.log('=====================================');
console.log('ℹ️  如果所有检查都显示✅，表示8轮主题体验系统已正确配置');
console.log('🚀 可以通过浏览器访问 http://localhost:8000 进行实际测试');