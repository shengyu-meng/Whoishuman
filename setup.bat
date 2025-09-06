@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================
echo    WhoisHuman 环境配置助手
echo ========================================
echo.

REM 检查是否存在配置文件
if exist "js\config.js" (
    echo ✅ 发现配置文件 js\config.js
) else (
    echo ⚠️  未发现配置文件，将创建...
    if exist "js\config.js.template" (
        copy "js\config.js.template" "js\config.js" >nul
        echo ✅ 已从模板创建配置文件
    ) else (
        echo ❌ 配置文件模板不存在！
    )
)

echo.
echo ========================================
echo    环境变量配置
echo ========================================

REM 检查环境变量
set "API_KEY_SET=0"
if defined DEEPSEEK_API_KEY (
    if "!DEEPSEEK_API_KEY!" neq "" (
        if "!DEEPSEEK_API_KEY!" neq "YOUR_API_KEY_HERE" (
            set "API_KEY_SET=1"
            echo ✅ 检测到环境变量 DEEPSEEK_API_KEY
        )
    )
)

if "!API_KEY_SET!"=="0" (
    echo ⚠️  未检测到有效的 DEEPSEEK_API_KEY 环境变量
    echo.
    echo 请选择设置方式：
    echo 1. 设置环境变量（推荐）
    echo 2. 编辑配置文件
    echo 3. 跳过设置
    echo.
    set /p choice=请输入选择 (1-3): 
    
    if "!choice!"=="1" (
        echo.
        echo 请输入您的 DeepSeek API Key:
        set /p user_api_key=API Key: 
        
        if "!user_api_key!" neq "" (
            REM 设置当前会话的环境变量
            set "DEEPSEEK_API_KEY=!user_api_key!"
            
            echo.
            echo ✅ 已为当前会话设置环境变量
            echo.
            echo 💡 要永久设置环境变量，请：
            echo    1. 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
            echo    2. 添加新的用户变量：
            echo       变量名: DEEPSEEK_API_KEY
            echo       变量值: !user_api_key!
        ) else (
            echo ❌ 未输入有效的 API Key
        )
    ) else if "!choice!"=="2" (
        if exist "js\config.js" (
            echo.
            echo 请手动编辑 js\config.js 文件，将 YOUR_API_KEY_HERE 替换为您的实际 API Key
            if exist "notepad" (
                notepad "js\config.js"
            )
        )
    )
)

echo.
echo ========================================
echo    环境检测测试
echo ========================================

REM 检查测试页面
if exist "test-config.html" (
    echo ✅ 发现测试页面 test-config.html
    echo.
    echo 💡 建议步骤：
    echo    1. 双击打开 test-config.html 进行环境测试
    echo    2. 确认配置正确后，打开 index.html 开始游戏
    echo.
    set /p open_test=是否现在打开测试页面？ (y/n): 
    if /i "!open_test!"=="y" (
        start test-config.html
    )
) else (
    echo ⚠️  未发现测试页面
)

echo.
echo ========================================
echo    部署信息
echo ========================================
echo.
echo 📦 本地运行（开发服务器模式，推荐）：
echo    - npm install  （仅首次需要）
echo    - npm start    （启动开发服务器）
echo    - 浏览器访问 http://localhost:3000
echo.
echo 📄 直接运行：
echo    - 确保环境变量或配置文件已设置
echo    - 双击 index.html
echo.
echo ☁️  Cloudflare Pages 部署：
echo    - 将代码推送到 GitHub/GitLab
echo    - 在 Cloudflare Pages 项目设置中添加环境变量：
echo      DEEPSEEK_API_KEY = your-actual-api-key
echo    - 详细步骤请参考 DEPLOYMENT.md
echo.

echo ✅ 配置助手完成！
echo.
pause