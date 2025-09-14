// 游戏初始化模块
// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🔍 检查依赖类...');
        
        // 检查所有必需的类是否已定义
        const requiredClasses = ['GameController', 'GameState', 'AICharacterPool'];
        const missingClasses = [];
        
        requiredClasses.forEach(className => {
            if (typeof window[className] === 'undefined') {
                missingClasses.push(className);
            } else {
                console.log(`✅ ${className} 已加载`);
            }
        });
        
        if (missingClasses.length > 0) {
            console.error('❌ 缺少必需的类:', missingClasses);
            return;
        }
        
        console.log('🎮 初始化GameController...');
        window.gameController = new GameController();
        console.log('✅ GameController初始化成功');
    } catch (error) {
        console.error('❌ GameController初始化失败:', error);
        console.error('错误堆栈:', error.stack);
    }
});