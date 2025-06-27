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
      restartTours: { key: 'r', alt: true, shift: true, ctrl: false },
      quickNavigation: { key: 'n', alt: true, shift: true, ctrl: false },
      navigateToMain: { key: 'm', alt: true, shift: true, ctrl: false },
      navigateToSub: { key: 's', alt: true, shift: true, ctrl: false },
      navigateToTable: { key: 't', alt: true, shift: true, ctrl: false }
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
      'restart-shortcut': this.shortcuts.restartTours,
      'nav-shortcut': this.shortcuts.quickNavigation,
      'main-shortcut': this.shortcuts.navigateToMain,
      'sub-shortcut': this.shortcuts.navigateToSub,
      'table-shortcut': this.shortcuts.navigateToTable
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
        await this.checkLandmarkAvailability(tab.id);
      } else {
        this.setInactiveStatus(statusEl);
        this.disableNavigationButtons();
      }
    } catch (error) {
      console.error('Error checking page status:', error);
    }
  }

  async checkLandmarkAvailability(tabId) {
    try {
      // Get available landmarks from the content script
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'getLandmarks'
      });
      
      if (response && response.landmarks) {
        this.updateNavigationButtonStates(response.landmarks);
      }
    } catch (error) {
      // Content script might not be loaded yet, that's okay
      console.log('Could not get landmark info:', error.message);
    }
  }

  updateNavigationButtonStates(landmarks) {
    const buttonMappings = {
      'nav-main-btn': 'mainMenu',
      'nav-sub-btn': 'subMenu', 
      'nav-table-btn': 'contentArea'
    };

    Object.entries(buttonMappings).forEach(([buttonId, landmarkKey]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        const landmark = landmarks.find(l => l.key === landmarkKey);
        if (landmark && !landmark.available) {
          button.style.opacity = '0.6';
          button.style.cursor = 'not-allowed';
          button.title = `${landmark.label} not available on this page`;
        } else {
          button.style.opacity = '1';
          button.style.cursor = 'pointer';
          button.title = '';
        }
      }
    });
  }

  disableNavigationButtons() {
    const navButtons = [
      'quick-nav-btn', 'nav-main-btn', 
      'nav-sub-btn', 'nav-table-btn'
    ];
    
    navButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        button.title = 'Navigate to a Trados Cloud page to use navigation features';
      }
    });
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
    // Navigation actions
    const navigationActions = {
      'quick-nav-btn': 'quickNavigation',
      'nav-main-btn': 'navigateToMain',
      'nav-sub-btn': 'navigateToSub', 
      'nav-table-btn': 'navigateToTable'
    };

    Object.entries(navigationActions).forEach(([buttonId, action]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => this.executeAction(action));
      }
    });

    // Traditional actions
    const traditionalActions = {
      'focus-action-btn': 'focusActionButton',
      'restart-tours-btn': 'restartTours'
    };

    Object.entries(traditionalActions).forEach(([buttonId, action]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => this.executeAction(action));
      }
    });

    // Settings button
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
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'executeAction',
        action: action
      });
      
      if (response && response.success) {
        this.showMessage(this.getSuccessMessage(action), 'success');
        
        // Close popup after a brief delay for navigation actions
        if (action.startsWith('navigate') || action === 'quickNavigation') {
          setTimeout(() => window.close(), 300);
        } else {
          setTimeout(() => window.close(), 500);
        }
      } else {
        this.showMessage('Action failed - please try again', 'error');
      }
      
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      this.showMessage('Action failed - content script may not be loaded', 'error');
    }
  }

  getSuccessMessage(action) {
    const messages = {
      'quickNavigation': 'Navigation dialog opened',
      'navigateToMain': 'Navigated to main menu',
      'navigateToSub': 'Navigated to section tabs',
      'navigateToTable': 'Navigated to content table',
      'focusActionButton': 'Action button focused',
      'restartTours': 'Tours restarted'
    };
    
    return messages[action] || 'Action executed';
  }

  showMessage(text, type = 'info') {
    // Create a more prominent message element
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      left: 10px !important;
      right: 10px !important;
      padding: 12px 16px !important;
      border-radius: 6px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      z-index: 10000 !important;
      text-align: center !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      animation: slideDown 0.3s ease !important;
      ${this.getMessageStyles(type)}
    `;
    
    // Add slide down animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    messageEl.textContent = text;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
          }
        }, 300);
      }
    }, 2000);
    
    // Add slide up animation
    style.textContent += `
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }
    `;
  }

  getMessageStyles(type) {
    const styles = {
      success: 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;',
      error: 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;',
      warning: 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;',
      info: 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;'
    };
    return styles[type] || styles.info;
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupManager());
} else {
  new PopupManager();
}
