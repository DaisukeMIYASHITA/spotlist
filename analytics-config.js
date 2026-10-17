// Public app-specific GA4 settings. Set the real measurement ID and verified production hosts.
window.APP_ANALYTICS_CONFIG = Object.freeze({
  "measurementId": "",
  "appName": "Spotlist",
  "productionHosts": ["spotlist-lemon.vercel.app"],
  "pages": {
    "/": {
      "path": "/",
      "title": "Spotlist"
    },
    "/index.html": {
      "path": "/",
      "title": "Spotlist"
    }
  },
  "events": [
    "artists_extracted",
    "playlist_generated",
    "playlist_saved",
    "spotify_connected"
  ],
  "clickEvents": []
});
