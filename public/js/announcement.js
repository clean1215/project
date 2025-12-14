// 公告管理
class AnnouncementManager {
    constructor() {
        this.announcements =

    this.announcements = [
        {
            "id": 1,
            "title": "欢迎使用文件资源管理系统",
            "content": "这是一个功能强大的文件资源管理工具，支持多种文件格式的导入、查看和管理。\n\n核心功能：\n• 支持JSON、TXT、XML、CSV等格式文件\n• 智能分类管理文件资源\n• 实时存储监控和容量显示\n• 完整的数据导入导出功能\n• 系统控制台（测试版）",
            "image": "themefinland-dragonoid-smith.jpg",
            "date": "2025-11-11",
            "type": "welcome"
        },
        {
            "id": 2,
            "title": "拖拽导入 & 批量管理",
            "content": "全新的拖拽导入功能和强大的批量操作，让文件管理更高效！\n\n特色功能：\n• 拖拽文件到页面任意位置快速导入\n• 多文件批量选择和管理\n• 在线文件重命名和移动\n• 智能过滤图片文件\n• 导入进度实时显示",
            "image": "themefinland-elder-dragon.jpg",
            "date": "2025-11-24",
            "type": "feature"
        },
        {
            "id": 3,
            "title": "截图工具",
            "content": "代码截图功能，支持自定义样式和高清导出！\n\n截图特性：\n• 智能代码语法高亮\n• 行号显示/隐藏选项\n• 多种主题配色方案\n• 渐进式生成动画",
            "image": "themefinland-larvalid-commission.jpg",
            "date": "2025-11-26",
            "type": "feature"
        },
        {
            "id": 4,
            "title": "个性化主题与导航",
            "content": "完全自定义的界面体验（想想就好），打造属于您的工作环境！\n\n个性化功能：\n• 深色/浅色主题一键切换\n• 自定义分类名称显示\n• 系统主题自动跟随\n• 平滑的过渡动画效果",
            "image": "themefinland-resurgence.png",
            "date": "2025-11-13",
            "type": "customization"
        },
        {
            "id": 5,
            "title": "控制台与快捷操作",
            "content": "弱鸡的控制台系统和不丰富的快捷键，极大提升工作效率！\n\n效率工具：\n• 不太丰富的控制台命令集\n• 文件收藏和快速移动\n• 不智能命令补全功能\n• 不完整的快捷键体系\n• 操作历史记录管理",
            "image": "themefinland-plant-mutant.png",
            "date": "2025-11-15",
            "type": "productivity"
        }
    ];
        
        this.currentAnnouncementIndex = 0;
        this.autoScrollInterval = null;
        this.AUTO_SCROLL_INTERVAL = 5000; // 5秒自动切换
        this.init();
    }

    init() {
        this.renderAnnouncements();
        this.updateAnnouncementDisplay();
        this.setupEventListeners();
        this.startAutoScroll();
    }

