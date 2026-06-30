// MV3 service worker. Kept intentionally minimal; tab/window-level monitoring
// (cross-tab focus, blocked navigation) can be expanded here. Declared loosely so
// the package builds without the full @types/chrome dependency.
declare const chrome: { runtime?: { onInstalled?: { addListener(cb: () => void): void } } };

chrome.runtime?.onInstalled?.addListener(() => {
  // Installed. No-op for now.
});
