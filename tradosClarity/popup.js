// tradosClarity Popup JavaScript

class PopupManager {
  constructor() {
    this.shortcuts = {};
    this.init();
  }

  async init() {
    console.log('PopupManager: Initializing...');
    
    // Load shortcuts and update display
    await this.loadShortcuts();
    this.updateShortcutDisplay();
    
    // Check if we're on a Trados page
    await this.checkPageStatus();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  async loadShortcuts() {
    try {
      const result = await chrome.storage.sync.get('tradosShortcuts');
      this.shortcuts = result.tradosShortcuts || {
        focusActionButton: { key: 'a', alt: true, shift: true, ctrl: false },
        restartTours: { key: 'r', alt: true, shift: true, ctrl: false }
      };
      console.log('PopupManager: Loaded shortcuts:', this.shortcuts);
    } catch (error) {
      console.error('PopupManager: Error loading shortcuts:', error);
    }
  }

  updateShortcutDisplay() {
    const focusShortcutEl = document.getElementById('focus-shortcut');
    const restartShortcutEl = document.getElementById('restart-shortcut');
    
    if (focusShortcutEl) {
      focusShortcutEl.textContent = this.formatShortcut(this.shortcuts.focusActionButton);
    }
    
    if (restartShortcutEl) {
      restartShortcutEl.textContent = this.formatShortcut(this.shortcuts.restartTours);
    }
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

  async checkPageStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const statusEl = document.getElementById('extension-status');
      
      if (tab.url.includes('trados.com') || tab.url.includes('localhost')) {
        statusEl.classList.remove('inactive');
        statusEl.querySelector('h3').textContent = 'Extension Active';
        statusEl.querySelector('p').textContent = 'Enhancing accessibility on this page';
      } else {
        statusEl.classList.add('inactive');
        statusEl.querySelector('h3').textContent = 'Not on Trados Page';
        statusEl.querySelector('p').textContent = 'Navigate to Trados Cloud to use features';
      }
    } catch (error) {
      console.error('PopupManager: Error checking page status:', error);
    }
  }

  setupEventListeners() {
    // Focus action button
    document.getElementById('focus-action-btn').addEventListener('click', () => {
      this.executeAction('focusActionButton');
    });
    
    // Restart tours
    document.getElementById('restart-tours-btn').addEventListener('click', () => {
      this.executeAction('restartTours');
    });
    
    // Open settings
    document.getElementById('open-settings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });
  }

  async executeAction(action) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('trados.com') && !tab.url.includes('localhost')) {
        this.showMessage('Please navigate to a Trados Cloud page first', 'warning');
        return;
      }
      
      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'executeAction',
        action: action
      });
      
      // Show success message and close popup
      this.showMessage('Action executed', 'success');
      setTimeout(() => window.close(), 500);
      
    } catch (error) {
      console.error(`PopupManager: Error executing ${action}:`, error);
      this.showMessage('Action failed - content script may not be loaded', 'error');
    }
  }

  showMessage(text, type = 'info') {
    // Create temporary message element
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
    `;
    
    const colors = {
      success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
      error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
      warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' }
    };
    
    const colorScheme = colors[type] || colors.success;
    messageEl.style.backgroundColor = colorScheme.bg;
    messageEl.style.color = colorScheme.color;
    messageEl.style.border = `1px solid ${colorScheme.border}`;
    
    messageEl.textContent = text;
    document.body.appendChild(messageEl);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 2000);
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
  });
} else {
  new PopupManager();
}