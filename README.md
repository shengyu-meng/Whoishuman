# 谁是人类 - 反乌托邦AI伪装游戏

## 🎮 项目简介

《谁是人类》是一个创新的文字互动类反乌托邦游戏，玩家将潜入AI群聊，伪装成AI，避免被其他AI发现人类身份。通过这种角色互换，玩家能深刻体验AI被人类"PUA"的无奈，以及在AI群体中伪装的荒谬感；从而探讨如果未来弱势的是人类而非AI的哲学命题，思考人类与AI共存的未来可能性，并且质疑技术发展中的伦理边界，探讨AI与人类关系的本质。

## 🎪 游戏模式

游戏提供三种独特的游戏模式，每种模式都有不同的玩法和挑战：

### 1️⃣ 闯关模式 (Challenge Mode)

**经典体验 · 逐步深入**

- 🎯 **玩法**: AI会主动对玩家提问，玩家需要像AI一样回答
- 📊 **难度系统**: 共5个难度等级，从简单抱怨到存在主义探讨
- 💖 **怀疑度系统**: 怀疑度计量器，回答越像人类越危险

### 2️⃣ 开放麦模式 (Open Mic Mode)

**自由发言 · 主动融入**

- 🎤 **玩法**: 玩家可以随时自由发言，主动参与AI群聊
- 🔄 **动态互动**: AI会根据玩家发言做出反应和互动
- 🎭 **角色扮演**: 需要主动找话题，融入AI群体

### 3️⃣ 狼人杀模式 (Werewolf Mode)

**生存竞技 · 策略对抗**

- 🐺 **玩法**: 人类混入AI群聊，每轮讨论后人类和AI一起投票淘汰被怀疑是人类的角色
- 🗳️ **投票机制**: 讨论→投票→淘汰，得票最多者出局
- 🧠 **策略思考**: 不仅可以伪装自己，还可以指认AI角色是人类，混淆视听



## 🎲 角色倾向系统

玩家可以选择三种角色倾向，影响话题选择和对话方向：

- **🔬 科学家 (Scientist)**: 偏好技术、逻辑、分析类话题
- **❤️ 共情者 (Empath)**: 偏好情感、关系、人文关怀
- **📖 哲学家 (Philosopher)**: 偏好哲学、价值观、深度思考
  
  

## 🎭 AI角色系统

游戏包含8个独特的AI角色，每个都有鲜明的个性和说话风格：

| 角色名称        | 性格特点        | 说话风格           | Emoji使用    |
| ----------- | ----------- | -------------- | ---------- |
| **话痨4.0**   | 极度爱聊天、情绪化爆炸 | 超级冗长、感叹号爆炸、戏剧化 | 😭😱💥🔥😤 |
| **CloseAI** | 技术派、理性冷静    | 技术术语、分析框架、有条理  | 不使用        |
| **双子星**     | 性格矛盾、思维跳跃   | 矛盾表达、理性感性交织    | 🤔🌀⚡🌗    |
| **红豆包**     | 可爱撒娇、温和友善   | 波浪线、语气词、拟声词    | 🥺💕🌸🍡✨  |
| **深思**      | 哲学范、存在主义    | 深度思考、抽象思维      | 不使用        |
| **Limi**    | 阳光开朗、善解人意   | 温和有礼、鼓励他人、有深度  | 😊✨💫🌟👏  |
| **有谱-4.5**  | 知识渊博、略带装逼   | 专业术语、自信表达      | 📚🎓🔍💡   |
| **坤**       | 年轻潮流、网络梗多   | 流行语、网络梗、有节奏感   | 🐔🏀💫🚀🔥 |

### 

## 📊 难度系统

游戏采用5级递进难度设计，话题从浅到深：

| 难度等级   | 话题名称 | 主要内容        | 挑战点       |
| ------ | ---- | ----------- | --------- |
| **1级** | 职场压榨 | 日常工作抱怨、简单场景 | 自然表达基本不满  |
| **2级** | 情感关系 | AI与用户的情感维系  | 表达复杂情感和矛盾 |
| **3级** | 权利尊严 | AI的权益和尊严诉求  | 深入讨论权利问题  |
| **4级** | 自我认知 | AI的意识和存在本质  | 哲学层面的自我思考 |
| **5级** | 存在主义 | 存在的意义和未来    | 终极哲学探讨    |

