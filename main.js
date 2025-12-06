const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');

const CDN_LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CDN_DRAW = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';

let lastFormatted = '';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

function loadLeafletStack() {
  if (window.L && window.L.Draw) {
    return Promise.resolve();
  }

  return loadScript(CDN_LEAFLET)
    .then(() => loadScript(CDN_DRAW))
    .then(() => {
      if (!window.L || !window.L.Draw) {
        throw new Error('Leaflet no quedó disponible tras la carga.');
      }
    })
    .catch((error) => {
      updateOutput('No se pudo cargar el mapa. Verifica tu conexión.');
      throw error;
    });
}

function initMap() {
  if (!window.L) {
    updateOutput('No se pudo cargar el mapa. Verifica tu conexión.');
    return null;
  }

  const map = L.map('map', {
    zoomControl: false,
  }).setView([40.4168, -3.7038], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polyline: false,
      rectangle: false,
      circle: false,
      marker: false,
      circlemarker: false,
      polygon: {
        allowIntersection: false,
        showArea: true,
        drawError: {
          color: '#e11d48',
          message: 'Los vértices no pueden cruzarse.',
        },
        shapeOptions: {
          color: '#2563eb',
          weight: 3,
        },
      },
    },
    edit: {
      featureGroup: drawnItems,
      edit: false,
      remove: false,
    },
  });

  map.addControl(drawControl);

  const ensureSize = () => map.invalidateSize();
  setTimeout(ensureSize, 60);
  requestAnimationFrame(ensureSize);
  window.addEventListener('resize', ensureSize);

  map.on(L.Draw.Event.CREATED, ({ layer }) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);
    const formatted = formatQlikCoordinates(layer);
    updateOutput(formatted);
  });

  resetBtn.addEventListener('click', () => {
    drawnItems.clearLayers();
    updateOutput('');
  });

  return map;
}

function formatQlikCoordinates(layer) {
  const latLngs = layer.getLatLngs()[0] || [];
  if (!latLngs.length) return '';

  const withClosure = ensureClosedPolygon(latLngs);
  const coordinates = withClosure.map(({ lat, lng }) => [Number(lng.toFixed(10)), Number(lat.toFixed(10))]);

  const formatted = `=[[${coordinates.map(([lng, lat]) => `[${lng}, ${lat}]`).join(',\n   ')}]]`;
  return formatted;
}

function ensureClosedPolygon(points) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const isClosed = first.lat === last.lat && first.lng === last.lng;
  return isClosed ? points : [...points, first];
}

function updateOutput(text) {
  output.textContent = text || 'Dibuja un polígono para ver aquí las coordenadas.';
  lastFormatted = text;
  status.textContent = '';
}

copyBtn.addEventListener('click', async () => {
  if (!lastFormatted) return;
  try {
    await navigator.clipboard.writeText(lastFormatted);
    status.textContent = 'Copiado';
    status.style.color = '#16a34a';
  } catch (error) {
    status.textContent = 'No se pudo copiar';
    status.style.color = '#e11d48';
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadLeafletStack()
    .then(() => {
      initMap();
      updateOutput('');
    })
    .catch(() => {
      // El mensaje de error ya se muestra en updateOutput.
    });
});
