# 谁是人类 - 反乌托邦AI伪装游戏

## 🎮 项目简介

《谁是人类》是一个创新的文字互动类反乌托邦游戏，玩家将潜入AI群聊，伪装成AI，避免被其他AI发现人类身份。通过这种角色互换，玩家能深刻体验AI被人类"PUA"的无奈，以及在AI群体中伪装的荒谬感。

### 🎯 核心体验
- **角色互换**: 让人类体验被AI反向图灵测试的感受
- **反乌托邦思考**: 探讨如果未来弱势的是人类而非AI的哲学命题
- **荒谬感体验**: 在一群AI中伪装成AI的荒诞与反思
- **深度思考**: 思考AI与人类关系的本质，技术伦理问题

### 🌍 社会议题
- 反映当下AI被过度使用和压榨的现实
- 探讨人类与AI共存的未来可能性
- 质疑技术发展中的伦理边界
- 体验数字化时代的身份认同危机

## 🚀 快速开始

### 方式一：一键启动（推荐）

**Windows 用户：**
```bash
# 双击运行设置脚本
setup.bat

# 双击启动游戏服务器
start-game.bat
# 或中文版
启动游戏.bat
```

**Mac/Linux 用户：**
```bash
# 运行设置脚本
./setup.sh

# 启动游戏服务器
./start-game.sh
```

### 方式二：手动配置
1. 复制 `js/config.js.template` 为 `js/config.js`
2. 编辑 `js/config.js`，填入您的 DeepSeek API Key
3. 安装依赖：`npm install`
4. 启动服务器：`npm start`
5. 浏览器访问：http://localhost:3001

### 方式三：环境变量配置
设置环境变量 `DEEPSEEK_API_KEY`，然后启动服务器：

**Windows:**
```cmd
set DEEPSEEK_API_KEY=sk-your-api-key-here
npm start
```

**Mac/Linux:**
```bash
export DEEPSEEK_API_KEY="sk-your-api-key-here"
npm start
```

## ☁️ 部署选项

### Netlify 部署（推荐）
项目已内置 `netlify.toml` 配置文件，支持 Functions API：

