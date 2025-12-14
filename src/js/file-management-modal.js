// 文件管理弹窗
class FileManagementModal {
    constructor() {
        this.selectedFiles = new Set();
        this.currentTab = 'all';
        this.renamingFileId = null;
        this.isClickFromRenameButton = false; // 新增：标记是否来自重命名按钮的点击
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGlobalEventListeners();
    }

    setupEventListeners() {
        // 打开文件管理弹窗
        document.getElementById('fileManagementBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // 关闭文件管理弹窗
        document.getElementById('closeFileManagementModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // 点击外部关闭
        document.getElementById('fileManagementModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('fileManagementModal')) {
                this.closeModal();
            }
        });

        // 标签页切换 - 使用事件委托
        document.addEventListener('click', (e) => {
            const tab = e.target.closest('.file-management-tab');
            if (tab) {
                this.switchTab(tab.dataset.tab);
            }
        });

        // 批量操作按钮
        document.getElementById('batchDelete')?.addEventListener('click', () => this.batchDelete());
        document.getElementById('batchDownload')?.addEventListener('click', () => this.batchDownload());
        document.getElementById('batchMove')?.addEventListener('click', () => this.batchMove());

        // 单文件操作按钮
        document.getElementById('singleDelete')?.addEventListener('click', () => this.singleDelete());
        document.getElementById('singleDownload')?.addEventListener('click', () => this.singleDownload());
        document.getElementById('singleMove')?.addEventListener('click', () => this.singleMove());
        document.getElementById('singleRename')?.addEventListener('click', (e) => {
            // 标记点击来自重命名按钮
            this.isClickFromRenameButton = true;
            this.singleRename();
            // 重置标记
            setTimeout(() => {
                this.isClickFromRenameButton = false;
            }, 100);
        });

        // 修复：使用正确的按钮ID
        document.getElementById('selectAllFiles')?.addEventListener('click', () => this.selectAll());
        document.getElementById('cancelSelection')?.addEventListener('click', () => this.cancelSelection());
    }

