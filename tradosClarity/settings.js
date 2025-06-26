// tradosClarity Settings Manager
// Handles user preferences and keyboard shortcut configuration

class SettingsManager {
  constructor() {
    this.shortcuts = this.getDefaultShortcuts();
    this.currentlyRecording = null;
    this.ui = new SettingsUI();
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
    this.ui.init();
    this.ui.updateShortcutDisplay(this.shortcuts);
    this.setupEventHandlers();
    this.updateLastModified();
  }

  async loadShortcuts() {
    try {
      const result = await chrome.storage.sync.get('tradosShortcuts');
      this.shortcuts = result.tradosShortcuts || this.getDefaultShortcuts();
    } catch (error) {
      console.error('Error loading shortcuts:', error);
      this.shortcuts = this.getDefaultShortcuts();
    }
  }

  async saveShortcuts() {
    try {
      await chrome.storage.sync.set({ tradosShortcuts: this.shortcuts });
      this.ui.showMessage('Shortcuts saved successfully!', 'success');
      await this.notifyContentScripts();
    } catch (error) {
      console.error('Error saving shortcuts:', error);
      this.ui.showMessage('Error saving shortcuts. Please try again.', 'error');
    }
  }

  async notifyContentScripts() {
    try {
      const tabs = await chrome.tabs.query({ url: ['*://*.trados.com/*', '*://localhost:*/*'] });
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'shortcutsUpdated',
            shortcuts: this.shortcuts
          });
        } catch (e) {
          // Tab might not have content script loaded
        }
      }
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }

  setupEventHandlers() {
    this.ui.onShortcutChange = (action) => this.startRecording(action);
    this.ui.onShortcutReset = (action) => this.resetShortcut(action);
    this.ui.onSave = () => this.saveShortcuts();
    this.ui.onResetAll = () => this.resetAllShortcuts();
    this.ui.onRecordingCancel = () => this.cancelRecording();
    this.ui.onRecordingClear = () => this.clearShortcut();

    document.addEventListener('keydown', (e) => {
      if (this.currentlyRecording) {
        this.handleRecordingKeydown(e);
      }
    });
  }

  startRecording(action) {
    this.currentlyRecording = action;
    this.ui.showRecordingModal(action);
    this.ui.setButtonRecordingState(action, true);
  }

  handleRecordingKeydown(e) {
    e.preventDefault();
    e.stopPropagation();

    const ignoredKeys = ['Tab', 'CapsLock', 'NumLock', 'ScrollLock', 'Meta', 'ContextMenu'];
    if (ignoredKeys.includes(e.key)) return;

    if (['Control', 'Alt', 'Shift'].includes(e.key)) {
      this.ui.updateRecordingDisplay(e);
      return;
    }

    const shortcut = {
      key: e.key.toLowerCase(),
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey
    };

    const conflict = this.checkShortcutConflict(shortcut, this.currentlyRecording);
    if (conflict) {
      this.ui.showConflictWarning(conflict);
      return;
    }

    this.shortcuts[this.currentlyRecording] = shortcut;
    this.finishRecording();
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

  finishRecording() {
    this.ui.showRecordingSuccess(this.shortcuts[this.currentlyRecording]);
    setTimeout(() => {
      this.cancelRecording();
      this.ui.updateShortcutDisplay(this.shortcuts);
    }, 1000);
  }

  cancelRecording() {
    if (this.currentlyRecording) {
      this.ui.setButtonRecordingState(this.currentlyRecording, false);
      this.ui.hideRecordingModal();
    }
    this.currentlyRecording = null;
  }

  clearShortcut() {
    if (this.currentlyRecording) {
      delete this.shortcuts[this.currentlyRecording];
      this.cancelRecording();
      this.ui.updateShortcutDisplay(this.shortcuts);
    }
  }

  resetShortcut(action) {
    this.shortcuts[action] = { ...this.getDefaultShortcuts()[action] };
    this.ui.updateShortcutDisplay(this.shortcuts);
  }

  resetAllShortcuts() {
    if (confirm('Are you sure you want to reset all shortcuts to their default values?')) {
      this.shortcuts = this.getDefaultShortcuts();
      this.ui.updateShortcutDisplay(this.shortcuts);
      this.ui.showMessage('All shortcuts reset to defaults', 'success');
    }
  }

  updateLastModified() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = new Date().toLocaleDateString();
    }
  }
}

// =============================================================================
// SETTINGS UI MANAGEMENT
// =============================================================================

class SettingsUI {
  constructor() {
    this.onShortcutChange = null;
    this.onShortcutReset = null;
    this.onSave = null;
    this.onResetAll = null;
    this.onRecordingCancel = null;
    this.onRecordingClear = null;
  }

