// Enhanced techniques integrated into your existing content.js

class TradosTourAccessibility {
  constructor() {
    this.observer = null;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.activePopover = null;
    this.shortcuts = {};
    this.liveRegions = {}; // NEW: Multiple live regions
    
    console.log('tradosClarity: Initializing for help-tour-popover elements');
    this.init();
  }

  init() {
    // ENHANCED: Set up multiple live regions first
    this.setupEnhancedLiveRegions();
    
    // Load shortcuts from storage
    this.loadShortcuts();
    
    // Set up message listener for popup communication
    this.setupMessageListener();
    
    // Check for existing tour popovers immediately and repeatedly
    this.enhanceExistingPopovers();
    
    // Set up a more aggressive initial scan with retries
    this.setupInitialScan();
    
    // Set up mutation observer for dynamically added popovers
    this.setupMutationObserver();
    
    // Set up global keyboard handlers
    this.setupKeyboardHandlers();
    
    // ENHANCED: Better focus management
    this.setupEnhancedFocusManagement();
    
    // Check for important action buttons
    this.announceImportantButtons();

    // Initialize split button enhancer
    this.splitButtonEnhancer = new SplitButtonEnhancer();
    
    // ENHANCED: Monitor for interactive elements without proper accessibility
    this.setupInteractiveElementEnhancement();
  }

  // NEW: Enhanced live regions system
  setupEnhancedLiveRegions() {
    this.liveRegions = {
      polite: this.createLiveRegion('polite'),
      assertive: this.createLiveRegion('assertive'),
      status: this.createLiveRegion('polite', 'status')
    };
    
    // Make announcement methods available globally for debugging
    window.tradosClarity = window.tradosClarity || {};
    window.tradosClarity.announce = {
      polite: (message) => this.announce(this.liveRegions.polite, message),
      assertive: (message) => this.announce(this.liveRegions.assertive, message),
      status: (message) => this.announce(this.liveRegions.status, message)
    };
  }

