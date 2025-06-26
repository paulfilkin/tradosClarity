// tradosClarity - Content Script
// Main accessibility enhancement for Trados Cloud

class TradosClarity {
  constructor() {
    this.shortcuts = this.getDefaultShortcuts();
    this.tour = new TourManager();
    this.action = new ActionButtonManager();
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
    this.setupMessageListener();
    this.setupKeyboardHandlers();
    this.tour.init();
    this.action.init();
  }

  async loadShortcuts() {
    try {
      const result = await chrome.storage.sync.get('tradosShortcuts');
      this.shortcuts = result.tradosShortcuts || this.getDefaultShortcuts();
    } catch (error) {
      console.error('tradosClarity: Error loading shortcuts:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'executeAction':
          this.handleAction(message.action);
          sendResponse({ success: true });
          break;
        case 'shortcutsUpdated':
          this.shortcuts = message.shortcuts;
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    });
  }

  handleAction(action) {
    switch (action) {
      case 'focusActionButton':
        this.action.focus();
        break;
      case 'restartTours':
        this.tour.restart();
        break;
    }
  }

  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      if (this.tour.isActive() && this.tour.handleKeydown(e)) {
        return;
      }

      if (this.matchesShortcut(e, this.shortcuts.focusActionButton)) {
        e.preventDefault();
        this.action.focus();
      } else if (this.matchesShortcut(e, this.shortcuts.restartTours)) {
        e.preventDefault();
        this.tour.restart();
      }
    });
  }

  matchesShortcut(event, shortcut) {
    return event.key.toLowerCase() === shortcut.key.toLowerCase() &&
           event.ctrlKey === !!shortcut.ctrl &&
           event.altKey === !!shortcut.alt &&
           event.shiftKey === !!shortcut.shift;
  }
}

// =============================================================================
// TOUR MANAGEMENT
// =============================================================================

class TourManager {
  constructor() {
    this.observer = null;
    this.activePopover = null;
    this.currentStep = 0;
    this.totalSteps = 0;
  }

  init() {
    this.enhanceExistingPopovers();
    this.setupInitialScan();
    this.setupMutationObserver();
  }

  isActive() {
    return this.activePopover && document.body.contains(this.activePopover);
  }

