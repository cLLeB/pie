import { collectScreenSignals, buildMessage } from '@pie/integrity-core';

// Content script: runs in the exam page's tab and relays signals the sandboxed
// page can't see on its own. It only posts to the page's own origin.
const origin = window.location.origin;

function post(message: object): void {
  window.postMessage(message, origin);
}

function reportScreens(): void {
  const screen = window.screen as Screen & { isExtended?: boolean };
  for (const m of collectScreenSignals({ isExtended: screen.isExtended })) post(m);
}

// Announce the extension so the page can record that the stronger tier is active.
post(buildMessage('extension.connected'));
reportScreens();

// Re-check displays when the window environment changes.
window.addEventListener('focus', () => post(buildMessage('window.focus')));
window.addEventListener('blur', () => post(buildMessage('window.blur')));
window.matchMedia('(min-resolution: 1dppx)').addEventListener('change', reportScreens);
