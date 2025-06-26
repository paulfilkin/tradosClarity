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
          text: target.textContent?.trim()
        });
        
        if (this.isSplitButton(target)) {
          console.log('tradosClarity: Split button activated:', target.id);
          setTimeout(() => this.findAndEnhanceDropdown(), 100);
        } else {
          console.log('tradosClarity: Not a split button');
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
        text: target.textContent?.trim()
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
    
    // Look specifically for Import History panels (including hidden ones)
    const importHistoryPanels = document.querySelectorAll(`
      [id*="import-history"]:not([data-trados-enhanced]),
      [id*="tm-import-history"]:not([data-trados-enhanced])
    `);
    
    console.log('tradosClarity: Found', importHistoryPanels.length, 'import history specific panels');
    
    for (const panel of importHistoryPanels) {
      console.log('tradosClarity: Import History panel found:', {
        id: panel.id,
        visible: this.isVisible(panel),
        display: panel.style.display,
        visibility: panel.style.visibility,
        offsetParent: !!panel.offsetParent
      });
      
      // If the panel exists but is hidden, try to show it
      if (!this.isVisible(panel)) {
        console.log('tradosClarity: Attempting to show hidden Import History panel');
        this.tryToShowPanel(panel);
        
        // Check if it's visible now
        setTimeout(() => {
          if (this.isVisible(panel)) {
            console.log('tradosClarity: Successfully showed Import History panel');
            this.enhanceImportPanel(panel);
          } else {
            console.log('tradosClarity: Could not show Import History panel');
          }
        }, 200);
        return true;
      } else {
        console.log('tradosClarity: Found visible Import History panel:', panel.id);
        this.enhanceImportPanel(panel);
        return true;
      }
    }
    
    // Look for panels that contain "Import History" text (including hidden ones)
    const allPanels = document.querySelectorAll('.x-panel:not([data-trados-enhanced]), .x-window:not([data-trados-enhanced]), .x-tip:not([data-trados-enhanced])');
    
    console.log('tradosClarity: Checking', allPanels.length, 'general panels for Import History text');
    
    for (const panel of allPanels) {
      const text = panel.textContent || '';
      if (text.includes('Import History')) {
        console.log('tradosClarity: Found panel with Import History text:', panel.id || panel.className, 'visible:', this.isVisible(panel));
        
        if (!this.isVisible(panel)) {
          this.tryToShowPanel(panel);
          setTimeout(() => {
            if (this.isVisible(panel)) {
              this.enhanceImportPanel(panel);
            }
          }, 200);
        } else {
          this.enhanceImportPanel(panel);
        }
        return true;
      }
    }
    
    // Last resort - look for any recently shown dropdown
    const dropdownMenus = document.querySelectorAll(`
      .x-menu:not([data-trados-enhanced]):not([style*="display: none"]):not([style*="visibility: hidden"]),
      .x-boundlist:not([data-trados-enhanced]):not([style*="display: none"]):not([style*="visibility: hidden"])
    `);

    console.log('tradosClarity: Found', dropdownMenus.length, 'dropdown menus as fallback');

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

  tryToShowPanel(panel) {
    console.log('tradosClarity: Trying to show panel:', panel.id);
    
    // Method 1: Remove display/visibility styles
    panel.style.display = '';
    panel.style.visibility = '';
    
    // Method 2: Set explicit visible styles
    if (!this.isVisible(panel)) {
      panel.style.display = 'block';
      panel.style.visibility = 'visible';
    }
    
    // Method 3: Look for parent containers that might be hidden
    let parent = panel.parentElement;
    while (parent && parent !== document.body) {
      if (parent.style.display === 'none' || parent.style.visibility === 'hidden') {
        console.log('tradosClarity: Found hidden parent:', parent.id || parent.className);
        parent.style.display = '';
        parent.style.visibility = '';
      }
      parent = parent.parentElement;
    }
    
    // Method 4: Try to trigger show via ExtJS (if it has show method)
    try {
      if (panel.show && typeof panel.show === 'function') {
        panel.show();
      }
    } catch (e) {
      // Ignore errors
    }
  }

  looksLikeImportPanel(element) {
    // Check if this element or its children contain "Import History" text
    const text = element.textContent || '';
    const hasImportHistory = text.includes('Import History');
    
    // Check for specific import-related IDs
    const id = element.id || '';
    const hasImportId = id.includes('import-history') || id.includes('tm-import-history');
    
    // Check if it has the typical panel structure
    const hasHeader = element.querySelector('.x-panel-header, .x-header');
    const hasGrid = element.querySelector('[role="grid"], .x-grid');
    
    // More specific check - look for the exact "Import History" title
    const hasImportTitle = element.querySelector('[id*="import-history"][id*="title"]') ||
                          element.querySelector('.x-title-text, .x-panel-header-title')?.textContent?.includes('Import History');
    
    console.log('tradosClarity: Panel check - hasImportHistory:', hasImportHistory, 'hasHeader:', !!hasHeader, 'hasGrid:', !!hasGrid, 'hasImportId:', hasImportId, 'hasImportTitle:', !!hasImportTitle, 'element:', element.id);
    
    // Only consider it an import panel if it has "Import History" in text OR has import-specific ID
    return hasImportHistory || hasImportId || hasImportTitle;
  }

  enhanceImportPanel(panel) {
    console.log('tradosClarity: Enhancing Import History panel:', panel.id);
    panel.setAttribute('data-trados-enhanced', 'true');

    // Make the panel focusable and accessible
    if (!panel.getAttribute('role')) {
      panel.setAttribute('role', 'dialog');
    }
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('tabindex', '0');

    // Find the Import History title specifically
    const importTitle = panel.querySelector('[id*="import-history"][id*="title"]') ||
                       Array.from(panel.querySelectorAll('.x-title-text, .x-panel-header-title')).find(el => 
                         el.textContent?.includes('Import History'));

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

    // CRITICAL: Focus management - move focus into the panel immediately
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
    }, 200); // Longer delay to ensure panel is fully rendered
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
    elements.forEach((element, index) => {
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
          console.log('tradosClarity: Closing panel with Escape');
          this.forceClosePanel(panel);
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

  forceClosePanel(panel) {
    console.log('tradosClarity: Attempting to close panel');
    
    // Remove our event listener
    if (panel._tradosKeyHandler) {
      document.removeEventListener('keydown', panel._tradosKeyHandler, true);
      delete panel._tradosKeyHandler;
    }
    
    // Try to find and click close button
    const closeSelectors = [
      '.x-tool-close',
      '.x-btn-close', 
      '[aria-label*="close"]',
      '[title*="close"]',
      '.close',
      'button[onclick*="close"]'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = panel.querySelector(selector);
      if (closeBtn) {
        console.log('tradosClarity: Found close button:', selector);
        closeBtn.click();
        return;
      }
    }

    // Try hiding the panel
    panel.style.display = 'none';
    panel.style.visibility = 'hidden';
    
    // Try removing if it seems to be a floating panel
    const style = window.getComputedStyle(panel);
    if (style.position === 'absolute' || style.position === 'fixed') {
      try {
        panel.remove();
      } catch (e) {
        console.log('tradosClarity: Could not remove panel');
      }
    }

    // Click outside as last resort
    setTimeout(() => {
      console.log('tradosClarity: Clicking outside to close panel');
      const outsideClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      });
      document.body.dispatchEvent(outsideClick);
    }, 100);
  }

  ensureId(element, prefix) {
    if (!element.id) {
      element.id = prefix + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
  }

  handleEscapeKey(e) {
    console.log('tradosClarity: Escape key pressed');
    
    // Look for any visible menus or dropdowns
    const visibleMenus = document.querySelectorAll(`
      .x-menu:not([style*="display: none"]):not([style*="visibility: hidden"]),
      .x-boundlist:not([style*="display: none"]):not([style*="visibility: hidden"]),
      .x-panel:not([style*="display: none"]):not([style*="visibility: hidden"]),
      [role="menu"]:not([style*="display: none"]):not([style*="visibility: hidden"]),
      [role="listbox"]:not([style*="display: none"]):not([style*="visibility: hidden"]),
      .dropdown-menu:not([style*="display: none"]):not([style*="visibility: hidden"])
    `);

    let closedAny = false;
    
    visibleMenus.forEach(menu => {
      if (this.isVisible(menu)) {
        console.log('tradosClarity: Closing menu:', menu);
        this.forceCloseMenu(menu);
        closedAny = true;
      }
    });

    if (closedAny) {
      e.preventDefault();
      e.stopPropagation();
      console.log('tradosClarity: Menus closed with Escape');
    }
  }

  forceCloseMenu(menu) {
    // Try multiple approaches to close ExtJS menus
    
    // Method 1: Look for close button or tool
    const closeBtn = menu.querySelector('.x-tool-close, .x-btn-close, [aria-label*="close"]');
    if (closeBtn) {
      closeBtn.click();
      return;
    }

    // Method 2: Hide the menu
    menu.style.display = 'none';
    menu.style.visibility = 'hidden';
    
    // Method 3: Try to remove if it's a floating menu
    const style = window.getComputedStyle(menu);
    if (style.position === 'absolute' || style.position === 'fixed') {
      try {
        menu.remove();
      } catch (e) {
        // Ignore errors
      }
    }

    // Method 4: Click outside to close
    setTimeout(() => {
      const outsideClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      });
      document.body.dispatchEvent(outsideClick);
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

  closeAnyVisibleDropdowns() {
    const dropdowns = document.querySelectorAll('.x-menu, .dropdown-menu, [role="menu"], .x-boundlist');
    let closedAny = false;
    
    dropdowns.forEach(dropdown => {
      if (this.isVisible(dropdown)) {
        this.closeDropdown(dropdown);
        closedAny = true;
      }
    });

    if (closedAny) {
      console.log('tradosClarity: Closed dropdowns with Escape');
    }
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
new TradosClarity();
