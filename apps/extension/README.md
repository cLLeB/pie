# @pie/extension (MV3 browser extension)

The optional **stronger-tier** signal source. A sandboxed exam page can't see a
second monitor or other windows; this extension can, and relays those signals to
the page via `window.postMessage` using the shared protocol in `@pie/integrity-core`
(`buildMessage` / `parseMessage`). The page validates each message (origin + source
tag) before recording it, so a malicious site can't spoof signals.

Signals today: `extension.connected`, `screen.multi_monitor`, `window.focus`,
`window.blur`. The candidate app records these into the integrity ledger; the fusion
engine already understands multi-monitor.

## Build & load

```bash
npm run build -w @pie/extension      # outputs dist/ (content.js, background.js, manifest.json)
```

Then in Chrome/Edge: `chrome://extensions` → enable Developer mode → **Load unpacked**
→ select `apps/extension/dist`. Open the candidate app; the page will record
`extension.connected` and any multi-monitor signal.

## Security

Least-privilege manifest. The protocol is validated on the page side; the content
script only posts to the page's own origin. Any high-privilege extension is attack
surface (cf. the 2021 Proctorio UXSS) — keep permissions minimal and review changes.