    setupEventListeners() {
        // 公告控制按钮
        document.getElementById('prevAnnouncement').addEventListener('click', () => this.showPrevAnnouncement());
        document.getElementById('nextAnnouncement').addEventListener('click', () => this.showNextAnnouncement());
        document.getElementById('closeAnnouncementModal').addEventListener('click', () => this.closeAnnouncementModal());

        // 弹窗点击外部关闭
        document.getElementById('announcementModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('announcementModal')) {
                this.closeAnnouncementModal();
            }
        });

        // 触摸滑动支持
        this.setupTouchSwipe();

        // 鼠标悬停时暂停自动滚动
        const container = document.getElementById('announcementContainer');
        if (container) {
            container.addEventListener('mouseenter', () => this.pauseAutoScroll());
            container.addEventListener('mouseleave', () => this.resumeAutoScroll());
        }
    }

    renderAnnouncements() {
        const track = document.getElementById('announcementTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        if (this.announcements.length === 0) {
            track.innerHTML = `
                <div class="announcement-slide">
                    <div class="announcement-image-container">
                        <div class="announcement-placeholder">
                            <i class="ti ti-speakerphone"></i>
                        </div>
                        <div class="announcement-title-overlay">
                            <h3 class="announcement-title">暂无公告</h3>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // 按ID排序公告
        const sortedAnnouncements = [...this.announcements].sort((a, b) => a.id - b.id);
        
        sortedAnnouncements.forEach((announcement, index) => {
            const slide = document.createElement('div');
            slide.className = 'announcement-slide';
            slide.dataset.index = index;
            
            let imageHtml = '';
            if (announcement.image) {
                const imagePath = Utils.buildImagePath(announcement.image);
                // 仪表盘使用裁切模式显示图片
                imageHtml = `
                    <div class="announcement-image-container">
                        <img src="${imagePath}" alt="${announcement.title}" class="announcement-image" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="announcement-placeholder" style="display:none;">
                            <i class="ti ti-speakerphone"></i>
                        </div>
                    </div>
                `;
            } else {
                imageHtml = `
                    <div class="announcement-image-container">
                        <div class="announcement-placeholder">
                            <i class="ti ti-speakerphone"></i>
                        </div>
                    </div>
                `;
            }
            
            slide.innerHTML = `
                ${imageHtml}
                <div class="announcement-title-overlay">
                    <h3 class="announcement-title">${announcement.title}</h3>
                </div>
            `;
            
            slide.addEventListener('click', () => this.showAnnouncementDetail(announcement, index));
            track.appendChild(slide);
        });
    }

    updateAnnouncementDisplay() {
        const track = document.getElementById('announcementTrack');
        const counter = document.getElementById('announcementCounter');
        const prevBtn = document.getElementById('prevAnnouncement');
        const nextBtn = document.getElementById('nextAnnouncement');
        
        if (!track || !counter) return;
        
        const trackWidth = track.clientWidth;
        const slideWidth = trackWidth;
        const translateX = -this.currentAnnouncementIndex * slideWidth;
        track.style.transform = `translateX(${translateX}px)`;
        
        // 更新计数器
        const totalAnnouncements = this.announcements.length || 1;
        counter.textContent = `${this.currentAnnouncementIndex + 1}/${totalAnnouncements}`;
        
        // 更新按钮状态
        if (prevBtn) prevBtn.disabled = this.currentAnnouncementIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentAnnouncementIndex === (this.announcements.length - 1) || this.announcements.length === 0;
    }

    showPrevAnnouncement() {
        if (this.announcements.length === 0) return;
        
        if (this.currentAnnouncementIndex > 0) {
            this.currentAnnouncementIndex--;
        } else {
            this.currentAnnouncementIndex = this.announcements.length - 1; // 循环到最后一个
        }
        this.updateAnnouncementDisplay();
        this.resetAutoScroll();
    }

    showNextAnnouncement() {
        if (this.announcements.length === 0) return;
        
        if (this.currentAnnouncementIndex < this.announcements.length - 1) {
            this.currentAnnouncementIndex++;
        } else {
            this.currentAnnouncementIndex = 0; // 循环到第一个
        }
        this.updateAnnouncementDisplay();
        this.resetAutoScroll();
    }

    // 自动滚动功能
    startAutoScroll() {
        if (this.announcements.length <= 1) return;
        
        this.stopAutoScroll();
        this.autoScrollInterval = setInterval(() => {
            if (this.currentAnnouncementIndex < this.announcements.length - 1) {
                this.currentAnnouncementIndex++;
            } else {
                this.currentAnnouncementIndex = 0;
            }
            this.updateAnnouncementDisplay();
        }, this.AUTO_SCROLL_INTERVAL);
    }

    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }

    pauseAutoScroll() {
        this.stopAutoScroll();
    }

    resumeAutoScroll() {
        if (this.announcements.length > 1) {
            this.startAutoScroll();
        }
    }

    resetAutoScroll() {
        this.stopAutoScroll();
        this.startAutoScroll();
    }

    showAnnouncementDetail(announcement, index) {
        this.currentAnnouncementIndex = index;
        this.updateAnnouncementDisplay();
        
        document.getElementById('announcementModalTitle').textContent = announcement.title;
        
        let imageHtml = '';
        if (announcement.image) {
            const imagePath = Utils.buildImagePath(announcement.image);
            // 详情页面使用完整显示模式
            imageHtml = `
                <div class="announcement-detail-image-wrapper">
                    <img src="${imagePath}" alt="${announcement.title}" class="announcement-detail-image" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="announcement-image-container" style="display:none;">
                        <div class="announcement-placeholder">
                            <i class="ti ti-speakerphone"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            imageHtml = `
                <div class="announcement-image-container">
                    <div class="announcement-placeholder">
                        <i class="ti ti-speakerphone"></i>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('announcementModalBody').innerHTML = `
            ${imageHtml}
            <div class="announcement-detail-content">
                <h2 class="announcement-detail-title">${announcement.title}</h2>
                <div class="announcement-detail-text">${announcement.content ? announcement.content.replace(/\n/g, '<br>') : '暂无详细内容'}</div>
                ${announcement.date ? `
                    <div class="announcement-detail-meta">
                        发布时间: ${announcement.date}
                    </div>
                ` : ''}
            </div>
            <div class="announcement-modal-controls">
                <button class="btn btn-secondary touch-feedback" id="modalPrevAnnouncement">
                    <i class="ti ti-chevron-left"></i>
                    <span>上一个</span>
                </button>
                <span class="announcement-counter" id="modalAnnouncementCounter">${index + 1}/${this.announcements.length}</span>
                <button class="btn btn-secondary touch-feedback" id="modalNextAnnouncement">
                    <span>下一个</span>
                    <i class="ti ti-chevron-right"></i>
                </button>
            </div>
        `;
        
        // 重新绑定事件
        document.getElementById('modalPrevAnnouncement').addEventListener('click', () => this.showModalPrevAnnouncement());
        document.getElementById('modalNextAnnouncement').addEventListener('click', () => this.showModalNextAnnouncement());
        
        document.getElementById('announcementModal').classList.add('active');
        this.pauseAutoScroll();
    }

    showModalPrevAnnouncement() {
        if (this.currentAnnouncementIndex > 0) {
            this.currentAnnouncementIndex--;
            this.showAnnouncementDetail(this.announcements[this.currentAnnouncementIndex], this.currentAnnouncementIndex);
        }
    }

    showModalNextAnnouncement() {
        if (this.currentAnnouncementIndex < this.announcements.length - 1) {
            this.currentAnnouncementIndex++;
            this.showAnnouncementDetail(this.announcements[this.currentAnnouncementIndex], this.currentAnnouncementIndex);
        }
    }

    closeAnnouncementModal() {
        document.getElementById('announcementModal').classList.remove('active');
        this.resumeAutoScroll();
    }

    setupTouchSwipe() {
        const container = document.getElementById('announcementContainer');
        if (!container) return;

        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            this.pauseAutoScroll();
        });

        container.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
        });

        container.addEventListener('touchend', () => {
            if (!isSwiping) return;
            
            const diff = startX - currentX;
            const threshold = 50;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    // 向左滑动 - 下一个
                    this.showNextAnnouncement();
                } else {
                    // 向右滑动 - 上一个
                    this.showPrevAnnouncement();
                }
            }
            
            isSwiping = false;
            this.resumeAutoScroll();
        });
    }

    // 公共方法 - 用于从外部管理公告
    addAnnouncement(announcement) {
        announcement.id = Date.now();
        if (!announcement.date) {
            announcement.date = new Date().toISOString().split('T')[0];
        }
        this.announcements.push(announcement);
        this.renderAnnouncements();
        this.updateAnnouncementDisplay();
        Utils.showMessage('公告添加成功');
    }

    removeAnnouncement(id) {
        const index = this.announcements.findIndex(a => a.id === id);
        if (index !== -1) {
            this.announcements.splice(index, 1);
            this.renderAnnouncements();
            this.updateAnnouncementDisplay();
            Utils.showMessage('公告删除成功');
        }
    }

    getAnnouncements() {
        return [...this.announcements];
    }

    clearAllAnnouncements() {
        if (confirm('确定要清空所有公告吗？')) {
            this.announcements.length = 0;
            this.renderAnnouncements();
            this.updateAnnouncementDisplay();
            Utils.showMessage('所有公告已清空');
        }
    }

    // 获取当前公告
    getCurrentAnnouncement() {
        if (this.announcements.length === 0) return null;
        return this.announcements[this.currentAnnouncementIndex];
    }

    // 跳转到指定公告
    goToAnnouncement(index) {
        if (index >= 0 && index < this.announcements.length) {
            this.currentAnnouncementIndex = index;
            this.updateAnnouncementDisplay();
            this.resetAutoScroll();
        }
    }

    // 获取公告统计信息
    getStats() {
        return {
            total: this.announcements.length,
            withImages: this.announcements.filter(a => a.image).length,
            byType: this.announcements.reduce((acc, announcement) => {
                acc[announcement.type] = (acc[announcement.type] || 0) + 1;
                return acc;
            }, {})
        };
    }

    // 导出公告数据
    exportAnnouncements() {
        const exportData = {
            announcements: this.announcements,
            exportTime: new Date().toISOString(),
            version: '1.0',
            stats: this.getStats()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `announcements-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Utils.showMessage('公告数据已导出', 'success');
    }

    // 导入公告数据
    importAnnouncements(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.announcements && Array.isArray(importedData.announcements)) {
                    if (confirm('导入公告数据将覆盖当前所有公告，确定要继续吗？')) {
                        this.announcements = importedData.announcements;
                        this.currentAnnouncementIndex = 0;
                        this.renderAnnouncements();
                        this.updateAnnouncementDisplay();
                        Utils.showMessage('公告数据导入成功！', 'success');
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

    // 搜索公告
    searchAnnouncements(query) {
        const lowerQuery = query.toLowerCase();
        return this.announcements.filter(announcement => 
            announcement.title.toLowerCase().includes(lowerQuery) ||
            announcement.content.toLowerCase().includes(lowerQuery)
        );
    }

    // 按类型筛选公告
    filterByType(type) {
        return this.announcements.filter(announcement => announcement.type === type);
    }

    // 更新公告
    updateAnnouncement(id, updatedAnnouncement) {
        const index = this.announcements.findIndex(a => a.id === id);
        if (index !== -1) {
            this.announcements[index] = { ...this.announcements[index], ...updatedAnnouncement };
            this.renderAnnouncements();
            this.updateAnnouncementDisplay();
            Utils.showMessage('公告更新成功');
            return true;
        }
        return false;
    }

    // 重新排序公告
    reorderAnnouncements(newOrder) {
        if (newOrder.length !== this.announcements.length) {
            Utils.showMessage('重新排序失败：公告数量不匹配', 'error');
            return false;
        }
        
        this.announcements = newOrder.map(id => 
            this.announcements.find(a => a.id === id)
        ).filter(Boolean);
        
        this.renderAnnouncements();
        this.updateAnnouncementDisplay();
        Utils.showMessage('公告顺序已更新', 'success');
        return true;
    }

    // 批量操作
    batchOperation(operation, announcementIds) {
        let successCount = 0;
        
        announcementIds.forEach(id => {
            const index = this.announcements.findIndex(a => a.id === id);
            if (index !== -1) {
                if (operation === 'delete') {
                    this.announcements.splice(index, 1);
                    successCount++;
                } else if (operation === 'toggleVisibility') {
                    // 这里可以添加可见性切换逻辑
                    this.announcements[index].visible = !this.announcements[index].visible;
                    successCount++;
                }
            }
        });
        
        if (successCount > 0) {
            this.renderAnnouncements();
            this.updateAnnouncementDisplay();
            Utils.showMessage(`成功执行 ${successCount} 个操作`, 'success');
        }
        
        return successCount;
    }

    // 获取公告类型统计
    getTypeStatistics() {
        const stats = {};
        this.announcements.forEach(announcement => {
            stats[announcement.type] = (stats[announcement.type] || 0) + 1;
        });
        return stats;
    }

    // 验证公告数据
    validateAnnouncement(announcement) {
        const errors = [];
        
        if (!announcement.title || announcement.title.trim().length === 0) {
            errors.push('公告标题不能为空');
        }
        
        if (!announcement.content || announcement.content.trim().length === 0) {
            errors.push('公告内容不能为空');
        }
        
        if (announcement.title && announcement.title.length > 100) {
            errors.push('公告标题不能超过100个字符');
        }
        
        if (announcement.content && announcement.content.length > 5000) {
            errors.push('公告内容不能超过5000个字符');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 生成公告预览
    generatePreview(announcement) {
        return {
            id: announcement.id || Date.now(),
            title: announcement.title,
            content: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
            image: announcement.image,
            date: announcement.date || new Date().toISOString().split('T')[0],
            type: announcement.type || 'news'
        };
    }

    // 复制公告
    duplicateAnnouncement(id) {
        const original = this.announcements.find(a => a.id === id);
        if (original) {
            const duplicate = {
                ...original,
                id: Date.now(),
                title: `${original.title} (副本)`,
                date: new Date().toISOString().split('T')[0]
            };
            
            this.announcements.push(duplicate);
            this.renderAnnouncements();
            this.updateAnnouncementDisplay();
            Utils.showMessage('公告已复制', 'success');
            return duplicate;
        }
        return null;
    }

    // 设置公告过期时间
    setExpiration(id, expirationDate) {
        const announcement = this.announcements.find(a => a.id === id);
        if (announcement) {
            announcement.expirationDate = expirationDate;
            Utils.showMessage('已设置公告过期时间', 'success');
            return true;
        }
        return false;
    }

    // 清理过期公告
    cleanupExpiredAnnouncements() {
        const now = new Date();
        const expiredCount = this.announcements.filter(announcement => {
            if (announcement.expirationDate) {
                return new Date(announcement.expirationDate) < now;
            }
            return false;
        }).length;
        
        if (expiredCount > 0) {
            this.announcements = this.announcements.filter(announcement => {
                if (announcement.expirationDate) {
                    return new Date(announcement.expirationDate) >= now;
                }
                return true;
            });
            
            this.renderAnnouncements();
            this.updateAnnouncementDisplay();
            Utils.showMessage(`已清理 ${expiredCount} 个过期公告`, 'success');
            return expiredCount;
        }
        
        Utils.showMessage('没有找到过期公告', 'info');
        return 0;
    }

    // 获取公告时间线
    getTimeline() {
        return this.announcements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(announcement => ({
                id: announcement.id,
                title: announcement.title,
                date: announcement.date,
                type: announcement.type
            }));
    }

    // 公告轮播控制
    setAutoScrollInterval(interval) {
        this.AUTO_SCROLL_INTERVAL = interval;
        this.resetAutoScroll();
        Utils.showMessage(`自动轮播间隔已设置为 ${interval} 毫秒`, 'success');
    }

    // 暂停/恢复轮播
    toggleAutoScroll() {
        if (this.autoScrollInterval) {
            this.stopAutoScroll();
            Utils.showMessage('公告轮播已暂停', 'info');
        } else {
            this.startAutoScroll();
            Utils.showMessage('公告轮播已开始', 'success');
        }
    }

    // 获取轮播状态
    getAutoScrollStatus() {
        return {
            isRunning: this.autoScrollInterval !== null,
            interval: this.AUTO_SCROLL_INTERVAL,
            currentIndex: this.currentAnnouncementIndex,
            total: this.announcements.length
        };
    }
}

// 创建全局公告管理器实例
window.announcementManager = new AnnouncementManager();

// 全局函数 - 用于从外部管理公告
window.AnnouncementManager = {
    addAnnouncement: function(announcement) {
        return window.announcementManager.addAnnouncement(announcement);
    },
    removeAnnouncement: function(id) {
        return window.announcementManager.removeAnnouncement(id);
    },
    getAnnouncements: function() {
        return window.announcementManager.getAnnouncements();
    },
    clearAllAnnouncements: function() {
        return window.announcementManager.clearAllAnnouncements();
    },
    getCurrentAnnouncement: function() {
        return window.announcementManager.getCurrentAnnouncement();
    },
    goToAnnouncement: function(index) {
        return window.announcementManager.goToAnnouncement(index);
    },
    getStats: function() {
        return window.announcementManager.getStats();
    },
    exportAnnouncements: function() {
        return window.announcementManager.exportAnnouncements();
    },
    importAnnouncements: function(file) {
        return window.announcementManager.importAnnouncements(file);
    },
    searchAnnouncements: function(query) {
        return window.announcementManager.searchAnnouncements(query);
    },
    filterByType: function(type) {
        return window.announcementManager.filterByType(type);
    },
    updateAnnouncement: function(id, updatedAnnouncement) {
        return window.announcementManager.updateAnnouncement(id, updatedAnnouncement);
    },
    reorderAnnouncements: function(newOrder) {
        return window.announcementManager.reorderAnnouncements(newOrder);
    },
    batchOperation: function(operation, announcementIds) {
        return window.announcementManager.batchOperation(operation, announcementIds);
    },
    getTypeStatistics: function() {
        return window.announcementManager.getTypeStatistics();
    },
    validateAnnouncement: function(announcement) {
        return window.announcementManager.validateAnnouncement(announcement);
    },
    generatePreview: function(announcement) {
        return window.announcementManager.generatePreview(announcement);
    },
    duplicateAnnouncement: function(id) {
        return window.announcementManager.duplicateAnnouncement(id);
    },
    setExpiration: function(id, expirationDate) {
        return window.announcementManager.setExpiration(id, expirationDate);
    },
    cleanupExpiredAnnouncements: function() {
        return window.announcementManager.cleanupExpiredAnnouncements();
    },
    getTimeline: function() {
        return window.announcementManager.getTimeline();
    },
    setAutoScrollInterval: function(interval) {
        return window.announcementManager.setAutoScrollInterval(interval);
    },
    toggleAutoScroll: function() {
        return window.announcementManager.toggleAutoScroll();
    },
    getAutoScrollStatus: function() {
        return window.announcementManager.getAutoScrollStatus();
    }
};