/**
 * ExportService - 游戏结果导出和分享服务
 * 
 * 功能：
 * - 生成分享图片
 * - 导出游戏记录
 * - 计算AI伪装评分
 * - 生成人类本性暴露实录
 * 
 * 依赖：
 * - GameState: 游戏状态数据
 * - GameRecordExporter: 记录导出器
 */

class ExportService {
    constructor(gameState) {
        this.gameState = gameState;
        this.recordExporter = null;
        this.isInitialized = false;
    }

    // 初始化导出功能
    initializeExportFunction(gameController) {
        // 创建导出器实例
        this.recordExporter = new GameRecordExporter(this.gameState, gameController);
        this.isInitialized = true;
        
        // 绑定导出按钮事件
        const exportBtn = document.getElementById('exportRecordBtn');
        if (exportBtn) {
            // 移除之前的事件监听器（如果有的话）
            exportBtn.replaceWith(exportBtn.cloneNode(true));
            
            // 重新获取按钮引用并绑定新的事件监听器
            const newExportBtn = document.getElementById('exportRecordBtn');
            newExportBtn.addEventListener('click', () => {
                this.exportGameRecord();
            });
        }
        
        // 绑定分享按钮事件
        const shareBtn = document.getElementById('shareResultBtn');
        if (shareBtn) {
            shareBtn.replaceWith(shareBtn.cloneNode(true));
            const newShareBtn = document.getElementById('shareResultBtn');
            newShareBtn.addEventListener('click', () => {
                this.shareResultCard();
            });
        }
    }

    // 保存结果卡片为图片
    async shareResultCard() {
        try {
            const resultCard = document.getElementById('resultCard');
            if (!resultCard) {
                alert('找不到结果卡片');
                return;
            }
            
            // 检查html2canvas是否加载
            if (typeof html2canvas === 'undefined') {
                alert('保存功能正在加载中，请稍后再试');
                setTimeout(() => this.shareResultCard(), 500);
                return;
            }
            
            // 显示加载提示
            const shareBtn = document.getElementById('shareResultBtn');
            const originalText = shareBtn ? shareBtn.textContent : '';
            if (shareBtn) shareBtn.textContent = '生成中...';
            
            // 使用html2canvas截取卡片
            const canvas = await html2canvas(resultCard, {
                backgroundColor: '#f8f9fa',
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 0,
                removeContainer: true
            });
            
            // 恢复按钮文本
            if (shareBtn) shareBtn.textContent = originalText;
            
            // 直接下载图片
            this.downloadImage(canvas);
            
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请稍后重试');
            const shareBtn = document.getElementById('shareResultBtn');
            if (shareBtn) shareBtn.textContent = '💾 保存结果';
        }
    }
    
    // 下载图片
    downloadImage(canvas) {
        const dataURL = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        const title = this.gameState.getPlayerTitle();
        const rounds = this.gameState.survivedRounds;
        link.download = `谁是人类_${title}_${rounds}轮.jpg`;
        link.href = dataURL;
        link.click();
    }

    // 生成分享结果
    shareResult() {
        const title = this.gameState.getPlayerTitle();
        const rounds = this.gameState.survivedRounds;
        const shareText = `我在《谁是人类》游戏中生存了${rounds}轮，获得了【${title}】称号！你能超过我吗？`;
        
        // 生成分享图片
        this.generateShareImage(title, rounds, shareText);
    }

    // 生成分享图片
    async generateShareImage(title, rounds, shareText) {
        try {
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸为类似结束卡片的长图格式
            canvas.width = 800;
            canvas.height = 1000;
            
            // 绘制背景渐变 - 蓝紫色到绿色渐变
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#07c160');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制白色卡片背景
            ctx.fillStyle = 'white';
            const cardX = 40;
            const cardY = 40;
            const cardWidth = canvas.width - 80;
            const cardHeight = canvas.height - 80;
            const cardRadius = 20;
            
            // 绘制圆角矩形
            this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
            ctx.fill();
            
            // 绘制标题
            ctx.fillStyle = '#333';
            ctx.font = 'bold 42px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🤖 谁是人类', canvas.width / 2, cardY + 70);
            
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial, sans-serif';
            ctx.fillText('反乌托邦AI伪装游戏', canvas.width / 2, cardY + 110);
            
            // 绘制分割线
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cardX + 60, cardY + 150);
            ctx.lineTo(cardX + cardWidth - 60, cardY + 150);
            ctx.stroke();
            
