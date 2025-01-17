function initializeMapSJVO() {
    // Inicializace mapy
    const map_sJVO = L.map('map_sJVO', {
        minZoom: 12,
        maxZoom: 15
    });

    // Definice základních vrstev
    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    const EsriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });

    const osmDefault = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Nastavení výchozí vrstvy
    cartoLight.addTo(map_sJVO);

    // Načtení GeoJSON dat
    const geojsonPath = 'silnice_sJVO.json';
    let currentlyHighlighted = null;
    fetch(geojsonPath)
        .then(response => response.json())
        .then(data => {

            // Třídění funkcí podle hodnoty 'vytizeni' (vzestupně)
            data.features.sort((a, b) => a.properties.vytizeni - b.properties.vytizeni);

            // Vytvoření GeoJSON vrstvy
            const geojsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: getColor(feature.properties.vytizeni),
                        weight: getWeight(feature.properties.vytizeni),
                        opacity: 0.8
                    };
                },
                onEachFeature: function (feature, layer) {
                    // Přidání vyskakovacího okna s hodnotou 'vytizeni'
                    layer.bindPopup("Vytíženost: " + feature.properties.vytizeni + " vozidel za den");

                    // Nastavení zvýraznění při kliknutí
                    layer.on('click', function () {
                        if (currentlyHighlighted) {
                            // Reset předchozího zvýraznění
                            currentlyHighlighted.setStyle({
                                color: getColor(currentlyHighlighted.feature.properties.vytizeni),
                                weight: getWeight(currentlyHighlighted.feature.properties.vytizeni),
                                opacity: 0.8
                            });
                        }

                        // Nastavení nového zvýraznění
                        currentlyHighlighted = layer;
                        layer.setStyle({
                            color: 'yellow',
                            weight: 8,
                            opacity: 1
                        });

                        // Po 2 vteřinách vrátí zvýrazněný úsek zpět na původní barvu
                        setTimeout(function () {
                            currentlyHighlighted.setStyle({
                                color: getColor(currentlyHighlighted.feature.properties.vytizeni),
                                weight: getWeight(currentlyHighlighted.feature.properties.vytizeni),
                                opacity: 0.8
                            });
                        }, 2000);
                    });
                }
            });

            // Přidání vrstvy na mapu
            geojsonLayer.addTo(map_sJVO);

            const bounds = geojsonLayer.getBounds();
            map_sJVO.fitBounds(bounds, { padding: [-100, -100] });

            // Definice přepínače vrstev až po načtení geojsonLayer
            const baseLayers = {
                "Carto Light": cartoLight,
                "Carto Dark": cartoDark,
                "ESRI World Imagery": EsriWorldImagery,
                "OpenStreetMap": osmDefault
            };

            const overlayLayers = {
                "Silnice": geojsonLayer
            };

            // Přidání ovládacího prvku pro vrstvy do mapy
            L.control.layers(baseLayers, overlayLayers, { position: 'topleft' }).addTo(map_sJVO);

        })
        .catch(err => console.error('Chyba při načítání GeoJSON:', err));

    // Pole s popisky: souřadnice a text
    const tooltipsData = [
        { lat: 49.6935, lng: 14.0367, text: "3. část" },
        { lat: 49.659, lng: 13.9844, text: "2. část" },
        { lat: 49.677, lng: 14.0335, text: "1. část" },
        { lat: 49.6689, lng: 13.980, text: "spojka" }
    ];

    // Přidání všech popisků na mapu
    tooltipsData.forEach(item => {
        L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'static-label'
        })
            .setLatLng([item.lat, item.lng])
            .setContent(item.text)
            .addTo(map_sJVO);
    });

    // Funkce pro přiřazení barvy linie podle vytíženosti
    function getColor(vytizeni) {
        vytizeni = parseFloat(vytizeni); // Ujistěte se, že vytizeni je číslo
        return vytizeni > 18000 ? 'rgb(100, 0, 0)' :
            vytizeni > 14001 ? 'rgb(140, 0, 0)' :
                vytizeni > 10001 ? 'rgb(180, 0, 0)' :
                    vytizeni > 6001 ? 'rgb(220, 0, 0)' :
                        vytizeni > 4001 ? 'rgb(255, 0, 0)' :
                            vytizeni > 2001 ? 'rgb(255, 0, 0)' :
                                vytizeni > 100 ? 'rgb(255, 127, 127)' :
                                    'rgb(255, 190, 190)';
    }

    // Funkce pro přiřazení tloušťky linie podle vytíženosti
    function getWeight(vytizeni) {
        vytizeni = parseFloat(vytizeni);
        return vytizeni > 18000 ? 6 :
            vytizeni > 14001 ? 5.5 :
                vytizeni > 10001 ? 5 :
                    vytizeni > 6001 ? 4.5 :
                        vytizeni > 4001 ? 4 :
                            vytizeni > 2001 ? 3.5 :
                                vytizeni > 100 ? 3 :
                                    2;
    }

    return map_sJVO; // Vrátí instanci mapy
}