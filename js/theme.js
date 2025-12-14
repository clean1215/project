// 主题管理
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        this.updateThemeSelection();
    }

    setupEventListeners() {
        // 主题选择器事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-option')) {
                const theme = e.target.closest('.theme-option').dataset.theme;
                this.setTheme(theme);
            }
        });
    }

    setTheme(theme) {
        this.applyTheme(theme);
        Utils.showMessage(`已切换到${theme === 'light' ? '浅色' : '深色'}主题`);
    }

    updateThemeSelection() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// 创建全局主题管理器实例
window.themeManager = new ThemeManager();