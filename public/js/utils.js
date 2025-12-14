// 工具函数库

// 检测iOS设备
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// iOS专用事件处理
function handleIOS() {
    // 阻止所有链接的默认行为
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href') === '#') {
            e.preventDefault();
        }
    }, true);
    
    // 为所有按钮添加触摸反馈
    const buttons = document.querySelectorAll('.btn, .card-btn, .category-option, .theme-option, .nav-link');
    buttons.forEach(btn => {
        btn.addEventListener('touchstart', function() {
            this.classList.add('active');
        });
        
        btn.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
    });
    
    // 修复iOS输入框焦点问题
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            e.target.focus();
        }
    });
}

// HTML转义函数，防止XSS
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 文件大小格式化函数
function formatFileSize(bytes) {
    if (bytes === 0 || bytes == null) return '0 Bytes';
    if (typeof bytes !== 'number') return '未知';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 消息提示函数
function showMessage(message, type = 'info') {
    // 移除现有的消息
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
    
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.className = 'message-toast';
    
    let backgroundColor = 'var(--primary-color)';
    let icon = 'ti-info-circle';
    
    if (type === 'error') {
        backgroundColor = 'var(--warning-color)';
        icon = 'ti-alert-circle';
    } else if (type === 'success') {
        backgroundColor = 'var(--success-color)';
        icon = 'ti-check';
    } else if (type === 'warning') {
        backgroundColor = '#ffa726';
        icon = 'ti-alert-triangle';
    } else if (type === 'info') {
        backgroundColor = '#4361ee';
        icon = 'ti-info-circle';
    }
    
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: var(--shadow);
        max-width: 300px;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
    `;
    
    messageEl.innerHTML = `
        <i class="ti ${icon}" style="font-size: 16px;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }
    }, 3000);
}

// 构建图片路径
function buildImagePath(imageName) {
    if (!imageName) return '';
    
    // 如果已经是完整URL或数据URL，直接返回
    if (imageName.startsWith('http') || imageName.startsWith('data:') || imageName.startsWith('/')) {
        return imageName;
    }
    
    // 使用正确的相对路径
    return `images/${imageName}`;
}

// 检查是否为代码文件
function isCodeFile(filename) {
    if (!filename) return false;
    
    const codeFileExtensions = [
        '.js', '.java', '.py', '.c', '.cpp', '.h', '.html', '.css', 
        '.php', '.json', '.xml', '.sql', '.ts', '.jsx', '.tsx', 
        '.vue', '.rb', '.go', '.rs', '.sh', '.bat', '.ps1', '.md',
        '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'
    ];
    return codeFileExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// 检查是否为图片文件
function isImageFile(filename) {
    if (!filename) return false;
    
    const imageExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', 
        '.tiff', '.tif', '.ico', '.heic', '.heif', '.avif', '.jfif'
    ];
    
    const fileName = filename.toLowerCase();
    return imageExtensions.some(ext => fileName.endsWith(ext));
}

// 检查是否为图片文件（加强版）
function isImageFileEnhanced(file) {
    if (!file) return false;
    
    // 如果传入的是File对象
    if (file instanceof File) {
        // 检查MIME类型
        if (file.type && file.type.startsWith('image/')) {
            return true;
        }
        
        // 检查文件扩展名
        const fileName = file.name.toLowerCase();
        return isImageFile(fileName);
    }
    
    // 如果传入的是文件名字符串
    if (typeof file === 'string') {
        return isImageFile(file);
    }
    
    return false;
}

// 计算代码段数
function countCodeSegments(content) {
    if (!content || !content.trim()) return 0;
    
    try {
        // 按函数、类、方法等分割代码段
        const segments = content.split(/\n\s*\n|\{|\}|class |function |def |public |private |protected /);
        
        // 过滤空段和非常短的段
        const validSegments = segments.filter(segment => 
            segment.trim().length > 10 && 
            !segment.trim().startsWith('//') &&
            !segment.trim().startsWith('/*') &&
            !segment.trim().startsWith('*') &&
            !segment.trim().startsWith('#') &&
            !segment.trim().startsWith('import ') &&
            !segment.trim().startsWith('export ') &&
            !segment.trim().startsWith('from ')
        );
        
        return Math.max(1, validSegments.length); // 至少1段
    } catch (error) {
        console.error('计算代码段数失败:', error);
        return 1;
    }
}

