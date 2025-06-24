// tradosClarity Settings Page JavaScript

class SettingsManager {
  constructor() {
    this.currentlyRecording = null;
    this.recordedKeys = [];
    this.liveRegion = null; // NEW: Live region for announcements
    
    // Default shortcuts
    this.defaultShortcuts = {
      focusActionButton: { key: 'a', alt: true, shift: true, ctrl: false },
      restartTours: { key: 'r', alt: true, shift: true, ctrl: false }
    };
    
    this.init();
  }

  async init() {
    console.log('SettingsManager: Initializing...');
    
    // ENHANCED: Setup live region first
    this.setupLiveRegion();
    
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
    
    // ENHANCED: Announce page ready
    this.announcePageReady();
    
    console.log('SettingsManager: Initialization complete');
  }

  // NEW: Setup live region for announcements
  setupLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.id = 'settings-live-region';
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

  // NEW: Announce when page is ready
  announcePageReady() {
    setTimeout(() => {
      this.announce('tradosClarity settings page loaded. Use Tab to navigate between controls.');
    }, 500);
  }

  // NEW: Better announcement method
  announce(message, delay = 0) {
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
        setTimeout(() => {
          this.liveRegion.textContent = message;
          console.log('SettingsManager: Announced:', message);
        }, 50);
      }
    }, delay);
  }

  // ENHANCED: Your existing setupTabs with better accessibility
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
        const activePanel = document.getElementById(targetPanel);
        activePanel.classList.add('active');
        
        // ENHANCED: Announce tab change
        const tabName = button.textContent.trim();
        this.announce(`Switched to ${tabName} tab`);
        
        // ENHANCED: Focus first focusable element in new panel
        setTimeout(() => {
          const firstFocusable = activePanel.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }, 100);
        
        console.log(`SettingsManager: Switched to ${targetPanel} tab`);
      });
      
      // ENHANCED: Your existing keyboard navigation with announcements
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

  // ENHANCED: Your existing startRecording with better user feedback
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
    
    // ENHANCED: Announce modal opening
    this.announce(`Recording new shortcut for ${actionNames[action]}. Press your desired key combination now.`);
    
    // Update button state
    const button = document.querySelector(`[data-action="${action}"]`);
    button.classList.add('recording');
  }

  // ENHANCED: Your existing handleRecordingKeydown with better feedback
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
    
    // ENHANCED: Announce the recorded combination
    const shortcutText = this.formatShortcut(shortcut);
    this.announce(`Recorded shortcut: ${shortcutText}`);
    
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

  // ENHANCED: Your existing showConflictWarning with announcement
  showConflictWarning(conflictingAction) {
    const display = document.getElementById('recording-display');
    const actionNames = {
      focusActionButton: 'Focus Important Action Button',
      restartTours: 'Restart Product Tours'
    };
    
    const message = `Conflict with "${actionNames[conflictingAction]}". Try a different combination.`;
    display.textContent = message;
    display.style.color = '#dc3545';
    
    // ENHANCED: Announce the conflict
    this.announce(`Shortcut conflict detected. This combination is already used for ${actionNames[conflictingAction]}. Please try a different combination.`);
    
    setTimeout(() => {
      display.textContent = 'Waiting for key combination...';
      display.style.color = '';
    }, 3000); // Longer delay for screen reader users
  }

  // ENHANCED: Your existing finishRecording with better feedback
  finishRecording() {
    const display = document.getElementById('recording-display');
    const shortcutText = this.formatShortcut(this.shortcuts[this.currentlyRecording]);
    display.textContent = shortcutText;
    display.style.color = '#28a745';
    
    // ENHANCED: Announce success
    const actionNames = {
      focusActionButton: 'Focus Important Action Button',
      restartTours: 'Restart Product Tours'
    };
    
    this.announce(`Shortcut successfully set to ${shortcutText} for ${actionNames[this.currentlyRecording]}`);
    
    setTimeout(() => {
      this.cancelRecording();
      this.displayShortcuts();
    }, 1500); // Longer delay for screen reader users
  }

  // ENHANCED: Your existing cancelRecording with focus management
  cancelRecording() {
    console.log('SettingsManager: Cancelling recording');
    
    const modal = document.getElementById('recording-modal');
    modal.setAttribute('aria-hidden', 'true');
    
    // Remove recording state from button
    if (this.currentlyRecording) {
      const button = document.querySelector(`[data-action="${this.currentlyRecording}"]`);
      button.classList.remove('recording');
      
      // ENHANCED: Return focus and announce
      setTimeout(() => {
        button.focus();
        this.announce('Shortcut recording cancelled. Focus returned to shortcut button.');
      }, 100);
    }
    
    this.currentlyRecording = null;
    this.recordedKeys = [];
  }

  // ENHANCED: Your existing saveShortcuts with better feedback
  async saveShortcuts() {
    try {
      await chrome.storage.sync.set({ tradosShortcuts: this.shortcuts });
      console.log('SettingsManager: Shortcuts saved:', this.shortcuts);
      
      // ENHANCED: Better success feedback
      const shortcutCount = Object.keys(this.shortcuts).length;
      this.showMessage(`${shortcutCount} shortcuts saved successfully!`, 'success');
      this.announce(`Settings saved. ${shortcutCount} keyboard shortcuts are now active.`);
      
      // Notify content scripts of the change
      this.notifyContentScripts();
      
    } catch (error) {
      console.error('SettingsManager: Error saving shortcuts:', error);
      this.showMessage('Error saving shortcuts. Please try again.', 'error');
      this.announce('Error saving shortcuts. Please try again.');
    }
  }

  // ENHANCED: Your existing resetAllShortcuts with better feedback
  resetAllShortcuts() {
    console.log('SettingsManager: Resetting all shortcuts to defaults');
    
    const confirmMessage = 'Are you sure you want to reset all shortcuts to their default values?';
    
    // ENHANCED: Announce the confirmation dialog
    this.announce('Confirmation dialog opened. Reset all shortcuts to defaults?');
    
    if (confirm(confirmMessage)) {
      this.shortcuts = { ...this.defaultShortcuts };
      this.displayShortcuts();
      
      // ENHANCED: Better feedback
      this.showMessage('All shortcuts reset to defaults', 'success');
      this.announce('All shortcuts have been reset to their default values. Remember to save your changes.');
    } else {
      this.announce('Reset cancelled. No changes made.');
    }
  }

  // ENHANCED: Your existing showMessage with better accessibility
  showMessage(text, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('settings-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'settings-message';
      messageEl.setAttribute('role', 'status'); // ENHANCED: Add role for screen readers
      messageEl.setAttribute('aria-live', 'polite'); // ENHANCED: Make it a live region
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
        max-width: 300px; /* ENHANCED: Prevent overly wide messages */
        word-wrap: break-word; /* ENHANCED: Handle long text */
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
    
    // ENHANCED: Also announce via live region
    this.announce(text);
    
    // Hide message after 4 seconds (longer for screen reader users)
    setTimeout(() => {
      messageEl.style.opacity = '0';
      messageEl.style.transform = 'translateX(100%)';
    }, 4000);
  }

  // NEW: Enhanced form validation with announcements
  validateShortcuts() {
    const errors = [];
    const shortcuts = Object.entries(this.shortcuts);
    
    // Check for duplicate shortcuts
    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        if (this.shortcutsEqual(shortcuts[i][1], shortcuts[j][1])) {
          errors.push(`Duplicate shortcut: ${this.formatShortcut(shortcuts[i][1])} is used for both ${shortcuts[i][0]} and ${shortcuts[j][0]}`);
        }
      }
    }
    
    // Check for problematic key combinations
    shortcuts.forEach(([action, shortcut]) => {
      if (!shortcut.alt && !shortcut.ctrl && !shortcut.shift) {
        errors.push(`${action}: Single key shortcuts may conflict with normal typing. Consider adding a modifier key.`);
      }
      
      if (shortcut.key === 'f5' || shortcut.key === 'f12') {
        errors.push(`${action}: ${shortcut.key.toUpperCase()} may conflict with browser functions.`);
      }
    });
    
    if (errors.length > 0) {
      const errorMessage = `Shortcut validation warnings: ${errors.join('. ')}`;
      this.announce(errorMessage);
      this.showMessage('Shortcut validation warnings detected. Check console for details.', 'warning');
      console.warn('Shortcut validation:', errors);
      return false;
    }
    
    return true;
  }

  // NEW: Enhanced keyboard navigation for the entire settings page
  setupEnhancedKeyboardNavigation() {
    // Add skip links for screen reader users
    this.addSkipLinks();
    
    // Enhance form navigation
    this.enhanceFormNavigation();
    
    // Add helpful keyboard shortcuts for settings page itself
    document.addEventListener('keydown', (e) => {
      // Alt+1, Alt+2, Alt+3 to switch tabs
      if (e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = document.querySelectorAll('.tab-button');
        if (tabs[tabIndex]) {
          tabs[tabIndex].focus();
          tabs[tabIndex].click();
        }
      }
      
      // Escape to close modal
      if (e.key === 'Escape' && this.currentlyRecording) {
        this.cancelRecording();
      }
    });
  }

  addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#shortcuts-panel';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  enhanceFormNavigation() {
    // Add form labels and descriptions where missing
    const shortcutButtons = document.querySelectorAll('.shortcut-button[data-action]');
    
    shortcutButtons.forEach(button => {
      const container = button.closest('.shortcut-item');
      const heading = container.querySelector('h3');
      const description = container.querySelector('p');
      
      if (heading && !button.getAttribute('aria-labelledby')) {
        const headingId = heading.id || `heading-${Math.random().toString(36).substr(2, 9)}`;
        heading.id = headingId;
        button.setAttribute('aria-labelledby', headingId);
      }
      
      if (description && !button.getAttribute('aria-describedby')) {
        const descId = description.id || `desc-${Math.random().toString(36).substr(2, 9)}`;
        description.id = descId;
        button.setAttribute('aria-describedby', descId);
      }
    });
  }

  // NEW: Help system integration
  setupContextualHelp() {
    // Add help tooltips that are accessible
    const helpButton = document.createElement('button');
    helpButton.textContent = '?';
    helpButton.setAttribute('aria-label', 'Show keyboard shortcuts help');
    helpButton.className = 'help-button';
    helpButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      border: none;
      font-size: 18px;
      cursor: pointer;
      z-index: 1000;
    `;
    
    helpButton.addEventListener('click', () => {
      this.showContextualHelp();
    });
    
    document.body.appendChild(helpButton);
  }

  showContextualHelp() {
    const helpText = `
      Keyboard shortcuts for settings page:
      - Alt+1, Alt+2, Alt+3: Switch between tabs
      - Tab: Navigate between controls
      - Enter or Space: Activate buttons
      - Arrow keys: Navigate within tab list
      - Escape: Close recording modal
      
      To record a new shortcut:
      1. Click the shortcut button for the action you want to change
      2. Press your desired key combination
      3. The shortcut will be recorded automatically
      
      Remember to save your changes when finished.
    `;
    
    this.announce(helpText);
    alert(helpText); // Fallback for visual users
  }

  // ENHANCED: Better initialization with progressive enhancement
  async enhancedInit() {
    // Call original init
    await this.init();
    
    // Add enhanced features
    this.setupEnhancedKeyboardNavigation();
    this.setupContextualHelp();
    
    // Validate shortcuts on load
    this.validateShortcuts();
    
    // Set up periodic auto-save reminder
    this.setupAutoSaveReminder();
  }

  setupAutoSaveReminder() {
    let hasUnsavedChanges = false;
    
    // Track changes
    const originalShortcuts = JSON.stringify(this.shortcuts);
    
    setInterval(() => {
      const currentShortcuts = JSON.stringify(this.shortcuts);
      hasUnsavedChanges = originalShortcuts !== currentShortcuts;
      
      if (hasUnsavedChanges) {
        this.announce('Reminder: You have unsaved shortcut changes. Click Save Shortcuts to apply them.');
        clearInterval(this); // Stop reminding once notified
      }
    }, 30000); // Remind every 30 seconds
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