            // 绘制游戏结果标题
            ctx.fillStyle = '#333';
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.fillText('🎯 最终成绩', canvas.width / 2, cardY + 230);
            
            // 绘制生存轮数
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.fillText(`${rounds}`, canvas.width / 2, cardY + 290);
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillText('生存轮数', canvas.width / 2, cardY + 320);
            
            // 绘制AI伪装综合评分
            const aiDisguiseScore = this.calculateAIDisguiseScore();
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillText('🤖 AI伪装综合评分', canvas.width / 2, cardY + 380);
            
            ctx.fillStyle = '#764ba2';
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.fillText(`${aiDisguiseScore}/100`, canvas.width / 2, cardY + 420);
            
            // 绘制称号
            ctx.fillStyle = '#07c160';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.fillText(`【${title}】`, canvas.width / 2, cardY + 480);
            
            // 绘制人类本性暴露实录
            const humanExposureRecord = this.generateHumanExposureRecord();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.fillText('💭 人类本性暴露实录', canvas.width / 2, cardY + 540);
            
            // 绘制实录内容，支持自动换行
            ctx.fillStyle = '#666';
            ctx.font = '18px Arial, sans-serif';
            const recordTextWidth = cardWidth - 140;
            const recordLines = this.wrapTextJustified(ctx, humanExposureRecord, recordTextWidth);
            let recordY = cardY + 560;
            recordLines.forEach(lineObj => {
                this.drawJustifiedText(ctx, lineObj, canvas.width / 2, recordY, recordTextWidth);
                recordY += 24;
            });
            
            // 绘制评价
            const evaluation = this.getFinalEvaluation();
            ctx.fillStyle = '#666';
            ctx.font = '18px Arial, sans-serif';
            
            // 将评价文本分行显示
            const evalLines = this.wrapText(ctx, evaluation, cardWidth - 80);
            let evalY = recordY + 40;
            evalLines.forEach(line => {
                ctx.fillText(line, canvas.width / 2, evalY);
                evalY += 26;
            });
            
            // 绘制二维码区域
            const qrSize = 100;
            const qrX = canvas.width / 2 - qrSize / 2;
            const qrY = evalY + 40;
            
            // 生成二维码图案
            await this.drawQRCode(ctx, qrX, qrY, qrSize, 'http://whoishuman.hyperint.net/');
            
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('扫码体验游戏', canvas.width / 2, qrY + qrSize + 25);
            
            // 绘制底部信息
            ctx.fillStyle = '#999';
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText('whoishuman.hyperint.net', canvas.width / 2, qrY + qrSize + 50);
            
