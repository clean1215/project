// 代码截图预览管理类
class CodeScreenshotPreview {
    constructor() {
        this.previewModal = null;
        this.currentZoom = 1.0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.escHandler = null;
        this.overlayClickHandler = null;
        this.currentFileName = null;
        this.isClosing = false;
        this.isCreating = false;
        this.pendingClose = false;
        this.isProcessing = false;
    }

    // 显示预览弹窗
    showPreviewModal(canvas, fileName) {
        console.log('显示预览弹窗 - 开始', fileName);
        
        // 设置创建状态
        this.isCreating = true;
        this.isProcessing = false;
        this.pendingClose = false;
        this.isClosing = false;
        
        // 先完全关闭所有现有弹窗
        this.closeAllModals();
        
        // 重置状态
        this.currentZoom = 1.0;
        this.isDragging = false;
        this.currentFileName = fileName;
        
        // 确保使用当前样式配置
        const currentConfig = window.codeScreenshotRenderer.getStyleConfig();
        console.log('当前样式配置:', currentConfig);
        
        // 修复颜色格式问题
        const fixedConfig = this.fixColorConfig(currentConfig);
        
        // 获取当前主题
        const currentTheme = window.themeManager?.getCurrentTheme() || 'light';
        const isDarkTheme = currentTheme === 'dark';
        
        // 判断文件类型
        const isCodeFile = window.codeScreenshotRenderer.isCodeFile(fileName);
        const subtitleText = isCodeFile ? '自定义您的代码截图样式' : '自定义您的文本截图样式';
        
        // 创建预览弹窗HTML
        const modalHtml = `
            <div class="screenshot-modal-overlay code-screenshot-tool" id="screenshotPreviewModal">
                <div class="screenshot-preview-modal ${isDarkTheme ? 'dark-theme' : 'light-theme'}">
                    <div class="screenshot-preview-container">
                        <!-- 左侧截图预览区域 -->
                        <div class="screenshot-preview-left">
                            <div class="screenshot-preview-image-container" id="previewImageContainer">
                                <img src="${canvas.toDataURL('image/png')}" alt="代码截图预览" class="screenshot-preview-image" id="previewImage" style="transform: scale(1);">
                            </div>
                        </div>
                        
                        <!-- 右侧控制区域 -->
                        <div class="screenshot-preview-right ${isDarkTheme ? 'dark-theme' : 'light-theme'}">
                            <div class="screenshot-controls-header">
                                <h3 class="screenshot-controls-title">
                                    <i class="ti ti-settings"></i>
                                    截图设置
                                </h3>
                                <p class="screenshot-controls-subtitle">${subtitleText}</p>
                            </div>
                            
                            <div class="screenshot-controls-content">
                                <!-- 缩放控制 -->
                                <div class="zoom-controls">
                                    <button class="zoom-btn" id="zoomOutPreview" title="缩小" type="button">
                                        <i class="ti ti-zoom-out"></i>
                                    </button>
                                    <div class="zoom-display" id="zoomDisplay">100%</div>
                                    <button class="zoom-btn" id="zoomInPreview" title="放大" type="button">
                                        <i class="ti ti-zoom-in"></i>
                                    </button>
                                    <button class="zoom-btn zoom-reset" id="zoomReset" title="重置缩放" type="button">
                                        <i class="ti ti-refresh"></i>
                                    </button>
                                </div>
                                
                                <div class="control-group">
                                    <h4><i class="ti ti-palette"></i>背景颜色</h4>
                                    <div class="control-row">
                                        <span class="control-label">外框背景:</span>
                                        <input type="color" class="color-picker" id="outerBgColor" value="${fixedConfig.outerBackground}">
                                    </div>
                                    <div class="control-row">
                                        <span class="control-label">内框背景:</span>
                                        <input type="color" class="color-picker" id="innerBgColor" value="${fixedConfig.innerBackground}">
                                    </div>
                                </div>
                                
                                <div class="control-group">
                                    <h4><i class="ti ti-typography"></i>文字样式</h4>
                                    <div class="control-row">
                                        <span class="control-label">文字颜色:</span>
                                        <input type="color" class="color-picker" id="textColor" value="${fixedConfig.textColor}">
                                    </div>
                                    <div class="control-row">
                                        <span class="control-label">行号颜色:</span>
                                        <input type="color" class="color-picker" id="lineNumberColor" value="${fixedConfig.lineNumberColor}">
                                    </div>
                                    <div class="control-row">
                                        <span class="control-label">字体:</span>
                                        <select class="font-select" id="fontFamily">
                                            <option value="'Monaco', 'Menlo', 'Ubuntu Mono', monospace">Monaco</option>
                                            <option value="'Courier New', Courier, monospace">Courier New</option>
                                            <option value="'Consolas', 'Monaco', monospace">Consolas</option>
                                            <option value="'SF Mono', Monaco, monospace">SF Mono</option>
                                            <option value="'Fira Code', monospace">Fira Code</option>
                                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                            <option value="'Microsoft YaHei', '微软雅黑', sans-serif">微软雅黑</option>
                                            <option value="'PingFang SC', 'Helvetica Neue', sans-serif">苹方</option>
                                            <option value="'Hiragino Sans GB', 'STHeiti', sans-serif">冬青黑体</option>
                                            <option value="'Source Han Sans CN', 'Noto Sans CJK SC', sans-serif">思源黑体</option>
                                        </select>
                                    </div>
                                    <div class="control-row">
                                        <span class="control-label">字号:</span>
                                        <select class="font-select" id="fontSize">
                                            <option value="12">12px</option>
                                            <option value="14">14px</option>
                                            <option value="16">16px</option>
                                            <option value="18">18px</option>
                                            <option value="20">20px</option>
                                            <option value="22">22px</option>
                                            <option value="24">24px</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="preview-actions">
                                <div class="action-buttons">
                                    <button class="btn btn-danger touch-feedback close-preview-btn" id="closePreviewModal" type="button">
                                        <i class="ti ti-x"></i>
                                        取消
                                    </button>
                                    <button class="btn btn-default touch-feedback" id="resetConfig" type="button">
                                        <i class="ti ti-refresh"></i>
                                        恢复默认
                                    </button>
                                    <button class="btn btn-secondary touch-feedback" id="refreshPreview" type="button">
                                        <i class="ti ti-reload"></i>
                                        刷新预览
                                    </button>
                                </div>
                                <button class="btn btn-success touch-feedback" id="saveScreenshot" type="button">
                                    <i class="ti ti-download"></i>
                                    保存截图
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 重要修复：确保正确获取DOM引用
        this.previewModal = document.getElementById('screenshotPreviewModal');
        console.log('预览弹窗DOM引用:', this.previewModal);
        
        if (!this.previewModal) {
            console.error('错误：无法找到预览弹窗DOM元素');
            this.isCreating = false;
            return;
        }
        
        // 设置控件初始值 - 使用修复后的配置
        this.initializeControlValues(fixedConfig);
        
        // 绑定事件
        this.bindPreviewEvents();
        
        // 设置拖拽功能
        this.setupDragScroll();

        // 完成创建
        this.isCreating = false;
        console.log('预览弹窗显示完成');

        // 检查是否有待处理的关闭请求
        if (this.pendingClose) {
            console.log('执行待处理的关闭请求');
            this.pendingClose = false;
            this.closePreviewModal();
        }
    }

    // 修复颜色配置格式
    fixColorConfig(config) {
        const fixedConfig = { ...config };
        
        // 将 rgba 格式转换为 hex 格式
        if (fixedConfig.lineNumberColor && fixedConfig.lineNumberColor.startsWith('rgba')) {
            // 将 rgba(255, 255, 255, 0.4) 转换为 #666666
            fixedConfig.lineNumberColor = this.rgbaToHex(fixedConfig.lineNumberColor);
        }
        
        // 确保其他颜色也是有效的 hex 格式
        if (fixedConfig.outerBackground && !fixedConfig.outerBackground.startsWith('#')) {
            fixedConfig.outerBackground = '#2c3e50';
        }
        if (fixedConfig.innerBackground && !fixedConfig.innerBackground.startsWith('#')) {
            fixedConfig.innerBackground = '#1a1b23';
        }
        if (fixedConfig.textColor && !fixedConfig.textColor.startsWith('#')) {
            fixedConfig.textColor = '#eceff1';
        }
        
        console.log('修复后的颜色配置:', fixedConfig);
        return fixedConfig;
    }

    // 将 rgba 转换为 hex
    rgbaToHex(rgba) {
        try {
            const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const a = match[4] ? parseFloat(match[4]) : 1;
                
                // 根据透明度调整颜色亮度
                const adjustedR = Math.round(r * a + 255 * (1 - a));
                const adjustedG = Math.round(g * a + 255 * (1 - a));
                const adjustedB = Math.round(b * a + 255 * (1 - a));
                
                return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
            }
        } catch (error) {
            console.error('颜色转换失败:', error);
        }
        
        // 默认返回灰色
        return '#666666';
    }

    // 初始化控件值
    initializeControlValues(config) {
        console.log('初始化控件值:', config);
        
        const controls = {
            'outerBgColor': config.outerBackground,
            'innerBgColor': config.innerBackground,
            'textColor': config.textColor,
            'lineNumberColor': config.lineNumberColor,
            'fontFamily': config.fontFamily,
            'fontSize': config.fontSize.toString()
        };
        
        Object.keys(controls).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = controls[id];
                console.log(`设置 ${id}: ${controls[id]}`);
            } else {
                console.warn(`元素 ${id} 未找到`);
            }
        });
        
        // 更新缩放显示
        const zoomDisplay = document.getElementById('zoomDisplay');
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
        }
    }

    // 设置拖拽滚动功能
    setupDragScroll() {
        const container = document.getElementById('previewImageContainer');
        const image = document.getElementById('previewImage');
        
        if (!container || !image) return;
        
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let scrollLeft = 0;
        let scrollTop = 0;
        
        const startDrag = (e) => {
            if (this.currentZoom > 1.0) {
                isDragging = true;
                startX = e.pageX - container.offsetLeft;
                startY = e.pageY - container.offsetTop;
                scrollLeft = container.scrollLeft;
                scrollTop = container.scrollTop;
                container.style.cursor = 'grabbing';
                
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        const doDrag = (e) => {
            if (!isDragging) return;
            
            const x = e.pageX - container.offsetLeft;
            const y = e.pageY - container.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            
            container.scrollLeft = scrollLeft - walkX;
            container.scrollTop = scrollTop - walkY;
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        const stopDrag = (e) => {
            isDragging = false;
            container.style.cursor = this.currentZoom > 1.0 ? 'grab' : 'default';
            
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // 鼠标事件
        container.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        
        // 更新光标样式
        container.style.cursor = this.currentZoom > 1.0 ? 'grab' : 'default';
    }

    // 绑定预览事件
    bindPreviewEvents() {
        console.log('绑定预览事件');
        
        // 直接绑定每个按钮的事件
        this.bindButtonEvents();
        
        // 绑定颜色选择器变化事件
        this.bindColorPickerEvents();
        
        // 绑定字体选择器变化事件
        this.bindFontEvents();
        
        // 绑定缩放按钮事件
        this.bindZoomEvents();
        
        // ESC键关闭
        this.bindKeyboardEvents();
        
        // 点击模态框外部关闭
        this.bindOverlayEvents();
    }

    // 绑定按钮事件 - 修复版本
    bindButtonEvents() {
        console.log('绑定按钮事件 - 开始');
        
        // 关闭按钮 - 确保正确绑定
        const closeButton = document.getElementById('closePreviewModal');
        if (closeButton) {
            console.log('找到关闭按钮，重新绑定事件');
            // 移除现有事件监听器并重新绑定
            closeButton.onclick = null; // 清除旧事件
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('取消按钮被点击 - 立即关闭');
                this.closePreviewModal();
            });
        } else {
            console.error('错误：未找到关闭按钮');
        }

        // 保存截图按钮
        const saveButton = document.getElementById('saveScreenshot');
        if (saveButton) {
            saveButton.onclick = null; // 清除旧事件
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('保存截图按钮被点击');
                this.saveScreenshotWithAnimation();
            });
        }

        // 恢复默认配置按钮
        const resetButton = document.getElementById('resetConfig');
        if (resetButton) {
            resetButton.onclick = null;
            resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('恢复默认配置按钮被点击');
                this.resetPreviewToDefault();
            });
        }

        // 刷新预览按钮
        const refreshButton = document.getElementById('refreshPreview');
        if (refreshButton) {
            refreshButton.onclick = null;
            refreshButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('刷新预览按钮被点击');
                this.refreshPreview();
            });
        }
        
        console.log('按钮事件绑定完成');
    }

    // 绑定颜色选择器事件
    bindColorPickerEvents() {
        const colorInputs = ['outerBgColor', 'innerBgColor', 'textColor', 'lineNumberColor'];
        colorInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('change', (e) => {
                    const config = {};
                    const configKey = inputId === 'outerBgColor' ? 'outerBackground' :
                                    inputId === 'innerBgColor' ? 'innerBackground' :
                                    inputId === 'textColor' ? 'textColor' : 'lineNumberColor';
                    config[configKey] = e.target.value;
                    console.log('颜色配置更新:', config);
                    this.updateStyleConfig(config);
                    this.refreshPreview();
                });
            }
        });
    }

    // 绑定字体事件
    bindFontEvents() {
        const fontFamilySelect = document.getElementById('fontFamily');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                console.log('字体更新:', e.target.value);
                this.updateStyleConfig({ fontFamily: e.target.value });
                this.refreshPreview();
            });
        }

        const fontSizeSelect = document.getElementById('fontSize');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                console.log('字号更新:', e.target.value);
                this.updateStyleConfig({ fontSize: parseInt(e.target.value) });
                this.refreshPreview();
            });
        }
    }

    // 绑定缩放事件
    bindZoomEvents() {
        const zoomInButton = document.getElementById('zoomInPreview');
        if (zoomInButton) {
            zoomInButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.zoomPreviewImage(0.1);
            });
        }

        const zoomOutButton = document.getElementById('zoomOutPreview');
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.zoomPreviewImage(-0.1);
            });
        }

        const zoomResetButton = document.getElementById('zoomReset');
        if (zoomResetButton) {
            zoomResetButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.resetZoom();
            });
        }
    }

    // 绑定键盘事件
    bindKeyboardEvents() {
        this.escHandler = (e) => {
            if (e.key === 'Escape' && !this.isClosing && !this.isCreating && !this.isProcessing) {
                console.log('ESC键被按下，关闭预览');
                e.preventDefault();
                e.stopPropagation();
                this.closePreviewModal();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    // 绑定遮罩层事件 - 修改：添加点击外部关闭功能
    bindOverlayEvents() {
        this.overlayClickHandler = (e) => {
            // 检查点击的是否是模态框外部（遮罩层）
            if (e.target === this.previewModal && !this.isClosing && !this.isCreating && !this.isProcessing) {
                console.log('点击外部关闭预览');
                this.closePreviewModal();
            }
        };
        if (this.previewModal) {
            this.previewModal.addEventListener('click', this.overlayClickHandler);
        }
    }

    // 更新样式配置
    updateStyleConfig(config) {
        console.log('更新样式配置:', config);
        if (window.codeScreenshotRenderer) {
            window.codeScreenshotRenderer.updateStyleConfig(config);
            if (window.codeScreenshotManager) {
                window.codeScreenshotManager.saveStyleConfig();
            }
        }
    }

    // 恢复默认配置并刷新预览
    async resetPreviewToDefault() {
        console.log('恢复默认配置');
        if (!window.codeScreenshotRenderer) {
            console.error('截图渲染器未初始化');
            return;
        }
        
        const defaultConfig = window.codeScreenshotRenderer.resetToDefaultConfig();
        console.log('默认配置:', defaultConfig);
        
        // 修复颜色格式
        const fixedConfig = this.fixColorConfig(defaultConfig);
        
        // 更新界面控件值
        this.initializeControlValues(fixedConfig);
        
        // 刷新预览
        await this.refreshPreview();
        
        Utils.showMessage('已恢复默认配置', 'success');
    }

    // 缩放预览图片
    zoomPreviewImage(delta) {
        this.currentZoom += delta;
        
        // 限制缩放范围
        this.currentZoom = Math.max(0.1, Math.min(3.0, this.currentZoom));
        
        const image = document.getElementById('previewImage');
        const zoomDisplay = document.getElementById('zoomDisplay');
        const container = document.getElementById('previewImageContainer');
        
        if (image) image.style.transform = `scale(${this.currentZoom})`;
        if (zoomDisplay) zoomDisplay.textContent = `${Math.round(this.currentZoom * 100)}%`;
        
        // 更新拖拽光标
        if (container) {
            container.style.cursor = this.currentZoom > 1.0 ? 'grab' : 'default';
        }
    }

    // 重置缩放
    resetZoom() {
        this.currentZoom = 1.0;
        const image = document.getElementById('previewImage');
        const zoomDisplay = document.getElementById('zoomDisplay');
        const container = document.getElementById('previewImageContainer');
        
        if (image) image.style.transform = `scale(${this.currentZoom})`;
        if (zoomDisplay) zoomDisplay.textContent = `${Math.round(this.currentZoom * 100)}%`;
        
        // 重置拖拽光标
        if (container) {
            container.style.cursor = 'default';
        }
    }

    // 刷新预览
    async refreshPreview() {
        console.log('刷新预览');
        const fileData = window.fileManager?.findFileById(window.scrollManager?.currentFileId);
        if (!fileData) {
            Utils.showMessage('未找到文件数据', 'error');
            return;
        }

        const isCode = window.codeScreenshotRenderer.isCodeFile(fileData.name);
        const shouldAddLineNumbers = isCode ? true : window.codeScreenshotManager.addLineNumbers;

        try {
            console.log('开始创建新截图');
            const newCanvas = await window.codeScreenshotRenderer.createScreenshotCanvas(fileData, shouldAddLineNumbers);
            const image = document.getElementById('previewImage');
            if (image) {
                image.src = newCanvas.toDataURL('image/png');
                image.style.transform = `scale(${this.currentZoom})`;
                console.log('预览图片已更新');
            }
            
            Utils.showMessage('预览已更新', 'success');
        } catch (error) {
            console.error('刷新预览失败:', error);
            Utils.showMessage('刷新预览失败: ' + error.message, 'error');
        }
    }

    // 保存截图并显示动画 - 使用动画管理器
    async saveScreenshotWithAnimation() {
        console.log('开始保存截图流程 - 使用动画');
        
        // 检查是否正在处理中
        if (this.isProcessing) {
            console.log('已有截图正在处理中，忽略本次请求');
            return;
        }
        
        this.isProcessing = true;
        
        try {
            const fileData = window.fileManager?.findFileById(window.scrollManager?.currentFileId);
            if (!fileData) {
                throw new Error('未找到文件数据');
            }

            const isCode = window.codeScreenshotRenderer.isCodeFile(fileData.name);
            
            // 使用动画管理器显示下载动画
            if (window.codeScreenshotAnimation) {
                window.codeScreenshotAnimation.showDownloadAnimation(fileData.name, isCode);
            } else {
                // 备用方案：直接保存
                console.warn('动画管理器未找到，直接保存');
                const shouldAddLineNumbers = isCode ? true : window.codeScreenshotManager.addLineNumbers;
                const finalCanvas = await window.codeScreenshotRenderer.createScreenshotCanvas(fileData, shouldAddLineNumbers);
                window.codeScreenshotRenderer.saveCanvasImage(finalCanvas, fileData.name);
            }
            
        } catch (error) {
            console.error('保存截图失败:', error);
            Utils.showMessage('保存失败: ' + error.message, 'error');
        } finally {
            // 重置处理状态
            this.isProcessing = false;
            
            // 关闭预览弹窗
            try {
                await this.closePreviewModal();
                console.log('预览弹窗关闭完成');
            } catch (closeError) {
                console.error('关闭预览弹窗失败:', closeError);
            }
        }
    }

    // 关闭预览弹窗 - 修复无限循环版本
    async closePreviewModal() {
        console.log('关闭预览弹窗 - 开始', {
            isCreating: this.isCreating,
            isProcessing: this.isProcessing,
            isClosing: this.isClosing,
            previewModal: !!this.previewModal
        });
        
        return new Promise((resolve) => {
            // 如果正在创建，等待创建完成
            if (this.isCreating) {
                console.log('弹窗正在创建中，标记为待关闭');
                this.pendingClose = true;
                setTimeout(() => {
                    this.closePreviewModal().then(resolve);
                }, 200);
                return;
            }
            
            // 如果正在处理中，等待处理完成，但设置超时保护
            if (this.isProcessing) {
                console.log('截图正在处理中，等待处理完成');
                // 设置超时保护，避免无限等待
                const startTime = Date.now();
                const checkProcessing = () => {
                    if (!this.isProcessing || Date.now() - startTime > 10000) { // 10秒超时
                        console.log('处理完成或超时，继续关闭');
                        this.isProcessing = false; // 强制重置状态
                        this.closePreviewModal().then(resolve);
                    } else {
                        setTimeout(checkProcessing, 100);
                    }
                };
                setTimeout(checkProcessing, 100);
                return;
            }
            
            if (this.isClosing) {
                console.log('已经在关闭过程中，忽略重复请求');
                resolve();
                return;
            }
            
            this.isClosing = true;
            console.log('开始关闭预览弹窗流程');
            
            // 移除事件监听器
            if (this.escHandler) {
                document.removeEventListener('keydown', this.escHandler);
                this.escHandler = null;
            }
            
            if (this.overlayClickHandler && this.previewModal) {
                this.previewModal.removeEventListener('click', this.overlayClickHandler);
                this.overlayClickHandler = null;
            }
            
            // 关闭主预览弹窗
            if (this.previewModal) {
                console.log('找到预览弹窗DOM，开始移除');
                
                // 直接移除DOM，不依赖动画
                if (this.previewModal.parentNode) {
                    console.log('从父节点移除预览弹窗');
                    this.previewModal.remove();
                    this.previewModal = null;
                    console.log('预览弹窗已移除');
                } else {
                    console.log('预览弹窗没有父节点，直接设为null');
                    this.previewModal = null;
                }
            } else {
                console.log('预览弹窗DOM引用为null，尝试通过选择器查找');
                // 备用方案：通过选择器查找并移除
                const modal = document.getElementById('screenshotPreviewModal');
                if (modal && modal.parentNode) {
                    console.log('通过选择器找到弹窗，直接移除');
                    modal.remove();
                }
            }
            
            // 重置所有状态
            this.currentZoom = 1.0;
            this.isDragging = false;
            this.currentFileName = null;
            this.isClosing = false;
            this.pendingClose = false;
            // 重要：确保处理状态被重置
            this.isProcessing = false;
            
            console.log('预览弹窗关闭完成');
            resolve();
        });
    }

    // 关闭所有弹窗 - 增强版本
    closeAllModals() {
        console.log('关闭所有截图弹窗');
        
        // 重置状态
        this.isProcessing = false;
        this.isCreating = false;
        this.pendingClose = false;
        this.isClosing = false;
        
        // 关闭预览弹窗
        this.closePreviewModal();
        
        // 清理可能残留的弹窗元素
        const modals = document.querySelectorAll('.screenshot-modal-overlay');
        let removedCount = 0;
        modals.forEach(modal => {
            if (modal.parentNode) {
                console.log('清理残留弹窗:', modal.id || modal.className);
                modal.remove();
                removedCount++;
            }
        });
        
        console.log(`清理了 ${removedCount} 个残留弹窗`);
        
        // 重置DOM引用
        this.previewModal = null;
    }
}

// 创建全局代码截图预览实例
window.codeScreenshotPreview = new CodeScreenshotPreview();