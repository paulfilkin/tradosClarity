// tradosClarity - Focused Tour Accessibility Enhancement
// Targets elements with data-testid="help-tour-popover"

class TradosTourAccessibility {
  constructor() {
    this.observer = null;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.activePopover = null;
    
    console.log('tradosClarity: Initializing for help-tour-popover elements');
    this.init();
  }

  init() {
    // Check for existing tour popovers immediately and repeatedly
    this.enhanceExistingPopovers();
    
    // Set up a more aggressive initial scan with retries
    this.setupInitialScan();
    
    // Set up mutation observer for dynamically added popovers
    this.setupMutationObserver();
    
    // Set up global keyboard handlers
    this.setupKeyboardHandlers();
    
    // NEW: Check for important action buttons
    this.announceImportantButtons();
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
    
    // Strategy 3: Also create a temporary visible announcement for testing
    let tempVisibleAnnouncer = document.createElement('div');
    tempVisibleAnnouncer.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      left: 10px !important;
      background: yellow !important;
      color: black !important;
      padding: 10px !important;
      border: 2px solid red !important;
      z-index: 999999 !important;
      font-size: 16px !important;
    `;
    tempVisibleAnnouncer.textContent = '[DEBUG] ' + message;
    document.body.appendChild(tempVisibleAnnouncer);
    
    // Remove the visible announcer after 5 seconds
    setTimeout(() => {
      if (tempVisibleAnnouncer.parentNode) {
        tempVisibleAnnouncer.parentNode.removeChild(tempVisibleAnnouncer);
      }
    }, 5000);
    
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

      // Handle important action button focus - try multiple key combinations
      // Alt+Shift+A (less likely to conflict)
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        console.log('tradosClarity: Alt+Shift+A pressed - attempting to focus action button');
        this.focusImportantActionButton();
        return;
      }
      
      // Backup: Alt+A (simpler)
      if (e.altKey && !e.shiftKey && !e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        console.log('tradosClarity: Alt+A pressed - attempting to focus action button');
        this.focusImportantActionButton();
        return;
      }
    });
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

  categorizeAction(text) {
    if (text.includes('accept')) return 'accept';
    if (text.includes('complete')) return 'complete';
    if (text.includes('submit')) return 'submit';
    if (text.includes('start') || text.includes('begin')) return 'start';
    return 'action';
  }

  announceActionButtons(buttons) {
    // Store the button for later access
    this.importantActionButton = buttons[0]?.element;

    // Create announcement message
    let message = '';
    
    if (buttons.length === 1) {
      const button = buttons[0];
      if (button.action === 'accept') {
        message = `Important: You need to accept this task before you can start working. "${button.text}" button is now focused. Press Enter to accept, or Escape to skip.`;
      } else if (button.action === 'complete') {
        message = `Task ready to complete. "${button.text}" button is now focused. Press Enter to complete, or Escape to skip.`;
      } else {
        message = `Important action required: "${button.text}" button is now focused. Press Enter to activate.`;
      }
    } else {
      const buttonTexts = buttons.map(b => `"${b.text}"`).join(', ');
      message = `${buttons.length} important actions available: ${buttonTexts}. First button is focused - press Enter to activate.`;
    }
    
    console.log('tradosClarity: Announcing action buttons:', message);
    
    // Immediately focus the important button
    this.autoFocusImportantButton();
    
    // Announce after focusing
    this.announceMessage(message);
    
    // Also create a temporary visible announcement for testing
    if (buttons.some(b => b.action === 'accept')) {
      let tempVisibleAnnouncer = document.createElement('div');
      tempVisibleAnnouncer.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        left: 10px !important;
        background: orange !important;
        color: black !important;
        padding: 10px !important;
        border: 2px solid red !important;
        z-index: 999999 !important;
        font-size: 16px !important;
        font-weight: bold !important;
      `;
      tempVisibleAnnouncer.textContent = '[DEBUG] ' + message;
      document.body.appendChild(tempVisibleAnnouncer);
      
      // Remove after 10 seconds
      setTimeout(() => {
        if (tempVisibleAnnouncer.parentNode) {
          tempVisibleAnnouncer.parentNode.removeChild(tempVisibleAnnouncer);
        }
      }, 10000);
    }
  }

  autoFocusImportantButton() {
    if (!this.importantActionButton) {
      console.log('tradosClarity: No button to focus');
      return;
    }
    
    console.log('tradosClarity: Auto-focusing important action button:', this.importantActionButton);
    console.log('tradosClarity: Button is connected to DOM:', document.body.contains(this.importantActionButton));
    console.log('tradosClarity: Button is visible:', this.importantActionButton.offsetParent !== null);
    console.log('tradosClarity: Button text:', this.importantActionButton.textContent?.trim());
    
    // Try multiple focus attempts with different delays
    const focusAttempts = [100, 500, 1000, 2000];
    
    focusAttempts.forEach((delay, index) => {
      setTimeout(() => {
        console.log(`tradosClarity: Focus attempt ${index + 1} at ${delay}ms`);
        
        if (document.body.contains(this.importantActionButton) && 
            this.importantActionButton.offsetParent !== null) {
          
          // Scroll into view
          this.importantActionButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Try multiple focus methods
          setTimeout(() => {
            console.log('tradosClarity: Attempting to focus button');
            
            // Method 1: Direct focus
            this.importantActionButton.focus();
            
            // Check if it worked
            setTimeout(() => {
              const activeElement = document.activeElement;
              console.log('tradosClarity: Active element after focus:', activeElement);
              console.log('tradosClarity: Focus successful:', activeElement === this.importantActionButton);
              
              if (activeElement === this.importantActionButton) {
                console.log('tradosClarity: ✅ Button focused successfully!');
                this.announceMessage(`"${this.importantActionButton.textContent?.trim()}" button is now focused. Press Enter to activate.`);
              } else {
                console.log('tradosClarity: ❌ Focus attempt failed, trying alternative methods');
                
                // Method 2: Click to focus (if direct focus failed)
                if (index === focusAttempts.length - 1) { // Last attempt
                  this.tryAlternativeFocusMethods();
                }
              }
            }, 100);
            
          }, 100);
        } else {
          console.log('tradosClarity: Button not available for focus at this time');
        }
      }, delay);
    });
  }

  tryAlternativeFocusMethods() {
    console.log('tradosClarity: Trying alternative focus methods');
    
    // Method 2: Set tabindex and focus
    const originalTabIndex = this.importantActionButton.tabIndex;
    this.importantActionButton.tabIndex = 0;
    this.importantActionButton.focus();
    
    setTimeout(() => {
      if (document.activeElement === this.importantActionButton) {
        console.log('tradosClarity: ✅ Alternative focus method worked!');
        this.announceMessage(`"${this.importantActionButton.textContent?.trim()}" button is now focused. Press Enter to activate.`);
      } else {
        console.log('tradosClarity: ❌ All focus methods failed');
        
        // Method 3: Just announce location without focus
        this.announceMessage(`Important: "${this.importantActionButton.textContent?.trim()}" button is available. Navigate to it using your screen reader.`);
      }
    }, 100);
  }

  ensureId(element, prefix = 'trados-tour') {
    if (!element.id) {
      element.id = prefix + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
  }
}

// Initialize when script loads
console.log('tradosClarity: Content script loaded');
new TradosTourAccessibility();