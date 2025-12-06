const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');
const status = document.getElementById('copy-status');
const mapStatus = document.getElementById('map-status');

const map = L.map('map', { zoomControl: false }).setView([40.4168, -3.7038], 6);

const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
});

tiles
  .on('load', () => {
    mapStatus.textContent = 'Mapa cargado';
    mapStatus.style.color = '#16a34a';
  })
  .on('tileerror', () => {
    mapStatus.textContent = 'Error al cargar mapas';
    mapStatus.style.color = '#e11d48';
  })
  .addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  position: 'topright',
  draw: {
    polyline: false,
    rectangle: false,
    circle: false,
    circlemarker: false,
    marker: {
      repeatMode: true,
      title: 'Añadir punto',
    },
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
    remove: true,
  },
});

map.addControl(drawControl);
map.whenReady(() => map.invalidateSize());

map.on('click', ({ latlng }) => {
  const marker = L.marker(latlng, { title: 'Punto rápido' });
  drawnItems.addLayer(marker);
  updateOutput();
});

map.on(L.Draw.Event.CREATED, ({ layer }) => {
  drawnItems.addLayer(layer);
  updateOutput();
});

map.on(L.Draw.Event.DELETED, () => {
  updateOutput();
});

let lastFormatted = '';

function updateOutput() {
  const formatted = formatGeometries();
  output.textContent = formatted || 'Crea al menos un punto para ver sus coordenadas aquí.';
  lastFormatted = formatted;
  status.textContent = '';
}

function formatGeometries() {
  const geometries = [];
  drawnItems.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      geometries.push(formatMarker(layer));
    } else if (layer instanceof L.Polygon) {
      geometries.push(formatPolygon(layer));
    }
  });

  return geometries.join('\n\n');
}

function formatMarker(layer) {
  const { lat, lng } = layer.getLatLng();
  return `Punto: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`;
}

function formatPolygon(layer) {
  const latLngs = layer.getLatLngs()[0] || [];
  if (!latLngs.length) return '';

  const closed = ensureClosedPolygon(latLngs);
  const coordinates = closed.map(({ lat, lng }) => [Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  return `Polígono: [[${coordinates.map(([lng, lat]) => `[${lng}, ${lat}]`).join(', ')}]]`;
}

function ensureClosedPolygon(points) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const isClosed = first.lat === last.lat && first.lng === last.lng;
  return isClosed ? points : [...points, first];
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

resetBtn.addEventListener('click', () => {
  drawnItems.clearLayers();
  updateOutput();
});

updateOutput();
