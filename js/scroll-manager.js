// 滚动状态管理器
class ScrollManager {
    constructor() {
        this.scrollPositions = new Map(); // 存储文件ID对应的滚动位置
        this.currentFileId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 监听整个弹窗主体的滚动
        document.addEventListener('scroll', (e) => {
            if (this.currentFileId && e.target.id === 'modalBody') {
                this.saveScrollPosition(this.currentFileId, e.target.scrollTop);
            }
        }, true);
    }

    // 保存滚动位置
    saveScrollPosition(fileId, position) {
        this.scrollPositions.set(fileId, position);
    }

    // 获取滚动位置
    getScrollPosition(fileId) {
        return this.scrollPositions.get(fileId) || 0;
    }

    // 设置当前文件ID
    setCurrentFile(fileId) {
        this.currentFileId = fileId;
    }

    // 恢复滚动位置
    restoreScrollPosition(fileId, modalBody) {
        if (!modalBody) return;
        
        const position = this.getScrollPosition(fileId);
        modalBody.scrollTop = position;
    }

    // 清除滚动位置
    clearScrollPosition(fileId) {
        this.scrollPositions.delete(fileId);
    }

    // 清除所有滚动位置
    clearAllScrollPositions() {
        this.scrollPositions.clear();
    }

    // 获取所有滚动位置（用于调试）
    getAllScrollPositions() {
        return Object.fromEntries(this.scrollPositions);
    }
}

// 创建全局滚动管理器实例
window.scrollManager = new ScrollManager();