// 获取文件图标
function getFileIcon(filename) {
    if (!filename) return 'ti-file';
    
    const extension = filename.toLowerCase();
    
    // 图片文件图标
    if (isImageFile(filename)) return 'ti-photo';
    
    // 其他文件类型图标
    if (extension.endsWith('.json')) return 'ti-file-code';
    if (extension.endsWith('.txt')) return 'ti-file-text';
    if (extension.endsWith('.xml')) return 'ti-file-code';
    if (extension.endsWith('.csv')) return 'ti-file-spreadsheet';
    if (extension.endsWith('.pdf')) return 'ti-file-text';
    if (extension.endsWith('.doc') || extension.endsWith('.docx')) return 'ti-file-text';
    if (extension.endsWith('.xls') || extension.endsWith('.xlsx')) return 'ti-file-spreadsheet';
    if (extension.endsWith('.ppt') || extension.endsWith('.pptx')) return 'ti-presentation';
    if (extension.endsWith('.zip') || extension.endsWith('.rar')) return 'ti-archive';
    if (extension.endsWith('.mp3') || extension.endsWith('.wav')) return 'ti-music';
    if (extension.endsWith('.mp4') || extension.endsWith('.avi')) return 'ti-video';
    
    if (isCodeFile(filename)) return 'ti-file-code';
    return 'ti-file';
}

// 数据验证
function isValidDataStructure(data) {
    if (!data || typeof data !== 'object') return false;
    
    const expected = ['items', 'skills', 'characters', 'talents', 'others'];
    return expected.every(cat => data.hasOwnProperty(cat) && Array.isArray(data[cat]));
}

// 图片数据验证
function isValidImageData(data) {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['id', 'name', 'dataUrl', 'uploadTime'];
    return requiredFields.every(field => data.hasOwnProperty(field));
}

// 防抖函数
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 创建小星星动画
function createStarAnimation(starElement) {
    try {
        const starRect = starElement.getBoundingClientRect();
        const starX = starRect.left + starRect.width / 2;
        const starY = starRect.top + starRect.height / 2;
        
        const miniStarCount = Math.floor(Math.random() * 4) + 3; // 3-6个小星星
        for (let i = 0; i < miniStarCount; i++) {
            const miniStar = document.createElement('div');
            miniStar.className = 'mini-star';
            miniStar.innerHTML = '★';
            miniStar.style.left = `${starX}px`;
            miniStar.style.top = `${starY}px`;
            miniStar.style.position = 'fixed';
            miniStar.style.zIndex = '10000';
            miniStar.style.pointerEvents = 'none';
            miniStar.style.fontSize = '12px';
            miniStar.style.color = '#ffc107';
            miniStar.style.textShadow = '0 0 3px rgba(255,193,7,0.8)';
            
            // 随机方向
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            miniStar.style.setProperty('--tx', `${tx}px`);
            miniStar.style.setProperty('--ty', `${ty}px`);
            
            document.body.appendChild(miniStar);
            
            // 开始动画
            setTimeout(() => {
                miniStar.style.animation = `starFall 0.8s ease forwards`;
            }, 10);
            
            // 动画结束后移除元素
            setTimeout(() => {
                if (miniStar.parentNode) {
                    miniStar.parentNode.removeChild(miniStar);
                }
            }, 900);
        }
    } catch (error) {
        console.error('创建星星动画失败:', error);
    }
}

// 生成唯一ID
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// 格式化日期
function formatDate(date, format = 'yyyy-MM-dd HH:mm:ss') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const pad = (n) => n.toString().padStart(2, '0');
    
    return format
        .replace('yyyy', d.getFullYear())
        .replace('MM', pad(d.getMonth() + 1))
        .replace('dd', pad(d.getDate()))
        .replace('HH', pad(d.getHours()))
        .replace('mm', pad(d.getMinutes()))
        .replace('ss', pad(d.getSeconds()));
}

