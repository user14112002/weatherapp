# Acanthus Weather

A simple Tailwind-based weather dashboard scaffold.

## What was initialized

- `index.html`:
  - added `id="search-input"` to the location search field
  - fixed the closing HTML tag
  - loaded `script.js` with `defer`
- `script.js`:
  - attaches a search handler to the input
  - performs a geocoding lookup using the Open-Meteo geocoding API
  - shows lightweight status messages in the browser
- `.gitignore`:
  - ignores macOS system files

## How to use

1. Open `index.html` in your browser.
2. Type a location in the search box.
3. Press Enter to trigger a geocoding lookup.

## Next steps

- add weather data rendering for current conditions and forecast
- add a dedicated CSS file or convert the static cards into dynamic templates
- wire an OpenWeatherMap or Open-Meteo forecast API for real values
