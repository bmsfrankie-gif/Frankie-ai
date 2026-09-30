# Frankie AI v1

A local-first Progressive Web App for prompt management and AI workflow launching.

## Included
- Prompt Vault with search, tags, folders, favorites
- Prompt Studio with `{{variables}}`
- Version history for edited prompts
- Toolbox prompt generators: Improve Prompt, Troubleshoot, Deep Research, Rewrite, SOP Builder, Second Opinion, Summarize, Explain
- Launchpad for ChatGPT, Claude, Gemini, Perplexity, and Grok
- JSON export/import backup
- Offline service worker
- Dark, light, and system themes
- No login, backend, subscription, or API key required

## Run locally
Serve the folder over HTTP. Example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Install on iPhone
1. Host the folder on any HTTPS static host (GitHub Pages, Cloudflare Pages, Netlify, etc.).
2. Open the HTTPS URL in Safari on iPhone.
3. Tap Share -> Add to Home Screen.
4. Enable "Open as Web App" if Safari offers it.

## Data
All prompts/settings are stored in the browser's localStorage. Use Settings -> Export Backup regularly if the data matters to you.
