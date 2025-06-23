// tradosClarity Settings Page JavaScript

class SettingsManager {
  constructor() {
    this.currentlyRecording = null;
    this.recordedKeys = [];
    
    // Default shortcuts
    this.defaultShortcuts = {
      focusActionButton: { key: 'a', alt: true, shift: true, ctrl: false },
      restartTours: { key: 'r', alt: true, shift: true, ctrl: false }
    };
    
    this.init();
  }

  async init() {
    console.log('SettingsManager: Initializing...');
    
    // Load saved shortcuts
    await this.loadShortcuts();
    
    // Set up tab navigation
    this.setupTabs();
    
    // Set up shortcut recording
    this.setupShortcutRecording();
    
    // Set up action buttons
    this.setupActionButtons();
    
    // Update last updated time
    this.updateLastModified();
    
    // Display current shortcuts
    this.displayShortcuts();
    
    console.log('SettingsManager: Initialization complete');
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetPanel = button.getAttribute('aria-controls');
        
        // Update button states
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        
        // Update panel states
        tabPanels.forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(targetPanel).classList.add('active');
        
        console.log(`SettingsManager: Switched to ${targetPanel} tab`);
      });
      
      // Keyboard navigation for tabs
      button.addEventListener('keydown', (e) => {
        const currentIndex = Array.from(tabButtons).indexOf(button);
        let nextIndex;
        
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
            tabButtons[nextIndex].focus();
            tabButtons[nextIndex].click();
            break;
            
          case 'ArrowRight':
            e.preventDefault();
            nextIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
            tabButtons[nextIndex].focus();
            tabButtons[nextIndex].click();
            break;
            
          case 'Home':
            e.preventDefault();
            tabButtons[0].focus();
            tabButtons[0].click();
            break;
            
          case 'End':
            e.preventDefault();
            tabButtons[tabButtons.length - 1].focus();
            tabButtons[tabButtons.length - 1].click();
            break;
        }
      });
    });
  }

  async loadShortcuts() {
    try {
      const result = await chrome.storage.sync.get('tradosShortcuts');
      this.shortcuts = result.tradosShortcuts || { ...this.defaultShortcuts };
      console.log('SettingsManager: Loaded shortcuts:', this.shortcuts);
    } catch (error) {
      console.error('SettingsManager: Error loading shortcuts:', error);
      this.shortcuts = { ...this.defaultShortcuts };
    }
  }

  async saveShortcuts() {
    try {
      await chrome.storage.sync.set({ tradosShortcuts: this.shortcuts });
      console.log('SettingsManager: Shortcuts saved:', this.shortcuts);
      
      // Show success message
      this.showMessage('Shortcuts saved successfully!', 'success');
      
      // Notify content scripts of the change
      this.notifyContentScripts();
      
    } catch (error) {
      console.error('SettingsManager: Error saving shortcuts:', error);
      this.showMessage('Error saving shortcuts. Please try again.', 'error');
    }
  }

  async notifyContentScripts() {
    try {
      // Get all tabs with Trados URLs
      const tabs = await chrome.tabs.query({ url: ['*://*.trados.com/*', '*://localhost:*/*'] });
      
      // Send updated shortcuts to each tab
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'shortcutsUpdated',
            shortcuts: this.shortcuts
          });
        } catch (e) {
          // Tab might not have content script loaded, that's okay
          console.log(`SettingsManager: Could not notify tab ${tab.id}`);
        }
      }
    } catch (error) {
      console.error('SettingsManager: Error notifying content scripts:', error);
    }
  }

  displayShortcuts() {
    // Update shortcut displays in main settings
    Object.keys(this.shortcuts).forEach(action => {
      const shortcut = this.shortcuts[action];
      const button = document.querySelector(`[data-action="${action}"] .shortcut-display`);
      if (button) {
        button.textContent = this.formatShortcut(shortcut);
      }
    });
    
    // Update shortcut displays in help section
    const helpFocusEl = document.getElementById('help-focus-shortcut');
    const helpRestartEl = document.getElementById('help-restart-shortcut');
    
    if (helpFocusEl) {
      helpFocusEl.textContent = this.formatShortcut(this.shortcuts.focusActionButton);
    }
    
    if (helpRestartEl) {
      helpRestartEl.textContent = this.formatShortcut(this.shortcuts.restartTours);
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

  setupShortcutRecording() {
    const shortcutButtons = document.querySelectorAll('.shortcut-button[data-action]');
    const resetButtons = document.querySelectorAll('.reset-button[data-action]');
    const modal = document.getElementById('recording-modal');
    const cancelButton = document.getElementById('cancel-recording');
    const clearButton = document.getElementById('clear-shortcut');
    
    // Setup shortcut button clicks
    shortcutButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        this.startRecording(action);
      });
    });
    
    // Setup reset button clicks
    resetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        this.resetShortcut(action);
      });
    });
    
    // Setup modal buttons
    cancelButton.addEventListener('click', () => {
      this.cancelRecording();
    });
    
    clearButton.addEventListener('click', () => {
      this.clearShortcut();
    });
    
    // Setup global keydown listener for recording
    document.addEventListener('keydown', (e) => {
      if (this.currentlyRecording) {
        this.handleRecordingKeydown(e);
      }
    });
    
    // Close modal on escape or outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.cancelRecording();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentlyRecording) {
        this.cancelRecording();
      }
    });
  }

  startRecording(action) {
    console.log(`SettingsManager: Starting recording for ${action}`);
    
    this.currentlyRecording = action;
    this.recordedKeys = [];
    
    const modal = document.getElementById('recording-modal');
    const instruction = document.getElementById('recording-instruction');
    const display = document.getElementById('recording-display');
    
    // Update modal content
    const actionNames = {
      focusActionButton: 'Focus Important Action Button',
      restartTours: 'Restart Product Tours'
    };
    
    instruction.textContent = `Press the key combination you want to use for "${actionNames[action]}".`;
    display.textContent = 'Waiting for key combination...';
    
    // Show modal
    modal.setAttribute('aria-hidden', 'false');
    modal.focus();
    
    // Update button state
    const button = document.querySelector(`[data-action="${action}"]`);
    button.classList.add('recording');
  }

  handleRecordingKeydown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Ignore certain keys
    const ignoredKeys = ['Tab', 'CapsLock', 'NumLock', 'ScrollLock', 'Meta', 'ContextMenu'];
    if (ignoredKeys.includes(e.key)) {
      return;
    }
    
    // Special handling for modifier-only presses
    if (['Control', 'Alt', 'Shift'].includes(e.key)) {
      this.updateRecordingDisplay(e);
      return;
    }
    
    // Valid key combination
    const shortcut = {
      key: e.key.toLowerCase(),
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey
    };
    
    // Check for conflicts
    const conflict = this.checkShortcutConflict(shortcut, this.currentlyRecording);
    if (conflict) {
      this.showConflictWarning(conflict);
      return;
    }
    
    // Save the shortcut
    this.shortcuts[this.currentlyRecording] = shortcut;
    
    console.log(`SettingsManager: Recorded shortcut for ${this.currentlyRecording}:`, shortcut);
    
    // Update display and finish recording
    this.finishRecording();
  }

  updateRecordingDisplay(e) {
    const display = document.getElementById('recording-display');
    const parts = [];
    
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    
    if (parts.length > 0) {
      display.textContent = parts.join('+') + '+...';
    } else {
      display.textContent = 'Waiting for key combination...';
    }
  }

  checkShortcutConflict(shortcut, currentAction) {
    for (const [action, existingShortcut] of Object.entries(this.shortcuts)) {
      if (action === currentAction) continue;
      
      if (this.shortcutsEqual(shortcut, existingShortcut)) {
        return action;
      }
    }
    return null;
  }

  shortcutsEqual(a, b) {
    return a.key === b.key && 
           a.ctrl === b.ctrl && 
           a.alt === b.alt && 
           a.shift === b.shift;
  }

  showConflictWarning(conflictingAction) {
    const display = document.getElementById('recording-display');
    const actionNames = {
      focusActionButton: 'Focus Important Action Button',
      restartTours: 'Restart Product Tours'
    };
    
    display.textContent = `Conflict with "${actionNames[conflictingAction]}". Try a different combination.`;
    display.style.color = '#dc3545';
    
    setTimeout(() => {
      display.textContent = 'Waiting for key combination...';
      display.style.color = '';
    }, 2000);
  }

  finishRecording() {
    const display = document.getElementById('recording-display');
    display.textContent = this.formatShortcut(this.shortcuts[this.currentlyRecording]);
    display.style.color = '#28a745';
    
    setTimeout(() => {
      this.cancelRecording();
      this.displayShortcuts();
    }, 1000);
  }

  cancelRecording() {
    console.log('SettingsManager: Cancelling recording');
    
    const modal = document.getElementById('recording-modal');
    modal.setAttribute('aria-hidden', 'true');
    
    // Remove recording state from button
    if (this.currentlyRecording) {
      const button = document.querySelector(`[data-action="${this.currentlyRecording}"]`);
      button.classList.remove('recording');
      button.focus(); // Return focus to the button
    }
    
    this.currentlyRecording = null;
    this.recordedKeys = [];
  }

  clearShortcut() {
    if (!this.currentlyRecording) return;
    
    console.log(`SettingsManager: Clearing shortcut for ${this.currentlyRecording}`);
    
    // Remove the shortcut
    delete this.shortcuts[this.currentlyRecording];
    
    this.cancelRecording();
    this.displayShortcuts();
  }

  resetShortcut(action) {
    console.log(`SettingsManager: Resetting shortcut for ${action}`);
    
    this.shortcuts[action] = { ...this.defaultShortcuts[action] };
    this.displayShortcuts();
  }

  setupActionButtons() {
    const saveButton = document.getElementById('save-shortcuts');
    const resetAllButton = document.getElementById('reset-all-shortcuts');
    
    saveButton.addEventListener('click', () => {
      this.saveShortcuts();
    });
    
    resetAllButton.addEventListener('click', () => {
      this.resetAllShortcuts();
    });
  }

  resetAllShortcuts() {
    console.log('SettingsManager: Resetting all shortcuts to defaults');
    
    if (confirm('Are you sure you want to reset all shortcuts to their default values?')) {
      this.shortcuts = { ...this.defaultShortcuts };
      this.displayShortcuts();
      this.showMessage('All shortcuts reset to defaults', 'success');
    }
  }

  showMessage(text, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('settings-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'settings-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(100%);
      `;
      document.body.appendChild(messageEl);
    }
    
    // Set message content and style
    messageEl.textContent = text;
    messageEl.className = `message-${type}`;
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8'
    };
    
    messageEl.style.backgroundColor = colors[type] || colors.info;
    
    // Show message
    requestAnimationFrame(() => {
      messageEl.style.opacity = '1';
      messageEl.style.transform = 'translateX(0)';
    });
    
    // Hide message after 3 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(100%)';
    }, 3000);
  }

  updateLastModified() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = new Date().toLocaleDateString();
    }
  }
}

// Initialize settings when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
  });
} else {
  new SettingsManager();
}