  createLiveRegion(politeness, role = null) {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    if (role) region.setAttribute('role', role);
    
    // Ensure it's hidden but accessible
    region.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      white-space: nowrap !important;
    `;
    
    document.body.appendChild(region);
    return region;
  }

  announce(region, message, delay = 0) {
    setTimeout(() => {
      // Clear first, then announce (helps with repeated messages)
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
        console.log(`tradosClarity: Announced (${region.getAttribute('aria-live')}): ${message}`);
      }, 50);
    }, delay);
  }

  // ENHANCED: Replace your existing announceMessage method
  announceMessage(message, type = 'polite') {
    switch (type) {
      case 'assertive':
        this.announce(this.liveRegions.assertive, message);
        break;
      case 'status':
        this.announce(this.liveRegions.status, message);
        break;
      default:
        this.announce(this.liveRegions.polite, message);
    }
  }

  // ENHANCED: Replace your existing announceTourStart method
  announceTourStart(popover) {
    console.log('tradosClarity: Attempting to announce tour start');
    
    let message = 'Tour started. ';
    
    if (this.currentStep && this.totalSteps) {
      message += `This is a ${this.totalSteps} step guided tour. `;
    } else {
      message += 'A guided tour is now available. ';
    }
    
    message += 'Press Escape to skip the tour, or use arrow keys to navigate through the steps.';
    
    console.log('tradosClarity: Tour start message:', message);
    
    // Use assertive for immediate attention
    this.announce(this.liveRegions.assertive, message);
  }

  // ENHANCED: Better focus management
  setupEnhancedFocusManagement() {
    let lastFocusedElement = null;
    
    document.addEventListener('focusin', (e) => {
      lastFocusedElement = e.target;
      this.enhanceFocusedElement(e.target);
    });
    
    // Store reference for returning focus
    this.returnFocus = () => {
      if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
        this.announceMessage(`Focus returned to ${this.getElementDescription(lastFocusedElement)}`, 'status');
      }
    };
  }

  enhanceFocusedElement(element) {
    // Add temporary enhanced focus indicator if needed
    if (!element.getAttribute('aria-label') && !element.textContent.trim() && element.tagName !== 'BODY') {
      const role = element.getAttribute('role') || element.tagName.toLowerCase();
      element.setAttribute('aria-label', `${role} element`);
      element.setAttribute('data-trados-temp-label', 'true'); // Mark for cleanup
    }
    
    // Ensure focusable elements have proper roles
    if (element.onclick && !element.getAttribute('role')) {
      element.setAttribute('role', 'button');
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    }
  }

  // ENHANCED: Your existing focusImportantActionButton with better announcements
  focusImportantActionButton() {
    console.log('tradosClarity: focusImportantActionButton called');
    
    if (this.importantActionButton && document.body.contains(this.importantActionButton)) {
      console.log('tradosClarity: Focusing stored important action button');
      
      // Scroll into view if needed
      this.importantActionButton.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the button
      setTimeout(() => {
        this.importantActionButton.focus();
        
        // ENHANCED: Better announcement
        const text = this.importantActionButton.textContent?.trim() || 'action button';
        this.announceMessage(`Focused "${text}" button. Press Enter to activate.`, 'assertive');
        
      }, 100);
    } else {
      // Try to find the button again with enhanced search
      this.performEnhancedButtonSearch();
    }
  }

  performEnhancedButtonSearch() {
    console.log('tradosClarity: Performing enhanced button search');
    
    // Enhanced search with better selectors
    const buttonSelectors = [
      '#button-1046',
      '.x-btn:not([disabled])',
      'button:not([disabled])',
      '[role="button"]:not([disabled])',
      '.dap-btn-done',
      '[class*="accept"]:not([disabled])',
      '[class*="complete"]:not([disabled])'
    ];
    
    for (const selector of buttonSelectors) {
      const buttons = document.querySelectorAll(selector);
      
      for (const button of buttons) {
        if (this.isImportantActionButton(button) && button.offsetParent !== null) {
          console.log(`tradosClarity: Found important button via ${selector}:`, button);
          
          this.importantActionButton = button;
          
          button.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          setTimeout(() => {
            button.focus();
            const text = button.textContent?.trim() || 'action button';
            this.announceMessage(`Focused "${text}" button. Press Enter to activate.`, 'assertive');
          }, 100);
          
          return; // Found and focused, exit
        }
      }
    }
    
    console.log('tradosClarity: No important action button found');
    this.announceMessage('No important action button found on this page.', 'polite');
  }

  isImportantActionButton(button) {
    const text = button.textContent?.trim().toLowerCase() || '';
    const className = button.className?.toLowerCase() || '';
    const id = button.id?.toLowerCase() || '';
    
    const importantKeywords = ['accept', 'complete', 'finish', 'submit', 'save', 'done'];
    const importantClasses = ['dap-btn-done', 'primary', 'success'];
    
    return importantKeywords.some(keyword => 
      text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
    ) || importantClasses.some(cls => className.includes(cls));
  }

  // NEW: Enhanced interactive element monitoring
  setupInteractiveElementEnhancement() {
    // Check for elements that need accessibility enhancement
    const enhanceInterval = setInterval(() => {
      this.enhanceInteractiveElements();
    }, 3000);
    
    // Stop after 30 seconds to avoid performance impact
    setTimeout(() => clearInterval(enhanceInterval), 30000);
  }

  enhanceInteractiveElements() {
    // Find interactive elements without proper accessibility
    const interactiveSelectors = [
      'div[onclick]:not([role])',
      'span[onclick]:not([role])',
      '[class*="button"]:not(button):not([role])',
      '[class*="btn"]:not(button):not([role])',
      '[class*="clickable"]:not([role])'
    ];
    
    interactiveSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (!element.hasAttribute('data-trados-enhanced')) {
          this.enhanceInteractiveElement(element);
          element.setAttribute('data-trados-enhanced', 'true');
        }
      });
    });
  }

enhanceInteractiveElement(element) {
  // ENHANCED: Skip if this element is inside ANY split button (enhanced or not)
  if (element.closest('.x-split-button')) {
    console.log('tradosClarity: Skipping element inside split button:', element);
    return;
  }
  
  // Skip if this element has a presentation role (it's decorative)
  if (element.getAttribute('role') === 'presentation') {
    console.log('tradosClarity: Skipping presentation element:', element);
    return;
  }
  
  // Skip if this element is already properly accessible
  if (element.tagName === 'A' && element.getAttribute('role') === 'button' && element.hasAttribute('tabindex')) {
    console.log('tradosClarity: Skipping already accessible button:', element);
    return;
  }
  
  // Skip if this element is part of an import dialog we're managing
  if (element.closest('[data-import-dialog-enhanced]')) {
    console.log('tradosClarity: Skipping element inside enhanced import dialog:', element);
    return;
  }
  
  // Skip specific ExtJS button inner elements that are causing issues
  if (element.classList.contains('x-btn-inner')) {
    console.log('tradosClarity: Skipping x-btn-inner element:', element);
    return;
  }
  
  // ENHANCED: Skip any element that already has keyboard handlers
  if (element.hasAttribute('data-keyboard-added') || element.hasAttribute('data-trados-enhanced')) {
    console.log('tradosClarity: Skipping already enhanced element:', element);
    return;
  }
  
  console.log('tradosClarity: Enhancing interactive element:', element);
  
  // Add role if missing
  if (!element.getAttribute('role')) {
    element.setAttribute('role', 'button');
  }
  
  // Add tabindex if missing
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  
  // Add keyboard support
  if (!element.hasAttribute('data-keyboard-added')) {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
        
        // Announce the action
        const description = this.getElementDescription(element);
        this.announceMessage(`Activated ${description}`, 'status');
      }
    });
    element.setAttribute('data-keyboard-added', 'true');
  }
  
  // Add accessible name if missing
  if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
    const className = element.className;
    const presumedFunction = this.guessElementFunction(element);
    element.setAttribute('aria-label', presumedFunction || 'Interactive element');
  }
}

// Replace your existing guessElementFunction method with this fixed version

  guessElementFunction(element) {
    // FIXED: Safely get className as string
    const className = (element.className && typeof element.className === 'string') 
      ? element.className.toLowerCase() 
      : (element.className?.toString() || '').toLowerCase();
      
    const parentText = element.parentElement?.textContent?.trim() || '';
    
    if (className.includes('close')) return 'Close';
    if (className.includes('menu')) return 'Menu';
    if (className.includes('expand')) return 'Expand';
    if (className.includes('collapse')) return 'Collapse';
    if (parentText.length > 0 && parentText.length < 50) return parentText;
    
    return null;
  }

  // ENHANCED: Better element description
  getElementDescription(element) {
    const label = element.getAttribute('aria-label') || 
                 element.getAttribute('title') ||
                 element.textContent?.trim() || 
                 element.getAttribute('alt') ||
                 'element';
    
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    
    return `${label} ${role}`.trim();
  }

  // ENHANCED: Your existing restartProductTours with better feedback
  restartProductTours() {
    console.log('tradosClarity: Restarting product tours...');
    
    // Announce start of process
    this.announceMessage('Clearing tour data, please wait...', 'assertive');
    
    try {
      // ... your existing tour clearing logic ...
      
      console.log(`tradosClarity: Tour restart complete. Cleared ${clearedCount} items.`);
      
      // ENHANCED: Better user feedback
      let message;
      if (clearedCount > 0) {
        message = `Success! Cleared ${clearedCount} tour items. Page will refresh in 3 seconds to restart tours.`;
        
        this.announceMessage(message, 'assertive');
        this.showVisualNotification(message, 'success');
        
        // Countdown announcements
        setTimeout(() => this.announceMessage('Refreshing in 2 seconds...', 'status'), 1000);
        setTimeout(() => this.announceMessage('Refreshing in 1 second...', 'status'), 2000);
        
        setTimeout(() => {
          console.log('tradosClarity: Refreshing page to restart tours...');
          window.location.reload();
        }, 3000);
        
      } else {
        message = 'No tour data found to clear. Tours may already be reset.';
        this.announceMessage(message, 'polite');
        this.showVisualNotification(message, 'info');
      }
      
    } catch (error) {
      console.error('tradosClarity: Error restarting tours:', error);
      this.announceMessage('Error occurred while trying to restart tours.', 'assertive');
      this.showVisualNotification('Error occurred while trying to restart tours.', 'error');
    }
  }

  // ENHANCED: Your existing setupMutationObserver with better content detection
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node is a tour popover
              if (node.getAttribute('data-testid') === 'help-tour-popover') {
                console.log('tradosClarity: New tour popover detected');
                this.enhancePopover(node);
              }
              
              // Check if any child elements are tour popovers
              const childPopovers = node.querySelectorAll?.('[data-testid="help-tour-popover"]');
              if (childPopovers?.length > 0) {
                console.log(`tradosClarity: ${childPopovers.length} tour popovers found in added content`);
                childPopovers.forEach(popover => this.enhancePopover(popover));
              }
              
              // ENHANCED: Check for other important new content
              this.handleNewContent(node);
            }
          });
        }
        
        // ENHANCED: Monitor attribute changes for state announcements
        if (mutation.type === 'attributes') {
          this.handleAttributeChange(mutation);
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // ENHANCED: Monitor attribute changes
      attributeFilter: ['aria-expanded', 'aria-selected', 'aria-checked', 'disabled', 'aria-hidden']
    });
  }

  // NEW: Handle new content for announcements
  handleNewContent(element) {
    // Check for important new content that should be announced
    const importantSelectors = [
      '[role="alert"]',
      '[role="status"]',
      '.alert',
      '.notification',
      '.error',
      '.success',
      '.warning',
      '.toast',
      '.message'
    ];
    
    importantSelectors.forEach(selector => {
      const matches = element.matches?.(selector) ? [element] : element.querySelectorAll?.(selector) || [];
      matches.forEach(match => {
        if (match.offsetParent !== null) { // Only visible elements
          const text = match.textContent.trim();
          if (text && text.length > 0) {
            const role = match.getAttribute('role') || 'notification';
            this.announceMessage(`New ${role}: ${text}`, 'assertive');
          }
        }
      });
    });
  }

  // NEW: Handle attribute changes for state announcements
  handleAttributeChange(mutation) {
    const element = mutation.target;
    const attribute = mutation.attributeName;
    const newValue = element.getAttribute(attribute);
    const oldValue = mutation.oldValue;
    
    // Only announce if value actually changed and element is visible
    if (newValue !== oldValue && element.offsetParent !== null) {
      switch (attribute) {
        case 'aria-expanded':
          const expandedState = newValue === 'true' ? 'expanded' : 'collapsed';
          this.announceMessage(
            `${this.getElementDescription(element)} ${expandedState}`, 'status'
          );
          break;
          
        case 'aria-selected':
          if (newValue === 'true') {
            this.announceMessage(
              `${this.getElementDescription(element)} selected`, 'status'
            );
          }
          break;
          
        case 'disabled':
          const disabledState = element.disabled ? 'disabled' : 'enabled';
          this.announceMessage(
            `${this.getElementDescription(element)} ${disabledState}`, 'status'
          );
          break;
          
        case 'aria-hidden':
          if (newValue === 'false' || newValue === null) {
            // Element became visible
            const text = element.textContent?.trim();
            if (text && text.length > 0 && text.length < 200) {
              this.announceMessage(`Content appeared: ${text}`, 'polite');
            }
          }
          break;
      }
    }
  }

  async loadShortcuts() {
    try {
      const result = await chrome.storage.sync.get('tradosShortcuts');
      this.shortcuts = result.tradosShortcuts || {
        focusActionButton: { key: 'a', alt: true, shift: true, ctrl: false },
        restartTours: { key: 'r', alt: true, shift: true, ctrl: false }
      };
      console.log('tradosClarity: Loaded shortcuts:', this.shortcuts);
    } catch (error) {
      console.error('tradosClarity: Error loading shortcuts:', error);
      // Use defaults if loading fails
      this.shortcuts = {
        focusActionButton: { key: 'a', alt: true, shift: true, ctrl: false },
        restartTours: { key: 'r', alt: true, shift: true, ctrl: false }
      };
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('tradosClarity: Received message:', message);
      
      switch (message.type) {
        case 'executeAction':
          this.handleAction(message.action);
          sendResponse({ success: true });
          break;
          
        case 'shortcutsUpdated':
          this.shortcuts = message.shortcuts;
          console.log('tradosClarity: Updated shortcuts:', this.shortcuts);
          sendResponse({ success: true });
          break;
          
        default:
          console.log('tradosClarity: Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    });
  }

  handleAction(action) {
    console.log(`tradosClarity: Executing action: ${action}`);
    
    switch (action) {
      case 'focusActionButton':
        this.focusImportantActionButton();
        break;
        
      case 'restartTours':
        this.restartProductTours();
        break;
        
      default:
        console.error(`tradosClarity: Unknown action: ${action}`);
    }
  }

  restartProductTours() {
    console.log('tradosClarity: Restarting product tours...');
    
    try {
      // Common tour progress keys to clear
      const tourKeys = [
        // Trados-specific keys (based on actual data seen)
        'ue_', // All ue_ prefixed keys (ue_ConfirmSegmentTour, etc.)
        
        // Generic tour keys
        'tour_progress',
        'tour_completed',
        'tour_state',
        'help_tour',
        'product_tour',
        'onboarding_tour',
        'guided_tour',
        'tutorial_progress',
        'walkthrough_state',
        
        // Trados-specific keys (common patterns)
        'trados_tour',
        'trados_help',
        'trados_onboarding',
        'cloud_tour',
        'editor_tour',
        'workflow_tour',
        'project_tour',
        
        // Pattern-based clearing for numbered/dated tours
        'tour_',
        'help_',
        'guide_',
        'intro_',
        'first_',
        'welcome_',
        
        // Framework-specific tour libraries
        'shepherd-tour',
        'hopscotch',
        'intro.js',
        'driver.js',
        'reactour',
        'enjoyhint'
      ];
      
      let clearedCount = 0;
      
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        console.log('tradosClarity: Scanning localStorage for tour data...');
        const localStorageKeys = Object.keys(localStorage);
        
        localStorageKeys.forEach(key => {
          const lowerKey = key.toLowerCase();
          const shouldRemove = tourKeys.some(pattern => {
            if (pattern.endsWith('_')) {
              return lowerKey.startsWith(pattern);
            }
            return lowerKey.includes(pattern);
          });
          
          if (shouldRemove) {
            console.log(`tradosClarity: Removing localStorage key: ${key}`);
            localStorage.removeItem(key);
            clearedCount++;
          }
        });
      }
      
      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        console.log('tradosClarity: Scanning sessionStorage for tour data...');
        const sessionStorageKeys = Object.keys(sessionStorage);
        
        sessionStorageKeys.forEach(key => {
          const lowerKey = key.toLowerCase();
          const shouldRemove = tourKeys.some(pattern => {
            if (pattern.endsWith('_')) {
              return lowerKey.startsWith(pattern);
            }
            return lowerKey.includes(pattern);
          });
          
          if (shouldRemove) {
            console.log(`tradosClarity: Removing sessionStorage key: ${key}`);
            sessionStorage.removeItem(key);
            clearedCount++;
          }
        });
      }
      
      // Also clear some common cookie patterns (if we can access them)
      try {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [name] = cookie.split('=');
          const cleanName = name.trim().toLowerCase();
          
          const shouldRemove = tourKeys.some(pattern => {
            if (pattern.endsWith('_')) {
              return cleanName.startsWith(pattern);
            }
            return cleanName.includes(pattern);
          });
          
          if (shouldRemove) {
            console.log(`tradosClarity: Attempting to clear cookie: ${name.trim()}`);
            // Clear cookie by setting it to expire in the past
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            clearedCount++;
          }
        });
      } catch (error) {
        console.log('tradosClarity: Could not access cookies:', error);
      }
      
      console.log(`tradosClarity: Tour restart complete. Cleared ${clearedCount} items.`);
      
      // Announce the result
      let message;
      if (clearedCount > 0) {
        message = `Tour data cleared! ${clearedCount} items removed. Refreshing page to restart tours...`;
        
        this.announceMessage(message);
        this.showVisualNotification(message, 'success');
        
        // Refresh the page after a short delay to allow the user to see the notification
        setTimeout(() => {
          console.log('tradosClarity: Refreshing page to restart tours...');
          window.location.reload();
        }, 2000); // 2 second delay
        
      } else {
        message = 'No tour data found to clear. Tours may already be reset or use a different storage method.';
        this.announceMessage(message);
        this.showVisualNotification(message, 'info');
      }
      
    } catch (error) {
      console.error('tradosClarity: Error restarting tours:', error);
      this.announceMessage('Error occurred while trying to restart tours.');
      this.showVisualNotification('Error occurred while trying to restart tours.', 'error');
    }
  }

  showVisualNotification(message, type = 'info') {
    // Create a temporary visual notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'} !important;
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
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
    
    // Also make it clickable to dismiss
    notification.addEventListener('click', () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }

  setupInitialScan() {
    // Scan multiple times during page load to catch early tours
    const scanTimes = [100, 500, 1000, 2000, 3000];
    
    scanTimes.forEach(delay => {
      setTimeout(() => {
        console.log(`tradosClarity: Scanning for existing popovers at ${delay}ms`);
        this.enhanceExistingPopovers();
      }, delay);
    });
  }

  enhanceExistingPopovers() {
    const popovers = document.querySelectorAll('[data-testid="help-tour-popover"]');
    console.log(`tradosClarity: Found ${popovers.length} existing tour popovers`);
    
    popovers.forEach(popover => this.enhancePopover(popover));
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a tour popover
            if (node.getAttribute('data-testid') === 'help-tour-popover') {
              console.log('tradosClarity: New tour popover detected');
              this.enhancePopover(node);
            }
            
            // Check if any child elements are tour popovers
            const childPopovers = node.querySelectorAll?.('[data-testid="help-tour-popover"]');
            if (childPopovers?.length > 0) {
              console.log(`tradosClarity: ${childPopovers.length} tour popovers found in added content`);
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
    if (!popover || popover.hasAttribute('data-trados-enhanced')) {
      return; // Already enhanced or invalid
    }

    console.log('tradosClarity: Enhancing tour popover', popover);
    
    // Mark as enhanced
    popover.setAttribute('data-trados-enhanced', 'true');
    this.activePopover = popover;

    // Make popover accessible
    this.makePopoverAccessible(popover);
    
    // Extract and enhance content
    this.enhancePopoverContent(popover);
    
    // Enhance navigation buttons
    this.enhanceNavigationButtons(popover);
    
    // Set up step tracking
    this.updateStepTracking(popover);
    
    // Add dismissal instructions to the popover
    this.addDismissalInstructions(popover);
    
    // Focus and announce
    this.focusAndAnnounce(popover);
  }

  makePopoverAccessible(popover) {
    // Set proper ARIA attributes
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-modal', 'true');
    popover.setAttribute('tabindex', '0');
    
    // Ensure it's focusable
    if (!popover.hasAttribute('tabindex')) {
      popover.setAttribute('tabindex', '0');
    }

    // Add live region for announcements
    if (!popover.querySelector('.trados-live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.className = 'trados-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(1px, 1px, 1px, 1px) !important;
      `;
      popover.appendChild(liveRegion);
    }
  }

  enhancePopoverContent(popover) {
    // Find title/heading
    const title = this.findTitle(popover);
    if (title) {
      title.setAttribute('role', 'heading');
      title.setAttribute('aria-level', '1');
      const titleId = this.ensureId(title, 'tour-title');
      popover.setAttribute('aria-labelledby', titleId);
    }

    // Find content/description
    const content = this.findContent(popover);
    if (content) {
      const contentId = this.ensureId(content, 'tour-content');
      popover.setAttribute('aria-describedby', contentId);
    }

    // Look for step indicators
    const stepInfo = this.findStepInfo(popover);
    if (stepInfo) {
      this.currentStep = stepInfo.current;
      this.totalSteps = stepInfo.total;
    }
  }

  findTitle(popover) {
    // Common selectors for tour titles
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '[role="heading"]',
      '.title', '.heading', '.tour-title',
      '.popover-title', '.popover-header h1, .popover-header h2, .popover-header h3'
    ];
    
    for (const selector of titleSelectors) {
      const element = popover.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element;
      }
    }
    
    return null;
  }

  findContent(popover) {
    // Common selectors for tour content
    const contentSelectors = [
      '.popover-body', '.tour-content', '.content', '.description',
      'p', '.text', '.message'
    ];
    
    for (const selector of contentSelectors) {
      const element = popover.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element;
      }
    }
    
    // Fallback: find largest text node
    const textElements = Array.from(popover.querySelectorAll('*'))
      .filter(el => el.textContent?.trim() && el.children.length === 0)
      .sort((a, b) => b.textContent.length - a.textContent.length);
    
    return textElements[0] || null;
  }

  findStepInfo(popover) {
    // Look for step counter patterns
    const stepPatterns = [
      /step\s+(\d+)\s+of\s+(\d+)/i,
      /(\d+)\s*\/\s*(\d+)/,
      /(\d+)\s+of\s+(\d+)/i
    ];
    
    const allText = popover.textContent || '';
    
    for (const pattern of stepPatterns) {
      const match = allText.match(pattern);
      if (match) {
        return {
          current: parseInt(match[1]),
          total: parseInt(match[2])
        };
      }
    }
    
    return null;
  }

  enhanceNavigationButtons(popover) {
    // Find all interactive elements, not just buttons
    const interactiveElements = popover.querySelectorAll('button, a, [role="button"], [onclick], input[type="button"], .btn, .button');
    
    console.log(`tradosClarity: Found ${interactiveElements.length} interactive elements:`, interactiveElements);
    
    interactiveElements.forEach((element, index) => {
      if (element.hasAttribute('data-trados-enhanced')) return;
      element.setAttribute('data-trados-enhanced', 'true');

      const text = element.textContent?.trim().toLowerCase() || '';
      const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
      const title = element.title?.toLowerCase() || '';
      const className = element.className.toLowerCase();
      const id = element.id.toLowerCase();
      
      console.log(`tradosClarity: Button ${index + 1}: text="${text}", aria-label="${ariaLabel}", class="${className}", id="${id}"`);
      
      // Improve button labels based on content
      if (!element.getAttribute('aria-label')) {
        if (text.includes('next') || text.includes('continue') || text === '>' || 
            className.includes('next') || id.includes('next') ||
            text.includes('forward') || text.includes('proceed')) {
          element.setAttribute('aria-label', 'Next step');
          element.setAttribute('data-tour-action', 'next');
        } else if (text.includes('prev') || text.includes('back') || text === '<' ||
                   className.includes('prev') || className.includes('back') || 
                   id.includes('prev') || id.includes('back')) {
          element.setAttribute('aria-label', 'Previous step');
          element.setAttribute('data-tour-action', 'previous');
        } else if (text.includes('skip') || className.includes('skip') || id.includes('skip')) {
          element.setAttribute('aria-label', 'Skip tour');
          element.setAttribute('data-tour-action', 'skip');
        } else if (text.includes('done') || text.includes('finish') || text.includes('close') ||
                   text.includes('end') || text.includes('exit') ||
                   className.includes('close') || className.includes('finish') ||
                   id.includes('close') || id.includes('finish')) {
          element.setAttribute('aria-label', 'Finish tour');
          element.setAttribute('data-tour-action', 'close');
        }
      }
      
      // Ensure keyboard accessibility
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
          console.log('tradosClarity: Button clicked via keyboard:', element);
        }
      });
    });
  }

  updateStepTracking(popover) {
    if (!this.currentStep || !this.totalSteps) return;
    
    // Add or update step counter for screen readers
    let counter = popover.querySelector('.trados-step-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'trados-step-counter';
      counter.setAttribute('aria-live', 'polite');
      counter.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      `;
      popover.appendChild(counter);
    }
    
    counter.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
  }

  addDismissalInstructions(popover) {
    // Add hidden instructions for screen reader users
    let instructions = popover.querySelector('.trados-instructions');
    if (!instructions) {
      instructions = document.createElement('div');
      instructions.className = 'trados-instructions';
      instructions.setAttribute('aria-live', 'polite');
      instructions.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(1px, 1px, 1px, 1px) !important;
      `;
      instructions.textContent = 'Press Escape to dismiss this tour, or use arrow keys to navigate.';
      popover.appendChild(instructions);
    }
  }

  focusAndAnnounce(popover) {
    // Immediately announce that a tour has started
    this.announceTourStart(popover);
    
    // Focus the popover after a short delay
    setTimeout(() => {
      popover.focus();
      this.announceStep(popover);
    }, 100);
  }

  announceTourStart(popover) {
    console.log('tradosClarity: Attempting to announce tour start');
    
    // Create or use existing announcement region
    let announcer = document.getElementById('trados-tour-announcer');
    if (!announcer) {
      console.log('tradosClarity: Creating new announcer element');
      announcer = document.createElement('div');
      announcer.id = 'trados-tour-announcer';
      announcer.setAttribute('aria-live', 'assertive'); // Assertive for immediate announcement
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(1px, 1px, 1px, 1px) !important;
      `;
      document.body.appendChild(announcer);
    } else {
      console.log('tradosClarity: Using existing announcer element');
    }

    // Create the announcement message
    let message = 'Tour started. ';
    
    if (this.currentStep && this.totalSteps) {
      message += `This is a ${this.totalSteps} step guided tour. `;
    } else {
      message += 'A guided tour is now available. ';
    }
    
    message += 'Press Escape to skip the tour, or use arrow keys to navigate through the steps.';
    
    console.log('tradosClarity: Announcement message:', message);
    
    // Try multiple announcement strategies
    // Strategy 1: Direct announcement
    announcer.textContent = message;
    
    // Strategy 2: Delayed announcement (in case aria-live needs time)
    setTimeout(() => {
      console.log('tradosClarity: Delayed announcement attempt');
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    }, 100);
    
    // Clear the main announcement after a few seconds so it doesn't repeat
    setTimeout(() => {
      announcer.textContent = '';
    }, 3000);
  }

  announceStep(popover) {
    const liveRegion = popover.querySelector('.trados-live-region');
    if (!liveRegion) return;

    const title = this.findTitle(popover);
    const content = this.findContent(popover);
    
    let announcement = '';
    
    // Add step info
    if (this.currentStep && this.totalSteps) {
      announcement += `Tour step ${this.currentStep} of ${this.totalSteps}. `;
    } else {
      announcement += 'Tour step. ';
    }
    
    // Add title
    if (title) {
      announcement += title.textContent.trim() + '. ';
    }
    
    // Add content (first 200 characters)
    if (content) {
      const contentText = content.textContent.trim();
      announcement += contentText.length > 200 
        ? contentText.substring(0, 200) + '...' 
        : contentText;
    }
    
    // Announce after a delay to ensure screen reader attention
    setTimeout(() => {
      liveRegion.textContent = announcement;
    }, 200);
  }

  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // Handle tour navigation
      if (this.activePopover && document.body.contains(this.activePopover)) {
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            this.tryClosePopover();
            break;
            
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            this.tryNextStep();
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            this.tryPreviousStep();
            break;
        }
        return; // Don't handle other shortcuts when tour is active
      }

      // Handle custom shortcuts using loaded settings
      // Focus action button shortcut
      const focusShortcut = this.shortcuts.focusActionButton;
      if (focusShortcut && this.matchesShortcut(e, focusShortcut)) {
        e.preventDefault();
        console.log('tradosClarity: Focus action button shortcut triggered');
        this.focusImportantActionButton();
        return;
      }
      
      // Restart tours shortcut
      const restartShortcut = this.shortcuts.restartTours;
      if (restartShortcut && this.matchesShortcut(e, restartShortcut)) {
        e.preventDefault();
        console.log('tradosClarity: Restart tours shortcut triggered');
        this.restartProductTours();
        return;
      }
    });
  }

  matchesShortcut(event, shortcut) {
    return event.key.toLowerCase() === shortcut.key.toLowerCase() &&
           event.ctrlKey === !!shortcut.ctrl &&
           event.altKey === !!shortcut.alt &&
           event.shiftKey === !!shortcut.shift;
  }

  focusImportantActionButton() {
    console.log('tradosClarity: focusImportantActionButton called');
    console.log('tradosClarity: Current stored button:', this.importantActionButton);
    
    if (this.importantActionButton && document.body.contains(this.importantActionButton)) {
      console.log('tradosClarity: Focusing stored important action button');
      
      // Scroll into view if needed
      this.importantActionButton.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the button
      setTimeout(() => {
        this.importantActionButton.focus();
        
        // Announce that we've focused it
        const text = this.importantActionButton.textContent?.trim() || 'action button';
        this.announceMessage(`Focused "${text}" button. Press Enter to activate.`);
        
      }, 100);
    } else {
      console.log('tradosClarity: Stored button not available, searching for button-1046');
      
      // Try to find the button again
      const button1046 = document.getElementById('button-1046');
      console.log('tradosClarity: Found button-1046:', button1046);
      console.log('tradosClarity: Button visible:', button1046 ? button1046.offsetParent !== null : 'N/A');
      
      if (button1046 && button1046.offsetParent !== null) {
        console.log('tradosClarity: Re-found button-1046, focusing it');
        this.importantActionButton = button1046;
        
        button1046.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        setTimeout(() => {
          button1046.focus();
          const text = button1046.textContent?.trim() || 'action button';
          this.announceMessage(`Focused "${text}" button. Press Enter to activate.`);
        }, 100);
        
      } else {
        console.log('tradosClarity: No button-1046 found or not visible');
        
        // Try searching for any important button
        const allButtons = document.querySelectorAll('.x-btn, button, [role="button"]');
        console.log(`tradosClarity: Searching through ${allButtons.length} buttons for important ones`);
        
        for (const btn of allButtons) {
          const text = btn.textContent?.trim().toLowerCase() || '';
          const className = btn.className?.toLowerCase() || '';
          
          if ((text.includes('accept') || text.includes('complete') || className.includes('dap-btn-done')) 
              && btn.offsetParent !== null) {
            console.log(`tradosClarity: Found important button: "${btn.textContent?.trim()}"`);
            
            btn.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            setTimeout(() => {
              btn.focus();
              this.announceMessage(`Focused "${btn.textContent?.trim()}" button. Press Enter to activate.`);
            }, 100);
            
            this.importantActionButton = btn;
            return;
          }
        }
        
        console.log('tradosClarity: No important action button found on this page');
        this.announceMessage('No important action button found on this page.');
      }
    }
  }

  announceMessage(message) {
    // Create a temporary announcer for immediate messages
    let tempAnnouncer = document.createElement('div');
    tempAnnouncer.setAttribute('aria-live', 'assertive'); // Assertive for immediate attention
    tempAnnouncer.setAttribute('aria-atomic', 'true');
    tempAnnouncer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
    `;
    tempAnnouncer.textContent = message;
    document.body.appendChild(tempAnnouncer);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (tempAnnouncer.parentNode) {
        tempAnnouncer.parentNode.removeChild(tempAnnouncer);
      }
    }, 3000);
    
    console.log('tradosClarity: Announced:', message);
  }

  tryNextStep() {
    if (!this.activePopover) return;
    
    console.log('tradosClarity: Trying to find Next button');
    
    // First try buttons with our data attribute
    let nextButton = this.activePopover.querySelector('[data-tour-action="next"]');
    if (nextButton) {
      console.log('tradosClarity: Found Next button via data attribute:', nextButton);
      nextButton.click();
      return;
    }
    
    // Then try by text content and other attributes
    const allButtons = this.activePopover.querySelectorAll('button, a, [role="button"], [onclick], input[type="button"], .btn, .button');
    console.log('tradosClarity: Checking', allButtons.length, 'buttons for Next');
    
    for (const button of allButtons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const className = button.className.toLowerCase();
      const id = button.id.toLowerCase();
      
      console.log(`tradosClarity: Checking button - text:"${text}", aria:"${ariaLabel}", class:"${className}", id:"${id}"`);
      
      if (text.includes('next') || text.includes('continue') || text === '>' ||
          text.includes('got it') || text.includes('okay') || text.includes('ok') ||
          ariaLabel.includes('next') || ariaLabel.includes('continue') ||
          className.includes('next') || id.includes('next') ||
          text.includes('forward') || text.includes('proceed')) {
        console.log('tradosClarity: Found Next button:', button);
        button.click();
        return;
      }
    }
    
    console.log('tradosClarity: No Next button found');
  }

  tryPreviousStep() {
    if (!this.activePopover) return;
    
    console.log('tradosClarity: Trying to find Previous button');
    
    // First try buttons with our data attribute
    let prevButton = this.activePopover.querySelector('[data-tour-action="previous"]');
    if (prevButton) {
      console.log('tradosClarity: Found Previous button via data attribute:', prevButton);
      prevButton.click();
      return;
    }
    
    const allButtons = this.activePopover.querySelectorAll('button, a, [role="button"], [onclick], input[type="button"], .btn, .button');
    
    for (const button of allButtons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const className = button.className.toLowerCase();
      const id = button.id.toLowerCase();
      
      if (text.includes('prev') || text.includes('back') || text === '<' ||
          ariaLabel.includes('prev') || ariaLabel.includes('back') ||
          className.includes('prev') || className.includes('back') ||
          id.includes('prev') || id.includes('back')) {
        console.log('tradosClarity: Found Previous button:', button);
        button.click();
        return;
      }
    }
    
    console.log('tradosClarity: No Previous button found');
  }

  tryClosePopover() {
    if (!this.activePopover) return;
    
    console.log('tradosClarity: Trying to find Close/Skip button');
    
    // First try buttons with our data attributes
    let closeButton = this.activePopover.querySelector('[data-tour-action="close"], [data-tour-action="skip"]');
    if (closeButton) {
      console.log('tradosClarity: Found Close button via data attribute:', closeButton);
      closeButton.click();
      return;
    }
    
    const allButtons = this.activePopover.querySelectorAll('button, a, [role="button"], [onclick], input[type="button"], .btn, .button');
    
    for (const button of allButtons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const className = button.className.toLowerCase();
      const id = button.id.toLowerCase();
      
      if (text.includes('skip') || text.includes('close') || text.includes('finish') || 
          text.includes('end') || text.includes('exit') || text.includes('dismiss') ||
          text.includes('got it') || text.includes('okay') || text.includes('ok') ||
          ariaLabel.includes('skip') || ariaLabel.includes('close') || ariaLabel.includes('finish') ||
          className.includes('skip') || className.includes('close') || className.includes('finish') ||
          id.includes('skip') || id.includes('close') || id.includes('finish')) {
        console.log('tradosClarity: Found Close button:', button);
        button.click();
        return;
      }
    }
    
    console.log('tradosClarity: No Close button found');
  }

  announceImportantButtons() {
    console.log('tradosClarity: Checking for important action buttons');
    
    // Wait a bit for page to load, then check
    setTimeout(() => {
      this.findAndAnnounceActionButtons();
    }, 2000);
    
    // Also check again after 5 seconds in case content loads slowly
    setTimeout(() => {
      this.findAndAnnounceActionButtons();
    }, 5000);
  }

  findAndAnnounceActionButtons() {
    console.log('tradosClarity: Looking for action buttons...');
    
    // Look for the specific button ID from your data
    const button1046 = document.getElementById('button-1046');
    const importantButtons = [];
    
    if (button1046 && button1046.offsetParent !== null) {
      const text = button1046.textContent?.trim() || '';
      const className = button1046.className || '';
      
      console.log(`tradosClarity: Found button-1046 with text: "${text}"`);
      console.log(`tradosClarity: Classes: ${className}`);
      
      // Check if it's an important action button
      if (text.toLowerCase().includes('accept task') || 
          text.toLowerCase().includes('accept') ||
          text.toLowerCase().includes('complete') ||
          className.includes('dap-btn-done')) {
        
        importantButtons.push({
          element: button1046,
          text: text,
          action: text.toLowerCase().includes('accept') ? 'accept' : 'complete'
        });
        
        console.log('tradosClarity: This is an important action button!');
      }
    } else {
      console.log('tradosClarity: button-1046 not found or not visible');
    }
    
    // Also check for any other x-btn elements with important text
    const allXButtons = document.querySelectorAll('.x-btn');
    console.log(`tradosClarity: Found ${allXButtons.length} x-btn elements`);
    
    allXButtons.forEach((button, index) => {
      if (button === button1046) return; // Already checked above
      
      const text = button.textContent?.trim() || '';
      const className = button.className || '';
      
      if (button.offsetParent !== null && 
          (text.toLowerCase().includes('accept') || 
           text.toLowerCase().includes('complete') ||
           className.includes('dap-btn-done'))) {
        
        console.log(`tradosClarity: Found additional important button: "${text}"`);
        
        importantButtons.push({
          element: button,
          text: text,
          action: text.toLowerCase().includes('accept') ? 'accept' : 'complete'
        });
      }
    });
    
    console.log(`tradosClarity: Total important buttons found: ${importantButtons.length}`);
    
    if (importantButtons.length > 0) {
      this.announceActionButtons(importantButtons);
    } else {
      console.log('tradosClarity: No important action buttons found');
    }
  }

  announceActionButtons(buttons) {
    // Store the button for later access
    this.importantActionButton = buttons[0]?.element;

    // Create announcement message
    let message = '';
    
    if (buttons.length === 1) {
      const button = buttons[0];
      if (button.action === 'accept') {
        message = `Important: You need to accept this task before you can start working. "${button.text}" button is available. Use your focus action button shortcut to focus it.`;
      } else if (button.action === 'complete') {
        message = `Task ready to complete. "${button.text}" button is available. Use your focus action button shortcut to focus it.`;
      } else {
        message = `Important action required: "${button.text}" button is available. Use your focus action button shortcut to focus it.`;
      }
    } else {
      const buttonTexts = buttons.map(b => `"${b.text}"`).join(', ');
      message = `${buttons.length} important actions available: ${buttonTexts}. Use your focus action button shortcut to focus the first one.`;
    }
    
    console.log('tradosClarity: Announcing action buttons:', message);
    this.announceMessage(message);
  }

  ensureId(element, prefix = 'trados-tour') {
    if (!element.id) {
      element.id = prefix + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
  }
}