  init() {
    this.setupTabs();
    this.setupButtons();
    this.setupModal();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetPanel = button.getAttribute('aria-controls');
        this.switchTab(button, targetPanel, tabButtons, tabPanels);
      });

      button.addEventListener('keydown', (e) => {
        this.handleTabKeydown(e, button, tabButtons);
      });
    });
  }

  switchTab(activeButton, targetPanel, allButtons, allPanels) {
    allButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-selected', 'true');

    allPanels.forEach(panel => panel.classList.remove('active'));
    document.getElementById(targetPanel).classList.add('active');
  }

  handleTabKeydown(e, button, allButtons) {
    const currentIndex = Array.from(allButtons).indexOf(button);
    let nextIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : allButtons.length - 1;
        allButtons[nextIndex].focus();
        allButtons[nextIndex].click();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < allButtons.length - 1 ? currentIndex + 1 : 0;
        allButtons[nextIndex].focus();
        allButtons[nextIndex].click();
        break;
      case 'Home':
        e.preventDefault();
        allButtons[0].focus();
        allButtons[0].click();
        break;
      case 'End':
        e.preventDefault();
        allButtons[allButtons.length - 1].focus();
        allButtons[allButtons.length - 1].click();
        break;
    }
  }

  setupButtons() {
    document.querySelectorAll('.shortcut-button[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        if (this.onShortcutChange) this.onShortcutChange(action);
      });
    });

    document.querySelectorAll('.reset-button[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        if (this.onShortcutReset) this.onShortcutReset(action);
      });
    });

    const saveButton = document.getElementById('save-shortcuts');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        if (this.onSave) this.onSave();
      });
    }

    const resetAllButton = document.getElementById('reset-all-shortcuts');
    if (resetAllButton) {
      resetAllButton.addEventListener('click', () => {
        if (this.onResetAll) this.onResetAll();
      });
    }
  }

  setupModal() {
    const modal = document.getElementById('recording-modal');
    const cancelButton = document.getElementById('cancel-recording');
    const clearButton = document.getElementById('clear-shortcut');

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (this.onRecordingCancel) this.onRecordingCancel();
      });
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (this.onRecordingClear) this.onRecordingClear();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal && this.onRecordingCancel) {
          this.onRecordingCancel();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
        if (this.onRecordingCancel) this.onRecordingCancel();
      }
    });
  }

  updateShortcutDisplay(shortcuts) {
    Object.keys(shortcuts).forEach(action => {
      const shortcut = shortcuts[action];
      const button = document.querySelector(`[data-action="${action}"] .shortcut-display`);
      if (button) {
        button.textContent = this.formatShortcut(shortcut);
      }
    });

    // Update help section displays
    const helpElements = {
      'help-focus-shortcut': shortcuts.focusActionButton,
      'help-restart-shortcut': shortcuts.restartTours
    };

    Object.entries(helpElements).forEach(([id, shortcut]) => {
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

  showRecordingModal(action) {
    const modal = document.getElementById('recording-modal');
    const instruction = document.getElementById('recording-instruction');
    const display = document.getElementById('recording-display');

    const actionNames = {
      focusActionButton: 'Focus Important Action Button',
      restartTours: 'Restart Product Tours'
    };

    if (instruction) {
      instruction.textContent = `Press the key combination you want to use for "${actionNames[action]}".`;
    }
    if (display) {
      display.textContent = 'Waiting for key combination...';
      display.style.color = '';
    }
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      modal.focus();
    }
  }

  hideRecordingModal() {
    const modal = document.getElementById('recording-modal');
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  setButtonRecordingState(action, recording) {
    const button = document.querySelector(`[data-action="${action}"]`);
    if (button) {
      if (recording) {
        button.classList.add('recording');
      } else {
        button.classList.remove('recording');
        button.focus();
      }
    }
  }

  updateRecordingDisplay(e) {
    const display = document.getElementById('recording-display');
    if (!display) return;

    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    display.textContent = parts.length > 0 
      ? parts.join('+') + '+...' 
      : 'Waiting for key combination...';
  }

  showRecordingSuccess(shortcut) {
    const display = document.getElementById('recording-display');
    if (display) {
      display.textContent = this.formatShortcut(shortcut);
      display.style.color = '#28a745';
    }
  }

  showConflictWarning(conflictingAction) {
    const display = document.getElementById('recording-display');
    if (!display) return;

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

  showMessage(text, type = 'info') {
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

    messageEl.textContent = text;
    messageEl.className = `message-${type}`;

    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8'
    };

    messageEl.style.backgroundColor = colors[type] || colors.info;

    requestAnimationFrame(() => {
      messageEl.style.opacity = '1';
      messageEl.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(100%)';
    }, 3000);
  }
}

// Initialize settings when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SettingsManager());
} else {
  new SettingsManager();
}
