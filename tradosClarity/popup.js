// tradosClarity Popup JavaScript

class PopupManager {
  constructor() {
    this.shortcuts = {};
    this.liveRegion = null; // NEW: For announcements
    this.init();
  }

  async init() {
    console.log('PopupManager: Initializing...');
    
    // ENHANCED: Setup live region first
    this.setupLiveRegion();
    
    // Load shortcuts and update display
    await this.loadShortcuts();
    this.updateShortcutDisplay();
    
    // Check if we're on a Trados page
    await this.checkPageStatus();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // ENHANCED: Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // ENHANCED: Announce popup ready
    setTimeout(() => {
      this.announce('tradosClarity popup opened. Use Tab to navigate options.');
    }, 300);
  }

  // NEW: Setup live region for announcements
  setupLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.id = 'popup-live-region';
    this.liveRegion.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
    `;
    document.body.appendChild(this.liveRegion);
  }

  // NEW: Announcement method
  announce(message, delay = 0) {
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
        setTimeout(() => {
          this.liveRegion.textContent = message;
          console.log('PopupManager: Announced:', message);
        }, 50);
      }
    }, delay);
  }

  // ENHANCED: Your existing checkPageStatus with better announcements
  async checkPageStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const statusEl = document.getElementById('extension-status');
      
      if (tab.url.includes('trados.com') || tab.url.includes('localhost')) {
        statusEl.classList.remove('inactive');
        statusEl.querySelector('h3').textContent = 'Extension Active';
        statusEl.querySelector('p').textContent = 'Enhancing accessibility on this page';
        
        // ENHANCED: Announce active status
        this.announce('Extension is active on this Trados Cloud page. All features are available.');
        
      } else {
        statusEl.classList.add('inactive');
        statusEl.querySelector('h3').textContent = 'Not on Trados Page';
        statusEl.querySelector('p').textContent = 'Navigate to Trados Cloud to use features';
        
        // ENHANCED: Announce inactive status
        this.announce('Extension is not active. Please navigate to a Trados Cloud page to use accessibility features.');
      }
    } catch (error) {
      console.error('PopupManager: Error checking page status:', error);
      this.announce('Unable to determine page status.');
    }
  }

  // NEW: Enhanced keyboard navigation for popup
  setupKeyboardNavigation() {
    const focusableElements = document.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    
    // Add keyboard shortcuts for quick access
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case '1':
          if (e.altKey) {
            e.preventDefault();
            document.getElementById('focus-action-btn').focus();
            document.getElementById('focus-action-btn').click();
          }
          break;
          
        case '2':
          if (e.altKey) {
            e.preventDefault();
            document.getElementById('restart-tours-btn').focus();
            document.getElementById('restart-tours-btn').click();
          }
          break;
          
        case '3':
          if (e.altKey) {
            e.preventDefault();
            document.getElementById('open-settings').focus();
            document.getElementById('open-settings').click();
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          window.close();
          break;
      }
    });
    
    // Enhance button descriptions
    this.enhanceButtonAccessibility();
  }

  enhanceButtonAccessibility() {
    // Add more descriptive labels and keyboard hints
    const focusBtn = document.getElementById('focus-action-btn');
    const restartBtn = document.getElementById('restart-tours-btn');
    const settingsBtn = document.getElementById('open-settings');
    
    if (focusBtn) {
      focusBtn.setAttribute('aria-describedby', 'focus-btn-help');
      const helpSpan = document.createElement('span');
      helpSpan.id = 'focus-btn-help';
      helpSpan.className = 'sr-only';
      helpSpan.textContent = 'Quickly locate and focus important action buttons like Accept Task or Complete Task. Keyboard shortcut: Alt+1';
      focusBtn.appendChild(helpSpan);
    }
    
    if (restartBtn) {
      restartBtn.setAttribute('aria-describedby', 'restart-btn-help');
      const helpSpan = document.createElement('span');
      helpSpan.id = 'restart-btn-help';
      helpSpan.className = 'sr-only';
      helpSpan.textContent = 'Clear tour progress data to restart all product tours from the beginning. Keyboard shortcut: Alt+2';
      restartBtn.appendChild(helpSpan);
    }
    
    if (settingsBtn) {
      settingsBtn.setAttribute('aria-describedby', 'settings-btn-help');
      const helpSpan = document.createElement('span');
      helpSpan.id = 'settings-btn-help';
      helpSpan.className = 'sr-only';
      helpSpan.textContent = 'Open full settings page to customize keyboard shortcuts and view help documentation. Keyboard shortcut: Alt+3';
      settingsBtn.appendChild(helpSpan);
    }
  }

  // ENHANCED: Your existing executeAction with better feedback
  async executeAction(action) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('trados.com') && !tab.url.includes('localhost')) {
        const message = 'Please navigate to a Trados Cloud page first';
        this.showMessage(message, 'warning');
        this.announce(message);
        return;
      }
      
      // ENHANCED: Announce action start
      const actionNames = {
        focusActionButton: 'focusing important action button',
        restartTours: 'restarting product tours'
      };
      
      this.announce(`Executing action: ${actionNames[action]}`);
      
      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'executeAction',
        action: action
      });
      
      // ENHANCED: Better success feedback
      const successMessage = `${actionNames[action]} executed successfully`;
      this.showMessage(successMessage, 'success');
      this.announce(successMessage);
      
      // Close popup after a longer delay for screen reader users
      setTimeout(() => window.close(), 1000);
      
    } catch (error) {
      console.error(`PopupManager: Error executing ${action}:`, error);
      
      // ENHANCED: Better error handling
      let errorMessage = 'Action failed';
      
      if (error.message && error.message.includes('Receiving end does not exist')) {
        errorMessage = 'Content script not loaded. Try refreshing the Trados page first.';
      } else if (error.message) {
        errorMessage = `Action failed: ${error.message}`;
      }
      
      this.showMessage(errorMessage, 'error');
      this.announce(errorMessage);
    }
  }

  // ENHANCED: Your existing showMessage with better accessibility
  showMessage(text, type = 'info') {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.setAttribute('role', 'status'); // ENHANCED: Add role for screen readers
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
      word-wrap: break-word; /* ENHANCED: Handle long messages */
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
    
    // ENHANCED: Also announce the message
    this.announce(text);
    
    // Remove after 3 seconds (longer for screen reader users)
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  // ENHANCED: Better shortcut display with status information
  updateShortcutDisplay() {
    const focusShortcutEl = document.getElementById('focus-shortcut');
    const restartShortcutEl = document.getElementById('restart-shortcut');
    
    if (focusShortcutEl) {
      const shortcutText = this.formatShortcut(this.shortcuts.focusActionButton);
      focusShortcutEl.textContent = shortcutText;
      focusShortcutEl.setAttribute('aria-label', `Current shortcut: ${shortcutText}`);
    }
    
    if (restartShortcutEl) {
      const shortcutText = this.formatShortcut(this.shortcuts.restartTours);
      restartShortcutEl.textContent = shortcutText;
      restartShortcutEl.setAttribute('aria-label', `Current shortcut: ${shortcutText}`);
    }
  }

  // NEW: Enhanced status reporting
  async getDetailedStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const status = {
        isActive: tab.url.includes('trados.com') || tab.url.includes('localhost'),
        currentUrl: tab.url,
        shortcutsLoaded: Object.keys(this.shortcuts).length > 0,
        extensionVersion: chrome.runtime.getManifest().version
      };
      
      return status;
    } catch (error) {
      console.error('PopupManager: Error getting detailed status:', error);
      return {
        isActive: false,
        error: error.message
      };
    }
  }

  // NEW: Diagnostic information for troubleshooting
  async showDiagnosticInfo() {
    const status = await this.getDetailedStatus();
    
    let diagnostic = `tradosClarity Diagnostic Information:
    
Extension Version: ${status.extensionVersion || 'Unknown'}
Active on Page: ${status.isActive ? 'Yes' : 'No'}
Current URL: ${status.currentUrl || 'Unknown'}
Shortcuts Loaded: ${status.shortcutsLoaded ? 'Yes' : 'No'}
Total Shortcuts: ${Object.keys(this.shortcuts).length}

Loaded Shortcuts:`;

    Object.entries(this.shortcuts).forEach(([action, shortcut]) => {
      diagnostic += `\n- ${action}: ${this.formatShortcut(shortcut)}`;
    });
    
    if (status.error) {
      diagnostic += `\n\nError: ${status.error}`;
    }
    
    // Copy to clipboard for easy sharing
    try {
      await navigator.clipboard.writeText(diagnostic);
      this.announce('Diagnostic information copied to clipboard');
    } catch (error) {
      console.log('Could not copy to clipboard:', error);
    }
    
    console.log(diagnostic);
    alert(diagnostic);
  }

  // ENHANCED: Your existing setupEventListeners with better error handling
  setupEventListeners() {
    // Focus action button
    const focusBtn = document.getElementById('focus-action-btn');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        this.executeAction('focusActionButton');
      });
    }
    
    // Restart tours
    const restartBtn = document.getElementById('restart-tours-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.executeAction('restartTours');
      });
    }
    
    // Open settings
    const settingsBtn = document.getElementById('open-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
      });
    }
    
    // NEW: Add diagnostic shortcut (Ctrl+Shift+D)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.showDiagnosticInfo();
      }
    });
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