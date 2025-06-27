<table border="0" cellpadding="0" cellspacing="0">
<tr>
<td><img src="../tradosClarity/icons/icon128.png" alt="tradosClarity" width="80"></td>
<td><h1>tradosClarity Help Documentation</h1></td>
</tr>
</table>

Welcome to tradosClarity - your accessibility companion for Trados Cloud! This extension, built as part of an open source project, makes Trados Cloud more accessible for screen reader users and anyone who relies on keyboard navigation.

## What is tradosClarity?

tradosClarity is a free browser extension that enhances the accessibility of Trados Cloud by:

- **Quick Navigation**: Jump instantly between main interface sections with keyboard shortcuts
- Making product tours fully accessible with proper announcements and keyboard navigation
- Helping you quickly find and focus important action buttons
- Allowing you to restart tours that may have gotten stuck
- Providing customizable keyboard shortcuts for efficient workflow

## Installation

1. **Install the extension** in your Chrome browser
2. **Navigate to any Trados Cloud page** (*.trados.com)
3. **The extension activates automatically** - no additional setup required
4. **Access settings** by right-clicking the extension icon and selecting "Options"

## Features & Usage

### 🧭 **Quick Navigation (NEW!)**

The most powerful feature for efficient Trados Cloud navigation.

**Navigation Dialog:**
- **Default shortcut:** Alt+Shift+N
- **What it does:** Opens a visual dialog showing all available navigation sections
- **How to use:** Press Alt+Shift+N, then press the highlighted key (M, S, A, T) to jump to that section

**Direct Navigation Shortcuts:**
- **Alt+Shift+M** → Jump to **Main Menu** (Dashboard, Inbox, Projects, Resources, etc.)
- **Alt+Shift+S** → Jump to **Section Tabs** (Files, Workflow, Reports, etc.)
- **Alt+Shift+A** → Jump to **Action Buttons** (Upload, Download, Open Editor, etc.)  
- **Alt+Shift+T** → Jump to **Content Table** (Main file/project listing)

**When it's helpful:**
- **Save dozens of Tab presses** - jump directly where you need to go
- **Never lose your place** - quickly move between interface sections
- **Efficient workflow** - spend less time navigating, more time working
- **Works on any Trados page** - Projects, Resources, Customers, etc.

**Smart Features:**
- Automatically detects available sections on each page
- Adapts to different page layouts
- Some pages may not have all sections (e.g., Customers has no sub-tabs)
- Provides audio announcements about where you've navigated

### 🎯 Focus Important Action Buttons

**What it does:** Quickly finds and focuses the most important action button on the current page, such as "Accept Task" or "Complete Task."

**How to use:**

- **Default shortcut:** Alt+Shift+A
- **From popup:** Click the extension icon, then click "Focus Action Button"

**When it's helpful:**

- When you need to accept a task before starting work
- When you're ready to complete a task
- When important buttons are hard to locate on busy pages

### 🔄 Restart Product Tours

**What it does:** Clears tour progress data so all product tours in the online editor restart from the beginning.

**How to use:**

- **Default shortcut:** Alt+Shift+R
- **From popup:** Click the extension icon, then click "Restart Product Tours"

**When it's helpful:**

- When you want to review a tour you've already completed
- When you want to see tours that were missed or skipped
- When you're testing and trying to help improve the necessary feedback

**What happens:** The extension clears tour data and automatically refreshes the page. Tours will restart from step 1.

### 🧭 Tour Navigation

**What it does:** Provides keyboard navigation when product tours are active.

**How to use:**

- **Arrow Right/Down:** Next step
- **Arrow Left/Up:** Previous step
- **Escape:** Exit the tour

**Screen reader announcements:**

- Tour start and step announcements
- Step progress (e.g., "Step 2 of 5")
- Tour content and instructions

### ⚙️ Customizable Shortcuts

**How to customize:**

1. **Right-click the extension icon** and select "Options"
2. **Go to the Keyboard Shortcuts tab**
3. **Click on any shortcut button** you want to change
4. **Press your desired key combination**
5. **Click "Save Shortcuts"**

**Conflict detection:** The extension will warn you if you try to use a shortcut that's already assigned.

## Settings & Configuration

### Accessing Settings

- **Method 1:** Right-click the extension icon → "Options"
- **Method 2:** Click the extension icon → "Open Full Settings"

### Settings Tabs

#### Keyboard Shortcuts

- View and customize all keyboard shortcuts
- Reset individual shortcuts or all shortcuts to defaults
- Real-time conflict detection

#### Help

- Quick reference for all features
- Links to this documentation
- Extension status information

#### About

- Version information
- Technical details
- Permissions explanation

## Troubleshooting

### Quick Navigation isn't working

**Possible solutions:**

- Make sure the Trados page has focus (click on it first)
- Verify you're on a supported Trados Cloud page (*.trados.com)
- Try refreshing the page to re-initialize the extension
- Check that the extension is enabled in Chrome's extension settings

### Navigation dialog shows but sections are missing

**This is normal!** Different Trados pages have different sections:

- **Projects page:** Has all 4 sections (Main Menu, Sub-tabs, Actions, Table)
- **Customers page:** Has 3 sections (no sub-tabs)
- **Some pages** may only have main menu and actions

The extension automatically detects what's available on each page.

### Navigation shortcuts aren't working

**Possible solutions:**

- Make sure the Trados page has focus (click on it first)
- Check if another application is using the same shortcut
- Try customizing the shortcut to a different key combination
- Verify the extension is active on the current page