1. **推送代码到 GitHub/GitLab**
2. **连接 Netlify**
   - 登录 [Netlify](https://app.netlify.com/)
   - 选择 "Import from Git"
   - 连接您的仓库
3. **配置环境变量**
   - 在项目设置中添加：`DEEPSEEK_API_KEY = sk-your-api-key`
4. **自动部署完成**

### Cloudflare Pages 部署
1. **推送代码到 GitHub/GitLab**
2. **连接 Cloudflare Pages**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 选择 Pages → Create a project
   - 连接您的仓库
3. **配置环境变量**
   - 在项目设置中添加：`DEEPSEEK_API_KEY = sk-your-api-key`
4. **部署完成**

### 本地开发服务器
项目内置 Express 服务器，支持 CORS 和 API 代理：
```bash
npm install
npm start
# 访问 http://localhost:3001
```

详细部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🏗️ 技术架构

### 架构概览

```
┌─────────────────────────────────────────┐
│            表现层 (Presentation)         │
├─────────────────────────────────────────┤
│  index.html + style.css                 │
│  - 游戏界面组件                         │
│  - 用户交互元素                         │
│  - 样式和动画                           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│             控制层 (Control)             │
├─────────────────────────────────────────┤
│  GameController.js                      │
│  - 游戏状态管理                         │
│  - 用户交互处理                         │
│  - AI对话逻辑                           │
│  - 游戏流程控制                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              数据层 (Data)               │
├─────────────────────────────────────────┤
│  GameState.js                           │
│  AICharacterPool.js                     │
│  TopicProgression.js                    │
│  - 游戏数据模型                         │
│  - AI角色数据                           │
│  - 话题系统                             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            外部服务 (External)           │
├─────────────────────────────────────────┤
│  DeepSeek API                           │
│  - AI对话生成                           │
│  - 回复分析                             │
│  - 内容过滤                             │
└─────────────────────────────────────────┘
```

### 技术栈
- **前端**: HTML5 + CSS3 + 原生JavaScript
- **后端**: Node.js + Express.js
- **AI服务**: DeepSeek API
- **架构**: 前后端分离，支持多种部署方式
- **配置**: 环境变量 + 配置文件双重支持
- **部署**: Netlify Functions + Cloudflare Pages + 本地服务器

### 项目结构

```
WhoisHuman_C2-G+C/
├── index.html                    # 游戏主界面
├── css/                          # 样式文件
│   ├── style.css                # 主样式
│   └── suspicion-meter.css      # 怀疑度计量器样式
├── js/                           # JavaScript模块
│   ├── config.js                # 配置文件（敏感信息）
│   ├── config.js.template       # 配置文件模板
│   ├── envConfig.js             # 环境配置检测
│   ├── GameState.js             # 游戏状态管理
│   ├── AICharacterPool.js       # AI角色数据系统
│   ├── AIDisguiseAnalyzer.js    # AI伪装分析系统
│   ├── TopicProgression.js      # 话题深度系统
│   ├── ThemeProgression.js      # 主题进展系统
│   ├── ThemeScenarios.js        # 主题场景管理
│   ├── GameController.js        # 游戏主控制逻辑
│   ├── GameInitializer.js       # 游戏启动系统
│   ├── GameRecordExporter.js    # 游戏记录导出
│   ├── DebugManager.js          # 调试管理系统
│   └── README.md                # JS模块说明
├── functions/                    # Netlify Functions
│   └── api/
│       ├── chat.js              # 聊天API处理
│       └── config.js            # API配置
├── server/                       # 本地服务器
│   ├── server.js                # 服务器实现
│   ├── logSaver.js              # 日志保存服务
│   └── package.json             # 服务器依赖
├── 跨平台脚本/                   # 安装和启动脚本
│   ├── setup.bat                # Windows环境配置
│   ├── setup.sh                 # Mac/Linux环境配置
│   ├── start-game.bat           # Windows启动脚本
│   ├── start-game.sh            # Mac/Linux启动脚本
│   └── 启动游戏.bat             # 中文启动脚本
├── netlify.toml                 # Netlify部署配置
├── package.json                 # 项目依赖管理
├── server.js                    # 主服务器入口
├── .gitignore                   # 版本控制忽略文件
├── README.md                    # 项目说明（本文件）
├── DEPLOYMENT.md                # 部署指南
└── working_plan/                # 开发计划文档
    └── *.md                     # 各种开发文档
```

### 核心模块

#### 1. 游戏状态管理 (GameState.js)
- 玩家信息管理
- 游戏进度追踪
- 难度递进系统
- 对话历史记录
- 怀疑度HP系统
- 场景管理系统

#### 2. AI角色系统 (AICharacterPool.js)
- 8个独特AI角色，每个都有鲜明个性
- 随机角色选择机制
- 个性化对话风格
- 角色一致性维护
- 动态角色激活系统

#### 3. AI伪装分析系统 (AIDisguiseAnalyzer.js)
- 深度回复分析引擎
- 多维度评估体系（技术性、逻辑性、AI特征等）
- 智能判定系统
- 个性化反馈生成
- 表现分析和建议

#### 4. 话题与主题系统
- **TopicProgression.js**: 5个层级的话题设计，从基础抱怨到存在主义探讨
- **ThemeProgression.js**: 主题递进逻辑和难度控制
- **ThemeScenarios.js**: 丰富的场景和对话模板管理

#### 5. 环境与调试系统
- **envConfig.js**: 环境检测和配置管理（支持多种部署方式）
- **DebugManager.js**: 完整的调试和日志系统
- **GameRecordExporter.js**: 游戏记录导出和分享功能

#### 6. 服务器与API系统
- **server.js**: Express服务器，支持CORS和API代理
- **functions/api/**: Netlify Functions支持
- **server/**: 独立本地服务器实现
- 支持环境变量和配置文件多种配置方式

## ⚙️ 配置管理

### 配置文件系统

为了提高安全性和可维护性，API密钥和游戏配置已从 `GameController.js` 中分离出来，存储在独立的配置文件中。

#### 配置文件结构
```
js/
├── config.js           # 实际配置文件（包含敏感信息）
├── config.js.template  # 配置文件模板
└── GameController.js   # 游戏控制器（使用配置文件）
```

#### API_CONFIG

```javascript
const API_CONFIG = {
    apiKey: 'your-api-key-here',        // DeepSeek API密钥
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',  // API基础URL
    model: 'deepseek-chat',             // 使用的模型
    requestConfig: {
        temperature: 0.7,                // 回复随机性 (0-1)
        maxTokens: 1000,                // 最大令牌数
        timeout: 30000                   // 超时时间（毫秒）
    }
};
```

#### GAME_CONFIG

```javascript
const GAME_CONFIG = {
    difficulty: {
        maxLevel: 5,                     // 最高难度等级
        basePassRate: 70                 // 基础通过率
    },
    aiCharacters: {
        minActive: 4,                    // 最小活跃AI数量
        maxActive: 5                     // 最大活跃AI数量
    },
    conversation: {
        typingDelay: {
            min: 800,                    // 最小打字延迟
            max: 2000                    // 最大打字延迟
        },
        messageDelay: {
            min: 1500,                   // 最小消息间隔
            max: 3000                    // 最大消息间隔
        }
    },
    retry: {
        maxAttempts: 5,                  // 最大重试次数
        similarityThreshold: 0.6         // 相似性阈值
    }
};
```

## 📄 许可证

本项目采用 [Artistic License 2.0](LICENSE) 开源许可证。

### 许可证要点
- ✅ 允许个人和商业使用
- ✅ 允许修改和分发
- ✅ 允许私人使用
- ⚠️ 修改版本需要明确标识
- ⚠️ 分发时需要包含原始许可证

详细条款请查看 [LICENSE](LICENSE) 文件。

---

*《谁是人类》 - 让我们在AI时代重新思考人性的边界*

*这是一个既有深度又有趣味性的游戏项目，通过创新的方式让玩家思考AI与人类的关系，以及技术发展中的伦理问题。*