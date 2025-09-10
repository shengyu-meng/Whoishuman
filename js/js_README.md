# JavaScript 模块化结构说明

## 概述
原始的 `script.js` 文件已经被分解为多个功能模块，以提高代码的可维护性和可读性。

## 模块结构

### 1. GameState.js
**功能**: 游戏状态管理
- 管理游戏的核心状态（轮数、难度、玩家信息等）
- 处理AI角色选择和场景管理
- 维护对话历史和消息记录

### 2. AICharacterPool.js
**功能**: AI角色数据和话题系统
- 定义所有AI角色的属性和特征
- 管理话题递进系统
- 提供AI角色的基础数据

### 3. TopicProgression.js
**功能**: 话题深度递进设计
- 定义不同难度级别的话题内容
- 管理话题关键词和主题
- 提供话题递进逻辑

### 4. GameController.js
**功能**: 游戏主控制逻辑
- 处理用户交互和游戏流程
- 管理AI对话生成
- 处理玩家回复分析
- 控制游戏状态转换

### 5. GameInitializer.js
**功能**: 游戏初始化
- 在DOM加载完成后初始化游戏
- 创建游戏控制器实例

### 6. ModuleTest.js
**功能**: 模块化测试
- 验证所有模块是否正确加载
- 测试模块间的依赖关系

## 加载顺序
脚本按照以下顺序加载，确保依赖关系正确：

1. `GameState.js` - 基础状态管理
2. `AICharacterPool.js` - AI角色数据
3. `TopicProgression.js` - 话题系统
4. `GameController.js` - 主控制逻辑
5. `ModuleTest.js` - 模块测试（可选）
6. `GameInitializer.js` - 游戏初始化

## 使用方法

### 开发环境
在开发过程中，可以保留 `ModuleTest.js` 来验证模块加载：

```html
<script src="js/GameState.js"></script>
<script src="js/AICharacterPool.js"></script>
<script src="js/TopicProgression.js"></script>
<script src="js/GameController.js"></script>
<script src="js/ModuleTest.js"></script>
<script src="js/GameInitializer.js"></script>
```

### 生产环境
在生产环境中，可以移除 `ModuleTest.js`：

```html
<script src="js/GameState.js"></script>
<script src="js/AICharacterPool.js"></script>
<script src="js/TopicProgression.js"></script>
<script src="js/GameController.js"></script>
<script src="js/GameInitializer.js"></script>
```

## 优势

1. **可维护性**: 每个模块职责单一，易于理解和修改
2. **可扩展性**: 新功能可以独立添加到相应模块
3. **调试友好**: 问题可以快速定位到具体模块
4. **团队协作**: 不同开发者可以同时处理不同模块
5. **代码复用**: 模块可以在其他项目中重复使用

## 注意事项

- 所有模块都支持浏览器环境和Node.js环境
- 模块间通过全局变量进行通信
- 修改某个模块时需要注意其对其他模块的影响
- 测试时应验证所有模块的正常工作