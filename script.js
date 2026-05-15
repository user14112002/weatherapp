const searchInput = document.querySelector('#search-input');

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
        showStatus(`Found ${result.name}, ${result.country}. Ready for weather details.`);
        console.log('Geocoding result:', result);
    } catch (error) {
        console.error(error);
        showStatus('Unable to fetch location data. Try again later.', true);
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
