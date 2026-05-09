# Volumio RadioBrowser Plugin - Project Context

## Device
- **Device:** Volumio Riva+ (MP1)
- **Architecture:** ARM64 (aarch64)
- **OS:** Debian Buster
- **Volumio Version:** 3.0
- **Kernel:** 4.9.241
- **IP Address:** 192.168.84.41 (may change - check router if unreachable)
- **SSH:** `ssh volumio@192.168.84.41` (password: volumio)
- **SSH must be enabled at:** `http://volumio.local/dev`

## Plugin Details
- **Plugin Name:** radiobrowser
- **Category:** music_service
- **Pretty Name:** RadioBrowser
- **Data Source:** RadioBrowser API (https://de1.api.radio-browser.info/json)
- **Station Database:** 50,000+ internet radio stations

## Key File Locations
- **Development folder:** `/home/volumio/volumio-plugin-radiobrowser/`
- **Installed plugin folder:** `/data/plugins/music_service/radiobrowser/`
- **Plugin config:** `/data/plugins/music_service/radiobrowser/config.json`

## GitHub
- **Repo:** https://github.com/garycgill/volumio-plugin-radiobrowser
- **Branch:** main
- **Push requires:** Personal Access Token (not GitHub password)

## Development Workflow
1. Edit files in `/home/volumio/volumio-plugin-radiobrowser/`
2. Copy to installed location or run `volumio plugin refresh` from dev folder
3. Restart Volumio: `volumio vrestart`
4. Check logs: `journalctl -f | grep -i radio`
5. Sync changes back to dev folder before pushing to GitHub:
```bash
   cp /data/plugins/music_service/radiobrowser/index.js ~/volumio-plugin-radiobrowser/index.js
```
6. Push to GitHub:
```bash
   cd ~/volumio-plugin-radiobrowser
   git add -A
   git commit -m "your message"
   git push
```

## Known Issues & Quirks
- **npm modules** must be installed in BOTH locations:
  - `~/volumio-plugin-radiobrowser/` (dev)
  - `/data/plugins/music_service/radiobrowser/` (installed)
  - If plugin fails with `Cannot find module`, run `npm install kew node-fetch v-conf` in the installed folder
- **volumio plugin enable/disable** commands are not available in Volumio 3 CLI
  - Use the web UI instead: `http://volumio.local` → Settings → Plugins
- **SSH enable** must be toggled at `http://volumio.local/dev` after each factory reset
- **Python replacement** of code blocks can fail silently - always verify with `sed -n` after edits
- **trackType** currently shows partial URL instead of 'webradio' - known issue to fix

## Plugin Features (Current)
- Browse Top 100 stations by click count
- Browse stations by Country
- Browse stations by Genre/Tag
- Search stations by name
- Full MPD playback via stream URL
- Station metadata display (title, artist)

## Plugin Features (Planned)
- Fix trackType field
- Add proper SVG icon
- Improve UIConfig settings page
- Add favourite stations support
- Submit to Volumio plugin store

## API Reference
- Top 100: `GET /stations/topclick/100`
- By country: `GET /stations/bycountry/{country}`
- By tag: `GET /stations/bytag/{tag}`
- By name: `GET /stations/byname/{name}`
- Countries list: `GET /countries`
- Tags list: `GET /tags`

## Volumio Plugin Commands
```bash
volumio plugin refresh    # Copy dev files to installed location
volumio plugin package    # Create zip for distribution
volumio plugin install    # Install plugin locally
volumio vrestart          # Restart Volumio service
journalctl -f             # Live logs
```
