// 控制台系统
class ConsoleSystem {
    constructor() {
        this.commands = {
            help: this.showHelp.bind(this),
            clear: this.clearConsole.bind(this),
            theme: this.changeTheme.bind(this),
            storage: this.showStorageInfo.bind(this),
            files: this.showFilesInfo.bind(this),
            reset: this.resetSettings.bind(this),
            version: this.showVersion.bind(this),
            time: this.showTime.bind(this),
            announce: this.showAnnouncements.bind(this),
            export: this.exportData.bind(this),
            import: this.importData.bind(this),
            favorite: this.toggleFavorite.bind(this),
            move: this.moveFile.bind(this),
            segments: this.setCodeSegments.bind(this),
            // 新增：截图动画调试指令
            screenshot: this.debugScreenshotAnimation.bind(this),
            anim: this.debugScreenshotAnimation.bind(this)
        };
        
        // 新增：命令历史记录
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';
        
        // 新增：Tab补全相关
        this.availableCommands = Object.keys(this.commands);
        this.tabCompletionIndex = 0;
        this.tabCompletionMatches = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('executeCommand').addEventListener('click', () => {
            this.executeCommand();
        });

        document.getElementById('resetConsole').addEventListener('click', () => {
            this.clearConsole();
        });

        // 回车键执行命令
        const consoleInput = document.getElementById('consoleInput');
        consoleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand();
            }
        });

        // 新增：键盘事件监听
        consoleInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // 新增：输入变化监听（用于Tab补全）
        consoleInput.addEventListener('input', (e) => {
            this.handleInputChange(e);
        });
    }

    // 新增：处理键盘事件
    handleKeyDown(e) {
        switch (e.key) {
            case 'z':
            case 'Z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.undoLastCommand();
                }
                break;
                
            case 'Tab':
                e.preventDefault();
                this.handleTabCompletion();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(-1);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(1);
                break;
        }
    }

    // 新增：处理输入变化
    handleInputChange(e) {
        const input = e.target.value;
        this.currentInput = input;
        
        // 重置Tab补全状态
        this.tabCompletionIndex = 0;
        this.tabCompletionMatches = [];
    }

    // 新增：Ctrl+Z撤回功能
    undoLastCommand() {
        if (this.commandHistory.length === 0) {
            this.addToOutput('没有可撤回的命令', 'info');
            return;
        }
        
        const lastCommand = this.commandHistory.pop();
        this.addToOutput(`已撤回命令: ${lastCommand}`, 'success');
        
        // 更新历史索引
        this.historyIndex = this.commandHistory.length;
    }

    // 新增：Tab补全功能
    handleTabCompletion() {
        const input = document.getElementById('consoleInput');
        const currentValue = input.value.trim();
        
        if (currentValue === '') {
            // 如果输入为空，显示所有可用命令
            this.showAllCommands();
            return;
        }
        
        // 获取匹配的命令
        const matches = this.availableCommands.filter(cmd => 
            cmd.startsWith(currentValue.toLowerCase())
        );
        
        if (matches.length === 0) {
            // 没有匹配项
            this.addToOutput(`没有找到以 "${currentValue}" 开头的命令`, 'info');
            return;
        }
        
        if (matches.length === 1) {
            // 只有一个匹配项，直接补全
            input.value = matches[0];
            this.currentInput = matches[0];
        } else {
            // 多个匹配项，循环补全
            if (this.tabCompletionMatches.length === 0 || 
                JSON.stringify(this.tabCompletionMatches) !== JSON.stringify(matches)) {
                this.tabCompletionMatches = matches;
                this.tabCompletionIndex = 0;
            } else {
                this.tabCompletionIndex = (this.tabCompletionIndex + 1) % this.tabCompletionMatches.length;
            }
            
            input.value = this.tabCompletionMatches[this.tabCompletionIndex];
            this.currentInput = this.tabCompletionMatches[this.tabCompletionIndex];
            
            // 显示所有匹配项
            this.showTabCompletionMatches(matches);
        }
        
        // 移动光标到末尾
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }

    // 新增：显示所有可用命令
    showAllCommands() {
        const commandsList = this.availableCommands.map(cmd => `• ${cmd}`).join('\n');
        this.addToOutput(`可用命令:\n${commandsList}`);
    }

    // 新增：显示Tab补全匹配项
    showTabCompletionMatches(matches) {
        const matchesText = matches.map(cmd => `• ${cmd}`).join('\n');
        this.addToOutput(`匹配的命令:\n${matchesText}`);
    }

    // 新增：历史记录导航
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        const input = document.getElementById('consoleInput');
        
        if (direction === -1) { // 向上
            if (this.historyIndex === -1) {
                // 第一次按上箭头，保存当前输入
                this.currentInput = input.value;
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else { // 向下
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
            } else {
                // 回到当前输入
                this.historyIndex = -1;
                input.value = this.currentInput;
                return;
            }
        }
        
        if (this.historyIndex >= 0) {
            input.value = this.commandHistory[this.historyIndex];
        }
    }

    executeCommand() {
        const input = document.getElementById('consoleInput');
        const commandText = input.value.trim();
        
        if (!commandText) return;

        this.addToOutput(`> ${commandText}`);
        
        // 新增：保存到历史记录
        if (commandText !== this.commandHistory[this.commandHistory.length - 1]) {
            this.commandHistory.push(commandText);
            this.historyIndex = this.commandHistory.length;
        }
        
        input.value = '';
        this.currentInput = '';

        const [command, ...args] = commandText.split(' ');
        const handler = this.commands[command.toLowerCase()];

        if (handler) {
            try {
                handler(args);
            } catch (error) {
                this.addToOutput(`错误: ${error.message}`, 'error');
            }
        } else {
            this.addToOutput(`未知命令: ${command}。输入 "help" 查看可用命令。`, 'error');
        }
    }

    addToOutput(text, type = 'info') {
        const output = document.getElementById('consoleOutput');
        const div = document.createElement('div');
        
        div.textContent = text;
        if (type === 'error') {
            div.style.color = 'var(--warning-color)';
        } else if (type === 'success') {
            div.style.color = 'var(--success-color)';
        }
        
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
    }

    showHelp() {
        const helpText = `
可用命令：
• help - 显示帮助信息
• clear - 清空控制台输出
• theme [light|dark] - 切换主题
• storage - 显示存储信息
• files - 显示文件统计
• reset nav - 重置导航栏名称
• reset [导航名] [新名称] - 重命名导航项
• reset all - 重置所有设置为默认
• version - 显示系统版本
• time - 显示当前时间
• announce - 显示公告信息
• export - 导出所有数据
• import - 导入数据文件
• favorite [文件ID] - 切换文件收藏状态
• move [文件ID] [目标分类] - 移动文件到其他分类
• segments [文件ID] [段数] - 设置代码段数
• screenshot [code|text] - 播放截图动画（调试）
• anim [code|text] - 播放截图动画（调试快捷命令）

快捷键：
• Ctrl/Cmd + Z - 撤回上一条命令
• Tab - 命令补全
• ↑/↓ - 浏览命令历史
• Ctrl/Cmd + K - 聚焦控制台输入框
        `.trim();
        
        this.addToOutput(helpText);
    }

    clearConsole() {
        document.getElementById('consoleOutput').innerHTML = 
            '// 文件资源管理系统控制台 v2.0\n// 输入 "help" 查看可用命令';
    }

    changeTheme(args) {
        const theme = args[0];
        if (theme === 'light' || theme === 'dark') {
            window.themeManager.setTheme(theme);
            this.addToOutput(`主题已切换到${theme === 'light' ? '浅色' : '深色'}模式`, 'success');
        } else {
            this.addToOutput('用法: theme [light|dark]', 'error');
        }
    }

    showStorageInfo() {
        fileManager.updateStorageInfo();
        const used = document.getElementById('storageUsed').textContent;
        const total = document.getElementById('storageTotal').textContent;
        const percentage = document.getElementById('storagePercentage').textContent;
        
        this.addToOutput(`存储使用情况: ${used} / ${total} (${percentage})`);
    }

    showFilesInfo() {
        const files = fileManager.getAllFilesData();
        let totalFiles = 0;
        let favoriteFiles = 0;
        
        for (const category in files) {
            totalFiles += files[category].length;
            favoriteFiles += files[category].filter(file => file.favorite).length;
        }
        
        this.addToOutput(`文件统计:
• 总文件数: ${totalFiles}
• 收藏文件: ${favoriteFiles}
• 道具文件: ${files.items.length}
• 技能文件: ${files.skills.length}
• 人物文件: ${files.characters.length}
• 天赋文件: ${files.talents.length}
• 其他文件: ${files.others.length}`);
    }

    resetSettings(args) {
        if (args[0] === 'nav') {
            window.navigationManager.resetNavigationNames();
            this.addToOutput('导航栏名称已重置', 'success');
        } else if (args[0] === 'all') {
            window.navigationManager.resetNavigationNames();
            window.themeManager.setTheme('light');
            this.addToOutput('所有设置已重置为默认值', 'success');
        } else if (args.length >= 2) {
            const page = args[0];
            const newName = args.slice(1).join(' ');
            window.navigationManager.saveNavName(page, newName);
            this.addToOutput(`导航项 "${page}" 已重命名为 "${newName}"`, 'success');
        } else {
            this.addToOutput('用法: reset [nav|all|导航名 新名称]', 'error');
        }
    }

    showVersion() {
        this.addToOutput('文件资源管理系统 v2.0\n构建时间: 2025-11-11');
    }

    showTime() {
        const now = new Date();
        this.addToOutput(now.toLocaleString('zh-CN'));
    }

    showAnnouncements() {
        const announcements = window.announcementManager.getAnnouncements();
        if (announcements.length === 0) {
            this.addToOutput('暂无公告');
            return;
        }
        
        this.addToOutput(`共有 ${announcements.length} 条公告:`);
        announcements.forEach(announcement => {
            this.addToOutput(`• [${announcement.date}] ${announcement.title}`);
        });
    }

    exportData() {
        fileManager.exportAllData();
        this.addToOutput('数据导出命令已执行', 'success');
    }

    importData() {
        document.getElementById('dataFileInput').click();
        this.addToOutput('请选择要导入的数据文件');
    }

    toggleFavorite(args) {
        if (args.length !== 1) {
            this.addToOutput('用法: favorite [文件ID]', 'error');
            return;
        }
        
        const fileId = parseInt(args[0]);
        const file = fileManager.findFileById(fileId);
        
        if (!file) {
            this.addToOutput(`未找到ID为 ${fileId} 的文件`, 'error');
            return;
        }
        
        // 模拟点击收藏按钮
        const starElement = document.querySelector(`.star-icon[data-id="${fileId}"]`);
        if (starElement) {
            fileManager.toggleFavorite(fileId, file.category, starElement);
            this.addToOutput(`文件 "${file.name}" 收藏状态已切换`, 'success');
        } else {
            this.addToOutput('无法找到对应的收藏按钮', 'error');
        }
    }

    moveFile(args) {
        if (args.length !== 2) {
            this.addToOutput('用法: move [文件ID] [目标分类]', 'error');
            return;
        }
        
        const fileId = parseInt(args[0]);
        const targetCategory = args[1];
        const file = fileManager.findFileById(fileId);
        
        if (!file) {
            this.addToOutput(`未找到ID为 ${fileId} 的文件`, 'error');
            return;
        }
        
        const validCategories = ['items', 'skills', 'characters', 'talents', 'others'];
        if (!validCategories.includes(targetCategory)) {
            this.addToOutput(`无效的分类: ${targetCategory}。可用分类: ${validCategories.join(', ')}`, 'error');
            return;
        }
        
        fileManager.moveFile(file, targetCategory);
        this.addToOutput(`文件已移动到 ${targetCategory}`, 'success');
    }

    setCodeSegments(args) {
        if (args.length !== 2) {
            this.addToOutput('用法: segments [文件ID] [段数]', 'error');
            return;
        }
        
        const fileId = parseInt(args[0]);
        const segments = parseInt(args[1]);
        const file = fileManager.findFileById(fileId);
        
        if (!file) {
            this.addToOutput(`未找到ID为 ${fileId} 的文件`, 'error');
            return;
        }
        
        if (!Utils.isCodeFile(file.name)) {
            this.addToOutput('此文件不是代码文件，无法设置代码段数', 'error');
            return;
        }
        
        if (segments < 1 || segments > 100) {
            this.addToOutput('段数必须在 1-100 之间', 'error');
            return;
        }
        
        // 更新代码段数
        const fileIndex = fileManager.allFiles[file.category].findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
            fileManager.allFiles[file.category][fileIndex].codeSegments = segments;
            fileManager.saveToLocalStorage();
            fileManager.renderFiles();
            this.addToOutput(`文件 "${file.name}" 的代码段数已设置为 ${segments}`, 'success');
        }
    }

    // 新增：截图动画调试指令处理
    debugScreenshotAnimation(args) {
        if (args.length === 0) {
            this.addToOutput('用法: screenshot [code|text] - 播放截图动画', 'info');
            this.addToOutput('  code - 代码文件动画', 'info');
            this.addToOutput('  text - 文本文件动画', 'info');
            this.addToOutput('示例:', 'info');
            this.addToOutput('  screenshot code - 播放代码文件截图动画', 'info');
            this.addToOutput('  anim text - 播放文本文件截图动画', 'info');
            return;
        }
        
        const type = args[0].toLowerCase();
        if (type === 'code' || type === 'text') {
            const isCodeFile = type === 'code';
            this.addToOutput(`开始播放${isCodeFile ? '代码' : '文本'}截图动画...`, 'success');
            
            // 调用动画系统的调试方法
            if (window.codeScreenshotAnimation) {
                window.codeScreenshotAnimation.playDebugAnimation(isCodeFile);
                this.addToOutput('动画已启动，请查看弹窗...', 'info');
            } else {
                this.addToOutput('错误: 截图动画系统未加载', 'error');
            }
        } else {
            this.addToOutput('错误: 参数必须是 "code" 或 "text"', 'error');
            this.addToOutput('使用 "screenshot code" 或 "screenshot text"', 'info');
        }
    }

    // 新增：获取命令历史
    getCommandHistory() {
        return [...this.commandHistory];
    }

    // 新增：清空命令历史
    clearCommandHistory() {
        this.commandHistory = [];
        this.historyIndex = -1;
        this.addToOutput('命令历史已清空', 'success');
    }
}

// 创建全局控制台系统实例
window.consoleSystem = new ConsoleSystem();