// 深度克隆对象
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// 验证文件类型
function validateFileType(file, allowedTypes = []) {
    if (!file) return false;
    if (allowedTypes.length === 0) return true;
    
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return allowedTypes.some(type => {
        if (type.startsWith('.')) {
            return extension === type.toLowerCase();
        }
        return file.type.startsWith(type);
    });
}

// 读取文件为DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// 读取文件为文本
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// 检查本地存储可用性
function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// 获取文件类型颜色
function getFileTypeColor(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    
    const colorMap = {
        // 代码文件
        'js': '#f7df1e', 'java': '#007396', 'py': '#3776ab', 'cpp': '#00599c',
        'c': '#555555', 'html': '#e34f26', 'css': '#1572b6', 'php': '#777bb4',
        'json': '#000000', 'xml': '#f0ad4e', 'sql': '#4479a1', 'ts': '#3178c6',
        // 文档文件
        'txt': '#6c757d', 'pdf': '#ff0000', 'doc': '#2b579a', 'docx': '#2b579a',
        'xls': '#217346', 'xlsx': '#217346', 'ppt': '#d24726', 'pptx': '#d24726',
        // 压缩文件
        'zip': '#ffa726', 'rar': '#ffa726', '7z': '#ffa726',
        // 图片文件
        'jpg': '#ff6d00', 'jpeg': '#ff6d00', 'png': '#4caf50', 'gif': '#f44336',
        'bmp': '#795548', 'webp': '#4caf50', 'svg': '#ff9800', 'ico': '#9c27b0',
        // 默认
        'default': '#4361ee'
    };
    
    return colorMap[extension] || colorMap.default;
}

// 查找文件（补充方法）
function findFileByName(fileName) {
    if (!fileName || !window.fileManager || !window.fileManager.allFiles) return null;
    return window.fileManager.findFileByName(fileName);
}

// 基于LCS（最长公共子序列）的智能差异对比
function calculateTextDiff(oldText, newText) {
    if (!oldText && !newText) return { added: [], removed: [] };
    if (!oldText) return { added: [newText], removed: [] };
    if (!newText) return { added: [], removed: [oldText] };
    
    // 将文本分割为行
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    // LCS算法实现
    const m = oldLines.length;
    const n = newLines.length;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // 构建DP表
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // 回溯找出LCS
    let i = m, j = n;
    const added = [];
    const removed = [];
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            // 相同的行
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            // 新增的行
            added.unshift({ line: newLines[j - 1], index: j - 1 });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            // 移除的行
            removed.unshift({ line: oldLines[i - 1], index: i - 1 });
            i--;
        }
    }
    
    return { added, removed };
}

// 生成完整的文本差异对比
function generateFullContentDiff(oldContent, newContent, isNewFile = false) {
    if (!oldContent && !newContent) {
        return '<div class="full-text-display">内容为空</div>';
    }
    
    const diff = calculateTextDiff(oldContent || '', newContent || '');
    const oldLines = (oldContent || '').split('\n');
    const newLines = (newContent || '').split('\n');
    
    let result = '<div class="full-text-display">';
    
    if (isNewFile) {
        // 新文件：显示所有新内容，高亮新增的行
        const addedMap = new Map();
        diff.added.forEach(item => {
            addedMap.set(item.index, true);
        });
        
        newLines.forEach((line, index) => {
            if (addedMap.has(index)) {
                // 新增的行 - 红色加粗，黄色背景
                result += `<div class="diff-line diff-added" data-line="${index + 1}">`;
                result += `<div class="diff-line-number">${index + 1}</div>`;
                result += `<div class="diff-content">`;
                result += `<span class="text-diff-added">${escapeHtml(line)}</span>`;
                result += `</div></div>`;
            } else {
                // 未变化的行
                result += `<div class="diff-line diff-unchanged" data-line="${index + 1}">`;
                result += `<div class="diff-line-number">${index + 1}</div>`;
                result += `<div class="diff-content">${escapeHtml(line)}</div>`;
                result += `</div>`;
            }
        });
    } else {
        // 旧文件：显示所有旧内容，高亮移除的行
        const removedMap = new Map();
        diff.removed.forEach(item => {
            removedMap.set(item.index, true);
        });
        
        oldLines.forEach((line, index) => {
            if (removedMap.has(index)) {
                // 移除的行 - 红色加粗，黄色背景，删除线
                result += `<div class="diff-line diff-removed" data-line="${index + 1}">`;
                result += `<div class="diff-line-number">${index + 1}</div>`;
                result += `<div class="diff-content">`;
                result += `<span class="text-diff-removed">${escapeHtml(line)}</span>`;
                result += `</div></div>`;
            } else {
                // 未变化的行
                result += `<div class="diff-line diff-unchanged" data-line="${index + 1}">`;
                result += `<div class="diff-line-number">${index + 1}</div>`;
                result += `<div class="diff-content">${escapeHtml(line)}</div>`;
                result += `</div>`;
            }
        });
    }
    
    result += '</div>';
    return result;
}

