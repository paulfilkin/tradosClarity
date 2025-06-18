
# tradosClarity – Accessibility Enhancements for Trados Cloud

**tradosClarity** is a Chrome Extension that improves accessibility for users by exposing features in Trados Cloud that are not obvious when you can't see the screen, and are well hidden from an out of the box screen readers reach. It enhances keyboard navigation, screen reader support, and visual clarity, making interactive onboarding experiences more inclusive and user-friendly.

The project was borne out of the difficulties I had attempting to create an addon for NVDA and because I found that this approach with an extension could simply expose what should be there already for a screen reader and may ensure it will work for all screen readers and not just NVDA.

Once it's well tested and proven I (or we... if anyone else contributes) will move this to a free and distributable extension in the Chrome store.  Until then instructions for testing are in the text below.  I'm hoping this will prove to be the best way forward!

## Features

- Automatically detects and enhances tour popovers with accessibility improvements.
- Adds ARIA roles and live regions to support screen readers.
- Enables keyboard control: `Escape`, arrow keys, and quick focus via `Alt+A`.
- Injects CSS for contrast, touch targets, focus outlines, and reduced motion support.
- Includes debug announcements and overlays for testing accessibility.

## Installation (Developer Mode)

1. Clone or download this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extension directory.

The extension will activate on any supported Trados Cloud environment (including `localhost`).

## File Structure

```

📁 tradosClarity/
├── manifest.json         # Chrome Extension config (Manifest V3)
├── content.js            # Accessibility logic and DOM enhancements
└── accessibility.css     # Style overrides for accessibility support

```

## Contributing

Contributions are welcome!

If you're interested in helping improve accessibility or extending support to more tour frameworks, feel free to fork the repository and submit pull requests.

Suggestions for improvement include:

- Additional shortcut support
- Multi-language support
- Visual indicators for screen reader-only users
- Testing on different Trados environments and versions

## Licence

This project is released under [The Unlicense](https://unlicense.org/), placing it in the public domain.

You are free to use, modify, distribute, or build upon it without restriction.

---

**Note**: This extension is not affiliated with RWS or Trados in any official capacity.
