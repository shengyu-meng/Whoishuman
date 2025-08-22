# 配置文件使用说明

## 概述

为了提高安全性和可维护性，API密钥和游戏配置已从 `GameController.js` 中分离出来，存储在独立的配置文件 `js/config.js` 中。

## 文件结构

```
js/
├── config.js           # 实际配置文件（包含敏感信息）
├── config.js.template  # 配置文件模板
└── GameController.js   # 游戏控制器（使用配置文件）
```

## 配置文件说明

### API_CONFIG

包含所有API相关的配置：

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

### GAME_CONFIG

包含游戏相关的配置：

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

## 使用方法

### 1. 首次设置

复制配置模板并填入您的实际配置：

```bash
cp js/config.js.template js/config.js
```

然后编辑 `js/config.js` 文件，填入您的DeepSeek API密钥：

```javascript
apiKey: 'sk-your-actual-api-key-here',
```

### 2. 配置验证

打开 `config_test.html` 页面，验证配置是否正确加载。

### 3. 运行游戏

确保 `index.html` 中正确引用了配置文件：

```html
<script src="js/config.js"></script>
<script src="js/GameState.js"></script>
<script src="js/AICharacterPool.js"></script>
<script src="js/TopicProgression.js"></script>
<script src="js/GameController.js"></script>
<script src="js/GameInitializer.js"></script>
```

## 安全注意事项

### 1. 版本控制

确保 `.gitignore` 文件包含以下内容：

```
# 配置文件 - 包含敏感信息
js/config.js
```

### 2. API密钥安全

- 永远不要将包含真实API密钥的配置文件提交到版本控制系统
- 定期更换API密钥
- 监控API使用情况，防止滥用

### 3. 环境区分

建议为不同环境使用不同的配置：

- **开发环境**: 使用测试API密钥
- **生产环境**: 使用正式API密钥
- **测试环境**: 使用模拟API

## 故障排除

### 配置加载失败

如果看到 "API配置加载失败" 错误：

1. 检查 `js/config.js` 文件是否存在
2. 确认配置文件语法正确
3. 验证 `index.html` 中正确引用了配置文件
4. 查看浏览器控制台是否有其他错误

### API调用失败

如果API调用失败：

1. 验证API密钥是否正确
2. 检查API密钥是否有足够的权限
3. 确认网络连接正常
4. 检查API配额是否用完

## 自定义配置

您可以根据需要修改配置文件中的参数：

- 调整 `temperature` 来改变AI回复的创造性
- 修改 `typingDelay` 和 `messageDelay` 来调整游戏节奏
- 改变 `maxAttempts` 来调整重试策略

## 更新配置

当需要更新配置时：

1. 修改 `js/config.js` 文件
2. 刷新浏览器页面
3. 使用 `config_test.html` 验证新配置

---

**注意**: 请妥善保管您的API密钥，不要在不安全的环境中使用。