    setupGlobalEventListeners() {
        // 点击其他地方取消重命名 - 修复：排除重命名按钮的点击
        document.addEventListener('click', (e) => {
            if (this.renamingFileId && 
                !e.target.closest('.rename-input-container') && 
                !e.target.closest('.rename-btn') &&
                !this.isClickFromRenameButton) { // 新增：排除重命名按钮的点击
                this.cancelRename();
            }
        });

        // ESC键取消重命名
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.renamingFileId) {
                this.cancelRename();
            }
        });
    }

    openModal() {
        this.selectedFiles.clear();
        this.renamingFileId = null;
        this.isClickFromRenameButton = false;
        this.currentTab = 'all';
        this.updateTabSelection();
        this.renderFileList();
        
        const modal = document.getElementById('fileManagementModal');
        if (modal) {
            modal.classList.add('active');
            modal.style.zIndex = '10002';
        }
    }

    closeModal() {
        const modal = document.getElementById('fileManagementModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.zIndex = '';
        }
        this.selectedFiles.clear();
        this.renamingFileId = null;
        this.isClickFromRenameButton = false;
        this.hideAllActions();
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.renamingFileId = null;
        this.isClickFromRenameButton = false;
        
        // 清除不在当前标签页的选中文件
        const visibleFiles = this.getFilesForCurrentTab();
        const visibleFileIds = new Set(visibleFiles.map(file => file.id));
        
        const newSelectedFiles = new Set();
        this.selectedFiles.forEach(fileId => {
            if (visibleFileIds.has(fileId)) {
                newSelectedFiles.add(fileId);
            }
        });
        this.selectedFiles = newSelectedFiles;
        
        this.updateTabSelection();
        this.renderFileList();
        this.updateActionButtons();
    }

    updateTabSelection() {
        const tabs = document.querySelectorAll('.file-management-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.currentTab);
        });
    }

    renderFileList() {
        const fileList = document.getElementById('fileManagementList');
        if (!fileList) return;

        fileList.innerHTML = '';

        let files = this.getFilesForCurrentTab();

        if (files.length === 0) {
            fileList.innerHTML = `
                <div class="file-management-empty">
                    <i class="ti ti-folder-off"></i>
                    <h3>暂无文件</h3>
                    <p>${this.getEmptyMessage()}</p>
                </div>
            `;
            this.hideAllActions();
            return;
        }

        files.forEach((fileData, index) => {
            const fileItem = this.createFileItem(fileData, index);
            fileList.appendChild(fileItem);
        });

        this.updateSelectedCount();
        this.updateActionButtons();
    }

    getFilesForCurrentTab() {
        const allFiles = window.fileManager.getAllFiles();
        
        switch (this.currentTab) {
            case 'favorites': return allFiles.filter(file => file.favorite);
            case 'items': return allFiles.filter(file => file.category === 'items');
            case 'skills': return allFiles.filter(file => file.category === 'skills');
            case 'characters': return allFiles.filter(file => file.category === 'characters');
            case 'talents': return allFiles.filter(file => file.category === 'talents');
            case 'others': return allFiles.filter(file => file.category === 'others');
            case 'all':
            default: return allFiles;
        }
    }

    getEmptyMessage() {
        switch (this.currentTab) {
            case 'favorites': return '暂无收藏文件';
            case 'items': return '暂无道具文件';
            case 'skills': return '暂无技能文件';
            case 'characters': return '暂无人物文件';
            case 'talents': return '暂无天赋文件';
            case 'others': return '暂无其他文件';
            case 'all':
            default: return '暂无文件';
        }
    }

    createFileItem(fileData, index) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-management-item';
        const isSelected = this.selectedFiles.has(fileData.id);
        const isRenaming = this.renamingFileId === fileData.id;
        
        // 获取文件名和扩展名
        const fileName = fileData.name;
        const lastDotIndex = fileName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
        const fileExt = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
        
        if (isRenaming) {
            // 重命名状态
            fileItem.innerHTML = `
                <input type="checkbox" class="file-management-checkbox" data-id="${fileData.id}" ${isSelected ? 'checked' : ''} disabled>
                <div class="file-management-info">
                    <div class="file-management-name">${fileData.name}</div>
                    <div class="rename-input-container">
                        <input type="text" class="rename-input" value="${nameWithoutExt}" placeholder="输入新文件名">
                        ${fileExt ? `<span class="file-extension">${fileExt}</span>` : ''}
                        <div class="rename-actions">
                            <button class="rename-btn rename-confirm" data-id="${fileData.id}">
                                <i class="ti ti-check"></i> 确认
                            </button>
                            <button class="rename-btn rename-cancel" data-id="${fileData.id}">
                                <i class="ti ti-x"></i> 取消
                            </button>
                        </div>
                    </div>
                    <div class="file-management-meta">
                        <span>${Utils.formatFileSize(fileData.size)}</span>
                        <span class="file-management-category">${window.fileManager.categoryNames[fileData.category]}</span>
                        <span>${new Date(fileData.uploadTime || fileData.id).toLocaleDateString()}</span>
                        ${fileData.favorite ? '<span style="color: #ffc107;"><i class="ti ti-star-filled"></i> 已收藏</span>' : ''}
                    </div>
                </div>
            `;
        } else {
            // 正常状态
            fileItem.innerHTML = `
                <input type="checkbox" class="file-management-checkbox" data-id="${fileData.id}" ${isSelected ? 'checked' : ''}>
                <div class="file-management-info">
                    <div class="file-management-name">${fileData.name}</div>
                    <div class="file-management-meta">
                        <span>${Utils.formatFileSize(fileData.size)}</span>
                        <span class="file-management-category">${window.fileManager.categoryNames[fileData.category]}</span>
                        <span>${new Date(fileData.uploadTime || fileData.id).toLocaleDateString()}</span>
                        ${fileData.favorite ? '<span style="color: #ffc107;"><i class="ti ti-star-filled"></i> 已收藏</span>' : ''}
                    </div>
                </div>
            `;
        }

        if (isSelected) {
            fileItem.classList.add('selected');
        }

        fileItem.style.animationDelay = `${index * 0.05}s`;

        // 绑定事件
        this.bindFileItemEvents(fileItem, fileData, isRenaming);

        return fileItem;
    }

    bindFileItemEvents(fileItem, fileData, isRenaming) {
        const checkbox = fileItem.querySelector('.file-management-checkbox');
        
        if (!isRenaming) {
            // 正常状态的事件绑定
            checkbox.addEventListener('change', (e) => {
                this.toggleFileSelection(fileData.id, e.target.checked, fileItem);
            });

            fileItem.addEventListener('click', (e) => {
                if (!e.target.closest('.file-management-checkbox') && 
                    !e.target.closest('.rename-input-container')) {
                    const newSelectedState = !this.selectedFiles.has(fileData.id);
                    checkbox.checked = newSelectedState;
                    this.toggleFileSelection(fileData.id, newSelectedState, fileItem);
                }
            });
        } else {
            // 重命名状态的事件绑定
            this.bindRenameEvents(fileItem, fileData);
        }
    }

    bindRenameEvents(fileItem, fileData) {
        const renameInput = fileItem.querySelector('.rename-input');
        const confirmBtn = fileItem.querySelector('.rename-confirm');
        const cancelBtn = fileItem.querySelector('.rename-cancel');

        // 自动聚焦
        setTimeout(() => {
            if (renameInput) {
                renameInput.focus();
                renameInput.select();
            }
        }, 100);

        // 确认重命名
        const confirmRename = () => {
            const fileName = fileData.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            const fileExt = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
            const newName = renameInput.value.trim() + fileExt;
            
            if (!renameInput.value.trim()) {
                Utils.showMessage('文件名不能为空', 'warning');
                return;
            }

            // 检查非法字符
            const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
            if (invalidChars.some(char => newName.includes(char))) {
                Utils.showMessage('文件名包含非法字符: / \\ : * ? " < > |', 'error');
                return;
            }

            this.confirmRename(fileData.id, newName);
        };

        // 取消重命名
        const cancelRename = () => {
            this.cancelRename();
        };

        // 绑定按钮事件
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                confirmRename();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cancelRename();
            });
        }

        // 绑定输入框事件
        if (renameInput) {
            renameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmRename();
                }
            });

            renameInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 阻止文件项点击事件冒泡
        fileItem.addEventListener('click', (e) => {
            if (e.target.closest('.rename-input-container') || 
                e.target.closest('.rename-btn')) {
                e.stopPropagation();
            }
        });
    }

    toggleFileSelection(fileId, selected, fileItem) {
        if (selected) {
            this.selectedFiles.add(fileId);
            if (fileItem) fileItem.classList.add('selected');
        } else {
            this.selectedFiles.delete(fileId);
            if (fileItem) fileItem.classList.remove('selected');
        }

        this.updateSelectedCount();
        this.updateActionButtons();
    }

    updateSelectedCount() {
        const selectedCount = document.getElementById('selectedCount');
        const singleSelectedCount = document.getElementById('singleSelectedCount');
        const count = this.selectedFiles.size;
        
        if (selectedCount) selectedCount.textContent = `已选择 ${count} 个文件`;
        if (singleSelectedCount) singleSelectedCount.textContent = `已选择 ${count} 个文件`;
    }

    updateActionButtons() {
        const visibleFiles = this.getFilesForCurrentTab();
        const visibleSelectedFiles = Array.from(this.selectedFiles).filter(fileId => 
            visibleFiles.some(file => file.id === fileId)
        );

        if (visibleSelectedFiles.length === 0) {
            this.hideAllActions();
        } else if (visibleSelectedFiles.length === 1) {
            this.showSingleActions();
            this.hideBatchActions();
        } else {
            this.showBatchActions();
            this.hideSingleActions();
        }
    }

    showBatchActions() {
        const el = document.getElementById('batchActions');
        if (el) el.classList.add('show');
    }

    hideBatchActions() {
        const el = document.getElementById('batchActions');
        if (el) el.classList.remove('show');
    }

    showSingleActions() {
        const el = document.getElementById('singleActions');
        if (el) el.classList.add('show');
    }

    hideSingleActions() {
        const el = document.getElementById('singleActions');
        if (el) el.classList.remove('show');
    }

    hideAllActions() {
        this.hideBatchActions();
        this.hideSingleActions();
    }

    selectAll() {
        const files = this.getFilesForCurrentTab();
        files.forEach(file => {
            this.selectedFiles.add(file.id);
        });
        this.updateCheckboxes();
        this.updateSelectedCount();
        this.updateActionButtons();
    }

    cancelSelection() {
        this.selectedFiles.clear();
        this.updateCheckboxes();
        this.updateSelectedCount();
        this.hideAllActions();
    }

    updateCheckboxes() {
        const checkboxes = document.querySelectorAll('.file-management-checkbox');
        const fileItems = document.querySelectorAll('.file-management-item');
        
        checkboxes.forEach((checkbox, index) => {
            const fileId = parseInt(checkbox.dataset.id);
            const isSelected = this.selectedFiles.has(fileId);
            checkbox.checked = isSelected;
            
            if (fileItems[index]) {
                if (isSelected) {
                    fileItems[index].classList.add('selected');
                } else {
                    fileItems[index].classList.remove('selected');
                }
            }
        });
    }

    // 重命名功能
    singleRename() {
        if (this.selectedFiles.size !== 1) {
            Utils.showMessage('请选择一个文件进行重命名', 'warning');
            return;
        }

        const fileId = Array.from(this.selectedFiles)[0];
        const fileData = window.fileManager.findFileById(fileId);
        
        const visibleFiles = this.getFilesForCurrentTab();
        if (!visibleFiles.some(file => file.id === fileId)) {
            Utils.showMessage('选中的文件不在当前标签页中', 'warning');
            return;
        }

        if (fileData) {
            this.renamingFileId = fileId;
            this.renderFileList();
        }
    }

    confirmRename(fileId, newName) {
        const fileData = window.fileManager.findFileById(fileId);
        if (!fileData) {
            Utils.showMessage('未找到文件', 'error');
            return;
        }

        const fileIndex = window.fileManager.allFiles[fileData.category].findIndex(file => file.id === fileId);
        if (fileIndex !== -1) {
            const oldName = window.fileManager.allFiles[fileData.category][fileIndex].name;
            window.fileManager.allFiles[fileData.category][fileIndex].name = newName;
            
            window.fileManager.saveToLocalStorage();
            window.fileManager.renderFiles();
            
            this.renamingFileId = null;
            this.renderFileList();
            
            Utils.showMessage(`文件 "${oldName}" 已重命名为 "${newName}"`, 'success');
        }
    }

    cancelRename() {
        this.renamingFileId = null;
        this.renderFileList();
    }

    batchDelete() {
        if (this.selectedFiles.size === 0) {
            Utils.showMessage('请先选择要删除的文件', 'warning');
            return;
        }

        const visibleFiles = this.getFilesForCurrentTab();
        const filesToDelete = Array.from(this.selectedFiles).filter(fileId => 
            visibleFiles.some(file => file.id === fileId)
        );

        if (filesToDelete.length === 0) {
            Utils.showMessage('当前标签页中没有选中的文件', 'warning');
            return;
        }

        if (!confirm(`确定要删除选中的 ${filesToDelete.length} 个文件吗？此操作不可撤销！`)) {
            return;
        }

        let deletedCount = 0;
        filesToDelete.forEach(fileId => {
            const fileData = window.fileManager.findFileById(fileId);
            if (fileData) {
                const fileIndex = window.fileManager.allFiles[fileData.category].findIndex(file => file.id === fileId);
                if (fileIndex !== -1) {
                    window.fileManager.allFiles[fileData.category].splice(fileIndex, 1);
                    deletedCount++;
                    this.selectedFiles.delete(fileId);
                    
                    if (window.scrollManager) {
                        window.scrollManager.clearScrollPosition(fileId);
                    }
                }
            }
        });

        window.fileManager.saveToLocalStorage();
        window.fileManager.renderFiles();
        window.fileManager.updateStorageInfo();
        
        this.renderFileList();
        Utils.showMessage(`成功删除 ${deletedCount} 个文件`, 'success');
    }

    singleDelete() {
        if (this.selectedFiles.size !== 1) {
            Utils.showMessage('请选择一个文件进行删除', 'warning');
            return;
        }

        const fileId = Array.from(this.selectedFiles)[0];
        const fileData = window.fileManager.findFileById(fileId);
        
        if (!fileData) {
            Utils.showMessage('未找到文件', 'error');
            return;
        }

        const visibleFiles = this.getFilesForCurrentTab();
        if (!visibleFiles.some(file => file.id === fileId)) {
            Utils.showMessage('选中的文件不在当前标签页中', 'warning');
            return;
        }

        if (!confirm(`确定要删除文件 "${fileData.name}" 吗？此操作不可撤销！`)) {
            return;
        }

        const fileIndex = window.fileManager.allFiles[fileData.category].findIndex(file => file.id === fileId);
        if (fileIndex !== -1) {
            window.fileManager.allFiles[fileData.category].splice(fileIndex, 1);
            this.selectedFiles.delete(fileId);
            
            if (window.scrollManager) {
                window.scrollManager.clearScrollPosition(fileId);
            }
            
            window.fileManager.saveToLocalStorage();
            window.fileManager.renderFiles();
            window.fileManager.updateStorageInfo();
            
            this.renderFileList();
            Utils.showMessage(`文件 "${fileData.name}" 已删除`, 'success');
        }
    }

    batchDownload() {
        if (this.selectedFiles.size === 0) {
            Utils.showMessage('请先选择要下载的文件', 'warning');
            return;
        }

        const visibleFiles = this.getFilesForCurrentTab();
        const filesToDownload = Array.from(this.selectedFiles).filter(fileId => 
            visibleFiles.some(file => file.id === fileId)
        );

        if (filesToDownload.length === 0) {
            Utils.showMessage('当前标签页中没有选中的文件', 'warning');
            return;
        }

        if (filesToDownload.length > 10) {
            if (!confirm(`您选择了 ${filesToDownload.length} 个文件，下载可能需要较长时间，确定要继续吗？`)) {
                return;
            }
        }

        let downloadedCount = 0;
        filesToDownload.forEach(fileId => {
            const fileData = window.fileManager.findFileById(fileId);
            if (fileData) {
                this.downloadSingleFile(fileData);
                downloadedCount++;
            }
        });

        Utils.showMessage(`正在下载 ${downloadedCount} 个文件...`, 'info');
    }

    singleDownload() {
        if (this.selectedFiles.size !== 1) {
            Utils.showMessage('请选择一个文件进行下载', 'warning');
            return;
        }

        const fileId = Array.from(this.selectedFiles)[0];
        const fileData = window.fileManager.findFileById(fileId);
        
        const visibleFiles = this.getFilesForCurrentTab();
        if (!visibleFiles.some(file => file.id === fileId)) {
            Utils.showMessage('选中的文件不在当前标签页中', 'warning');
            return;
        }

        if (fileData) {
            this.downloadSingleFile(fileData);
            Utils.showMessage(`文件 "${fileData.name}" 下载中...`, 'info');
        }
    }

    downloadSingleFile(fileData) {
        const blob = new Blob([fileData.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    batchMove() {
        if (this.selectedFiles.size === 0) {
            Utils.showMessage('请先选择要移动的文件', 'warning');
            return;
        }

        const visibleFiles = this.getFilesForCurrentTab();
        const filesToMove = Array.from(this.selectedFiles).filter(fileId => 
            visibleFiles.some(file => file.id === fileId)
        );

        if (filesToMove.length === 0) {
            Utils.showMessage('当前标签页中没有选中的文件', 'warning');
            return;
        }

        this.showMoveModal(filesToMove, true);
    }

    singleMove() {
        if (this.selectedFiles.size !== 1) {
            Utils.showMessage('请选择一个文件进行移动', 'warning');
            return;
        }

        const fileId = Array.from(this.selectedFiles)[0];
        const fileData = window.fileManager.findFileById(fileId);
        
        const visibleFiles = this.getFilesForCurrentTab();
        if (!visibleFiles.some(file => file.id === fileId)) {
            Utils.showMessage('选中的文件不在当前标签页中', 'warning');
            return;
        }

        if (fileData) {
            this.showMoveModal([fileId], false);
        }
    }

    showMoveModal(fileIds, isBatch) {
        const modal = document.getElementById('moveFileModal');
        const modalBody = document.getElementById('moveFileModalBody');
        if (!modal || !modalBody) return;

        const files = fileIds.map(id => window.fileManager.findFileById(id)).filter(Boolean);
        if (files.length === 0) return;

        const currentCategories = [...new Set(files.map(file => file.category))];
        const currentCategoryText = currentCategories.length === 1 ? 
            window.fileManager.categoryNames[currentCategories[0]] : '混合';

        modalBody.innerHTML = `
            <h3 style="margin-bottom: 20px;">${isBatch ? '批量移动文件' : '移动文件'}</h3>
            <p style="margin-bottom: 15px; color: var(--text-light);">
                ${isBatch ? 
                    `将选中的 ${files.length} 个文件从 <strong>${currentCategoryText}</strong> 移动到：` :
                    `将文件 "<strong>${files[0].name}</strong>" 从 <strong>${currentCategoryText}</strong> 移动到：`
                }
            </p>
            <div class="move-options" style="display: flex; flex-direction: column; gap: 10px;">
                ${Object.entries(window.fileManager.categoryNames)
                    .filter(([cat]) => !currentCategories.includes(cat) || currentCategories.length > 1)
                    .map(([cat, name]) => `
                        <div class="move-option touch-feedback" data-category="${cat}" style="padding: 12px 16px; background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: var(--transition);">
                            <i class="ti ti-folder"></i>
                            ${name}
                        </div>
                    `).join('')}
            </div>
        `;

        document.querySelectorAll('.move-option').forEach(option => {
            option.addEventListener('click', () => {
                const targetCategory = option.dataset.category;
                this.moveFiles(files, targetCategory, isBatch);
                this.closeMoveModal();
            });
        });

        modal.style.zIndex = '10003';
        modal.classList.add('active');
    }

    moveFiles(files, targetCategory, isBatch) {
        let movedCount = 0;

        files.forEach(fileData => {
            const sourceIndex = window.fileManager.allFiles[fileData.category].findIndex(file => file.id === fileData.id);
            if (sourceIndex !== -1) {
                const [movedFile] = window.fileManager.allFiles[fileData.category].splice(sourceIndex, 1);
                movedFile.category = targetCategory;
                window.fileManager.allFiles[targetCategory].push(movedFile);
                movedCount++;
            }
        });

        if (movedCount > 0) {
            window.fileManager.saveToLocalStorage();
            window.fileManager.renderFiles();
            
            files.forEach(file => {
                this.selectedFiles.delete(file.id);
            });
            
            this.renderFileList();
            
            Utils.showMessage(
                `${isBatch ? `成功移动 ${movedCount} 个文件到` : '文件已移动到'} ${window.fileManager.categoryNames[targetCategory]}`,
                'success'
            );
        }
    }

    closeMoveModal() {
        const modal = document.getElementById('moveFileModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.zIndex = '';
        }
    }

    getSelectedFiles() {
        return Array.from(this.selectedFiles).map(fileId => 
            window.fileManager.findFileById(fileId)
        ).filter(file => file !== null);
    }
}

// 创建全局文件管理弹窗实例
window.fileManagementModal = new FileManagementModal();