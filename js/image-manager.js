// 图片管理器
class ImageManager {
    constructor() {
        this.allImages = [];
        this.currentCategory = 'images';
        this.imageIdCounter = 0;
        this.maxStorageSize = 100 * 1024 * 1024; // 初始100MB
        this.storageScaleFactor = 100 * 1024 * 1024; // 每次增加100MB
        this.useCompression = false; // 默认不使用压缩（高质量）
        this.compressionQuality = 1.0; // 压缩质量为最高
        this.maxImageWidth = 9999; // 默认保持原尺寸
        this.autoCompressImages = false; // 默认不自动压缩
        this.lazyLoadImages = true; // 默认启用懒加载
        this.recentlyProcessedFiles = []; // 防止重复导入
        this.currentViewingImageIndex = -1; // 当前查看的图片索引
        this.isExporting = false; // 防止重复导出
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.loadSettingsFromDOM(); // 加载DOM中的设置
        this.setupKeyboardNavigation(); // 设置键盘导航
        this.renderImages();
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('imagePreviewModal');
            if (!modal || modal.style.display === 'none' || !modal.classList.contains('active')) {
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.showPrevImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.showNextImage();
                    break;
                case 'Escape':
                    e.preventDefault();
                    const closeBtn = document.getElementById('closeImageModal');
                    if (closeBtn) closeBtn.click();
                    break;
            }
        });
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('imageCollectionData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                console.log('开始加载图片数据，数量:', parsedData.length);
                
                // 修复：确保所有图片都有dataUrl
                this.allImages = parsedData.map(img => {
                    // 如果图片有compressedData但没有dataUrl，需要恢复
                    if (img.compressedData && !img.dataUrl) {
                        console.log('恢复压缩图片的dataUrl:', img.name);
                        return {
                            ...img,
                            dataUrl: Utils.restoreImageFromBase85(img.compressedData, img.type)
                        };
                    }
                    // 如果没有dataUrl但有compressedData，恢复
                    else if (!img.dataUrl && img.compressedData) {
                        console.log('恢复图片dataUrl:', img.name);
                        return {
                            ...img,
                            dataUrl: Utils.restoreImageFromBase85(img.compressedData, img.type)
                        };
                    }
                    // 如果dataUrl不存在但其他数据完整，尝试重建
                    else if (!img.dataUrl && img.id && img.name) {
                        console.warn('图片缺少dataUrl，跳过:', img.name);
                        return null;
                    }
                    return img;
                }).filter(img => img !== null); // 过滤掉无效的图片
                
                this.imageIdCounter = this.allImages.length > 0 ? 
                    Math.max(...this.allImages.map(img => img.id)) + 1 : 0;
                
                // 加载配置
                const config = localStorage.getItem('imageManagerConfig');
                if (config) {
                    const parsedConfig = JSON.parse(config);
                    this.maxStorageSize = parsedConfig.maxStorageSize || this.maxStorageSize;
                    this.useCompression = parsedConfig.useCompression !== undefined ? parsedConfig.useCompression : false;
                    this.compressionQuality = parsedConfig.compressionQuality || 1.0;
                    this.maxImageWidth = parsedConfig.maxImageWidth || 9999;
                    this.autoCompressImages = parsedConfig.autoCompressImages !== undefined ? parsedConfig.autoCompressImages : false;
                    this.lazyLoadImages = parsedConfig.lazyLoadImages !== undefined ? parsedConfig.lazyLoadImages : true;
                }
                
                console.log(`成功加载 ${this.allImages.length} 张图片，存储上限: ${(this.maxStorageSize / 1024 / 1024).toFixed(2)} MB`);
            } else {
                console.log('本地存储中没有找到图片数据');
            }
        } catch (error) {
            console.error('加载图片数据失败:', error);
            this.allImages = [];
        }
    }

    saveToLocalStorage() {
        try {
            // 修复：确保在保存前所有图片都有dataUrl
            const imagesToSave = this.allImages.map(img => {
                // 确保每个图片对象都有必要的数据
                if (!img.dataUrl) {
                    console.error('图片缺少dataUrl，无法保存:', img.name);
                    return null;
                }
                
                const imgCopy = { ...img };
                
                // 如果使用了压缩，可以存储Base85数据
                if (imgCopy.compressedData) {
                    // 但保持dataUrl以便快速访问
                    // 不删除dataUrl，以便下次加载时直接使用
                }
                
                return imgCopy;
            }).filter(img => img !== null);
            
            if (imagesToSave.length !== this.allImages.length) {
                console.warn(`有 ${this.allImages.length - imagesToSave.length} 张图片无法保存`);
            }
            
            // 转换为JSON
            const dataStr = JSON.stringify(imagesToSave);
            const dataSize = dataStr.length;
            
            console.log('保存图片数据到本地存储:', {
                imageCount: imagesToSave.length,
                dataSize: Utils.formatFileSize(dataSize),
                totalImageSize: Utils.formatFileSize(this.getTotalImageSize())
            });
            
            // 保存到本地存储
            localStorage.setItem('imageCollectionData', dataStr);
            
            // 同时保存配置
            localStorage.setItem('imageManagerConfig', JSON.stringify({
                maxStorageSize: this.maxStorageSize,
                useCompression: this.useCompression,
                compressionQuality: this.compressionQuality,
                maxImageWidth: this.maxImageWidth,
                autoCompressImages: this.autoCompressImages,
                lazyLoadImages: this.lazyLoadImages,
                lastUpdated: new Date().toISOString()
            }));
            
            console.log('图片数据保存成功');
            return true;
        } catch (error) {
            console.error('保存图片数据失败:', error);
            return false;
        }
    }

    // 新增：从DOM加载设置
    loadSettingsFromDOM() {
        try {
            // 图片质量设置
            const imageQualitySelect = document.getElementById('imageQuality');
            if (imageQualitySelect) {
                if (imageQualitySelect.value === 'high') {
                    this.useCompression = false;
                    this.compressionQuality = 1.0;
                } else if (imageQualitySelect.value === 'medium') {
                    this.useCompression = true;
                    this.compressionQuality = 0.7;
                } else if (imageQualitySelect.value === 'low') {
                    this.useCompression = true;
                    this.compressionQuality = 0.5;
                }
            }
            
            // 最大图片尺寸设置
            const maxImageSizeSelect = document.getElementById('maxImageSize');
            if (maxImageSizeSelect) {
                if (maxImageSizeSelect.value === 'original') {
                    this.maxImageWidth = 9999;
                } else {
                    this.maxImageWidth = parseInt(maxImageSizeSelect.value) || 1920;
                }
            }
            
            // 自动压缩设置
            const autoCompressCheckbox = document.getElementById('autoCompressImages');
            if (autoCompressCheckbox) {
                this.autoCompressImages = autoCompressCheckbox.checked;
            }
            
            // 懒加载设置
            const lazyLoadCheckbox = document.getElementById('lazyLoadImages');
            if (lazyLoadCheckbox) {
                this.lazyLoadImages = lazyLoadCheckbox.checked;
            }
            
            console.log('从DOM加载图片设置:', {
                useCompression: this.useCompression,
                compressionQuality: this.compressionQuality,
                maxImageWidth: this.maxImageWidth,
                autoCompressImages: this.autoCompressImages,
                lazyLoadImages: this.lazyLoadImages
            });
        } catch (error) {
            console.error('加载DOM设置失败:', error);
        }
    }

    // 新增：保存设置到DOM
    saveSettingsToDOM() {
        try {
            // 图片质量设置
            const imageQualitySelect = document.getElementById('imageQuality');
            if (imageQualitySelect) {
                if (!this.useCompression && this.compressionQuality >= 1.0) {
                    imageQualitySelect.value = 'high';
                } else if (this.useCompression && this.compressionQuality >= 0.7) {
                    imageQualitySelect.value = 'medium';
                } else {
                    imageQualitySelect.value = 'low';
                }
            }
            
            // 最大图片尺寸设置
            const maxImageSizeSelect = document.getElementById('maxImageSize');
            if (maxImageSizeSelect) {
                if (this.maxImageWidth >= 9999) {
                    maxImageSizeSelect.value = 'original';
                } else if (this.maxImageWidth === 1920) {
                    maxImageSizeSelect.value = '1920';
                } else if (this.maxImageWidth === 1280) {
                    maxImageSizeSelect.value = '1280';
                } else if (this.maxImageWidth === 800) {
                    maxImageSizeSelect.value = '800';
                }
            }
            
            // 自动压缩设置
            const autoCompressCheckbox = document.getElementById('autoCompressImages');
            if (autoCompressCheckbox) {
                autoCompressCheckbox.checked = this.autoCompressImages;
            }
            
            // 懒加载设置
            const lazyLoadCheckbox = document.getElementById('lazyLoadImages');
            if (lazyLoadCheckbox) {
                lazyLoadCheckbox.checked = this.lazyLoadImages;
            }
            
            console.log('保存设置到DOM完成');
        } catch (error) {
            console.error('保存设置到DOM失败:', error);
        }
    }

    // 新增：应用图片设置
    applyImageSettings() {
        try {
            // 获取图片质量设置
            const imageQualitySelect = document.getElementById('imageQuality');
            if (imageQualitySelect) {
                const quality = imageQualitySelect.value;
                if (quality === 'high') {
                    this.useCompression = false;
                    this.compressionQuality = 1.0;
                } else if (quality === 'medium') {
                    this.useCompression = true;
                    this.compressionQuality = 0.7;
                } else if (quality === 'low') {
                    this.useCompression = true;
                    this.compressionQuality = 0.5;
                }
            }
            
            // 获取最大图片尺寸设置
            const maxImageSizeSelect = document.getElementById('maxImageSize');
            if (maxImageSizeSelect) {
                const size = maxImageSizeSelect.value;
                if (size === 'original') {
                    this.maxImageWidth = 9999;
                } else {
                    this.maxImageWidth = parseInt(size) || 1920;
                }
            }
            
            // 获取自动压缩设置
            const autoCompressCheckbox = document.getElementById('autoCompressImages');
            if (autoCompressCheckbox) {
                this.autoCompressImages = autoCompressCheckbox.checked;
            }
            
            // 获取懒加载设置
            const lazyLoadCheckbox = document.getElementById('lazyLoadImages');
            if (lazyLoadCheckbox) {
                this.lazyLoadImages = lazyLoadCheckbox.checked;
            }
            
            // 保存设置到本地存储
            this.saveToLocalStorage();
            
            // 如果启用了自动压缩，重新压缩所有图片
            if (this.autoCompressImages && this.useCompression) {
                this.optimizeAllImages();
            }
            
            console.log('应用图片设置:', {
                useCompression: this.useCompression,
                compressionQuality: this.compressionQuality,
                maxImageWidth: this.maxImageWidth,
                autoCompressImages: this.autoCompressImages,
                lazyLoadImages: this.lazyLoadImages
            });
            
            Utils.showMessage('图片设置已应用', 'success');
            return true;
        } catch (error) {
            console.error('应用图片设置失败:', error);
            Utils.showMessage('应用设置失败: ' + error.message, 'error');
            return false;
        }
    }

    // 新增：优化所有图片
    async optimizeAllImages() {
        if (this.allImages.length === 0) {
            Utils.showMessage('没有图片需要优化', 'info');
            return;
        }
        
        if (!confirm(`将根据当前设置优化所有图片（${this.allImages.length}张），这可能需要一些时间。确定要继续吗？`)) {
            return;
        }
        
        let optimizedCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < this.allImages.length; i++) {
            const img = this.allImages[i];
            try {
                // 重新压缩图片
                const optimized = await this.compressImageData(img);
                this.allImages[i] = optimized;
                optimizedCount++;
                
                // 每处理10张图片保存一次
                if (optimizedCount % 10 === 0) {
                    this.saveToLocalStorage();
                    console.log(`已优化 ${optimizedCount} 张图片`);
                }
            } catch (error) {
                console.error(`优化图片失败: ${img.name}`, error);
                failedCount++;
            }
        }
        
        // 最终保存
        this.saveToLocalStorage();
        this.renderImages();
        
        if (optimizedCount > 0) {
            Utils.showMessage(`已优化 ${optimizedCount} 张图片，${failedCount} 张失败`, 'success');
        }
    }

    // 获取图片总大小
    getTotalImageSize() {
        return this.allImages.reduce((total, img) => {
            if (img.dataUrl) {
                return total + (img.dataUrl.length * 0.75); // Base64近似大小
            }
            return total;
        }, 0);
    }

    // 检查存储空间
    checkStorageSpace(additionalSize) {
        const currentSize = this.getTotalImageSize();
        const requiredSize = currentSize + additionalSize;
        
        if (requiredSize <= this.maxStorageSize) {
            return { hasSpace: true, requiredSize, currentSize, maxSize: this.maxStorageSize };
        }
        
        return { 
            hasSpace: false, 
            requiredSize, 
            currentSize, 
            maxSize: this.maxStorageSize,
            needIncrease: Math.ceil((requiredSize - this.maxStorageSize) / this.storageScaleFactor) * this.storageScaleFactor
        };
    }

    // 增加存储空间
    increaseStorageSpace() {
        this.maxStorageSize += this.storageScaleFactor;
        console.log(`存储空间已增加到 ${(this.maxStorageSize / 1024 / 1024).toFixed(2)} MB`);
        return this.maxStorageSize;
    }

    // 压缩图片数据
    async compressImageData(imageData) {
        if (!this.useCompression && !this.autoCompressImages) return imageData;
        
        try {
            // 获取压缩质量
            const quality = this.useCompression ? this.compressionQuality : 1.0;
            
            // 压缩图片质量
            const compressedDataUrl = await Utils.compressImage(
                imageData.dataUrl, 
                this.maxImageWidth,
                quality
            );
            
            // 转换为Base85
            const compressedBase85 = Utils.compressImageToBase85(compressedDataUrl);
            
            return {
                ...imageData,
                dataUrl: compressedDataUrl, // 保留原始压缩版本
                compressedData: compressedBase85, // Base85压缩版本
                originalSize: imageData.size,
                compressedSize: compressedBase85.length * 0.8, // Base85近似大小
                isCompressed: true
            };
        } catch (error) {
            console.error('图片压缩失败:', error);
            return imageData;
        }
    }

    setupEventListeners() {
        // 图片导入事件
        document.addEventListener('imageImportStarted', (e) => {
            this.handleImageFiles(e.detail.files);
        });

        // 页面切换事件
        window.addEventListener('pageChanged', (e) => {
            if (e.detail.page === 'images') {
                this.renderImages();
            }
        });

        // 更多页面中的图片管理按钮点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#imageManagementBtn')) {
                this.openImageManagementModal();
            }
            
            if (e.target.closest('#exportImagesBtn')) {
                this.exportImageData();
            }
            
            if (e.target.closest('#clearImagesBtn')) {
                this.clearAllImages();
            }
            
            // 新增：应用图片设置按钮
            if (e.target.closest('#applyImageSettings')) {
                e.preventDefault();
                e.stopPropagation();
                this.applyImageSettings();
            }
            
            // 新增：优化图片存储按钮
            if (e.target.closest('#optimizeStorageBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.optimizeAllImages();
            }
        });
    }

    async handleImageFiles(files) {
        if (!files || files.length === 0) return;

        console.log('开始处理图片文件，数量:', files.length);

        // 过滤掉最近处理过的文件（防止重复导入）
        const newFiles = files.filter(newFile => {
            return !this.recentlyProcessedFiles.some(existingFile =>
                existingFile.name === newFile.name &&
                existingFile.size === newFile.size &&
                Date.now() - existingFile.timestamp < 3000 // 3秒内
            );
        });

        if (newFiles.length === 0) {
            console.log('没有新文件需要导入（重复导入）');
            return;
        }

        // 记录处理过的文件
        newFiles.forEach(file => {
            this.recentlyProcessedFiles.push({
                name: file.name,
                size: file.size,
                timestamp: Date.now()
            });
        });

        // 清理过期的记录（3秒前的）
        const now = Date.now();
        this.recentlyProcessedFiles = this.recentlyProcessedFiles.filter(
            file => now - file.timestamp < 3000
        );

        let successCount = 0;
        let failedCount = 0;

        for (const file of newFiles) {
            try {
                const imageData = await this.processImageFile(file);
                if (imageData) {
                    this.allImages.push(imageData);
                    successCount++;
                    
                    // 立即保存到本地存储
                    this.saveToLocalStorage();
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error(`处理图片失败: ${file.name}`, error);
                failedCount++;
            }
        }

        // 重新渲染图片
        if (successCount > 0) {
            this.renderImages();
            
            if (successCount > 0) {
                Utils.showMessage(`成功导入 ${successCount} 张图片到万相集`, 'success');
            }
            if (failedCount > 0) {
                Utils.showMessage(`${failedCount} 张图片导入失败`, 'warning');
            }
        }
    }

    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            // 验证是否为图片
            if (!file.type.startsWith('image/')) {
                reject(new Error('不是有效的图片文件'));
                return;
            }

            // 检查文件大小（限制为20MB）
            const maxSize = 20 * 1024 * 1024; // 20MB
            if (file.size > maxSize) {
                reject(new Error('图片文件过大（最大20MB）'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // 创建图片对象以获取尺寸
                    const img = new Image();
                    img.onload = async () => {
                        try {
                            const originalData = {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                uploadTime: new Date().toISOString(),
                                dataUrl: e.target.result,
                                width: img.width,
                                height: img.height,
                                favorite: false,
                                tags: []
                            };
                            
                            // 根据设置压缩图片
                            const compressedData = await this.compressImageData(originalData);
                            
                            // 检查存储空间
                            const compressedSize = compressedData.compressedSize || (e.target.result.length * 0.75);
                            const storageCheck = this.checkStorageSpace(compressedSize);
                            
                            if (!storageCheck.hasSpace) {
                                // 存储空间不足，询问用户
                                const userConfirmed = await this.requestStorageIncrease(storageCheck);
                                if (!userConfirmed) {
                                    reject(new Error('存储空间不足，导入已取消'));
                                    return;
                                }
                            }
                            
                            // 生成最终图像数据
                            const imageData = {
                                id: ++this.imageIdCounter,
                                ...compressedData
                            };
                            
                            resolve(imageData);
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    img.onerror = () => {
                        reject(new Error('图片加载失败'));
                    };
                    
                    img.src = e.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    renderImages() {
        const fileGrid = document.getElementById('fileGrid');
        if (!fileGrid || window.navigationManager?.getCurrentPage() !== 'images') return;

        fileGrid.innerHTML = '';
        fileGrid.className = 'grid-container image-mode';

        if (this.allImages.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'image-empty-state';
            emptyState.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: var(--text-light);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            `;
            emptyState.innerHTML = `
                <i class="ti ti-photo" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3 style="margin: 0 0 8px 0; font-weight: 500;">暂无图片</h3>
                <p style="margin: 0; font-size: 14px;">导入图片后，将在此显示</p>
            `;
            fileGrid.appendChild(emptyState);
            return;
        }

        // 按上传时间降序排列
        const sortedImages = [...this.allImages].sort((a, b) => 
            new Date(b.uploadTime) - new Date(a.uploadTime)
        );

        sortedImages.forEach((imageData, index) => {
            const card = this.createImageCard(imageData, index);
            fileGrid.appendChild(card);
        });
    }

    createImageCard(imageData, index) {
        const card = document.createElement('div');
        card.className = 'grid-card image-grid-card';
        card.style.animationDelay = `${(index * 0.1)}s`;
        card.classList.add('card-appear');

        const starIcon = imageData.favorite ? 'ti-star-filled filled' : 'ti-star';

        // 确保图片有dataUrl
        if (!imageData.dataUrl) {
            console.warn('图片卡片缺少dataUrl:', imageData.name);
            return card;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title" title="${imageData.name}">${imageData.name}</div>
                <div class="card-header-icons">
                    <i class="ti ${starIcon} star-icon" data-id="${imageData.id}" title="${imageData.favorite ? '取消收藏' : '收藏'}"></i>
                </div>
            </div>
            
            <div class="image-preview-container">
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="image-preview" 
                     ${this.lazyLoadImages ? 'loading="lazy"' : ''} data-id="${imageData.id}">
            </div>
            
            <div class="card-footer">
                <button class="image-btn btn-view-image touch-feedback" data-id="${imageData.id}" 
                        title="查看大图">
                    <i class="ti ti-maximize"></i>查看
                </button>
            </div>
        `;

        // 绑定事件
        const starIconEl = card.querySelector('.star-icon');
        if (starIconEl) {
            starIconEl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.toggleFavorite(imageData.id, starIconEl);
            });
        }

        const viewBtn = card.querySelector('.btn-view-image');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.showImageModal(imageData);
            });
        }

        const previewImg = card.querySelector('.image-preview');
        if (previewImg) {
            previewImg.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.showImageModal(imageData);
            });
        }

        return card;
    }

    showImageModal(imageData) {
        console.log('打开图片预览弹窗:', imageData.name);
        
        // 设置当前查看的图片索引
        this.currentViewingImageIndex = this.allImages.findIndex(img => img.id === imageData.id);
        
        let modal = document.getElementById('imagePreviewModal');
        if (!modal) {
            this.createImageModal();
            modal = document.getElementById('imagePreviewModal');
        }

        const modalBody = document.getElementById('imageModalBody');
        const modalTitle = document.getElementById('imageModalTitle');
        
        if (modalTitle) modalTitle.textContent = imageData.name;
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="image-navigation">
                    <button class="nav-btn prev-btn" id="prevImageBtn" title="上一张" 
                            ${this.currentViewingImageIndex === 0 ? 'disabled' : ''}>
                        <i class="ti ti-chevron-left"></i>
                    </button>
                    <div class="image-viewer" id="imageViewer">
                        <div class="image-slide current">
                            <img src="${imageData.dataUrl}" alt="${imageData.name}" class="full-image-view" 
                                 id="fullImageView" data-src="${imageData.dataUrl}">
                        </div>
                    </div>
                    <button class="nav-btn next-btn" id="nextImageBtn" title="下一张"
                            ${this.currentViewingImageIndex === this.allImages.length - 1 ? 'disabled' : ''}>
                        <i class="ti ti-chevron-right"></i>
                    </button>
                </div>
                <div class="image-details" style="padding: 16px; background: var(--bg-color); border-top: 1px solid var(--border-color);">
                    <div class="image-detail-item">
                        <span class="detail-label">文件名:</span>
                        <span class="detail-value">${imageData.name}</span>
                        <button class="btn btn-sm btn-success" id="renameImageBtn" style="margin-left: 10px;">
                            <i class="ti ti-edit"></i>重命名
                        </button>
                    </div>
                    <div class="image-detail-item">
                        <span class="detail-label">尺寸:</span>
                        <span class="detail-value">${imageData.width} × ${imageData.height}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="detail-label">大小:</span>
                        <span class="detail-value">${Utils.formatFileSize(imageData.size)}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="detail-label">类型:</span>
                        <span class="detail-value">${imageData.type}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="detail-label">上传时间:</span>
                        <span class="detail-value">${new Date(imageData.uploadTime).toLocaleString()}</span>
                    </div>
                    <div class="image-detail-item">
                        <span class="detail-label">图片链接:</span>
                        <button class="btn btn-sm btn-info" id="copyImageLinkBtn" style="margin-left: 10px;">
                            <i class="ti ti-copy"></i>复制链接
                        </button>
                    </div>
                </div>
            `;
        }

        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // 立即绑定事件
        this.bindImageModalEvents(imageData);
    }

    // 绑定图片弹窗事件
    bindImageModalEvents(imageData) {
        // 上一张按钮
        const prevBtn = document.getElementById('prevImageBtn');
        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPrevImage();
            };
        }
        
        // 下一张按钮
        const nextBtn = document.getElementById('nextImageBtn');
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showNextImage();
            };
        }
        
        // 重命名按钮
        const renameBtn = document.getElementById('renameImageBtn');
        if (renameBtn) {
            renameBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.renameImage(imageData.id);
            };
        }
        
        // 复制链接按钮
        const copyBtn = document.getElementById('copyImageLinkBtn');
        if (copyBtn) {
            copyBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(imageData.dataUrl)
                    .then(() => Utils.showMessage('图片链接已复制到剪贴板', 'success'))
                    .catch(() => Utils.showMessage('复制失败，请手动复制', 'error'));
            };
        }
        
        // 下载按钮（在弹窗底部）
        const downloadBtn = document.getElementById('downloadFromModal');
        if (downloadBtn) {
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.downloadImage(imageData);
            };
        }
        
        // 删除按钮
        const deleteBtn = document.getElementById('deleteImageBtn');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteImageFromModal(imageData.id);
            };
        }
        
        // 双击图片打开新窗口
        const fullImageView = document.getElementById('fullImageView');
        if (fullImageView) {
            fullImageView.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openImageInNewWindow(imageData);
            });
        }
    }

    createImageModal() {
        const modal = document.createElement('div');
        modal.id = 'imagePreviewModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content image-modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="imageModalTitle">图片预览</h3>
                    <button class="btn btn-secondary touch-feedback" id="closeImageModal">
                        <i class="ti ti-x"></i>
                        关闭
                    </button>
                </div>
                <div class="modal-body image-modal-body" id="imageModalBody">
                    <!-- 图片将在这里显示 -->
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger touch-feedback" id="deleteImageBtn">
                        <i class="ti ti-trash"></i>
                        删除
                    </button>
                    <button class="btn btn-primary touch-feedback" id="downloadFromModal">
                        <i class="ti ti-download"></i>
                        下载文件
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        document.getElementById('closeImageModal').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }

    // 显示上一张图片（带动画）
    showPrevImage() {
        if (this.currentViewingImageIndex <= 0) return;
        
        const imageViewer = document.getElementById('imageViewer');
        if (!imageViewer) return;
        
        // 获取当前图片数据
        this.currentViewingImageIndex--;
        const imageData = this.allImages[this.currentViewingImageIndex];
        
        // 创建新图片元素
        const newSlide = document.createElement('div');
        newSlide.className = 'image-slide new-slide';
        newSlide.style.transform = 'translateX(-100%)';
        newSlide.innerHTML = `
            <img src="${imageData.dataUrl}" alt="${imageData.name}" class="full-image-view">
        `;
        
        // 添加新图片到容器
        imageViewer.appendChild(newSlide);
        
        // 获取当前显示的图片
        const currentSlide = imageViewer.querySelector('.image-slide.current');
        
        // 强制重绘
        void newSlide.offsetWidth;
        
        // 添加动画类
        newSlide.classList.add('slide-in');
        currentSlide.classList.add('slide-out-right');
        
        // 动画结束后更新状态
        setTimeout(() => {
            // 移除旧图片
            currentSlide.remove();
            
            // 更新新图片的状态
            newSlide.classList.remove('new-slide', 'slide-in');
            newSlide.classList.add('current');
            newSlide.style.transform = '';
            
            // 更新其他界面元素
            this.updateImageInfo(imageData);
            this.updateNavButtons();
        }, 300);
    }

    // 显示下一张图片（带动画）
    showNextImage() {
        if (this.currentViewingImageIndex >= this.allImages.length - 1) return;
        
        const imageViewer = document.getElementById('imageViewer');
        if (!imageViewer) return;
        
        // 获取当前图片数据
        this.currentViewingImageIndex++;
        const imageData = this.allImages[this.currentViewingImageIndex];
        
        // 创建新图片元素
        const newSlide = document.createElement('div');
        newSlide.className = 'image-slide new-slide';
        newSlide.style.transform = 'translateX(100%)';
        newSlide.innerHTML = `
            <img src="${imageData.dataUrl}" alt="${imageData.name}" class="full-image-view">
        `;
        
        // 添加新图片到容器
        imageViewer.appendChild(newSlide);
        
        // 获取当前显示的图片
        const currentSlide = imageViewer.querySelector('.image-slide.current');
        
        // 强制重绘
        void newSlide.offsetWidth;
        
        // 添加动画类
        newSlide.classList.add('slide-in');
        currentSlide.classList.add('slide-out-left');
        
        // 动画结束后更新状态
        setTimeout(() => {
            // 移除旧图片
            currentSlide.remove();
            
            // 更新新图片的状态
            newSlide.classList.remove('new-slide', 'slide-in');
            newSlide.classList.add('current');
            newSlide.style.transform = '';
            
            // 更新其他界面元素
            this.updateImageInfo(imageData);
            this.updateNavButtons();
        }, 300);
    }

    // 更新图片信息
    updateImageInfo(imageData) {
        const modalTitle = document.getElementById('imageModalTitle');
        if (modalTitle) modalTitle.textContent = imageData.name;
        
        // 更新详细信息区域
        const detailsHTML = `
            <div class="image-detail-item">
                <span class="detail-label">文件名:</span>
                <span class="detail-value">${imageData.name}</span>
                <button class="btn btn-sm btn-success" id="renameImageBtn" style="margin-left: 10px;">
                    <i class="ti ti-edit"></i>重命名
                </button>
            </div>
            <div class="image-detail-item">
                <span class="detail-label">尺寸:</span>
                <span class="detail-value">${imageData.width} × ${imageData.height}</span>
            </div>
            <div class="image-detail-item">
                <span class="detail-label">大小:</span>
                <span class="detail-value">${Utils.formatFileSize(imageData.size)}</span>
            </div>
            <div class="image-detail-item">
                <span class="detail-label">类型:</span>
                <span class="detail-value">${imageData.type}</span>
            </div>
            <div class="image-detail-item">
                <span class="detail-label">上传时间:</span>
                <span class="detail-value">${new Date(imageData.uploadTime).toLocaleString()}</span>
            </div>
            <div class="image-detail-item">
                <span class="detail-label">图片链接:</span>
                <button class="btn btn-sm btn-info" id="copyImageLinkBtn" style="margin-left: 10px;">
                    <i class="ti ti-copy"></i>复制链接
                </button>
            </div>
        `;
        
        const detailsContainer = document.querySelector('.image-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = detailsHTML;
            // 重新绑定事件
            this.bindImageDetailsEvents(imageData);
        }
    }

    // 更新导航按钮状态
    updateNavButtons() {
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentViewingImageIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentViewingImageIndex === this.allImages.length - 1;
        }
    }

    // 绑定图片详情区域事件
    bindImageDetailsEvents(imageData) {
        // 重命名按钮
        const renameBtn = document.getElementById('renameImageBtn');
        if (renameBtn) {
            renameBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.renameImage(imageData.id);
            };
        }
        
        // 复制链接按钮
        const copyBtn = document.getElementById('copyImageLinkBtn');
        if (copyBtn) {
            copyBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(imageData.dataUrl)
                    .then(() => Utils.showMessage('图片链接已复制到剪贴板', 'success'))
                    .catch(() => Utils.showMessage('复制失败，请手动复制', 'error'));
            };
        }
    }

    // 更新图片弹窗内容
    updateImageModal(imageData) {
        const modalTitle = document.getElementById('imageModalTitle');
        if (modalTitle) modalTitle.textContent = imageData.name;
        
        // 更新图片
        const imageViewer = document.getElementById('imageViewer');
        if (imageViewer) {
            // 清除现有内容
            imageViewer.innerHTML = '';
            
            // 添加当前图片
            const slide = document.createElement('div');
            slide.className = 'image-slide current';
            slide.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="full-image-view">
            `;
            imageViewer.appendChild(slide);
        }
        
        // 更新详细信息
        this.updateImageInfo(imageData);
        
        // 更新导航按钮状态
        this.updateNavButtons();
        
        // 重新绑定事件
        this.bindImageModalEvents(imageData);
    }

    // 在新窗口打开图片
    openImageInNewWindow(imageData) {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${imageData.name}</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: #f0f0f0; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh;
                        }
                        img { 
                            max-width: 100%; 
                            max-height: 100vh; 
                            object-fit: contain; 
                            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                        }
                    </style>
                </head>
                <body>
                    <img src="${imageData.dataUrl}" alt="${imageData.name}">
                </body>
                </html>
            `);
        }
    }

    // 重命名图片
    renameImage(imageId) {
        const imageIndex = this.allImages.findIndex(img => img.id === imageId);
        if (imageIndex === -1) return;
        
        const oldName = this.allImages[imageIndex].name;
        const newName = prompt('请输入新的文件名（包含扩展名）:', oldName);
        
        if (newName && newName.trim() !== '' && newName !== oldName) {
            // 验证文件名是否包含扩展名
            if (!newName.includes('.')) {
                Utils.showMessage('文件名必须包含扩展名（如 .jpg、.png）', 'warning');
                return;
            }
            
            this.allImages[imageIndex].name = newName.trim();
            this.saveToLocalStorage();
            
            // 更新弹窗中的标题
            const modalTitle = document.getElementById('imageModalTitle');
            if (modalTitle) {
                modalTitle.textContent = newName;
            }
            
            // 重新渲染图片列表
            this.renderImages();
            
            Utils.showMessage('图片重命名成功', 'success');
        }
    }

    // 从弹窗中删除图片
    deleteImageFromModal(imageId) {
        if (confirm('确定要删除这张图片吗？此操作不可撤销！')) {
            const imageIndex = this.allImages.findIndex(img => img.id === imageId);
            if (imageIndex === -1) return;

            const imageName = this.allImages[imageIndex].name;
            this.allImages.splice(imageIndex, 1);
            
            this.saveToLocalStorage();
            
            // 关闭弹窗
            const modal = document.getElementById('imagePreviewModal');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
            
            // 重新渲染图片列表
            this.renderImages();
            
            Utils.showMessage(`图片 "${imageName}" 已删除`, 'success');
        }
    }

    downloadImage(imageData) {
        try {
            const link = document.createElement('a');
            link.href = imageData.dataUrl;
            link.download = imageData.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Utils.showMessage('图片下载完成', 'success');
        } catch (error) {
            console.error('下载图片失败:', error);
            Utils.showMessage('下载失败', 'error');
        }
    }

    // 导出图片数据 - 修复重复导出问题
    exportImageData() {
        // 防止重复点击
        if (this.isExporting) {
            console.log('导出操作正在进行中，请稍候...');
            return;
        }
        
        if (this.allImages.length === 0) {
            Utils.showMessage('没有图片数据可以导出', 'warning');
            return;
        }
        
        this.isExporting = true;
        
        try {
            const exportData = this.allImages.map(img => {
                const imgCopy = { ...img };
                // 移除DataURL以减小文件大小，但保留其他元数据
                delete imgCopy.dataUrl;
                return imgCopy;
            });
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // 使用固定文件名，不带时间戳
            link.href = url;
            link.download = 'image-collection-backup.json';
            
            // 添加到页面并点击
            document.body.appendChild(link);
            link.click();
            
            // 延迟清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                this.isExporting = false;
            }, 100);
            
            Utils.showMessage('图片数据已导出', 'success');
            console.log('图片数据导出完成，文件名: image-collection-backup.json');
        } catch (error) {
            console.error('导出图片数据失败:', error);
            Utils.showMessage('导出失败: ' + error.message, 'error');
            this.isExporting = false;
        }
    }

    toggleFavorite(imageId, starElement) {
        const imageIndex = this.allImages.findIndex(img => img.id === imageId);
        if (imageIndex === -1) return;

        const isFavorite = !this.allImages[imageIndex].favorite;
        this.allImages[imageIndex].favorite = isFavorite;

        // 更新图标
        starElement.classList.toggle('filled', isFavorite);
        starElement.classList.toggle('ti-star-filled', isFavorite);
        starElement.classList.toggle('ti-star', !isFavorite);
        starElement.title = isFavorite ? '取消收藏' : '收藏';

        // 添加动画
        starElement.classList.add('animating');
        setTimeout(() => {
            starElement.classList.remove('animating');
        }, 600);
        
        if (isFavorite) {
            Utils.createStarAnimation(starElement);
        }

        this.saveToLocalStorage();
        
        // 重新排序显示
        if (window.navigationManager?.getCurrentPage() === 'images') {
            setTimeout(() => {
                this.renderImages();
            }, 300);
        }

        Utils.showMessage(
            isFavorite ? '图片已收藏' : '已取消收藏',
            'success'
        );
    }

    deleteImage(imageId) {
        if (confirm('确定要删除这张图片吗？此操作不可撤销！')) {
            const imageIndex = this.allImages.findIndex(img => img.id === imageId);
            if (imageIndex === -1) return;

            const imageName = this.allImages[imageIndex].name;
            this.allImages.splice(imageIndex, 1);
            
            this.saveToLocalStorage();
            this.renderImages();
            
            Utils.showMessage(`图片 "${imageName}" 已删除`, 'success');
        }
    }

    // 统计信息
    getStats() {
        const totalSize = this.getTotalImageSize();
        const storagePercentage = (totalSize / this.maxStorageSize * 100).toFixed(1);
        
        return {
            totalImages: this.allImages.length,
            totalSize: totalSize,
            compressedImages: this.allImages.filter(img => img.isCompressed).length,
            storageUsage: `${(totalSize / 1024 / 1024).toFixed(2)} MB / ${(this.maxStorageSize / 1024 / 1024).toFixed(2)} MB`,
            storagePercentage: storagePercentage,
            favorites: this.allImages.filter(img => img.favorite).length
        };
    }

    // 搜索图片
    searchImages(query) {
        const lowerQuery = query.toLowerCase();
        return this.allImages.filter(img => 
            img.name.toLowerCase().includes(lowerQuery)
        );
    }

    // 清空所有图片
    clearAllImages() {
        if (confirm('确定要清空所有图片吗？此操作无法撤销！')) {
            this.allImages = [];
            this.imageIdCounter = 0;
            this.maxStorageSize = 100 * 1024 * 1024; // 重置为初始值
            this.saveToLocalStorage();
            this.renderImages();
            Utils.showMessage('所有图片已清空，存储空间已重置', 'success');
            return true;
        }
        return false;
    }

    // 请求增加存储空间
    async requestStorageIncrease(storageCheck) {
        return new Promise((resolve) => {
            // 创建自定义确认对话框
            const modal = document.createElement('div');
            modal.className = 'storage-warning-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;
            
            const requiredIncreaseMB = (storageCheck.needIncrease / 1024 / 1024).toFixed(2);
            const newTotalMB = ((storageCheck.maxSize + storageCheck.needIncrease) / 1024 / 1024).toFixed(2);
            
            modal.innerHTML = `
                <div style="
                    background: var(--bg-color);
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: var(--shadow);
                ">
                    <h3 style="margin: 0 0 20px 0; color: var(--warning-color);">
                        <i class="ti ti-alert-triangle"></i> 存储空间不足
                    </h3>
                    
                    <div style="margin-bottom: 20px; color: var(--text-color);">
                        <p>当前已使用: ${(storageCheck.currentSize / 1024 / 1024).toFixed(2)} MB</p>
                        <p>当前上限: ${(storageCheck.maxSize / 1024 / 1024).toFixed(2)} MB</p>
                        <p>需要额外: ${(storageCheck.requiredSize / 1024 / 1024).toFixed(2)} MB</p>
                        <p style="margin-top: 15px; font-weight: bold;">
                            需要增加存储空间 ${requiredIncreaseMB} MB
                        </p>
                        <p>增加后总上限: ${newTotalMB} MB</p>
                    </div>
                    
                    <div style="
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 25px;
                    ">
                        <button id="cancelStorageIncrease" style="
                            padding: 10px 20px;
                            border: none;
                            background: var(--border-color);
                            color: var(--text-color);
                            border-radius: 6px;
                            cursor: pointer;
                            transition: background-color 0.2s;
                        ">取消导入</button>
                        <button id="confirmStorageIncrease" style="
                            padding: 10px 20px;
                            border: none;
                            background: var(--primary-color);
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: background-color 0.2s;
                        ">增加空间并继续</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const cancelBtn = document.getElementById('cancelStorageIncrease');
            const confirmBtn = document.getElementById('confirmStorageIncrease');
            
            cancelBtn.onclick = () => {
                modal.remove();
                resolve(false);
            };
            
            confirmBtn.onclick = () => {
                modal.remove();
                // 增加存储空间
                this.increaseStorageSpace();
                resolve(true);
            };
            
            // 添加悬停效果
            cancelBtn.onmouseenter = () => cancelBtn.style.backgroundColor = 'var(--border-color-dark)';
            cancelBtn.onmouseleave = () => cancelBtn.style.backgroundColor = 'var(--border-color)';
            confirmBtn.onmouseenter = () => confirmBtn.style.backgroundColor = 'var(--primary-color-dark)';
            confirmBtn.onmouseleave = () => confirmBtn.style.backgroundColor = 'var(--primary-color)';
        });
    }

    // 打开图片管理弹窗
    openImageManagementModal() {
        const modal = document.getElementById('imageManagementModal');
        if (modal) {
            this.renderImageManagementList();
            modal.classList.add('active');
        } else {
            console.error('图片管理弹窗未找到');
        }
    }

    createImageManagementModal() {
        // 模态框已经存在于HTML中，只需要确保事件绑定
        const modal = document.getElementById('imageManagementModal');
        if (!modal) return;
        
        // 绑定关闭事件
        document.getElementById('closeImageManagementModal').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    renderImageManagementList() {
        const listElement = document.getElementById('imageManagementList');
        if (!listElement) return;
        
        listElement.innerHTML = '';
        
        if (this.allImages.length === 0) {
            listElement.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="ti ti-photo-off" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>暂无图片</h3>
                    <p>尚未导入任何图片</p>
                </div>
            `;
            return;
        }
        
        // 显示存储统计
        const stats = this.getStats();
        const statsHtml = `
            <div class="storage-stats" style="
                background: var(--bg-color);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid var(--border-color);
            ">
                <h4 style="margin: 0 0 10px 0;">存储统计</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-light);">图片总数</div>
                        <div style="font-size: 18px; font-weight: bold;">${stats.totalImages}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light);">已用空间</div>
                        <div style="font-size: 18px; font-weight: bold;">${(stats.totalSize / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light);">空间上限</div>
                        <div style="font-size: 18px; font-weight: bold;">${(this.maxStorageSize / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light);">使用率</div>
                        <div style="font-size: 18px; font-weight: bold; color: ${stats.storagePercentage > 90 ? 'var(--warning-color)' : 'var(--success-color)'}">
                            ${stats.storagePercentage}%
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        listElement.innerHTML = statsHtml;
        
        // 添加图片列表
        this.allImages.forEach((image) => {
            const item = document.createElement('div');
            item.className = 'file-management-item';
            item.innerHTML = `
                <div class="file-info">
                    <i class="ti ti-photo"></i>
                    <div>
                        <div class="file-name">${image.name}</div>
                        <div class="file-meta">${Utils.formatFileSize(image.size)} • ${new Date(image.uploadTime).toLocaleDateString()}</div>
                        ${image.isCompressed ? '<span style="font-size: 12px; color: var(--success-color);">已压缩</span>' : ''}
                        ${image.favorite ? '<span style="font-size: 12px; color: var(--warning-color);">已收藏</span>' : ''}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-sm btn-secondary btn-view" data-id="${image.id}">
                        <i class="ti ti-eye"></i>
                    </button>
                </div>
            `;
            
            // 绑定查看按钮事件
            const viewBtn = item.querySelector('.btn-view');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showImageModal(image);
                });
            }
            
            listElement.appendChild(item);
        });
    }

    // 获取所有图片数据
    getAllImagesData() {
        return this.allImages;
    }

    // 设置图片数据（用于恢复备份）
    setImagesData(imagesData) {
        if (Array.isArray(imagesData)) {
            // 恢复Base85数据
            this.allImages = imagesData.map(img => {
                if (img.compressedData) {
                    return {
                        ...img,
                        dataUrl: Utils.restoreImageFromBase85(img.compressedData, img.type)
                    };
                }
                return img;
            });
            
            this.imageIdCounter = this.allImages.length > 0 ? 
                Math.max(...this.allImages.map(img => img.id)) + 1 : 0;
            
            this.saveToLocalStorage();
            this.renderImages();
            return true;
        }
        return false;
    }

    // 导入图片（供API调用）
    async importImages(files) {
        return this.handleImageFiles(files);
    }

    // 获取所有图片
    getAllImages() {
        return this.allImages;
    }

    // 导出所有图片
    exportAllImages() {
        return this.exportImageData();
    }
}

// 创建全局图片管理器实例
window.imageManager = new ImageManager();