// 获取文件内容的MD5哈希（用于精确比较）
async function getContentHash(content) {
    if (!content) return '';
    
    try {
        // 使用简单的哈希算法
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16);
    } catch (error) {
        console.error('计算哈希失败:', error);
        return '';
    }
}

// 精确比较文件内容
function isContentExactlySame(content1, content2) {
    if (content1 === content2) return true;
    if (!content1 || !content2) return false;
    return content1 === content2;
}

// 压缩图片
function compressImage(dataUrl, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 限制最大宽度
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                // 根据图片类型选择压缩格式
                let mimeType = 'image/jpeg';
                if (dataUrl.startsWith('data:image/png')) {
                    mimeType = 'image/png';
                    quality = Math.min(0.9, quality); // PNG质量范围不同
                } else if (dataUrl.startsWith('data:image/webp')) {
                    mimeType = 'image/webp';
                }
                
                const compressedDataUrl = canvas.toDataURL(mimeType, quality);
                resolve(compressedDataUrl);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// 获取图片信息
function getImageInfo(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                size: dataUrl.length * 0.75, // 估算Base64数据大小（约75%）
                mimeType: dataUrl.split(';')[0].split(':')[1]
            });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// 生成缩略图
function generateThumbnail(dataUrl, maxWidth = 200, maxHeight = 200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            
            // 计算缩略图尺寸
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(thumbnailUrl);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// 从DataURL提取文件信息
function parseDataUrl(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    
    try {
        const matches = dataUrl.match(/^data:(.+?);base64,(.+)$/);
        if (!matches) return null;
        
        return {
            mimeType: matches[1],
            data: matches[2],
            size: Math.floor(matches[2].length * 0.75) // Base64数据大小估算
        };
    } catch (error) {
        console.error('解析DataURL失败:', error);
        return null;
    }
}

// 获取安全的文件名
function getSafeFileName(filename) {
    if (!filename) return 'unnamed';
    
    // 移除非法字符，保留中文、英文、数字、下划线、点和连字符
    const safeName = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    
    // 限制文件名长度
    const maxLength = 100;
    if (safeName.length > maxLength) {
        const extension = safeName.split('.').pop();
        const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 1);
        return `${truncatedName}.${extension}`;
    }
    
    return safeName;
}

// 计算文件数组的总大小
function calculateTotalSize(files) {
    if (!Array.isArray(files)) return 0;
    
    return files.reduce((total, file) => {
        if (file && (file.size || file.length)) {
            return total + (file.size || file.length || 0);
        }
        return total;
    }, 0);
}

// 检查浏览器特性支持
function checkBrowserSupport() {
    const supports = {
        fileReader: 'FileReader' in window,
        blob: 'Blob' in window,
        formData: 'FormData' in window,
        canvas: 'HTMLCanvasElement' in window,
        webWorkers: 'Worker' in window,
        webGL: 'WebGLRenderingContext' in window,
        touch: 'ontouchstart' in window,
        localStorage: isLocalStorageAvailable(),
        indexedDB: 'indexedDB' in window,
        serviceWorker: 'serviceWorker' in navigator,
        webShare: 'share' in navigator
    };
    
    return supports;
}

