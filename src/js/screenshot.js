// 截图工具 - 核心
class CodeScreenshotRenderer {
    constructor() {
        // 默认样式配置
        this.defaultStyleConfig = {
            outerBackground: '#2c3e50',
            innerBackground: '#1a1b23',
            textColor: '#eceff1',
            lineNumberColor: 'rgba(255, 255, 255, 0.4)',
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            fontSize: 16
        };
        
        // 加载保存的配置或使用默认配置
        this.loadStyleConfig();
    }

    // 加载样式配置
    loadStyleConfig() {
        try {
            const saved = localStorage.getItem('codeScreenshot_styleConfig');
            if (saved) {
                const savedConfig = JSON.parse(saved);
                this.styleConfig = { ...this.defaultStyleConfig, ...savedConfig };
                console.log('加载样式配置成功:', this.styleConfig);
            } else {
                this.styleConfig = { ...this.defaultStyleConfig };
                console.log('使用默认样式配置:', this.styleConfig);
            }
        } catch (error) {
            console.error('加载样式配置失败，使用默认配置:', error);
            this.styleConfig = { ...this.defaultStyleConfig };
        }
    }

    // 保存样式配置
    saveStyleConfig() {
        try {
            localStorage.setItem('codeScreenshot_styleConfig', JSON.stringify(this.styleConfig));
            console.log('保存样式配置成功:', this.styleConfig);
        } catch (error) {
            console.error('保存样式配置失败:', error);
        }
    }

    // 创建截图Canvas
    async createScreenshotCanvas(fileData, addLineNumbers, progressCallback = null) {
        const scaleFactor = 2;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('无法获取Canvas上下文');
        }

        // 计算尺寸
        const dimensions = this.calculateDimensions(fileData.content, addLineNumbers);
        
