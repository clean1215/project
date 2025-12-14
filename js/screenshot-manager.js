// 代码截图功能管理类
class CodeScreenshotManager {
    constructor() {
        this.addLineNumbers = false;
        this.screenshotButton = null;
        this.isProcessing = false;
        
        // 确保在DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    init() {
        console.log('初始化代码截图管理器');
        this.loadSettings();
        this.createSettingsSwitch();
        this.setupModalObserver();
        this.setupGlobalClickListener();
        this.loadStyleConfig();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('codeScreenshot_addLineNumbers');
            this.addLineNumbers = saved === 'true';
            console.log('加载设置 - 添加行号:', this.addLineNumbers);
        } catch (error) {
            console.error('加载设置失败:', error);
            this.addLineNumbers = false;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('codeScreenshot_addLineNumbers', this.addLineNumbers.toString());
            console.log('保存设置 - 添加行号:', this.addLineNumbers);
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    loadStyleConfig() {
        try {
            const saved = localStorage.getItem('codeScreenshot_styleConfig');
            if (saved && window.codeScreenshotRenderer) {
                const config = JSON.parse(saved);
                window.codeScreenshotRenderer.updateStyleConfig(config);
                console.log('加载样式配置成功');
            }
        } catch (error) {
            console.error('加载样式配置失败:', error);
        }
    }

    saveStyleConfig() {
        try {
            if (window.codeScreenshotRenderer) {
                const config = window.codeScreenshotRenderer.getStyleConfig();
                localStorage.setItem('codeScreenshot_styleConfig', JSON.stringify(config));
                console.log('保存样式配置成功');
            }
        } catch (error) {
            console.error('保存样式配置失败:', error);
        }
    }

    updateStyleConfig(config) {
        if (window.codeScreenshotRenderer) {
            window.codeScreenshotRenderer.updateStyleConfig(config);
            this.saveStyleConfig();
        }
    }

    createSettingsSwitch() {
        const createSwitch = () => {
            const settingsCard = document.querySelector('.settings-card:first-child');
            if (settingsCard && !document.getElementById('lineNumbersSwitch')) {
                console.log('创建设置开关');
                const switchHtml = `
                    <div class="setting-item code-screenshot-tool" style="margin-top: 20px;">
                        <div class="setting-label">
                            <i class="ti ti-list-numbers"></i>
                            <span>非代码文件截图时添加行号</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="lineNumbersSwitch" ${this.addLineNumbers ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = switchHtml;
                settingsCard.appendChild(tempDiv.firstElementChild);

                const switchElement = document.getElementById('lineNumbersSwitch');
                if (switchElement) {
                    switchElement.addEventListener('change', (e) => {
                        this.addLineNumbers = e.target.checked;
                        this.saveSettings();
                        Utils.showMessage(`非代码文件截图行号功能已${this.addLineNumbers ? '开启' : '关闭'}`, 'success');
                    });
                }
            }
        };

        // 延迟创建，确保DOM已加载
        setTimeout(createSwitch, 2000);
    }

    setupModalObserver() {
        console.log('设置模态框观察器');
        let isButtonAttached = false;
        
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const modal = document.getElementById('fileModal');
                    if (modal && modal.classList.contains('active') && !isButtonAttached) {
                        console.log('检测到文件模态框打开，附加截图处理器');
                        setTimeout(() => {
                            this.attachScreenshotHandler();
                            isButtonAttached = true;
                        }, 500);
                    } else if (modal && !modal.classList.contains('active')) {
                        console.log('文件模态框关闭，重置状态');
                        isButtonAttached = false;
                        this.screenshotButton = null;
                        this.isProcessing = false;
                    }
                }
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupGlobalClickListener() {
        console.log('设置全局点击监听器');
        
        this.globalClickHandler = (e) => {
            // 检查是否点击了截图按钮
            const screenshotBtn = e.target.closest('#takeScreenshot');
            if (screenshotBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('截图按钮被点击');
                this.handleScreenshotClick(e);
                return;
            }
        };
        
        document.addEventListener('click', this.globalClickHandler, true);
    }

    attachScreenshotHandler() {
        console.log('附加截图处理器');
        const screenshotBtn = document.getElementById('takeScreenshot');
        
        if (screenshotBtn && screenshotBtn !== this.screenshotButton) {
            console.log('找到截图按钮，附加事件');
            this.screenshotButton = screenshotBtn;
            
            // 确保按钮有正确的样式和属性
            screenshotBtn.classList.add('screenshot-btn-active', 'code-screenshot-tool');
            screenshotBtn.style.cursor = 'pointer';
            screenshotBtn.style.position = 'relative';
            screenshotBtn.style.zIndex = '1000';
            
            console.log('截图按钮已附加事件处理器');
        } else if (!screenshotBtn) {
            console.warn('未找到截图按钮');
        }
    }

    // 处理截图点击事件 - 确保正确关闭
    async handleScreenshotClick(e) {
        console.log('处理截图点击事件');
        
        if (this.isProcessing) {
            console.log('正在处理中，忽略点击');
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        this.isProcessing = true;
        console.log('开始处理截图');
        
        const button = e.target.closest('#takeScreenshot');
        if (button) {
            button.classList.add('processing');
            button.disabled = true;
            console.log('按钮设置为处理状态');
        }
        
        try {
            // 先关闭任何可能存在的弹窗
            await this.closeAllModalsReliably();
            
            // 获取当前文件数据
            const fileId = window.scrollManager?.currentFileId;
            console.log('当前文件ID:', fileId);
            
            if (!fileId) {
                throw new Error('未找到当前文件ID');
            }
            
            const fileData = window.fileManager?.findFileById(fileId);
            console.log('文件数据:', fileData);
            
            if (fileData) {
                await this.generatePreviewScreenshot(fileData);
            } else {
                throw new Error('未找到文件数据');
            }
        } catch (error) {
            console.error('截图失败:', error);
            Utils.showMessage('截图失败: ' + error.message, 'error');
            
            // 出错时也要确保关闭所有弹窗
            await this.closeAllModalsReliably();
        } finally {
            if (button) {
                button.classList.remove('processing');
                button.disabled = false;
                console.log('按钮恢复可用状态');
            }
            this.isProcessing = false;
            console.log('截图处理完成');
        }
    }

    // 生成预览截图
    async generatePreviewScreenshot(fileData) {
        console.log('生成预览截图，文件:', fileData.name);
        Utils.showMessage('正在生成代码截图预览...', 'info');

        try {
            // 检查渲染器是否可用
            if (!window.codeScreenshotRenderer) {
                throw new Error('截图渲染器未初始化');
            }

            // 检查预览器是否可用
            if (!window.codeScreenshotPreview) {
                throw new Error('截图预览器未初始化');
            }

            const isCode = window.codeScreenshotRenderer.isCodeFile(fileData.name);
            const shouldAddLineNumbers = isCode ? true : this.addLineNumbers;

            console.log('文件类型判断:', {
                fileName: fileData.name,
                isCode: isCode,
                shouldAddLineNumbers: shouldAddLineNumbers
            });

            // 生成预览Canvas
            console.log('开始创建截图Canvas');
            const previewCanvas = await window.codeScreenshotRenderer.createScreenshotCanvas(fileData, shouldAddLineNumbers);
            console.log('截图Canvas创建成功');
            
            // 显示预览弹窗
            console.log('显示预览弹窗');
            window.codeScreenshotPreview.showPreviewModal(previewCanvas, fileData.name);
            
            console.log('预览弹窗显示完成');
            
        } catch (error) {
            console.error('生成预览失败:', error);
            throw new Error('生成预览失败: ' + error.message);
        }
    }

    // 可靠关闭所有弹窗
    async closeAllModalsReliably() {
        console.log('管理器：可靠关闭所有弹窗');
        
        // 通过预览器关闭
        if (window.codeScreenshotPreview) {
            try {
                await window.codeScreenshotPreview.closeDownloadProgressModal();
                await window.codeScreenshotPreview.closePreviewModal();
            } catch (error) {
                console.warn('通过预览器关闭失败:', error);
            }
        }
        
        // 直接DOM清理（备用方案）
        const modals = document.querySelectorAll(
            '.screenshot-modal-overlay, .download-progress-modal, .screenshot-preview-modal'
        );
        
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.remove();
            }
        });
        
        console.log('管理器：所有弹窗关闭完成');
    }

    // 强制关闭所有弹窗 - 增强版本
    forceCloseAllModals() {
        console.log('管理器：强制关闭所有截图弹窗');
        
        // 重置预览器状态
        if (window.codeScreenshotPreview) {
            window.codeScreenshotPreview.isProcessing = false;
            window.codeScreenshotPreview.isCreating = false;
            window.codeScreenshotPreview.pendingClose = false;
            window.codeScreenshotPreview.isClosing = false;
            
            // 直接调用关闭方法
            window.codeScreenshotPreview.closeDownloadProgressModal();
            window.codeScreenshotPreview.closePreviewModal();
        }
        
        // 移除所有相关DOM元素
        const modals = document.querySelectorAll(
            '.screenshot-modal-overlay, .download-progress-modal, .screenshot-preview-modal'
        );
        
        let closedCount = 0;
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.remove();
                closedCount++;
            }
        });
        
        console.log(`管理器：强制关闭了 ${closedCount} 个弹窗`);
    }

    // 恢复默认配置
    resetToDefaultConfig() {
        if (window.codeScreenshotRenderer) {
            const defaultConfig = window.codeScreenshotRenderer.resetToDefaultConfig();
            this.saveStyleConfig();
            Utils.showMessage('已恢复默认配置', 'success');
            return defaultConfig;
        }
        return null;
    }

    // 获取当前设置
    getSettings() {
        return {
            addLineNumbers: this.addLineNumbers,
            styleConfig: window.codeScreenshotRenderer ? window.codeScreenshotRenderer.getStyleConfig() : null
        };
    }

    // 强制停止处理
    forceStopProcessing() {
        this.isProcessing = false;
        if (this.screenshotButton) {
            this.screenshotButton.classList.remove('processing');
            this.screenshotButton.disabled = false;
        }
    }

    // 关闭所有弹窗
    closeAllModals() {
        if (window.codeScreenshotPreview) {
            window.codeScreenshotPreview.closePreviewModal();
            window.codeScreenshotPreview.closeDownloadProgressModal();
        }
    }

    // 销毁实例
    destroy() {
        console.log('销毁截图管理器');
        this.closeAllModals();
        this.forceStopProcessing();
        
        // 移除事件监听器
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler, true);
        }
        
        // 移除观察器
        if (this.observer) {
            this.observer.disconnect();
        }
        
        console.log('代码截图管理器已销毁');
    }
}

// 延迟初始化，确保其他模块已加载
function initializeScreenshotManager() {
    console.log('开始初始化代码截图管理器');
    
    // 检查依赖模块是否可用
    if (typeof Utils === 'undefined') {
        console.error('Utils 未定义，截图功能可能无法正常工作');
        return;
    }
    
    if (typeof window.fileManager === 'undefined') {
        console.warn('fileManager 未定义，截图功能可能无法获取文件数据');
    }
    
    if (typeof window.scrollManager === 'undefined') {
        console.warn('scrollManager 未定义，截图功能可能无法获取当前文件');
    }
    
    // 确保渲染器已初始化
    if (typeof window.codeScreenshotRenderer === 'undefined') {
        console.error('codeScreenshotRenderer 未定义，截图功能无法工作');
        return;
    }
    
    // 确保预览器已初始化
    if (typeof window.codeScreenshotPreview === 'undefined') {
        console.error('codeScreenshotPreview 未定义，截图功能无法工作');
        return;
    }
    
    // 创建管理器实例
    window.codeScreenshotManager = new CodeScreenshotManager();
    console.log('代码截图管理器初始化完成');
}

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScreenshotManager);
} else {
    setTimeout(initializeScreenshotManager, 1000);
}