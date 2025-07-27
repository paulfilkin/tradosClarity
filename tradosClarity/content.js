// tradosClarity - Content Script
// Main accessibility enhancement for Trados Cloud

class TradosClarity {
  constructor() {
    this.shortcuts = this.getDefaultShortcuts();
    this.tour = new TourManager();
    this.action = new ActionButtonManager();
    this.navigation = new NavigationManager();
    this.languagePairs = new LanguagePairsManager();
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
    this.setupMessageListener();
    this.setupKeyboardHandlers();
    this.tour.init();
    this.action.init();
    this.languagePairs.init();
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
    case 'quickNavigation':
      this.navigation.showNavigationOverlay();
      break;
    case 'navigateToMain':
      this.navigation.navigateToLandmark('mainMenu');
      break;
    case 'navigateToSub':
      this.navigation.navigateToLandmark('subMenu');
      break;
    case 'navigateToTable':
      this.navigation.navigateToLandmark('contentArea');
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
    } else if (this.matchesShortcut(e, this.shortcuts.quickNavigation)) {
      e.preventDefault();
      this.navigation.showNavigationOverlay();
    } else if (this.matchesShortcut(e, this.shortcuts.navigateToMain)) {
      e.preventDefault();
      this.navigation.navigateToLandmark('mainMenu');
    } else if (this.matchesShortcut(e, this.shortcuts.navigateToSub)) {
      e.preventDefault();
      this.navigation.navigateToLandmark('subMenu');
    } else if (this.matchesShortcut(e, this.shortcuts.navigateToTable)) {
      e.preventDefault();
      this.navigation.navigateToLandmark('contentArea');
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

// =============================================================================
// ENHANCED NAVIGATION MANAGEMENT
// =============================================================================

class NavigationManager {
  constructor() {
    this.landmarks = new Map();
    this.navigationOverlay = null;
    this.currentFocus = null;
    this.init();
  }

  init() {
    this.identifyNavigationLandmarks();
    this.enhanceExistingLandmarks();
    this.setupNavigationOverlay();
    this.observePageChanges();
    console.log('tradosClarity: Navigation Manager initialized with', this.landmarks.size, 'landmarks');
  }

  identifyNavigationLandmarks() {
    // Define navigation areas based on confirmed Trados Cloud patterns
    const landmarkSelectors = {
      mainMenu: {
        selectors: [
          '.sdl-navbar',
          '#navbar-1209',
          '.x-toolbar.sdl-navbar'
        ],
        label: 'Main Navigation Menu',
        shortcut: 'M',
        description: 'Navigate to main menu (Dashboard, Inbox, Projects, Resources, etc.)',
        role: 'navigation'
      },
      
      subMenu: {
        selectors: [
          '[role="tablist"]',
          '.x-tab-bar[role="tablist"]',
          '.x-tab-bar-body'
        ],
        label: 'Section Navigation',
        shortcut: 'S', 
        description: 'Navigate to section tabs (Dashboard, Stages, Workflow, Files, etc.)',
        role: 'navigation',
        optional: true // Not present on all pages (e.g., Customers)
      },
      
      actionToolbar: {
        selectors: [
          '.x-toolbar.x-docked:not(.sdl-navbar)',
          '.x-toolbar[role="group"]:not(.sdl-navbar)',
          '.x-toolbar[role="toolbar"]:not(.sdl-navbar)'
        ],
        label: 'Action Buttons',
        shortcut: 'A',
        description: 'Navigate to action buttons (Refresh, Upload, Download, Open Editor, etc.)',
        role: 'toolbar'
      },
      
      contentArea: {
        selectors: [
          '.x-grid',
          '.x-panel-body:has(.x-grid)',
          '.x-tree-panel',
          '.x-panel-body .x-grid'
        ],
        label: 'Content Table',
        shortcut: 'T',
        description: 'Navigate to main content table with files, projects, or data',
        role: 'main'
      }
    };

    // Find and register each landmark
    Object.entries(landmarkSelectors).forEach(([key, config]) => {
      const element = this.findBestMatch(config.selectors);
      if (element) {
        this.landmarks.set(key, {
          element,
          ...config
        });
        console.log(`tradosClarity: Found ${config.label}:`, element);
      } else if (!config.optional) {
        console.log(`tradosClarity: Warning - Required landmark '${config.label}' not found`);
      }
    });
  }

  findBestMatch(selectors) {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        // Return the most visible and interactive element
        for (const element of elements) {
          if (this.isVisible(element) && this.isUsefulLandmark(element)) {
            return element;
          }
        }
      } catch (e) {
        console.log('tradosClarity: Invalid selector:', selector);
      }
    }
    return null;
  }

  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null &&
           rect.width > 0 && 
           rect.height > 0;
  }

  isUsefulLandmark(element) {
    // Check if element contains interactive content or meaningful structure
    const interactiveElements = element.querySelectorAll(`
      button, a[href], input, select, textarea, 
      [role="button"], [role="menuitem"], [role="tab"],
      [tabindex]:not([tabindex="-1"]), .x-btn, .x-grid-cell
    `);
    
    // Also check for meaningful text content
    const hasContent = element.textContent && element.textContent.trim().length > 5;
    
    return interactiveElements.length > 0 || hasContent;
  }

  enhanceExistingLandmarks() {
    this.landmarks.forEach((landmark, key) => {
      this.enhanceLandmark(landmark.element, landmark, key);
    });
  }

  enhanceLandmark(element, config, landmarkKey) {
    if (element.hasAttribute('data-trados-nav-enhanced')) return;
    
    element.setAttribute('data-trados-nav-enhanced', 'true');
    element.setAttribute('data-trados-landmark', landmarkKey);
    
    // Add proper landmark roles if not already present
    if (!element.getAttribute('role') && config.role) {
      element.setAttribute('role', config.role);
    }
    
    // Add accessible labels
    if (!element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', config.label);
    }
    
    // Make focusable for programmatic navigation
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    
    // Enhance the first focusable element within the landmark
    const firstFocusable = this.findFirstFocusableElement(element);
    if (firstFocusable && !firstFocusable.hasAttribute('data-trados-enhanced')) {
      firstFocusable.setAttribute('data-trados-enhanced', 'true');
      
      // Add navigation hint for screen readers
      this.ensureNavigationHint();
      firstFocusable.setAttribute('aria-describedby', 'trados-nav-hint');
    }
  }

  ensureNavigationHint() {
    if (!document.getElementById('trados-nav-hint')) {
      const hint = document.createElement('div');
      hint.id = 'trados-nav-hint';
      hint.className = 'trados-live-region';
      hint.style.cssText = 'position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important;';
      hint.textContent = 'Press Alt+Shift+N for quick navigation options between main sections';
      document.body.appendChild(hint);
    }
  }

  findFirstFocusableElement(container) {
    const focusableSelectors = `
      button:not([disabled]):not([aria-hidden="true"]),
      a[href]:not([disabled]):not([aria-hidden="true"]),
      input:not([disabled]):not([aria-hidden="true"]),
      select:not([disabled]):not([aria-hidden="true"]),
      textarea:not([disabled]):not([aria-hidden="true"]),
      [tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"]),
      [role="button"]:not([disabled]):not([aria-hidden="true"]),
      [role="menuitem"]:not([disabled]):not([aria-hidden="true"]),
      [role="tab"]:not([disabled]):not([aria-hidden="true"]),
      .x-btn:not([disabled]):not([aria-hidden="true"])
    `;
    
    const focusables = container.querySelectorAll(focusableSelectors);
    for (const element of focusables) {
      if (this.isVisible(element)) {
        return element;
      }
    }
    return container; // Fallback to the landmark itself
  }

  setupNavigationOverlay() {
    this.createNavigationOverlay();
  }

  createNavigationOverlay() {
    // Create overlay container
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'trados-nav-container';
    
    // Create shadow DOM to isolate our styles
    const shadowRoot = overlayContainer.attachShadow({ mode: 'open' });
    
    // Add our isolated styles and content
    shadowRoot.innerHTML = `
      <style>
        .overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 3px solid #2d5a5a;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          z-index: 999999;
          padding: 24px;
          min-width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
          display: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .overlay[data-visible="true"] {
          display: block;
          opacity: 1;
        }
        
        .title {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: #2d5a5a;
          font-weight: 600;
        }
        
        .subtitle {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }
        
        .nav-item {
          margin: 0 0 12px 0;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .nav-item:hover {
          background: #e9ecef;
          border-color: #2d5a5a;
        }
        
        .nav-key {
          background: #2d5a5a;
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
          min-width: 30px;
          text-align: center;
          flex-shrink: 0;
        }
        
        .nav-content {
          flex: 1;
        }
        
        .nav-title {
          font-weight: 600;
          font-size: 16px;
          color: #333;
          margin-bottom: 4px;
        }
        
        .nav-desc {
          color: #666;
          font-size: 13px;
        }
        
        .instructions {
          margin: 0;
          color: #666;
          font-size: 12px;
          text-align: center;
          border-top: 1px solid #e9ecef;
          padding-top: 16px;
          line-height: 1.4;
        }
      </style>
      
      <div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-labelledby="nav-title" tabindex="0">
        <h2 class="title" id="nav-title">Quick Navigation</h2>
        <p class="subtitle">Press the highlighted key to jump directly to that section:</p>
        <div id="nav-list"></div>
        <p class="instructions">
          <strong>Keyboard shortcuts:</strong> Alt+Shift+N (this dialog) • Alt+Shift+M (main menu) • Alt+Shift+S (sub-tabs) • Alt+Shift+A (actions) • Alt+Shift+T (table)<br>
          Press <strong>Escape</strong> to close this dialog
        </p>
      </div>
    `;

    const overlay = shadowRoot.querySelector('#overlay');
    const navList = shadowRoot.querySelector('#nav-list');

    // Add navigation options for available landmarks
    this.landmarks.forEach((landmark, key) => {
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.innerHTML = `
        <div class="nav-key">${landmark.shortcut}</div>
        <div class="nav-content">
          <div class="nav-title">${landmark.label}</div>
          <div class="nav-desc">${landmark.description}</div>
        </div>
      `;
      
      item.addEventListener('click', () => this.navigateToLandmark(key));
      navList.appendChild(item);
    });

    document.body.appendChild(overlayContainer);
    this.navigationOverlay = overlay;
    this.overlayContainer = overlayContainer;

    // Setup keyboard handlers for the overlay itself, not the container
    overlay.addEventListener('keydown', (e) => this.handleOverlayKeydown(e));
  }

  handleOverlayKeydown(e) {
    console.log('Overlay keydown:', e.key); // Debug log
    
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      console.log('Escape pressed, hiding overlay'); // Debug log
      this.hideNavigationOverlay();
      return;
    }

    // Check for direct navigation shortcuts
    const key = e.key.toLowerCase();
    this.landmarks.forEach((landmark, landmarkKey) => {
      if (landmark.shortcut.toLowerCase() === key) {
        e.preventDefault();
        this.navigateToLandmark(landmarkKey);
        this.hideNavigationOverlay();
      }
    });
  }

  showNavigationOverlay() {
    console.log('showNavigationOverlay called');
    
    if (!this.navigationOverlay) {
      console.log('No navigation overlay found!');
      return;
    }
    
    // Refresh the navigation items each time we show the overlay
    this.updateNavigationItems();
    
    this.currentFocus = document.activeElement;
    
    // Directly set the display and opacity styles
    this.navigationOverlay.style.display = 'block';
    this.navigationOverlay.style.opacity = '1';
    this.navigationOverlay.setAttribute('data-visible', 'true');
    
    console.log('Overlay should now be visible');
    
    // Focus the actual overlay element inside the shadow DOM, not the container
    setTimeout(() => {
      this.navigationOverlay.focus();
      console.log('Focused the overlay element');
    }, 100);

    this.announce(`Quick navigation dialog opened. ${this.landmarks.size} sections available. Use shortcut keys to navigate or press Escape to close.`);
  }

  hideNavigationOverlay() {
    if (!this.navigationOverlay) return;
    
    // Directly set the styles to hide
    this.navigationOverlay.style.display = 'none';
    this.navigationOverlay.style.opacity = '0';
    this.navigationOverlay.setAttribute('data-visible', 'false');
    
    if (this.currentFocus && document.body.contains(this.currentFocus)) {
      this.currentFocus.focus();
    }
  }

  updateNavigationItems() {
    const navList = this.overlayContainer.shadowRoot.querySelector('#nav-list');
    navList.innerHTML = ''; // Clear existing items
    
    console.log('Updating navigation items, landmarks:', this.landmarks.size);
    
    // Add navigation options for available landmarks
    this.landmarks.forEach((landmark, key) => {
      console.log('Adding navigation item for:', landmark.label);
      
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.innerHTML = `
        <div class="nav-key">${landmark.shortcut}</div>
        <div class="nav-content">
          <div class="nav-title">${landmark.label}</div>
          <div class="nav-desc">${landmark.description}</div>
        </div>
      `;
      
      item.addEventListener('click', () => this.navigateToLandmark(key));
      navList.appendChild(item);
    });
  }

  navigateToLandmark(landmarkKey) {
    const landmark = this.landmarks.get(landmarkKey);
    if (!landmark || !landmark.element) {
      this.announce(`${landmark?.label || 'Section'} not found on this page.`);
      return;
    }

    // Find the best element to focus within the landmark
    const targetElement = this.findFirstFocusableElement(landmark.element);
    
    // Scroll into view
    targetElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });

    // Focus after scroll with enhanced feedback
    setTimeout(() => {
      targetElement.focus();
      
      // Count interactive elements for context
      const interactiveCount = landmark.element.querySelectorAll(`
        button:not([disabled]), a[href]:not([disabled]), 
        input:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]),
        .x-btn:not([disabled]), [role="tab"]:not([disabled])
      `).length;
      
      // Enhanced announcement with context
      let announcement = `Navigated to ${landmark.label}.`;
      
      if (interactiveCount > 0) {
        announcement += ` Contains ${interactiveCount} interactive element${interactiveCount !== 1 ? 's' : ''}.`;
      }
      
      if (landmarkKey === 'contentArea') {
        // Special handling for data grids
        const rows = landmark.element.querySelectorAll('.x-grid-row, tr');
        if (rows.length > 0) {
          announcement += ` Table has ${rows.length} row${rows.length !== 1 ? 's' : ''}.`;
        }
      }
      
      announcement += ' Use Tab to navigate within this section, or Alt+Shift+N for quick navigation.';
      
      this.announce(announcement);
    }, 500);
  }

  observePageChanges() {
    // Re-scan for landmarks when page content changes significantly
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for significant structural changes
              if (node.classList && (
                  node.classList.contains('x-toolbar') || 
                  node.classList.contains('x-grid') ||
                  node.classList.contains('x-tab-bar') ||
                  node.querySelector('.x-toolbar, .x-grid, .x-tab-bar')
                )) {
                shouldRescan = true;
              }
            }
          });
        }
      });
      
      if (shouldRescan) {
        console.log('tradosClarity: Significant page structure change detected, rescanning landmarks...');
        setTimeout(() => {
          this.landmarks.clear();
          this.identifyNavigationLandmarks();
          this.enhanceExistingLandmarks();
          console.log('tradosClarity: Landmarks rescanned, found', this.landmarks.size, 'sections');
        }, 1000); // Allow time for page to stabilize
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  announce(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'trados-live-region';
    announcer.style.cssText = 'position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important;';
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 3000);
  }

  // Public method for external access
  getAvailableLandmarks() {
    return Array.from(this.landmarks.entries()).map(([key, landmark]) => ({
      key,
      label: landmark.label,
      shortcut: landmark.shortcut,
      available: this.isVisible(landmark.element)
    }));
  }
}

