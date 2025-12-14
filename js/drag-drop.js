// 拖拽导入管理器
class DragDropManager {
    constructor() {
        this.draggedFiles = [];
        this.dragEnterCount = 0;
        this.dragOverlayVisible = false;
        this.fileIdCounter = 0;
        this.tempStorageKey = 'dragDropTempData';
        this.lastDropTime = 0; // 记录上次拖拽时间
        this.dropCooldown = 500; // 500毫秒冷却时间
        
        // 重复文件处理相关属性
        this.duplicateFiles = null;
        this.uniqueFiles = null;
        this.currentDuplicateIndex = 0;
        this.importedFiles = [];
        this.skippedFiles = [];
        this.replacedFiles = [];
        
        this.init();
    }

    init() {
        this.createDragDropOverlay();
        this.createDragDropModal();
        this.setupEventListeners();
        this.loadTempData();
    }

    saveTempData() {
        try {
            const tempData = {
                draggedFiles: this.draggedFiles,
                fileIdCounter: this.fileIdCounter,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem(this.tempStorageKey, JSON.stringify(tempData));
        } catch (error) {
            console.error('保存临时数据失败:', error);
        }
    }

    loadTempData() {
        try {
            const savedData = localStorage.getItem(this.tempStorageKey);
            if (savedData) {
                const tempData = JSON.parse(savedData);
                
                if (tempData.draggedFiles && Array.isArray(tempData.draggedFiles)) {
                    this.draggedFiles = tempData.draggedFiles;
                    this.fileIdCounter = tempData.fileIdCounter || this.draggedFiles.length;
                }
            }
        } catch (error) {
            console.error('加载临时数据失败:', error);
            this.clearTempData();
        }
    }

    clearTempData() {
        try {
            localStorage.removeItem(this.tempStorageKey);
        } catch (error) {
            console.error('清除临时数据失败:', error);
        }
    }

    getNextFileId() {
        return this.fileIdCounter++;
    }

    createDragDropOverlay() {
        const existing = document.getElementById('dragDropOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'dragDropOverlay';
        overlay.className = 'drag-drop-overlay';
        overlay.innerHTML = `
            <div class="drag-drop-indicator">
                <i class="ti ti-cloud-upload"></i>
                <h3>松开鼠标导入文件</h3>
                <p>将文件拖拽到页面任意位置即可导入系统</p>
                <p class="drag-drop-hint-image">图片文件将自动导入"万相集"</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    createDragDropModal() {
        const existing = document.getElementById('dragDropModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'dragDropModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content drag-drop-modal">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="ti ti-file-import"></i>
                        拖拽导入文件
                    </h3>
                </div>
                
                <div class="drag-drop-stats">
                    <span>共选择 <strong id="fileCount">0</strong> 个文件</span>
                    <span>总大小: <strong id="totalSize">0 B</strong></span>
                </div>
                
                <div class="drag-drop-hint">
                    <i class="ti ti-info-circle"></i>
                    提示：
                    <ul style="margin: 8px 0 8px 20px;">
                        <li>您可以继续拖拽文件到此处添加更多文件</li>
                        <li>图片文件将自动导入"万相集"</li>
                        <li>非图片文件可选择分类导入</li>
                    </ul>
                </div>

                <div class="modal-body">
                    <div class="drag-drop-content">
                        <div class="drag-drop-files" id="dragDropFiles">
                            <div class="drag-drop-file-list" id="dragDropFileList">
                                <div class="drag-drop-empty">
                                    <i class="ti ti-cloud-upload"></i>
                                    <h4>暂无文件</h4>
                                    <p>将文件拖拽到此处添加</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelDragDrop">
                        <i class="ti ti-x"></i>
                        取消
                    </button>
                    <button class="btn btn-primary" id="confirmDragDrop" disabled>
                        <i class="ti ti-check"></i>
                        开始导入
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        this.bindModalEvents();
    }

    setupEventListeners() {
        // 为主文档绑定拖拽事件
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        
        window.addEventListener('blur', () => {
            if (this.dragOverlayVisible) {
                this.dragEnterCount = 0;
                this.hideDragOverlay();
            }
        });
        
        document.addEventListener('mouseleave', (e) => {
            if (this.dragOverlayVisible && e.clientY <= 0) {
                this.dragEnterCount = 0;
                this.hideDragOverlay();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('file-category-select')) {
                const fileId = parseInt(e.target.dataset.fileId);
                const category = e.target.value;
                this.updateFileCategory(fileId, category);
            }
        });
    }

    updateFileCategory(fileId, category) {
        const fileIndex = this.draggedFiles.findIndex(file => file.dragDropId === fileId);
        if (fileIndex !== -1) {
            this.draggedFiles[fileIndex].selectedCategory = category;
            this.saveTempData();
        }
    }

    bindModalEvents() {
        const modal = document.getElementById('dragDropModal');
        const cancelBtn = document.getElementById('cancelDragDrop');
        const confirmBtn = document.getElementById('confirmDragDrop');
        const filesArea = document.getElementById('dragDropFiles');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal(true));
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmImport());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(true);
                }
            });
        }

        // 为模态框内的文件区域单独绑定事件
        if (filesArea) {
            filesArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                filesArea.classList.add('drag-over');
            });

            filesArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!e.relatedTarget || !filesArea.contains(e.relatedTarget)) {
                    filesArea.classList.remove('drag-over');
                }
            });

            filesArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                filesArea.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    console.log('模态框内部拖拽');
                    this.processDroppedFiles(files, true);
                }
            });
        }
    }

    handleDragEnter(e) {
        // 如果拖拽目标在模态框内，不显示全局覆盖层
        const modal = document.getElementById('dragDropModal');
        if (modal && modal.contains(e.target)) {
            return;
        }
        
        if (!this.hasFiles(e)) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.dragEnterCount++;
        
        if (this.dragEnterCount === 1) {
            this.showDragOverlay();
        }
    }

    handleDragOver(e) {
        // 如果拖拽目标在模态框内，不处理
        const modal = document.getElementById('dragDropModal');
        if (modal && modal.contains(e.target)) {
            return;
        }
        
        if (!this.hasFiles(e)) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDragLeave(e) {
        if (!this.hasFiles(e)) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const relatedTarget = e.relatedTarget;
        
        if (!relatedTarget || relatedTarget.nodeName === 'HTML' || !document.contains(relatedTarget)) {
            this.dragEnterCount = 0;
            this.hideDragOverlay();
        } else {
            this.dragEnterCount = Math.max(0, this.dragEnterCount - 1);
            
            if (this.dragEnterCount === 0) {
                this.hideDragOverlay();
            }
        }
    }

    handleDrop(e) {
        // 如果拖拽目标在模态框内，由模态框的drop事件处理
        const modal = document.getElementById('dragDropModal');
        if (modal && modal.contains(e.target)) {
            return;
        }
        
        if (!this.hasFiles(e)) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.dragEnterCount = 0;
        this.hideDragOverlay();

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            console.log('全局拖拽');
            this.processDroppedFiles(files, false);
        }
    }

    hasFiles(e) {
        if (!e.dataTransfer) return false;
        
        const types = e.dataTransfer.types;
        const hasFileTypes = types && (types.includes('Files') || types.includes('application/x-moz-file'));
        
        if (!hasFileTypes) return false;
        
        return true;
    }

    // 检查是否为图片文件
    isImageFile(file) {
        if (!file || !file.type) return false;
        
        const imageTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/bmp', 'image/webp', 'image/svg+xml', 'image/tiff',
            'image/ico', 'image/x-icon'
        ];
        
        const imageExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', 
            '.svg', '.tiff', '.tif', '.ico', '.heic', '.heif', 
            '.avif', '.jfif', '.pjp', '.pjpeg'
        ];
        
        // 检查MIME类型
        if (imageTypes.some(type => file.type.toLowerCase().includes(type))) {
            return true;
        }
        
        // 检查文件扩展名
        const fileName = file.name.toLowerCase();
        return imageExtensions.some(ext => fileName.endsWith(ext));
    }

    showDragOverlay() {
        if (this.dragOverlayVisible) return;
        
        this.dragOverlayVisible = true;
        document.body.classList.add('drag-over');
        
        const overlay = document.getElementById('dragDropOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            setTimeout(() => overlay.classList.add('active'), 10);
        }
    }

    hideDragOverlay() {
        if (!this.dragOverlayVisible) return;
        
        this.dragOverlayVisible = false;
        document.body.classList.remove('drag-over');
        
        const overlay = document.getElementById('dragDropOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    processDroppedFiles(files, fromModal = false) {
        // 防止重复处理：检查距离上次处理的时间
        const now = Date.now();
        if (now - this.lastDropTime < this.dropCooldown) {
            console.log('跳过重复的拖拽事件，冷却时间中');
            return;
        }
        this.lastDropTime = now;
        
        console.log(`处理拖拽文件: ${files.length}个, 来源: ${fromModal ? '模态框' : '全局'}`);
        
        // 分离图片和非图片文件
        const imageFiles = files.filter(file => this.isImageFile(file));
        const nonImageFiles = files.filter(file => !this.isImageFile(file));
        
        console.log(`文件分类: 图片=${imageFiles.length}, 非图片=${nonImageFiles.length}`);
        
        // 处理图片文件 - 直接导入万相集
        if (imageFiles.length > 0) {
            this.processImageFiles(imageFiles);
        }
        
        // 处理非图片文件
        if (nonImageFiles.length > 0) {
            // 如果是从模态框内部拖拽的，直接添加到模态框
            // 如果是从全局拖拽的，先显示模态框再添加
            if (fromModal) {
                this.addFilesToModal(nonImageFiles);
            } else {
                this.addFilesToModal(nonImageFiles);
                this.showModal();
            }
        }
        
        // 显示分类提示
        if (imageFiles.length > 0 && nonImageFiles.length > 0) {
            Utils.showMessage(`已分离 ${imageFiles.length} 张图片，${nonImageFiles.length} 个文件等待导入`, 'info');
        } else if (imageFiles.length > 0 && nonImageFiles.length === 0) {
            Utils.showMessage(`${imageFiles.length} 张图片已处理`, 'success');
        } else if (imageFiles.length === 0 && nonImageFiles.length > 0) {
            if (!fromModal) {
                this.showModal();
            }
        }
    }

    // 处理图片文件导入到万相集
    async processImageFiles(imageFiles) {
        if (!imageFiles || imageFiles.length === 0) return;
        
        try {
            // 检查图片管理器是否存在
            if (!window.imageManager) {
                Utils.showMessage('万相集功能未初始化，图片导入失败', 'error');
                return;
            }
            
            // 使用图片管理器的导入方法
            await window.imageManager.importImages(imageFiles);
            
        } catch (error) {
            console.error('处理图片文件失败:', error);
            Utils.showMessage('部分图片处理失败: ' + error.message, 'error');
        }
    }

    showModal() {
        const modal = document.getElementById('dragDropModal');
        if (!modal) return;
        
        this.renderFileList();
        this.updateStats();
        
        modal.style.display = 'flex';
        modal.style.zIndex = '10003';
        document.body.classList.add('modal-open');
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    closeModal(isCancel = false) {
        const modal = document.getElementById('dragDropModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.zIndex = '';
                document.body.classList.remove('modal-open');
                
                if (isCancel) {
                    this.clearModalData();
                }
            }, 300);
        }
    }

    clearModalData() {
        this.draggedFiles = [];
        this.fileIdCounter = 0;
        this.clearTempData();
    }

    addFilesToModal(files) {
        if (!files || files.length === 0) return;
        
        // 过滤重复文件（基于文件名、大小和最后修改时间）
        const newFiles = files.filter(newFile => {
            return !this.draggedFiles.some(existingFile => 
                existingFile.name === newFile.name && 
                existingFile.size === newFile.size &&
                existingFile.lastModified === newFile.lastModified
            );
        });
        
        if (newFiles.length === 0) {
            Utils.showMessage('没有发现新文件', 'info');
            return;
        }
        
        console.log(`添加新文件到模态框: ${newFiles.length}个`);
        
        // 为每个新文件读取内容并添加到临时存储
        const filePromises = newFiles.map(async (file) => {
            try {
                const content = await this.readFileContentImmediately(file);
                
                const fileData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    dragDropId: this.getNextFileId(),
                    selectedCategory: 'items', // 默认分类
                    content: content,
                    isImage: this.isImageFile(file),
                    addedTime: Date.now() // 添加时间戳
                };
                
                return fileData;
            } catch (error) {
                console.error(`读取文件内容失败: ${file.name}`, error);
                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    dragDropId: this.getNextFileId(),
                    selectedCategory: 'items',
                    content: null,
                    readError: true,
                    isImage: this.isImageFile(file),
                    addedTime: Date.now()
                };
            }
        });

        Promise.all(filePromises).then(fileDataArray => {
            // 再次检查，确保没有重复
            const uniqueFileDataArray = fileDataArray.filter(newFile => {
                return !this.draggedFiles.some(existingFile => 
                    existingFile.name === newFile.name && 
                    existingFile.size === newFile.size &&
                    existingFile.lastModified === newFile.lastModified
                );
            });
            
            console.log(`去重后实际添加: ${uniqueFileDataArray.length}个`);
            
            if (uniqueFileDataArray.length === 0) {
                Utils.showMessage('所有文件都已存在', 'info');
                return;
            }
            
            // 添加到列表
            uniqueFileDataArray.forEach(fileData => {
                this.draggedFiles.push(fileData);
            });
            
            this.saveTempData();
            this.appendNewFilesToModal(uniqueFileDataArray);
            this.updateStats();
            
            Utils.showMessage(`已添加 ${uniqueFileDataArray.length} 个文件`, 'success');
        });
    }

    // 立即读取文件内容
    async readFileContentImmediately(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            
            // 如果是图片文件，读取为DataURL
            if (this.isImageFile(file)) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    // 只添加新文件到列表
    appendNewFilesToModal(newFiles) {
        const fileList = document.getElementById('dragDropFileList');
        if (!fileList) return;
        
        const emptyElement = fileList.querySelector('.drag-drop-empty');
        if (emptyElement && this.draggedFiles.length > 0) {
            emptyElement.remove();
        }
        
        newFiles.forEach(fileData => {
            // 检查是否已存在相同ID的元素
            const existingElement = document.querySelector(`.drag-drop-file-item[data-file-id="${fileData.dragDropId}"]`);
            if (!existingElement) {
                const fileElement = this.createFileElement(fileData);
                fileList.appendChild(fileElement);
            }
        });
        
        this.bindRemoveEvents();
    }

    // 创建单个文件元素
    createFileElement(fileData) {
        const fileElement = document.createElement('div');
        fileElement.className = 'drag-drop-file-item';
        fileElement.dataset.fileId = fileData.dragDropId;
        fileElement.dataset.fileName = fileData.name; // 添加文件名属性用于调试
        
        const fileExtension = fileData.name.split('.').pop() || '文件';
        
        fileElement.innerHTML = `
            <div class="drag-drop-file-icon">
                <i class="ti ${Utils.getFileIcon(fileData.name)}"></i>
            </div>
            <div class="drag-drop-file-info">
                <div class="drag-drop-file-name">${fileData.name}</div>
                <div class="drag-drop-file-meta">
                    <span class="drag-drop-file-size">${Utils.formatFileSize(fileData.size)}</span>
                    <span class="drag-drop-file-type">${fileExtension.toUpperCase()}</span>
                    ${fileData.readError ? '<span class="file-read-error">读取失败</span>' : ''}
                </div>
            </div>
            <div class="drag-drop-file-category">
                <div class="file-category-select-wrapper">
                    <select class="file-category-select" data-file-id="${fileData.dragDropId}">
                        <option value="items">${this.getCategoryDisplayName('items')}</option>
                        <option value="skills">${this.getCategoryDisplayName('skills')}</option>
                        <option value="characters">${this.getCategoryDisplayName('characters')}</option>
                        <option value="talents">${this.getCategoryDisplayName('talents')}</option>
                        <option value="others">${this.getCategoryDisplayName('others')}</option>
                    </select>
                </div>
            </div>
            <div class="drag-drop-file-actions">
                <button class="drag-drop-file-remove" data-file-id="${fileData.dragDropId}">
                    <i class="ti ti-trash"></i>
                </button>
            </div>
        `;
        
        const select = fileElement.querySelector('.file-category-select');
        if (select) {
            select.value = fileData.selectedCategory || 'items';
            
            select.addEventListener('change', (e) => {
                const fileId = parseInt(e.target.dataset.fileId);
                const category = e.target.value;
                this.updateFileCategory(fileId, category);
            });
        }
        
        setTimeout(() => {
            fileElement.classList.add('file-adding');
        }, 10);
        
        return fileElement;
    }

    // 获取分类显示名称
    getCategoryDisplayName(category) {
        if (window.navigationManager) {
            return window.navigationManager.getNavName(category);
        }
        // 备用默认名称
        const defaultNames = {
            items: '道具',
            skills: '技能',
            characters: '人物',
            talents: '天赋',
            others: '其他',
            images: '万相集'
        };
        return defaultNames[category] || category;
    }

    removeFile(fileId) {
        const fileElement = document.querySelector(`.drag-drop-file-item[data-file-id="${fileId}"]`);
        if (fileElement) {
            fileElement.classList.add('removing');
            
            setTimeout(() => {
                const fileIndex = this.draggedFiles.findIndex(file => file.dragDropId === fileId);
                if (fileIndex === -1) return;
                
                const removedFile = this.draggedFiles[fileIndex];
                this.draggedFiles.splice(fileIndex, 1);
                
                this.saveTempData();
                
                if (fileElement.parentNode) {
                    fileElement.parentNode.removeChild(fileElement);
                }
                
                if (this.draggedFiles.length === 0) {
                    this.showEmptyStatePartial();
                }
                
                this.updateStats();
                
                Utils.showMessage(`已移除文件: ${removedFile.name}`, 'info');
            }, 250);
        }
    }

    // 显示空状态（局部更新方式）
    showEmptyStatePartial() {
        const fileList = document.getElementById('dragDropFileList');
        if (!fileList) return;
        
        const emptyElement = document.createElement('div');
        emptyElement.className = 'drag-drop-empty';
        emptyElement.innerHTML = `
            <i class="ti ti-cloud-upload"></i>
            <h4>暂无文件</h4>
            <p>将文件拖拽到此处添加</p>
        `;
        
        fileList.appendChild(emptyElement);
    }

    // 保留完整的渲染方法用于初始显示
    renderFileList() {
        const fileList = document.getElementById('dragDropFileList');
        if (!fileList) return;
        
        const nonImageFiles = this.draggedFiles.filter(file => !file.isImage);
        
        if (nonImageFiles.length === 0) {
            fileList.innerHTML = `
                <div class="drag-drop-empty">
                    <i class="ti ti-cloud-upload"></i>
                    <h4>暂无文件</h4>
                    <p>将文件拖拽到此处添加</p>
                </div>
            `;
            return;
        }

        fileList.innerHTML = '';
        
        nonImageFiles.forEach(fileData => {
            const fileElement = this.createFileElement(fileData);
            fileList.appendChild(fileElement);
        });

        this.bindRemoveEvents();
    }

    // 优化移除事件绑定，只绑定新添加的按钮
    bindRemoveEvents() {
        const fileList = document.getElementById('dragDropFileList');
        if (!fileList) return;
        
        fileList.querySelectorAll('.drag-drop-file-remove:not([data-bound])').forEach(btn => {
            btn.setAttribute('data-bound', 'true');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = parseInt(btn.dataset.fileId);
                this.removeFile(fileId);
            });
        });
    }

    updateStats() {
        const fileCount = document.getElementById('fileCount');
        const totalSize = document.getElementById('totalSize');
        const confirmBtn = document.getElementById('confirmDragDrop');

        if (!fileCount || !totalSize || !confirmBtn) return;

        // 只统计非图片文件（图片文件已自动处理）
        const nonImageFiles = this.draggedFiles.filter(file => !file.isImage);
        const count = nonImageFiles.length;
        const size = nonImageFiles.reduce((sum, file) => sum + (file.size || 0), 0);

        fileCount.textContent = count;
        totalSize.textContent = Utils.formatFileSize(size);
        confirmBtn.disabled = count === 0;
    }

    async confirmImport() {
        // 只处理非图片文件（图片文件已自动处理）
        const nonImageFiles = this.draggedFiles.filter(file => !file.isImage);
        
        if (nonImageFiles.length === 0) {
            Utils.showMessage('请先添加文件', 'warning');
            return;
        }

        try {
            // 重置处理状态
            this.duplicateFiles = [];
            this.uniqueFiles = [];
            this.currentDuplicateIndex = 0;
            this.importedFiles = [];
            this.skippedFiles = [];
            this.replacedFiles = [];
            
            // 检测重复文件 - 精确匹配文件名
            for (const fileData of nonImageFiles) {
                const existingFile = window.fileManager.findFileByName(fileData.name);
                
                if (existingFile) {
                    // 检查内容是否相同
                    const isContentSame = Utils.isContentExactlySame(existingFile.content, fileData.content);
                    
                    this.duplicateFiles.push({
                        localFile: existingFile,
                        importedFile: fileData,
                        isContentSame: isContentSame,
                        selectedCategory: fileData.selectedCategory || 'items',
                        processed: false, // 标记是否已处理
                        action: null // 用户选择的处理方式
                    });
                } else {
                    this.uniqueFiles.push({
                        ...fileData,
                        selectedCategory: fileData.selectedCategory || 'items'
                    });
                }
            }

            // 如果有重复文件，显示处理弹窗
            if (this.duplicateFiles.length > 0) {
                this.showDuplicateFileModal(this.duplicateFiles, this.uniqueFiles);
            } else {
                // 没有重复文件，直接导入
                await this.importAllFiles(this.uniqueFiles);
            }
        } catch (error) {
            console.error('确认导入时出错:', error);
            Utils.showMessage('导入失败: ' + error.message, 'error');
        }
    }

    showDuplicateFileModal(duplicateFiles, uniqueFiles) {
        const modal = document.getElementById('duplicateFileModal');
        const container = document.getElementById('duplicateFileContainer');
        const stats = document.getElementById('duplicateFileStats');
        
        if (!modal || !container) {
            console.error('重复文件处理弹窗元素未找到');
            this.importAllFiles(uniqueFiles);
            return;
        }
        
        // 存储处理状态
        this.duplicateFiles = duplicateFiles;
        this.uniqueFiles = uniqueFiles;
        this.currentDuplicateIndex = 0;
        this.importedFiles = [];
        this.skippedFiles = [];
        this.replacedFiles = [];
        
        // 显示第一个重复文件
        this.showCurrentDuplicateFile();
        
        // 显示弹窗 - 确保层级低于拖拽弹窗
        modal.style.display = 'flex';
        modal.style.zIndex = '10002'; // 比拖拽弹窗低
        document.body.classList.add('modal-open');
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // 绑定按钮事件
        this.bindDuplicateModalEvents();
    }

    showCurrentDuplicateFile() {
        const container = document.getElementById('duplicateFileContainer');
        const stats = document.getElementById('duplicateFileStats');
        
        if (!container || !stats || !this.duplicateFiles || this.currentDuplicateIndex >= this.duplicateFiles.length) {
            return;
        }
        
        const current = this.duplicateFiles[this.currentDuplicateIndex];
        const total = this.duplicateFiles.length;
        
        // 更新统计信息
        stats.textContent = `正在处理第 ${this.currentDuplicateIndex + 1} 个重复文件，共 ${total} 个`;
        
        // 生成对比内容
        this.renderDuplicateFileComparison(current, container);
    }

    renderDuplicateFileComparison(current, container) {
        const localFile = current.localFile;
        const importedFile = current.importedFile;
        
        // 获取完整的文本内容
        const localContent = localFile.content || '';
        const importedContent = importedFile.content || '';
        
        // 生成差异对比的HTML
        const localDiffHtml = Utils.generateFullContentDiff(localContent, importedContent, false);
        const importedDiffHtml = Utils.generateFullContentDiff(localContent, importedContent, true);
        
        container.innerHTML = `
            <div class="duplicate-file-side old-file">
                <div class="duplicate-file-header">
                    <span>本地文件</span>
                    <span class="tag local-tag">已有文件</span>
                </div>
                <div class="duplicate-file-content">
                    <div class="duplicate-file-info">
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">文件名</span>
                            <span class="duplicate-file-info-value">${localFile.name}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">文件大小</span>
                            <span class="duplicate-file-info-value">${Utils.formatFileSize(localFile.size)}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">文件分类</span>
                            <span class="duplicate-file-info-value">${window.fileManager.categoryNames[localFile.category]}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">收藏状态</span>
                            <span class="duplicate-file-info-value">
                                <i class="ti ${localFile.favorite ? 'ti-star-filled' : 'ti-star'}"></i>
                                ${localFile.favorite ? '已收藏' : '未收藏'}
                            </span>
                        </div>
                    </div>
                    <div class="duplicate-file-diff">
                        <h4>
                            <i class="ti ti-file-text"></i>
                            文件内容
                            ${!current.isContentSame ? '<span style="color: var(--warning-color); font-size: 12px; margin-left: 8px;">(红色高亮为将被移除的文本)</span>' : ''}
                        </h4>
                        <div class="duplicate-file-diff-content">
                            ${localDiffHtml}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="duplicate-file-side new-file">
                <div class="duplicate-file-header">
                    <span>导入文件</span>
                    <span class="tag import-tag">新文件</span>
                </div>
                <div class="duplicate-file-content">
                    <div class="duplicate-file-info">
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">文件名</span>
                            <span class="duplicate-file-info-value">${importedFile.name}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">文件大小</span>
                            <span class="duplicate-file-info-value">${Utils.formatFileSize(importedFile.size)}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">目标分类</span>
                            <span class="duplicate-file-info-value">${this.getCategoryDisplayName(current.selectedCategory)}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">内容比较</span>
                            <span class="duplicate-file-info-value">
                                ${current.isContentSame ? 
                                    '<span style="color: var(--success-color);">内容相同</span>' : 
                                    '<span style="color: var(--warning-color);">内容不同</span>'}
                            </span>
                        </div>
                    </div>
                    <div class="duplicate-file-diff">
                        <h4>
                            <i class="ti ti-file-text"></i>
                            文件内容
                            ${!current.isContentSame ? '<span style="color: var(--warning-color); font-size: 12px; margin-left: 8px;">(红色高亮为新增的文本)</span>' : ''}
                        </h4>
                        <div class="duplicate-file-diff-content">
                            ${importedDiffHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 显示当前文件处理状态
        const actionButtons = document.querySelector('.duplicate-file-actions');
        if (actionButtons) {
            actionButtons.innerHTML = `
                <button class="btn btn-secondary" id="skipDuplicate">
                    <i class="ti ti-skip-forward"></i>
                    跳过此文件
                </button>
                <button class="btn btn-primary" id="addAsNew">
                    <i class="ti ti-file-plus"></i>
                    添加为新文件
                </button>
                <button class="btn btn-warning" id="replaceFile">
                    <i class="ti ti-refresh"></i>
                    替换现有文件
                </button>
            `;
        }
        
        // 确保所有按钮都正确绑定
        this.bindDuplicateModalButtons();
    }

    bindDuplicateModalButtons() {
        const skipBtn = document.getElementById('skipDuplicate');
        const addBtn = document.getElementById('addAsNew');
        const replaceBtn = document.getElementById('replaceFile');
        
        // 移除旧的事件监听器
        if (skipBtn) {
            skipBtn.onclick = null;
            skipBtn.addEventListener('click', () => this.handleDuplicateAction('skip'));
        }
        
        if (addBtn) {
            addBtn.onclick = null;
            addBtn.addEventListener('click', () => this.handleDuplicateAction('add'));
        }
        
        if (replaceBtn) {
            replaceBtn.onclick = null;
            replaceBtn.addEventListener('click', () => this.handleDuplicateAction('replace'));
        }
    }

    bindDuplicateModalEvents() {
        this.bindDuplicateModalButtons();
    }

    handleDuplicateAction(action) {
        if (this.currentDuplicateIndex >= this.duplicateFiles.length) return;
        
        const current = this.duplicateFiles[this.currentDuplicateIndex];
        const fileName = current.importedFile.name;
        
        // 标记当前文件已处理
        current.processed = true;
        current.action = action;
        
        switch (action) {
            case 'skip':
                this.skippedFiles.push(current.importedFile);
                Utils.showMessage(`已跳过文件: ${fileName}`, 'info');
                break;
                
            case 'add':
                // 添加为新文件
                const newFile = {
                    name: current.importedFile.name,
                    size: current.importedFile.size,
                    type: current.importedFile.type,
                    content: current.importedFile.content,
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    category: current.selectedCategory,
                    favorite: false,
                    codeSegments: Utils.isCodeFile(current.importedFile.name) ? 
                        Utils.countCodeSegments(current.importedFile.content) : 0,
                    uploadTime: new Date().toISOString()
                };
                this.importedFiles.push(newFile);
                Utils.showMessage(`已添加为新文件: ${fileName}`, 'success');
                break;
                
            case 'replace':
                // 替换现有文件
                const existingFile = current.localFile;
                const fileIndex = window.fileManager.allFiles[existingFile.category].findIndex(
                    file => file.id === existingFile.id
                );
                
                if (fileIndex !== -1) {
                    // 替换文件内容但保留其他属性
                    const oldFile = window.fileManager.allFiles[existingFile.category][fileIndex];
                    window.fileManager.allFiles[existingFile.category][fileIndex] = {
                        ...oldFile,
                        content: current.importedFile.content,
                        size: current.importedFile.size,
                        uploadTime: new Date().toISOString()
                    };
                    this.replacedFiles.push(oldFile.name);
                    Utils.showMessage(`已替换文件: ${fileName}`, 'success');
                }
                break;
        }
        
        // 查找下一个未处理的重复文件
        this.moveToNextUnprocessedFile();
    }

    moveToNextUnprocessedFile() {
        // 先检查是否所有文件都已处理
        const allProcessed = this.duplicateFiles.every(file => file.processed);
        
        if (allProcessed) {
            // 所有文件都已处理，完成处理
            this.finishDuplicateProcessing();
            return;
        }
        
        // 查找下一个未处理的文件
        let nextIndex = -1;
        for (let i = this.currentDuplicateIndex + 1; i < this.duplicateFiles.length; i++) {
            if (!this.duplicateFiles[i].processed) {
                nextIndex = i;
                break;
            }
        }
        
        // 如果后面没有未处理的文件，从头开始查找
        if (nextIndex === -1) {
            for (let i = 0; i < this.currentDuplicateIndex; i++) {
                if (!this.duplicateFiles[i].processed) {
                    nextIndex = i;
                    break;
                }
            }
        }
        
        if (nextIndex !== -1) {
            this.currentDuplicateIndex = nextIndex;
            this.showCurrentDuplicateFile();
        } else {
            // 所有文件都已处理，完成处理
            this.finishDuplicateProcessing();
        }
    }

    async finishDuplicateProcessing() {
        // 关闭重复文件弹窗
        const modal = document.getElementById('duplicateFileModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.zIndex = '';
                document.body.classList.remove('modal-open');
            }, 300);
        }
        
        try {
            // 导入所有已处理的文件
            await this.importAllFiles([...this.importedFiles, ...this.uniqueFiles]);
            
            // 显示处理结果
            const totalImported = this.importedFiles.length + (this.uniqueFiles ? this.uniqueFiles.length : 0);
            const skipped = this.skippedFiles.length;
            const replacedCount = this.replacedFiles.length;
            
            let message = `导入完成: 成功导入 ${totalImported} 个文件`;
            if (skipped > 0) {
                message += `，跳过了 ${skipped} 个重复文件`;
            }
            if (replacedCount > 0) {
                message += `，替换了 ${replacedCount} 个文件`;
            }
            
            Utils.showMessage(message, 'success');
            
        } catch (error) {
            console.error('完成导入时出错:', error);
            Utils.showMessage('导入失败: ' + error.message, 'error');
        } finally {
            // 清理临时数据
            this.clearModalData();
            this.duplicateFiles = null;
            this.uniqueFiles = null;
            this.importedFiles = [];
            this.skippedFiles = [];
            this.replacedFiles = [];
            this.currentDuplicateIndex = 0;
        }
    }

    async importAllFiles(files) {
        if (!files || files.length === 0) {
            Utils.showMessage('没有可导入的文件', 'warning');
            return;
        }

        let successCount = 0;
        let failedCount = 0;
        
        const modal = document.getElementById('dragDropModal');
        if (modal) {
            modal.classList.add('importing');
        }
        
        // 显示导入进度
        this.showImportProgress(0, files.length);
        
        try {
            // 使用与 file-manager.js 完全相同的导入逻辑
            const importPromises = files.map(async (fileData, index) => {
                try {
                    this.showFileImportAnimation(fileData.name, index);
                    
                    // 检查文件内容是否有效
                    if (!fileData.content) {
                        throw new Error('文件内容为空');
                    }
                    
                    // 使用与 file-manager.js 中 handleFiles 方法完全相同的文件数据结构
                    const fileInfo = {
                        name: fileData.name,
                        type: fileData.type,
                        size: fileData.size,
                        content: fileData.content,
                        id: Date.now() + index + Math.floor(Math.random() * 1000), // 确保唯一ID
                        category: fileData.selectedCategory || 'items',
                        favorite: false,
                        codeSegments: Utils.isCodeFile(fileData.name) ? Utils.countCodeSegments(fileData.content) : 0,
                        uploadTime: new Date().toISOString()
                    };

                    // 使用文件管理器的标准方法添加文件
                    if (window.fileManager && window.fileManager.allFiles) {
                        window.fileManager.allFiles[fileInfo.category].push(fileInfo);
                        successCount++;
                        
                        this.updateImportProgress(index + 1, files.length);
                        
                        return { success: true, file: fileData.name };
                    } else {
                        throw new Error('文件管理器未初始化');
                    }
                    
                } catch (error) {
                    console.error(`导入文件失败: ${fileData.name}`, error);
                    failedCount++;
                    return { success: false, file: fileData.name, error: error.message };
                }
            });

            await Promise.all(importPromises);
            this.hideImportProgress();

            if (successCount > 0) {
                // 使用文件管理器的标准保存方法
                if (window.fileManager && window.fileManager.saveToLocalStorage) {
                    window.fileManager.saveToLocalStorage(false);
                    
                    // 强制重新渲染文件列表
                    if (window.fileManager.renderFiles) {
                        window.fileManager.renderFiles();
                    }
                }
                
                // 更新存储信息
                if (window.fileManager && window.fileManager.updateStorageInfo) {
                    window.fileManager.updateStorageInfo();
                }
                
                // 导入成功后清除临时数据
                this.clearModalData();
                
                // 关闭弹窗
                setTimeout(() => {
                    this.closeModal(false);
                }, 1500);
                
                Utils.showMessage(`成功导入 ${successCount} 个文件`, 'success');
                
            } else {
                Utils.showMessage('所有文件导入失败', 'error');
                if (modal) {
                    modal.classList.remove('importing');
                }
            }
        } catch (error) {
            console.error('导入过程中出错:', error);
            Utils.showMessage('导入失败: ' + error.message, 'error');
            if (modal) {
                modal.classList.remove('importing');
            }
        }
    }

    showImportProgress(current, total) {
        let progressEl = document.getElementById('dragDropImportProgress');
        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.id = 'dragDropImportProgress';
            progressEl.className = 'drag-drop-import-progress';
            progressEl.innerHTML = `
                <div class="import-progress-bar">
                    <div class="import-progress-fill"></div>
                </div>
                <div class="import-progress-text">导入中... (0/${total})</div>
            `;
            const modalBody = document.querySelector('.drag-drop-modal .modal-body');
            if (modalBody) {
                modalBody.insertBefore(progressEl, modalBody.firstChild);
            }
        }
        
        this.updateImportProgress(current, total);
    }

    updateImportProgress(current, total) {
        const progressEl = document.getElementById('dragDropImportProgress');
        if (progressEl) {
            const progressFill = progressEl.querySelector('.import-progress-fill');
            const progressText = progressEl.querySelector('.import-progress-text');
            
            const percentage = (current / total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `导入中... (${current}/${total})`;
        }
    }

    hideImportProgress() {
        const progressEl = document.getElementById('dragDropImportProgress');
        if (progressEl) {
            progressEl.remove();
        }
    }

    showFileImportAnimation(fileName, index) {
        // 查找对应的文件元素
        const nonImageFiles = this.draggedFiles.filter(file => !file.isImage);
        if (index < nonImageFiles.length) {
            const fileData = nonImageFiles[index];
            const fileItem = document.querySelector(`.drag-drop-file-item[data-file-id="${fileData.dragDropId}"]`);
            if (fileItem) {
                fileItem.classList.add('importing');
            }
        }
    }
}

// 创建全局拖拽管理器实例
window.dragDropManager = new DragDropManager();