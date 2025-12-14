// 代码截图动画管理类
class CodeScreenshotAnimation {
    constructor() {
        this.animationModal = null;
        this.downloadModal = null;
        this.currentStep = 0;
        this.steps = [];
        this.isAnimating = false;
        this.animationTimeouts = [];
        this.isCodeFile = false;
        this.finalCanvas = null;
        this.progressInterval = null;
        this.isDebugMode = false; // 新增：调试模式标志
    }

    // 显示下载动画弹窗
    showDownloadAnimation(fileName, isCodeFile) {
        console.log('显示下载动画弹窗', { fileName, isCodeFile });
        
        this.isCodeFile = isCodeFile;
        this.currentStep = 0;
        this.isAnimating = true;
        this.isDebugMode = false; // 默认不是调试模式
        
        // 关闭可能存在的旧弹窗
        this.closeDownloadAnimation();
        
        // 定义步骤 - 添加对"非代码文件添加行号"功能的支持
        const shouldAddLineNumbers = this.isCodeFile ? true : window.codeScreenshotManager?.addLineNumbers || false;
        this.steps = this.createSteps(isCodeFile, shouldAddLineNumbers);
        
        // 根据文件类型确定标题
        const titleText = isCodeFile ? '生成代码截图' : '生成文本截图';
        
        // 获取当前主题
        const currentTheme = window.themeManager?.getCurrentTheme() || 'light';
        const isDarkTheme = currentTheme === 'dark';
        
        // 创建弹窗HTML - 横向布局
        const modalHtml = `
            <div class="screenshot-modal-overlay code-screenshot-tool" id="downloadAnimationModal">
                <div class="screenshot-preview-modal download-animation-modal ${isDarkTheme ? 'dark-theme' : 'light-theme'}">
                    <div class="download-animation-content">
                        <div class="animation-header">
                            <h3 class="animation-title">
                                <i class="ti ti-download"></i>
                                ${titleText}
                            </h3>
                        </div>
                        
                        <!-- 横向布局的步骤显示 -->
                        <div class="graphic-step-container">
                            <!-- 大型图形展示区域 -->
                            <div class="graphic-display" id="graphicDisplay">
                                ${this.createStepGraphic(0)}
                            </div>
                            
                            <!-- 步骤信息区域 -->
                            <div class="graphic-step-info">
                                <div class="step-title-graphic" id="stepTitleGraphic">${this.steps[0].title}</div>
                                <div class="step-description-graphic" id="stepDescriptionGraphic">${this.steps[0].description}</div>
                                
                                <!-- 进度条和指示器 -->
                                <div class="progress-indicator-container">
                                    <div class="graphic-progress-container">
                                        <div class="graphic-progress-bar">
                                            <div class="graphic-progress-fill" id="graphicProgressFill" style="width: 0%"></div>
                                            <div class="progress-percentage-graphic" id="progressPercentageGraphic">0%</div>
                                        </div>
                                    </div>
                                    
                                    <!-- 步骤指示器 - 只显示圆点 -->
                                    <div class="graphic-step-indicator">
                                        <div class="step-dots-graphic">
                                            ${this.steps.map((step, index) => `
                                                <div class="step-dot-graphic ${index === 0 ? 'active' : ''}" data-step="${index}"></div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.animationModal = document.getElementById('downloadAnimationModal');
        
        // 阻止蒙版点击关闭
        this.animationModal.addEventListener('click', (e) => {
            if (e.target === this.animationModal) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
        
        // 开始动画序列
        this.startAnimationSequence();
    }

    // 新增：调试模式播放动画
    playDebugAnimation(isCodeFile = true) {
        console.log('播放调试动画', { isCodeFile });
        
        this.isCodeFile = isCodeFile;
        this.currentStep = 0;
        this.isAnimating = true;
        this.isDebugMode = true; // 设置为调试模式
        
        // 关闭可能存在的旧弹窗
        this.closeDownloadAnimation();
        
        // 定义步骤 - 添加对"非代码文件添加行号"功能的支持
        const shouldAddLineNumbers = this.isCodeFile ? true : window.codeScreenshotManager?.addLineNumbers || false;
        this.steps = this.createSteps(isCodeFile, shouldAddLineNumbers);
        
        // 根据文件类型确定标题
        const titleText = isCodeFile ? '生成代码截图' : '生成文本截图';
        
        // 获取当前主题
        const currentTheme = window.themeManager?.getCurrentTheme() || 'light';
        const isDarkTheme = currentTheme === 'dark';
        
        // 创建弹窗HTML - 横向布局
        const modalHtml = `
            <div class="screenshot-modal-overlay code-screenshot-tool" id="downloadAnimationModal">
                <div class="screenshot-preview-modal download-animation-modal ${isDarkTheme ? 'dark-theme' : 'light-theme'}">
                    <div class="download-animation-content">
                        <div class="animation-header">
                            <h3 class="animation-title">
                                <i class="ti ti-download"></i>
                                ${titleText} [调试模式]
                            </h3>
                        </div>
                        
                        <!-- 横向布局的步骤显示 -->
                        <div class="graphic-step-container">
                            <!-- 大型图形展示区域 -->
                            <div class="graphic-display" id="graphicDisplay">
                                ${this.createStepGraphic(0)}
                            </div>
                            
                            <!-- 步骤信息区域 -->
                            <div class="graphic-step-info">
                                <div class="step-title-graphic" id="stepTitleGraphic">${this.steps[0].title}</div>
                                <div class="step-description-graphic" id="stepDescriptionGraphic">${this.steps[0].description}</div>
                                
                                <!-- 进度条和指示器 -->
                                <div class="progress-indicator-container">
                                    <div class="graphic-progress-container">
                                        <div class="graphic-progress-bar">
                                            <div class="graphic-progress-fill" id="graphicProgressFill" style="width: 0%"></div>
                                            <div class="progress-percentage-graphic" id="progressPercentageGraphic">0%</div>
                                        </div>
                                    </div>
                                    
                                    <!-- 步骤指示器 - 只显示圆点 -->
                                    <div class="graphic-step-indicator">
                                        <div class="step-dots-graphic">
                                            ${this.steps.map((step, index) => `
                                                <div class="step-dot-graphic ${index === 0 ? 'active' : ''}" data-step="${index}"></div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.animationModal = document.getElementById('downloadAnimationModal');
        
        // 阻止蒙版点击关闭
        this.animationModal.addEventListener('click', (e) => {
            if (e.target === this.animationModal) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
        
        // 开始动画序列
        this.startDebugAnimationSequence();
    }

    // 创建步骤图形
    createStepGraphic(stepIndex) {
        const step = this.steps[stepIndex];
        const graphics = {
            'settings': `
                <div class="graphic-settings">
                    <div class="gear-large"></div>
                    <div class="gear-medium"></div>
                    <div class="gear-small"></div>
                    <div class="center-dot"></div>
                </div>
            `,
            'palette': `
                <div class="graphic-palette">
                    <div class="palette-base"></div>
                    <div class="color-swatch color-1"></div>
                    <div class="color-swatch color-2"></div>
                    <div class="color-swatch color-3"></div>
                    <div class="color-swatch color-4"></div>
                    <div class="brush-handle"></div>
                    <div class="brush-tip"></div>
                </div>
            `,
            'list-numbers': `
                <div class="graphic-list-numbers">
                    <div class="code-window">
                        <div class="line-numbers">
                            <div class="line-number">1</div>
                            <div class="line-number">2</div>
                            <div class="line-number">3</div>
                            <div class="line-number">4</div>
                            <div class="line-number">5</div>
                        </div>
                        <div class="code-content">
                            <div class="code-line"></div>
                            <div class="code-line highlight"></div>
                            <div class="code-line"></div>
                            <div class="code-line"></div>
                            <div class="code-line"></div>
                        </div>
                    </div>
                </div>
            `,
            'code': `
                <div class="graphic-code">
                    <div class="code-editor">
                        <div class="editor-header">
                            <div class="window-controls">
                                <div class="control close"></div>
                                <div class="control minimize"></div>
                                <div class="control maximize"></div>
                            </div>
                        </div>
                        <div class="editor-content">
                            <div class="code-syntax">
                                <div class="syntax-line keyword"></div>
                                <div class="syntax-line function"></div>
                                <div class="syntax-line bracket"></div>
                                <div class="syntax-line param"></div>
                                <div class="syntax-line bracket"></div>
                                <div class="syntax-line bracket"></div>
                                <div class="syntax-line comment"></div>
                                <div class="syntax-line bracket"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            'text-size': `
                <div class="graphic-text">
                    <div class="text-container">
                        <div class="text-line large"></div>
                        <div class="text-line medium"></div>
                        <div class="text-line small"></div>
                        <div class="text-cursor"></div>
                    </div>
                </div>
            `,
            'download': `
                <div class="graphic-download">
                    <div class="file-box">
                        <div class="file-corner"></div>
                        <div class="file-lines">
                            <div class="file-line"></div>
                            <div class="file-line"></div>
                            <div class="file-line"></div>
                        </div>
                        <div class="download-arrow"></div>
                        <div class="progress-circle"></div>
                    </div>
                </div>
            `,
            'circle-check': `
                <div class="graphic-success">
                    <div class="success-circle">
                        <svg viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    </div>
                </div>
            `
        };
        
        return graphics[step.color] || graphics.settings;
    }

    // 创建步骤配置 - 添加对"非代码文件添加行号"功能的支持
    createSteps(isCodeFile, shouldAddLineNumbers = false) {
        const steps = [
            {
                title: '初始化截图环境',
                description: '正在准备截图生成器和相关组件...',
                icon: 'ti-settings',
                duration: 1200,
                progress: 15,
                color: 'settings'
            },
            {
                title: '绘制背景和边框',
                description: '正在渲染代码区域的背景和精美边框...',
                icon: 'ti-palette',
                duration: 1500,
                progress: 30,
                color: 'palette'
            }
        ];

        // 如果是代码文件，或者非代码文件但启用了添加行号功能，则显示行号步骤
        if (isCodeFile || shouldAddLineNumbers) {
            steps.push(
                {
                    title: '添加行号显示',
                    description: '正在绘制行号区域和分隔线...',
                    icon: 'ti-list-numbers',
                    duration: 1400,
                    progress: 50,
                    color: 'list-numbers'
                }
            );
        }

        // 添加内容渲染步骤
        if (isCodeFile) {
            steps.push(
                {
                    title: '渲染代码内容',
                    description: '正在绘制代码文本和语法高亮...',
                    icon: 'ti-code',
                    duration: 1600,
                    progress: 70,
                    color: 'code'
                }
            );
        } else {
            steps.push(
                {
                    title: '渲染文本内容',
                    description: '正在绘制文本内容和格式排版...',
                    icon: 'ti-text-size',
                    duration: 1500,
                    progress: 70,
                    color: 'text-size'
                }
            );
        }

        steps.push(
            {
                title: '生成图片文件',
                description: '正在创建高质量的PNG格式图片...',
                icon: 'ti-download',
                duration: 1300,
                progress: 90,
                color: 'download'
            },
            {
                title: '截图生成完成',
                description: '所有步骤已完成，准备关闭窗口...',
                icon: 'ti-circle-check',
                duration: 1000,
                progress: 100,
                color: 'circle-check'
            }
        );

        return steps;
    }

    // 开始动画序列
    async startAnimationSequence() {
        console.log('开始动画序列，总步骤:', this.steps.length);
        
        try {
            // 启动进度条动画
            this.startProgressAnimation();
            
            // 执行所有步骤动画
            for (let i = 0; i < this.steps.length; i++) {
                await this.executeStep(i);
            }
            
            // 生成Canvas
            await this.generateCanvasInBackground();
            
        } catch (error) {
            console.error('动画序列出错:', error);
            this.handleAnimationError(error);
        }
    }

    // 新增：调试模式动画序列
    async startDebugAnimationSequence() {
        console.log('开始调试动画序列，总步骤:', this.steps.length);
        
        try {
            // 启动进度条动画
            this.startProgressAnimation();
            
            // 执行所有步骤动画
            for (let i = 0; i < this.steps.length; i++) {
                await this.executeStep(i);
            }
            
            // 调试模式下不生成实际文件，直接显示完成
            await this.showDebugCompletion();
            
        } catch (error) {
            console.error('调试动画序列出错:', error);
            this.handleAnimationError(error);
        }
    }

    // 启动进度条动画
    startProgressAnimation() {
        let currentProgress = 0;
        const totalDuration = this.steps.reduce((total, step) => total + step.duration, 0);
        const increment = 100 / totalDuration * 50;
        
        this.progressInterval = setInterval(() => {
            currentProgress = Math.min(currentProgress + increment, 100);
            this.updateProgressBar(currentProgress);
            
            if (currentProgress >= 100) {
                clearInterval(this.progressInterval);
            }
        }, 50);
    }

    // 更新进度条 - 移除硬编码颜色切换
    updateProgressBar(progress) {
        const progressFill = document.getElementById('graphicProgressFill');
        const progressPercentage = document.getElementById('progressPercentageGraphic');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
            // 移除了硬编码的颜色切换，使用CSS渐变
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress)}%`;
            progressPercentage.style.left = `${progress}%`;
        }
    }

    // 在后台生成Canvas
    async generateCanvasInBackground() {
        return new Promise(async (resolve, reject) => {
            try {
                const fileData = window.fileManager?.findFileById(window.scrollManager?.currentFileId);
                if (!fileData) {
                    throw new Error('未找到文件数据');
                }

                // 检查是否启用了"非代码文件添加行号"功能
                const shouldAddLineNumbers = this.isCodeFile ? true : window.codeScreenshotManager?.addLineNumbers || false;
                
                console.log('开始在后台生成Canvas', { isCodeFile: this.isCodeFile, shouldAddLineNumbers });
                this.finalCanvas = await window.codeScreenshotRenderer.createScreenshotCanvas(
                    fileData, 
                    shouldAddLineNumbers
                );
                console.log('Canvas生成完成');
                
                // 保存文件
                if (this.finalCanvas) {
                    window.codeScreenshotRenderer.saveCanvasImage(this.finalCanvas, fileData.name);
                }
                
                resolve(this.finalCanvas);
                
            } catch (error) {
                console.error('Canvas生成失败:', error);
                reject(error);
            }
        });
    }

    // 执行单个步骤
    async executeStep(stepIndex) {
        return new Promise((resolve) => {
            const step = this.steps[stepIndex];
            console.log(`执行步骤 ${stepIndex + 1}: ${step.title}`);
            
            // 更新步骤显示
            this.updateStepDisplay(stepIndex);
            
            // 设置步骤完成后的回调
            const timeoutId = setTimeout(() => {
                this.currentStep = stepIndex + 1;
                console.log(`步骤 ${stepIndex + 1} 完成`);
                resolve();
            }, step.duration);
            
            this.animationTimeouts.push(timeoutId);
        });
    }

    // 更新步骤显示 - 修复标题跳动
    updateStepDisplay(stepIndex) {
        const step = this.steps[stepIndex];
        const graphicDisplay = document.getElementById('graphicDisplay');
        const stepTitle = document.getElementById('stepTitleGraphic');
        const stepDescription = document.getElementById('stepDescriptionGraphic');
        
        if (graphicDisplay) {
            // 图形切换动画
            graphicDisplay.style.animation = 'graphicFadeOut 0.4s ease-out forwards';
            
            setTimeout(() => {
                graphicDisplay.innerHTML = this.createStepGraphic(stepIndex);
                graphicDisplay.style.animation = 'graphicFadeIn 0.5s ease-out forwards';
            }, 400);
        }
        
        if (stepTitle) {
            // 使用平滑的文本更新，避免布局跳动
            stepTitle.textContent = step.title;
            stepTitle.style.animation = 'textSlideUp 0.4s ease-out';
        }
        
        if (stepDescription) {
            stepDescription.textContent = step.description;
            stepDescription.style.animation = 'textSlideUp 0.4s ease-out 0.1s both';
        }
        
        // 更新步骤指示器
        this.updateStepIndicator(stepIndex);
    }

    // 更新步骤指示器
    updateStepIndicator(stepIndex) {
        const stepDots = document.querySelectorAll('.step-dot-graphic');
        
        // 更新步骤点状态
        stepDots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index === stepIndex) {
                dot.classList.add('active');
            } else if (index < stepIndex) {
                dot.classList.add('completed');
            }
        });
        
        // 如果是最后一步，显示完成动画
        if (stepIndex === this.steps.length - 1) {
            if (this.isDebugMode) {
                this.showDebugCompletion();
            } else {
                this.showCompletionAnimation();
            }
        }
    }

    // 新增：调试模式完成动画
    async showDebugCompletion() {
        console.log('显示调试完成动画');
        
        // 清除进度条间隔
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // 确保进度条显示100%
        this.updateProgressBar(100);
        
        const stepDescription = document.getElementById('stepDescriptionGraphic');
        if (stepDescription) {
            stepDescription.textContent = '调试模式：动画播放完成，2秒后关闭';
            stepDescription.style.color = '#f59e0b';
            stepDescription.style.fontWeight = '600';
        }
        
        // 显示调试消息
        Utils.showMessage('调试动画播放完成', 'info');
        
        console.log('等待2秒后关闭窗口...');
        
        // 等待2秒后关闭
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('关闭调试窗口');
        
        // 关闭弹窗
        this.closeDownloadAnimation();
    }

    // 显示完成动画
    async showCompletionAnimation() {
        console.log('显示完成动画');
        
        // 清除进度条间隔
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // 确保进度条显示100%
        this.updateProgressBar(100);
        
        const stepDescription = document.getElementById('stepDescriptionGraphic');
        if (stepDescription) {
            stepDescription.textContent = '即将关闭此窗口，请勿刷新页面';
            stepDescription.style.color = '#10b981';
            stepDescription.style.fontWeight = '600';
        }
        
        // 显示成功消息
        Utils.showMessage('截图保存成功', 'success');
        
        console.log('等待2秒后关闭窗口...');
        
        // 等待2秒后关闭
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('关闭所有窗口');
        
        // 关闭弹窗
        this.closeDownloadAnimation();
        
        // 通知预览器关闭所有窗口
        if (window.codeScreenshotPreview) {
            await window.codeScreenshotPreview.closeAllModals();
        }
    }

    // 处理动画错误
    handleAnimationError(error) {
        console.error('动画过程出错:', error);
        Utils.showMessage('截图生成失败: ' + error.message, 'error');
        this.closeDownloadAnimation();
    }

    // 关闭下载动画弹窗
    closeDownloadAnimation() {
        console.log('关闭下载动画弹窗');
        
        // 清除所有超时和间隔
        this.animationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.animationTimeouts = [];
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        this.isAnimating = false;
        this.currentStep = 0;
        this.finalCanvas = null;
        this.isDebugMode = false;
        
        // 移除DOM元素
        if (this.animationModal && this.animationModal.parentNode) {
            this.animationModal.remove();
            this.animationModal = null;
        } else {
            const modal = document.getElementById('downloadAnimationModal');
            if (modal && modal.parentNode) {
                modal.remove();
            }
        }
    }

    // 显示下载进度弹窗
    showDownloadProgressModal() {
        this.closeDownloadProgressModal();

        const modalHtml = `
            <div class="screenshot-modal-overlay code-screenshot-tool" id="downloadProgressModal">
                <div class="screenshot-preview-modal download-progress-modal">
                    <div class="download-progress-container">
                        <h3 class="screenshot-controls-title">
                            <i class="ti ti-download"></i>
                            生成代码截图
                        </h3>
                        
                        <div class="graphic-step-container">
                            <div class="graphic-display">
                                ${this.createStepGraphic(1)}
                            </div>
                            
                            <div class="graphic-step-info">
                                <div class="step-title-graphic">正在绘制背景</div>
                                <div class="step-description-graphic">渲染代码背景和边框</div>
                                
                                <div class="progress-indicator-container">
                                    <div class="graphic-progress-container">
                                        <div class="graphic-progress-bar">
                                            <div class="graphic-progress-fill" style="width: 0%"></div>
                                            <div class="progress-percentage-graphic">0%</div>
                                        </div>
                                    </div>
                                    
                                    <div class="graphic-step-indicator">
                                        <div class="step-dots-graphic">
                                            <div class="step-dot-graphic active"></div>
                                            <div class="step-dot-graphic"></div>
                                            <div class="step-dot-graphic"></div>
                                            <div class="step-dot-graphic"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.downloadModal = document.getElementById('downloadProgressModal');
        
        // 阻止蒙版点击关闭
        this.downloadModal.addEventListener('click', (e) => {
            if (e.target === this.downloadModal) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
    }

    // 更新下载进度
    updateDownloadProgress(stepName, progress) {
        const steps = ['正在绘制背景', '正在绘制行号', '正在绘制代码', '正在保存文件'];
        const currentStepIndex = steps.findIndex(step => step === stepName);
        
        if (currentStepIndex >= 0) {
            this.updateStepDisplay(currentStepIndex + 1); // +1 因为第一个是初始化步骤
            this.updateProgressBar(progress * 100);
        }
    }

    // 关闭下载进度弹窗
    async closeDownloadProgressModal() {
        if (!this.downloadModal) {
            const modal = document.getElementById('downloadProgressModal');
            if (modal && modal.parentNode) {
                modal.remove();
            }
            return;
        }
        
        if (this.downloadModal.parentNode) {
            this.downloadModal.remove();
        }
        
        this.downloadModal = null;
    }

    // 强制停止动画
    forceStopAnimation() {
        this.closeDownloadAnimation();
        this.closeDownloadProgressModal();
    }

    // 检查是否正在动画中
    isAnimationRunning() {
        return this.isAnimating;
    }
}

// 创建全局代码截图动画实例
window.codeScreenshotAnimation = new CodeScreenshotAnimation();

console.log('代码截图动画系统已加载');