            // 将canvas转换为图片并直接下载
            const dataURL = canvas.toDataURL('image/png');
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `谁是人类_游戏结果_${rounds}轮_${title}.png`;
            link.href = dataURL;
            link.click();
            
        } catch (error) {
            console.error('生成分享图片失败:', error);
            alert('生成分享图片失败，请稍后重试');
        }
    }

    // 生成人类本性暴露实录
    generateHumanExposureRecord() {
        const responses = this.gameState.playerResponses;
        const suspicionHistory = this.gameState.getSuspicionHistory();
        const rounds = this.gameState.survivedRounds;
        
        if (responses.length === 0) {
            return '暂无回复记录，无法生成详细分析。';
        }
        
        // 分析主要暴露特征
        const exposureTypes = [];
        suspicionHistory.forEach(change => {
            if (change.change > 0) {
                if (change.reason.includes('情感')) {
                    exposureTypes.push('感性思维');
                } else if (change.reason.includes('直觉')) {
                    exposureTypes.push('直觉判断');
                } else if (change.reason.includes('主观')) {
                    exposureTypes.push('主观表达');
                } else if (change.reason.includes('简单')) {
                    exposureTypes.push('简化表达');
                } else {
                    exposureTypes.push('人类特征');
                }
            }
        });
        
        // 去重并分析
        const uniqueTypes = [...new Set(exposureTypes)];
        const mainExposures = uniqueTypes.slice(0, 2);
        
        // 生成评价等级描述
        let levelDesc = '';
        if (rounds >= 6) {
            levelDesc = '高级的伪装能力';
        } else if (rounds >= 4) {
            levelDesc = '中级的伪装能力';
        } else if (rounds >= 2) {
            levelDesc = '入门级的伪装能力';
        } else {
            levelDesc = '新手级的伪装能力';
        }
        
        // 生成怀疑度模式描述
        const finalSuspicion = this.gameState.suspicionLevel;
        let suspicionPattern = '';
        if (finalSuspicion >= 90) {
            suspicionPattern = '急剧上升的模式，这表明在伪装过程中频繁暴露人类特征';
        } else if (finalSuspicion >= 70) {
            suspicionPattern = '波动上升的模式，这表明在伪装过程中存在一些难以克服的行为特征';
        } else if (finalSuspicion >= 50) {
            suspicionPattern = '缓慢上升的模式，这表明你具备一定的AI伪装技巧';
        } else {
            suspicionPattern = '相对稳定的模式，这表明你展现了良好的AI思维特征';
        }
        
        // 生成完整描述
        const exposureDesc = mainExposures.length > 0 ? 
            `你的回答直接暴露了人类的${mainExposures.join('和')}，这恰恰证明了人类认知的独特性。` : 
            '你在回复中展现出了一些人类特有的思维模式。';
        
        return `在这场人类与AI身份界限的游戏中，你展现了${levelDesc}。${exposureDesc} 你的怀疑度呈现出${suspicionPattern}。`;
    }

    // 计算AI伪装综合评分
    calculateAIDisguiseScore() {
        const rounds = this.gameState.survivedRounds;
        const responses = this.gameState.playerResponses;
        
        let score = 0;
        
        // 生存轮数评分 (最高40分)
        score += Math.min(rounds * 5, 40);
        
        // 回复质量评分 (最高30分)
        if (responses.length > 0) {
            const avgResponseLength = responses.reduce((acc, r) => acc + r.response.length, 0) / responses.length;
            score += Math.min(avgResponseLength / 10, 30);
        }
        
        // 怀疑度控制评分 (最高30分)
        const finalSuspicion = this.gameState.suspicionLevel;
        if (finalSuspicion < 70) {
            score += 30;
        } else if (finalSuspicion < 85) {
            score += 20;
        } else if (finalSuspicion < 95) {
            score += 10;
        }
        
        return Math.round(Math.min(score, 100));
    }

    // 获取最终评价（需要从GameController获取）
    getFinalEvaluation() {
        const rounds = this.gameState.survivedRounds;
        const title = this.gameState.getPlayerTitle();
        
        // 简化版评价逻辑，复杂评价仍在GameController中
        if (rounds >= 6) {
            return `恭喜！你展现了出色的AI思维模拟能力，获得了【${title}】称号。`;
        } else if (rounds >= 3) {
            return `不错的表现！你在AI身份伪装方面显示出了一定的潜力，获得了【${title}】称号。`;
        } else {
            return `虽然游戏较早结束，但这正是人类独特性的体现，获得了【${title}】称号。`;
        }
    }

    // 导出游戏记录
    exportGameRecord() {
        if (!this.isInitialized || !this.recordExporter) {
            console.error('导出服务未初始化');
            alert('导出功能未正确初始化，请刷新页面重试。');
            return;
        }

        try {
            // 验证导出数据完整性
            const validation = this.recordExporter.validateExportData();
            if (!validation.isValid) {
                console.warn('导出数据不完整:', validation.issues);
                alert(`导出数据不完整:\n${validation.issues.join('\n')}\n\n将继续导出可用数据。`);
            }
            
            // 执行导出
            const result = this.recordExporter.exportToMarkdown();
            
            if (result.success) {
                console.log('✅ 导出成功:', result.filename);
                
                // 显示成功提示
                this.showExportSuccess(result);
                
                // 记录导出事件到系统消息
                this.gameState.addMessageToHistory('系统', `游戏记录已导出: ${result.filename}`, 'system');
            } else {
                console.error('❌ 导出失败:', result.error);
                alert(`导出失败: ${result.error}\n\n请稍后重试或联系技术支持。`);
            }
        } catch (error) {
            console.error('❌ 导出过程中发生错误:', error);
            alert(`导出过程中发生错误: ${error.message}\n\n请稍后重试。`);
        }
    }

    // 显示导出成功提示
    showExportSuccess(result) {
        const message = `✅ 导出成功！\n\n文件名: ${result.filename}\n文件大小: ${Math.round(result.size / 1024)} KB\n\n文件已保存到您的下载文件夹。`;
        alert(message);
    }

    // ===== 绘图辅助方法 =====

    // 文本自动换行方法
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // 两端对齐文本换行方法
    wrapTextJustified(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push({
                    text: currentLine.trim(),
                    isJustified: true,
                    width: ctx.measureText(currentLine.trim()).width
                });
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        // 最后一行不需要两端对齐
        if (currentLine.trim() !== '') {
            lines.push({
                text: currentLine.trim(),
                isJustified: false,
                width: ctx.measureText(currentLine.trim()).width
            });
        }
        
        return lines;
    }

    // 绘制两端对齐文本
    drawJustifiedText(ctx, lineObj, centerX, y, maxWidth) {
        if (!lineObj.isJustified) {
            // 最后一行居中显示
            ctx.textAlign = 'center';
            ctx.fillText(lineObj.text, centerX, y);
            return;
        }
        
        const words = lineObj.text.split('');
        if (words.length <= 1) {
            ctx.textAlign = 'center';
            ctx.fillText(lineObj.text, centerX, y);
            return;
        }
        
        // 计算间距
        const totalTextWidth = lineObj.width;
        const totalSpacing = maxWidth - totalTextWidth;
        const spaceBetweenWords = totalSpacing / (words.length - 1);
        
        // 开始位置
        let currentX = centerX - maxWidth / 2;
        
        ctx.textAlign = 'left';
        for (let i = 0; i < words.length; i++) {
            ctx.fillText(words[i], currentX, y);
            currentX += ctx.measureText(words[i]).width + spaceBetweenWords;
        }
    }

    // 绘制圆角矩形
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // 简化版QR码绘制（降级方案）
    async drawQRCode(ctx, x, y, size, url) {
        try {
            // 如果QRCode库可用，使用真实QR码
            if (typeof QRCode !== 'undefined') {
                // 创建临时div来生成QR码
                const tempDiv = document.createElement('div');
                document.body.appendChild(tempDiv);
                
                const qr = new QRCode(tempDiv, {
                    text: url,
                    width: size,
                    height: size,
                    colorDark: '#000000',
                    colorLight: '#ffffff'
                });
                
                // 等待QR码生成完成
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const qrImg = tempDiv.querySelector('img');
                if (qrImg && qrImg.complete) {
                    ctx.drawImage(qrImg, x, y, size, size);
                } else {
                    this.drawQRCodeFallback(ctx, x, y, size);
                }
                
                document.body.removeChild(tempDiv);
            } else {
                this.drawQRCodeFallback(ctx, x, y, size);
            }
        } catch (error) {
            console.warn('QR码生成失败，使用降级方案:', error);
            this.drawQRCodeFallback(ctx, x, y, size);
        }
    }

    // QR码降级方案
    drawQRCodeFallback(ctx, x, y, size) {
        // 绘制简单的图案代替QR码
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, size, size);
        
        // 绘制白色背景
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // 绘制一些方块图案
        ctx.fillStyle = '#000';
        const blockSize = size / 8;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i + j) % 2 === 0 && (i < 2 || i > 5 || j < 2 || j > 5)) {
                    ctx.fillRect(x + i * blockSize, y + j * blockSize, blockSize, blockSize);
                }
            }
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportService;
} else {
    window.ExportService = ExportService;
}