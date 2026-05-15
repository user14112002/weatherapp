const searchInput = document.querySelector('#search-input');
const locationLabel = document.querySelector('#location-label');
const hourlyGrid = document.querySelector('#hourly-grid');

// simple in-memory cache for last fetched coordinates
const weatherCache = {};

function createStatusBanner() {
    const existing = document.querySelector('#weather-status-banner');
    if (existing) return existing;

    const banner = document.createElement('div');
    banner.id = 'weather-status-banner';
    banner.className = 'fixed bottom-6 right-6 z-50 rounded-full bg-oxidized-gold/95 text-on-tertiary-container px-5 py-3 text-sm shadow-lg';
    banner.style.transition = 'opacity 0.2s ease';
    banner.style.opacity = '0';
    document.body.appendChild(banner);
    requestAnimationFrame(() => {
        banner.style.opacity = '1';
    });
    return banner;
}

function showStatus(message, isError = false) {
    const banner = createStatusBanner();
    banner.textContent = message;
    banner.style.backgroundColor = isError ? 'rgba(186, 26, 26, 0.95)' : 'rgba(197, 160, 89, 0.95)';
    clearTimeout(window.weatherBannerTimeout);
    window.weatherBannerTimeout = setTimeout(() => {
        banner.style.opacity = '0';
    }, 3500);
}

async function lookupLocation(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Geocoding request failed');
    }
    const data = await response.json();
    if (!data.results || !data.results.length) {
        return null;
    }
    return data.results[0];
}

async function handleSearch(query) {
    try {
        showStatus(`Searching for ${query}...`);
        const result = await lookupLocation(query);
        if (!result) {
            showStatus(`No weather location found for “${query}”.`, true);
            return;
        }
        showStatus(`Found ${result.name}, ${result.country}. Fetching weather…`);
        console.log('Geocoding result:', result);
        if (locationLabel) {
            locationLabel.textContent = `${result.name}, ${result.country}`;
        }
        // Use cached response when available for same lat/lon
        const cacheKey = `${result.latitude},${result.longitude},${result.timezone}`;
        if (weatherCache[cacheKey]) {
            renderWeather(weatherCache[cacheKey], result.timezone);
            showStatus('Weather updated (cached).');
            return;
        }
        try {
            const weather = await fetchWeather(result.latitude, result.longitude, result.timezone);
            weatherCache[cacheKey] = weather;
            renderWeather(weather, result.timezone);
            showStatus('Weather updated.');
        } catch (err) {
            console.error(err);
            showStatus('Unable to fetch weather data. Try again later.', true);
        }
    } catch (error) {
        console.error(error);
        showStatus('Unable to fetch location data. Try again later.', true);
    }
}

async function fetchWeather(lat, lon, timezone = 'UTC') {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=${encodeURIComponent(timezone)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Weather API request failed');
    const data = await resp.json();
    return data;
}

function formatHourLabel(isoString, timezone) {
    try {
        const dt = new Date(isoString);
        return new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone}).format(dt);
    } catch (e) {
        return isoString;
    }
}

function renderWeather(apiResponse, timezone = 'UTC') {
    if (!hourlyGrid || !apiResponse || !apiResponse.hourly) return;
    const times = apiResponse.hourly.time || [];
    const temps = apiResponse.hourly.temperature_2m || [];
    const winds = apiResponse.hourly.wind_speed_10m || [];
    const hums = apiResponse.hourly.relative_humidity_2m || [];

    // clear existing grid
    hourlyGrid.innerHTML = '';

    // show the next 8 hours (or fewer if not available)
    const count = Math.min(8, times.length);
    for (let i = 0; i < count; i++) {
        const timeLabel = formatHourLabel(times[i], timezone);
        const temp = temps[i] !== undefined ? Math.round(temps[i]) + '°' : '—';
        const wind = winds[i] !== undefined ? Math.round(winds[i]) + ' km/h' : '—';
        const icon = 'wb_sunny';

        const card = document.createElement('div');
        card.className = 'relative bg-parchment-cream p-6 border border-aged-gold/20 ornamental-bracket flex flex-col items-center group hover:border-aged-gold transition-colors';

        const spanTime = document.createElement('span');
        spanTime.className = 'font-label-caps text-label-caps text-on-surface-variant mb-4';
        spanTime.textContent = timeLabel;

        const spanIcon = document.createElement('span');
        spanIcon.className = 'material-symbols-outlined text-aged-gold text-4xl mb-4';
        spanIcon.textContent = icon;

        const spanTemp = document.createElement('span');
        spanTemp.className = 'font-data-display text-4xl text-primary mb-2';
        spanTemp.textContent = temp;

        const windWrap = document.createElement('div');
        windWrap.className = 'flex items-center gap-1 text-on-surface-variant';
        const windIcon = document.createElement('span');
        windIcon.className = 'material-symbols-outlined text-xs';
        windIcon.textContent = 'air';
        const windText = document.createElement('span');
        windText.className = 'font-label-caps text-[10px]';
        windText.textContent = wind;

        windWrap.appendChild(windIcon);
        windWrap.appendChild(windText);

        card.appendChild(spanTime);
        card.appendChild(spanIcon);
        card.appendChild(spanTemp);
        card.appendChild(windWrap);

        hourlyGrid.appendChild(card);
    }
}

if (searchInput) {
    searchInput.addEventListener('keydown', async (event) => {
        if (event.key !== 'Enter') return;
        const query = searchInput.value.trim();
        if (!query) {
            showStatus('Enter a location to continue.', true);
            return;
        }
        await handleSearch(query);
    });
}