  handleKeydown(e) {
    if (!this.isActive()) return false;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        return true;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        this.next();
        return true;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        this.previous();
        return true;
    }
    return false;
  }

  enhanceExistingPopovers() {
    const popovers = document.querySelectorAll('[data-testid="help-tour-popover"]');
    popovers.forEach(popover => this.enhancePopover(popover));
  }

  setupInitialScan() {
    const scanTimes = [100, 500, 1000, 2000, 3000];
    scanTimes.forEach(delay => {
      setTimeout(() => this.enhanceExistingPopovers(), delay);
    });
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.getAttribute('data-testid') === 'help-tour-popover') {
              this.enhancePopover(node);
            }
            const childPopovers = node.querySelectorAll && node.querySelectorAll('[data-testid="help-tour-popover"]');
            if (childPopovers && childPopovers.length > 0) {
              childPopovers.forEach(popover => this.enhancePopover(popover));
            }
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  enhancePopover(popover) {
    if (!popover || popover.hasAttribute('data-trados-enhanced')) return;

    popover.setAttribute('data-trados-enhanced', 'true');
    this.activePopover = popover;

    this.makeAccessible(popover);
    this.enhanceContent(popover);
    this.enhanceNavigation(popover);
    this.announce(popover);
  }

  makeAccessible(popover) {
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-modal', 'true');
    popover.setAttribute('tabindex', '0');

    if (!popover.querySelector('.trados-live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.className = 'trados-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = 'position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important;';
      popover.appendChild(liveRegion);
    }
  }

  enhanceContent(popover) {
    const title = this.findElement(popover, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[role="heading"]', '.title', '.heading']);
    if (title) {
      title.setAttribute('role', 'heading');
      title.setAttribute('aria-level', '1');
      const titleId = this.ensureId(title, 'tour-title');
      popover.setAttribute('aria-labelledby', titleId);
    }

    const content = this.findElement(popover, ['.popover-body', '.tour-content', '.content', '.description', 'p']);
    if (content) {
      const contentId = this.ensureId(content, 'tour-content');
      popover.setAttribute('aria-describedby', contentId);
    }

    this.updateStepTracking(popover);
  }

  enhanceNavigation(popover) {
    const buttons = popover.querySelectorAll('button, a, [role="button"], [onclick], input[type="button"], .btn, .button');
    
    buttons.forEach((button) => {
      if (button.hasAttribute('data-trados-enhanced')) return;
      button.setAttribute('data-trados-enhanced', 'true');

      const text = button.textContent && button.textContent.trim().toLowerCase() || '';
      const className = String(button.className).toLowerCase();

      if (this.isNextButton(text, className)) {
        button.setAttribute('aria-label', 'Next step');
        button.setAttribute('data-tour-action', 'next');
      } else if (this.isPreviousButton(text, className)) {
        button.setAttribute('aria-label', 'Previous step');
        button.setAttribute('data-tour-action', 'previous');
      } else if (this.isCloseButton(text, className)) {
        button.setAttribute('aria-label', 'Close tour');
        button.setAttribute('data-tour-action', 'close');
      }

      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  isNextButton(text, className) {
    return text.includes('next') || text.includes('continue') || text === '>' ||
           text.includes('got it') || text.includes('okay') || className.includes('next');
  }

  isPreviousButton(text, className) {
    return text.includes('prev') || text.includes('back') || text === '<' ||
           className.includes('prev') || className.includes('back');
  }

  isCloseButton(text, className) {
    return text.includes('skip') || text.includes('close') || text.includes('finish') ||
           text.includes('end') || text.includes('exit') || className.includes('close');
  }

  next() {
    this.clickButton('[data-tour-action="next"]', () => {
      return this.findButtonByText(['next', 'continue', 'got it', 'okay']);
    });
  }

  previous() {
    this.clickButton('[data-tour-action="previous"]', () => {
      return this.findButtonByText(['prev', 'back']);
    });
  }

  close() {
    this.clickButton('[data-tour-action="close"]', () => {
      return this.findButtonByText(['skip', 'close', 'finish', 'end', 'exit']);
    });
  }

  clickButton(selector, fallback) {
    if (!this.activePopover) return;

    let button = this.activePopover.querySelector(selector);
    if (!button && fallback) {
      button = fallback();
    }
    
    if (button) {
      button.click();
    }
  }

  findButtonByText(textOptions) {
    if (!this.activePopover) return null;

    const buttons = this.activePopover.querySelectorAll('button, a, [role="button"]');
    for (const button of buttons) {
      const text = button.textContent && button.textContent.toLowerCase() || '';
      if (textOptions.some(option => text.includes(option))) {
        return button;
      }
    }
    return null;
  }

  announce(popover) {
    this.announceTourStart();
    setTimeout(() => {
      popover.focus();
      this.announceStep(popover);
    }, 100);
  }

  announceTourStart() {
    const message = 'Tour started. Press Escape to skip, or use arrow keys to navigate.';
    this.createAnnouncement(message, 'assertive');
  }

  announceStep(popover) {
    const liveRegion = popover.querySelector('.trados-live-region');
    if (!liveRegion) return;

    let announcement = '';
    if (this.currentStep && this.totalSteps) {
      announcement += `Tour step ${this.currentStep} of ${this.totalSteps}. `;
    }

    const title = this.findElement(popover, ['h1', 'h2', 'h3']);
    if (title) {
      announcement += title.textContent.trim() + '. ';
    }

    setTimeout(() => {
      liveRegion.textContent = announcement;
    }, 200);
  }

  restart() {
    try {
      const clearedCount = this.clearTourData();
      const message = clearedCount > 0 
        ? `Tour data cleared! ${clearedCount} items removed. Refreshing page...`
        : 'No tour data found to clear.';

      this.createAnnouncement(message);
      NotificationHelper.show(message, clearedCount > 0 ? 'success' : 'info');

      if (clearedCount > 0) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      const message = 'Error occurred while restarting tours.';
      this.createAnnouncement(message);
      NotificationHelper.show(message, 'error');
    }
  }

  clearTourData() {
    const tourKeys = ['ue_', 'tour_', 'help_', 'guide_', 'intro_', 'welcome_'];
    let clearedCount = 0;

    [localStorage, sessionStorage].forEach(storage => {
      if (typeof storage !== 'undefined') {
        Object.keys(storage).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (tourKeys.some(pattern => lowerKey.startsWith(pattern) || lowerKey.includes(pattern.slice(0, -1)))) {
            storage.removeItem(key);
            clearedCount++;
          }
        });
      }
    });

    return clearedCount;
  }

  updateStepTracking(popover) {
    const stepInfo = this.findStepInfo(popover);
    if (stepInfo) {
      this.currentStep = stepInfo.current;
      this.totalSteps = stepInfo.total;
    }
  }

  findStepInfo(popover) {
    const patterns = [/step\s+(\d+)\s+of\s+(\d+)/i, /(\d+)\s*\/\s*(\d+)/, /(\d+)\s+of\s+(\d+)/i];
    const text = popover.textContent || '';

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return { current: parseInt(match[1]), total: parseInt(match[2]) };
      }
    }
    return null;
  }

  findElement(parent, selectors) {
    for (const selector of selectors) {
      const element = parent.querySelector(selector);
      if (element && element.textContent && element.textContent.trim()) {
        return element;
      }
    }
    return null;
  }

  ensureId(element, prefix) {
    if (!element.id) {
      element.id = prefix + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
  }

  createAnnouncement(message, priority) {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority || 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important;';
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 3000);
  }
}

// =============================================================================
// ACTION BUTTON MANAGEMENT
// =============================================================================

