// 文件管理器
class FileManager {
    constructor() {
        this.allFiles = {
            items: [],
            skills: [],
            characters: [],
            talents: [],
            others: []
        };
        
        this.categoryNames = {
            items: '道具',
            skills: '技能',
            characters: '人物',
            talents: '天赋',
            others: '其他'
        };
        
        this.currentCategory = 'items';
        this.currentFileForMove = null;
        
        // 重复文件处理相关属性
        this.duplicateFiles = null;
        this.uniqueFiles = null;
        this.currentDuplicateIndex = 0;
        this.importedFiles = [];
        this.skippedFiles = [];
        this.replacedFiles = [];
        
        // 导入验证
        this.totalBeforeImport = 0;
        
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.setupGlobalEventDelegation();
        this.renderFiles();
        this.updateStorageInfo();
    }

    setupEventListeners() {
        // 文件导入相关事件
        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileInput(e);
        });
        
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            document.getElementById('dataFileInput')?.click();
        });
        
        document.getElementById('dataFileInput')?.addEventListener('change', (e) => {
            this.handleDataFileInput(e);
        });

        // 分类选择
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-option')) {
                const option = e.target.closest('.category-option');
                this.currentCategory = option.dataset.category;
                this.updateCategorySelection();
            }
        });

        // 数据操作按钮
        document.getElementById('saveConfigBtn')?.addEventListener('click', () => this.saveConfig());
        document.getElementById('clearAllDataBtn')?.addEventListener('click', () => this.clearAllData());
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportAllData());

        // 弹窗操作
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('fileModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('fileModal')) this.closeModal();
        });

        // 移动文件弹窗
        document.getElementById('closeMoveFileModal')?.addEventListener('click', () => this.closeMoveFileModal());
        document.getElementById('moveFileModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('moveFileModal')) this.closeMoveFileModal();
        });

        // 页面切换时更新分类选择器
        window.addEventListener('pageChanged', () => {
            this.updateCategorySelection();
        });

        // 监听弹窗关闭事件，保存当前文件的滚动位置
        document.getElementById('fileModal')?.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity' && !e.target.classList.contains('active')) {
                // 弹窗关闭时保存当前文件的滚动位置
                if (window.scrollManager && window.scrollManager.currentFileId) {
                    const modalBody = document.getElementById('modalBody');
                    if (modalBody) {
                        window.scrollManager.saveScrollPosition(
                            window.scrollManager.currentFileId, 
                            modalBody.scrollTop
                        );
                    }
                }
            }
        });

        // 监听图片导入事件
        document.addEventListener('imageImportStarted', (e) => {
            console.log('收到图片导入事件:', e.detail.files.length, '张图片');
            // 这里不处理图片，由 imageManager 处理
        });
    }

    setupGlobalEventDelegation() {
        document.addEventListener('click', (e) => {
            // 处理查看按钮点击
            if (e.target.closest('.btn-view')) {
                const button = e.target.closest('.btn-view');
                const fileId = parseInt(button.dataset.id);
                const fileData = this.findFileById(fileId);
                if (fileData) {
                    this.showFileContent(fileData);
                }
            }
            
            // 处理删除按钮点击
            if (e.target.closest('.btn-delete-icon')) {
                const button = e.target.closest('.btn-delete-icon');
                const fileId = parseInt(button.dataset.id);
                const category = button.dataset.category;
                if (fileId && category) {
                    this.deleteFile(fileId, category);
                }
            }
            
            // 处理收藏按钮点击
            if (e.target.closest('.star-icon')) {
                const star = e.target.closest('.star-icon');
                const fileId = parseInt(star.dataset.id);
                const category = star.dataset.category;
                if (fileId && category) {
                    this.toggleFavorite(fileId, category, star);
                }
            }
        });
    }

    handleFileInput(e) {
        if (e.target.files.length) {
            console.log('选择的文件数量:', e.target.files.length);
            this.handleFiles(e.target.files);
            e.target.value = '';
        }
    }

    handleDataFileInput(e) {
        if (e.target.files.length) {
            this.importDataFile(e.target.files[0]);
            e.target.value = '';
        }
    }

    handleFiles(fileList) {
        const files = Array.from(fileList);
        
        console.log('处理文件列表，总数:', files.length);
        
        // 分离图片和非图片文件
        const imageFiles = files.filter(file => this.isImageFile(file));
        const nonImageFiles = files.filter(file => !this.isImageFile(file));
        
        console.log('文件分类:', {
            images: imageFiles.length,
            nonImages: nonImageFiles.length
        });
        
        // 处理图片文件 - 触发图片导入事件
        if (imageFiles.length > 0) {
            const event = new CustomEvent('imageImportStarted', {
                detail: { files: imageFiles }
            });
            document.dispatchEvent(event);
            
            // 显示提示
            Utils.showMessage(`${imageFiles.length} 张图片已自动导入万相集`, 'info');
        }
        
        // 处理非图片文件 - 原有逻辑
        if (nonImageFiles.length === 0) {
            if (imageFiles.length === 0) {
                Utils.showMessage('没有发现可导入的文件', 'warning');
            }
            return;
        }
        
        console.log('非图片文件数量:', nonImageFiles.length);
        this.totalBeforeImport = this.getStats().totalFiles;
        this.processFilesWithDuplicateCheck(nonImageFiles);
    }

    // 检查是否为图片文件
    isImageFile(file) {
        if (!file || !file.type) return false;
        
        const imageTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/bmp', 'image/webp', 'image/svg+xml', 'image/tiff',
            'image/ico', 'image/x-icon', 'image/heic', 'image/heif'
        ];
        
        const imageExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', 
            '.tiff', '.tif', '.ico', '.heic', '.heif', '.avif', '.jfif'
        ];
        
        // 检查MIME类型
        if (imageTypes.some(type => file.type.toLowerCase().includes(type))) {
            return true;
        }
        
        // 检查文件扩展名
        const fileName = file.name.toLowerCase();
        return imageExtensions.some(ext => fileName.endsWith(ext));
    }

    async processFilesWithDuplicateCheck(files) {
        try {
            console.log('开始处理文件，数量:', files.length);
            
            // 读取所有文件内容
            const filePromises = files.map(async (file, index) => {
                try {
                    const content = await this.readFileContent(file);
                    return {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        content: content,
                        originalFile: file,
                        index: index
                    };
                } catch (error) {
                    console.error(`读取文件失败: ${file.name}`, error);
                    return null;
                }
            });

            const fileDataArray = (await Promise.all(filePromises)).filter(Boolean);
            
            if (fileDataArray.length === 0) {
                Utils.showMessage('没有可导入的文件', 'warning');
                return;
            }

            console.log('成功读取的文件数量:', fileDataArray.length);

            // 重置处理状态
            this.duplicateFiles = [];
            this.uniqueFiles = [];
            this.currentDuplicateIndex = 0;
            this.importedFiles = [];
            this.skippedFiles = [];
            this.replacedFiles = [];

            // 检测重复文件 - 精确匹配文件名
            for (const fileData of fileDataArray) {
                const existingFile = this.findFileByNameExact(fileData.name);
                
                if (existingFile) {
                    // 检查内容是否相同
                    const isContentSame = Utils.isContentExactlySame(existingFile.content, fileData.content);
                    
                    console.log('发现重复文件:', {
                        name: fileData.name,
                        isContentSame: isContentSame,
                        existingCategory: existingFile.category
                    });
                    
                    this.duplicateFiles.push({
                        localFile: existingFile,
                        importedFile: fileData,
                        isContentSame: isContentSame,
                        processed: false, // 标记是否已处理
                        action: null // 用户选择的处理方式
                    });
                } else {
                    this.uniqueFiles.push(fileData);
                }
            }

            console.log('重复文件检测结果:', {
                duplicateFiles: this.duplicateFiles.length,
                uniqueFiles: this.uniqueFiles.length
            });

            // 如果有重复文件，显示处理弹窗
            if (this.duplicateFiles.length > 0) {
                this.showDuplicateFileModal(this.duplicateFiles, this.uniqueFiles);
            } else {
                // 没有重复文件，直接导入
                console.log('没有重复文件，直接导入唯一文件');
                const success = this.importUniqueFiles(this.uniqueFiles);
                if (success && this.uniqueFiles.length > 0) {
                    Utils.showMessage(`成功导入 ${this.uniqueFiles.length} 个文件`, 'success');
                    // 验证导入结果
                    setTimeout(() => this.verifyImportSuccess(this.uniqueFiles.length), 100);
                }
            }
        } catch (error) {
            console.error('处理文件时出错:', error);
            Utils.showMessage('文件处理失败: ' + error.message, 'error');
        }
    }

    // 精确查找文件（完全匹配文件名）
    findFileByNameExact(fileName) {
        if (!fileName) return null;
        for (const category in this.allFiles) {
            const file = this.allFiles[category].find(f => f.name === fileName);
            if (file) return file;
        }
        return null;
    }

    findFileByName(fileName) {
        if (!fileName) return null;
        for (const category in this.allFiles) {
            const file = this.allFiles[category].find(f => f.name === fileName);
            if (file) return file;
        }
        return null;
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    showDuplicateFileModal(duplicateFiles, uniqueFiles) {
        const modal = document.getElementById('duplicateFileModal');
        const container = document.getElementById('duplicateFileContainer');
        const stats = document.getElementById('duplicateFileStats');
        
        if (!modal || !container) {
            console.error('重复文件处理弹窗元素未找到');
            const success = this.importUniqueFiles(uniqueFiles);
            if (success && uniqueFiles.length > 0) {
                Utils.showMessage(`成功导入 ${uniqueFiles.length} 个文件`, 'success');
                setTimeout(() => this.verifyImportSuccess(uniqueFiles.length), 100);
            }
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
        
        // 显示弹窗 - 确保层级正确
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
        
        // 生成对比内容 - 使用完整的文本显示
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
                            <span class="duplicate-file-info-value">${this.categoryNames[localFile.category]}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">收藏状态</span>
                            <span class="duplicate-file-info-value">
                                <i class="ti ${localFile.favorite ? 'ti-star-filled' : 'ti-star'}"></i>
                                ${localFile.favorite ? '已收藏' : '未收藏'}
                            </span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">上传时间</span>
                            <span class="duplicate-file-info-value">
                                ${new Date(localFile.uploadTime || localFile.id).toLocaleString('zh-CN')}
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
                            <span class="duplicate-file-info-value">${this.categoryNames[this.currentCategory]}</span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">内容比较</span>
                            <span class="file-info-value">
                                ${current.isContentSame ? 
                                    '<span style="color: var(--success-color);">内容相同</span>' : 
                                    '<span style="color: var(--warning-color);">内容不同</span>'}
                            </span>
                        </div>
                        <div class="duplicate-file-info-item">
                            <span class="duplicate-file-info-label">文件类型</span>
                            <span class="duplicate-file-info-value">${importedFile.type || '未知'}</span>
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
        
        console.log('处理重复文件:', { 
            action, 
            fileName, 
            index: this.currentDuplicateIndex,
            currentIndex: this.currentDuplicateIndex,
            totalFiles: this.duplicateFiles.length 
        });
        
        // 标记当前文件已处理
        current.processed = true;
        current.action = action;
        
        switch (action) {
            case 'skip':
                this.skippedFiles.push(current.importedFile);
                Utils.showMessage(`已跳过文件: ${fileName}`, 'info');
                break;
                
            case 'add':
                // 添加为新文件（相同名称，不同ID）
                const newFile = {
                    name: current.importedFile.name,
                    size: current.importedFile.size,
                    type: current.importedFile.type,
                    content: current.importedFile.content,
                    id: Date.now() + Math.floor(Math.random() * 1000), // 确保唯一ID
                    category: this.currentCategory,
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
                const fileIndex = this.allFiles[existingFile.category].findIndex(
                    file => file.id === existingFile.id
                );
                
                if (fileIndex !== -1) {
                    // 替换文件内容但保留其他属性
                    const oldFile = this.allFiles[existingFile.category][fileIndex];
                    this.allFiles[existingFile.category][fileIndex] = {
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
        console.log('完成重复文件处理:', {
            importedFiles: this.importedFiles.length,
            skippedFiles: this.skippedFiles.length,
            replacedFiles: this.replacedFiles.length,
            uniqueFiles: this.uniqueFiles ? this.uniqueFiles.length : 0
        });
        
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
            let totalImported = 0;
            
            // 导入所有已处理的新文件
            if (this.importedFiles.length > 0) {
                console.log('导入新文件:', this.importedFiles.length);
                this.importedFiles.forEach(fileData => {
                    this.allFiles[this.currentCategory].push(fileData);
                });
                totalImported += this.importedFiles.length;
            }
            
            // 导入唯一文件
            if (this.uniqueFiles && this.uniqueFiles.length > 0) {
                console.log('导入唯一文件:', this.uniqueFiles.length);
                const success = this.importUniqueFiles(this.uniqueFiles);
                if (success) {
                    totalImported += this.uniqueFiles.length;
                }
            }
            
            // 保存到本地存储 - 关键修复点
            const saved = this.saveToLocalStorage();
            if (!saved) {
                throw new Error('保存到本地存储失败');
            }
            
            // 更新界面
            this.renderFiles();
            this.updateStorageInfo();
            
            // 计算总数
            const skipped = this.skippedFiles.length;
            const replacedCount = this.replacedFiles.length;
            
            let message = '';
            if (totalImported > 0) {
                message = `成功导入 ${totalImported} 个文件`;
                if (skipped > 0) {
                    message += `，跳过了 ${skipped} 个重复文件`;
                }
                if (replacedCount > 0) {
                    message += `，替换了 ${replacedCount} 个文件`;
                }
                Utils.showMessage(message, 'success');
            } else if (skipped > 0 || replacedCount > 0) {
                message = '导入完成';
                if (skipped > 0) {
                    message += `，跳过了 ${skipped} 个重复文件`;
                }
                if (replacedCount > 0) {
                    message += `，替换了 ${replacedCount} 个文件`;
                }
                Utils.showMessage(message, 'info');
            }
            
            // 验证导入结果
            setTimeout(() => this.verifyImportSuccess(totalImported), 100);
            
        } catch (error) {
            console.error('完成导入时出错:', error);
            Utils.showMessage('导入失败: ' + error.message, 'error');
        } finally {
            // 清理临时数据
            this.duplicateFiles = null;
            this.uniqueFiles = null;
            this.importedFiles = [];
            this.skippedFiles = [];
            this.replacedFiles = [];
            this.currentDuplicateIndex = 0;
        }
    }

    // 修复后的 importUniqueFiles 方法 - 确保保存到本地存储
    importUniqueFiles(files) {
        console.log('开始导入唯一文件:', files.length);
        
        try {
            files.forEach((fileData, index) => {
                const fileInfo = {
                    name: fileData.name,
                    type: fileData.type,
                    size: fileData.size,
                    content: fileData.content,
                    id: Date.now() + index + Math.floor(Math.random() * 1000), // 确保唯一性
                    category: this.currentCategory,
                    favorite: false,
                    codeSegments: Utils.isCodeFile(fileData.name) ? 
                        Utils.countCodeSegments(fileData.content) : 0,
                    uploadTime: new Date().toISOString()
                };
                
                console.log('添加文件到分类:', this.currentCategory, fileInfo.name);
                this.allFiles[this.currentCategory].push(fileInfo);
            });
            
            // 关键修复：确保保存到本地存储
            const saved = this.saveToLocalStorage();
            
            if (saved) {
                console.log('唯一文件导入成功并已保存到本地存储');
                return true;
            } else {
                console.error('保存唯一文件到本地存储失败');
                // 如果保存失败，回滚添加的文件
                this.allFiles[this.currentCategory].splice(
                    this.allFiles[this.currentCategory].length - files.length,
                    files.length
                );
                return false;
            }
        } catch (error) {
            console.error('导入唯一文件失败:', error);
            return false;
        }
    }

    // 新增验证导入结果的方法
    verifyImportSuccess(expectedCount) {
        const stats = this.getStats();
        const actualAdded = stats.totalFiles - (this.totalBeforeImport || 0);
        
        console.log('导入验证结果:', {
            expected: expectedCount,
            actualAdded: actualAdded,
            totalBefore: this.totalBeforeImport,
            totalAfter: stats.totalFiles,
            success: actualAdded === expectedCount
        });
        
        if (actualAdded !== expectedCount) {
            console.warn(`警告：预期导入 ${expectedCount} 个文件，实际新增 ${actualAdded} 个`);
            
            // 尝试从本地存储重新加载数据
            setTimeout(() => {
                console.log('尝试重新加载本地存储数据...');
                this.loadFromLocalStorage();
                const reloadedStats = this.getStats();
                console.log('重新加载后的统计:', reloadedStats);
            }, 500);
        }
        
        // 重置计数
        this.totalBeforeImport = stats.totalFiles;
    }

    importDataFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Utils.isValidDataStructure(importedData)) {
                    if (confirm('导入数据将覆盖当前所有文件，确定要继续吗？')) {
                        this.allFiles = importedData;
                        this.saveToLocalStorage();
                        this.renderFiles();
                        this.updateStorageInfo();
                        Utils.showMessage('数据导入成功！', 'success');
                    }
                } else {
                    Utils.showMessage('导入的文件格式不正确', 'error');
                }
            } catch (error) {
                Utils.showMessage('文件解析失败: ' + error.message, 'error');
            }
        };
        reader.onerror = () => {
            Utils.showMessage('文件读取失败', 'error');
        };
        reader.readAsText(file);
    }

    renderFiles() {
        const fileGrid = document.getElementById('fileGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!fileGrid) return;

        fileGrid.innerHTML = '';
        
        if (navigationManager.getCurrentPage() === 'more' || navigationManager.getCurrentPage() === 'images') return;

        let files = navigationManager.getCurrentPage() === 'dashboard' ? 
            this.getAllFiles() : 
            this.allFiles[navigationManager.getCurrentPage()] || [];
        
        // 在分类页面（非仪表盘）中，优先显示收藏的文件
        if (navigationManager.getCurrentPage() !== 'dashboard') {
            files = [...files].sort((a, b) => {
                if (a.favorite && !b.favorite) return -1;
                if (!a.favorite && b.favorite) return 1;
                return b.id - a.id; // 按ID降序排列，新的在前面
            });
        } else {
            // 在仪表盘按上传时间降序排列
            files = [...files].sort((a, b) => new Date(b.uploadTime || b.id) - new Date(a.uploadTime || a.id));
        }
        
        if (files.length === 0) {
            if (emptyState) {
                fileGrid.appendChild(emptyState);
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        files.forEach((fileData, index) => {
            const card = this.createFileCard(fileData, index);
            // 设置递增的动画延迟，创建错落有致的出现效果
            card.style.animationDelay = `${(index * 0.1)}s`;
            card.classList.add('card-appear');
            fileGrid.appendChild(card);
        });
    }

    createFileCard(fileData, index) {
        const card = document.createElement('div');
        card.className = 'grid-card';
        
        const fileIcon = Utils.getFileIcon(fileData.name);
        
        // 收藏图标和位置标签容器
        const starIcon = fileData.favorite ? 'ti-star-filled filled' : 'ti-star';
        
        // 代码段数显示（仅限代码文件）
        const codeSegmentsDisplay = Utils.isCodeFile(fileData.name) ? 
            `<div class="code-segments">代码段数: ${fileData.codeSegments || 0}</div>` : '';

        // 在仪表盘页面显示位置标签
        const locationTag = navigationManager.getCurrentPage() === 'dashboard' ? 
            `<div class="location-tag">${this.categoryNames[fileData.category]}</div>` : '';

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title" title="${fileData.name}">${fileData.name}</div>
                <div class="card-header-icons">
                    <div class="card-icons-container">
                        <i class="ti ${starIcon} star-icon" data-id="${fileData.id}" data-category="${fileData.category}" title="${fileData.favorite ? '取消收藏' : '收藏'}"></i>
                        ${locationTag}
                    </div>
                    <i class="ti ${fileIcon} card-icon" title="${fileData.type || '文件'}"></i>
                </div>
            </div>
            <div class="card-content">
                <div class="content-preview">
                    ${Utils.escapeHtml(fileData.content.substring(0, 100))}${fileData.content.length > 100 ? '...' : ''}
                </div>
                ${codeSegmentsDisplay}
            </div>
            <div class="card-footer">
                <button class="card-btn btn-view touch-feedback" data-id="${fileData.id}" title="查看文件内容">
                    <i class="ti ti-eye"></i>查看内容
                </button>
                <button class="card-btn btn-delete-icon touch-feedback" title="删除文件" data-id="${fileData.id}" data-category="${fileData.category}">
                    <i class="ti ti-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }

    showFileContent(fileData) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        
        if (!modalTitle || !modalBody || !modalFooter) {
            console.error('弹窗元素未找到');
            return;
        }
        
        // 保存前一个文件的滚动位置（如果有）
        if (window.scrollManager && window.scrollManager.currentFileId) {
            window.scrollManager.saveScrollPosition(
                window.scrollManager.currentFileId, 
                modalBody.scrollTop
            );
        }
        
        modalTitle.textContent = fileData.name;
        modalTitle.title = fileData.name;
        
        // 格式化上传时间
        const uploadTime = fileData.uploadTime ? new Date(fileData.uploadTime).toLocaleString('zh-CN') : '未知';
        
        // 优化后的文件详情内容 - 直接显示文件内容，移除额外框
        let modalContent = `
            <div class="file-content-section" style="margin-bottom: 24px;">
                <div class="file-content-header" style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="ti ti-file-text" style="font-size: 18px; color: var(--primary-color);"></i>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: var(--text-color);">文件内容</h3>
                </div>
                <div class="file-content-main">${Utils.escapeHtml(fileData.content)}</div>
            </div>
            
            <div class="file-info-section">
                <div class="file-info-header" style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="ti ti-info-circle" style="font-size: 18px; color: var(--primary-color);"></i>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: var(--text-color);">文件信息</h3>
                </div>
                <div class="file-info-grid">
                    <div class="file-info-item">
                        <span class="file-info-label">文件名</span>
                        <span class="file-info-value">${fileData.name}</span>
                    </div>
                    <div class="file-info-item">
                        <span class="file-info-label">文件大小</span>
                        <span class="file-info-value">${Utils.formatFileSize(fileData.size)}</span>
                    </div>
                    <div class="file-info-item">
                        <span class="file-info-label">文件类型</span>
                        <span class="file-info-value">${fileData.type || '未知'}</span>
                    </div>
                    <div class="file-info-item">
                        <span class="file-info-label">文件分类</span>
                        <span class="file-info-value">${this.categoryNames[fileData.category]}</span>
                    </div>
                    <div class="file-info-item">
                        <span class="file-info-label">收藏状态</span>
                        <span class="file-info-value favorite-status">
                            <i class="ti ${fileData.favorite ? 'ti-star-filled' : 'ti-star'}"></i>
                            ${fileData.favorite ? '已收藏' : '未收藏'}
                        </span>
                    </div>
                    <div class="file-info-item">
                        <span class="file-info-label">上传时间</span>
                        <span class="file-info-value">${uploadTime}</span>
                    </div>
                    ${Utils.isCodeFile(fileData.name) ? `
                        <div class="file-info-item">
                            <span class="file-info-label">代码段数</span>
                            <span class="file-info-value">${fileData.codeSegments || 0}</span>
                        </div>
                    ` : ''}
                    <div class="file-info-item">
                        <span class="file-info-label">文件ID</span>
                        <span class="file-info-value file-id">${fileData.id}</span>
                    </div>
                </div>
            </div>
        `;
        
        modalBody.innerHTML = modalContent;
        
        // 设置当前文件ID
        if (window.scrollManager) {
            window.scrollManager.setCurrentFile(fileData.id);
        }
        
        // 更新弹窗footer - 按钮右靠
        modalFooter.innerHTML = `
            <div style="display: flex; justify-content: flex-end; gap: 12px; width: 100%; flex-wrap: wrap;">
                <button class="btn btn-primary touch-feedback" id="toggleFavorite">
                    <i class="ti ${fileData.favorite ? 'ti-star-filled' : 'ti-star'}"></i>
                    ${fileData.favorite ? '取消收藏' : '收藏'}
                </button>
                
                <button class="btn btn-secondary touch-feedback" id="moveFile">
                    <i class="ti ti-arrow-right"></i>
                    移动文件
                </button>
                
                <!-- 截图按钮保留，功能将由 CodeScreenshotTool 处理 -->
                <button class="btn btn-success touch-feedback" id="takeScreenshot">
                    <i class="ti ti-camera"></i>
                    截图
                </button>
                
                <button class="btn btn-primary touch-feedback" id="copyContent">
                    <i class="ti ti-copy"></i>
                    复制内容
                </button>
                
                <button class="btn btn-secondary touch-feedback" id="downloadFile">
                    <i class="ti ti-download"></i>
                    下载文件
                </button>
            </div>
        `;
        
        // 重新绑定事件
        document.getElementById('toggleFavorite')?.addEventListener('click', () => {
            this.toggleFavoriteInModal(fileData);
        });
        
        document.getElementById('moveFile')?.addEventListener('click', () => {
            this.showMoveFileModal(fileData);
        });
        
        // 注意：截图按钮的事件绑定已移除，将由 CodeScreenshotTool 处理
        
        document.getElementById('copyContent')?.addEventListener('click', () => this.copyModalContent());
        
        document.getElementById('downloadFile')?.addEventListener('click', () => {
            this.downloadFile(fileData);
        });
        
        // 显示弹窗后恢复滚动位置
        setTimeout(() => {
            if (window.scrollManager) {
                window.scrollManager.restoreScrollPosition(fileData.id, modalBody);
            }
        }, 50);
        
        // 显示弹窗
        document.getElementById('fileModal')?.classList.add('active');
    }

    showMoveFileModal(fileData) {
        this.currentFileForMove = fileData;
        const modalBody = document.getElementById('moveFileModalBody');
        
        if (!modalBody) return;
        
        const currentCategory = fileData.category;
        const otherCategories = Object.keys(this.categoryNames).filter(cat => cat !== currentCategory);
        
        modalBody.innerHTML = `
            <h3 style="margin-bottom: 20px;">选择目标分类</h3>
            <p style="margin-bottom: 15px; color: var(--text-light);">将文件 "<strong>${fileData.name}</strong>" 移动到：</p>
            <div class="move-options" style="display: flex; flex-direction: column; gap: 10px;">
                ${otherCategories.map(cat => `
                    <div class="move-option touch-feedback" data-category="${cat}" style="padding: 12px 16px; background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: var(--transition);">
                        <i class="ti ti-folder"></i>
                        ${this.categoryNames[cat]}
                    </div>
                `).join('')}
            </div>
        `;
        
        // 绑定移动事件
        document.querySelectorAll('.move-option').forEach(option => {
            option.addEventListener('click', () => {
                const targetCategory = option.dataset.category;
                this.moveFile(this.currentFileForMove, targetCategory);
                this.closeMoveFileModal();
            });
        });
        
        document.getElementById('moveFileModal')?.classList.add('active');
    }

    closeMoveFileModal() {
        const modal = document.getElementById('moveFileModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    toggleFavoriteInModal(fileData) {
        const fileIndex = this.allFiles[fileData.category].findIndex(file => file.id === fileData.id);
        if (fileIndex === -1) return;
        
        this.allFiles[fileData.category][fileIndex].favorite = !this.allFiles[fileData.category][fileIndex].favorite;
        this.saveToLocalStorage();
        
        // 更新按钮文本和状态
        const button = document.getElementById('toggleFavorite');
        const isFavorite = this.allFiles[fileData.category][fileIndex].favorite;
        
        if (isFavorite) {
            button.innerHTML = '<i class="ti ti-star-filled"></i>取消收藏';
            button.classList.add('btn-success');
            button.classList.remove('btn-primary');
        } else {
            button.innerHTML = '<i class="ti ti-star"></i>收藏';
            button.classList.add('btn-primary');
            button.classList.remove('btn-success');
        }
        
        // 更新弹窗中的收藏状态显示
        const favoriteStatusElement = document.querySelector('.file-info-item:nth-child(5) .file-info-value');
        if (favoriteStatusElement) {
            favoriteStatusElement.innerHTML = `
                <i class="ti ${isFavorite ? 'ti-star-filled' : 'ti-star'}"></i>
                ${isFavorite ? '已收藏' : '未收藏'}
            `;
        }
        
        // 更新卡片中的收藏状态
        this.renderFiles();
        
        Utils.showMessage(
            isFavorite ? '文件已收藏' : '已取消收藏',
            'success'
        );
    }

    moveFile(fileData, targetCategory) {
        const sourceIndex = this.allFiles[fileData.category].findIndex(file => file.id === fileData.id);
        if (sourceIndex === -1) return;
        
        // 从原分类移除
        const [movedFile] = this.allFiles[fileData.category].splice(sourceIndex, 1);
        
        // 添加到目标分类
        movedFile.category = targetCategory;
        this.allFiles[targetCategory].push(movedFile);
        
        this.saveToLocalStorage();
        this.renderFiles();
        this.closeModal();
        Utils.showMessage(`文件已移动到${this.categoryNames[targetCategory]}`, 'success');
    }

    downloadFile(fileData) {
        const blob = new Blob([fileData.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Utils.showMessage('文件下载完成', 'success');
    }

    closeModal() {
        // 保存当前文件的滚动位置
        if (window.scrollManager && window.scrollManager.currentFileId) {
            const modalBody = document.getElementById('modalBody');
            if (modalBody) {
                window.scrollManager.saveScrollPosition(
                    window.scrollManager.currentFileId, 
                    modalBody.scrollTop
                );
            }
        }
        
        const modal = document.getElementById('fileModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    copyModalContent() {
        const modalBody = document.getElementById('modalBody');
        const contentElement = modalBody.querySelector('.file-content-main');
        const text = contentElement ? contentElement.textContent : modalBody.textContent;
        
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                Utils.showMessage('内容已复制到剪贴板', 'success');
            }).catch(() => this.fallbackCopyText(text));
        } else {
            this.fallbackCopyText(text);
        }
    }

    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            Utils.showMessage('内容已复制到剪贴板', 'success');
        } catch {
            Utils.showMessage('复制失败，请手动选择文本复制', 'error');
        }
        document.body.removeChild(textArea);
    }

    toggleFavorite(fileId, category, starElement) {
        const fileIndex = this.allFiles[category].findIndex(file => file.id === fileId);
        if (fileIndex === -1) return;
        
        const isFavorite = !this.allFiles[category][fileIndex].favorite;
        this.allFiles[category][fileIndex].favorite = isFavorite;
        
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
        
        // 在点击位置播放动画
        if (isFavorite) {
            Utils.createStarAnimation(starElement);
        }
        
        this.saveToLocalStorage();
        
        // 如果在分类页面，重新渲染以重新排序
        if (navigationManager.getCurrentPage() !== 'dashboard') {
            setTimeout(() => {
                this.renderFiles();
            }, 300);
        }
        
        Utils.showMessage(
            isFavorite ? '文件已收藏' : '已取消收藏',
            'success'
        );
    }

    deleteFile(fileId, category) {
        if (confirm('确定要删除这个文件吗？此操作不可撤销！')) {
            const fileIndex = this.allFiles[category].findIndex(file => file.id === fileId);
            if (fileIndex === -1) return;
            
            const fileName = this.allFiles[category][fileIndex].name;
            this.allFiles[category].splice(fileIndex, 1);
            
            // 清除该文件的滚动位置记录
            if (window.scrollManager) {
                window.scrollManager.clearScrollPosition(fileId);
            }
            
            this.saveToLocalStorage();
            this.renderFiles();
            this.updateStorageInfo();
            Utils.showMessage(`文件 "${fileName}" 已删除`, 'success');
        }
    }

    findFileById(fileId) {
        for (const category in this.allFiles) {
            const file = this.allFiles[category].find(f => f.id === fileId);
            if (file) return file;
        }
        return null;
    }

    getAllFiles() {
        const allFiles = [];
        for (const category in this.allFiles) {
            this.allFiles[category].forEach(file => {
                allFiles.push({
                    ...file,
                    originalCategory: category // 保留原始分类信息
                });
            });
        }
        return allFiles;
    }

    updateCategorySelection() {
        // 只在仪表盘页面显示和更新分类选择器
        const categorySelector = document.querySelector('.category-selector');
        if (categorySelector) {
            if (navigationManager.getCurrentPage() === 'dashboard') {
                categorySelector.style.display = 'block';
                const options = document.querySelectorAll('.category-option');
                options.forEach(option => {
                    option.classList.toggle('active', option.dataset.category === this.currentCategory);
                });
            } else {
                categorySelector.style.display = 'none';
            }
        }
    }

    updateStorageInfo() {
        try {
            // 获取实际存储使用情况
            const dataStr = localStorage.getItem('fileAssetsData') || '{}';
            const usedBytes = new Blob([dataStr]).size;
            
            console.log('存储信息:', {
                usedBytes: usedBytes,
                usedMB: (usedBytes / (1024 * 1024)).toFixed(2) + ' MB'
            });
            
            // 获取浏览器存储配额信息
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(estimate => {
                    const totalBytes = estimate.quota || (5 * 1024 * 1024); // 默认5MB
                    const percentage = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
                    
                    console.log('存储配额:', {
                        totalBytes: totalBytes,
                        totalMB: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
                        percentage: percentage + '%'
                    });
                    
                    this.updateStorageUI(usedBytes, totalBytes, percentage);
                }).catch(error => {
                    console.error('获取存储配额失败:', error);
                    this.fallbackStorageInfo(usedBytes);
                });
            } else {
                this.fallbackStorageInfo(usedBytes);
            }
        } catch (error) {
            console.error('获取存储信息失败:', error);
            this.fallbackStorageInfo(0);
        }
    }

    updateStorageUI(usedBytes, totalBytes, percentage) {
        const percentageElement = document.getElementById('storagePercentage');
        const progressFill = document.getElementById('progressFill');
        const storageUsed = document.getElementById('storageUsed');
        const storageTotal = document.getElementById('storageTotal');
        
        if (percentageElement) percentageElement.textContent = `${percentage}%`;
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (storageUsed) storageUsed.textContent = Utils.formatFileSize(usedBytes);
        if (storageTotal) storageTotal.textContent = Utils.formatFileSize(totalBytes);
        
        // 根据使用率改变颜色
        if (progressFill) {
            if (percentage > 90) {
                progressFill.style.backgroundColor = 'var(--warning-color)';
            } else if (percentage > 70) {
                progressFill.style.backgroundColor = '#ffa726';
            } else {
                progressFill.style.backgroundColor = 'var(--primary-color)';
            }
        }
    }

    fallbackStorageInfo(usedBytes) {
        const totalBytes = 5 * 1024 * 1024; // 默认5MB
        const percentage = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
        this.updateStorageUI(usedBytes, totalBytes, percentage);
    }

    exportAllData() {
        // 直接导出 allFiles 数据结构，不进行包装
        const exportData = this.allFiles;
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // 使用固定文件名 file-assets-backup.json
        link.download = 'file-assets-backup.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Utils.showMessage('数据已导出为 file-assets-backup.json', 'success');
    }

    saveConfig() {
        const saved = this.saveToLocalStorage();
        if (saved) {
            Utils.showMessage('配置已保存到本地存储', 'success');
        } else {
            Utils.showMessage('配置保存失败', 'error');
        }
    }

    clearAllData() {
        if (confirm('确定要清空所有资源文件吗？此操作无法撤销！所有文件将被永久删除！')) {
            this.allFiles = { items: [], skills: [], characters: [], talents: [], others: [] };
            
            // 清除所有滚动位置记录
            if (window.scrollManager) {
                window.scrollManager.clearAllScrollPositions();
            }
            
            this.saveToLocalStorage();
            this.renderFiles();
            this.updateStorageInfo();
            Utils.showMessage('所有资源文件已清空', 'success');
        }
    }

    // 修复后的 saveToLocalStorage 方法
    saveToLocalStorage(skipRender = false) {
        try {
            // 获取当前统计
            const beforeStats = this.getStats();
            
            // 序列化数据
            const dataStr = JSON.stringify(this.allFiles);
            const dataSize = dataStr.length;
            
            console.log('保存数据到本地存储:', {
                fileCount: beforeStats.totalFiles,
                dataSize: dataSize,
                dataSizeMB: (dataSize / (1024 * 1024)).toFixed(2) + ' MB'
            });
            
            // 检查存储限制
            if (dataSize > 4.5 * 1024 * 1024) { // 接近5MB限制
                console.warn('警告：数据大小接近本地存储限制');
                Utils.showMessage('警告：数据大小接近本地存储限制，建议清理旧文件', 'warning');
            }
            
            // 保存到本地存储
            localStorage.setItem('fileAssetsData', dataStr);
            
            // 验证保存是否成功
            const savedData = localStorage.getItem('fileAssetsData');
            if (!savedData) {
                throw new Error('保存验证失败：无法从本地存储读取数据');
            }
            
            const savedSize = savedData.length;
            console.log('保存验证通过:', {
                originalSize: dataSize,
                savedSize: savedSize,
                match: dataSize === savedSize
            });
            
            if (dataSize !== savedSize) {
                console.warn('警告：保存的数据大小与原始数据大小不匹配');
            }
            
            // 如果不跳过渲染，更新界面
            if (!skipRender) {
                this.renderFiles();
            }
            
            return true;
            
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            
            // 尝试诊断错误原因
            if (error.name === 'QuotaExceededError') {
                Utils.showMessage('本地存储空间不足，请清理旧文件或导出数据', 'error');
            } else if (error.message.includes('circular structure')) {
                Utils.showMessage('数据包含循环引用，无法序列化', 'error');
            } else {
                Utils.showMessage('保存失败: ' + error.message, 'error');
            }
            
            return false;
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('fileAssetsData');
            if (savedData) {
                console.log('从本地存储加载数据，大小:', savedData.length, '字节');
                const parsedData = JSON.parse(savedData);
                if (Utils.isValidDataStructure(parsedData)) {
                    this.allFiles = parsedData;
                    console.log('成功加载数据，文件总数:', this.getStats().totalFiles);
                } else {
                    console.warn('本地存储数据格式无效，使用默认数据');
                    this.allFiles = { items: [], skills: [], characters: [], talents: [], others: [] };
                }
            } else {
                console.log('本地存储中没有找到数据，使用默认数据');
                this.allFiles = { items: [], skills: [], characters: [], talents: [], others: [] };
            }
        } catch (error) {
            console.error('加载本地存储数据失败:', error);
            this.allFiles = { items: [], skills: [], characters: [], talents: [], others: [] };
        }
    }

    // 公共方法
    getFilesByCategory(category) {
        return [...(this.allFiles[category] || [])];
    }

    getAllFilesData() {
        return JSON.parse(JSON.stringify(this.allFiles)); // 深拷贝
    }

    setFilesData(data) {
        if (Utils.isValidDataStructure(data)) {
            this.allFiles = data;
            this.saveToLocalStorage();
            this.renderFiles();
            this.updateStorageInfo();
            return true;
        }
        return false;
    }

    // 统计信息
    getStats() {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            byCategory: {},
            favorites: 0
        };

        for (const category in this.allFiles) {
            const categoryFiles = this.allFiles[category];
            stats.byCategory[category] = {
                count: categoryFiles.length,
                size: categoryFiles.reduce((sum, file) => sum + (file.size || 0), 0),
                favorites: categoryFiles.filter(file => file.favorite).length
            };
            stats.totalFiles += categoryFiles.length;
            stats.totalSize += stats.byCategory[category].size;
            stats.favorites += stats.byCategory[category].favorites;
        }

        return stats;
    }

    // 搜索文件
    searchFiles(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const category in this.allFiles) {
            this.allFiles[category].forEach(file => {
                if (file.name.toLowerCase().includes(lowerQuery) || 
                    file.content.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        ...file,
                        originalCategory: category
                    });
                }
            });
        }
        
        return results;
    }

    // 新增调试方法
    debugSave() {
        console.log('=== 调试：强制保存所有数据 ===');
        const saved = this.saveToLocalStorage();
        if (saved) {
            Utils.showMessage('调试：数据已强制保存', 'success');
            
            // 验证数据
            const stats = this.getStats();
            console.log('当前文件统计:', stats);
            
            const savedData = localStorage.getItem('fileAssetsData');
            console.log('本地存储数据大小:', savedData ? savedData.length : 0, '字节');
        } else {
            Utils.showMessage('调试：保存失败', 'error');
        }
    }

    // 新增：检查本地存储是否可用
    checkLocalStorage() {
        try {
            const testKey = 'test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            console.log('本地存储可用');
            return true;
        } catch (error) {
            console.error('本地存储不可用:', error);
            Utils.showMessage('本地存储不可用，无法保存文件', 'error');
            return false;
        }
    }
}

// 创建全局文件管理器实例
window.fileManager = new FileManager();

// 暴露全局变量给控制台使用
window.allFiles = window.fileManager.allFiles;

// 添加调试命令
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('调试模式已启用，可用命令：');
    console.log('  window.fileManager.debugSave() - 强制保存数据');
    console.log('  window.fileManager.getStats() - 获取文件统计');
    console.log('  window.fileManager.checkLocalStorage() - 检查本地存储');
    console.log('  localStorage.getItem("fileAssetsData") - 查看本地存储数据');
}