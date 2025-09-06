@echo off

echo ========================================
echo           启动 WhoisHuman 游戏
echo ========================================
echo.

if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    echo.
)

echo 正在启动游戏服务器...
echo 请在浏览器中访问: http://localhost:3001
echo 按 Ctrl+C 停止服务器
echo.

npm start

pause