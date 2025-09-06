# Cloudflare Pages 部署指南

## 环境配置

### 本地开发环境

#### Windows 环境变量设置

1. **临时设置（当前会话有效）**
   ```cmd
   set DEEPSEEK_API_KEY=sk-your-actual-api-key-here
   ```

2. **永久设置（系统环境变量）**
   - 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
   - 添加新的用户变量：
     - 变量名：`DEEPSEEK_API_KEY`
     - 变量值：`sk-your-actual-api-key-here`

3. **PowerShell 环境变量设置**
   ```powershell
   $env:DEEPSEEK_API_KEY = "sk-your-actual-api-key-here"
   ```

### Cloudflare Pages 部署

#### 1. 创建 Pages 项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 "Pages" → "Create a project"
3. 连接你的 GitHub/GitLab 仓库
4. 选择这个项目

#### 2. 配置构建设置
- **Framework preset**: None 或 Static Site
- **Build command**: 留空（静态站点）
- **Build output directory**: `.`（当前目录）

#### 3. 配置环境变量
在 Pages 项目设置中添加：

**Production Environment:**
```
DEEPSEEK_API_KEY = sk-your-actual-production-api-key
```

**Preview Environment (可选):**
```
DEEPSEEK_API_KEY = sk-your-actual-preview-api-key
```

#### 4. 自定义域名（可选）
在 "Custom domains" 部分添加你的域名。

## 部署流程

### 方式一：Git 自动部署
1. 将代码推送到 GitHub/GitLab
2. Cloudflare Pages 自动检测并部署
3. 部署完成后访问提供的 URL

### 方式二：直接上传
1. 在 Pages 项目中选择 "Upload assets"
2. 上传项目文件
3. 等待部署完成

## 环境变量优先级

系统会按以下顺序检查 API Key：

1. **环境变量** (最高优先级)
   - Windows: `DEEPSEEK_API_KEY`, `DEEPSEEK_KEY`, `API_KEY`, `AI_API_KEY`
   - Cloudflare: Pages 环境变量配置

2. **配置文件** (较低优先级)
   - `js/config.js` 文件中的配置

3. **默认值** (最低优先级)
   - 如果都没有找到，会抛出错误

## 测试部署

### 本地测试
1. 设置环境变量或配置 `js/config.js`
2. 在浏览器中打开 `index.html`
3. 查看开发者控制台的环境检测信息

### 线上测试
1. 部署到 Cloudflare Pages
2. 打开部署的站点
3. 查看浏览器控制台确认配置加载正确

## 故障排除

### API Key 未找到
```
❌ 未找到有效的 API Key，请设置环境变量或配置文件
```
**解决方案：**
1. 确认环境变量已正确设置
2. 检查配置文件 `js/config.js` 是否存在
3. 确认 API Key 格式正确（以 `sk-` 开头）

### 环境检测问题
检查浏览器控制台的环境检测信息：
```
🔍 环境检测结果: Cloudflare Pages + Browser
✅ API 配置加载成功，使用 环境变量 中的 API Key
```

## 安全注意事项

1. **永远不要将 API Key 直接写在代码中**
2. **不要将 `config.js` 文件提交到版本控制**
3. **在 Cloudflare Pages 中使用环境变量管理敏感信息**
4. **定期轮换 API Key**

## 监控和日志

Cloudflare Pages 提供：
- 部署日志
- 实时函数日志
- 分析数据

可以在项目仪表板中查看这些信息。