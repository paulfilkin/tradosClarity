// tradosClarity Popup Manager
// Handles extension popup interface and quick actions

class PopupManager {
  constructor() {
    this.shortcuts = this.getDefaultShortcuts();
    this.init();
  }

  getDefaultShortcuts() {
    return {
      focusActionButton: { key: 'a', alt: true, shift: true, ctrl: false },
      restartTours: { key: 'r', alt: true, shift: true, ctrl: false }
    };
  }

  async init() {
    await this.loadShortcuts();
    this.updateShortcutDisplay();
    await this.updatePageStatus();
    this.setupEventListeners();
  }

  async loadShortcuts() {
    try {
      const result = await chrome.storage.sync.get('tradosShortcuts');
      this.shortcuts = result.tradosShortcuts || this.getDefaultShortcuts();
    } catch (error) {
      console.error('Error loading shortcuts:', error);
    }
  }

  updateShortcutDisplay() {
    const elements = {
      'focus-shortcut': this.shortcuts.focusActionButton,
      'restart-shortcut': this.shortcuts.restartTours
    };

    Object.entries(elements).forEach(([id, shortcut]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = this.formatShortcut(shortcut);
      }
    });
  }

  formatShortcut(shortcut) {
    if (!shortcut || !shortcut.key) return 'Not set';

    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());

    return parts.join('+');
  }

  async updatePageStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const statusEl = document.getElementById('extension-status');
      
      if (this.isTradosPage(tab.url)) {
        this.setActiveStatus(statusEl);
      } else {
        this.setInactiveStatus(statusEl);
      }
    } catch (error) {
      console.error('Error checking page status:', error);
    }
  }

  isTradosPage(url) {
    return url && (url.includes('trados.com') || url.includes('localhost'));
  }

  setActiveStatus(statusEl) {
    if (!statusEl) return;
    statusEl.classList.remove('inactive');
    statusEl.querySelector('h3').textContent = 'Extension Active';
    statusEl.querySelector('p').textContent = 'Enhancing accessibility on this page';
  }

  setInactiveStatus(statusEl) {
    if (!statusEl) return;
    statusEl.classList.add('inactive');
    statusEl.querySelector('h3').textContent = 'Not on Trados Page';
    statusEl.querySelector('p').textContent = 'Navigate to Trados Cloud to use features';
  }

  setupEventListeners() {
    const actions = {
      'focus-action-btn': 'focusActionButton',
      'restart-tours-btn': 'restartTours'
    };

    Object.entries(actions).forEach(([buttonId, action]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => this.executeAction(action));
      }
    });

    const settingsButton = document.getElementById('open-settings');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
      });
    }
  }

  async executeAction(action) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isTradosPage(tab.url)) {
        this.showMessage('Please navigate to a Trados Cloud page first', 'warning');
        return;
      }
      
      await chrome.tabs.sendMessage(tab.id, {
        type: 'executeAction',
        action: action
      });
      
      this.showMessage('Action executed', 'success');
      setTimeout(() => window.close(), 500);
      
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      this.showMessage('Action failed - content script may not be loaded', 'error');
    }
  }

  showMessage(text, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      text-align: center;
      ${this.getMessageStyles(type)}
    `;
    
    messageEl.textContent = text;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 2000);
  }

  getMessageStyles(type) {
    const styles = {
      success: 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;',
      error: 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;',
      warning: 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;'
    };
    return styles[type] || styles.success;
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupManager());
} else {
  new PopupManager();
}