// SplitButton enhancer


class SplitButtonEnhancer {
  constructor() {
    this.activeImportDialog = null;
    this.setupSplitButtonHandling();
    
    // Add global escape key handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        console.log('tradosClarity: Global escape pressed');
        
        if (this.activeImportDialog && this.activeImportDialog.offsetParent !== null) {
          console.log('tradosClarity: Closing active import dialog via global escape');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // ADDED: Stop ALL other escape handlers
          this.closeImportHistoryDialog();
          return false; // ADDED: Completely stop this event
        }
        
        const visibleDialogs = document.querySelectorAll('[data-import-dialog-enhanced]');
        let foundVisibleDialog = false;
        
        visibleDialogs.forEach(dialog => {
          if (dialog.offsetParent !== null) {
            console.log('tradosClarity: Found visible import dialog, closing it');
            foundVisibleDialog = true;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // ADDED: Stop ALL other escape handlers
            this.activeImportDialog = dialog;
            this.closeImportHistoryDialog();
          }
        });
        
        // ADDED: If we closed a dialog, completely stop the event
        if (foundVisibleDialog) {
          return false;
        }
      }
    }, true);
  }

  getMainButtonText(splitButton) {
    const innerEl = splitButton.querySelector('.x-btn-inner');
    return innerEl ? innerEl.textContent.trim() : 'Button';
  }

  setupSplitButtonHandling() {
    // Monitor for split buttons and import dialogs
    this.enhanceExistingSplitButtons();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkForSplitButtons(node);
            this.checkForImportHistoryDialog(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  enhanceExistingSplitButtons() {
    const splitButtons = document.querySelectorAll('.x-split-button');
    splitButtons.forEach(splitButton => this.enhanceSplitButton(splitButton));
  }

  checkForSplitButtons(element) {
    if (element.classList?.contains('x-split-button')) {
      this.enhanceSplitButton(element);
    }
    
    const childSplitButtons = element.querySelectorAll?.('.x-split-button');
    if (childSplitButtons?.length > 0) {
      childSplitButtons.forEach(splitButton => this.enhanceSplitButton(splitButton));
    }
  }

  checkForImportHistoryDialog(element) {
    // Look for the import history grid container
    let dialogContainer = null;
    
    // Method 1: Direct match for import history grid
    if (element.id?.includes('tm-import-history-grid') && 
        (element.classList?.contains('x-tip') || element.classList?.contains('x-layer'))) {
      dialogContainer = element;
    }
    
    // Method 2: Look for tip/layer containing import history grid
    if (!dialogContainer && (element.classList?.contains('x-tip') || element.classList?.contains('x-layer'))) {
      const importGrid = element.querySelector('[id*="tm-import-history-grid"]');
      if (importGrid) {
        dialogContainer = element;
      }
    }
    
    // Method 3: Look for the specific grid structure
    if (!dialogContainer) {
      const emptyGrid = element.querySelector?.('.x-grid-empty-text');
      if (emptyGrid && emptyGrid.textContent?.includes('You do not have any imports yet')) {
        // Find the outermost container
        dialogContainer = element.closest('.x-tip, .x-layer') || 
                         emptyGrid.closest('[id*="tm-import-history"]') ||
                         element;
      }
    }
    
    if (dialogContainer && !dialogContainer.hasAttribute('data-import-dialog-enhanced')) {
      console.log('tradosClarity: Import History dialog detected:', dialogContainer);
      this.enhanceImportHistoryDialog(dialogContainer);
    }
  }

  // Replace your entire enhanceSplitButton method with this much simpler approach

enhanceSplitButton(splitButton) {
  if (splitButton.hasAttribute('data-split-enhanced')) {
    return;
  }

  console.log('tradosClarity: Enhancing split button:', splitButton);
  splitButton.setAttribute('data-split-enhanced', 'true');

  const buttonText = this.getMainButtonText(splitButton);
  const arrowArea = splitButton.querySelector('.x-btn-arrow-el');
  
  // ONLY add labels - NO event handlers, NO other enhancements
  splitButton.setAttribute('aria-label', `${buttonText} split button. Main button opens ${buttonText} dialog. Arrow button shows ${buttonText} history.`);
  
  if (arrowArea) {
    arrowArea.setAttribute('aria-label', `Show ${buttonText} history`);
  }
  
  console.log('tradosClarity: Split button enhanced with labels only - no event handlers added');
}

// Also replace your enhanceMainButtonArea method with this simpler version
enhanceMainButtonArea(splitButton, mainButtonArea, buttonText) {
  // This method is no longer needed - we handle everything in enhanceSplitButton
  console.log('tradosClarity: enhanceMainButtonArea called but using simplified approach');
}

enhanceArrowArea(splitButton, arrowArea, buttonText) {
  console.log('tradosClarity: enhanceArrowArea called but using simplified approach');
}

  cleanupRedundantElements(splitButton) {
    const presentationElements = splitButton.querySelectorAll('[role="presentation"]');
    presentationElements.forEach(el => {
      if (el.hasAttribute('data-trados-enhanced')) {
        el.removeAttribute('data-trados-enhanced');
      }
      if (el.hasAttribute('data-keyboard-added')) {
        el.removeAttribute('data-keyboard-added');
      }
    });
  }

  enhanceImportHistoryDialog(dialogContainer) {
    if (dialogContainer.hasAttribute('data-import-dialog-enhanced')) {
      return;
    }
    
    console.log('tradosClarity: Enhancing Import History dialog:', dialogContainer);
    dialogContainer.setAttribute('data-import-dialog-enhanced', 'true');
    
    this.activeImportDialog = dialogContainer;
    
    // Update split button state
    const splitButtons = document.querySelectorAll('.x-split-button[data-split-enhanced]');
    let associatedSplitButton = null;
    
    splitButtons.forEach(sb => {
      const buttonText = this.getMainButtonText(sb);
      if (buttonText.toLowerCase().includes('import')) {
        associatedSplitButton = sb;
        const arrowArea = sb.querySelector('.x-btn-arrow-el');
        if (arrowArea) {
          arrowArea.setAttribute('aria-expanded', 'true');
        }
        sb.setAttribute('aria-expanded', 'true');
      }
    });
    
    // Make the dialog container accessible
    dialogContainer.setAttribute('role', 'dialog');
    dialogContainer.setAttribute('aria-modal', 'true');
    dialogContainer.setAttribute('aria-label', 'Import History');
    
    if (!dialogContainer.hasAttribute('tabindex')) {
      dialogContainer.setAttribute('tabindex', '0');
    }
    
    // Add keyboard handling to the dialog container
    this.addDialogKeyboardHandling(dialogContainer, associatedSplitButton);
    
    // Prevent child elements from being enhanced
    this.preventChildEnhancement(dialogContainer);
    
    // Focus and announce
    setTimeout(() => {
      dialogContainer.focus();
      this.announceDialogContent(dialogContainer);
    }, 100);
    
    // Set up click-outside detection
    this.setupClickOutsideDetection(dialogContainer, associatedSplitButton);
  }

  preventChildEnhancement(dialogContainer) {
    // Mark child elements to prevent enhancement
    const childElements = dialogContainer.querySelectorAll('*');
    childElements.forEach(child => {
      if (child.hasAttribute('data-trados-enhanced')) {
        child.removeAttribute('data-trados-enhanced');
      }
      if (child.hasAttribute('data-keyboard-added')) {
        child.removeAttribute('data-keyboard-added');
      }
      if (child.getAttribute('role') === 'button' && 
          child.hasAttribute('data-ref') && 
          child.closest('[data-import-dialog-enhanced]')) {
        child.removeAttribute('role');
        if (child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== '-1') {
          child.removeAttribute('tabindex');
        }
      }
    });
  }

  addDialogKeyboardHandling(dialogContainer, splitButton) {
    const keydownHandler = (e) => {
      console.log('tradosClarity: Key pressed in dialog:', e.key);
      
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        console.log('tradosClarity: Escape pressed - closing dialog');
        this.closeImportHistoryDialog();
      }
    };
    
    dialogContainer.addEventListener('keydown', keydownHandler);
    
    // Global escape handling
    const globalEscapeHandler = (e) => {
      if (e.key === 'Escape' && this.activeImportDialog) {
        console.log('tradosClarity: Global escape pressed');
        this.closeImportHistoryDialog();
      }
    };
    
    document.addEventListener('keydown', globalEscapeHandler);
    
    // Store handlers for cleanup
    dialogContainer._keydownHandler = keydownHandler;
    dialogContainer._globalEscapeHandler = globalEscapeHandler;
  }

  announceDialogContent(dialogContainer) {
    console.log('tradosClarity: Announcing Import History dialog content');
    
    // Get the main components
    const title = 'Import History';
    const emptyText = dialogContainer.querySelector('.x-grid-empty-text');
    const moreDetailsBtn = dialogContainer.querySelector('a, button');
    
    let announcement = title + ' dialog opened.';
    
    if (emptyText) {
      announcement += ' ' + emptyText.textContent.trim();
    }
    
    // Check for grid headers to describe structure
    const headers = dialogContainer.querySelectorAll('.x-column-header-text-inner');
    if (headers.length > 0) {
      const headerTexts = Array.from(headers)
        .map(h => h.textContent.trim())
        .filter(t => t && t !== '&nbsp;');
      
      if (headerTexts.length > 0) {
        announcement += ` Table with columns: ${headerTexts.join(', ')}.`;
      }
    }
    
    if (moreDetailsBtn && moreDetailsBtn.textContent.trim()) {
      announcement += ' ' + moreDetailsBtn.textContent.trim() + ' button available.';
    }
    
    announcement += ' Press Escape to close, Tab to navigate.';
    
    console.log('tradosClarity: Final announcement:', announcement);
    
    // Use the main extension's announcement system if available
    if (window.tradosClarity && window.tradosClarity.announce) {
      window.tradosClarity.announce.assertive(announcement);
    } else {
      this.createAnnouncementRegion(announcement);
    }
  }

  createAnnouncementRegion(message) {
    let announcer = document.getElementById('import-dialog-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'import-dialog-announcer';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(1px, 1px, 1px, 1px) !important;
      `;
      document.body.appendChild(announcer);
    }
    
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }

  setupClickOutsideDetection(dialogContainer, splitButton) {
    const clickHandler = (e) => {
      if (!dialogContainer.contains(e.target) && 
          (!splitButton || !splitButton.contains(e.target))) {
        console.log('tradosClarity: Click outside detected');
        this.closeImportHistoryDialog();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', clickHandler);
    }, 200);
    
    dialogContainer._clickHandler = clickHandler;
  }

  closeImportHistoryDialog() {
    console.log('tradosClarity: Closing Import History dialog');
    
    const dialog = this.activeImportDialog;
    
    if (dialog) {
      // Clean up event handlers
      if (dialog._keydownHandler) {
        dialog.removeEventListener('keydown', dialog._keydownHandler);
      }
      if (dialog._globalEscapeHandler) {
        document.removeEventListener('keydown', dialog._globalEscapeHandler);
      }
      if (dialog._clickHandler) {
        document.removeEventListener('click', dialog._clickHandler);
      }
      
      // Try to close the dialog
      try {
        if (dialog.parentNode) {
          dialog.parentNode.removeChild(dialog);
        }
      } catch (e) {
        console.log('tradosClarity: Direct removal failed, trying hide:', e);
        dialog.style.display = 'none';
        dialog.style.visibility = 'hidden';
      }
    }
    
    // Reset split button state
    const splitButtons = document.querySelectorAll('.x-split-button[data-split-enhanced]');
    splitButtons.forEach(sb => {
      const buttonText = this.getMainButtonText(sb);
      if (buttonText.toLowerCase().includes('import')) {
        const arrowArea = sb.querySelector('.x-btn-arrow-el');
        if (arrowArea) {
          arrowArea.setAttribute('aria-expanded', 'false');
          setTimeout(() => {
            arrowArea.focus();
            this.createAnnouncementRegion('Import History dialog closed. Focus returned to dropdown arrow.');
          }, 100);
        }
        sb.setAttribute('aria-expanded', 'false');
      }
    });
    
    this.activeImportDialog = null;
    
    // Additional close attempts
    setTimeout(() => {
      // Dispatch escape events
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(escapeEvent);
      
      // Try clicking the arrow to toggle
      const importSplitButton = document.querySelector('.x-split-button[data-split-enhanced]');
      if (importSplitButton) {
        const buttonText = this.getMainButtonText(importSplitButton);
        if (buttonText.toLowerCase().includes('import')) {
          const arrowArea = importSplitButton.querySelector('.x-btn-arrow-el');
          if (arrowArea) {
            arrowArea.click();
          }
        }
      }
    }, 200);
  }
}

// Initialize when script loads
console.log('tradosClarity: Content script loaded');
new TradosTourAccessibility();