// 获取浏览器信息
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    // Chrome
    if (ua.includes('Chrome') && !ua.includes('Edge') && !ua.includes('OPR')) {
        browser = 'Chrome';
        const match = ua.match(/Chrome\/(\d+\.\d+)/);
        if (match) version = match[1];
    }
    // Firefox
    else if (ua.includes('Firefox')) {
        browser = 'Firefox';
        const match = ua.match(/Firefox\/(\d+\.\d+)/);
        if (match) version = match[1];
    }
    // Safari
    else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
        const match = ua.match(/Version\/(\d+\.\d+)/);
        if (match) version = match[1];
    }
    // Edge
    else if (ua.includes('Edge')) {
        browser = 'Edge';
        const match = ua.match(/Edge\/(\d+\.\d+)/);
        if (match) version = match[1];
    }
    
    return {
        browser,
        version,
        userAgent: ua,
        platform: navigator.platform,
        language: navigator.language,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth,
            pixelDepth: window.screen.pixelDepth
        },
        window: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        }
    };
}

// 延迟执行函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 生成随机颜色
function getRandomColor() {
    const colors = [
        '#4361ee', '#3a0ca3', '#7209b7', '#f72585',
        '#4cc9f0', '#4895ef', '#560bad', '#b5179e',
        '#f15bb5', '#9b5de5', '#00bbf9', '#00f5d4',
        '#06d6a0', '#118ab2', '#073b4c', '#ffd166',
        '#ef476f', '#06d6a0', '#7209b7', '#3a86ff'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ==================== 新增的Base85编码功能 ====================

// Base85 编码函数
function encodeBase85(str) {
    if (!str) return '';
    
    try {
        // Base85字符集（RFC 1924版本）
        const base85Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';
        let result = '';
        
        // 将字符串转换为字节数组
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        
        // 处理字节，每4个字节为一组
        for (let i = 0; i < bytes.length; i += 4) {
            let num = 0;
            
            // 将4个字节组合成一个32位整数
            for (let j = 0; j < 4; j++) {
                const byte = (i + j < bytes.length) ? bytes[i + j] : 0;
                num = (num << 8) | byte;
            }
            
            // 转换为Base85（5个字符）
            const chunk = new Array(5);
            for (let j = 4; j >= 0; j--) {
                chunk[j] = base85Chars.charAt(num % 85);
                num = Math.floor(num / 85);
            }
            
            result += chunk.join('');
        }
        
        return result;
    } catch (error) {
        console.error('Base85编码失败:', error);
        return '';
    }
}

// Base85 解码函数
function decodeBase85(str) {
    if (!str) return '';
    
    try {
        const base85Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';
        const decoder = new TextDecoder();
        const bytes = [];
        
        // 确保字符串长度是5的倍数
        const paddedStr = str.padEnd(Math.ceil(str.length / 5) * 5, base85Chars[0]);
        
        // 处理Base85字符串，每5个字符为一组
        for (let i = 0; i < paddedStr.length; i += 5) {
            let num = 0;
            const chunk = paddedStr.substring(i, i + 5);
            
            // 将5个Base85字符转换为32位整数
            for (let j = 0; j < 5; j++) {
                num = num * 85 + base85Chars.indexOf(chunk.charAt(j));
            }
            
            // 将32位整数分解为字节（最多4个字节）
            for (let j = 3; j >= 0; j--) {
                const byte = (num >> (8 * j)) & 0xFF;
                // 只添加非零字节或原始字符串对应的字节
                if (i + (3 - j) < str.length * 4 / 5 || byte !== 0) {
                    bytes.push(byte);
                }
            }
        }
        
        return decoder.decode(new Uint8Array(bytes));
    } catch (error) {
        console.error('Base85解码失败:', error);
        return '';
    }
}

// 压缩图片数据为Base85
function compressImageToBase85(dataUrl) {
    if (!dataUrl) return '';
    
    try {
        // 提取Base64部分
        let base64Data;
        if (dataUrl.includes('base64,')) {
            base64Data = dataUrl.split('base64,')[1];
        } else {
            // 如果不是标准的DataURL，直接使用
            base64Data = dataUrl;
        }
        
        // 将Base64解码为二进制字符串
        const binaryString = atob(base64Data);
        
        // 将二进制字符串转换为Base85
        return encodeBase85(binaryString);
    } catch (error) {
        console.error('图片压缩为Base85失败:', error);
        return '';
    }
}

// 从Base85恢复图片数据
function restoreImageFromBase85(base85Str, mimeType = 'image/jpeg') {
    if (!base85Str) return '';
    
    try {
        // 解码Base85为二进制字符串
        const binaryString = decodeBase85(base85Str);
        
        // 将二进制字符串转换为Base64
        const base64 = btoa(binaryString);
        
        // 构建DataURL
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error('从Base85恢复图片失败:', error);
        return '';
    }
}

// 比较Base85和Base64的压缩率
function compareCompression(dataUrl) {
    if (!dataUrl) return null;
    
    try {
        // 提取Base64数据
        const base64Data = dataUrl.includes('base64,') ? 
            dataUrl.split('base64,')[1] : dataUrl;
        
        // 转换为Base85
        const base85Data = compressImageToBase85(dataUrl);
        
        const base64Size = base64Data.length;
        const base85Size = base85Data.length;
        const compressionRatio = ((base85Size / base64Size) * 100).toFixed(2);
        
        return {
            base64: {
                size: base64Size,
                display: formatFileSize(base64Size * 0.75) // 近似实际大小
            },
            base85: {
                size: base85Size,
                display: formatFileSize(base85Size * 0.8) // 近似实际大小
            },
            compressionRatio: `${compressionRatio}%`,
            savedPercent: (100 - parseFloat(compressionRatio)).toFixed(2)
        };
    } catch (error) {
        console.error('比较压缩率失败:', error);
        return null;
    }
}

// ==================== 导出工具函数 ====================
window.Utils = {
    isIOS,
    handleIOS,
    escapeHtml,
    formatFileSize,
    showMessage,
    buildImagePath,
    isCodeFile,
    isImageFile,
    isImageFileEnhanced,
    countCodeSegments,
    getFileIcon,
    isValidDataStructure,
    isValidImageData,
    debounce,
    throttle,
    createStarAnimation,
    generateId,
    formatDate,
    deepClone,
    validateFileType,
    readFileAsDataURL,
    readFileAsText,
    isLocalStorageAvailable,
    getFileTypeColor,
    findFileByName,
    // 新增的差异对比方法
    calculateTextDiff,
    generateFullContentDiff,
    getContentHash,
    isContentExactlySame,
    // 图片处理相关
    compressImage,
    getImageInfo,
    generateThumbnail,
    parseDataUrl,
    getSafeFileName,
    calculateTotalSize,
    // 浏览器相关
    checkBrowserSupport,
    getBrowserInfo,
    // 通用工具
    delay,
    getRandomColor,
    // 新增的Base85编码功能
    encodeBase85,
    decodeBase85,
    compressImageToBase85,
    restoreImageFromBase85,
    compareCompression
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes starFall {
        0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translate(var(--tx, 0), var(--ty, 50px)) scale(0) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    @keyframes shimmer {
        0% {
            background-position: -200px 0;
        }
        100% {
            background-position: 200px 0;
        }
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }
    
    /* 新增的存储空间警告动画 */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .storage-warning-modal {
        animation: fadeInUp 0.3s ease;
    }
    
    /* Base85压缩状态指示器 */
    .base85-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        margin-left: 6px;
    }
    
    .base85-badge i {
        font-size: 10px;
    }
    
    /* 导入状态动画 */
    .import-success-animation {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: var(--shadow);
    }
    
    .import-error-animation {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--warning-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: var(--shadow);
    }
    
    .fade-out {
        animation: fadeOut 0.3s ease forwards;
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// 添加全局错误处理器
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    if (window.Utils && window.Utils.showMessage) {
        window.Utils.showMessage(`系统错误: ${e.message}`, 'error');
    }
}, false);

// 添加未处理的Promise拒绝处理器
window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    if (window.Utils && window.Utils.showMessage) {
        window.Utils.showMessage(`操作失败: ${e.reason?.message || e.reason}`, 'error');
    }
}, false);

console.log('工具函数库已加载完成！');