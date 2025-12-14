// 主应用程序
class FileManagerApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // iOS特定处理
        if (Utils.isIOS) {
            Utils.handleIOS();
        }

        // 检查本地存储可用性
        if (!Utils.isLocalStorageAvailable()) {
            this.showLocalStorageError();
            return;
        }

        // 确保所有模块按正确顺序初始化
        this.initializeModules();
        
        // 设置全局事件监听
        this.setupGlobalEvents();
        
        // 启动应用
        this.start();
        
        this.isInitialized = true;
    }

    showLocalStorageError() {
        const errorHtml = `
            <div style="padding: 40px; text-align: center; color: var(--warning-color);">
                <i class="ti ti-alert-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h2>本地存储不可用</h2>
                <p>您的浏览器不支持本地存储或已禁用。请启用本地存储功能以使用此应用。</p>
                <p style="font-size: 14px; color: var(--text-light); margin-top: 20px;">
                    提示：检查浏览器设置中的Cookie和网站数据权限。
                </p>
            </div>
        `;
        document.querySelector('.main-content').innerHTML = errorHtml;
    }

    initializeModules() {
        console.log('正在初始化文件资源管理系统...');
        
        // 初始化顺序很重要
        const initSteps = [
            {
                name: '滚动管理器',
                init: () => {
                    if (!window.scrollManager) {
                        console.error('滚动管理器未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '主题系统',
                init: () => {
                    if (!window.themeManager) {
                        console.error('主题管理器未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '导航系统',
                init: () => {
                    if (!window.navigationManager) {
                        console.error('导航管理器未找到');
                        return false;
                    }
                    // 确保重命名控件已初始化
                    setTimeout(() => {
                        if (window.navigationManager.initRenameControls) {
                            window.navigationManager.initRenameControls();
                        }
                    }, 100);
                    return true;
                }
            },
            {
                name: '公告系统',
                init: () => {
                    if (!window.announcementManager) {
                        console.error('公告管理器未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '文件管理器',
                init: () => {
                    if (!window.fileManager) {
                        console.error('文件管理器未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '控制台系统',
                init: () => {
                    if (!window.consoleSystem) {
                        console.error('控制台系统未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '文件管理弹窗',
                init: () => {
                    if (!window.fileManagementModal) {
                        console.error('文件管理弹窗未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '截图工具',
                init: () => {
                    // 修复：检查所有截图相关的组件
                    const screenshotComponents = [
                        'codeScreenshotRenderer',
                        'codeScreenshotManager',
                        'codeScreenshotPreview'
                    ];
                    
                    const availableComponents = screenshotComponents.filter(comp => window[comp]);
                    
                    if (availableComponents.length === 0) {
                        console.error('截图工具组件未找到');
                        return false;
                    }
                    
                    console.log(`✓ 截图工具组件加载成功: ${availableComponents.join(', ')}`);
                    return true;
                }
            },
            {
                name: '拖拽导入系统',
                init: () => {
                    if (!window.dragDropManager) {
                        console.error('拖拽导入管理器未找到');
                        return false;
                    }
                    return true;
                }
            },
            {
                name: '图片管理器（万相集）',
                init: () => {
                    // 图片管理器是可选的，只在需要时加载
                    if (window.imageManager) {
                        console.log('✓ 图片管理器已加载');
                        return true;
                    } else {
                        console.warn('图片管理器未加载，万相集功能可能不可用');
                        return true; // 这是可选的，不阻止应用启动
                    }
                }
            }
        ];

        // 执行初始化步骤
        initSteps.forEach(step => {
            try {
                const success = step.init();
                if (success) {
                    console.log(`✓ ${step.name} 初始化成功`);
                } else {
                    console.error(`✗ ${step.name} 初始化失败`);
                }
            } catch (error) {
                console.error(`✗ ${step.name} 初始化错误:`, error);
            }
        });

        // 延迟执行一些初始化任务
        setTimeout(() => {
            this.finalizeInitialization();
        }, 500);
    }

    finalizeInitialization() {
        // 初始渲染文件
        if (window.fileManager && window.fileManager.renderFiles) {
            window.fileManager.renderFiles();
        }
        
        // 更新存储信息
        if (window.fileManager && window.fileManager.updateStorageInfo) {
            window.fileManager.updateStorageInfo();
        }
        
        // 更新分类选择器
        if (window.fileManager && window.fileManager.updateCategorySelection) {
            window.fileManager.updateCategorySelection();
        }
        
        // 更新主题选择
        if (window.themeManager && window.themeManager.updateThemeSelection) {
            window.themeManager.updateThemeSelection();
        }

        // 检查临时数据状态
        this.checkTempDataStatus();

        // 检查当前页面是否为万相集，如果是则初始化
        if (window.navigationManager && window.navigationManager.getCurrentPage() === 'images') {
            this.initImagesPage();
        }

        console.log('文件资源管理系统初始化完成');
    }

    // 新增：检查临时数据状态
    checkTempDataStatus() {
        setTimeout(() => {
            if (window.dragDropManager && window.dragDropManager.draggedFiles) {
                const pendingFiles = window.dragDropManager.draggedFiles.length;
                if (pendingFiles > 0) {
                    console.log(`检测到 ${pendingFiles} 个待导入文件`);
                    
                    // 显示待导入文件提示
                    const hasTempData = localStorage.getItem('dragDropTempData');
                    if (hasTempData) {
                        console.log('发现未完成的导入任务，数据已自动恢复');
                        
                        // 可选：显示提示信息
                        setTimeout(() => {
                            Utils.showMessage(`发现 ${pendingFiles} 个待导入文件，数据已自动恢复`, 'info');
                        }, 2000);
                    }
                }
            }
        }, 1000);
    }

    // 修改：万相集页面初始化
    initImagesPage() {
        console.log('初始化万相集页面');
        
        // 确保图片管理器已初始化
        if (window.imageManager) {
            // 渲染图片
            window.imageManager.renderImages();
            
            // 更新分类选择器
            if (window.navigationManager.updateCategorySelectors) {
                window.navigationManager.updateCategorySelectors();
            }
            
            // 使用事件委托而不是重新绑定事件
            console.log('使用事件委托处理图片点击事件');
        } else {
            console.warn('图片管理器未初始化，万相集功能不可用');
            
            // 显示错误信息
            const imagesGrid = document.getElementById('imagesGrid');
            if (imagesGrid) {
                imagesGrid.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--warning-color);">
                        <i class="ti ti-photo-off" style="font-size: 48px; margin-bottom: 20px;"></i>
                        <h3>万相集功能未加载</h3>
                        <p>图片管理器模块未能正确加载，请刷新页面重试</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
                            <i class="ti ti-refresh"></i> 刷新页面
                        </button>
                    </div>
                `;
            }
        }
    }

    setupGlobalEvents() {
        // 页面切换事件
        window.addEventListener('pageChanged', (event) => {
            const { page, config } = event.detail;
            
            console.log(`切换到页面: ${page}`);
            
            // 控制公告自动滚动
            if (config.announcement) {
                if (window.announcementManager && window.announcementManager.announcements.length > 1) {
                    window.announcementManager.startAutoScroll();
                }
            } else {
                if (window.announcementManager) {
                    window.announcementManager.stopAutoScroll();
                }
            }
            
            // 重新渲染文件
            if (window.fileManager && window.fileManager.renderFiles) {
                setTimeout(() => {
                    window.fileManager.renderFiles();
                }, 50);
            }
            
            // 更新存储信息
            if (window.fileManager && window.fileManager.updateStorageInfo) {
                setTimeout(() => {
                    window.fileManager.updateStorageInfo();
                }, 100);
            }
            
            // 更新分类选择器
            if (window.fileManager && window.fileManager.updateCategorySelection) {
                setTimeout(() => {
                    window.fileManager.updateCategorySelection();
                }, 50);
            }
            
            // 如果是万相集页面，初始化图片管理器
            if (page === 'images') {
                setTimeout(() => {
                    this.initImagesPage();
                }, 100);
            }
        });

        // 窗口大小变化时更新公告显示
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.announcementManager && window.announcementManager.updateAnnouncementDisplay) {
                window.announcementManager.updateAnnouncementDisplay();
            }
        }, 250));

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K 聚焦控制台
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const consoleInput = document.getElementById('consoleInput');
                if (consoleInput) {
                    consoleInput.focus();
                    consoleInput.select();
                }
            }
            
            // Escape 关闭所有弹窗
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + S 保存配置
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (window.fileManager && window.fileManager.saveConfig) {
                    window.fileManager.saveConfig();
                }
            }
            
            // Ctrl/Cmd + E 导出数据
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (window.fileManager && window.fileManager.exportAllData) {
                    window.fileManager.exportAllData();
                }
            }

            // Ctrl/Cmd + I 打开拖拽导入
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                if (window.dragDropManager && window.dragDropManager.showModal) {
                    window.dragDropManager.showModal();
                }
            }

            // 修复：Ctrl/Cmd + P 截图快捷键
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                const screenshotBtn = document.getElementById('takeScreenshot');
                if (screenshotBtn && window.codeScreenshotManager) {
                    screenshotBtn.click();
                }
            }
        });

        // 防止页面意外关闭时的数据保存
        window.addEventListener('beforeunload', (e) => {
            // 检查是否有未保存的拖拽导入数据
            if (window.dragDropManager && window.dragDropManager.draggedFiles) {
                const pendingFiles = window.dragDropManager.draggedFiles.length;
                if (pendingFiles > 0) {
                    // 有未导入的文件，提示用户
                    e.preventDefault();
                    e.returnValue = `您有 ${pendingFiles} 个文件尚未导入，确定要离开吗？`;
                    return e.returnValue;
                }
            }
            
            // 清理临时数据（只有在没有待导入文件时）
            if (window.dragDropManager && window.dragDropManager.clearTempData) {
                const hasPendingFiles = window.dragDropManager.draggedFiles && 
                                      window.dragDropManager.draggedFiles.length > 0;
                if (!hasPendingFiles) {
                    window.dragDropManager.clearTempData();
                }
            }
        });

        // 监听拖拽导入取消事件
        window.addEventListener('dragDropCanceled', () => {
            console.log('拖拽导入已取消');
            Utils.showMessage('导入已取消', 'info');
        });

        // 监听拖拽导入完成事件
        window.addEventListener('dragDropCompleted', (e) => {
            const { successCount, failedCount } = e.detail;
            console.log(`拖拽导入完成: ${successCount} 成功, ${failedCount} 失败`);
        });

        // 在线状态检测
        window.addEventListener('online', () => {
            Utils.showMessage('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            Utils.showMessage('网络连接已断开', 'warning');
        });

        // 错误处理
        window.addEventListener('error', (e) => {
            console.error('全局错误:', e.error);
            // 可以在这里添加错误上报逻辑
            
            // 如果是存储相关的错误，尝试清理临时数据
            if (e.error && e.error.message && e.error.message.includes('QuotaExceededError')) {
                console.warn('存储空间不足，尝试清理临时数据');
                if (window.dragDropManager && window.dragDropManager.clearTempData) {
                    window.dragDropManager.clearTempData();
                }
            }
        });

        // Promise rejection 处理
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise拒绝:', e.reason);
            e.preventDefault();
        });

        // 新增：监听存储变化（用于多标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === 'dragDropTempData' && window.dragDropManager) {
                console.log('检测到拖拽临时数据变化，重新加载');
                window.dragDropManager.loadTempData();
            }
        });

        // 新增：页面可见性变化处理
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.dragDropManager) {
                // 页面重新可见时，检查临时数据状态
                setTimeout(() => {
                    window.dragDropManager.loadTempData();
                }, 100);
            }
        });

        // 修复：监听截图相关事件
        window.addEventListener('screenshotProcessing', (e) => {
            console.log('截图处理开始:', e.detail);
        });

        window.addEventListener('screenshotCompleted', (e) => {
            console.log('截图处理完成:', e.detail);
        });

        window.addEventListener('screenshotError', (e) => {
            console.error('截图处理错误:', e.detail);
        });

        // 修复：图片导入事件处理 - 使用事件委托
        document.addEventListener('imageImportStarted', async (e) => {
            const { files } = e.detail;
            console.log('收到图片导入事件，图片数量:', files.length);
            
            // 检查图片管理器是否存在
            if (!window.imageManager) {
                console.error('图片管理器未初始化');
                Utils.showMessage('万相集功能未初始化，无法导入图片', 'error');
                return;
            }
            
            try {
                // 导入图片到万相集
                const result = await window.imageManager.importImages(files);
                
                console.log('图片导入完成:', { 
                    total: files.length, 
                    result: result 
                });
            } catch (error) {
                console.error('图片导入失败:', error);
                Utils.showMessage('图片导入失败: ' + error.message, 'error');
            }
        });

        // 新增：拖拽导入完成事件处理
        document.addEventListener('dragDropImportComplete', (e) => {
            const { successCount, failedCount, totalCount } = e.detail;
            console.log(`拖拽导入完成: ${successCount}/${totalCount} 成功, ${failedCount} 失败`);
            
            if (successCount > 0) {
                // 刷新文件列表
                if (window.fileManager && window.fileManager.renderFiles) {
                    window.fileManager.renderFiles();
                }
                
                // 更新存储信息
                if (window.fileManager && window.fileManager.updateStorageInfo) {
                    window.fileManager.updateStorageInfo();
                }
            }
        });

        // 新增：图片管理按钮点击事件 - 使用事件委托
        document.addEventListener('click', (e) => {
            // 修复：监听图片查看按钮点击 - 使用事件委托
            if (e.target.closest('.btn-view-image')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.btn-view-image');
                const imageId = button.dataset.id;
                
                if (imageId && window.imageManager) {
                    const image = window.imageManager.allImages.find(img => img.id == imageId);
                    if (image) {
                        console.log('查看图片（事件委托）:', image.name);
                        window.imageManager.showImageModal(image);
                    }
                }
            }
            
            // 修复：监听图片预览点击 - 使用事件委托
            if (e.target.closest('.image-preview')) {
                e.preventDefault();
                e.stopPropagation();
                const img = e.target.closest('.image-preview');
                const imageId = img.dataset.id;
                
                if (imageId && window.imageManager) {
                    const image = window.imageManager.allImages.find(img => img.id == imageId);
                    if (image) {
                        console.log('查看图片（预览点击）:', image.name);
                        window.imageManager.showImageModal(image);
                    }
                }
            }
            
            // 修复：图片管理弹窗按钮 - 使用事件委托
            if (e.target.closest('#imageManagementBtn')) {
                e.preventDefault();
                e.stopPropagation();
                if (window.imageManager && window.imageManager.openImageManagementModal) {
                    window.imageManager.openImageManagementModal();
                } else {
                    Utils.showMessage('图片管理器未初始化', 'error');
                }
            }
            
            if (e.target.closest('#exportImagesBtn')) {
                e.preventDefault();
                e.stopPropagation();
                if (window.imageManager && window.imageManager.exportImageData) {
                    window.imageManager.exportImageData();
                } else {
                    Utils.showMessage('图片管理器未初始化', 'error');
                }
            }
            
            // 修复：清空图片按钮 - 不添加额外确认框
            if (e.target.closest('#clearImagesBtn')) {
                e.preventDefault();
                e.stopPropagation();
                if (window.imageManager && window.imageManager.clearAllImages) {
                    // 直接调用方法，让 image-manager.js 中的方法处理确认
                    window.imageManager.clearAllImages();
                } else {
                    Utils.showMessage('图片管理器未初始化', 'error');
                }
            }
        });

        // 新增：图片管理弹窗关闭事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#closeImageManagementModal')) {
                e.preventDefault();
                e.stopPropagation();
                const modal = document.getElementById('imageManagementModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });

        // 新增：图片预览弹窗关闭事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#closeImageModal')) {
                e.preventDefault();
                e.stopPropagation();
                const modal = document.getElementById('imagePreviewModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
        
        // 新增：监听图片存储空间不足事件
        document.addEventListener('imageStorageInsufficient', async (e) => {
            const { requiredSize, currentSize, maxSize } = e.detail;
            console.log('图片存储空间不足:', e.detail);
            
            // 这里可以添加处理逻辑，比如自动清理缓存或提示用户
            const neededIncreaseMB = ((requiredSize - maxSize) / 1024 / 1024).toFixed(2);
            
            // 检查是否需要自动增加空间
            if (window.imageManager && window.imageManager.requestStorageIncrease) {
                const userConfirmed = await window.imageManager.requestStorageIncrease({
                    requiredSize,
                    currentSize,
                    maxSize,
                    needIncrease: requiredSize - maxSize
                });
                
                if (userConfirmed) {
                    console.log('用户同意增加存储空间');
                    // 继续导入操作
                    if (e.detail.continueCallback) {
                        e.detail.continueCallback();
                    }
                } else {
                    console.log('用户取消增加存储空间');
                    Utils.showMessage('导入已取消：存储空间不足', 'warning');
                }
            }
        });

        // 新增：监听图片导入完成事件
        document.addEventListener('imageImportCompleted', (e) => {
            const { successCount, failedCount } = e.detail;
            console.log(`图片导入完成: ${successCount} 成功, ${failedCount} 失败`);
            
            // 更新存储统计
            if (window.imageManager) {
                const stats = window.imageManager.getStats();
                console.log(`当前图片存储: ${Utils.formatFileSize(stats.totalSize)} / ${Utils.formatFileSize(window.imageManager.maxStorageSize)}`);
            }
        });

        // 修复：监听图片模态框外部点击关闭
        document.addEventListener('click', (e) => {
            const imageModal = document.getElementById('imagePreviewModal');
            if (imageModal && e.target === imageModal && imageModal.classList.contains('active')) {
                imageModal.classList.remove('active');
            }
            
            const imageManagementModal = document.getElementById('imageManagementModal');
            if (imageManagementModal && e.target === imageManagementModal && imageManagementModal.classList.contains('active')) {
                imageManagementModal.classList.remove('active');
            }
        });
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay.active');
        let closedCount = 0;
        
        modals.forEach(modal => {
            modal.classList.remove('active');
            closedCount++;
        });
        
        // 修复：关闭截图相关的弹窗
        if (window.codeScreenshotPreview && window.codeScreenshotPreview.closeAllModals) {
            window.codeScreenshotPreview.closeAllModals();
        }
        
        // 恢复公告自动滚动
        if (window.announcementManager && window.announcementManager.resumeAutoScroll) {
            window.announcementManager.resumeAutoScroll();
        }
        
        if (closedCount > 0) {
            console.log(`已关闭 ${closedCount} 个弹窗`);
        }
    }

    start() {
        // 显示启动消息
        setTimeout(() => {
            Utils.showMessage('文件资源管理系统已启动', 'success');
        }, 1000);
        
        // 在控制台输出欢迎信息
        setTimeout(() => {
            const output = document.getElementById('consoleOutput');
            if (output) {
                const systemInfo = this.getSystemInfo();
                const tempDataInfo = this.getTempDataInfo();
                
                const welcomeText = `
// 文件资源管理系统 v2.0 测试版
// 构建时间: 2025-11-11
// 系统状态: 运行正常
// 临时数据: ${tempDataInfo}
// 滚动管理器: ${systemInfo.modules.scrollManager ? '已启用' : '未找到'}
// 文件管理: ${systemInfo.modules.fileManager ? '已启用' : '未找到'}
// 截图工具: ${systemInfo.modules.screenshotTool ? '已启用' : '未找到'}
// 拖拽导入: ${systemInfo.modules.dragDrop ? '已启用' : '未找到'}
// 万相集: ${systemInfo.modules.imageManager ? '已启用' : '未找到'}
// 输入 "help" 查看可用命令

> 系统初始化完成，欢迎使用！
                `.trim();
                output.innerHTML = welcomeText;
            }
        }, 1500);

        // 性能监控
        this.startPerformanceMonitoring();
        
        // 数据完整性检查
        setTimeout(() => {
            this.checkDataIntegrity();
        }, 2000);
        
        // 离线状态处理
        this.handleOfflineStatus();
        
        // 错误边界设置
        this.setupErrorBoundary();
        
        console.log('🎉 文件资源管理系统启动完成');
    }

    // 新增：获取临时数据信息
    getTempDataInfo() {
        if (!window.dragDropManager) return '未知';
        
        const pendingFiles = window.dragDropManager.draggedFiles ? 
                           window.dragDropManager.draggedFiles.length : 0;
        
        if (pendingFiles > 0) {
            return `${pendingFiles} 个待导入文件`;
        } else {
            return '无待导入文件';
        }
    }

    startPerformanceMonitoring() {
        // 简单的性能监控
        if ('performance' in window) {
            const perfObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        console.log(`页面加载时间: ${entry.loadEventEnd - entry.fetchStart}ms`);
                    }
                });
            });
            
            try {
                perfObserver.observe({ entryTypes: ['navigation'] });
            } catch (e) {
                console.log('性能监控不可用');
            }
        }
    }

    // 系统信息
    getSystemInfo() {
        const stats = window.fileManager ? window.fileManager.getStats() : { totalFiles: 0, totalSize: 0, favorites: 0 };
        const scrollStats = window.scrollManager ? Object.keys(window.scrollManager.getAllScrollPositions()).length : 0;
        
        // 修复：正确检查截图工具状态
        const screenshotComponents = [
            'codeScreenshotRenderer',
            'codeScreenshotManager', 
            'codeScreenshotPreview'
        ];
        const hasScreenshotTool = screenshotComponents.some(comp => window[comp]);
        
        // 获取图片管理器信息
        let imageManagerInfo = { enabled: false, storageInfo: null };
        if (window.imageManager) {
            const imageStats = window.imageManager.getStats ? window.imageManager.getStats() : null;
            imageManagerInfo = {
                enabled: true,
                storageInfo: {
                    totalImages: window.imageManager.allImages ? window.imageManager.allImages.length : 0,
                    maxStorageSize: window.imageManager.maxStorageSize ? Utils.formatFileSize(window.imageManager.maxStorageSize) : '未知',
                    currentSize: window.imageManager.getTotalImageSize ? Utils.formatFileSize(window.imageManager.getTotalImageSize()) : '未知',
                    useCompression: window.imageManager.useCompression || false
                }
            };
        }
        
        return {
            version: '2.0',
            buildDate: '2025-11-11',
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            storage: {
                available: Utils.isLocalStorageAvailable(),
                usage: window.fileManager ? this.getStorageUsage() : '未知'
            },
            modules: {
                scrollManager: !!window.scrollManager,
                theme: !!window.themeManager,
                navigation: !!window.navigationManager,
                announcement: !!window.announcementManager,
                fileManager: !!window.fileManager,
                console: !!window.consoleSystem,
                fileManagementModal: !!window.fileManagementModal,
                screenshotTool: hasScreenshotTool,
                dragDrop: !!window.dragDropManager,
                imageManager: imageManagerInfo.enabled
            },
            stats: {
                ...stats,
                scrollPositions: scrollStats
            },
            tempData: this.getTempDataInfo(),
            imageManager: imageManagerInfo
        };
    }

    getStorageUsage() {
        try {
            const dataStr = localStorage.getItem('fileAssetsData') || '{}';
            const usedBytes = new Blob([dataStr]).size;
            const totalBytes = 5 * 1024 * 1024; // 5MB
            const percentage = Math.round((usedBytes / totalBytes) * 100);
            
            return {
                used: Utils.formatFileSize(usedBytes),
                total: Utils.formatFileSize(totalBytes),
                percentage: percentage
            };
        } catch (error) {
            return { used: '未知', total: '未知', percentage: 0 };
        }
    }

    // 系统维护方法
    cleanup() {
        // 清理临时数据
        try {
            if (window.dragDropManager && window.dragDropManager.clearTempData) {
                window.dragDropManager.clearTempData();
            }
            
            // 清理过期的本地存储数据
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const keysToCheck = ['fileAssetsData', 'theme', 'navName_'];
            
            keysToCheck.forEach(key => {
                try {
                    if (key.endsWith('_')) {
                        // 处理导航名称
                        Object.keys(localStorage).forEach(storageKey => {
                            if (storageKey.startsWith(key)) {
                                // 可以添加时间检查逻辑
                                console.log(`保留导航设置: ${storageKey}`);
                            }
                        });
                    }
                } catch (error) {
                    console.warn(`清理 ${key} 时出错:`, error);
                }
            });
            
            console.log('系统清理完成');
            Utils.showMessage('系统清理完成', 'success');
            return true;
        } catch (error) {
            console.error('系统清理失败:', error);
            Utils.showMessage('系统清理失败: ' + error.message, 'error');
            return false;
        }
    }

    // 备份系统
    backupSystem() {
        const backupData = {
            files: window.fileManager ? window.fileManager.getAllFilesData() : {},
            theme: window.themeManager ? window.themeManager.getCurrentTheme() : 'light',
            navNames: {},
            scrollPositions: window.scrollManager ? window.scrollManager.getAllScrollPositions() : {},
            // 新增：包含拖拽临时数据
            dragDropTempData: window.dragDropManager ? {
                fileCount: window.dragDropManager.draggedFiles.length,
                lastUpdate: new Date().toISOString()
            } : null,
            // 修复：包含截图配置
            screenshotConfig: window.codeScreenshotManager ? window.codeScreenshotManager.getSettings() : null,
            // 新增：包含图片数据（使用Base85压缩存储）
            imageData: window.imageManager ? window.imageManager.getAllImagesData() : null,
            timestamp: new Date().toISOString(),
            version: '2.0',
            systemInfo: this.getSystemInfo()
        };

        // 保存导航名称
        if (window.navigationManager) {
            const pages = ['items', 'skills', 'characters', 'talents', 'others', 'images'];
            pages.forEach(page => {
                backupData.navNames[page] = window.navigationManager.getNavName(page);
            });
        }

        return backupData;
    }

    // 恢复系统
    restoreSystem(backupData) {
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('无效的备份数据');
        }

        try {
            // 恢复文件数据
            if (backupData.files && window.fileManager) {
                if (!window.fileManager.setFilesData(backupData.files)) {
                    throw new Error('文件数据恢复失败');
                }
            }

            // 恢复主题
            if (backupData.theme && window.themeManager) {
                window.themeManager.setTheme(backupData.theme);
            }

            // 恢复导航名称
            if (backupData.navNames && window.navigationManager) {
                Object.keys(backupData.navNames).forEach(page => {
                    window.navigationManager.saveNavName(page, backupData.navNames[page]);
                });
            }

            // 恢复滚动位置
            if (backupData.scrollPositions && window.scrollManager) {
                Object.keys(backupData.scrollPositions).forEach(fileId => {
                    window.scrollManager.saveScrollPosition(
                        parseInt(fileId), 
                        backupData.scrollPositions[fileId]
                    );
                });
            }

            // 修复：恢复截图配置
            if (backupData.screenshotConfig && window.codeScreenshotManager) {
                window.codeScreenshotManager.updateStyleConfig(backupData.screenshotConfig.styleConfig || {});
                if (backupData.screenshotConfig.addLineNumbers !== undefined) {
                    window.codeScreenshotManager.addLineNumbers = backupData.screenshotConfig.addLineNumbers;
                    window.codeScreenshotManager.saveSettings();
                }
            }

            // 新增：恢复图片数据（支持Base85）
            if (backupData.imageData && window.imageManager) {
                window.imageManager.setImagesData(backupData.imageData);
            }

            Utils.showMessage('系统恢复成功', 'success');
            return true;
        } catch (error) {
            Utils.showMessage('系统恢复失败: ' + error.message, 'error');
            return false;
        }
    }

    // 系统诊断
    diagnose() {
        // 修复：正确检查截图工具状态
        const screenshotComponents = [
            'codeScreenshotRenderer',
            'codeScreenshotManager',
            'codeScreenshotPreview'
        ];
        const availableScreenshotComponents = screenshotComponents.filter(comp => window[comp]);

        const diagnostics = {
            localStorage: Utils.isLocalStorageAvailable(),
            modules: {
                scrollManager: !!window.scrollManager,
                theme: !!window.themeManager,
                navigation: !!window.navigationManager,
                announcement: !!window.announcementManager,
                fileManager: !!window.fileManager,
                console: !!window.consoleSystem,
                fileManagementModal: !!window.fileManagementModal,
                screenshotTool: availableScreenshotComponents.length > 0,
                screenshotComponents: availableScreenshotComponents,
                dragDrop: !!window.dragDropManager,
                imageManager: !!window.imageManager
            },
            files: window.fileManager ? Object.keys(window.fileManager.allFiles) : [],
            scrollPositions: window.scrollManager ? Object.keys(window.scrollManager.getAllScrollPositions()).length : 0,
            // 新增：临时数据诊断
            tempData: {
                hasTempData: !!localStorage.getItem('dragDropTempData'),
                pendingFiles: window.dragDropManager ? window.dragDropManager.draggedFiles.length : 0,
                tempDataSize: this.getTempDataSize()
            },
            // 修复：截图工具诊断
            screenshot: window.codeScreenshotManager ? {
                settings: window.codeScreenshotManager.getSettings(),
                renderer: !!window.codeScreenshotRenderer,
                manager: !!window.codeScreenshotManager,
                preview: !!window.codeScreenshotPreview
            } : null,
            // 新增：图片管理器诊断
            images: window.imageManager ? {
                totalImages: window.imageManager.allImages ? window.imageManager.allImages.length : 0,
                storageSize: this.getImagesStorageSize(),
                maxStorageSize: window.imageManager.maxStorageSize ? Utils.formatFileSize(window.imageManager.maxStorageSize) : '未知',
                currentUsage: window.imageManager.getTotalImageSize ? Utils.formatFileSize(window.imageManager.getTotalImageSize()) : '未知',
                compressionEnabled: window.imageManager.useCompression || false,
                status: '正常'
            } : { status: '未加载' },
            performance: {
                memory: 'memory' in performance ? performance.memory : null,
                timing: 'timing' in performance ? performance.timing : null
            }
        };

        console.log('系统诊断信息:', diagnostics);
        return diagnostics;
    }

    // 新增：获取临时数据大小
    getTempDataSize() {
        try {
            const tempData = localStorage.getItem('dragDropTempData');
            if (tempData) {
                return Utils.formatFileSize(new Blob([tempData]).size);
            }
            return '0 B';
        } catch (error) {
            return '未知';
        }
    }

    // 新增：获取图片存储大小
    getImagesStorageSize() {
        try {
            const imagesData = localStorage.getItem('imageCollectionData');
            if (imagesData) {
                return Utils.formatFileSize(new Blob([imagesData]).size);
            }
            return '0 B';
        } catch (error) {
            return '未知';
        }
    }

    // 新增：清理临时数据命令
    clearTempData() {
        if (window.dragDropManager && window.dragDropManager.clearTempData) {
            const hadPendingFiles = window.dragDropManager.draggedFiles && 
                                  window.dragDropManager.draggedFiles.length > 0;
            window.dragDropManager.clearTempData();
            window.dragDropManager.draggedFiles = [];
            window.dragDropManager.fileIdCounter = 0;
            
            if (hadPendingFiles) {
                Utils.showMessage('临时数据已清理，所有待导入文件已清除', 'success');
            } else {
                Utils.showMessage('临时数据已清理', 'info');
            }
            return true;
        }
        return false;
    }

    // 新增：截图工具相关方法
    takeScreenshot(fileId) {
        if (!window.codeScreenshotManager) {
            Utils.showMessage('截图工具未初始化', 'error');
            return false;
        }

        const fileData = window.fileManager?.findFileById(fileId);
        if (!fileData) {
            Utils.showMessage('未找到文件数据', 'error');
            return false;
        }

        window.codeScreenshotManager.generatePreviewScreenshot(fileData);
        return true;
    }

    // 新增：重置截图配置
    resetScreenshotConfig() {
        if (window.codeScreenshotManager) {
            window.codeScreenshotManager.resetToDefaultConfig();
            Utils.showMessage('截图配置已重置为默认值', 'success');
            return true;
        }
        return false;
    }

    // 新增：数据完整性检查
    checkDataIntegrity() {
        console.log('正在检查数据完整性...');
        
        const integrityChecks = {
            fileManager: !!window.fileManager,
            fileData: window.fileManager ? window.fileManager.getStats() : null,
            navigation: !!window.navigationManager,
            tempData: !!localStorage.getItem('dragDropTempData'),
            screenshotTool: window.codeScreenshotManager ? true : false,
            imageManager: window.imageManager ? true : false
        };
        
        console.log('数据完整性检查结果:', integrityChecks);
        
        // 检查是否有损坏的数据
        try {
            const fileData = localStorage.getItem('fileAssetsData');
            if (fileData) {
                JSON.parse(fileData);
                console.log('✓ 文件数据JSON格式正常');
            }
        } catch (error) {
            console.error('✗ 文件数据JSON格式错误:', error);
            Utils.showMessage('检测到损坏的文件数据，建议备份后清理', 'warning');
        }
        
        // 检查图片数据
        try {
            const imageData = localStorage.getItem('imageCollectionData');
            if (imageData) {
                JSON.parse(imageData);
                console.log('✓ 图片数据JSON格式正常');
            }
        } catch (error) {
            console.error('✗ 图片数据JSON格式错误:', error);
            Utils.showMessage('检测到损坏的图片数据，万相集可能需要重新导入', 'warning');
        }
        
        return integrityChecks;
    }

    // 新增：性能优化 - 延迟加载非关键组件
    lazyLoadComponents() {
        // 如果不是万相集页面，延迟加载图片管理器相关资源
        if (window.navigationManager && window.navigationManager.getCurrentPage() !== 'images') {
            console.log('延迟加载图片管理器组件');
            // 这里可以添加延迟加载逻辑
        }
    }

    // 新增：离线状态处理
    handleOfflineStatus() {
        const offlineHandler = () => {
            Utils.showMessage('网络连接已断开，部分功能可能受限', 'warning');
            
            // 禁用需要网络的功能
            document.querySelectorAll('[data-requires-online]').forEach(element => {
                element.style.opacity = '0.5';
                element.style.pointerEvents = 'none';
            });
        };
        
        const onlineHandler = () => {
            Utils.showMessage('网络连接已恢复', 'success');
            
            // 恢复功能
            document.querySelectorAll('[data-requires-online]').forEach(element => {
                element.style.opacity = '1';
                element.style.pointerEvents = 'auto';
            });
        };
        
        window.addEventListener('offline', offlineHandler);
        window.addEventListener('online', onlineHandler);
        
        // 初始检查
        if (!navigator.onLine) {
            offlineHandler();
        }
    }

    // 新增：错误边界处理
    setupErrorBoundary() {
        // 捕获未捕获的错误
        window.addEventListener('error', function(e) {
            const errorInfo = {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error
            };
            
            console.error('未捕获的错误:', errorInfo);
            
            // 显示用户友好的错误信息
            const errorMessage = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--warning-color);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    z-index: 99999;
                    max-width: 300px;
                    box-shadow: var(--shadow);
                " id="global-error-message">
                    <strong>系统错误</strong>
                    <p style="margin: 5px 0; font-size: 12px;">
                        发生了一个错误，请刷新页面重试
                    </p>
                    <button onclick="this.parentElement.remove()" 
                            style="
                                background: rgba(255,255,255,0.2);
                                border: none;
                                color: white;
                                padding: 5px 10px;
                                border-radius: 4px;
                                cursor: pointer;
                                margin-top: 5px;
                            ">
                        关闭
                    </button>
                </div>
            `;
            
            // 避免重复显示错误信息
            if (!document.getElementById('global-error-message')) {
                const errorEl = document.createElement('div');
                errorEl.id = 'global-error-message';
                errorEl.innerHTML = errorMessage;
                document.body.appendChild(errorEl);
                
                // 5秒后自动移除
                setTimeout(() => {
                    if (errorEl.parentNode) {
                        errorEl.parentNode.removeChild(errorEl);
                    }
                }, 5000);
            }
        });
    }

    // 新增：初始化图片管理器相关事件
    initImageManagerEvents() {
        // 绑定图片管理弹窗事件
        const imageModal = document.getElementById('imageManagementModal');
        if (imageModal) {
            // 点击外部关闭弹窗
            imageModal.addEventListener('click', (e) => {
                if (e.target === imageModal) {
                    imageModal.classList.remove('active');
                }
            });
            
            // 确保关闭按钮可以工作
            const closeBtn = document.getElementById('closeImageManagementModal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    imageModal.classList.remove('active');
                });
            }
        }
        
        // 同样修复图片预览弹窗
        const previewModal = document.getElementById('imagePreviewModal');
        if (previewModal) {
            previewModal.addEventListener('click', (e) => {
                if (e.target === previewModal) {
                    previewModal.classList.remove('active');
                }
            });
            
            const closePreviewBtn = document.getElementById('closeImageModal');
            if (closePreviewBtn) {
                closePreviewBtn.addEventListener('click', () => {
                    previewModal.classList.remove('active');
                });
            }
        }
    }
    
    // 新增：优化图片导入处理，防止重复导入
    setupImageImportHandler() {
        let lastImportTime = 0;
        const IMPORT_COOLDOWN = 1000; // 1秒冷却时间
        
        // 监听图片导入事件，添加防抖机制
        document.addEventListener('imageImportStarted', async (e) => {
            const now = Date.now();
            if (now - lastImportTime < IMPORT_COOLDOWN) {
                console.log('图片导入冷却中，跳过重复导入');
                return;
            }
            
            lastImportTime = now;
            const { files } = e.detail;
            
            console.log('处理图片导入，数量:', files.length);
            
            // 检查图片管理器是否存在
            if (!window.imageManager) {
                console.error('图片管理器未初始化');
                Utils.showMessage('万相集功能未初始化，无法导入图片', 'error');
                return;
            }
            
            try {
                // 导入图片到万相集
                let successCount = 0;
                let failedCount = 0;
                
                // 首先检查 importImages 方法的返回类型
                const result = await window.imageManager.importImages(files);
                
                // 处理不同的返回类型
                if (typeof result === 'number') {
                    // 如果返回的是数字，表示成功导入的数量
                    successCount = result;
                    failedCount = files.length - successCount;
                } else if (result && typeof result === 'object') {
                    // 如果返回的是对象
                    if ('success' in result) {
                        successCount = result.success || 0;
                    }
                    if ('failed' in result) {
                        failedCount = result.failed || 0;
                    }
                    if ('total' in result && !('success' in result)) {
                        // 如果只有 total，假设全部成功
                        successCount = result.total || 0;
                        failedCount = files.length - successCount;
                    }
                } else {
                    // 如果返回的是数组或者其他类型
                    successCount = files.length; // 乐观估计
                    console.warn('无法确定导入结果类型:', result);
                }
                
                if (successCount > 0) {
                    // 只在有实际导入时才显示提示
                    Utils.showMessage(`成功导入 ${successCount} 张图片到万相集`, 'success');
                    
                    // 如果当前在万相集页面，刷新图片显示
                    if (window.navigationManager && window.navigationManager.getCurrentPage() === 'images') {
                        setTimeout(() => {
                            window.imageManager.renderImages();
                        }, 100);
                    }
                }
                
                if (failedCount > 0) {
                    Utils.showMessage(`${failedCount} 张图片导入失败`, 'warning');
                }
                
                console.log('图片导入完成:', { 
                    total: files.length, 
                    success: successCount, 
                    failed: failedCount,
                    result: result 
                });
            } catch (error) {
                console.error('图片导入失败:', error);
                Utils.showMessage('图片导入失败: ' + error.message, 'error');
            }
        });
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', function() {
    // 显示加载状态
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'app-loading';
    loadingIndicator.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: var(--text-color);
        ">
            <div class="loading-spinner" style="
                width: 40px;
                height: 40px;
                border: 4px solid var(--border-color);
                border-top: 4px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <p>文件资源管理系统启动中...</p>
            <p style="font-size: 12px; color: var(--text-light); margin-top: 10px;">
                正在初始化系统模块...
            </p>
        </div>
    `;
    document.body.appendChild(loadingIndicator);

    // 创建主应用实例
    setTimeout(() => {
        try {
            window.app = new FileManagerApp();
            
            // 初始化图片管理器事件
            if (window.app.initImageManagerEvents) {
                window.app.initImageManagerEvents();
            }
            
            // 设置图片导入处理，防止重复
            if (window.app.setupImageImportHandler) {
                window.app.setupImageImportHandler();
            }
            
            // 移除加载指示器
            const loadingElement = document.getElementById('app-loading');
            if (loadingElement) {
                loadingElement.style.opacity = '0';
                setTimeout(() => {
                    if (loadingElement.parentNode) {
                        loadingElement.parentNode.removeChild(loadingElement);
                    }
                }, 500);
            }
            
            // 暴露全局API
            window.FileManagerAPI = {
                // 文件管理
                importFiles: (files) => window.fileManager ? window.fileManager.handleFiles(files) : null,
                exportData: () => window.fileManager ? window.fileManager.exportAllData() : null,
                clearData: () => window.fileManager ? window.fileManager.clearAllData() : null,
                getFiles: (category) => window.fileManager ? window.fileManager.getFilesByCategory(category) : [],
                getAllFiles: () => window.fileManager ? window.fileManager.getAllFiles() : [],
                searchFiles: (query) => window.fileManager ? window.fileManager.searchFiles(query) : [],
                
                // 文件管理弹窗
                openFileManagement: () => window.fileManagementModal ? window.fileManagementModal.openModal() : null,
                getSelectedFiles: () => window.fileManagementModal ? window.fileManagementModal.getSelectedFiles() : [],
                
                // 主题管理
                setTheme: (theme) => window.themeManager ? window.themeManager.setTheme(theme) : null,
                getTheme: () => window.themeManager ? window.themeManager.getCurrentTheme() : 'light',
                toggleTheme: () => window.themeManager ? window.themeManager.toggleTheme() : null,
                
                // 导航管理
                getNavName: (page) => window.navigationManager ? window.navigationManager.getNavName(page) : '',
                setNavName: (page, name) => window.navigationManager ? window.navigationManager.saveNavName(page, name) : null,
                resetNavNames: () => window.navigationManager ? window.navigationManager.resetNavigationNames() : null,
                
                // 公告管理
                addAnnouncement: (announcement) => window.announcementManager ? window.announcementManager.addAnnouncement(announcement) : null,
                removeAnnouncement: (id) => window.announcementManager ? window.announcementManager.removeAnnouncement(id) : null,
                getAnnouncements: () => window.announcementManager ? window.announcementManager.getAnnouncements() : [],
                clearAnnouncements: () => window.announcementManager ? window.announcementManager.clearAllAnnouncements() : null,
                
                // 滚动管理
                getScrollPositions: () => window.scrollManager ? window.scrollManager.getAllScrollPositions() : {},
                clearScrollPositions: () => window.scrollManager ? window.scrollManager.clearAllScrollPositions() : null,
                
                // 截图工具
                takeScreenshot: (fileId) => window.app ? window.app.takeScreenshot(fileId) : false,
                resetScreenshotConfig: () => window.app ? window.app.resetScreenshotConfig() : false,
                getScreenshotSettings: () => window.codeScreenshotManager ? window.codeScreenshotManager.getSettings() : null,
                
                // 控制台
                executeCommand: (command) => {
                    const input = document.getElementById('consoleInput');
                    if (input && window.consoleSystem) {
                        input.value = command;
                        window.consoleSystem.executeCommand();
                    }
                },
                
                // 拖拽导入管理
                openDragDrop: () => window.dragDropManager ? window.dragDropManager.showModal() : null,
                getPendingFiles: () => window.dragDropManager ? window.dragDropManager.draggedFiles : [],
                clearPendingFiles: () => window.app ? window.app.clearTempData() : false,
                
                // 图片管理（万相集）
                getImages: () => window.imageManager ? window.imageManager.getAllImages() : [],
                importImages: (files) => window.imageManager ? window.imageManager.importImages(files) : null,
                clearImages: () => window.imageManager ? window.imageManager.clearAllImages() : null,
                exportImages: () => window.imageManager ? window.imageManager.exportAllImages() : null,
                getImageStorageInfo: () => window.imageManager ? {
                    totalImages: window.imageManager.allImages.length,
                    maxSize: Utils.formatFileSize(window.imageManager.maxStorageSize),
                    currentSize: Utils.formatFileSize(window.imageManager.getTotalImageSize()),
                    compression: window.imageManager.useCompression
                } : null,
                increaseImageStorage: (sizeMB) => {
                    if (window.imageManager && window.imageManager.increaseStorageSpace) {
                        const currentSize = window.imageManager.maxStorageSize;
                        window.imageManager.maxStorageSize += sizeMB * 1024 * 1024;
                        return {
                            success: true,
                            oldSize: Utils.formatFileSize(currentSize),
                            newSize: Utils.formatFileSize(window.imageManager.maxStorageSize)
                        };
                    }
                    return { success: false };
                },
                
                // 系统信息
                getSystemInfo: () => window.app ? window.app.getSystemInfo() : {},
                getStorageInfo: () => window.fileManager ? window.app.getStorageUsage() : {},
                diagnose: () => window.app ? window.app.diagnose() : {},
                checkDataIntegrity: () => window.app ? window.app.checkDataIntegrity() : {},
                
                // 系统维护
                backupSystem: () => window.app ? window.app.backupSystem() : {},
                restoreSystem: (data) => window.app ? window.app.restoreSystem(data) : false,
                cleanup: () => window.app ? window.app.cleanup() : false,
                clearTempData: () => window.app ? window.app.clearTempData() : false,
                
                // 工具方法
                showMessage: (message, type) => Utils.showMessage(message, type),
                formatFileSize: (bytes) => Utils.formatFileSize(bytes),
                formatDate: (date, format) => Utils.formatDate(date, format),
                // Base85相关方法
                encodeBase85: (str) => Utils.encodeBase85(str),
                decodeBase85: (str) => Utils.decodeBase85(str),
                compressImageToBase85: (dataUrl) => Utils.compressImageToBase85(dataUrl),
                restoreImageFromBase85: (base85Str, mimeType) => Utils.restoreImageFromBase85(base85Str, mimeType)
            };
            
            // 添加一些有用的全局调试命令
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('%c🔧 开发工具已启用', 'color: #4361ee; font-weight: bold;');
                console.log('可用全局命令:');
                console.log('  window.app.diagnose() - 系统诊断');
                console.log('  window.app.cleanup() - 系统清理');
                console.log('  window.app.backupSystem() - 系统备份');
                console.log('  window.app.checkDataIntegrity() - 数据完整性检查');
                console.log('  window.app.initImagesPage() - 初始化万相集页面');
                console.log('  window.imageManager.getStats() - 获取图片统计');
                console.log('  window.imageManager.getTotalImageSize() - 获取图片总大小');
                console.log('  window.FileManagerAPI - 完整的API接口');
                
                // 暴露调试函数
                window.initImagesPage = () => window.app ? window.app.initImagesPage() : null;
                window.checkDataIntegrity = () => window.app ? window.app.checkDataIntegrity() : null;
            }
            
            console.log('🚀 文件资源管理系统 v2.0 已启动');
            console.log('💡 使用 FileManagerAPI 来访问系统功能');
            console.log('📊 系统信息:', window.app.getSystemInfo());
            
        } catch (error) {
            console.error('应用启动失败:', error);
            Utils.showMessage('应用启动失败: ' + error.message, 'error');
            
            // 移除加载指示器
            const loadingElement = document.getElementById('app-loading');
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div style="text-align: center; color: var(--warning-color);">
                        <i class="ti ti-alert-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                        <h2>启动失败</h2>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
                            重新加载
                        </button>
                    </div>
                `;
            }
        }
    }, 100);
});

// 添加加载动画样式
const loadStyle = document.createElement('style');
loadStyle.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadStyle);