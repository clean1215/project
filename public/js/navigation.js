// 导航管理
class NavigationManager {
    constructor() {
        this.defaultNavNames = {
            items: '道具',
            skills: '技能', 
            characters: '人物',
            talents: '天赋',
            others: '其他',
            images: '万相集'  // 新增万相集
        };
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNavigationDisplay();
        this.initRenameControls();
    }

    setupEventListeners() {
        // 导航链接点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                const link = e.target.closest('.nav-link');
                const page = link.dataset.page;
                this.switchPage(page);
                
                // 更新活动状态
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                if (Utils.isIOS) e.preventDefault();
            }
        });

        // 导航重命名事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.save-rename')) {
                const btn = e.target.closest('.save-rename');
                const page = btn.dataset.page;
                const input = document.querySelector(`.rename-input[data-page="${page}"]`);
                this.saveNavName(page, input.value.trim() || this.defaultNavNames[page]);
            }

            if (e.target.closest('.reset-rename')) {
                const btn = e.target.closest('.reset-rename');
                const page = btn.dataset.page;
                this.resetSingleNavName(page);
            }

            if (e.target.closest('#resetNavNames')) {
                this.resetNavigationNames();
            }
        });
    }

    switchPage(page) {
        this.currentPage = page;
        const pages = {
            dashboard: { 
                title: '仪表盘', 
                desc: '管理您的资源文件，导入并查看内容', 
                section: '资源文件', 
                import: true, 
                grid: true, 
                more: false, 
                announcement: true 
            },
            items: { 
                title: this.getNavName('items'), 
                desc: `管理${this.getNavName('items')}资源文件`, 
                section: `${this.getNavName('items')}资源文件`, 
                import: false, 
                grid: true, 
                more: false, 
                announcement: false 
            },
            skills: { 
                title: this.getNavName('skills'), 
                desc: `管理${this.getNavName('skills')}资源文件`, 
                section: `${this.getNavName('skills')}资源文件`, 
                import: false, 
                grid: true, 
                more: false, 
                announcement: false 
            },
            characters: { 
                title: this.getNavName('characters'), 
                desc: `管理${this.getNavName('characters')}资源文件`, 
                section: `${this.getNavName('characters')}资源文件`, 
                import: false, 
                grid: true, 
                more: false, 
                announcement: false 
            },
            talents: { 
                title: this.getNavName('talents'), 
                desc: `管理${this.getNavName('talents')}资源文件`, 
                section: `${this.getNavName('talents')}资源文件`, 
                import: false, 
                grid: true, 
                more: false, 
                announcement: false 
            },
            others: { 
                title: this.getNavName('others'), 
                desc: `管理${this.getNavName('others')}资源文件`, 
                section: `${this.getNavName('others')}资源文件`, 
                import: false, 
                grid: true, 
                more: false, 
                announcement: false 
            },
            images: { 
                title: this.getNavName('images'), 
                desc: `管理${this.getNavName('images')}资源文件`, 
                section: `${this.getNavName('images')}资源文件`, 
                import: false, 
                grid: true, 
                more: false, 
                announcement: false 
            },
            more: { 
                title: '更多', 
                desc: '系统设置', 
                section: '系统设置', 
                import: false, 
                grid: false, 
                more: true, 
                announcement: false 
            }
        };

        const config = pages[page];
        if (!config) return;

        document.getElementById('pageTitle').textContent = config.title;
        document.getElementById('pageDescription').textContent = config.desc;
        document.getElementById('sectionTitle').textContent = config.section;
        document.getElementById('importSection').style.display = config.import ? 'block' : 'none';
        document.getElementById('gridSection').style.display = config.grid ? 'block' : 'none';
        document.getElementById('moreSection').style.display = config.more ? 'block' : 'none';
        document.getElementById('announcementSection').style.display = config.announcement ? 'block' : 'none';
        
        // 触发页面切换事件
        window.dispatchEvent(new CustomEvent('pageChanged', { detail: { page, config } }));
        
        // 更新分类选择器状态
        this.updateCategorySelection();
        
        // 如果切换到万相集页面，确保图片管理器渲染
        if (page === 'images' && window.imageManager) {
            setTimeout(() => {
                window.imageManager.renderImages();
            }, 100);
        }
    }

    updateCategorySelection() {
        const options = document.querySelectorAll('.category-option');
        options.forEach(option => {
            // 只在仪表盘页面更新分类选择器
            if (this.currentPage === 'dashboard') {
                option.classList.toggle('active', option.dataset.category === fileManager.currentCategory);
            }
        });
    }

    getNavName(page) {
        return localStorage.getItem(`navName_${page}`) || this.defaultNavNames[page];
    }

    saveNavName(page, name) {
        localStorage.setItem(`navName_${page}`, name);
        this.updateNavigationDisplay();
        this.updateCategorySelectors(); // 新增：更新分类选择器
        Utils.showMessage(`"${this.defaultNavNames[page]}" 已重命名为 "${name}"`);
    }

    resetSingleNavName(page) {
        localStorage.removeItem(`navName_${page}`);
        this.updateNavigationDisplay();
        this.updateCategorySelectors(); // 新增：更新分类选择器
        this.initRenameControls();
        Utils.showMessage(`"${this.defaultNavNames[page]}" 名称已重置`);
    }

    resetNavigationNames() {
        const renameablePages = ['items', 'skills', 'characters', 'talents', 'others', 'images'];
        renameablePages.forEach(page => {
            localStorage.removeItem(`navName_${page}`);
        });
        this.updateNavigationDisplay();
        this.updateCategorySelectors(); // 新增：更新分类选择器
        this.initRenameControls();
        Utils.showMessage('所有导航栏名称已重置为默认值');
    }

    updateNavigationDisplay() {
        // 更新导航链接文本
        document.querySelectorAll('.nav-link').forEach(link => {
            const page = link.dataset.page;
            if (page !== 'dashboard' && page !== 'more') {
                const span = link.querySelector('span');
                if (span) {
                    span.textContent = this.getNavName(page);
                }
            }
        });
        
        // 如果当前页面是重命名页面之一，更新页面标题
        if (this.currentPage !== 'dashboard' && this.currentPage !== 'more') {
            this.switchPage(this.currentPage);
        }
    }

    // 新增方法：更新所有分类选择器的选项文本
    updateCategorySelectors() {
        // 更新拖拽导入弹窗中的分类选择器
        this.updateDragDropCategorySelectors();
        
        // 更新文件管理器中的分类选择器（如果有的话）
        this.updateFileManagerCategorySelectors();
    }

    // 更新拖拽导入弹窗中的分类选择器
    updateDragDropCategorySelectors() {
        const categorySelects = document.querySelectorAll('.file-category-select');
        categorySelects.forEach(select => {
            // 保存当前选中的值
            const currentValue = select.value;
            
            // 更新选项文本
            const options = select.querySelectorAll('option');
            options.forEach(option => {
                const page = option.value;
                if (page !== '') {
                    const displayName = this.getNavName(page);
                    option.textContent = displayName;
                }
            });
            
            // 恢复选中的值
            select.value = currentValue;
        });
    }

    // 更新文件管理器中的分类选择器（如果有的话）
    updateFileManagerCategorySelectors() {
        // 如果有文件管理器的分类选择器，也更新它们
        const fileManagerSelects = document.querySelectorAll('.category-filter-select, .file-category-option');
        fileManagerSelects.forEach(select => {
            const options = select.querySelectorAll('option');
            options.forEach(option => {
                const page = option.value;
                if (page && page !== 'all' && page !== 'favorites') {
                    const displayName = this.getNavName(page);
                    option.textContent = displayName;
                }
            });
        });
        
        // 如果当前在文件管理页面，重新渲染文件列表以更新分类显示
        if (window.fileManager && window.fileManager.renderFiles) {
            window.fileManager.renderFiles();
        }
        
        // 如果当前在万相集页面，重新渲染图片
        if (this.currentPage === 'images' && window.imageManager && window.imageManager.renderImages) {
            window.imageManager.renderImages();
        }
    }

    initRenameControls() {
        const renameablePages = ['items', 'skills', 'characters', 'talents', 'others', 'images'];
        const renameControls = document.getElementById('renameControls');
        
        if (!renameControls) return;
        
        renameControls.innerHTML = '';
        
        renameablePages.forEach(page => {
            const currentName = this.getNavName(page);
            const defaultName = this.defaultNavNames[page];
            
            const renameItem = document.createElement('div');
            renameItem.className = 'rename-item';
            renameItem.innerHTML = `
                <span class="rename-item-label">${defaultName}:</span>
                <input type="text" class="rename-input" data-page="${page}" value="${currentName}" placeholder="${defaultName}">
                <div class="rename-actions">
                    <button class="btn btn-primary touch-feedback save-rename" data-page="${page}">
                        <i class="ti ti-check"></i>
                        保存
                    </button>
                    <button class="btn btn-secondary touch-feedback reset-rename" data-page="${page}">
                        <i class="ti ti-refresh"></i>
                        重置
                    </button>
                </div>
            `;
            
            renameControls.appendChild(renameItem);
        });
        
        // 初始化时也更新分类选择器
        this.updateCategorySelectors();
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

// 创建全局导航管理器实例
window.navigationManager = new NavigationManager();