---
name: Figma Web Capture
description: >
  Capture a live webpage or a selected DOM element into editable Figma layers
  using Figma's public html-to-design capture.js workflow.
activateOn: figma-canvas-operation
freedomLevel: high
category: connect
tags:
  - figma
  - html-to-design
  - bookmarklet
  - web-capture
  - editable-layers
---

# Figma Web Capture

Use this when a user wants to bring a webpage into Figma as editable layers
instead of a screenshot.

This is a practical workflow built on Figma's public `html-to-design`
capture asset. Treat it as an unofficial bookmarklet path, not as a guaranteed
product surface. Re-check the script URL if Figma changes the flow.

## What It Does

- Loads Figma's public `capture.js` helper into the current page.
- Serializes the rendered DOM into Figma layers.
- Copies the capture to the clipboard so it can be pasted into any open Figma file.
- Supports capturing the full viewport or a selected element.

## Public Script

The capture helper lives at:

`https://mcp.figma.com/mcp/html-to-design/capture.js`

Load that script into the page, then use the capture toolbar to copy the result
to the clipboard.

As of March 27, 2026, this public URL returns `HTTP 200`.

## Recommended Workflow

1. Open the target page in a desktop browser.
2. Wait for fonts, images, and lazy-loaded content to finish rendering.
3. Scroll to the exact section you want to capture.
4. Run the bookmarklet or injected script that loads `capture.js`.
5. In the toolbar, choose `Copy to clipboard`.
6. Switch to Figma and paste into a dedicated scratch frame or page.
7. If you only need part of the page, use `Select element` before copying.

## Safe Positioning

- Capture the smallest stable container that still includes the content you need.
- Paste into a scratch frame first, then move pieces into the final canvas.
- Keep one capture per page or frame so imported layers stay organized.
- Capture after scrolling into the intended viewport, not before.

## Example Bookmarklet

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://mcp.figma.com/mcp/html-to-design/capture.js';document.head.appendChild(s);setTimeout(function(){window.location.hash='figmacapture&figmadelay=1000';var s2=document.createElement('script');s2.src='https://mcp.figma.com/mcp/html-to-design/capture.js';document.head.appendChild(s2);},500);})();
```

## When To Prefer It

- Fast visual reverse-engineering from a live site into Figma.
- Pulling one viewport or one component into a scratch page for redesign.
- Capturing authenticated or in-progress UI that already renders correctly in the browser.

## When Not To Use It

- Sites with strict CSP that block injected scripts.
- Cases where you need semantic code, reusable tokens, or a live sync instead of a one-time capture.
- Mobile-browser workflows, since `javascript:` bookmarklets are commonly blocked there.

## Caveats

- Strict CSP sites can block external scripts, which prevents the toolbar from appearing.
- Mobile browsers usually block `javascript:` bookmarklets.
- Auth-gated pages capture what your current browser session can see.
- Lazy-loaded content must be visible before capture.
- The result is editable layers, but it is still a DOM capture, not live code.
- Only run the bookmarklet on pages you trust, because it injects remote JavaScript into the page.
- This is a public Figma-hosted script, but it is still an implementation detail and could change without notice.
