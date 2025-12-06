const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');

let lastFormatted = '';

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
  initMap();
  updateOutput('');
});