        // 设置Canvas尺寸
        canvas.width = dimensions.canvasWidth * scaleFactor;
        canvas.height = dimensions.canvasHeight * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor);
        
        // 绘制步骤
        const steps = [
            { 
                name: '正在绘制背景', 
                action: () => this.drawBackground(ctx, dimensions),
                delay: 500
            },
            { 
                name: '正在绘制行号', 
                action: () => this.drawLineNumbers(ctx, dimensions),
                delay: 500
            },
            { 
                name: '正在绘制代码', 
                action: () => this.drawCodeContent(ctx, fileData.content, dimensions, addLineNumbers),
                delay: 500
            }
        ];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (progressCallback) {
                progressCallback(step.name, (i + 1) / steps.length);
            }
            
            // 执行步骤动作
            step.action();
            
            // 添加延迟（除了最后一步）
            if (i < steps.length - 1) {
                await new Promise(resolve => setTimeout(resolve, step.delay));
            }
        }

        await this.validateCanvas(canvas);
        return canvas;
    }

    // 计算尺寸 - 改进换行逻辑，保持内容对齐
    calculateDimensions(content, addLineNumbers) {
        const originalLines = content.split('\n');
        
        // 字体设置 - 使用配置的字体大小
        const fontSize = this.styleConfig.fontSize;
        const lineHeight = fontSize + 8;
        
        // 边距设置 - 根据是否添加行号调整左边距
        const padding = {
            top: 40,
            right: 40,
            bottom: 40,
            left: addLineNumbers ? 80 : 40
        };
        
        // 内容区域最大宽度
        const maxContentWidth = 1000;
        
        // 创建临时Canvas用于测量文本宽度
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${fontSize}px ${this.styleConfig.fontFamily}`;
        
        // 修复：改进换行逻辑，保持内容对齐
        const processedLines = [];
        
        originalLines.forEach(originalLine => {
            // 保留原始行，包括所有空格
            if (originalLine === '') {
                processedLines.push('');
                return;
            }
            
            // 测量整行宽度
            const fullLineWidth = this.measureTextWidth(tempCtx, originalLine);
            
            if (fullLineWidth <= maxContentWidth) {
                // 如果整行宽度在限制内，直接使用原始行
                processedLines.push(originalLine);
            } else {
                // 如果行宽度超出限制，进行智能换行（保持内容对齐）
                this.wrapLineWithContentAlignment(originalLine, tempCtx, maxContentWidth, processedLines);
            }
        });
        
        const lineCount = processedLines.length;
        
        // 计算最大行宽度
        let maxLineWidth = 0;
        processedLines.forEach(line => {
            const lineWidth = this.measureTextWidth(tempCtx, line);
            if (lineWidth > maxLineWidth) {
                maxLineWidth = lineWidth;
            }
        });
        
        // 行号区域宽度（根据行号位数动态计算）- 只在添加行号时计算
        const lineNumberDigits = addLineNumbers ? lineCount.toString().length : 0;
        const lineNumberWidth = addLineNumbers ? (lineNumberDigits * 8 + 20) : 0;
        const lineNumberX = padding.left - 15;
        
        // 内容区域尺寸
        const contentWidth = Math.max(600, Math.min(1200, maxLineWidth + padding.left + padding.right + lineNumberWidth));
        const contentHeight = (lineCount * lineHeight) + padding.top + padding.bottom;
        
        // Canvas尺寸（确保是整数）
        const canvasWidth = Math.ceil(contentWidth);
        const canvasHeight = Math.ceil(contentHeight);

        console.log('尺寸计算完成:', {
            lineCount,
            maxLineWidth,
            canvasWidth,
            canvasHeight,
            addLineNumbers
        });

        return {
            canvasWidth,
            canvasHeight,
            contentWidth,
            contentHeight,
            padding,
            fontSize,
            lineHeight,
            lineCount,
            lines: processedLines,
            lineNumberWidth,
            lineNumberDigits,
            lineNumberX,
            maxContentWidth,
            addLineNumbers
        };
    }

    // 修复：智能换行，保持内容对齐
    wrapLineWithContentAlignment(originalLine, tempCtx, maxContentWidth, processedLines) {
        let currentPos = 0;
        const lineLength = originalLine.length;
        
        // 检测基础缩进（开头的空格）
        let baseIndent = '';
        let indentEndIndex = 0;
        while (indentEndIndex < lineLength && originalLine[indentEndIndex] === ' ') {
            baseIndent += ' ';
            indentEndIndex++;
        }
        
        // 检测内容起始位置（基础缩进后的第一个非空格字符）
        let contentStartPos = indentEndIndex;
        
        let lineIndex = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        while (currentPos < lineLength) {
            let currentLine = '';
            
            if (lineIndex === 0) {
                // 第一行使用完整原始内容（包括基础缩进）
                currentLine = baseIndent;
            } else {
                // 后续行使用基础缩进 + 内容对齐缩进
                // 计算内容对齐缩进：让内容与第一行的内容起始位置对齐
                currentLine = baseIndent + ' '.repeat(contentStartPos - baseIndent.length);
            }
            
            let lineEnd = this.findOptimalLineBreakWithAlignment(
                originalLine, 
                currentPos, 
                tempCtx, 
                maxContentWidth, 
                currentLine,
                inQuotes,
                quoteChar,
                lineIndex
            );
            
            if (lineEnd === -1 || lineEnd <= currentPos) {
                // 如果没有找到合适的断点，使用安全断点
                lineEnd = this.findSafeBreakPointWithAlignment(originalLine, currentPos, tempCtx, maxContentWidth, currentLine);
            }
            
            if (lineEnd === -1 || lineEnd <= currentPos) {
                // 如果还是没找到，强制在最大宽度处断开
                lineEnd = this.findForcedBreakPoint(originalLine, currentPos, tempCtx, maxContentWidth, currentLine);
            }
            
            const lineContent = originalLine.substring(currentPos, lineEnd);
            
            // 更新引号状态
            for (let i = 0; i < lineContent.length; i++) {
                const char = lineContent[i];
                if ((char === '"' || char === "'" || char === '“' || char === '”' || char === '‘' || char === '’') && !inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar && inQuotes) {
                    inQuotes = false;
                    quoteChar = '';
                }
            }
            
            if (lineContent.trim() !== '' || lineIndex === 0) {
                processedLines.push(currentLine + lineContent);
            }
            
            currentPos = lineEnd;
            lineIndex++;
            
            // 跳过空白字符（除了在引号内）
            if (!inQuotes) {
                while (currentPos < lineLength && originalLine[currentPos] === ' ') {
                    currentPos++;
                }
            }
        }
    }

    // 修复：找到最佳换行位置（考虑内容对齐）
    findOptimalLineBreakWithAlignment(line, startPos, tempCtx, maxWidth, currentPrefix, inQuotes, quoteChar, lineIndex) {
        let bestBreakPos = -1;
        let lastGoodBreakPos = -1;
        let currentEnd = startPos;
        
        while (currentEnd < line.length) {
            const testText = line.substring(startPos, currentEnd + 1);
            const fullText = currentPrefix + testText;
            const textWidth = this.measureTextWidth(tempCtx, fullText);
            
            // 检查当前字符
            const currentChar = line[currentEnd];
            let isInQuotesNow = inQuotes;
            let currentQuoteChar = quoteChar;
            
            // 更新引号状态
            if ((currentChar === '"' || currentChar === "'" || currentChar === '“' || currentChar === '”' || currentChar === '‘' || currentChar === '’') && !isInQuotesNow) {
                isInQuotesNow = true;
                currentQuoteChar = currentChar;
            } else if (currentChar === currentQuoteChar && isInQuotesNow) {
                isInQuotesNow = false;
                currentQuoteChar = '';
            }
            
            if (textWidth > maxWidth) {
                // 超出宽度，返回上一个合适的断点
                if (lastGoodBreakPos !== -1) {
                    return lastGoodBreakPos;
                } else {
                    // 如果没有找到合适的断点，在当前字符前断开
                    return Math.max(startPos, currentEnd - 1);
                }
            }
            
            // 记录合适的断点位置
            if (this.isOptimalBreakPoint(currentChar, line, currentEnd, isInQuotesNow)) {
                lastGoodBreakPos = currentEnd + 1;
                
                // 如果是非常好的断点，直接记录
                if (this.isExcellentBreakPoint(currentChar, line, currentEnd)) {
                    bestBreakPos = currentEnd + 1;
                }
            }
            
            currentEnd++;
        }
        
        // 如果到达行尾，返回行尾
        if (currentEnd === line.length) {
            return line.length;
        }
        
        // 返回最佳断点或最后一个好断点
        return bestBreakPos !== -1 ? bestBreakPos : lastGoodBreakPos;
    }

    // 安全断点（考虑内容对齐）
    findSafeBreakPointWithAlignment(line, startPos, tempCtx, maxWidth, currentPrefix) {
        let currentEnd = startPos;
        let lastSpacePos = -1;
        
        while (currentEnd < line.length) {
            const testText = line.substring(startPos, currentEnd + 1);
            const fullText = currentPrefix + testText;
            const textWidth = this.measureTextWidth(tempCtx, fullText);
            
            if (textWidth > maxWidth) {
                if (lastSpacePos !== -1) {
                    return lastSpacePos + 1;
                } else {
                    return Math.max(startPos + 1, currentEnd);
                }
            }
            
            if (line[currentEnd] === ' ') {
                lastSpacePos = currentEnd;
            }
            
            currentEnd++;
        }
        
        return line.length;
    }

    // 判断是否为最佳断点
    isOptimalBreakPoint(char, line, pos, inQuotes) {
        // 如果在引号内，尽量避免断开
        if (inQuotes) {
            return false;
        }
        
        // 空格、标点符号等都是好的断点
        const breakChars = [' ', ',', ';', ':', '!', '?', '，', '；', '：', '！', '？', '、'];
        return breakChars.includes(char);
    }

    // 判断是否为优秀断点（应该优先选择）
    isExcellentBreakPoint(char, line, pos) {
        // 句号、分号、冒号等是优秀断点
        const excellentChars = ['.', '。', ';', '；', ':', '：', '!', '！', '?', '？'];
        
        if (excellentChars.includes(char)) {
            return true;
        }
        
        // 括号结束也是优秀断点
        if (char === ')' || char === ']' || char === '}' || char === '）' || char === '】' || char === '」') {
            return true;
        }
        
        return false;
    }

    // 强制断点（当所有方法都失败时使用）
    findForcedBreakPoint(line, startPos, tempCtx, maxWidth, currentPrefix) {
        let currentEnd = startPos;
        
        while (currentEnd < line.length) {
            const testText = line.substring(startPos, currentEnd + 1);
            const fullText = currentPrefix + testText;
            const textWidth = this.measureTextWidth(tempCtx, fullText);
            
            if (textWidth > maxWidth) {
                return Math.max(startPos + 1, currentEnd);
            }
            
            currentEnd++;
        }
        
        return line.length;
    }

    // 测量文本宽度（使用Canvas API）
    measureTextWidth(ctx, text) {
        const metrics = ctx.measureText(text);
        return metrics.width;
    }

    // 绘制背景（使用配置的颜色）
    drawBackground(ctx, dimensions) {
        const { canvasWidth, canvasHeight, padding } = dimensions;
        
        // 清除Canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // 外层背景
        ctx.fillStyle = this.styleConfig.outerBackground;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 内层代码区域
        const codeX = padding.left / 2;
        const codeY = padding.top / 2;
        const codeWidth = canvasWidth - padding.left;
        const codeHeight = canvasHeight - padding.top;
        const borderRadius = 8;
        
        // 代码区域背景
        ctx.fillStyle = this.styleConfig.innerBackground;
        this.drawRoundedRect(ctx, codeX, codeY, codeWidth, codeHeight, borderRadius);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, codeX, codeY, codeWidth, codeHeight, borderRadius);
        ctx.stroke();
    }

    // 绘制行号
    drawLineNumbers(ctx, dimensions) {
        if (!dimensions.addLineNumbers) return;
        
        const { padding, lineHeight, lines, lineNumberX } = dimensions;
        
        ctx.font = `${this.styleConfig.fontSize}px ${this.styleConfig.fontFamily}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillStyle = this.styleConfig.lineNumberColor;
        
        lines.forEach((line, index) => {
            const y = padding.top + (index * lineHeight);
            const lineNumberText = (index + 1).toString();
            ctx.fillText(lineNumberText, lineNumberX, y);
        });
        
        ctx.textAlign = 'left';
    }

    // 绘制代码内容 - 修复空格显示问题
    drawCodeContent(ctx, content, dimensions, addLineNumbers) {
        const { padding, lineHeight, lines } = dimensions;
        
        // 设置字体
        ctx.font = `${this.styleConfig.fontSize}px ${this.styleConfig.fontFamily}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.styleConfig.textColor;
        
        // 修复：直接绘制处理后的行，保留所有空格和缩进
        lines.forEach((line, index) => {
            const y = padding.top + (index * lineHeight);
            const textX = addLineNumbers ? padding.left : padding.left;
            
            // 直接绘制行内容，Canvas会正确显示所有空格
            ctx.fillText(line, textX, y);
        });
    }

    // 绘制圆角矩形
    drawRoundedRect(ctx, x, y, width, height, radius) {
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

    // 验证Canvas内容
    async validateCanvas(canvas) {
        return new Promise((resolve, reject) => {
            try {
                // 检查Canvas尺寸
                if (canvas.width === 0 || canvas.height === 0) {
                    reject(new Error('Canvas尺寸为0'));
                    return;
                }
                
                // 检查是否有内容
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, 1, 1);
                
                if (!imageData) {
                    reject(new Error('Canvas没有内容'));
                    return;
                }
                
                // 测试DataURL生成
                const testDataURL = canvas.toDataURL('image/png');
                if (!testDataURL || testDataURL === 'data:,') {
                    reject(new Error('Canvas无法生成DataURL'));
                    return;
                }
                
                console.log('Canvas验证成功');
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    // 保存Canvas图片
    saveCanvasImage(canvas, fileName) {
        try {
            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .split('.')[0];
            
            const name = fileName ? 
                `code_screenshot_${fileName.replace(/\.[^/.]+$/, "")}_${timestamp}.png` :
                `code_screenshot_${timestamp}.png`;
            
            // 生成DataURL
            const dataURL = canvas.toDataURL('image/png');
            
            if (!dataURL || dataURL === 'data:,') {
                throw new Error('生成DataURL失败');
            }
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = name;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Utils.showMessage(`代码截图已保存: ${name}`, 'success');
            
        } catch (error) {
            throw new Error('保存图片失败: ' + error.message);
        }
    }

    // 判断是否为代码文件
    isCodeFile(fileName) {
        const codeExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
            '.html', '.css', '.scss', '.less', '.php', '.rb', '.go', '.rs', '.swift',
            '.kt', '.dart', '.lua', '.sh', '.bash', '.zsh', '.sql', '.json', '.xml',
            '.yaml', '.yml', '.md', '.csv', '.log'
        ];
        
        if (!fileName) return false;
        
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        const isCode = codeExtensions.includes(extension);
        console.log('文件判断:', fileName, '扩展名:', extension, '是代码文件:', isCode);
        return isCode;
    }

    // 恢复默认配置
    resetToDefaultConfig() {
        this.styleConfig = { ...this.defaultStyleConfig };
        this.saveStyleConfig();
        console.log('已恢复默认配置:', this.styleConfig);
        return this.styleConfig;
    }

    // 更新样式配置
    updateStyleConfig(config) {
        // 只更新传入的属性，不影响其他属性
        this.styleConfig = {
            ...this.styleConfig,
            ...config
        };
        this.saveStyleConfig();
    }

    // 获取当前样式配置
    getStyleConfig() {
        return { ...this.styleConfig };
    }
}

// 创建全局代码截图渲染器实例
window.codeScreenshotRenderer = new CodeScreenshotRenderer();