### Tours aren't announcing properly

**Possible solutions:**

- Ensure your screen reader is running and configured for dynamic content
- Refresh the page to re-initialize the extension
- Check that the extension is enabled in Chrome's extension settings

### Important buttons aren't being found

**Possible solutions:**

- Make sure the page has fully loaded before using the shortcut
- Navigate to the appropriate page/workflow first (some buttons only appear in specific contexts)
- Try using the shortcut multiple times - content may load dynamically
- Check if you're on a supported Trados Cloud page

### Extension not working

**Possible solutions:**

- Verify you're on a Trados Cloud domain (*.trados.com)
- Check that the extension is enabled in chrome://extensions/
- Try disabling and re-enabling the extension
- Refresh the Trados Cloud page

## Quick Reference Card

### Navigation Shortcuts
- **Alt+Shift+N** → Navigation dialog (shows all options)
- **Alt+Shift+M** → Main menu
- **Alt+Shift+S** → Section tabs  
- **Alt+Shift+A** → Action buttons
- **Alt+Shift+T** → Content table

### Action Shortcuts
- **Alt+Shift+A** → Focus important action button
- **Alt+Shift+R** → Restart product tours

### Tour Navigation
- **Arrow Keys** → Navigate tour steps
- **Escape** → Exit tour

*All shortcuts can be customized in settings*

## Supported Sites

tradosClarity works on:

- All Trados Cloud domains (*.trados.com)
- Local development environments (localhost) - for developers

## Accessibility Standards

This extension follows WCAG 2.1 AA accessibility guidelines and is compatible with:

- **Screen readers:** NVDA, JAWS, VoiceOver, Narrator, and others
- **Browsers:** Chrome, Edge, and other Chromium-based browsers
- **Operating systems:** Windows, macOS, and Linux

## Privacy & Security

**Your privacy matters:**

- No data is collected or transmitted to external servers
- All settings are stored locally in your browser
- The extension only requests permissions for essential functionality
- No tracking, analytics, or personal data collection

**Permissions explained:**

- **Active Tab:** Access the current Trados page to enhance accessibility
- **Storage:** Save your keyboard shortcut preferences locally

## Getting Help & Support

### Quick Self-Help

1. **Check this documentation** for common solutions
2. **Try refreshing the page** to reload the extension
3. **Verify extension is enabled** in chrome://extensions/
4. **Test on different Trados Cloud pages** to isolate issues

### Need More Help?

If you're still experiencing issues or have suggestions for improvement:

**📝 Report Issues or Suggestions:** Visit our issue tracker: https://github.com/paulfilkin/tradosClarity/issues

- Describe the specific problem you're experiencing
- Include your browser version and screen reader (if applicable)
- Mention which Trados Cloud page or workflow you were using

**📊 Track Development Progress:** Follow our development: https://github.com/users/paulfilkin/projects/1

- See what features are being worked on
- View upcoming improvements
- Check the status of reported issues

## Contributing to tradosClarity

tradosClarity is an open source project that benefits from community input!

### For All Users

**Share feedback and ideas:**

- Report bugs or accessibility issues
- Suggest new features or improvements
- Share your experience using the extension
- Help others in the community by sharing solutions

**How to contribute:** Create a new issue at https://github.com/paulfilkin/tradosClarity/issues

### For Developers

**Contribute code:** If you have development skills, you can contribute directly to the project:

- Submit bug fixes
- Add new accessibility features
- Improve existing functionality
- Enhance documentation

**How to contribute:** Submit a pull request at https://github.com/paulfilkin/tradosClarity

### Why Contribute?

Your contributions help make Trados Cloud more accessible for everyone. Whether you're reporting a bug, suggesting a feature, or contributing code, you're helping to create a more inclusive translation workflow for the entire community.

## Frequently Asked Questions

**Q: Is tradosClarity free?** A: Yes! tradosClarity is completely free and open source.

**Q: Will this work with my screen reader?** A: Yes! tradosClarity is designed to work with all major screen readers including NVDA, JAWS, VoiceOver, and Narrator.

**Q: Can I use this on Firefox or Safari?** A: Currently, tradosClarity is designed for Chrome and Chromium-based browsers. Firefox and Safari support may be added in the future.

**Q: Will this interfere with Trados Cloud's normal operation?** A: No! tradosClarity only enhances accessibility without changing Trados Cloud's core functionality.

**Q: How do I uninstall the extension?** A: Go to chrome://extensions/, find tradosClarity, and click "Remove."

**Q: Does this work offline?** A: The extension itself works offline, but you need an internet connection to access Trados Cloud.

**Q: What's the difference between the navigation shortcuts and the action button shortcut?** A: Navigation shortcuts (M, S, T) help you move between different **sections** of the interface, while the action button shortcut (A) helps you find important **buttons** within those sections (like Accept Task, Complete Task).

**Q: Why don't I see all navigation sections on every page?** A: Different Trados pages have different layouts. For example, the Customers page doesn't have sub-tabs, so the "S" shortcut won't find anything there. This is normal and expected.

**Q: Can I change the keyboard shortcuts?** A: Yes! Right-click the extension icon, select "Options," go to the Keyboard Shortcuts tab, and customize any shortcut to your preference.

------

**Version:** 1.0.0
**Last Updated:** June 2025
**Support:** https://github.com/paulfilkin/tradosClarity/issues
