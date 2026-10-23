# PsychToolkit
Sister site to SUDtoolkit.org for psych tools

## Checking the calculators

`npm install` once, then `npm test`. This opens the app in a hidden browser and
checks scale scoring, dose converters, the Widmark calculator, the lock screen,
the disclaimer and home search against known correct answers.

## Hosting on Cloudflare Pages

`npm run build` (or `node build.js`) copies only the website files into `dist/`.
Working files such as `scratch/` and `tests/` are left out, so they never go live.

Cloudflare Pages project settings:

| Setting | Value |
| --- | --- |
| Build command | `node build.js` |
| Build output directory | `dist` |
| Root directory | *(leave blank)* |

If you add a new file that the site needs, add it to the list at the top of
`build.js`. The build stops with a message if `index.html` or `sw.js` uses a
file that was not copied.

`_headers` adds basic security headers. `CNAME` and `_config.yml` are only used
by GitHub Pages and can be deleted once the site has moved.

### Template sync

Note templates sync between devices through `functions/api/templates.js`.
Cloudflare runs it automatically; it needs two settings in the Pages project:

1. **Storage:** create a KV namespace (Storage & Databases → KV), then in the
   Pages project go to Settings → Bindings → add a KV binding named `TEMPLATES`
   that points at it.
2. **Sync key:** Settings → Variables and Secrets → add a **secret** named
   `SYNC_TOKEN` with a long random value (a password manager can make one).

Redeploy, then on each device open Assessment Note Generators → Note Templates
→ Sync settings and enter the same key. Only templates are synced, never notes.
Until sync is set up, templates are still saved in each browser, and
Export/Import moves them between devices.

### Cloudflare Access (later)

To replace the passphrase screen with a real login, add the site as a
self-hosted application in Cloudflare Zero Trust → Access and allow your email
address. The sync key keeps working behind Access.