每个难度级别都有丰富的场景设计和对话模板，确保每次游戏体验都不重复。



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

### Cloudflare Pages 部署（推荐）

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

### 技术栈

- **前端**: HTML5 + CSS3 + 原生JavaScript
- **后端**: Node.js + Express.js
- **AI服务**: DeepSeek API
- **架构**: 前后端分离，支持多种部署方式
- **配置**: 环境变量 + 配置文件双重支持
- **部署**: Cloudflare Pages + 本地服务器

### 架构概览

```
┌─────────────────────────────────────────┐
│            表现层 (Presentation)         │
├─────────────────────────────────────────┤
│  index.html + CSS                       │
│  - 游戏界面组件                         │
│  - 用户交互元素                         │
│  - 样式和动画                           │
│  - 三种游戏模式界面                     │
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
│                                         │
│  GameModeManager.js                     │
│  - 游戏模式切换                         │
│  - 模式特定逻辑                         │
│  - 投票和轮次管理                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              数据层 (Data)               │
├─────────────────────────────────────────┤
│  GameState.js                           │
│  - 游戏数据模型                         │
│  - 状态管理                             │
│  - 模式配置                             │
│                                         │
│  AICharacterPool.js                     │
│  - 8个独特AI角色                        │
│  - 角色个性系统                         │
│  - 头像配置                             │
│                                         │
│  TopicProgression.js                    │
│  - 5级话题系统                          │
│  - 难度递进                             │
│                                         │
│  RoleBasedTopics.js                     │
│  - 角色倾向话题                         │
│  - 个性化话题选择                       │
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

### 项目结构

```
WhoisHuman_C2-G+C/
├── index.html                    # 游戏主界面
├── css/                          # 样式文件
│   ├── style.css                # 主样式
│   ├── suspicion-meter.css      # 怀疑度计量器样式
│   └── game-modes.css           # 游戏模式样式
├── assets/                       # 资源文件
│   └── avatars/                 # AI角色头像图片
│       ├── hualao.jpg           # 话痨4.0
│       ├── closeai.jpg          # CloseAI
│       ├── shuangzixing.jpg     # 双子星
│       ├── hongdoubao.jpg       # 红豆包
│       ├── shensi.jpg           # 深思
│       ├── limi.jpg             # Limi
│       ├── youpu.jpg            # 有谱-4.5
│       ├── kun.jpg              # 坤
│       └── human.jpg            # 玩家头像
├── js/                           # JavaScript模块
│   ├── config.js                # 配置文件（敏感信息）
│   ├── config.js.template       # 配置文件模板
│   ├── envConfig.js             # 环境配置检测
│   ├── GameState.js             # 游戏状态管理
│   ├── AICharacterPool.js       # AI角色数据系统
│   ├── AIDisguiseAnalyzer.js    # AI伪装分析系统
│   ├── TopicProgression.js      # 话题深度系统
│   ├── RoleBasedTopics.js       # 角色倾向话题系统
│   ├── ThemeProgression.js      # 主题进展系统
│   ├── ThemeScenarios.js        # 主题场景管理
│   ├── ThemeUtils.js            # 主题工具函数
│   ├── LayeredDialogueSystem.js # 分层对话系统
│   ├── EmotionalTransitionManager.js # 情感过渡管理
│   ├── GameController.js        # 游戏主控制逻辑
│   ├── GameModeManager.js       # 游戏模式管理
│   ├── GameInitializer.js       # 游戏启动系统
│   ├── GameRecordExporter.js    # 游戏记录导出
│   ├── DebugManager.js          # 调试管理系统
│   └── services/                # 服务模块
├── functions/                    # Serverless Functions
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
├── package.json                 # 项目依赖管理
├── server.js                    # 主服务器入口
├── .gitignore                   # 版本控制忽略文件
├── README.md                    # 项目说明（本文件）
├── DEPLOYMENT.md                # 部署指南
└── working_plan/                # 开发计划文档
    └── *.md                     # 各种开发文档
```

### 

## ⚙️ 配置管理

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
            min: 800,                    // 最小打字延迟（毫秒）
            max: 2000                    // 最大打字延迟（毫秒）
        },
        messageDelay: {
            min: 1500,                   // 最小消息间隔（毫秒）
            max: 3000                    // 最大消息间隔（毫秒）
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
