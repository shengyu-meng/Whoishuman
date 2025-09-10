#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "   WhoisHuman Game Launcher"
echo "========================================"
echo

# 检查是否安装了依赖包
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo
fi

# 检查环境变量
if [ ! -z "$DEEPSEEK_API_KEY" ]; then
    echo -e "${GREEN}[OK] DEEPSEEK_API_KEY environment variable detected${NC}"
else
    echo -e "${YELLOW}[Warning] DEEPSEEK_API_KEY not found${NC}"
    echo "Game can still run via config file"
fi

echo
echo -e "${BLUE}Starting development server...${NC}"
echo -e "${BLUE}Access URL: http://localhost:3001${NC}"
echo -e "${BLUE}Press Ctrl+C to stop server${NC}"
echo

# 启动服务器
npm start