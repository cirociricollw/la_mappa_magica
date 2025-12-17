import './style.css'
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Inizializza la mappa
const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Crea la barra di ricerca
function createSearchBar() {
    // Crea il container per la barra di ricerca
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        width: 80%;
        max-width: 400px;
    `;

    // Crea l'input di ricerca
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Cerca un luogo (es: Roma, Colosseo, etc.)';
    searchInput.style.cssText = `
        width: 100%;
        padding: 10px 15px;
        border: 2px solid #0078A8;
        border-radius: 25px;
        box-shadow: 0 2px 5px rgba(79, 60, 159, 0.2);
        font-size: 16px;
        outline: none;
    `;

    // Crea il bottone di ricerca
    const searchButton = document.createElement('button');
    searchButton.innerHTML = 'Cerca';
    searchButton.style.cssText = `
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        padding: 8px 15px;
        background: #0078A8;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
    `;

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchButton);

    // Aggiungi al DOM
    document.body.appendChild(searchContainer);

    // Funzione di ricerca
    async function searchLocation(query) {
        if (!query.trim()) return;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                
                // Sposta la mappa alla posizione trovata
                map.setView([lat, lon], 15);
                
                // Aggiungi un marker
                L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup(`<strong>${result.display_name}</strong>`)
                    .openPopup();
            } else {
                alert('Luogo non trovato!');
            }
        } catch (error) {
            console.error('Errore nella ricerca:', error);
            alert('Errore durante la ricerca');
        }
    }

    // Event listeners
    searchButton.addEventListener('click', () => {
        searchLocation(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation(searchInput.value);
        }
    });
}

// Funzione per ottenere il nome del luogo (come nel tuo codice originale)
async function getLocationName(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        return data.display_name || 'Luogo non trovato';
    } catch (error) {
        return 'Errore nel recupero';
    }
}

async function onMapClick(e) {
    const locationName = await getLocationName(e.latlng.lat, e.latlng.lng);

    L.popup()
        .setLatLng(e.latlng)
        .setContent(`
            <div style="background-color: orange; padding: 10px; border-radius: 5px;">
                <strong>Lat:</strong> ${e.latlng.lat.toFixed(2)}<br>  
                <strong>Lon:</strong> ${e.latlng.lng.toFixed(2)}<br>
                <strong>Luogo:</strong> ${locationName}
            </div>
        `)
        .openOn(map);

    const authData = await pb.collection('_superusers').authWithPassword(
        'admin@admin.it',
        'admin12345',
    );

    const luogo = await getLocationName(e.latlng.lat, e.latlng.lng);
    const data = {
        "punto_scelto": {
            "lon": e.latlng.lng,
            "lat": e.latlng.lat
        },
        luogo
    };
    console.table(data);

    const record = await pb.collection('pick_mappa_test').create(data);
}

// Inizializza la barra di ricerca
createSearchBar();

// Evento click sulla mappa
map.on('click', onMapClick);