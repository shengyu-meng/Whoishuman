#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "   WhoisHuman 环境配置助手"
echo "========================================"
echo

# 检查是否存在配置文件
if [ -f "js/config.js" ]; then
    echo -e "${GREEN}✅ 发现配置文件 js/config.js${NC}"
else
    echo -e "${YELLOW}⚠️  未发现配置文件，将创建...${NC}"
    if [ -f "js/config.js.template" ]; then
        cp "js/config.js.template" "js/config.js"
        echo -e "${GREEN}✅ 已从模板创建配置文件${NC}"
    else
        echo -e "${RED}❌ 配置文件模板不存在！${NC}"
    fi
fi

echo
echo "========================================"
echo "   环境变量配置"
echo "========================================"

# 检查环境变量
API_KEY_SET=0
if [ ! -z "$DEEPSEEK_API_KEY" ] && [ "$DEEPSEEK_API_KEY" != "YOUR_API_KEY_HERE" ]; then
    API_KEY_SET=1
    echo -e "${GREEN}✅ 检测到环境变量 DEEPSEEK_API_KEY${NC}"
fi

if [ $API_KEY_SET -eq 0 ]; then
    echo -e "${YELLOW}⚠️  未检测到有效的 DEEPSEEK_API_KEY 环境变量${NC}"
    echo
    echo "请选择设置方式："
    echo "1. 设置环境变量（推荐）"
    echo "2. 编辑配置文件"
    echo "3. 跳过设置"
    echo
    read -p "请输入选择 (1-3): " choice
    
    case $choice in
        1)
            echo
            read -p "请输入您的 DeepSeek API Key: " user_api_key
            
            if [ ! -z "$user_api_key" ]; then
                # 设置当前会话的环境变量
                export DEEPSEEK_API_KEY="$user_api_key"
                
                echo
                echo -e "${GREEN}✅ 已为当前会话设置环境变量${NC}"
                echo
                echo -e "${BLUE}💡 要永久设置环境变量，请将以下行添加到 ~/.bashrc 或 ~/.zshrc:${NC}"
                echo "   export DEEPSEEK_API_KEY=\"$user_api_key\""
                echo
                echo "然后运行: source ~/.bashrc 或 source ~/.zshrc"
            else
                echo -e "${RED}❌ 未输入有效的 API Key${NC}"
            fi
            ;;
        2)
            if [ -f "js/config.js" ]; then
                echo
                echo "请手动编辑 js/config.js 文件，将 YOUR_API_KEY_HERE 替换为您的实际 API Key"
                
                # 尝试用系统默认编辑器打开
                if command -v code &> /dev/null; then
                    code js/config.js
                elif command -v nano &> /dev/null; then
                    nano js/config.js
                elif command -v vim &> /dev/null; then
                    vim js/config.js
                else
                    echo "请使用您喜欢的文本编辑器打开 js/config.js"
                fi
            fi
            ;;
        3)
            echo "跳过设置"
            ;;
        *)
            echo -e "${RED}❌ 无效选择${NC}"
            ;;
    esac
fi

echo
echo "========================================"
echo "   环境检测测试"
echo "========================================"

# 检查测试页面
if [ -f "test-config.html" ]; then
    echo -e "${GREEN}✅ 发现测试页面 test-config.html${NC}"
    echo
    echo -e "${BLUE}💡 建议步骤：${NC}"
    echo "   1. 打开 test-config.html 进行环境测试"
    echo "   2. 确认配置正确后，打开 index.html 开始游戏"
    echo
    read -p "是否现在打开测试页面？ (y/n): " open_test
    if [ "$open_test" = "y" ] || [ "$open_test" = "Y" ]; then
        # 尝试用系统默认浏览器打开
        if command -v xdg-open &> /dev/null; then
            xdg-open test-config.html
        elif command -v open &> /dev/null; then
            open test-config.html
        else
            echo "请手动在浏览器中打开 test-config.html"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  未发现测试页面${NC}"
fi

echo
echo "========================================"
echo "   部署信息"
echo "========================================"
echo
echo -e "${BLUE}📦 本地运行：${NC}"
echo "   - 确保环境变量或配置文件已设置"
echo "   - 使用本地服务器或直接在浏览器中打开 index.html"
echo
echo -e "${BLUE}☁️  Cloudflare Pages 部署：${NC}"
echo "   - 将代码推送到 GitHub/GitLab"
echo "   - 在 Cloudflare Pages 项目设置中添加环境变量："
echo "     DEEPSEEK_API_KEY = your-actual-api-key"
echo "   - 详细步骤请参考 DEPLOYMENT.md"
echo

echo -e "${GREEN}✅ 配置助手完成！${NC}"
echo