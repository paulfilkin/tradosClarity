# <img src="../tradosClarity/icons/icon128.png" alt="tradosClarity" width="48" height="48" style="vertical-align: middle; margin-right: 10px;">tradosClarity - Developer Guide

An Open Source project to build a browser extension that enhances the accessibility of Trados Cloud for screen reader users and keyboard navigation.

## About This Project

tradosClarity addresses critical accessibility barriers in Trados Cloud that prevent screen reader users and keyboard-only users from effectively using the platform. The extension provides:

- **Tour Accessibility Enhancement**: Makes product tours fully accessible with proper ARIA labels, announcements, and keyboard navigation
- **Smart Action Button Focus**: Helps users quickly locate and focus important action buttons like "Accept Task" or "Complete Task"
- **Tour Management**: Allows users to restart product tours because when they're done... they're done!
- **Customizable Shortcuts**: Full keyboard shortcut customization with conflict detection and user preferences

## Target Audience

This extension is designed for:

- Screen reader users (NVDA, JAWS, VoiceOver, etc.)
- Users who rely on keyboard navigation
- Users with motor disabilities who benefit from keyboard shortcuts
- Anyone who finds Trados Cloud's default interface challenging to navigate

## Technical Architecture

- **Manifest V3** Chrome extension
- **Content scripts** for DOM manipulation and accessibility enhancement
- **Storage API** for user preferences and settings
- **Message passing** between popup, settings, and content scripts
- **No external dependencies** - self-contained for security and reliability

## Getting Started

### Prerequisites

- Google Chrome 88+ (or compatible Chromium browser)
- Access to Trados Cloud for testing

### Installation for Development

1. **Clone or download** this repository
2. **Navigate to the tradosClarity folder** - all extension files are contained here
3. **Open Chrome** and go to `chrome://extensions/`
4. **Enable Developer mode** (toggle in top-right corner)
5. **Click "Load unpacked"** and select the `tradosClarity` folder
6. **Verify installation** - the extension should appear in your extensions list

### Production Installation (Future)

Once published to the Chrome Web Store, users will be able to:

1. **Visit the Chrome Web Store** listing for tradosClarity
2. **Click "Add to Chrome"** for one-click installation
3. **Grant permissions** during the installation process
4. **Access immediately** on any Trados Cloud page

### Testing

1. **Navigate to any Trados Cloud page** (*.trados.com)
2. **Check console** for `tradosClarity: Initializing...` messages
3. Test keyboard shortcuts:
   - Alt+Shift+A (Focus Action Button)
   - Alt+Shift+R (Restart Tours)
4. **Open extension popup** to verify UI components
5. **Access settings page** via right-click → Options

### Development Workflow

#### Making Changes

1. **Edit files** in the tradosClarity folder
2. **Go to chrome://extensions/**
3. **Click reload button** (🔄) on the tradosClarity extension card
4. **Test changes** on Trados Cloud pages

#### Debugging

- **Content script**: Use browser DevTools console on Trados pages
- **Popup/Settings**: Right-click extension → Inspect popup/options
- **Background issues**: Check extension service worker in DevTools

## Key Development Considerations

#### Chrome Web Store Readiness

- **Store policy compliance** - follows all Chrome Web Store developer policies
- **Privacy policy** - transparent about data usage (none collected)
- **Manifest V3** - uses latest extension platform for future-proofing
- **Quality guidelines** - meets CWS quality and user experience standards
- **Permissions justification** - each permission has clear, documented purpose

#### Accessibility Standards

- Follow **WCAG 2.1 AA** guidelines
- Test with **actual screen readers** when possible
- Ensure **keyboard accessibility** for all interactive elements
- Use **semantic HTML** and proper ARIA attributes

#### Browser Compatibility

- Primary target: **Chrome/Edge** (Manifest V3)
- Consider **Firefox compatibility** (may require manifest conversion)
- Test across different **screen reader/browser combinations**

#### Performance

- **Minimal DOM impact** - only enhance when necessary
- **Efficient selectors** - avoid broad queries
- **Memory management** - clean up observers and listeners
- **Fast initialization** - critical for tour detection

#### Security

- **Chrome Web Store compliance** - meets all CWS security requirements
- **Minimal permissions** - only activeTab and storage (no broad host permissions)
- **No external connections** - all functionality is self-contained
- **Input validation** - sanitize any dynamic content and user inputs
- **CSP compliance** - no inline scripts, eval(), or unsafe practices
- **Code review ready** - clean, auditable codebase for store approval
- **Privacy by design** - no data collection, tracking, or telemetry

## Architecture Overview

### Content Script Flow

1. **Initialize** on DOM ready
2. **Load user shortcuts** from storage
3. **Scan for tours** (initial + mutation observer)
4. **Enhance accessibility** of detected elements
5. **Set up keyboard handlers** for navigation and shortcuts

### Settings/Popup Communication

1. **User changes settings** in settings page
2. **Settings saved** to chrome.storage.sync
3. **Message sent** to all active content scripts
4. **Content scripts update** their shortcut handlers

### Tour Enhancement Process

1. **Detect tour popover** via data-testid="help-tour-popover"
2. **Add ARIA attributes** for screen reader compatibility
3. **Enhance navigation buttons** with proper labels
4. **Set up keyboard navigation** (arrows, escape)
5. **Announce tour state** to screen readers

## Contributing

When contributing to this project:

1. **Test thoroughly** with screen readers if possible
2. **Follow existing code patterns** and naming conventions
3. **Update documentation** for any new features
4. **Consider backward compatibility** with existing user settings
5. **Validate accessibility** of any UI changes
6. **Ensure Chrome Web Store compliance** - avoid practices that could impact store approval
7. **Maintain privacy standards** - no data collection or external connections
8. **Document permission usage** - justify any new permissions with clear accessibility benefits

### Preparing for Chrome Web Store

When preparing releases for the Chrome Web Store:

- **Code review** all changes for security and quality
- **Test across multiple screen readers** and browser versions
- **Validate manifest** against latest CWS requirements
- **Prepare store assets** (screenshots, descriptions, privacy policy)
- **Document accessibility features** for store listing

## Browser Extension Manifest

The extension uses Manifest V3 with Chrome Web Store-compliant permissions:

- `activeTab`: Access current Trados page for enhancement (granted on user interaction)
- `storage`: Save user preferences and shortcuts (local storage only)
- Host permissions for `*.trados.com` and `localhost` (development/testing)

### Permission Justification

Each permission serves a specific accessibility purpose:

- **activeTab**: Required to enhance tour accessibility and focus management on Trados pages
- **storage**: Essential for saving user's custom keyboard shortcuts and preferences
- **host_permissions**: Scoped specifically to Trados Cloud domains for targeted functionality

### Privacy Commitment

- **Zero data collection** - no analytics, tracking, or user data transmission
- **Local storage only** - all user preferences stored locally in browser
- **No network requests** - extension operates entirely offline
- **Transparent functionality** - all code is open source and auditable

## Support

For development questions or technical issues:

- Review existing code patterns in the extension
- Test changes thoroughly across different Trados Cloud workflows
- Consider the diverse needs of screen reader users when making modifications

This is an accessibility-focused project where user experience and inclusive design are the primary concerns.
