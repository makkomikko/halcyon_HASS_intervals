![Halcyon showing 10:38AM](screenshots/platforms/emery-am.png) ![Halcyon showing 10:38PM](screenshots/platforms/emery-pm.png)

# Halcyon
An analog-digital watchface featuring the solar day!

Halcyon represents the 24 hours of the day as a ring around the edges of your watch, highlighting the sunrise, sunset, and the position of the sun! (Inspired by the PebbleOS 3.9-era sleep visualization!)

### Features:

- Watch the hours of your day slip away as the sun moves through the 24-hour outer dial!
- Select from various different exciting color presets, with separate themes for nighttime and daytime!
- An absolutely unreasonable amount of color customization! Create, save, load, and share custom themes!
- Widgets! Up to 4 user-selectable widgets, including weather, heartrate, steps, and more!
- Custom widgets! Add a monogram or even create your own hybrid widgets featuring any available data!
- Works in your language (experimental)! Widgets are fully localized to 38 different languages! (Note: currently experimental; if you find an error in your language, please contact me!)

### Install it on your watch: 

- **Download it on the Pebble Store:**
  - https://apps.repebble.com/halcyon_67cb1c5fb7a02301b9a6e415
- **...or on the Rebble Store:**
  - https://apps.rebble.io/en_US/application/67cb1c5fb7a02301b9a6e415

### Intervals.icu setup (this fork)

This fork adds week running km and today's HRV via the `{icu_stats}` widget token. Configuration uses a two-step flow:

1. **Setup hub** (`config-static/index.html`) — enter your intervals.icu API key
2. **Full Halcyon settings** (`halcyon.freakified.net`) — themes, colors, and widgets

The API key stays on your phone only (PebbleKit JS `localStorage`). It is not sent to the watch.

#### Host the setup page (GitHub Pages, free)

1. Push this repo to GitHub (public)
2. GitHub → Settings → Pages → deploy from branch, folder `/config-static`
3. In [`src/pkjs/index.js`](src/pkjs/index.js), set:
   ```javascript
   var SETUP_CONFIG_URI = 'https://YOUR_USER.github.io/YOUR_REPO/config-static/index.html';
   ```
4. Rebuild and install the watchface

#### Local setup (same Wi‑Fi)

1. Run `python -m http.server 8080` in the `config-static/` folder
2. In [`src/pkjs/index.js`](src/pkjs/index.js):
   ```javascript
   var USE_LOCAL_SETUP = true;
   var SETUP_LOCAL_URI = 'http://YOUR_PC_IP:8080/index.html';
   ```
3. Rebuild and install the watchface

If `SETUP_CONFIG_URI` is not set, settings open the upstream Halcyon page directly (no intervals.icu API key field). You can still use `FALLBACK_INTERVALS_API_KEY` in `index.js` as a dev fallback.