class ActionButtonManager {
  constructor() {
    this.importantButton = null;
  }

  init() {
    setTimeout(() => this.findAndAnnounceButtons(), 2000);
    setTimeout(() => this.findAndAnnounceButtons(), 5000);
    this.setupDropdownHandling();
  }

  setupDropdownHandling() {
    console.log('tradosClarity: Setting up dropdown handling...');
    
    // Enhanced escape handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }
    }, true);

    // Listen for keyboard activation on ANY element to debug
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target;
        console.log('tradosClarity: Key pressed on element:', {
          tag: target.tagName,
          id: target.id,
          className: target.className,
          text: target.textContent && target.textContent.trim()
        });
        
        if (this.isSplitButton(target)) {
          console.log('tradosClarity: Split button activated:', target.id);
          setTimeout(() => this.findAndEnhanceDropdown(), 100);
        }
      }
    });

    // Also listen for clicks on ANY element to debug
    document.addEventListener('click', (e) => {
      const target = e.target;
      console.log('tradosClarity: Click on element:', {
        tag: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent && target.textContent.trim()
      });
      
      const splitButton = target.closest('[id*="splitbutton"]') || 
                         (target.classList && target.classList.contains('x-split-button') ? target : null);
      
      if (splitButton) {
        console.log('tradosClarity: Split button clicked:', splitButton.id);
        setTimeout(() => this.findAndEnhanceDropdown(), 100);
      }
    });

    // Watch for any new elements that appear
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (this.looksLikeDropdown(node)) {
              this.enhanceDropdown(node);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('tradosClarity: Dropdown handling setup complete');
  }

  isSplitButton(element) {
    if (!element) return false;
    
    const id = element.id || '';
    const className = String(element.className || '');
    
    return id.includes('splitbutton') || 
           className.includes('x-split-button') ||
           className.includes('x-btn-split');
  }

  findAndEnhanceDropdown() {
    console.log('tradosClarity: Looking for panel or dropdown...');
    
    // Multi-attempt search with delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      setTimeout(() => {
        console.log(`tradosClarity: Search attempt ${attempt} after ${(attempt-1) * 200}ms`);
        if (this.searchForPanel()) {
          console.log('tradosClarity: Panel found and enhanced');
          return;
        }
      }, (attempt - 1) * 200);
    }
  }

  searchForPanel() {
    // Look for main Import History grid panels first
    const mainImportHistoryPanels = document.querySelectorAll('.import-history-grid:not([data-trados-enhanced])');
    console.log('tradosClarity: Found', mainImportHistoryPanels.length, 'main import history grid panels');
    
    // Check main panels first
    for (const panel of mainImportHistoryPanels) {
      console.log('tradosClarity: Main Import History panel found:', {
        id: panel.id,
        className: panel.className,
        visible: this.isVisible(panel)
      });
      
      if (this.isVisible(panel)) {
        console.log('tradosClarity: Found visible panel:', panel.id);
        this.enhanceImportPanel(panel);
        return true;
      }
    }
    
    // Look specifically for Import History panels (including hidden ones)
    const importHistoryPanels = document.querySelectorAll(`
      [id*="import-history"]:not([data-trados-enhanced]),
      [id*="tm-import-history"]:not([data-trados-enhanced])
    `);
    console.log('tradosClarity: Found', importHistoryPanels.length, 'import history specific panels');
    
    for (const panel of importHistoryPanels) {
      if (this.isVisible(panel)) {
        console.log('tradosClarity: Found visible Import History panel:', panel.id);
        this.enhanceImportPanel(panel);
        return true;
      }
    }
    
    // Look for panels that contain "Import History" text
    const allPanels = document.querySelectorAll('.x-panel:not([data-trados-enhanced]), .x-window:not([data-trados-enhanced])');
    console.log('tradosClarity: Checking', allPanels.length, 'general panels for Import History text');
    
    for (const panel of allPanels) {
      const text = panel.textContent || '';
      if (text.includes('Import History') && this.isVisible(panel)) {
        console.log('tradosClarity: Found panel with Import History text:', panel.id || panel.className);
        this.enhanceImportPanel(panel);
        return true;
      }
    }
    
    // Last resort - look for any recently shown dropdown
    const dropdownMenus = document.querySelectorAll('.x-menu:not([data-trados-enhanced]), .x-boundlist:not([data-trados-enhanced])');
    console.log('tradosClarity: Found', dropdownMenus.length, 'potential dropdown menus');

    for (const menu of dropdownMenus) {
      if (this.isVisible(menu)) {
        console.log('tradosClarity: Found dropdown menu!');
        this.enhanceDropdown(menu);
        return true;
      }
    }

    console.log('tradosClarity: No panel or dropdown found');
    return false;
  }

  enhanceImportPanel(panel) {
    console.log('tradosClarity: Enhancing Import History panel:', panel.id);
    panel.setAttribute('data-trados-enhanced', 'true');

    // Store the element that had focus before opening the panel
    const previouslyFocused = document.activeElement;
    if (previouslyFocused && previouslyFocused !== document.body && !panel.contains(previouslyFocused)) {
      panel._previousFocus = previouslyFocused;
      console.log('tradosClarity: Stored previous focus element:', previouslyFocused);
    }

    // Make the panel focusable and accessible
    if (!panel.getAttribute('role')) {
      panel.setAttribute('role', 'dialog');
    }
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('tabindex', '0');

    // Find the Import History title specifically
    const importTitle = panel.querySelector('[id*="import-history"][id*="title"]') ||
                       Array.from(panel.querySelectorAll('.x-title-text, .x-panel-header-title')).find(el => 
                         el.textContent && el.textContent.includes('Import History'));

    let headerToFocus = null;

    if (importTitle) {
      const headerId = this.ensureId(importTitle, 'import-panel-title');
      panel.setAttribute('aria-labelledby', headerId);
      importTitle.setAttribute('tabindex', '0');
      headerToFocus = importTitle;
      console.log('tradosClarity: Found Import History title element:', importTitle);
    } else {
      // Fallback to any header
      const header = panel.querySelector('.x-title-text, .x-panel-header-title, h1, h2, h3');
      if (header) {
        const headerId = this.ensureId(header, 'import-panel-title');
        panel.setAttribute('aria-labelledby', headerId);
        header.setAttribute('tabindex', '0');
        headerToFocus = header;
        console.log('tradosClarity: Using fallback header:', header);
      }
    }

    // Find interactive elements within the panel
    const interactiveElements = this.findInteractiveElements(panel);
    console.log('tradosClarity: Found', interactiveElements.length, 'interactive elements');

    if (interactiveElements.length > 0) {
      this.makeElementsAccessible(interactiveElements);
      this.setupPanelKeyboardNavigation(panel, interactiveElements);
    }

    // Focus management - move focus into the panel immediately
    setTimeout(() => {
      if (headerToFocus) {
        console.log('tradosClarity: Focusing Import History header');
        headerToFocus.focus();
        
        // Force screen reader to announce it
        headerToFocus.click();
        setTimeout(() => headerToFocus.focus(), 50);
        
        this.announce(`Import History panel opened. Focus is on the panel title. Use Tab to navigate through ${interactiveElements.length} interactive elements, Escape to close.`);
      } else {
        // Fallback to focusing the panel itself
        console.log('tradosClarity: Focusing Import History panel directly');
        panel.focus();
        this.announce(`Import History panel opened. Contains ${interactiveElements.length} interactive elements. Use Tab to navigate, Escape to close.`);
      }
    }, 200);
  }

  findInteractiveElements(panel) {
    const selectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[tabindex="0"]',
      '[onclick]',
      '.x-btn',
      '.x-menu-item',
      '.clickable'
    ];

    const elements = [];
    selectors.forEach(selector => {
      try {
        const found = panel.querySelectorAll(selector);
        found.forEach(el => {
          if (this.isVisible(el) && !elements.includes(el)) {
            elements.push(el);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    return elements;
  }

  makeElementsAccessible(elements) {
    elements.forEach((element) => {
      // Ensure proper roles
      if (!element.getAttribute('role') && !element.matches('button, input, select, textarea, a[href]')) {
        element.setAttribute('role', 'button');
      }
      
      // Make sure they're in tab order
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  }

  setupPanelKeyboardNavigation(panel, elements) {
    const handleKeydown = (e) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          console.log('tradosClarity: Closing Import History panel with escape');
          this.forceCloseImportPanel(panel);
          break;
        case 'Tab':
          // Let normal tab navigation work, but ensure we stay within the panel
          // if this is a modal dialog
          if (panel.getAttribute('aria-modal') === 'true') {
            this.handleModalTabbing(e, panel, elements);
          }
          break;
        default:
          // Allow other keys to work normally
          break;
      }
    };

    panel.addEventListener('keydown', handleKeydown);
    
    // Also add the handler to the document when this panel is active
    // to catch escape from anywhere
    document.addEventListener('keydown', handleKeydown, true);
    
    // Store the handler so we can remove it later
    panel._tradosKeyHandler = handleKeydown;
  }

  handleModalTabbing(e, panel, elements) {
    // Get all focusable elements within the panel
    const focusableElements = panel.querySelectorAll(`
      button:not([disabled]),
      [href]:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      [role="button"]:not([disabled])
    `);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If shift+tab on first element, go to last
    if (e.shiftKey && e.target === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // If tab on last element, go to first
    else if (!e.shiftKey && e.target === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  forceCloseImportPanel(panel) {
    console.log('tradosClarity: Attempting to close Import History panel:', panel.id);
    
    // Step 1: Find a meaningful place to return focus before closing the panel
    let targetFocusElement = null;
    
    // First priority: return to where the user was before opening the panel
    if (panel._previousFocus && document.body.contains(panel._previousFocus) && this.isVisible(panel._previousFocus)) {
      targetFocusElement = panel._previousFocus;
      console.log('tradosClarity: Will return focus to previously focused element:', targetFocusElement);
    }
    
    // Second priority: Look for the Import button that originally opened this panel
    if (!targetFocusElement) {
      const importButton = document.querySelector('[id*="splitbutton"]:not([style*="display: none"]), .x-btn:not([style*="display: none"])');
      if (importButton && this.isVisible(importButton)) {
        const buttonText = importButton.textContent && importButton.textContent.toLowerCase() || '';
        if (buttonText.includes('import')) {
          targetFocusElement = importButton;
          console.log('tradosClarity: Will return focus to Import button');
        }
      }
    }
    
    // Fallback to other meaningful elements
    if (!targetFocusElement) {
      // Try to find a header or navigation element that provides context
      const meaningfulElements = [
        'h1, h2, h3', // Page headings
        '[role="main"] h1, [role="main"] h2', // Main content headings  
        '.x-panel-header-title', // Panel titles
        '[aria-label*="Translation Memories"]', // TM-specific elements
        '.x-toolbar button:first-child', // First toolbar button
        '#main-content', // Main content area
        '[role="main"]' // Main landmark
      ];
      
      for (const selector of meaningfulElements) {
        const element = document.querySelector(selector);
        if (element && this.isVisible(element)) {
          targetFocusElement = element;
          console.log('tradosClarity: Will return focus to:', selector);
          break;
        }
      }
    }
    
    // Final fallback
    if (!targetFocusElement) {
      targetFocusElement = document.body;
      console.log('tradosClarity: Will return focus to document body as fallback');
    }
    
    // Move focus away from panel before hiding
    if (document.activeElement && panel.contains(document.activeElement)) {
      console.log('tradosClarity: Moving focus away from panel before closing');
      
      // Make the target element focusable if needed
      if (!targetFocusElement.hasAttribute('tabindex') && 
          !targetFocusElement.matches('button, a[href], input, select, textarea, [tabindex]')) {
        targetFocusElement.setAttribute('tabindex', '-1');
        // Schedule removal of tabindex after focusing
        setTimeout(() => {
          if (targetFocusElement.getAttribute('tabindex') === '-1') {
            targetFocusElement.removeAttribute('tabindex');
          }
        }, 1000);
      }
      
      targetFocusElement.focus();
    }

    // Step 2: Remove our event listeners to prevent memory leaks
    if (panel._tradosKeyHandler) {
      document.removeEventListener('keydown', panel._tradosKeyHandler, true);
      delete panel._tradosKeyHandler;
    }
    
    // Clean up stored references
    if (panel._previousFocus) {
      delete panel._previousFocus;
    }

    // Step 3: Try to find and click the actual close button first
    const closeSelectors = [
      '.x-tool-close',
      '.x-panel-header-title-tools .x-tool',
      '.x-window-header-tools .x-tool-close',
      '[aria-label*="close"]',
      '[title*="close"]',
      'button[onclick*="close"]'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = panel.querySelector(selector);
      if (closeBtn && this.isVisible(closeBtn)) {
        console.log('tradosClarity: Found and clicking close button:', selector);
        closeBtn.click();
        return; // Let the normal close process handle it
      }
    }

    // Step 4: Try to close by looking for parent modal/window structures
    let currentElement = panel.parentElement;
    let attempts = 0;
    while (currentElement && attempts < 5) {
      attempts++;
      
      // Look for ExtJS window or modal containers
      if (currentElement.classList.contains('x-window') || 
          currentElement.classList.contains('x-modal') ||
          currentElement.id.includes('window')) {
        
        const windowCloseBtn = currentElement.querySelector('.x-tool-close, .x-window-close');
        if (windowCloseBtn) {
          console.log('tradosClarity: Found window close button');
          windowCloseBtn.click();
          return;
        }
      }
      
      currentElement = currentElement.parentElement;
    }

    // Step 5: Hide only the specific panel and its immediate modal parent (if any)
    console.log('tradosClarity: Hiding panel directly');
    
    // Hide the panel itself
    panel.style.setProperty('display', 'none', 'important');
    panel.style.setProperty('visibility', 'hidden', 'important');
    panel.style.setProperty('opacity', '0', 'important');
    
    // Only hide immediate parent if it's clearly a modal container
    const immediateParent = panel.parentElement;
    if (immediateParent && this.isModalContainer(immediateParent)) {
      console.log('tradosClarity: Hiding immediate modal parent:', immediateParent.id || immediateParent.className);
      immediateParent.style.setProperty('display', 'none', 'important');
      immediateParent.style.setProperty('visibility', 'hidden', 'important');
    }

    // Step 6: Remove backdrop/mask if present (but be very selective)
    const masks = document.querySelectorAll('.x-mask');
    masks.forEach(mask => {
      // Only remove masks that are clearly related to this panel
      if (mask.style.zIndex && parseInt(mask.style.zIndex) > 1000) {
        const maskRect = mask.getBoundingClientRect();
        
        // Only hide if the mask seems to be for this specific modal
        if (maskRect.width > 0 && maskRect.height > 0) {
          console.log('tradosClarity: Removing modal mask');
          mask.style.setProperty('display', 'none', 'important');
        }
      }
    });

    // Step 7: Click outside as final fallback (much more conservative)
    setTimeout(() => {
      // Only if the panel is still visible, try clicking outside
      if (this.isVisible(panel)) {
        console.log('tradosClarity: Panel still visible, trying outside click');
        const outsideClick = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 10, // Click near top-left, away from any modals
          clientY: 10
        });
        
        // Click on a safe element like the main content area
        const mainContent = document.querySelector('#main-content, [role="main"], main') || document.body;
        mainContent.dispatchEvent(outsideClick);
      }
    }, 50);

    // Step 8: Provide meaningful feedback about where focus has moved
    setTimeout(() => {
      if (targetFocusElement && document.activeElement === targetFocusElement) {
        let focusMessage = 'Import History panel closed.';
        
        // Provide context about where focus moved
        if (targetFocusElement.textContent && targetFocusElement.textContent.trim()) {
          const elementText = targetFocusElement.textContent.trim();
          const elementType = targetFocusElement.tagName.toLowerCase();
          
          if (elementType.match(/^h[1-6]$/)) {
            focusMessage += ` Focus moved to heading: "${elementText}".`;
          } else if (targetFocusElement.matches('button, [role="button"]')) {
            focusMessage += ` Focus returned to "${elementText}" button.`;
          } else if (elementText.length < 50) {
            focusMessage += ` Focus moved to: "${elementText}".`;
          } else {
            focusMessage += ` Focus moved to main content area.`;
          }
        } else {
          focusMessage += ` Focus moved to main content area.`;
        }
        
        // Add helpful navigation hint
        focusMessage += ' Use Tab to navigate or Alt+Shift+A to find important action buttons.';
        
        this.announce(focusMessage);
      }
    }, 200);

    console.log('tradosClarity: Import History panel close completed');
  }

  // Helper method to identify modal containers
  isModalContainer(element) {
    if (!element) return false;
    
    const className = String(element.className || '');
    const id = String(element.id || '');
    
    // Check for ExtJS modal/window patterns
    return className.includes('x-window') ||
           className.includes('x-modal') || 
           className.includes('x-panel-wrap') ||
           id.includes('window') ||
           id.includes('modal') ||
           // But specifically exclude the main body and viewport
           (!className.includes('x-body') && 
            !className.includes('x-viewport') && 
            !id.includes('ext-element-1'));
  }

  handleEscapeKey(e) {
    console.log('tradosClarity: Escape key pressed');
    
    // Check if we have an active Import History panel to close
    const importPanels = document.querySelectorAll(`
      [id*="import-history"][data-trados-enhanced],
      [id*="tm-import-history"][data-trados-enhanced],
      .import-history-grid[data-trados-enhanced]
    `);
    
    let closedImportPanel = false;
    for (const panel of importPanels) {
      if (this.isVisible(panel)) {
        console.log('tradosClarity: Closing Import History panel with escape');
        this.forceCloseImportPanel(panel);
        closedImportPanel = true;
        e.preventDefault();
        e.stopPropagation();
        break; // Only close one panel at a time
      }
    }
    
    if (closedImportPanel) {
      return;
    }
    
    // Look for other visible menus or dropdowns (but be much more conservative)
    const visibleMenus = document.querySelectorAll(`
      .x-menu:not([style*="display: none"]):not([style*="visibility: hidden"]),
      .x-boundlist:not([style*="display: none"]):not([style*="visibility: hidden"]),
      [role="menu"]:not([style*="display: none"]):not([style*="visibility: hidden"]),
      [role="listbox"]:not([style*="display: none"]):not([style*="visibility: hidden"]),
      .dropdown-menu:not([style*="display: none"]):not([style*="visibility: hidden"])
    `);

    let closedMenus = false;
    
    visibleMenus.forEach(menu => {
      // Skip if this is part of the main navigation or essential UI
      if (this.isEssentialUIElement(menu)) {
        return;
      }
      
      if (this.isVisible(menu) && this.appearsToBeDropdown(menu)) {
        console.log('tradosClarity: Closing dropdown menu:', menu.id || menu.className);
        this.forceCloseMenu(menu);
        closedMenus = true;
      }
    });

    if (closedMenus) {
      e.preventDefault();
      e.stopPropagation();
      console.log('tradosClarity: Dropdown menus closed with Escape');
    }
  }

  // Helper method to identify essential UI elements that shouldn't be closed
  isEssentialUIElement(element) {
    if (!element) return false;
    
    const className = String(element.className || '');
    const id = String(element.id || '');
    const parent = element.parentElement;
    
    // Skip main navigation, toolbars, and essential UI
    if (className.includes('x-toolbar') ||
        className.includes('x-panel-header') ||
        className.includes('navigation') ||
        className.includes('navbar') ||
        id.includes('toolbar') ||
        id.includes('nav')) {
      return true;
    }
    
    // Check if this is part of the main UI structure
    if (parent) {
      const parentClass = String(parent.className || '');
      if (parentClass.includes('x-viewport') ||
          parentClass.includes('x-body') ||
          parentClass.includes('main-content')) {
        return true;
      }
    }
    
    return false;
  }

  // Helper method to determine if an element appears to be a dropdown
  appearsToBeDropdown(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const className = String(element.className || '');
    
    // Must be visible and have reasonable dropdown dimensions
    if (rect.width === 0 || rect.height === 0 || rect.width > window.innerWidth || rect.height > window.innerHeight * 0.8) {
      return false;
    }
    
    // Must have dropdown-like characteristics
    return className.includes('x-menu') ||
           className.includes('dropdown') ||
           className.includes('x-boundlist') ||
           element.getAttribute('role') === 'menu' ||
           element.getAttribute('role') === 'listbox';
  }

  forceCloseMenu(menu) {
    // Don't close essential UI elements
    if (this.isEssentialUIElement(menu)) {
      return;
    }
    
    console.log('tradosClarity: Closing menu:', menu.id || menu.className);
    
    // Method 1: Look for close button or tool within the menu
    const closeBtn = menu.querySelector('.x-tool-close, .x-btn-close, [aria-label*="close"]');
    if (closeBtn && this.isVisible(closeBtn)) {
      closeBtn.click();
      return;
    }

    // Method 2: Hide only this specific menu
    menu.style.setProperty('display', 'none', 'important');
    menu.style.setProperty('visibility', 'hidden', 'important');
    menu.style.setProperty('opacity', '0', 'important');
    
    // Method 3: If it's a floating menu, try to remove it safely
    const style = window.getComputedStyle(menu);
    if ((style.position === 'absolute' || style.position === 'fixed') && 
        menu.parentElement && 
        !this.isEssentialUIElement(menu.parentElement)) {
      
      try {
        // Only remove if it's clearly a temporary dropdown
        const rect = menu.getBoundingClientRect();
        if (rect.width < window.innerWidth * 0.5 && rect.height < window.innerHeight * 0.5) {
          menu.remove();
        }
      } catch (e) {
        console.log('tradosClarity: Could not remove menu element safely');
      }
    }

    // Method 4: Click outside as last resort, but very conservatively
    setTimeout(() => {
      if (this.isVisible(menu)) {
        const outsideClick = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 50, // Click in a safe area
          clientY: 50
        });
        
        // Click on the main content area, not the body
        const mainContent = document.querySelector('#main-content, [role="main"], .x-panel-body') || document.documentElement;
        if (mainContent && mainContent !== menu && !menu.contains(mainContent)) {
          mainContent.dispatchEvent(outsideClick);
        }
      }
    }, 10);
  }

  looksLikeDropdown(element) {
    if (!element || !this.isVisible(element)) return false;
    
    const className = String(element.className || '');
    const role = element.getAttribute('role');
    const tagName = element.tagName;
    
    return className.includes('x-menu') || 
           className.includes('dropdown') ||
           className.includes('popover') ||
           className.includes('x-boundlist') ||
           role === 'menu' ||
           role === 'listbox' ||
           (tagName === 'UL' && className.includes('menu'));
  }

  enhanceDropdown(dropdown) {
    if (!dropdown || dropdown.hasAttribute('data-trados-enhanced') || !this.isVisible(dropdown)) {
      return;
    }

    console.log('tradosClarity: Enhancing dropdown:', dropdown);
    dropdown.setAttribute('data-trados-enhanced', 'true');

    // Make it focusable and accessible
    if (!dropdown.getAttribute('role')) {
      dropdown.setAttribute('role', 'menu');
    }
    dropdown.setAttribute('tabindex', '0');

    // Find clickable items
    const items = this.findClickableItems(dropdown);
    console.log('tradosClarity: Found', items.length, 'clickable items');

    if (items.length > 0) {
      this.makeItemsAccessible(items);
      this.setupKeyboardNavigation(dropdown, items);
      
      // Focus the dropdown and announce
      dropdown.focus();
      this.announce(`Dropdown menu opened with ${items.length} options. Use arrow keys to navigate, Enter to select, Escape to close.`);
    }
  }

  findClickableItems(dropdown) {
    const selectors = [
      'a[href]',
      'button',
      '[role="menuitem"]',
      '[role="option"]',
      '.x-menu-item',
      '.dropdown-item',
      'li a',
      '[onclick]',
      '.clickable'
    ];

    const items = [];
    selectors.forEach(selector => {
      try {
        const elements = dropdown.querySelectorAll(selector);
        elements.forEach(el => {
          if (this.isVisible(el) && !items.includes(el)) {
            items.push(el);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    return items;
  }

  makeItemsAccessible(items) {
    items.forEach((item, index) => {
      if (!item.getAttribute('role')) {
        item.setAttribute('role', 'menuitem');
      }
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
  }

  setupKeyboardNavigation(dropdown, items) {
    const handleKeydown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextItem(items);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousItem(items);
          break;
        case 'Enter':
        case ' ':
          const focused = document.activeElement;
          if (items.includes(focused)) {
            e.preventDefault();
            focused.click();
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          this.closeDropdown(dropdown);
          break;
      }
    };

    dropdown.addEventListener('keydown', handleKeydown);
    items.forEach(item => {
      item.addEventListener('keydown', handleKeydown);
    });
  }

  focusNextItem(items) {
    const focused = document.activeElement;
    const currentIndex = items.indexOf(focused);
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    this.focusItem(items, nextIndex);
  }

  focusPreviousItem(items) {
    const focused = document.activeElement;
    const currentIndex = items.indexOf(focused);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    this.focusItem(items, prevIndex);
  }

  focusItem(items, index) {
    if (index >= 0 && index < items.length) {
      items.forEach((item, i) => {
        item.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      items[index].focus();
    }
  }

  closeDropdown(dropdown) {
    // Try multiple ways to close the dropdown
    dropdown.style.display = 'none';
    dropdown.style.visibility = 'hidden';
    
    // Try to remove it if it's a floating element
    if (dropdown.parentNode) {
      dropdown.parentNode.removeChild(dropdown);
    }
  }

  ensureId(element, prefix) {
    if (!element.id) {
      element.id = prefix + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
  }

  focus() {
    if (this.importantButton && document.body.contains(this.importantButton)) {
      this.focusButton(this.importantButton);
    } else {
      this.findAndFocusButton();
    }
  }

  findAndFocusButton() {
    const button1046 = document.getElementById('button-1046');
    
    if (button1046 && this.isVisible(button1046)) {
      this.importantButton = button1046;
      this.focusButton(button1046);
      return;
    }

    const buttons = document.querySelectorAll('.x-btn, button, [role="button"]');
    for (const btn of buttons) {
      if (this.isImportantButton(btn) && this.isVisible(btn)) {
        this.importantButton = btn;
        this.focusButton(btn);
        return;
      }
    }

    this.announce('No important action button found on this page.');
  }

  findAndAnnounceButtons() {
    const buttons = this.findImportantButtons();
    if (buttons.length > 0) {
      this.announceButtons(buttons);
    }
  }

  findImportantButtons() {
    const buttons = [];
    const allButtons = document.querySelectorAll('.x-btn, button, [role="button"]');
    
    allButtons.forEach((button) => {
      if (this.isVisible(button) && this.isImportantButton(button)) {
        buttons.push({
          element: button,
          text: this.getButtonText(button),
          action: this.getActionType(button)
        });
      }
    });

    return buttons;
  }

  getButtonText(button) {
    return button.textContent && button.textContent.trim() || '';
  }

  isImportantButton(button) {
    const text = this.getButtonText(button).toLowerCase();
    const className = String(button.className || '');
    
    return text.includes('accept') || 
           text.includes('complete') || 
           text.includes('import') ||
           className.includes('dap-btn-done');
  }

  getActionType(button) {
    const text = this.getButtonText(button).toLowerCase();
    if (text.includes('accept')) return 'accept';
    if (text.includes('complete')) return 'complete';
    if (text.includes('import')) return 'import';
    return 'action';
  }

  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null;
  }

  focusButton(button) {
    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      button.focus();
      const text = this.getButtonText(button) || 'action button';
      this.announce(`Focused "${text}" button. Press Enter to activate.`);
    }, 100);
  }

  announceButtons(buttons) {
    this.importantButton = buttons[0] && buttons[0].element;

    if (buttons.length === 1) {
      const button = buttons[0];
      let message = '';
      if (button.action === 'accept') {
        message = `Important: You need to accept this task before working. "${button.text}" button available.`;
      } else if (button.action === 'complete') {
        message = `Task ready to complete. "${button.text}" button available.`;
      } else if (button.action === 'import') {
        message = `Import functionality available. "${button.text}" button ready.`;
      } else {
        message = `Important action required: "${button.text}" button available.`;
      }
      this.announce(message);
    }
  }

  announce(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important;';
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 3000);
  }
}

// =============================================================================
// NOTIFICATION HELPER
// =============================================================================

class NotificationHelper {
  static show(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: ${this.getColor(type)} !important;
      color: white !important;
      padding: 16px 20px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      max-width: 300px !important;
      opacity: 0 !important;
      transform: translateX(100%) !important;
      transition: all 0.3s ease !important;
      cursor: pointer !important;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });

    const remove = () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    notification.addEventListener('click', remove);
    setTimeout(remove, 5000);
  }

  static getColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };
    return colors[type] || colors.info;
  }
}

// Initialize the extension
console.log('tradosClarity: Initializing...');
new TradosClarity();
