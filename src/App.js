// src/App.js
import React, { useEffect, useState } from 'react';
import './css/style.css'; // 正确：src/内的相对路径

// 导入原有JS模块（改为ES6模块导入，替代动态脚本加载）
import './js/utils.js';
import './js/theme.js';
import './js/navigation.js';
import './js/console.js';
import './js/file-manager.js';
import './js/drag-drop.js';
import './js/announcement.js';
import './js/main.js';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  // 组件挂载后初始化应用
  useEffect(() => {
    // 等待所有模块加载完成
    const initApp = () => {
      try {
        // 初始化全局管理器（适配原有逻辑）
        window.themeManager = new window.ThemeManager();
        window.navigationManager = new window.NavigationManager();
        window.consoleSystem = new window.ConsoleSystem();
        window.fileManager = new window.FileManager();
        window.app = new window.FileManagerApp();
        
        setIsLoaded(true);
      } catch (error) {
        console.error('应用初始化失败:', error);
        setIsLoaded(true); // 即使失败也显示页面
      }
    };

    // 延迟初始化，确保DOM加载完成
    setTimeout(initApp, 500);

    // 清理函数
    return () => {
      window.themeManager = null;
      window.navigationManager = null;
      window.consoleSystem = null;
      window.fileManager = null;
      window.app = null;
    };
  }, []);

  return (
    <div className="App">
      {/* 加载状态 */}
      {!isLoaded ? (
        <div className="empty-state">
          <i className="ti ti-loader-circle"></i>
          <h3>应用加载中</h3>
          <p>请稍候，正在初始化文件管理系统...</p>
        </div>
      ) : (
        // 应用主结构（与原有HTML一致）
        <div className="main-container">
          <nav className="sidebar">
            <div className="logo">
              <i className="ti ti-file-code"></i>
              <span>文件管理器</span>
            </div>
            <ul className="nav-links">
              <li><a href="#" className="nav-link active" data-page="dashboard"><i className="ti ti-home"></i><span>仪表盘</span></a></li>
              <li><a href="#" className="nav-link" data-page="items"><i className="ti ti-box"></i><span>道具</span></a></li>
              <li><a href="#" className="nav-link" data-page="skills"><i className="ti ti-bolt"></i><span>技能</span></a></li>
              <li><a href="#" className="nav-link" data-page="characters"><i className="ti ti-user"></i><span>人物</span></a></li>
              <li><a href="#" className="nav-link" data-page="talents"><i className="ti ti-star"></i><span>天赋</span></a></li>
              <li><a href="#" className="nav-link" data-page="others"><i className="ti ti-ellipsis-h"></i><span>其他</span></a></li>
              <li><a href="#" className="nav-link" data-page="images"><i className="ti ti-image"></i><span>万相集</span></a></li>
              <li><a href="#" className="nav-link" data-page="more"><i className="ti ti-settings"></i><span>更多</span></a></li>
            </ul>
          </nav>

          <main className="main-content">
            <header className="page-header">
              <h1 id="pageTitle">仪表盘</h1>
              <p id="pageDescription">管理您的资源文件，导入并查看内容</p>
            </header>

            <section id="announcementSection" className="announcement-section">
              <div className="announcement-card">
                <h2 id="sectionTitle">资源文件</h2>
              </div>
            </section>

            <section id="importSection" className="import-section">
              <div className="import-card">
                <div className="drag-drop-area" id="dragDropArea">
                  <i className="ti ti-cloud-upload"></i>
                  <h3>拖拽文件到此处导入</h3>
                  <p>支持文本文件和图片</p>
                  <button id="importBtn" className="btn primary">选择文件</button>
                  <input type="file" id="fileInput" multiple hidden />
                </div>
                <div id="dragDropFileList" className="file-list"></div>
              </div>
            </section>

            <section id="gridSection" className="grid-section">
              <div className="category-selector">
                <div className="category-options">
                  <button className="category-option active" data-category="items">道具</button>
                  <button className="category-option" data-category="skills">技能</button>
                  <button className="category-option" data-category="characters">人物</button>
                  <button className="category-option" data-category="talents">天赋</button>
                  <button className="category-option" data-category="others">其他</button>
                </div>
              </div>
              <div className="files-grid" id="filesGrid"></div>
            </section>

            <section id="moreSection" className="more-section" style={{ display: 'none' }}>
              <div className="settings-vertical">
                <div className="settings-card">
                  <h3 className="section-title">主题设置</h3>
                  <div className="theme-options">
                    <button className="theme-option active" data-theme="light">浅色主题</button>
                    <button className="theme-option" data-theme="dark">深色主题</button>
                  </div>
                </div>
                <div className="settings-card">
                  <h3 className="section-title">控制台</h3>
                  <div className="console-container">
                    <div id="consoleOutput" className="console-output">
                      // 文件资源管理系统控制台 v2.0
                      // 输入 "help" 查看可用命令
                    </div>
                    <div className="console-input-group">
                      <input type="text" id="consoleInput" placeholder="输入命令..." className="console-input" />
                      <button id="executeCommand" className="btn primary">执行</button>
                      <button id="resetConsole" className="btn secondary">清空</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      )}

      {/* 文件弹窗 */}
      <div id="fileModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="modalTitle">文件内容</h2>
            <button id="closeModal" className="close-btn">&times;</button>
          </div>
          <div id="modalBody" className="modal-body"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