// =============================================================================
// LANGUAGE PAIRS MANAGEMENT
// =============================================================================

class LanguagePairsManager {
  constructor() {
    this.observer = null;
    this.enhancedGrids = new WeakSet();
    this.activeLanguageInput = null;
    this.lastInputValue = '';
    this.isTargetField = false;
    this.preventSelection = false;
  }

  init() {
    console.log('tradosClarity: Initializing Language Pairs Manager...');
    this.fixInitialFocus();
    this.enhanceExistingGrids();
    this.setupMutationObserver();
    this.setupGlobalHandlers();
  }

  fixInitialFocus() {
    if (window.location.href.includes('/translation-memories/new')) {
      console.log('tradosClarity: Translation memory creation page detected');
      
      const focusFirstField = () => {
        const firstInput = document.querySelector('input[type="text"]:not([disabled]):not([readonly])');
        if (firstInput && this.isVisible(firstInput)) {
          firstInput.focus();
          this.announce('Translation memory creation form. Focus set to name field.');
          return true;
        }
        return false;
      };
      
      setTimeout(focusFirstField, 500);
      setTimeout(focusFirstField, 1000);
    }
  }

  setupGlobalHandlers() {
    const self = this;
    
    // Click handler for empty cells
    document.addEventListener('click', (e) => {
      const emptyCell = e.target.closest('.x-grid-empty-cell');
      if (emptyCell && this.isInLanguagePairsGrid(emptyCell)) {
        this.handleEmptyCellClick(emptyCell, e);
      }
    }, true);

    // Keyboard handlers
    document.addEventListener('keydown', (e) => {
      const gridCell = e.target.closest('.x-grid-cell');
      if (gridCell && this.isInLanguagePairsGrid(gridCell)) {
        this.handleGridKeydown(e, gridCell);
      }
    }, true);

    // Monitor dropdown appearance and keep input focused
    const dropdownObserver = new MutationObserver((mutations) => {
      if (self.activeLanguageInput) {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if a dropdown appeared
                if (node.classList?.contains('x-boundlist') || 
                    node.querySelector?.('.x-boundlist')) {
                  
                  console.log('tradosClarity: Dropdown appeared, maintaining input focus');
                  
                  // Keep focus on input
                  setTimeout(() => {
                    if (self.activeLanguageInput && document.activeElement !== self.activeLanguageInput) {
                      self.activeLanguageInput.focus();
                      // For target field, ensure no selection
                      if (self.isTargetField) {
                        const len = self.activeLanguageInput.value.length;
                        self.activeLanguageInput.setSelectionRange(len, len);
                      }
                    }
                  }, 0);
                }
              }
            });
          }
        }
      }
    });

    dropdownObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Global selection prevention for target field
    document.addEventListener('selectstart', function(e) {
      if (self.preventSelection && e.target === self.activeLanguageInput) {
        console.log('tradosClarity: Preventing text selection in target field');
        e.preventDefault();
        return false;
      }
    }, true);
  }

  handleEmptyCellClick(cell, event) {
    console.log('tradosClarity: Language cell clicked');
    const fieldType = this.determineFieldType(cell);
    this.isTargetField = (fieldType === 'target');
    
    const message = fieldType === 'source' 
      ? 'Opening source language input. Type language code or name.'
      : 'Opening target language input. Type language code or name.';
    this.announce(message);
    
    // Click to activate edit mode
    const innerDiv = cell.querySelector('.x-grid-cell-inner');
    if (innerDiv) {
      innerDiv.click();
      
      // Watch for input to appear
      setTimeout(() => {
        this.findAndEnhanceLanguageInput(cell, fieldType);
      }, 100);
    }
  }

  findAndEnhanceLanguageInput(cell, fieldType) {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Find inputs near this cell
      const inputs = document.querySelectorAll('input[type="text"]:not([data-trados-language-enhanced])');
      
      inputs.forEach(input => {
        if (this.isVisible(input)) {
          const inputRect = input.getBoundingClientRect();
          const cellRect = cell.getBoundingClientRect();
          
          // Check if input is positioned near the cell
          const isNearCell = Math.abs(inputRect.top - cellRect.top) < 50 &&
                            Math.abs(inputRect.left - cellRect.left) < 200;
          
          if (isNearCell) {
            console.log('tradosClarity: Found language input, enhancing...');
            this.enhanceLanguageInput(input, fieldType);
            clearInterval(checkInterval);
          }
        }
      });
      
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 50);
  }

  enhanceLanguageInput(input, fieldType) {
    const self = this;
    
    // Mark as enhanced
    input.setAttribute('data-trados-language-enhanced', 'true');
    input.setAttribute('data-field-type', fieldType);
    
    // Set as active
    this.activeLanguageInput = input;
    
    // Add ARIA label
    const label = fieldType === 'source'
      ? 'Source language input. Type language code or name. Use arrow keys to navigate suggestions.'
      : 'Target language input. Type language code or name. Use arrow keys to navigate suggestions.';
    input.setAttribute('aria-label', label);
    
    // Override the blur handler to maintain focus
    let isSelectingFromDropdown = false;
    
    input.addEventListener('blur', function(e) {
      if (self.activeLanguageInput === input) {
        // Check if focus is going to a dropdown item
        setTimeout(() => {
          const activeEl = document.activeElement;
          
          if (activeEl && (activeEl.classList.contains('x-boundlist-item') || 
                          activeEl.getAttribute('role') === 'option')) {
            console.log('tradosClarity: Focus on dropdown item, allowing selection');
            isSelectingFromDropdown = true;
            return;
          }
          
          // If we're still typing and not selecting from dropdown, refocus
          if (!isSelectingFromDropdown && self.activeLanguageInput === input) {
            console.log('tradosClarity: Refocusing language input');
            input.focus();
            if (self.isTargetField) {
              const pos = input.value.length;
              input.setSelectionRange(pos, pos);
            }
          }
        }, 10);
      }
    }, true);
    
    // For target field, aggressively prevent selection
    if (this.isTargetField) {
      console.log('tradosClarity: Configuring target field special handling');
      
      // Enable selection prevention
      this.preventSelection = true;
      
      // Override selection-related properties
      input.style.userSelect = 'text';  // Allow typing but we'll control selection
      
      // Prevent mouseup selection
      input.addEventListener('mouseup', function(e) {
        if (self.activeLanguageInput === input) {
          e.preventDefault();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      }, true);
      
      // Monitor and fix selection continuously
      const selectionGuard = setInterval(() => {
        if (self.activeLanguageInput === input && self.isTargetField) {
          // Check if text is selected
          if (input.selectionStart !== input.selectionEnd) {
            console.log('tradosClarity: Fixing unwanted selection in target field');
            const len = input.value.length;
            input.setSelectionRange(len, len);
          }
        } else {
          clearInterval(selectionGuard);
        }
      }, 50);
      
      // Store interval for cleanup
      input._selectionGuard = selectionGuard;
      
      // Handle input with immediate cursor positioning
      input.addEventListener('input', function(e) {
        self.lastInputValue = input.value;
        console.log('tradosClarity: Target language input value:', input.value);
        
        // Immediately move cursor to end
        const len = input.value.length;
        input.setSelectionRange(len, len);
        
        // Keep this input active
        self.activeLanguageInput = input;
        
        // Double-check no selection
        requestAnimationFrame(() => {
          if (self.activeLanguageInput === input) {
            const len2 = input.value.length;
            input.setSelectionRange(len2, len2);
          }
        });
      }, true);
      
      // Intercept all selection attempts
      const preventSelectionHandler = function(e) {
        if (self.activeLanguageInput === input && self.isTargetField) {
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      };
      
      input.addEventListener('select', preventSelectionHandler, true);
      input.addEventListener('selectstart', preventSelectionHandler, true);
      
    } else {
      // Source field - original handling (working well)
      input.addEventListener('input', function(e) {
        self.lastInputValue = input.value;
        console.log('tradosClarity: Source language input value:', input.value);
        
        // Keep this input active
        self.activeLanguageInput = input;
        
        // Ensure focus stays on input
        if (document.activeElement !== input) {
          input.focus();
        }
      });
    }
    
    // Handle keyboard navigation (common for both)
    input.addEventListener('keydown', function(e) {
      // For target field, ensure no selection before typing
      if (self.isTargetField && e.key.length === 1) {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
      
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          // Allow dropdown navigation but keep input as active
          console.log('tradosClarity: Arrow key pressed, allowing dropdown navigation');
          isSelectingFromDropdown = true;
          break;
          
        case 'Enter':
          // Selection made
          console.log('tradosClarity: Enter pressed, selection complete');
          self.activeLanguageInput = null;
          self.preventSelection = false;
          
          // Clean up selection guard
          if (input._selectionGuard) {
            clearInterval(input._selectionGuard);
          }
          
          const value = input.value;
          if (value) {
            self.announce(`${fieldType} language selected: ${value}`);
          }
          break;
          
        case 'Tab':
          // Moving to next field
          console.log('tradosClarity: Tab pressed, moving to next field');
          self.activeLanguageInput = null;
          self.preventSelection = false;
          
          // Clean up selection guard
          if (input._selectionGuard) {
            clearInterval(input._selectionGuard);
          }
          break;
          
        case 'Escape':
          // Cancel
          console.log('tradosClarity: Escape pressed, cancelling');
          self.activeLanguageInput = null;
          self.preventSelection = false;
          
          // Clean up selection guard
          if (input._selectionGuard) {
            clearInterval(input._selectionGuard);
          }
          break;
          
        default:
          // Regular typing
          if (e.key.length === 1) {
            isSelectingFromDropdown = false;
          }
          break;
      }
    });
    
    // Watch for value changes from dropdown selection
    const valueWatcher = setInterval(() => {
      if (input.value !== self.lastInputValue) {
        self.lastInputValue = input.value;
        
        // Check if it looks like a complete selection
        if (input.value.includes(' - ') || /\b[a-z]{2}[-_][A-Z]{2}\b/.test(input.value)) {
          console.log('tradosClarity: Language selected from dropdown:', input.value);
          clearInterval(valueWatcher);
        }
      }
      
      // Stop watching after 30 seconds
      if (!document.body.contains(input) || !self.activeLanguageInput) {
        clearInterval(valueWatcher);
      }
    }, 100);
    
    // Focus and announce
    input.focus();
    if (this.isTargetField) {
      // Ensure no initial selection
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
    this.announce(label);
    
    // Clean up when input is removed
    const observer = new MutationObserver((mutations) => {
      if (!document.body.contains(input)) {
        console.log('tradosClarity: Language input removed from DOM');
        if (this.activeLanguageInput === input) {
          this.activeLanguageInput = null;
          this.preventSelection = false;
        }
        if (input._selectionGuard) {
          clearInterval(input._selectionGuard);
        }
        clearInterval(valueWatcher);
        observer.disconnect();
      }
    });
    
    observer.observe(input.parentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

  handleGridKeydown(event, gridCell) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const emptyCell = gridCell.querySelector('.x-grid-empty-cell') ? gridCell : gridCell.closest('.x-grid-empty-cell');
      if (emptyCell) {
        this.handleEmptyCellClick(emptyCell, event);
      }
    }
  }

  determineFieldType(cell) {
    // Check by position in row
    const row = cell.closest('tr');
    if (row) {
      const cells = Array.from(row.querySelectorAll('td'));
      const index = cells.indexOf(cell);
      return index === 0 ? 'source' : 'target';
    }
    
    // Fallback to classes
    if (cell.classList.contains('x-grid-cell-first')) return 'source';
    if (cell.classList.contains('x-grid-cell-targets')) return 'target';
    
    return 'unknown';
  }

  enhanceEmptyCell(cell) {
    if (cell.hasAttribute('data-trados-enhanced')) return;
    
    cell.setAttribute('data-trados-enhanced', 'true');
    
    const fieldType = this.determineFieldType(cell);
    const label = fieldType === 'source'
      ? 'Source language, empty. Press Enter to select.'
      : 'Target language, empty. Press Enter to select.';
    
    cell.setAttribute('aria-label', label);
    cell.setAttribute('tabindex', '0');
    
    cell.addEventListener('focus', () => {
      cell.style.outline = '2px solid #0066cc';
      cell.style.outlineOffset = '-2px';
    });
    
    cell.addEventListener('blur', () => {
      cell.style.outline = '';
    });
  }

  enhanceLanguageGrid(grid) {
    if (this.enhancedGrids.has(grid)) return;
    
    console.log('tradosClarity: Enhancing language pairs grid');
    this.enhancedGrids.add(grid);
    
    const emptyCells = grid.querySelectorAll('.x-grid-empty-cell');
    emptyCells.forEach(cell => this.enhanceEmptyCell(cell));
    
    if (!grid.getAttribute('aria-label')) {
      grid.setAttribute('aria-label', 'Language pairs grid. Navigate with arrows, press Enter to select languages.');
    }
  }

  isLanguagePairsGrid(element) {
    if (!element) return false;
    
    return element.classList.contains('language-pairs-grid') ||
           element.id.includes('tmlanguagepairsgridpanel') ||
           element.closest('.language-pairs-grid') !== null;
  }

  isInLanguagePairsGrid(element) {
    return element.closest('.language-pairs-grid, [id*="tmlanguagepairsgridpanel"]') !== null;
  }

  enhanceExistingGrids() {
    const grids = document.querySelectorAll('.language-pairs-grid, [id*="tmlanguagepairsgridpanel"]');
    grids.forEach(grid => this.enhanceLanguageGrid(grid));
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (this.isLanguagePairsGrid(node)) {
              this.enhanceLanguageGrid(node);
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

  isVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  announce(message) {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'trados-live-region';
    announcer.style.cssText = 'position: absolute !important; left: -10000px !important;';
    announcer.textContent = message;
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 3000);
  }
}

// Initialize the extension
console.log('tradosClarity: Initializing...');
new TradosClarity();
